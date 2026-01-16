/**
 * Retry checks - 429s, Retry-After, backoff
 */

import fetch from 'node-fetch';
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

export async function checkRetries(config: Config): Promise<CheckResult> {
  const findings: any[] = [];
  const metrics: Record<string, any> = {};
  const notDetected: string[] = [];
  const notObservable: string[] = [];

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

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    // Check for rate limit headers
    const retryAfter = response.headers.get('retry-after');
    if (retryAfter) {
      findings.push({
        severity: 'info',
        message: `Retry-After header: ${retryAfter}s`,
      });
      metrics.retry_after_s = retryAfter;
    }

    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    if (rateLimitRemaining) {
      metrics.ratelimit_remaining = rateLimitRemaining;

      if (parseInt(rateLimitRemaining) < 10) {
        findings.push({
          severity: 'warning',
          message: `Rate limit remaining: ${rateLimitRemaining} requests`,
        });
      }
    }

    // Check for 429 status
    if (response.status === 429) {
      findings.push({
        severity: 'warning',
        message: 'Rate limiting detected (HTTP 429)',
      });
    }

    // If no rate limiting detected, add to not_detected
    if (response.status !== 429 && !response.headers.get('retry-after')) {
      notDetected.push('Rate limiting (no 429s in 1 probe)');
    }

    // Add "Not observable" only if there are warnings/errors
    const hasWarnings = findings.some((f) => f.severity === 'warning' || f.severity === 'error');
    if (hasWarnings) {
      notObservable.push('Retry policy');
      notObservable.push('Retry after stream start');
    }

    return {
      status: findings.some((f) => f.severity === 'warning' || f.severity === 'error') ? 'warn' : 'pass',
      findings,
      metrics,
      not_detected: notDetected,
      not_observable: notObservable,
    };
  } catch (error: any) {
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
        not_detected: notDetected,
        not_observable: ['Retry policy', 'Retry after stream start'],
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
      not_detected: notDetected,
      not_observable: notObservable,
    };
  }
}
