import console from 'node:console';
import fs from 'node:fs';
import path from 'node:path';
import { google } from '@ai-sdk/google';
import { decode, encode, type JsonArray, type JsonObject, type JsonValue } from '@toon-format/toon';
import { generateText } from 'ai';
import Papa from 'papaparse';
import slugify from 'slugify';
import { AttibuteParser, type AttributeColMap, MetaParser } from './attibute_parser';

// dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { GoogleGenAI } from '@google/genai';
import { createWooProductSchema, type WooRow } from './dynamic_schema';
import { LanguageCode } from '../types/language-code';
import { languageMap } from './language-map';
import { extractCode } from './extract-code';

const client = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const modelId = 'gemini-2.5-pro';

const fileName = 'Veriacija - ORIGINAL';
const batchSize = 5;
const targetLanguages = LanguageCode.German;

// These are the static columns from WooCommerce that the user choose to translate
export const userChoosenStaticColumns = ['Name', 'Short description', 'Description', 'Tags'];

export enum WpmlImportColumns {
    SourceLanguageCode = 'Meta: _wpml_import_source_language_code',
    ImportLanguageCode = 'Meta: _wpml_import_language_code',
    TranslationGroup = 'Meta: _wpml_import_translation_group',
}

// given that the user is using WPML, we need to know the source language code, the target language code, and the translation group.
export interface WMPLFixedColumns {
    [WpmlImportColumns.SourceLanguageCode]: LanguageCode;
    [WpmlImportColumns.ImportLanguageCode]: LanguageCode;
    [WpmlImportColumns.TranslationGroup]: string;
}

export type ProductWithTranslationMeta = WooRow<WMPLFixedColumns> & {
    alreadyTranslatedLanguages: LanguageCode[];
    toTranslateLanguages: LanguageCode[];
};

// given that the user is using WPML, we need to generate a translation map for attribute names ex. {'color': 'Color', 'size': 'Size'}
export const localAttributeLabelsColumnKey = 'Meta: _wpml_import_wc_local_attribute_labels';

// mocks an array of column names that the user has chosen to translate
// besides the standard static and attribute columns, the user can also choose to translate meta columns.
const userChoosenColumnsToTranslate: string[] = [
    'Meta: rank_math_description',
    'Meta: rank_math_focus_keyword',
    'Meta: _yoast_wpseo_focuskw',
    'Meta: _yoast_wpseo_metadesc',
];

export type AttributeName = {
    name: string;
    slug: string;
    translatedName: string | null;
};

const allUniqueAttributeNames: AttributeName[] = [];

export function prepareProducts() {
    const file = readFromCsv(fileName);

    const parsed = Papa.parse(file, { header: true, skipEmptyLines: true });

    if (!parsed.meta.fields) return { sourceProducts: [], translatedProducts: [] };

    // validate woocommerce schema
    //! TODO: Implement woocommerce schema validation
    const dynamicSchema = createWooProductSchema<WMPLFixedColumns>(parsed.meta.fields);

    const result = dynamicSchema.safeParse(parsed.data[0]);
    if (!result.success) {
        console.error('Validation failed:', result.error);
        process.exit(1);
    }

    console.log('Validation successful');
    const columnMap = AttibuteParser.mapHeaders(parsed.meta.fields);

    if (!parsed.data.length) {
        process.exit(1);
    }

    const allProducts = parsed.data as WooRow<WMPLFixedColumns>[];

    console.log(`${allProducts.length} rows of products found`);

    // These are the source products that contain the original product with original translation (usually English) and we get them here.
    const sourceProducts = allProducts.filter(
        product =>
            (product[WpmlImportColumns.SourceLanguageCode] as string) === '' &&
            (product[WpmlImportColumns.ImportLanguageCode] as string) !== ''
    );
    console.log(`${sourceProducts.length} source products found`);
    console.log('--------------------------------');

    // These are all the translations discounting the original source products that are already made for the source products.
    const alreadyTranslatedProducts = allProducts.filter(
        product =>
            (product[WpmlImportColumns.SourceLanguageCode] as string) !== '' &&
            (product[WpmlImportColumns.ImportLanguageCode] as string) !== ''
    );
    console.log(`${alreadyTranslatedProducts.length} translated products found`);
    console.log('--------------------------------');

    return { sourceProducts, alreadyTranslatedProducts, columnMap };
}

export async function prepareProductsForTranslation(
    sourceProducts: WooRow<WMPLFixedColumns>[],
    translatedProducts: WooRow<WMPLFixedColumns>[],
    columnMap: AttributeColMap[]
) {
    if (!columnMap) {
        console.error('Column map not found');
        return [];
    }

    // Here for each product we check in which languages it's already translated by checking the translated products array and based on the
    // target languages (the languages the user chose to translate to the new batch) we basically generate an array of two translate languages: which languages is the product missing
    const translationGroupMap: ProductWithTranslationMeta[] = sourceProducts.map(product => {
        const productsInTranslationGroup = translatedProducts.filter(
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
    });

    // Here we group the products by the languages they are to be translated to.
    const perLanguageMap = translationGroupMap.reduce(
        (
            acc: Map<LanguageCode, ProductWithTranslationMeta[]>,
            product: ProductWithTranslationMeta
        ) => {
            product.toTranslateLanguages.forEach((language: LanguageCode) => {
                if (!acc.has(language)) {
                    acc.set(language, []);
                }
                acc.get(language)!.push(product);
            });
            return acc;
        },
        new Map<LanguageCode, ProductWithTranslationMeta[]>()
    );

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
    }[] = Array.from(perLanguageMap.entries()).map(([language, products]) => {
        return {
            language,
            products: products.map((product: ProductWithTranslationMeta) => {
                const attributesToTranslate = AttibuteParser.extractAttributes(
                    Object.values(product),
                    columnMap
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
    //console.log(JSON.stringify(preprocessedProducts[0], null, 2));
    console.log('--------------------------------');

    // here we flatten the products into a single array of products.
    return (preprocessedProducts[0]?.products.map(p => ({
        ...p.translatable_static,
        ...p.translatable_attributes,
        ...p.translatable_meta,
    })) ?? []) as Record<string, string | undefined>[];
}

export async function translate(
    productsFlat: Record<string, string | undefined>[],
    targetLanguages: LanguageCode
): Promise<WooRow<WMPLFixedColumns>[]> {
    if (productsFlat.length === 0) {
        console.error('No products to translate');
        return [];
    }

    // here we encode the products into a TOON format string.
    // we also replace the double quotes with single quotes and replace empty strings with "NULL" and replace backslashes with double backslashes.
    // The reason for NULL string is because the AI has problems when putting the same amount of columns if it's empty with commas.
    const encodedProducts = encode(productsFlat?.slice(0, batchSize) ?? [], {
        delimiter: ',',
        replacer: (key, value: JsonValue) => {
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

    writeToToon(encodedProducts, `${fileName}-${targetLanguages}-encoded`);

    if (encodedProducts.length === 0) {
        console.error('No products to translate');
        return [];
    }

    console.log(`Encoded products length: ${encodedProducts.length}`);
    const wordCount = encodedProducts.split(' ').length;
    console.log(`Word count: ${wordCount}`);

    const tokens = await client.models.countTokens({
        model: 'gemini-3-flash-preview',
        contents: encodedProducts,
    });

    // 	Paid Tier, per 1M tokens in USD
    // Gemini 3 Flash Preview
    // Input
    // 	$0.5
    // Output
    // 	$3.0

    console.log(`Tokens: ${tokens.totalTokens}, Cache: ${tokens.cachedContentTokenCount}`);
    const priceInputModifier = 0.5;
    const priceOutputModifier = 3.0;

    const estimatedPriceInput = (priceInputModifier * (tokens?.totalTokens ?? 0)) / 1_000_000;
    const estimatedPriceOutput = (priceOutputModifier * (tokens?.totalTokens ?? 0)) / 1_000_000;
    const estimatedPriceTotal = estimatedPriceInput + estimatedPriceOutput;

    // Pricing per word
    const estimatedPricePerWordInput = (estimatedPriceInput * 100) / wordCount;
    const pricePerWordOutput = (estimatedPriceOutput * 100) / wordCount;
    const estimatedPricePerWordTotal =
        estimatedPricePerWordInput + (estimatedPriceOutput * 100) / wordCount;

    console.table({
        'Estimated price total': estimatedPriceTotal,
        'Estimated price input': estimatedPriceInput,
        'Estimated price output': estimatedPriceOutput,
        'Estimated price per word total': estimatedPricePerWordTotal,
        'Estimated price per word input': estimatedPricePerWordInput,
        'Estimated price per word output': pricePerWordOutput,
    });

    // now that we have the columns to translate, we need to generate a string to pass into the gemini prompt

    const geminiSystemPrompt = `You are a strict Data Translation Engine for WooCommerce Products.
Target language: ${languageMap[targetLanguages]}

### CRITICAL FORMATTING RULES (VIOLATION = FAILURE)
You are generating data for TOON format for a parser that uses **Comma Delimiters** and **Backslash Escaping**.
This rules should be followed strictly throughout the entire output, violation will result in failure.

1. **ROW SEPARATION (CRITICAL)**:
   - Rows are separated by **NEWLINES ONLY** (\n).
   - **NEVER** put a comma at the start of a new line.
   - **NEVER** put a comma at the end of the last column (unless that column is empty).
   - **INCORRECT**:
     "Row 1"
     ,"Row 2"
   - **CORRECT**:
     "Row 1"
     "Row 2"

2. **COLUMN INTEGRITY VIA UNIQUE PLACEHOLDERS**:
   - The input uses **UNIQUE placeholders** for empty columns (e.g., "NULL_Attribute 5", "NULL_Attribute 6").
   - **RULE**: You MUST output these placeholders **EXACTLY** as they appear.
   - **DO NOT** change "NULL_Attribute 5" to just "NULL".
   - **DO NOT** skip any placeholder.
   - **DO NOT** translate the placeholders.
   - *Example Input*:  ...,"Val","NULL_Attribute 5","NULL_Attribute 6",...
   - *Example Output*: ...,"Val","NULL_Attribute 5","NULL_Attribute 6",...

3. **QUOTING & ESCAPING**:
   - **Wrap EVERYTHING**: Every single value (including NULL placeholders) must be wrapped in double quotes (").
   - **Internal Escaping**: Escape double quotes inside text as ".
   - **No Comma Escaping**: Do NOT escape commas.

4. **LITERAL BACKSLASHES**:
   - The source text may contain backslashes (e.g., "Value, 1").
   - To preserve a backslash, you MUST escape it with another backslash **CRITICAL**.
   - INCORRECT: "Value, 1"  (This causes a syntax error)
   - CORRECT:   "Value\\, 1" (This outputs "Value, 1")

5. **HTML HANDLING**:
   - Do not break HTML tags.
   - If an HTML attribute uses double quotes, you MUST escape them.
   - Use single quotes (') for HTML attributes that do not require escaping.
     - Example: Change <div class="red"> to <div class='red'>

6. **HANDLING "NULL" (Empty Columns)**:
   - Context: The input uses the string "NULL" to mark empty columns.
   - CRITICAL RULE: If an input value is "NULL", the output MUST be "NULL".
   - Prohibition: Do NOT translate "NULL" (e.g., do not write "NIČ"). Do NOT replace it with an empty string.
   - Why: This guarantees the row has the correct number of columns.

### PRESERVATION RULES
  - **Brands**: Keep exact ("Super Rush", "Blue Boy", "Fist", "Lockerroom", "PWD", "Funline").
  - **Technical**: Keep IDs, URLs, and units (ml, cm, kg) unchanged.

### COLUMN-SPECIFIC TRANSLATION RULES
- **Name**:
    - **If product is "Poppers"**:
      - preserve the main brand name
      - translate the rest of the name
      - Example: "Super Rush Original Poppers 24ml or 25ml" -> "Super Rush Original Poppers 24ml ali 25ml"
    - **If the product is NOT "Poppers"**:
      - translate the full name to its local target language
      - Example: "SKYN Condoms Large Latex-Free (Feel Everything) - 3 pack" -> "SKYN kondomi Large Brez Lateksa (Občutite vse) - 3 kos"
- **Tags**:
    - translate the tags to the local target language
    - if containts product name or brand, follow the rules for the name and brand translation
    - the rest of the descriptive tags should be translated
    - Example: "Strong, Fresh" -> "Močno, Sveže"
    - Example: "blue boy poppers, blue boy poppers 10ml, blue boy poppers aroma, blue poppers, small poppers" -> "blue boy poppers, blue boy poppers 10ml, blue boy poppers aroma, modri poppers, majhni poppers"
- **Attributes**: Translate the attribute values.
    - "Official name" is a special case
      - preserve the brand name
      - REMOVE the word "Poppers" if present.
      - translate the rest of the name
      - This is the property that gets printed on the receipt.
      - Example: "Official Name: 1x Super Rush Original Leather Cleaner 24ml (or 25ml)" -> "Uradno ime: 1x Super Rush Original Čistilo za Usnje 24ml (ali 25ml)"

### ONE-SHOT EXAMPLE
Input:
\`\`\`toon
[1]{ID,Name,Description,Tags,Extra,Attribute 1,Attribute 2}:
  "101","Super Rush Original Poppers 24ml or 25ml","<p>Strong "aroma" for <span class="bold">men</span>.</p>","Strong, Fresh","Manufacturer - Volume - Formula: PWD® - 24ml - Amyl Nitrite, Funline® - 25ml - Amyl Nitrite","Official Name: 1x Super Rush Original Leather Cleaner 24ml (or 25ml)",
\`\`\`

Output:
\`\`\`toon
[1]{ID,Name,Description,Tags,Extra,Attribute 1,Attribute 2}:
  "101","Super Rush Original Poppers 24ml ali 25ml","<p>Močna "aroma" za <span class='bold'>moške</span>.</p>","Močno, Sveže","Proizvajalec - Volumen - Formula: PWD® - 24ml - Amil Nitrit, Funline® - 25ml - Amil Nitrit","Uradno ime: 1x Super Rush Original Čistilo za Usnje 24ml (ali 25ml)",
\`\`\`

### ONE-SHOT EXAMPLE WITH NULLS
Input:
\`\`\`toon
[2]{ID,Name,Attr1,Attr2,Attr3,Meta}:
  "101","Rush","24ml","NULL_Attr2","NULL_Attr3","NULL_Meta"
  "102","Blue","10ml","Strong","NULL_Attr3","KeyW"
\`\`\`

Output:
\`\`\`toon
[2]{ID,Name,Attr1,Attr2,Attr3,Meta}:
  "101","Rush","24ml","NULL_Attr2","NULL_Attr3","NULL_Meta"
  "102","Blue","10ml","Močno","NULL_Attr3","KeyW"
\`\`\`
*Note: No commas at the start of lines. No commas between rows.*

Products are in TOON format.
Return translation in the specified TOON format only.
Output only the code block.`;

    const geminiPrompt = `
\`\`\`toon
${encodedProducts}
\`\`\`
`;

    fs.writeFileSync(
        path.join(__dirname, 'output', `${fileName}-${targetLanguages}-prompt.md`),
        geminiPrompt,
        'utf8'
    );

    console.log('Starting translation with Gemini...');

    const proceed = await doYouWishToProceed(
        `Do you wish to proceed and translate ${productsFlat?.length ?? 0} products? `,
        `\n✅ Proceeding with processing...`,
        `❌ Processing cancelled by user.`
    );

    if (!proceed) {
        return [];
    }

    const result = await generateText({
        model: google(modelId),
        system: geminiSystemPrompt,
        prompt: geminiPrompt,
        temperature: 0.0,
        maxRetries: 2,
    });

    console.log('Translation completed!');
    console.log('Full result object:', JSON.stringify(result, null, 2));

    // Translation cost
    const translationCost =
        (result.totalUsage?.inputTokens ?? 0) * estimatedPriceInput +
        ((result.totalUsage?.outputTokens ?? 0) + (result.totalUsage?.reasoningTokens ?? 0)) *
            priceOutputModifier;
    //pretty print costs
    console.log(`\n💰 Translation Cost Breakdown:`);
    const costBreakdown = [
        {
            Type: 'Input tokens',
            Count: result.totalUsage?.inputTokens ?? 0,
            'Rate ($)': estimatedPriceInput.toFixed(6),
            'Cost ($)': ((result.totalUsage?.inputTokens ?? 0) * estimatedPriceInput).toFixed(4),
        },
        {
            Type: 'Output tokens',
            Count: result.totalUsage?.outputTokens ?? 0,
            'Rate ($)': (estimatedPriceInput * priceOutputModifier).toFixed(6),
            'Cost ($)': (
                (result.totalUsage?.outputTokens ?? 0) *
                estimatedPriceInput *
                priceOutputModifier
            ).toFixed(4),
        },
    ];

    if (result.totalUsage?.reasoningTokens) {
        costBreakdown.push({
            Type: 'Reasoning tokens',
            Count: result.totalUsage.reasoningTokens,
            'Rate ($)': (estimatedPriceInput * priceOutputModifier).toFixed(6),
            'Cost ($)': (
                result.totalUsage.reasoningTokens *
                estimatedPriceInput *
                priceOutputModifier
            ).toFixed(4),
        });
    }

    console.table(costBreakdown);
    console.log(`   Total cost: $${translationCost.toFixed(4)}`);

    let cleanedToon = extractCode(result.text);
    writeToToon(cleanedToon, `${fileName}-${targetLanguages}-translated`);

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

    // save json
    writeToJson(translatedProductsArray, `${fileName}-${targetLanguages}-translated`);

    return translatedProductsArray as WooRow<WMPLFixedColumns>[];
}

// Here we translate all the unique attribute names into their target language
export async function translateAttributeNames() {
    console.log(`Translating ${allUniqueAttributeNames.length} attribute names...`);

    const prompt = `
  You will be given a JSON array of WooCommerce product attributes and your job is to translate the "name" value to the "translatedName" value. So translate that and return the same exact JSON back only with the translated names.

  Example:
  {
    "name": "Color",
    "slug": "color",
    "translatedName": null
  }

  This should be translated to:

  {
    "name": "Color",
    "slug": "color",
    "translatedName": "Barva"
  }

  Target language: ${targetLanguages}

  Here is the JSON array of attributes to translate:
  ${JSON.stringify(allUniqueAttributeNames, null, 2)}

  Return the translated JSON array only.
  `;

    const result = await generateText({
        model: google('gemini-2.5-flash'),
        prompt: prompt,
        temperature: 0.0,
        maxRetries: 2,
    });

    const translatedAttributeNames = JSON.parse(extractCode(result.text));

    writeToJson(
        translatedAttributeNames,
        `${fileName}-${targetLanguages}-translated-attribute-names`
    );

    return translatedAttributeNames as AttributeName[];
}

export function postProcessTranslatedProducts(
    sourceProducts: WooRow<WMPLFixedColumns>[],
    translatedAttributeNames: AttributeName[],
    translatedProductsArray: WooRow<WMPLFixedColumns>[]
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

// main
async function main() {
    try {
        const { sourceProducts, alreadyTranslatedProducts, columnMap } = prepareProducts();
        if (!columnMap) {
            console.error('Column map not found');
            process.exit(1);
        }
        console.log('=== Preparing products for translation ===');
        const productsFlat = await prepareProductsForTranslation(
            sourceProducts,
            alreadyTranslatedProducts,
            columnMap
        );
        console.log('=== Starting translation process ===');
        const translatedProductsArray = await translate(productsFlat, targetLanguages);
        const translatedAttributeNames = await translateAttributeNames();
        // const translatedAttributeNames = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', `${fileName}-${targetLanguages}-translated-attribute-names`), 'utf8'));
        const postProcessedTranslatedProducts = postProcessTranslatedProducts(
            sourceProducts,
            translatedAttributeNames,
            translatedProductsArray
        );
        console.log('\n=== Translation Result ===');
        console.log(postProcessedTranslatedProducts);
        console.log('=== Process completed successfully ===');
        // save to csv
        const csv = Papa.unparse(postProcessedTranslatedProducts);
        writeToCsv(postProcessedTranslatedProducts, `${fileName}-${targetLanguages}-translated`);
    } catch (error) {
        console.error('\n=== Error occurred ===');
        console.error(error);
        process.exit(1);
    }
}

export async function doYouWishToProceed(
    message: string,
    acceptedMessage: string,
    declinedMessage: string
): Promise<boolean> {
    const readline = await import('node:readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const proceed = await new Promise<boolean>(resolve => {
        rl.question(
            `\n❓ ${message ? message : 'Do you wish to proceed with processing?'} (y/N): `,
            answer => {
                rl.close();
                resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            }
        );
    });

    if (!proceed) {
        console.log(declinedMessage);
        return false;
    }

    console.log(acceptedMessage);

    return proceed;
}

export function readFromJson(fileName: string) {
    return fs.readFileSync(path.join(__dirname, 'output', `${fileName}.json`), 'utf8');
}

export function writeToJson(data: any, fileName: string) {
    fs.writeFileSync(
        path.join(__dirname, 'output', `${fileName}.json`),
        JSON.stringify(data, null, 2)
    );
}

export function readFromCsv(fileName: string) {
    return fs.readFileSync(path.join(__dirname, 'data', `${fileName}.csv`), 'utf8');
}

export function writeToCsv(data: any, fileName: string) {
    const csv = Papa.unparse(data);
    fs.writeFileSync(path.join(__dirname, 'output', `${fileName}.csv`), csv);
}

export function writeToToon(data: any, fileName: string) {
    const toon = encode(data);
    fs.writeFileSync(path.join(__dirname, 'output', `${fileName}.toon`), toon);
}
