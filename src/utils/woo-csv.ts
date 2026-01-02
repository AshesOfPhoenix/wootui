import fs from 'node:fs';
import Papa from 'papaparse';
import { AttibuteParser, MetaParser, type AttributeColMap } from './attibute_parser';
import { createWooProductSchema, type WooRow } from './dynamic_schema';
import { LanguageCode } from '../types/language-code';
import { decode, encode, type JsonArray, type JsonObject, type JsonValue } from '@toon-format/toon';
import { GoogleGenAI } from '@google/genai';
import {
    localAttributeLabelsColumnKey,
    type AttributeName,
    type ProductWithTranslationMeta,
} from './translate';
import slugify from 'slugify';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { extractCode } from './extract-code';
import { geminiPrompt, geminiPromptAttributeNames, geminiSystemPrompt } from './prompts';
import { estimateGeminiCost, GEMINI_PRICING } from './gemini-pricing';

/**
 * WPML import column keys
 */
export interface EstimateTokenAndPriceResult {
    wordCount: number;
    tokenCount: number;
    estimatedPrice: {
        total: number;
        input: number;
        output: number;
        perWordTotal: number;
        perWordInput: number;
        perWordOutput: number;
    };
    encodedProducts: string;
    systemPrompt: string;
    prompt: string;
}

export enum WpmlImportColumns {
    SourceLanguageCode = 'Meta: _wpml_import_source_language_code',
    ImportLanguageCode = 'Meta: _wpml_import_language_code',
    TranslationGroup = 'Meta: _wpml_import_translation_group',
}

/**
 * WPML fixed columns for import/export
 */
export interface WpmlFixedColumns {
    [WpmlImportColumns.SourceLanguageCode]: LanguageCode;
    [WpmlImportColumns.ImportLanguageCode]: LanguageCode;
    [WpmlImportColumns.TranslationGroup]: string;
}

/**
 * Summary of parsed WooCommerce CSV
 */
export interface WooCsvParseSummary {
    /** The parsed headers (the headers of the CSV) */
    headers: string[];
    /** Column map for attributes by their index in the header (ex. { attributeNum: '1', valueIndex: 1, nameIndex: 2 }) */
    attributeColumnMap: AttributeColMap[];
    /** Source products translations (source product aka translation, from which we translate to the target languages) */
    productSourceTranslations: WooRow<WpmlFixedColumns>[];
    /** Already translated products (the products that are already translated to the target languages - mapped by "Meta: _wpml_import_translation_group" to the source product) */
    productExistingTranslations: WooRow<WpmlFixedColumns>[];
    /** The products grouped by language they are to be translated to (key: language, value: products) */
    productTranslationsPerLanguage: Map<LanguageCode, ProductWithTranslationMeta[]>;
}

/**
 * Error thrown when CSV parsing fails
 */
export class WooCsvParseError extends Error {
    constructor(
        message: string,
        public readonly code: 'FILE_NOT_FOUND' | 'INVALID_CSV' | 'VALIDATION_FAILED' | 'EMPTY_FILE'
    ) {
        super(message);
        this.name = 'WooCsvParseError';
    }
}

class WooCsvParser {
    /**
     * Parse a WooCommerce product export CSV file
     *
     * @param csvPath - Absolute path to the CSV file
     * @returns Summary of parsed products
     * @throws WooCsvParseError if parsing fails
     */
    public async parseWooProductsCsv(csvPath: string): Promise<WooCsvParseSummary> {
        if (!fs.existsSync(csvPath)) {
            throw new WooCsvParseError(`File not found: ${csvPath}`, 'FILE_NOT_FOUND');
        }

        let fileContent: string;
        try {
            fileContent = fs.readFileSync(csvPath, 'utf8');
        } catch (err) {
            throw new WooCsvParseError(
                `Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`,
                'FILE_NOT_FOUND'
            );
        }

        if (!fileContent.trim()) {
            throw new WooCsvParseError('CSV file is empty', 'EMPTY_FILE');
        }

        const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

        if (parsed.errors.length > 0) {
            const firstError = parsed.errors[0];
            throw new WooCsvParseError(
                `CSV parsing error: ${firstError?.message ?? 'Unknown error'}`,
                'INVALID_CSV'
            );
        }

        const headers = parsed.meta.fields;
        if (!headers || headers.length === 0) {
            throw new WooCsvParseError('No headers found in CSV', 'INVALID_CSV');
        }

        if (parsed.data.length === 0) {
            throw new WooCsvParseError('No data rows found in CSV', 'EMPTY_FILE');
        }

        const dynamicSchema = createWooProductSchema<WpmlFixedColumns>(headers);
        const validationResult = dynamicSchema.safeParse(parsed.data[0]);

        if (!validationResult.success) {
            throw new WooCsvParseError(
                `Schema validation failed: ${validationResult.error.message}`,
                'VALIDATION_FAILED'
            );
        }

        const attributeColumnMap = AttibuteParser.mapHeaders(headers);
        const allProducts = parsed.data as WooRow<WpmlFixedColumns>[];

        const productSourceTranslations = allProducts.filter(
            product =>
                (product[WpmlImportColumns.SourceLanguageCode] as string) === '' &&
                (product[WpmlImportColumns.ImportLanguageCode] as string) !== ''
        );

        const productExistingTranslations = allProducts.filter(
            product =>
                (product[WpmlImportColumns.SourceLanguageCode] as string) !== '' &&
                (product[WpmlImportColumns.ImportLanguageCode] as string) !== ''
        );

        // Here for each product we check in which languages it's already translated by checking the translated products array and based on the
        // target languages (the languages the user chose to translate to the new batch) we basically generate an array of two translate languages: which languages is the product missing
        const translationGroupMap: ProductWithTranslationMeta[] = productSourceTranslations.map(
            product => {
                const productsInTranslationGroup = productExistingTranslations.filter(
                    p =>
                        p[WpmlImportColumns.TranslationGroup] ===
                        product[WpmlImportColumns.TranslationGroup]
                );
                const alreadyTranslatedLanguages = productsInTranslationGroup
                    .map(p => p[WpmlImportColumns.ImportLanguageCode])
                    .filter(Boolean) as LanguageCode[];

                const toTranslateLanguages = Object.values(LanguageCode).filter(
                    (language: LanguageCode) => !alreadyTranslatedLanguages.includes(language)
                ) as LanguageCode[];

                return {
                    ...product,
                    alreadyTranslatedLanguages,
                    toTranslateLanguages,
                };
            }
        );

        // Here we group the products by the languages they are to be translated to.
        const productTranslationsPerLanguage = translationGroupMap.reduce(
            (
                acc: Map<LanguageCode, ProductWithTranslationMeta[]>,
                product: ProductWithTranslationMeta
            ) => {
                product.toTranslateLanguages.forEach((language: LanguageCode) => {
                    if (!acc.has(language)) {
                        acc.set(language, []);
                    }
                    const products = acc.get(language);
                    if (products && products.length > 0) {
                        products.push(product);
                    } else {
                        acc.set(language, [product]);
                    }
                });
                return acc;
            },
            new Map<LanguageCode, ProductWithTranslationMeta[]>()
        );

        return {
            headers, // the parsed headers (the headers of the CSV)
            attributeColumnMap, // column map for attributes by their index in the header (ex. { attributeNum: '1', valueIndex: 1, nameIndex: 2 })
            productSourceTranslations, // source product aka translation, from which we translate to the target languages
            productExistingTranslations, // the products that are already translated to the target languages - mapped by "Meta: _wpml_import_translation_group" to the source product
            productTranslationsPerLanguage, // the products grouped by language they are to be translated to (key: language, value: products)
        };
    }

    public async prepareProductsForTranslation(
        attributeColumnMap: AttributeColMap[],
        productTranslationsPerLanguage: Map<LanguageCode, ProductWithTranslationMeta[]>,
        productSourceTranslations: WooRow<WpmlFixedColumns>[],
        userChoosenStaticColumns: string[],
        userChoosenColumnsToTranslate: string[],
        targetLanguages: LanguageCode[],
        overrideLanguages: LanguageCode[]
    ): Promise<{
        productsByLanguage: Map<LanguageCode, Record<string, string | undefined>[]>;
        allUniqueAttributeNames: AttributeName[];
    }> {
        const allUniqueAttributeNames: AttributeName[] = [];

        // Build the effective products per language map based on target languages and overrides
        const effectiveProductsPerLanguage = new Map<LanguageCode, ProductWithTranslationMeta[]>();

        for (const language of targetLanguages) {
            if (overrideLanguages.includes(language)) {
                // Override enabled: include ALL source products for this language
                const allSourceProducts: ProductWithTranslationMeta[] =
                    productSourceTranslations.map(product => ({
                        ...product,
                        alreadyTranslatedLanguages: [],
                        toTranslateLanguages: [language],
                    }));
                effectiveProductsPerLanguage.set(language, allSourceProducts);
            } else {
                // No override: only include products that don't have translations yet
                const productsToTranslate = productTranslationsPerLanguage.get(language) ?? [];
                effectiveProductsPerLanguage.set(language, productsToTranslate);
            }
        }

        // here we further pre-process each product by extracting attributes. So columns that contain attributes follow the WooCommerce standard. Each attribute has four columns:
        // 1. name
        // 2. value
        // 3. visibility
        // 4. order  Here based on the column map we extract the key and value and the attribute number. We also slugify the name (aka key) of the attribute name which is the value of attribute name because we need to generate a dictionary of slug and translated names further along the script. We also extract all the meta data headers which are basically the optional headers from plugins. We assume only the optional headers are present because we presume that the user supports WPML. But there are others which are optional and chosen by the user. Currently this is just an array and we filter those. And extract the values in case. We also generate an attributes attributes key-value pairs that are passed to the product and all of that returned
        const preprocessedProducts: {
            language: LanguageCode;
            products: {
                translatable_static: { ID: string; [key: string]: string };
                translatable_attributes: { [key: string]: string };
                translatable_meta: { [key: string]: string };
            }[];
        }[] = Array.from(effectiveProductsPerLanguage.entries()).map(([language, products]) => {
            return {
                language,
                products: products.map((product: ProductWithTranslationMeta) => {
                    const attributesToTranslate = AttibuteParser.extractAttributes(
                        Object.values(product),
                        attributeColumnMap
                    );
                    attributesToTranslate.forEach(att => {
                        if (!allUniqueAttributeNames.find(a => a.name === att.key)) {
                            allUniqueAttributeNames.push({
                                name: att.key,
                                slug: slugify(att.key, { lower: true }),
                                translatedName: null,
                            });
                        }
                    });

                    const metaMap = MetaParser.mapHeaders(Object.keys(product));

                    const filterUnmappedMeta = metaMap.filter(mapping =>
                        userChoosenColumnsToTranslate.includes(mapping.metaKey)
                    );

                    const metaToTranslate = MetaParser.extractMeta(
                        Object.values(product),
                        filterUnmappedMeta
                    );

                    const attributesToTranslateDictionary = Object.entries(
                        attributesToTranslate
                    ).reduce(
                        (acc: Record<string, string>, [_, value]) => {
                            acc[`Attribute ${value.attributeNum}`] = value.value
                                ? `${value.key}: ${value.value}`
                                : '';
                            return acc;
                        },
                        {} as Record<string, string>
                    );

                    const staticToTranslate = Object.fromEntries(
                        userChoosenStaticColumns.map(column => [column, product[column]])
                    );

                    return {
                        translatable_static: {
                            ID: product.ID,
                            ...staticToTranslate,
                        },
                        translatable_attributes: { ...attributesToTranslateDictionary },
                        translatable_meta: metaToTranslate,
                    };
                }),
            };
        });

        // Build a map of language -> flattened products
        const productsByLanguage = new Map<LanguageCode, Record<string, string | undefined>[]>();
        for (const { language, products } of preprocessedProducts) {
            const flattenedProducts = products.map(p => ({
                ...p.translatable_static,
                ...p.translatable_attributes,
                ...p.translatable_meta,
            })) as Record<string, string | undefined>[];
            productsByLanguage.set(language, flattenedProducts);
        }

        return {
            productsByLanguage,
            allUniqueAttributeNames,
        };
    }

    public async estimatePriceAndPreparePromptsForLanguage(
        productsFlat: Record<string, string | undefined>[],
        batchSize: number,
        targetLanguage: LanguageCode,
        apiKey: string,
        modelId: string
    ): Promise<EstimateTokenAndPriceResult> {
        const client = new GoogleGenAI({
            apiKey,
        });

        // here we slice the products into batches of batchSize
        const productsBatches = productsFlat.reduce(
            (acc: Record<string, string | undefined>[][], product, index) => {
                const batchIndex = Math.floor(index / batchSize);
                if (!acc[batchIndex]) {
                    acc[batchIndex] = [];
                }
                acc[batchIndex].push(product);
                return acc;
            },
            []
        );

        // here we encode the products into a TOON format string.
        // we also replace the double quotes with single quotes and replace empty strings with "NULL" and replace backslashes with double backslashes.
        // The reason for NULL string is because the AI has problems when putting the same amount of columns if it's empty with commas.
        const encodedProductsBatches: string[] = productsBatches.map(batch => {
            return encode(batch ?? [], {
                delimiter: ',',
                replacer: (key: string, value: JsonValue) => {
                    // 1. Sanitize Strings (Single Quotes & Backslashes)
                    if (typeof value === 'string') {
                        value = value.replace(/"/g, "'"); // Swap double to single quotes
                        value = value.replace(/\\,/g, ','); // Remove literal backslashes
                    }

                    // 2. THE FIX: Unique Nulls
                    // If value is empty, inject the KEY (Column Name) into the placeholder
                    if (value === '' || value === null || value === undefined) {
                        // Returns "NULL_Attribute 5", "NULL_Attribute 6", "NULL_Meta..."
                        return `NULL_${key}`;
                    }

                    return value;
                },
            });
        });

        const systemPrompt = geminiSystemPrompt(targetLanguage);
        const prompts = encodedProductsBatches.map(batch => geminiPrompt(batch));

        const tokensBatches = await Promise.all(
            prompts.map(prompt =>
                client.models.countTokens({
                    model: modelId,
                    contents: systemPrompt + prompt,
                })
            )
        );

        const wordCountTotal = prompts.reduce((acc, prompt) => acc + prompt.split(' ').length, 0);

        const estimatedPrice = estimateGeminiCost({
            model: modelId as keyof typeof GEMINI_PRICING,
            usage: {
                promptTokens: tokensBatches.reduce(
                    (acc, tokens) => acc + (tokens.totalTokens ?? 0),
                    0
                ),
                completionTokens: tokensBatches.reduce(
                    (acc, tokens) => acc + (tokens.totalTokens ?? 0),
                    0
                ),
            },
        });

        console.table({
            'Estimated price total': estimatedPrice.totalCost,
            'Estimated price input': estimatedPrice.inputCost,
            'Estimated price output': estimatedPrice.outputCost,
        });

        return {
            wordCount: wordCountTotal,
            tokenCount: tokensBatches.reduce((acc, tokens) => acc + (tokens.totalTokens ?? 0), 0),
            estimatedPrice: {
                total: estimatedPrice.totalCost,
                input: estimatedPrice.inputCost,
                output: estimatedPrice.outputCost,
                perWordTotal: estimatedPrice.totalCost / wordCountTotal,
                perWordInput: estimatedPrice.inputCost / wordCountTotal,
                perWordOutput: estimatedPrice.outputCost / wordCountTotal,
            },

            encodedProducts: encodedProductsBatches[0] ?? '',
            systemPrompt,
            prompt: prompts[0] ?? '',
        };
    }

    public async translate(
        modelId: string,
        systemPrompt: string,
        prompt: string,
        priceInputModifier: number,
        priceOutputModifier: number,
        apiKey: string
    ): Promise<{
        costBreakdown: {
            Type: string;
            Count: number;
            'Rate ($)': string;
            'Cost ($)': string;
        }[];
        translatedProducts: Record<string, string | undefined>[];
    }> {
        const google = createGoogleGenerativeAI({ apiKey });
        const result = await generateText({
            model: google(modelId),
            system: systemPrompt,
            prompt: prompt,
            temperature: 0.0,
            maxRetries: 2,
        });

        const translationCostInput = (result.totalUsage?.inputTokens ?? 0) * priceInputModifier;
        const translationCostOutput = (result.totalUsage?.outputTokens ?? 0) * priceOutputModifier;
        const translationCostReasoning =
            (result.totalUsage.outputTokenDetails?.reasoningTokens ?? 0) * priceOutputModifier;
        const translationCostTotal =
            translationCostInput + translationCostOutput + translationCostReasoning;

        //pretty print costs
        console.log(`\n💰 Translation Cost Breakdown:`);
        const costBreakdown = [
            {
                Type: 'Input tokens',
                Count: result.totalUsage?.inputTokens ?? 0,
                'Rate ($)': priceInputModifier.toFixed(6),
                'Cost ($)': ((result.totalUsage?.inputTokens ?? 0) * priceInputModifier).toFixed(4),
            },
            {
                Type: 'Output tokens',
                Count: result.totalUsage?.outputTokens ?? 0,
                'Rate ($)': priceOutputModifier.toFixed(6),
                'Cost ($)': ((result.totalUsage?.outputTokens ?? 0) * priceOutputModifier).toFixed(
                    4
                ),
            },
        ];

        if (result.totalUsage.outputTokenDetails?.reasoningTokens) {
            costBreakdown.push({
                Type: 'Reasoning tokens',
                Count: result.totalUsage.outputTokenDetails?.reasoningTokens ?? 0,
                'Rate ($)': priceOutputModifier.toFixed(6),
                'Cost ($)': (
                    (result.totalUsage.outputTokenDetails?.reasoningTokens ?? 0) *
                    priceOutputModifier
                ).toFixed(4),
            });
        }

        console.table(costBreakdown);
        console.log(`   Total cost: $${translationCostTotal.toFixed(4)}`);

        let cleanedToon = extractCode(result.text);

        // here we clean the toon string by replacing NULL with empty string as before encoding we replaced empty strings with NULL.
        cleanedToon = cleanedToon.replace(/"NULL_.*?"/g, '');
        // here we decode the toon string into a JSON array of products.
        let translatedProductsArray: JsonArray = [];
        try {
            const data = decode(cleanedToon, { strict: true });
            translatedProductsArray = data as JsonArray;
        } catch (error) {
            console.error('Validation failed:', (error as Error).message);
        }

        // here we fix the attributes by extracting the attribute number and creating a new key name for the attribute value.
        translatedProductsArray = translatedProductsArray.map((product: JsonValue) => {
            const newProduct: JsonObject = {};
            Object.keys(product as Record<string, string>).forEach((key: string) => {
                if (key.includes('Attribute')) {
                    // Extract the number and create new key name
                    const attributeNum = key.split('Attribute ')[1];
                    const attributeName = (product as Record<string, string>)[key] ?? '';

                    // since its "Name: Value", we need to extract the value
                    const colonIndex = attributeName.indexOf(': ');
                    const value =
                        colonIndex !== -1 ? attributeName.slice(colonIndex + 2) : attributeName;
                    newProduct[`Attribute ${attributeNum} value(s)`] = value;
                } else {
                    // Keep other keys as-is
                    newProduct[key] = (product as Record<string, string>)[key] ?? '';
                }
            });
            return newProduct;
        });

        return {
            costBreakdown,
            translatedProducts: translatedProductsArray as Record<string, string | undefined>[],
        };
    }

    public async translateAttributeNames(
        allUniqueAttributeNames: AttributeName[],
        targetLanguages: LanguageCode,
        apiKey: string
    ): Promise<AttributeName[]> {
        console.log(`Translating ${allUniqueAttributeNames.length} attribute names...`);

        const prompt = geminiPromptAttributeNames(targetLanguages, allUniqueAttributeNames);

        const google = createGoogleGenerativeAI({ apiKey });
        const result = await generateText({
            model: google('gemini-2.5-flash'),
            prompt: prompt,
            temperature: 0.0,
            maxRetries: 2,
        });

        const translatedAttributeNames = JSON.parse(extractCode(result.text));

        return translatedAttributeNames as AttributeName[];
    }

    public async postProcessTranslatedProducts(
        sourceProducts: WooRow<WpmlFixedColumns>[],
        translatedAttributeNames: AttributeName[],
        translatedProductsArray: Record<string, string | undefined>[],
        allUniqueAttributeNames: AttributeName[],
        targetLanguages: LanguageCode
    ) {
        // generate localAttributeLabelsColumn, which is a json object, with sluggified
        // non value null Attribute name as key, and a proper translated value of said Attribute name
        // example: { "color": "Barva", "size": "Velikost" }
        const localAttributeLabelsColumn = translatedAttributeNames.reduce(
            (acc: Record<string, string>, a: AttributeName) => {
                acc[a.slug] = a.translatedName ?? '';
                return acc;
            },
            {} as Record<string, string>
        );

        // here we prep the products for re-insertion by adding the local attribute labels column, the language code column, the source language code column and the categories column.

        // we only need to preserve:
        // - user choosen static columns (besides the necessary ones like ID), columns with all empty values are excluded
        // - user choosen attribute columns
        // - user choosen meta columns (besides the necessary ones like WMPL)
        // - all other columns are excluded
        const preppededForReinsertion = translatedProductsArray.map(product => {
            // here we find the original product source by the ID.
            const originalProductSource = sourceProducts.find(p => p.ID === product.ID);

            // extract attributes from originalProductSource
            const attributes = AttibuteParser.extractAttributeLabels(
                originalProductSource as Record<string, string>
            );

            const productAttrSlugs = allUniqueAttributeNames.reduce(
                (acc: Record<string, string>, a: AttributeName) => {
                    if (Object.values(attributes).find(attribute => attribute === a.name)) {
                        const slugTranslatedValue = localAttributeLabelsColumn[a.slug];
                        if (slugTranslatedValue) {
                            acc[a.slug] = slugTranslatedValue;
                        }
                    }
                    return acc;
                },
                {} as Record<string, string>
            );

            return {
                ...originalProductSource,
                ...product,
                [localAttributeLabelsColumnKey]: JSON.stringify(productAttrSlugs),
                [WpmlImportColumns.ImportLanguageCode]: targetLanguages,
                [WpmlImportColumns.SourceLanguageCode]:
                    originalProductSource?.[WpmlImportColumns.ImportLanguageCode] ?? '',
                [WpmlImportColumns.TranslationGroup]:
                    originalProductSource?.[WpmlImportColumns.TranslationGroup] ??
                    originalProductSource?.SKU,
                Categories: '',
                ID: '',
                Brands: '',
                Published: '',
                // "Meta: _wpml_import_after_process_post_status": 'public'
            };
        });

        return preppededForReinsertion;
    }
}

export const wooCsvParser = new WooCsvParser();
