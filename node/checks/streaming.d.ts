/**
 * Streaming checks - SSE, chunk gaps, timeouts
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
export declare function checkStreaming(config: Config): Promise<CheckResult>;
export {};
//# sourceMappingURL=streaming.d.ts.map