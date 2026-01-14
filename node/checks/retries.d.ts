/**
 * Retry checks - 429s, Retry-After, backoff
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
}
export declare function checkRetries(config: Config): Promise<CheckResult>;
export {};
//# sourceMappingURL=retries.d.ts.map