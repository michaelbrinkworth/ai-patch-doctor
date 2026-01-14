"use strict";
/**
 * Streaming checks - SSE, chunk gaps, timeouts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkStreaming = checkStreaming;
const node_fetch_1 = __importDefault(require("node-fetch"));
async function checkStreaming(config) {
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
            messages: [{ role: 'user', content: 'Say hello' }],
            stream: true,
            max_tokens: 50,
        };
        const startTime = Date.now();
        let ttfb = null;
        let chunkCount = 0;
        let lastChunkTime = startTime;
        let maxChunkGap = 0;
        const response = await (0, node_fetch_1.default)(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const body = response.body;
        if (!body) {
            throw new Error('No response body');
        }
        for await (const chunk of body) {
            const currentTime = Date.now();
            if (ttfb === null) {
                ttfb = currentTime - startTime;
            }
            const chunkGap = (currentTime - lastChunkTime) / 1000;
            maxChunkGap = Math.max(maxChunkGap, chunkGap);
            lastChunkTime = currentTime;
            chunkCount++;
        }
        const totalTime = (Date.now() - startTime) / 1000;
        // Record metrics
        metrics.ttfb_ms = ttfb ? Math.round(ttfb) : null;
        metrics.total_time_s = Math.round(totalTime * 100) / 100;
        metrics.chunk_count = chunkCount;
        metrics.max_chunk_gap_s = Math.round(maxChunkGap * 100) / 100;
        // Check for issues
        if (ttfb && ttfb / 1000 > 5.0) {
            findings.push({
                severity: 'warning',
                message: `High TTFB: ${(ttfb / 1000).toFixed(2)}s (>5s). Check network or proxy settings.`,
            });
        }
        if (maxChunkGap > 30.0) {
            findings.push({
                severity: 'error',
                message: `Large chunk gap: ${maxChunkGap.toFixed(2)}s (>30s). Possible SSE stall or proxy idle timeout.`,
            });
        }
        else if (maxChunkGap > 10.0) {
            findings.push({
                severity: 'warning',
                message: `Chunk gap: ${maxChunkGap.toFixed(2)}s (>10s). Monitor for potential stalls.`,
            });
        }
        // Determine status
        let status = 'pass';
        if (findings.some((f) => f.severity === 'error')) {
            status = 'fail';
        }
        else if (findings.length > 0) {
            status = 'warn';
        }
        return { status, findings, metrics };
    }
    catch (error) {
        return {
            status: 'fail',
            findings: [
                {
                    severity: 'error',
                    message: `Streaming check failed: ${error.message}`,
                },
            ],
            metrics,
        };
    }
}
//# sourceMappingURL=streaming.js.map