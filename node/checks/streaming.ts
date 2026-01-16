/**
 * Streaming checks - SSE, chunk gaps, timeouts
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

export async function checkStreaming(config: Config): Promise<CheckResult> {
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
      messages: [{ role: 'user', content: 'Say hello' }],
      stream: true,
      max_tokens: 50,
    };

    const startTime = Date.now();
    let ttfb: number | null = null;
    let chunkCount = 0;
    let lastChunkTime = startTime;
    let maxChunkGap = 0;

    const response = await fetch(url, {
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
        message: `TTFB: ${(ttfb / 1000).toFixed(1)}s (threshold: 5s)`,
      });
    }

    if (maxChunkGap > 30.0) {
      findings.push({
        severity: 'error',
        message: `Max chunk gap: ${maxChunkGap.toFixed(1)}s (>30s threshold)`,
      });
    } else if (maxChunkGap > 10.0) {
      findings.push({
        severity: 'warning',
        message: `Max chunk gap: ${maxChunkGap.toFixed(1)}s (>10s threshold)`,
      });
    }

    // Determine status
    let status: 'pass' | 'warn' | 'fail' = 'pass';
    if (findings.some((f) => f.severity === 'error')) {
      status = 'fail';
    } else if (findings.length > 0) {
      status = 'warn';
    }

    // Add "Not observable" only if there are warnings/errors
    if (status === 'warn' || status === 'fail') {
      notObservable.push('Whether client retries after partial stream');
    }

    return { status, findings, metrics, not_detected: notDetected, not_observable: notObservable };
  } catch (error: any) {
    return {
      status: 'fail',
      findings: [
        {
          severity: 'error',
          message: `Streaming check failed: ${error.message}`,
        },
      ],
      metrics,
      not_detected: notDetected,
      not_observable: notObservable,
    };
  }
}
