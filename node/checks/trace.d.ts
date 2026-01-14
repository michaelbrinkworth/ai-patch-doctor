/**
 * Traceability checks - request IDs, correlation
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
export declare function checkTrace(config: Config): Promise<CheckResult>;
export {};
//# sourceMappingURL=trace.d.ts.map