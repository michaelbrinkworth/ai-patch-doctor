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

export class ReportGenerator {
  private static readonly VERSION = '1.0.0';

  createReport(
    target: string,
    provider: string,
    baseUrl: string,
    checks: Checks,
    duration: number
  ): any {
    // Determine overall status
    let status = 'success';
    for (const checkName in checks) {
      const checkStatus = checks[checkName].status;
      if (checkStatus === 'fail') {
        status = 'error';
        break;
      } else if (checkStatus === 'warn' && status === 'success') {
        status = 'warning';
      }
    }

    // Determine next step
    const nextStep = this.getNextStep(status, checks);

    // Calculate estimated cost if available
    let estimatedCost: number | null = null;
    for (const checkName in checks) {
      const metrics = checks[checkName].metrics || {};
      if ('estimated_cost_usd' in metrics) {
        if (estimatedCost === null) {
          estimatedCost = 0;
        }
        estimatedCost += metrics.estimated_cost_usd || 0;
      }
    }

    // Build report
    const report: any = {
      version: ReportGenerator.VERSION,
      timestamp: new Date().toISOString(),
      target,
      provider,
      base_url: baseUrl,
      checks,
      summary: {
        status,
        next_step: nextStep,
        duration_seconds: Math.round(duration * 100) / 100,
      },
      // BYOK receipt schema metadata
      receipt_format: 'badgr-compatible',
      execution_authority: 'ai-patch',
      billing_authority: 'customer',
      // Coverage limitations
      coverage: {
        mode: 'synthetic',
        missing: [
          'live retry storms',
          'cross-request correlation',
          'partial stream truncation',
          'tail latency amplification',
        ],
      },
    };

    // Add cost fields only if cost exists
    if (estimatedCost !== null) {
      report.estimated_cost_usd = Math.round(estimatedCost * 1000000) / 1000000;
      report.cost_source = 'model_pricing_table';
    }

    return report;
  }

  generateMarkdown(report: any): string {
    const lines: string[] = [];

    lines.push('# AI Patch Report');
    lines.push('');
    lines.push(`**Generated:** ${report.timestamp}`);
    lines.push(`**Target:** ${report.target}`);
    lines.push(`**Provider:** ${report.provider}`);
    lines.push(`**Base URL:** ${report.base_url}`);
    lines.push('');

    // Summary
    const summary = report.summary;
    const statusEmoji: Record<string, string> = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    lines.push('## Summary');
    lines.push('');
    lines.push(`**Status:** ${statusEmoji[summary.status] || '•'} ${summary.status.toUpperCase()}`);
    lines.push(`**Duration:** ${summary.duration_seconds}s`);
    lines.push('');

    // Organize findings into three buckets
    const detected: string[] = [];
    const notDetected: string[] = [];
    const notObservable: string[] = [];

    for (const checkName in report.checks) {
      const checkResult = report.checks[checkName];
      const findings = checkResult.findings || [];
      const checkNotDetected = checkResult.not_detected || [];
      const checkNotObservable = checkResult.not_observable || [];
      
      for (const finding of findings) {
        const message = finding.message || '';
        
        // Detected: findings with evidence (metrics, values, thresholds)
        if (finding.severity === 'info' || finding.severity === 'warning' || finding.severity === 'error') {
          detected.push(`[${checkName}] ${message}`);
        }
      }
      
      // Aggregate not detected and not observable items
      checkNotDetected.forEach((item: string) => notDetected.push(item));
      checkNotObservable.forEach((item: string) => {
        if (!notObservable.includes(item)) {
          notObservable.push(item);
        }
      });
    }

    // Three-bucket structure
    lines.push('## Detected');
    lines.push('');
    if (detected.length > 0) {
      detected.forEach(item => lines.push(`• ${item}`));
    } else {
      lines.push('No issues detected');
    }
    lines.push('');

    lines.push('## Not detected');
    lines.push('');
    if (notDetected.length > 0) {
      notDetected.forEach(item => lines.push(`• ${item}`));
    } else {
      lines.push('No explicit checks for absent items');
    }
    lines.push('');

    // Only show "Not observable" if status is warning or error
    if (summary.status !== 'success' && notObservable.length > 0) {
      lines.push('## Not observable from provider probe');
      lines.push('');
      notObservable.forEach(item => lines.push(`• ${item}`));
      lines.push('');
    }

    // Conditional note
    if (summary.status !== 'success') {
      lines.push('### Note');
      lines.push("Here's exactly what I can see from the provider probe.");
      lines.push("Here's what I cannot see without real traffic.");
      lines.push('');
    }

    // Footer with conditional Badgr
    lines.push('---');
    lines.push('');
    lines.push(`📊 Report: ./ai-patch-reports/latest/report.md`);
    lines.push('');
    
    // Badgr messaging - only when status != success and relevant items exist
    if (summary.status !== 'success' && notObservable.length > 0) {
      const specificItem = notObservable[0].toLowerCase();
      lines.push(`To observe ${specificItem}, run one real request through the receipt gateway (2-minute base_url swap).`);
      lines.push('');
    }
    
    lines.push('Generated by AI Patch — re-run: npx ai-patch');

    return lines.join('\n');
  }

  private getNextStep(status: string, checks: Checks): string {
    if (status === 'success') {
      return "All checks passed. Run 'ai-patch diagnose' for deeper analysis.";
    }

    // Find first failure
    for (const checkName in checks) {
      if (checks[checkName].status === 'fail' || checks[checkName].status === 'warn') {
        const findings = checks[checkName].findings;
        if (findings && findings.length > 0) {
          return `Fix ${checkName} issues, then run 'ai-patch apply --safe'`;
        }
      }
    }

    return "Review findings and run 'ai-patch apply --safe'";
  }
}
