/**
 * Traceability checks - request IDs, correlation
 */

import fetch from 'node-fetch';
import * as crypto from 'crypto';
import { Config } from '../config';

interface CheckResult {
  status: 'pass' | 'warn' | 'fail' | 'skipped';
  findings: Array<{
    severity: 'info' | 'warning' | 'error';
    message: string;
    details?: any;
  }>;
  metrics?: Record<string, any>;
  not_detected?: string[];
  not_observable?: string[];
}

export async function checkTrace(config: Config): Promise<CheckResult> {
  const findings: any[] = [];
  const metrics: Record<string, any> = {};
  const notDetected: string[] = [];
  const notObservable: string[] = [];

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

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Check for request ID in response
    const providerRequestId =
      response.headers.get('x-request-id') ||
      response.headers.get('openai-request-id') ||
      response.headers.get('cf-ray');

    if (providerRequestId) {
      findings.push({
        severity: 'info',
        message: `Provider request ID: ${providerRequestId}`,
      });
      metrics.provider_request_id = providerRequestId;
    } else {
      findings.push({
        severity: 'warning',
        message: 'Provider request ID not found in response headers',
      });
      notDetected.push('Provider request ID (not found in response headers)');
    }

    // Calculate request hash for duplicate detection
    const payloadStr = JSON.stringify(Object.entries(payload).sort());
    const requestHash = crypto.createHash('sha256').update(payloadStr).digest('hex').slice(0, 16);

    metrics.request_hash = requestHash;

    findings.push({
      severity: 'info',
      message: `Generated request hash: ${requestHash}`,
    });

    // Add "Not observable" only if there are warnings
    if (!providerRequestId) {
      notObservable.push('Duplicate requests');
    }

    return {
      status: providerRequestId ? 'pass' : 'warn',
      findings,
      metrics,
      not_detected: notDetected,
      not_observable: notObservable,
    };
  } catch (error: any) {
    return {
      status: 'fail',
      findings: [
        {
          severity: 'error',
          message: `Trace check failed: ${error.message}`,
        },
      ],
      metrics,
      not_detected: notDetected,
      not_observable: notObservable,
    };
  }
}
