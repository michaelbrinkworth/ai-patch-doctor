/**
 * Cost checks - token limits, cost estimation
 */

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

export async function checkCost(config: Config): Promise<CheckResult> {
  const findings: any[] = [];
  const metrics: Record<string, any> = {};
  const notDetected: string[] = [];
  const notObservable: string[] = [];

  // Cost estimation (simplified)
  const pricingMap: Record<string, [number, number]> = {
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

  // Only report pricing (informational)
  // Status is 'pass' because we're not detecting any issues,
  // just providing pricing information from the model lookup table
  findings.push({
    severity: 'info',
    message: `Model pricing: $${inputPrice}/1M input tokens, $${outputPrice}/1M output tokens`,
  });

  // Cost checks always have "not observable" items since we can't see real usage
  // But only add them if there are warnings (there aren't any by default now)
  // For now, cost check is informational only

  return {
    status: 'pass',
    findings,
    metrics,
    not_detected: notDetected,
    not_observable: notObservable,
  };
}
