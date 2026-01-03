import fs from 'node:fs';
import path from 'node:path';
import { TextAttributes } from '@opentui/core';
import { Wizard } from '../components/wizard';
import type { WizardStepDefinition } from '../components/wizard';
import { Form } from '../components/form';
import { ActionPanel, Action } from '../components/action-panel';
import { Footer } from '../components/footer';
import { Toggle } from '../components/toggle';
import { TranslationMatrix } from '../components/translation-matrix';
import { languageMap } from '../utils/language-map';
import {
    wooCsvParser,
    WpmlImportColumns,
    type EstimateTokenAndPriceResult,
    type WooCsvParseSummary,
} from '../utils/woo-csv';
import { LanguageCode } from '../types/language-code';
import type { ConfigSchema } from '../types/config';
import type Conf from 'conf';
import { Spinner } from '../utils/spinner';
import { toast } from '@opentui-ui/toast';
import type { AttributeName } from '../utils/translate';
import Papa from 'papaparse';

export interface MainScreenProps {
    onNavigateToSettings: () => void;
    config: Conf<ConfigSchema>;
}

const LabelValue = ({
    label,
    value,
    color = '#ffffff',
}: {
    label: string;
    value: string | number;
    color?: string;
}) => (
    <box flexDirection="column" marginRight={2}>
        <text attributes={TextAttributes.DIM}>{label}</text>
        <text fg={color} attributes={TextAttributes.BOLD}>
            {String(value)}
        </text>
    </box>
);

const DEFAULT_SEO_META = [
    'Meta: rank_math_description',
    'Meta: rank_math_focus_keyword',
    'Meta: _yoast_wpseo_focuskw',
    'Meta: _yoast_wpseo_metadesc',
];

const WPML_INTERNAL_COLUMNS: readonly string[] = [
    WpmlImportColumns.SourceLanguageCode,
    WpmlImportColumns.ImportLanguageCode,
    WpmlImportColumns.TranslationGroup,
];

const FIXED_COLUMNS = ['Name', 'Short description', 'Description', 'Tags'];

interface TranslateWizardValues {
    csvPath: string;
    selectedMetaColumns: string[];
    targetLanguages: LanguageCode[];
    overrideLanguages: LanguageCode[];
}

interface Step2Result {
    parseSummary: WooCsvParseSummary;
}

interface CarryData {
    parseSummary: WooCsvParseSummary;
    productsByLanguage: Map<LanguageCode, Record<string, string | undefined>[]>;
    allUniqueAttributeNames: AttributeName[];
    estimatesByLanguage: Map<LanguageCode, EstimateTokenAndPriceResult>;
}

export interface MainScreenProps {
    onNavigateToSettings: () => void;
    config: Conf<ConfigSchema>;
}

export function MainScreen({ onNavigateToSettings, config }: MainScreenProps) {
    const steps: WizardStepDefinition<TranslateWizardValues>[] = [
        {
            id: 'csv-path',
            title: 'WooCommerce CSV',
            render: ctx => (
                <input
                    placeholder="/path/to/woocommerce-export.csv"
                    value={ctx.values.csvPath}
                    focused={ctx.isFocused && !ctx.isLocked}
                    onInput={(val: string) => ctx.setValue('csvPath', val)}
                    onChange={(val: string) => ctx.setValue('csvPath', val)}
                    onPaste={(event: { text: string }) => {
                        ctx.setValue('csvPath', ctx.values.csvPath + event.text);
                    }}
                    textColor="#ffffff"
                    backgroundColor="transparent"
                    focusedBackgroundColor="transparent"
                    focusedTextColor="#ffffff"
                />
            ),
            onSubmit: async (values, ctx) => {
                if (!values.csvPath) {
                    throw new Error('CSV path is required');
                }

                const summary = await wooCsvParser.parseWooProductsCsv(values.csvPath);

                const metaHeaders = summary.headers.filter(h => h.startsWith('Meta:'));

                const defaultSelection = [
                    ...metaHeaders.filter(h => DEFAULT_SEO_META.includes(h)), // Select only specific SEO meta
                ];

                ctx.setValue('selectedMetaColumns', defaultSelection);

                return summary;
            },
        },
        {
            id: 'columns-selection',
            title: 'Select Columns',
            render: (ctx, recenterScrollbox) => {
                const prevState = ctx.previousStepState;
                const summary = prevState?.data as WooCsvParseSummary | undefined;

                if (prevState?.status === 'running') {
                    return (
                        <Spinner color="#3b82f6" label="Parsing and analyzing CSV structure..." />
                    );
                }

                if (prevState?.status === 'error') {
                    return (
                        <box
                            flexDirection="row"
                            borderColor="#ef4444"
                            borderStyle="rounded"
                            padding={1}
                        >
                            <text fg="#ef4444" attributes={TextAttributes.BOLD}>
                                ❌ Error:{' '}
                            </text>
                            <text attributes={TextAttributes.DIM}>
                                {String(prevState.error ?? '')}
                            </text>
                        </box>
                    );
                }

                if (prevState?.status === 'success' && summary) {
                    const sourceLangCode = summary.productSourceTranslations[0]?.[
                        WpmlImportColumns.ImportLanguageCode
                    ] as string;
                    const sourceLangName =
                        languageMap[sourceLangCode as LanguageCode] || sourceLangCode || 'Unknown';

                    // Filter Meta: Exclude WPML internals
                    const availableMeta = summary.headers.filter(
                        h => h.startsWith('Meta:') && !WPML_INTERNAL_COLUMNS.includes(h)
                    );
                    const uniqueAttributes = Array.from(
                        new Set(summary.attributeColumnMap.map(a => `Attribute ${a.attributeNum}`))
                    );

                    const sortedMeta = availableMeta.sort((a, b) => {
                        if (DEFAULT_SEO_META.includes(a)) return -1;
                        if (DEFAULT_SEO_META.includes(b)) return -1;
                        return 1;
                    });

                    return (
                        <box flexDirection="column">
                            <box
                                flexDirection="row"
                                marginBottom={1}
                                justifyContent="space-between"
                                width={60}
                            >
                                <LabelValue
                                    label="Source Lang"
                                    value={sourceLangName}
                                    color="#22c55e"
                                />
                                <LabelValue
                                    label="Products"
                                    value={summary.productSourceTranslations.length}
                                />
                                <LabelValue
                                    label="Translations"
                                    value={summary.productExistingTranslations.length}
                                    color="#fbbf24"
                                />
                            </box>

                            <box
                                flexDirection="row"
                                border={['top']}
                                borderColor="#aaaaaa"
                                borderStyle="single"
                            ></box>

                            <box flexDirection="column" marginTop={1} marginBottom={1}>
                                <text attributes={TextAttributes.BOLD}>
                                    Fixed Columns (Always Included):
                                </text>
                                <text attributes={TextAttributes.DIM} fg="#aaaaaa">
                                    {FIXED_COLUMNS.join(', ')}
                                </text>
                            </box>

                            <box flexDirection="column" marginBottom={1}>
                                <text attributes={TextAttributes.BOLD}>
                                    {`Attributes Found (${uniqueAttributes.length}):`}
                                </text>
                                <text attributes={TextAttributes.DIM} fg="#aaaaaa">
                                    {uniqueAttributes.length > 0
                                        ? uniqueAttributes.join(', ')
                                        : 'No attributes found'}
                                </text>
                            </box>

                            {ctx.isFocused && (
                                <>
                                    <Form.Dropdown
                                        title=""
                                        values={ctx.values.selectedMetaColumns}
                                        onChange={vals => {
                                            ctx.setValue('selectedMetaColumns', vals as string[]);
                                            recenterScrollbox?.();
                                        }}
                                        maxVisibleItems={10}
                                        isFocused={!ctx.isLocked}
                                    >
                                        <Form.Dropdown.Section title="Metadata (Default: SEO Only)">
                                            {sortedMeta.map(meta => (
                                                <Form.Dropdown.Item
                                                    key={meta}
                                                    value={meta}
                                                    title={meta.replace('Meta: ', '')} // Clean display name
                                                />
                                            ))}
                                        </Form.Dropdown.Section>
                                    </Form.Dropdown>
                                    <box flexDirection="row" marginTop={1} columnGap={1}>
                                        <text attributes={TextAttributes.DIM}>↑ up</text>
                                        <text attributes={TextAttributes.DIM}>↓ down</text>
                                        <text attributes={TextAttributes.DIM}>↵ select</text>
                                    </box>
                                </>
                            )}
                        </box>
                    );
                }

                return <Spinner color="#3b82f6" label="Waiting for CSV to be parsed..." />;
            },
            onSubmit: async (_values, ctx) => {
                const parseSummary = ctx.previousStepState?.data as WooCsvParseSummary | undefined;
                if (!parseSummary) throw new Error('CSV file not parsed');
                return { parseSummary };
            },
        },
        {
            id: 'target-languages',
            title: 'Target Languages',
            render: (ctx, recenterScrollbox) => {
                const prevState = ctx.previousStepState;
                const step2Data = prevState?.data as Step2Result | undefined;
                const parseSummary = step2Data?.parseSummary;

                if (prevState?.status === 'running') {
                    return <Spinner color="#3b82f6" label="Preparing products..." />;
                }

                if (prevState?.status === 'error') {
                    return (
                        <box flexDirection="row">
                            <text fg="#ef4444" attributes={TextAttributes.BOLD}>
                                ❌ Error:{' '}
                            </text>
                            <text attributes={TextAttributes.DIM}>
                                {String(prevState.error ?? '')}
                            </text>
                        </box>
                    );
                }

                const handleToggleOverride = (lang: LanguageCode, enabled: boolean) => {
                    const current = ctx.values.overrideLanguages;
                    const newOverrides = enabled
                        ? [...current, lang]
                        : current.filter(l => l !== lang);
                    ctx.setValue('overrideLanguages', newOverrides);
                };

                if (prevState?.status === 'success' && parseSummary) {
                    return (
                        <box flexDirection="column">
                            <text attributes={TextAttributes.DIM}>
                                Select target languages and configure overrides.
                            </text>
                            <text key="spacer"> </text>

                            {ctx.isFocused && (
                                <>
                                    <Form.Dropdown
                                        title=""
                                        values={ctx.values.targetLanguages}
                                        onChange={vals => {
                                            ctx.setValue('targetLanguages', vals as LanguageCode[]);
                                            recenterScrollbox?.();
                                        }}
                                        maxVisibleItems={8}
                                        isFocused={ctx.isFocused && !ctx.isLocked}
                                    >
                                        <Form.Dropdown.Section title="Available Languages">
                                            {Object.entries(languageMap).map(([code, name]) => (
                                                <Form.Dropdown.Item
                                                    key={code}
                                                    value={code}
                                                    title={name}
                                                />
                                            ))}
                                        </Form.Dropdown.Section>
                                    </Form.Dropdown>
                                    <box flexDirection="row" marginTop={1} columnGap={1}>
                                        <text attributes={TextAttributes.DIM}>↑ up</text>
                                        <text attributes={TextAttributes.DIM}>↓ down</text>
                                        <text attributes={TextAttributes.DIM}>↵ select</text>
                                    </box>
                                </>
                            )}

                            {ctx.values.targetLanguages.length > 0 && (
                                <box flexDirection="column" marginTop={1}>
                                    <text attributes={TextAttributes.BOLD} fg="#c9a227">
                                        Override Existing Translations
                                    </text>
                                    <text attributes={TextAttributes.DIM} fg="#666666">
                                        Enable to re-translate products that already have
                                        translations.
                                    </text>
                                    <box flexDirection="column" marginTop={1}>
                                        {ctx.values.targetLanguages.map(lang => (
                                            <Toggle
                                                key={lang}
                                                label={languageMap[lang] ?? lang}
                                                value={ctx.values.overrideLanguages.includes(lang)}
                                                onChange={val => handleToggleOverride(lang, val)}
                                                isFocused={false}
                                            />
                                        ))}
                                    </box>
                                </box>
                            )}

                            <TranslationMatrix
                                parseSummary={parseSummary}
                                targetLanguages={ctx.values.targetLanguages}
                                overrideLanguages={ctx.values.overrideLanguages}
                            />
                        </box>
                    );
                }
                return <Spinner color="#3b82f6" label="Preparing products..." />;
            },
            onSubmit: async (values, context) => {
                if (values.targetLanguages.length === 0) {
                    toast.error('No target languages selected', {
                        description: 'Please select at least one target language',
                    });
                    throw new Error('No target languages selected');
                }
                const step2Data = context.previousStepState?.data as Step2Result | undefined;
                if (!step2Data?.parseSummary) {
                    toast.error('CSV file not parsed', {
                        description: 'Please parse the CSV file first',
                    });
                    throw new Error('CSV file not parsed');
                }

                const { parseSummary } = step2Data;

                const { productsByLanguage, allUniqueAttributeNames } =
                    await wooCsvParser.prepareProductsForTranslation(
                        parseSummary.attributeColumnMap,
                        parseSummary.productTranslationsPerLanguage,
                        parseSummary.productSourceTranslations,
                        FIXED_COLUMNS,
                        values.selectedMetaColumns,
                        values.targetLanguages,
                        values.overrideLanguages
                    );

                const batchSize = config.get('batchSize') || 10;
                const apiKey = config.get('apiKey');

                if (!apiKey) {
                    toast.error('API key is required', {
                        description: 'Please configure the API key in Settings',
                    });
                    throw new Error('API key is required');
                }

                const modelId = config.get('modelId');
                if (!modelId) {
                    toast.error('Model ID is required', {
                        description: 'Please configure the model ID in Settings',
                    });
                    throw new Error('Model ID is required');
                }

                const estimatesByLanguage = new Map<LanguageCode, EstimateTokenAndPriceResult>();
                for (const language of values.targetLanguages) {
                    const productsFlat = productsByLanguage.get(language) ?? [];
                    const estimate = await wooCsvParser.estimatePriceAndPreparePromptsForLanguage(
                        productsFlat,
                        batchSize,
                        language,
                        apiKey,
                        modelId
                    );
                    estimatesByLanguage.set(language, estimate);
                }

                const carryData: CarryData = {
                    parseSummary,
                    productsByLanguage,
                    allUniqueAttributeNames,
                    estimatesByLanguage,
                };

                return carryData;
            },
        },
        {
            id: 'token-and-price',
            title: 'Token and Price',
            render: ctx => {
                const prevState = ctx.previousStepState;
                const carryData = prevState?.data as CarryData | undefined;

                if (prevState?.status === 'running') {
                    return <Spinner color="#3b82f6" label="Estimating token and price..." />;
                }

                if (prevState?.status === 'error') {
                    return (
                        <box flexDirection="row">
                            <text fg="#ef4444" attributes={TextAttributes.BOLD}>
                                ❌ Error:{' '}
                            </text>
                            <text attributes={TextAttributes.DIM}>
                                {String(prevState.error ?? '')}
                            </text>
                        </box>
                    );
                }

                if (prevState?.status === 'success' && carryData) {
                    let totalTokens = 0;
                    let totalPrice = 0;

                    const languageEntries = Array.from(carryData.estimatesByLanguage.entries());
                    for (const [, estimate] of languageEntries) {
                        totalTokens += estimate.tokenCount;
                        totalPrice += estimate.estimatedPrice.total;
                    }

                    return (
                        <box flexDirection="column">
                            <text attributes={TextAttributes.BOLD}>Per-Language Estimates:</text>
                            <box flexDirection="column" marginTop={1} marginBottom={1}>
                                {languageEntries.map(([lang, estimate]) => (
                                    <box key={lang} flexDirection="row" columnGap={2}>
                                        <text fg="#c9a227" attributes={TextAttributes.BOLD}>
                                            {languageMap[lang] ?? lang}
                                        </text>
                                        <text attributes={TextAttributes.DIM}>
                                            {estimate.tokenCount.toLocaleString()} tokens
                                        </text>
                                        <text fg="#22c55e">
                                            ${estimate.estimatedPrice.total.toFixed(4)}
                                        </text>
                                    </box>
                                ))}
                            </box>

                            <box
                                flexDirection="row"
                                border={['top']}
                                borderColor="#aaaaaa"
                                borderStyle="single"
                            />

                            <box flexDirection="row" marginTop={1} columnGap={2}>
                                <LabelValue
                                    label="Total Tokens"
                                    value={totalTokens.toLocaleString()}
                                />
                                <LabelValue
                                    label="Total Est. Cost"
                                    value={`$${totalPrice.toFixed(4)}`}
                                    color="#22c55e"
                                />
                            </box>

                            <text attributes={TextAttributes.DIM} fg="#666666">
                                Press Ctrl+Enter to proceed with translation.
                            </text>
                        </box>
                    );
                }

                return (
                    <Spinner
                        color="#3b82f6"
                        label="Waiting for token and price to be estimated..."
                    />
                );
            },
            onSubmit: async (_values, context) => {
                const carryData = context.previousStepState?.data as CarryData | undefined;
                if (!carryData) throw new Error('Missing carry data from previous step');

                return { ...carryData, confirmed: true };
            },
        },
        {
            id: 'translate',
            title: 'Translate',
            render: ctx => {
                const prevState = ctx.previousStepState;
                const outputDir = config.get('outputDir') || './output';

                if (prevState?.status === 'running') {
                    return <Spinner color="#3b82f6" label="Translating products..." />;
                }

                if (prevState?.status === 'error') {
                    return (
                        <box flexDirection="column">
                            <box flexDirection="row">
                                <text fg="#ef4444" attributes={TextAttributes.BOLD}>
                                    ❌ Error:{' '}
                                </text>
                                <text attributes={TextAttributes.DIM}>
                                    {String(prevState.error ?? '')}
                                </text>
                            </box>
                        </box>
                    );
                }

                if (prevState?.status === 'success') {
                    const carryData = prevState.data as CarryData & { confirmed: boolean };
                    const languageCount = carryData.estimatesByLanguage.size;

                    return (
                        <box flexDirection="column">
                            <text attributes={TextAttributes.BOLD} fg="#22c55e">
                                ✓ Ready to translate
                            </text>
                            <box flexDirection="column" marginTop={1}>
                                <text>
                                    Languages: {languageCount} (
                                    {ctx.values.targetLanguages
                                        .map(l => languageMap[l] ?? l)
                                        .join(', ')}
                                    )
                                </text>
                                <text attributes={TextAttributes.DIM}>Output: {outputDir}</text>
                            </box>
                            <text attributes={TextAttributes.DIM} fg="#666666" marginTop={1}>
                                Press Ctrl+Enter to start translation.
                            </text>
                        </box>
                    );
                }

                return <Spinner color="#3b82f6" label="Preparing translation..." />;
            },
            onSubmit: async (values, context) => {
                const carryData = context.previousStepState?.data as
                    | (CarryData & { confirmed: boolean })
                    | undefined;
                if (!carryData) throw new Error('Missing carry data from previous step');

                const apiKey = config.get('apiKey');
                const modelId = config.get('modelId');
                const outputDir = config.get('outputDir') || './output';

                if (!apiKey) {
                    toast.error('API key is required', {
                        description: 'Please configure the API key in Settings',
                    });
                    throw new Error('API key is required');
                }

                fs.mkdirSync(outputDir, { recursive: true });

                const languages = values.targetLanguages;
                const totalLanguages = languages.length;
                console.log(`Translating ${totalLanguages} languages...`);

                if (totalLanguages === 0) {
                    toast.error(`No languages selected`, {
                        description: `Please select at least one language to translate.`,
                    });
                    throw new Error('No languages selected');
                }

                const toastId = toast.loading(`Translating 0/${totalLanguages}...`);

                const results: { language: LanguageCode; outputPath: string }[] = [];

                try {
                    for (let i = 0; i < languages.length; i++) {
                        const language = languages[i];
                        console.log(`Translating language: ${language}`);
                        if (!language) continue;

                        toast.loading(`Translating...`, {
                            description: `Translating ${i + 1}/${totalLanguages}: ${languageMap[language] ?? language}...`,
                            id: toastId,
                        });

                        const estimate = carryData.estimatesByLanguage.get(language);
                        if (!estimate) {
                            throw new Error(`No estimate found for language: ${language}`);
                        }

                        // 1. Translate attribute names
                        const translatedAttributeNames = await wooCsvParser.translateAttributeNames(
                            carryData.allUniqueAttributeNames,
                            language,
                            apiKey
                        );

                        // 2. Translate products
                        const { translatedProducts } = await wooCsvParser.translate(
                            modelId,
                            estimate.systemPrompt,
                            estimate.prompt,
                            0.5 / 1_000_000,
                            3.0 / 1_000_000,
                            apiKey
                        );

                        // 3. Post-process translated products
                        const finalRows = await wooCsvParser.postProcessTranslatedProducts(
                            carryData.parseSummary.productSourceTranslations,
                            translatedAttributeNames,
                            translatedProducts,
                            carryData.allUniqueAttributeNames,
                            language
                        );

                        // 4. Write CSV
                        const timestamp = new Date()
                            .toISOString()
                            .replace(/[:.]/g, '-')
                            .slice(0, 19);
                        const inputBaseName = path.basename(
                            values.csvPath,
                            path.extname(values.csvPath)
                        );
                        const outputFileName = `${inputBaseName}-${language}-${timestamp}.csv`;
                        const outputPath = path.join(outputDir, outputFileName);

                        const csv = Papa.unparse(finalRows);
                        fs.writeFileSync(outputPath, csv, 'utf8');

                        results.push({ language, outputPath });
                    }

                    // we only want to keep the necessary columns of the source product translations
                    const sourceProducts = carryData.parseSummary.productSourceTranslations.map(
                        row => {
                            return {
                                ID: row.ID,
                                Type: row.Type,
                                [WpmlImportColumns.TranslationGroup]: row.SKU,
                                [WpmlImportColumns.SourceLanguageCode]:
                                    row[WpmlImportColumns.ImportLanguageCode],
                                [WpmlImportColumns.ImportLanguageCode]:
                                    row[WpmlImportColumns.SourceLanguageCode],
                            };
                        }
                    );

                    const sourceProductsCsv = Papa.unparse(sourceProducts);
                    fs.writeFileSync(
                        path.join(
                            outputDir,
                            `${path.basename(values.csvPath)}-source-products.csv`
                        ),
                        sourceProductsCsv,
                        'utf8'
                    );

                    toast.success(`Translation complete!`, {
                        description: `Translated ${results.length} file(s) saved.`,
                        id: toastId,
                    });

                    return { results };
                } catch (error) {
                    const errorMessage =
                        error instanceof Error ? error.message : 'Translation failed';
                    console.error(error);
                    toast.error(`Translation failed`, {
                        description: `Error: ${errorMessage}`,
                        id: toastId,
                    });
                    throw error;
                }
            },
        },
    ];

    return (
        <box flexDirection="column" flexGrow={1} alignItems="flex-start" height="100%" width={65}>
            <box flexGrow={1} width="100%">
                <Wizard<TranslateWizardValues>
                    steps={steps}
                    initialValues={{
                        csvPath: '',
                        selectedMetaColumns: [],
                        targetLanguages: [],
                        overrideLanguages: [],
                    }}
                    actions={
                        <ActionPanel>
                            <ActionPanel.Section>
                                <Action.SubmitForm
                                    title="Continue"
                                    shortcut={{ modifiers: ['ctrl'], key: 'return' }}
                                />
                            </ActionPanel.Section>
                            <ActionPanel.Section title="Settings">
                                <Action
                                    title="Configure Settings..."
                                    shortcut={{ modifiers: ['ctrl', 'shift'], key: ',' }}
                                    onAction={onNavigateToSettings}
                                />
                            </ActionPanel.Section>
                        </ActionPanel>
                    }
                />
            </box>

            <Footer configurationOpen={false} />
        </box>
    );
}
