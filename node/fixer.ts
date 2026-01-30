/**
 * Code Fixer - Applies local fixes to AI API issues
 * 
 * This module applies fixes for common issues that can be solved at the code level:
 * - Adds timeouts
 * - Adds exponential backoff
 * - Fixes SSE headers
 * - Fixes JSON mode
 * - Adds request IDs
 * - Removes cost footguns (adds max_tokens)
 */

import * as fs from 'fs';
import * as path from 'path';

export interface Fix {
  file: string;
  line: number;
  type: 'add' | 'modify' | 'remove';
  issue: string;
  suggestion: string;
  code?: string;
}

export interface FixResult {
  applied: Fix[];
  skipped: Fix[];
  errors: Array<{ fix: Fix; error: string }>;
}

export class CodeFixer {
  private dryRun: boolean;
  private fixes: Fix[] = [];

  constructor(dryRun: boolean = true) {
    this.dryRun = dryRun;
  }

  /**
   * Scan codebase for fixable issues
   */
  async scanForFixes(targetDir: string = process.cwd()): Promise<Fix[]> {
    this.fixes = [];
    
    // Find all JS/TS files that might have OpenAI/Claude calls
    const files = this.findSourceFiles(targetDir);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      // Check for various issues
      this.detectStreamingIssues(file, lines);
      this.detectRetryIssues(file, lines);
      this.detectTimeoutIssues(file, lines);
      this.detectCostIssues(file, lines);
      this.detectTraceabilityIssues(file, lines);
    }
    
    return this.fixes;
  }

  /**
   * Apply fixes to code
   */
  async applyFixes(fixes: Fix[]): Promise<FixResult> {
    const result: FixResult = {
      applied: [],
      skipped: [],
      errors: []
    };

    for (const fix of fixes) {
      try {
        if (this.dryRun) {
          result.skipped.push(fix);
        } else {
          await this.applyFix(fix);
          result.applied.push(fix);
        }
      } catch (error: any) {
        result.errors.push({ fix, error: error.message });
      }
    }

    return result;
  }

  private findSourceFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules, .git, etc.
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...this.findSourceFiles(fullPath));
      } else if (entry.isFile() && /\.(js|ts|jsx|tsx|py)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private detectStreamingIssues(file: string, lines: string[]): void {
    lines.forEach((line, index) => {
      // Detect streaming without headers
      if (line.includes('stream: true') || line.includes('stream=True')) {
        const nextLines = lines.slice(index, index + 10).join('\n');
        
        if (!nextLines.includes('X-Accel-Buffering')) {
          this.fixes.push({
            file,
            line: index + 1,
            type: 'add',
            issue: 'streaming-headers',
            suggestion: 'Add X-Accel-Buffering: no header to prevent proxy buffering',
            code: 'headers: { "X-Accel-Buffering": "no" }'
          });
        }
      }
    });
  }

  private detectRetryIssues(file: string, lines: string[]): void {
    lines.forEach((line, index) => {
      // Detect linear retry pattern
      if (line.includes('setTimeout') && line.includes('1000')) {
        const context = lines.slice(Math.max(0, index - 5), index + 5).join('\n');
        if (context.includes('429') || context.includes('retry')) {
          this.fixes.push({
            file,
            line: index + 1,
            type: 'modify',
            issue: 'retry-backoff',
            suggestion: 'Use exponential backoff instead of linear retry',
            code: 'const wait = Math.min(1000 * Math.pow(2, attempt), 32000);'
          });
        }
      }
    });
  }

  private detectTimeoutIssues(file: string, lines: string[]): void {
    lines.forEach((line, index) => {
      // Detect API calls without timeout
      if ((line.includes('openai.') || line.includes('client.chat') || line.includes('anthropic.')) && 
          (line.includes('.create') || line.includes('.completions'))) {
        const nextLines = lines.slice(index, index + 15).join('\n');
        
        if (!nextLines.includes('timeout') && !nextLines.includes('maxRetries')) {
          this.fixes.push({
            file,
            line: index + 1,
            type: 'add',
            issue: 'missing-timeout',
            suggestion: 'Add timeout to prevent hanging requests',
            code: 'timeout: 60000, // 60 seconds'
          });
        }
      }
    });
  }

  private detectCostIssues(file: string, lines: string[]): void {
    lines.forEach((line, index) => {
      // Detect API calls without max_tokens
      if ((line.includes('.create') || line.includes('.completions')) &&
          (line.includes('messages') || line.includes('prompt'))) {
        const nextLines = lines.slice(index, index + 15).join('\n');
        
        if (!nextLines.includes('max_tokens') && !nextLines.includes('maxTokens')) {
          this.fixes.push({
            file,
            line: index + 1,
            type: 'add',
            issue: 'missing-max-tokens',
            suggestion: 'Add max_tokens to control costs',
            code: 'max_tokens: 1000'
          });
        }
      }
    });
  }

  private detectTraceabilityIssues(file: string, lines: string[]): void {
    lines.forEach((line, index) => {
      // Detect API calls without request IDs
      if ((line.includes('.create') || line.includes('.completions'))) {
        const nextLines = lines.slice(index, index + 15).join('\n');
        
        if (!nextLines.includes('x-request-id') && !nextLines.includes('idempotency')) {
          this.fixes.push({
            file,
            line: index + 1,
            type: 'add',
            issue: 'missing-request-id',
            suggestion: 'Add request ID for traceability',
            code: 'headers: { "x-request-id": crypto.randomUUID() }'
          });
        }
      }
    });
  }

  private async applyFix(fix: Fix): Promise<void> {
    const content = fs.readFileSync(fix.file, 'utf-8');
    const lines = content.split('\n');
    
    // Apply the fix (simplified - real implementation would be more sophisticated)
    if (fix.type === 'add' && fix.code) {
      lines.splice(fix.line, 0, `  ${fix.code} // AI Patch fix: ${fix.issue}`);
    } else if (fix.type === 'modify' && fix.code) {
      lines[fix.line - 1] = `  ${fix.code} // AI Patch fix: ${fix.issue}`;
    }
    
    fs.writeFileSync(fix.file, lines.join('\n'), 'utf-8');
  }
}
