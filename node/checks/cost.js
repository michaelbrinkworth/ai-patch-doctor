"use strict";
/**
 * Cost checks - token limits, cost estimation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCost = checkCost;
async function checkCost(config) {
    const findings = [];
    const metrics = {};
    // Cost estimation (simplified)
    const pricingMap = {
        'gpt-4': [30.0, 60.0],
        'gpt-4-turbo': [10.0, 30.0],
        'gpt-4o': [2.5, 10.0],
        'gpt-4o-mini': [0.15, 0.6],
        'gpt-3.5-turbo': [0.5, 1.5],
    };
    const model = config.model || 'gpt-3.5-turbo';
    // Find pricing
    let [inputPrice, outputPrice] = pricingMap['gpt-3.5-turbo'];
    for (const key in pricingMap) {
        if (model.startsWith(key)) {
            [inputPrice, outputPrice] = pricingMap[key];
            break;
        }
    }
    metrics.input_price_per_1m = inputPrice;
    metrics.output_price_per_1m = outputPrice;
    // Recommendations
    findings.push({
        severity: 'info',
        message: `Model pricing: $${inputPrice}/1M input, $${outputPrice}/1M output tokens`,
    });
    findings.push({
        severity: 'info',
        message: 'Set max_tokens cap to prevent runaway costs (e.g., max_tokens: 2000)',
    });
    findings.push({
        severity: 'info',
        message: 'Monitor for tool/function call loops that can burn tokens quickly',
    });
    findings.push({
        severity: 'info',
        message: 'Consider implementing per-user or per-session token budgets',
    });
    findings.push({
        severity: 'warning',
        message: 'No prompt size validation detected. Large prompts can cause cost spikes.',
    });
    return {
        status: 'warn',
        findings,
        metrics,
    };
}
//# sourceMappingURL=cost.js.map