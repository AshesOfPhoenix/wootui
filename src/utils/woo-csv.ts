import fs from 'node:fs';
import path from 'node:path';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GoogleGenAI } from '@google/genai';
import { decode, encode, type JsonArray, type JsonObject, type JsonValue } from '@toon-format/toon';
import { generateText } from 'ai';
import Papa from 'papaparse';
import slugify from 'slugify';
import type { EstimateTokenAndPriceResult } from '../types/estimate-token-and-price-result.ts';
import { LanguageCode } from '../types/language-code';
import type { LanguageTranslationResult } from '../types/translation-result.ts';
import { WooCsvParseError } from '../types/woo-csv-parse-error.ts';
import type { WooCsvParseSummary } from '../types/woo-csv-parse-summary.ts';
import type { WpmlFixedColumns } from '../types/wpml-fixed-columns.ts';
import { WpmlImportColumns } from '../types/wpml-import-columns.ts';
import { AttibuteParser, type AttributeColMap, MetaParser } from './attibute_parser';
import { createWooProductSchema, type WooRow } from './dynamic_schema';
import { extractCode } from './extract-code';
import { estimateGeminiCost, GEMINI_PRICING } from './gemini-pricing';
import { geminiPrompt, geminiPromptAttributeNames, geminiSystemPrompt } from './prompts';
import {
    type AttributeName,
    localAttributeLabelsColumnKey,
    type ProductWithTranslationMeta,
} from './translate';
import { appConfig } from './config.ts';

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
        targetLanguage: LanguageCode
    ): Promise<EstimateTokenAndPriceResult> {
        const apiKey = appConfig.get('apiKey');
        const modelId = appConfig.get('modelId');
        const batchSize = appConfig.get('batchSize');
        if (!apiKey) {
            throw new Error('API key is required. Please configure the API key in Settings.');
        }
        if (!modelId) {
            throw new Error('Model ID is required. Please configure the model ID in Settings.');
        }
        if (!batchSize) {
            throw new Error('Batch size is required. Please configure the batch size in Settings.');
        }
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

        // here we estimate the price of the tokens using the gemini pricing library
        // we multiply the tokens by 2 for the completion tokens and 1.5 for the reasoning tokens based on average usage
        const estimatedPrice = estimateGeminiCost({
            model: modelId as keyof typeof GEMINI_PRICING,
            usage: {
                promptTokens: tokensBatches.reduce(
                    (acc, tokens) => acc + (tokens.totalTokens ?? 0),
                    0
                ),
                completionTokens: tokensBatches.reduce(
                    (acc, tokens) => acc + (tokens.totalTokens ?? 0) * 2,
                    0
                ),
                reasoningTokens: tokensBatches.reduce(
                    (acc, tokens) => acc + (tokens.totalTokens ?? 0) * 1.5,
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
            inputTokens: estimatedPrice.inputTokens,
            outputTokens: estimatedPrice.outputTokens,
            reasoningTokens: estimatedPrice.reasoningTokens,
            estimatedPrice: {
                total: estimatedPrice.totalCost,
                input: estimatedPrice.inputCost,
                output: estimatedPrice.outputCost,
                reasoning: estimatedPrice.reasoningCost,
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
        systemPrompt: string,
        prompt: string,
        priceInputModifier: number,
        priceOutputModifier: number
    ): Promise<{
        costBreakdown: {
            Type: string;
            Count: number;
            'Rate ($)': string;
            'Cost ($)': string;
        }[];
        translatedProducts: Record<string, string | undefined>[];
    }> {
        const apiKey = appConfig.get('apiKey');
        const modelId = appConfig.get('modelId');
        if (!apiKey) {
            throw new Error('API key is required. Please configure the API key in Settings.');
        }
        if (!modelId) {
            throw new Error('Model ID is required. Please configure the model ID in Settings.');
        }
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
        targetLanguages: LanguageCode
    ): Promise<AttributeName[]> {
        const apiKey = appConfig.get('apiKey');
        if (!apiKey) {
            throw new Error('API key is required. Please configure the API key in Settings.');
        }
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

    /**
     * Prepare token and price estimates for all target languages
     *
     * @param productsByLanguage - Map of language code to products to translate
     * @param targetLanguages - Array of target language codes
     * @param batchSize - Number of products per batch
     * @param apiKey - Gemini API key
     * @param modelId - Gemini model ID
     * @returns Map of language code to estimate result
     */
    public async prepareLanguageEstimates(
        productsByLanguage: Map<LanguageCode, Record<string, string | undefined>[]>,
        targetLanguages: LanguageCode[]
    ): Promise<Map<LanguageCode, EstimateTokenAndPriceResult>> {
        const estimatesByLanguage = new Map<LanguageCode, EstimateTokenAndPriceResult>();

        for (const language of targetLanguages) {
            const productsFlat = productsByLanguage.get(language) ?? [];
            const estimate = await this.estimatePriceAndPreparePromptsForLanguage(
                productsFlat,
                language
            );
            estimatesByLanguage.set(language, estimate);
        }

        return estimatesByLanguage;
    }

    /**
     * Validate translation configuration
     *
     * @param apiKey - Gemini API key
     * @param modelId - Gemini model ID
     * @returns Validated config with pricing modifiers
     * @throws Error if configuration is invalid
     */
    public validateTranslationConfig(): {
        priceInputModifier: number;
        priceOutputModifier: number;
    } {
        const apiKey = appConfig.get('apiKey');
        const modelId = appConfig.get('modelId');
        if (!apiKey) {
            throw new Error('API key is required. Please configure the API key in Settings.');
        }

        if (!modelId) {
            throw new Error('Model ID is required. Please configure the model ID in Settings.');
        }

        const modelPricing = GEMINI_PRICING[modelId as keyof typeof GEMINI_PRICING];
        if (!modelPricing) {
            throw new Error(`Invalid model: ${modelId}. Model not found in pricing configuration.`);
        }

        const priceInputModifier = modelPricing.base.input / 1_000_000;
        const priceOutputModifier = modelPricing.base.output / 1_000_000;

        return { priceInputModifier, priceOutputModifier };
    }

    /**
     * Translate all products for multiple languages
     *
     * @param params - Translation parameters
     * @param onProgress - Progress callback for each language
     * @returns Array of language translation results
     */
    public async translateAllLanguages(params: {
        languages: LanguageCode[];
        carryData: {
            parseSummary: WooCsvParseSummary;
            allUniqueAttributeNames: AttributeName[];
            estimatesByLanguage: Map<LanguageCode, EstimateTokenAndPriceResult>;
        };
        csvPath: string;
        outputDir: string;
        priceInputModifier: number;
        priceOutputModifier: number;
        onProgress?: (current: number, total: number, language: LanguageCode) => void;
    }): Promise<LanguageTranslationResult[]> {
        const {
            languages,
            carryData,
            csvPath,
            outputDir,
            priceInputModifier,
            priceOutputModifier,
            onProgress,
        } = params;

        const results: LanguageTranslationResult[] = [];

        for (let i = 0; i < languages.length; i++) {
            const language = languages[i];
            console.log(`Translating language: ${language}`);
            if (!language) continue;

            onProgress?.(i + 1, languages.length, language);

            const estimate = carryData.estimatesByLanguage.get(language);
            if (!estimate) {
                throw new Error(`No estimate found for language: ${language}`);
            }

            const translatedAttributeNames = await this.translateAttributeNames(
                carryData.allUniqueAttributeNames,
                language
            );

            const { costBreakdown, translatedProducts } = await this.translate(
                estimate.systemPrompt,
                estimate.prompt,
                priceInputModifier,
                priceOutputModifier
            );

            const finalRows = await this.postProcessTranslatedProducts(
                carryData.parseSummary.productSourceTranslations,
                translatedAttributeNames,
                translatedProducts,
                carryData.allUniqueAttributeNames,
                language
            );

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const inputBaseName = path.basename(csvPath, path.extname(csvPath));
            const outputFileName = `${inputBaseName}-${language}-${timestamp}.csv`;
            const outputPath = path.join(outputDir, outputFileName);

            const csv = Papa.unparse(finalRows);
            fs.writeFileSync(outputPath, csv, 'utf8');

            const inputTokens = costBreakdown.find(c => c.Type === 'Input tokens')?.Count ?? 0;
            const outputTokens = costBreakdown.find(c => c.Type === 'Output tokens')?.Count ?? 0;
            const reasoningTokens =
                costBreakdown.find(c => c.Type === 'Reasoning tokens')?.Count ?? 0;
            const languageCost = costBreakdown.reduce(
                (sum, item) => sum + parseFloat(item['Cost ($)']),
                0
            );

            results.push({
                language,
                outputPath,
                inputTokens,
                outputTokens,
                reasoningTokens,
                cost: languageCost,
            });
        }

        return results;
    }

    /**
     * Export source products CSV with WPML metadata
     *
     * @param sourceProducts - Source product translations
     * @param csvPath - Original CSV file path
     * @param outputDir - Output directory
     */
    public exportSourceProducts(
        sourceProducts: WooRow<WpmlFixedColumns>[],
        csvPath: string,
        outputDir: string
    ): void {
        const sourceProductsSubset = sourceProducts.map(row => ({
            ID: row.ID,
            Type: row.Type,
            [WpmlImportColumns.TranslationGroup]: row[WpmlImportColumns.TranslationGroup],
            [WpmlImportColumns.SourceLanguageCode]: row[WpmlImportColumns.ImportLanguageCode],
            [WpmlImportColumns.ImportLanguageCode]: row[WpmlImportColumns.SourceLanguageCode],
        }));

        const sourceProductsCsv = Papa.unparse(sourceProductsSubset);
        fs.writeFileSync(
            path.join(outputDir, `${path.basename(csvPath)}-source-products.csv`),
            sourceProductsCsv,
            'utf8'
        );
    }
}

export const wooCsvParser = new WooCsvParser();
