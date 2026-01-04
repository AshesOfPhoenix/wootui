import fs from 'node:fs';
import { TextAttributes } from '@opentui/core';
import { toast } from '@opentui-ui/toast';
import type { TranslationResults } from '@/types/translation-result';
import { languageMap } from '@/utils/language-map';
import { Spinner } from '@/components/spinner';
import { wooCsvParser } from '@/utils/woo-csv';
import type { WizardStepDefinition } from '@/components/wizard';
import { WizardStepStatus } from '@/components/wizard/types';
import type { CarryData, TranslateWizardValues } from './types';
import { appConfig } from '@/utils/config';
import { useOutputDir } from '@/hooks/use-output-dir';

/**
 * Creates the translate step definition
 */
export function createTranslateStep(): WizardStepDefinition<TranslateWizardValues> {
    const outputDir = useOutputDir();

    return {
        id: 'translate',
        title: 'Translate',
        render: ctx => {
            const prevState = ctx.previousStepState;
            const displayOutputDir = appConfig.get('outputDir') || './output';

            if (prevState?.status === WizardStepStatus.RUNNING) {
                return <Spinner color="#3b82f6" label="Translating products..." />;
            }

            if (prevState?.status === WizardStepStatus.ERROR) {
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

            if (prevState?.status === WizardStepStatus.SUCCESS) {
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
                            <text attributes={TextAttributes.DIM}>Output: {displayOutputDir}</text>
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

            let validatedConfig: ReturnType<typeof wooCsvParser.validateTranslationConfig>;
            try {
                validatedConfig = wooCsvParser.validateTranslationConfig();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Configuration error';
                toast.error('Configuration error', { description: message });
                throw error;
            }

            fs.mkdirSync(outputDir, { recursive: true });

            const languages = values.targetLanguages;
            const totalLanguages = languages.length;
            console.log(`Translating ${totalLanguages} languages...`);

            if (totalLanguages === 0) {
                toast.error('No languages selected', {
                    description: 'Please select at least one language to translate.',
                });
                throw new Error('No languages selected');
            }

            const toastId = toast.loading(`Translating 0/${totalLanguages}...`);

            try {
                const results = await wooCsvParser.translateAllLanguages({
                    languages,
                    carryData: {
                        parseSummary: carryData.parseSummary,
                        allUniqueAttributeNames: carryData.allUniqueAttributeNames,
                        estimatesByLanguage: carryData.estimatesByLanguage,
                    },
                    csvPath: values.csvPath,
                    outputDir,
                    priceInputModifier: validatedConfig.priceInputModifier,
                    priceOutputModifier: validatedConfig.priceOutputModifier,
                    onProgress: (current, total, language) => {
                        toast.loading('Translating...', {
                            description: `Translating ${current}/${total}: ${languageMap[language] ?? language}...`,
                            id: toastId,
                        });
                    },
                });

                wooCsvParser.exportSourceProducts(
                    carryData.parseSummary.productSourceTranslations,
                    values.csvPath,
                    outputDir
                );

                toast.success('Translation complete!', {
                    description: `Translated ${results.length} file(s) saved.`,
                    id: toastId,
                });

                const translationResults: TranslationResults = {
                    languageResults: results,
                    outputDir,
                    totalInputTokens: results.reduce((sum, r) => sum + r.inputTokens, 0),
                    totalOutputTokens: results.reduce((sum, r) => sum + r.outputTokens, 0),
                    totalReasoningTokens: results.reduce((sum, r) => sum + r.reasoningTokens, 0),
                    totalCost: results.reduce((sum, r) => sum + r.cost, 0),
                };

                return translationResults;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Translation failed';
                console.error(error);
                toast.error('Translation failed', {
                    description: `Error: ${errorMessage}`,
                    id: toastId,
                });
                throw error;
            }
        },
    };
}
