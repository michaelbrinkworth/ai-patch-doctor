"use strict";
/**
 * Traceability checks - request IDs, correlation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTrace = checkTrace;
const node_fetch_1 = __importDefault(require("node-fetch"));
const crypto = __importStar(require("crypto"));
async function checkTrace(config) {
    const findings = [];
    const metrics = {};
    try {
        const url = `${config.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
        // Generate stable request ID
        const requestId = crypto.randomUUID();
        const headers = {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
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
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        // Check for request ID in response
        const providerRequestId = response.headers.get('x-request-id') ||
            response.headers.get('openai-request-id') ||
            response.headers.get('cf-ray');
        if (providerRequestId) {
            findings.push({
                severity: 'info',
                message: `Provider request ID found: ${providerRequestId}`,
            });
            metrics.provider_request_id = providerRequestId;
        }
        else {
            findings.push({
                severity: 'warning',
                message: 'No provider request ID found in response headers',
            });
        }
        // Calculate request hash for duplicate detection
        const payloadStr = JSON.stringify(Object.entries(payload).sort());
        const requestHash = crypto.createHash('sha256').update(payloadStr).digest('hex').slice(0, 16);
        metrics.request_hash = requestHash;
        findings.push({
            severity: 'info',
            message: `Generated request hash: ${requestHash} (for duplicate detection)`,
        });
        // Recommendations
        findings.push({
            severity: 'info',
            message: 'Always include X-Request-ID header for request correlation',
        });
        findings.push({
            severity: 'info',
            message: 'Log request hashes to detect duplicate API calls',
        });
        findings.push({
            severity: 'info',
            message: 'Capture provider request IDs from response headers for support tickets',
        });
        return {
            status: 'pass',
            findings,
            metrics,
        };
    }
    catch (error) {
        return {
            status: 'fail',
            findings: [
                {
                    severity: 'error',
                    message: `Trace check failed: ${error.message}`,
                },
            ],
            metrics,
        };
    }
}
//# sourceMappingURL=trace.js.map