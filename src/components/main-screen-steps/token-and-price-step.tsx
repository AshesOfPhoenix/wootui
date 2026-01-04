import { TextAttributes } from '@opentui/core';
import { languageMap } from '@/utils/language-map';
import { Spinner } from '@/components/spinner';
import { LabelValue } from '@/components/label-value';
import type { WizardStepDefinition } from '@/components/wizard';
import { WizardStepStatus } from '@/components/wizard/types';
import type { CarryData, TranslateWizardValues } from './types';

/**
 * Creates the token and price estimation step definition
 */
export function createTokenAndPriceStep(): WizardStepDefinition<TranslateWizardValues> {
    return {
        id: 'token-and-price',
        title: 'Token and Price',
        render: ctx => {
            const prevState = ctx.previousStepState;
            const carryData = prevState?.data as CarryData | undefined;

            if (prevState?.status === WizardStepStatus.RUNNING) {
                return <Spinner color="#3b82f6" label="Estimating token and price..." />;
            }

            if (prevState?.status === WizardStepStatus.ERROR) {
                return (
                    <box flexDirection="row">
                        <text fg="#ef4444" attributes={TextAttributes.BOLD}>
                            ❌ Error:{' '}
                        </text>
                        <text attributes={TextAttributes.DIM}>{String(prevState.error ?? '')}</text>
                    </box>
                );
            }

            if (prevState?.status === WizardStepStatus.SUCCESS && carryData) {
                let totalInputTokens = 0;
                let totalOutputTokens = 0;
                let totalReasoningTokens = 0;
                let totalPrice = 0;

                const languageEntries = Array.from(carryData.estimatesByLanguage.entries());
                for (const [, estimate] of languageEntries) {
                    totalInputTokens += estimate.inputTokens;
                    totalOutputTokens += estimate.outputTokens;
                    totalReasoningTokens += estimate.reasoningTokens;
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
                                        {`${estimate.inputTokens.toLocaleString()} iT / ${estimate.outputTokens.toLocaleString()} oT / ${estimate.reasoningTokens.toLocaleString()} rT`}
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
                                label="Total iT"
                                value={totalInputTokens.toLocaleString()}
                            />
                            <LabelValue
                                label="Total oT"
                                value={totalOutputTokens.toLocaleString()}
                            />
                            <LabelValue
                                label="Total rT"
                                value={totalReasoningTokens.toLocaleString()}
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
                <Spinner color="#3b82f6" label="Waiting for token and price to be estimated..." />
            );
        },
        onSubmit: async (_values, context) => {
            const carryData = context.previousStepState?.data as CarryData | undefined;
            if (!carryData) throw new Error('Missing carry data from previous step');

            return { ...carryData, confirmed: true };
        },
    };
}
