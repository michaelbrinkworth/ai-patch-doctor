"use strict";
/**
 * Retry checks - 429s, Retry-After, backoff
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRetries = checkRetries;
const node_fetch_1 = __importDefault(require("node-fetch"));
async function checkRetries(config) {
    const findings = [];
    const metrics = {};
    try {
        const url = `${config.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
        const headers = {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
        };
        const payload = {
            model: config.model || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 10,
        };
        const response = await (0, node_fetch_1.default)(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
        // Check for rate limit headers
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
            findings.push({
                severity: 'info',
                message: `Retry-After header present: ${retryAfter}s`,
            });
            metrics.retry_after_s = retryAfter;
        }
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
        if (rateLimitRemaining) {
            metrics.ratelimit_remaining = rateLimitRemaining;
            if (parseInt(rateLimitRemaining) < 10) {
                findings.push({
                    severity: 'warning',
                    message: `Low rate limit remaining: ${rateLimitRemaining}`,
                });
            }
        }
        // General recommendations
        findings.push({
            severity: 'info',
            message: 'Recommended: Use exponential backoff with jitter for retries',
        });
        findings.push({
            severity: 'info',
            message: 'Never retry after stream has started (partial response received)',
        });
        findings.push({
            severity: 'info',
            message: 'Set retry cap (e.g., 3 attempts max) to avoid infinite loops',
        });
        return {
            status: 'pass',
            findings,
            metrics,
        };
    }
    catch (error) {
        if (error.message.includes('429')) {
            return {
                status: 'warn',
                findings: [
                    {
                        severity: 'warning',
                        message: 'Rate limited (429). Check Retry-After header.',
                    },
                ],
                metrics,
            };
        }
        return {
            status: 'fail',
            findings: [
                {
                    severity: 'error',
                    message: `Retry check failed: ${error.message}`,
                },
            ],
            metrics,
        };
    }
}
//# sourceMappingURL=retries.js.map