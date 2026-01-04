/**
 * Gemini API Pricing Configuration
 * Last updated: January 2, 2026
 * Source: https://ai.google.dev/gemini-api/docs/pricing
 */

export const GEMINI_PRICING = {
    // Gemini 2.5 Models
    'gemini-2.5-pro': {
        displayName: 'Gemini 2.5 Pro',
        base: {
            input: 1.25,
            output: 10.0,
        },
        longContext: {
            input: 2.5,
            output: 15.0,
        },
    },
    'gemini-2.5-flash': {
        displayName: 'Gemini 2.5 Flash',
        base: {
            input: 0.3,
            output: 2.5,
        },
        longContext: null,
    },

    // Gemini 3.0 Models
    'gemini-3-flash': {
        displayName: 'Gemini 3.0 Flash',
        base: {
            input: 0.5,
            output: 3.0,
        },
        longContext: null,
    },
    'gemini-3-pro-preview': {
        displayName: 'Gemini 3.0 Pro (Preview)',
        base: {
            input: 2.0,
            output: 12.0,
        },
        longContext: {
            input: 4.0,
            output: 18.0,
        },
    },

    'gemini-2-flash': {
        displayName: 'Gemini 2.0 Flash',
        base: {
            input: 0.075,
            output: 0.3,
        },
        longContext: null,
    },
} as const;

/**
 * Usage metrics for cost estimation
 */
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    reasoningTokens: number;
    /** Optional: Cache hit tokens (cached tokens are 90% cheaper, but countTokens already reflects this) */
    cacheTokens?: number;
}

/**
 * Options for cost estimation
 */
export interface CostEstimationOptions {
    /** Model name from GEMINI_PRICING keys */
    model: keyof typeof GEMINI_PRICING;
    /** Token usage */
    usage: TokenUsage;
    /** Context window size in tokens (used to determine pricing tier for Pro models) */
    contextSize?: number;
}

/**
 * Cost estimate result
 */
export interface CostEstimate {
    model: string;
    inputCost: number;
    outputCost: number;
    reasoningCost: number;
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
}

/**
 * Estimate API cost for Gemini usage
 *
 * @example
 * const estimate = estimateGeminiCost({
 *   model: 'gemini-3-pro-preview',
 *   usage: { promptTokens: 1000, completionTokens: 500 },
 *   contextSize: 250000, // triggers long-context pricing
 * });
 * console.log(`Cost: $${estimate.totalCost.toFixed(4)}`);
 */
export function estimateGeminiCost(options: CostEstimationOptions): CostEstimate {
    const { model, usage, contextSize = 0 } = options;

    const modelConfig = GEMINI_PRICING[model];
    if (!modelConfig) {
        throw new Error(`Unknown model: ${model}`);
    }

    // Determine pricing tier (standard vs long context)
    const isLongContext = contextSize > 200_000;
    const useLongContextPricing = modelConfig.longContext && isLongContext;

    const basePricing = useLongContextPricing ? modelConfig.longContext : modelConfig.base;

    const inputRatePerM = basePricing.input;
    const outputRatePerM = basePricing.output;

    // Calculate costs (convert tokens to millions)
    const inputCost = (usage.promptTokens / 1_000_000) * inputRatePerM;
    const outputCost = (usage.completionTokens / 1_000_000) * outputRatePerM;
    const reasoningCost = (usage.reasoningTokens / 1_000_000) * outputRatePerM;
    const totalCost = inputCost + outputCost + reasoningCost;

    return {
        model: modelConfig.displayName,
        inputCost: parseFloat(inputCost.toFixed(6)),
        outputCost: parseFloat(outputCost.toFixed(6)),
        reasoningCost: parseFloat(reasoningCost.toFixed(6)),
        totalCost: parseFloat(totalCost.toFixed(6)),
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
        reasoningTokens: usage.reasoningTokens,
    };
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
    }).format(cost);
}
