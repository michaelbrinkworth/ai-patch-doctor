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
}
export declare function checkCost(config: Config): Promise<CheckResult>;
export {};
//# sourceMappingURL=cost.d.ts.map