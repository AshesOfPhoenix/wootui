/**
 * WPML import column keys
 */
export interface EstimateTokenAndPriceResult {
    wordCount: number;
    inputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    estimatedPrice: {
        total: number;
        input: number;
        output: number;
        reasoning: number;
        perWordTotal: number;
        perWordInput: number;
        perWordOutput: number;
    };
    encodedProducts: string;
    systemPrompt: string;
    prompt: string;
}
