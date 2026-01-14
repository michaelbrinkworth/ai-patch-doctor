/**
 * Report generation for AI Patch
 */
interface CheckResult {
    status: 'pass' | 'warn' | 'fail' | 'skipped';
    findings: Array<{
        severity: 'info' | 'warning' | 'error';
        message: string;
        details?: any;
    }>;
    metrics?: Record<string, any>;
}
interface Checks {
    [key: string]: CheckResult;
}
export declare class ReportGenerator {
    private static readonly VERSION;
    createReport(target: string, provider: string, baseUrl: string, checks: Checks, duration: number): any;
    generateMarkdown(report: any): string;
    private getNextStep;
}
export {};
//# sourceMappingURL=report.d.ts.map