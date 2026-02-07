/**
 * Code Scanner - Finds AI API issues in source code
 * 
 * Scans codebases for common AI API integration issues:
 * - Streaming problems (missing SSE headers, buffering)
 * - Retry/backoff issues (no exponential backoff, no cap)
 * - Timeout issues (no timeout set, defaults too low)
 * - Rate limit handling (no 429 handling)
 * - Cost issues (unbounded max_tokens)
 * - Traceability issues (no request IDs)
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Helper function to check if a line is likely in a string/template literal
 * This helps avoid false positives on documentation and example code
 */
function isLikelyInString(line: string, keyword: string): boolean {
  // Remove leading/trailing whitespace for analysis
  const trimmed = line.trim();
  
  // Check if it's a JSX text node (between tags)
  if (trimmed.match(/^<[^>]+>.*<\/[^>]+>$/)) {
    return true;
  }
  
  // Check if keyword appears in a string literal or template
  const keywordIndex = line.indexOf(keyword);
  if (keywordIndex === -1) return false;
  
  // Count quotes before the keyword
  const beforeKeyword = line.substring(0, keywordIndex);
  const singleQuotes = (beforeKeyword.match(/'/g) || []).length;
  const doubleQuotes = (beforeKeyword.match(/"/g) || []).length;
  const backticks = (beforeKeyword.match(/`/g) || []).length;
  
  // If odd number of quotes before keyword, likely inside string
  if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1 || backticks % 2 === 1) {
    return true;
  }
  
  // Check for common string patterns
  // e.g., "retry" or 'retry' or `retry`
  const patterns = [
    /["'`][^"'`]*retry[^"'`]*["'`]/i,
    /["'`][^"'`]*timeout[^"'`]*["'`]/i,
    /["'`][^"'`]*max_tokens[^"'`]*["'`]/i,
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(line)) {
      return true;
    }
  }
  
  // Check for URL patterns (common in examples)
  // Note: This checks if the entire line is primarily a URL/documentation
  // Lines with both URLs and code will need more sophisticated parsing
  if (/^[\s"'`]*https?:\/\//.test(line)) {
    return true;
  }
  
  // Check for comment patterns
  if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) {
    return true;
  }
  
  return false;
}

/**
 * Helper to check if line is actual code (not string, comment, or JSX text)
 */
function isActualCode(line: string, keyword: string): boolean {
  return !isLikelyInString(line, keyword);
}

export interface ScanIssue {
  type: 'streaming' | 'retry' | 'timeout' | '429' | 'cost' | 'traceability';
  severity: 'error' | 'warning' | 'info';
  file: string;
  line: number;
  message: string;
  suggestion?: string;
  canFixLocally: boolean;
}

export interface ScanResult {
  issues: ScanIssue[];
  filesScanned: number;
  gatewayLayerIssues: ScanIssue[];
}

/**
 * Scan a directory for AI API issues
 */
export async function scanCodebase(targetDir: string): Promise<ScanResult> {
  const issues: ScanIssue[] = [];
  const gatewayLayerIssues: ScanIssue[] = [];
  let filesScanned = 0;

  const files = findSourceFiles(targetDir);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    // Scan for issues
    scanFileForIssues(file, lines, issues, gatewayLayerIssues);
    filesScanned++;
  }

  return {
    issues,
    filesScanned,
    gatewayLayerIssues
  };
}

/**
 * Find source files to scan (JS, TS, Python)
 */
function findSourceFiles(dir: string): string[] {
  const files: string[] = [];
  const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py'];
  const excludeDirs = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', 'venv', '.ai-patch', '.next'];

  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) {
      return;
    }

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      // Exclude ai-doctor module itself to avoid scanning/modifying tool code
      if (fullPath.includes('/ai-doctor/node/') || 
          fullPath.includes('/ai-doctor/python/') ||
          fullPath.includes('\\ai-doctor\\node\\') ||
          fullPath.includes('\\ai-doctor\\python\\')) {
        continue;
      }
      
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Scan a single file for issues
 */
function scanFileForIssues(
  file: string,
  lines: string[],
  issues: ScanIssue[],
  gatewayLayerIssues: ScanIssue[]
): void {
  const isOpenAICall = lines.some(line => 
    line.includes('openai.') || 
    line.includes('OpenAI(') ||
    line.includes('createCompletion') ||
    line.includes('chat.completions')
  );

  const isAnthropicCall = lines.some(line =>
    line.includes('anthropic.') ||
    line.includes('Anthropic(') ||
    line.includes('messages.create')
  );

  if (!isOpenAICall && !isAnthropicCall) {
    return; // Not an AI API file
  }

  // Check for streaming issues
  checkStreamingIssues(file, lines, issues);
  
  // Check for retry/backoff issues
  checkRetryIssues(file, lines, issues, gatewayLayerIssues);
  
  // Check for timeout issues
  checkTimeoutIssues(file, lines, issues);
  
  // Check for 429 handling
  check429Handling(file, lines, issues, gatewayLayerIssues);
  
  // Check for cost issues
  checkCostIssues(file, lines, issues);
  
  // Check for traceability
  checkTraceabilityIssues(file, lines, issues, gatewayLayerIssues);
}

function checkStreamingIssues(file: string, lines: string[], issues: ScanIssue[]): void {
  const hasStreaming = lines.some(line => 
    line.includes('stream: true') || 
    line.includes("stream=True")
  );

  if (!hasStreaming) {
    return;
  }

  // Check for SSE headers
  const hasSSEHeaders = lines.some(line =>
    line.includes('text/event-stream') ||
    line.includes('X-Accel-Buffering')
  );

  if (!hasSSEHeaders) {
    const lineNum = lines.findIndex(line => 
      line.includes('stream: true') || line.includes('stream=True')
    );
    
    issues.push({
      type: 'streaming',
      severity: 'warning',
      file,
      line: lineNum + 1,
      message: 'Streaming enabled but no SSE headers configured',
      suggestion: 'Add Content-Type: text/event-stream and X-Accel-Buffering: no headers',
      canFixLocally: true
    });
  }

  // Check for buffering issues
  const hasFlush = lines.some(line =>
    line.includes('flush()') ||
    line.includes('autoFlush')
  );

  if (!hasFlush) {
    const lineNum = lines.findIndex(line => 
      line.includes('stream: true') || line.includes('stream=True')
    );
    
    issues.push({
      type: 'streaming',
      severity: 'info',
      file,
      line: lineNum + 1,
      message: 'No explicit flush() calls detected for streaming',
      suggestion: 'Consider adding explicit flush() for better streaming performance',
      canFixLocally: true
    });
  }
}

function checkRetryIssues(
  file: string,
  lines: string[],
  issues: ScanIssue[],
  gatewayLayerIssues: ScanIssue[]
): void {
  // Filter out lines that are likely in strings or comments
  const hasRetry = lines.some(line =>
    isActualCode(line, 'retry') && (
      line.includes('retry') ||
      line.includes('attempt') ||
      (line.includes('for') && line.includes('range'))
    )
  );

  if (!hasRetry) {
    const apiCallLine = lines.findIndex(line =>
      line.includes('.create(') || line.includes('completions')
    );
    
    if (apiCallLine >= 0) {
      issues.push({
        type: 'retry',
        severity: 'warning',
        file,
        line: apiCallLine + 1,
        message: 'No retry logic detected for API calls',
        suggestion: 'Add exponential backoff with jitter',
        canFixLocally: true
      });
    }
  } else {
    // Check for exponential backoff
    const hasExponentialBackoff = lines.some(line =>
      isActualCode(line, 'retry') && (
        line.includes('**') || 
        line.includes('Math.pow') ||
        line.includes('pow(')
      )
    );

    if (!hasExponentialBackoff) {
      const retryLine = lines.findIndex(line => 
        isActualCode(line, 'retry') && line.includes('retry')
      );
      
      if (retryLine >= 0) {
        issues.push({
          type: 'retry',
          severity: 'warning',
          file,
          line: retryLine + 1,
          message: 'Linear retry detected - should use exponential backoff',
          suggestion: 'Use exponential backoff: 2^attempt * base_delay',
          canFixLocally: true
        });
      }
    }

    // Check for retry cap
    const hasRetryCap = lines.some(line =>
      isActualCode(line, 'retry') && (
        line.includes('max_retries') ||
        line.includes('maxRetries') ||
        (line.includes('< ') && line.includes('attempt'))
      )
    );

    if (!hasRetryCap) {
      const retryLine = lines.findIndex(line => 
        isActualCode(line, 'retry') && line.includes('retry')
      );
      
      if (retryLine >= 0) {
        gatewayLayerIssues.push({
          type: 'retry',
          severity: 'error',
          file,
          line: retryLine + 1,
          message: 'No retry cap detected - risk of infinite retry storms',
          suggestion: 'This requires gateway-layer enforcement',
          canFixLocally: false
        });
      }
    }

    // Check for jitter
    const hasJitter = lines.some(line =>
      isActualCode(line, 'retry') && (
        line.includes('random') ||
        line.includes('Math.random') ||
        line.includes('jitter')
      )
    );

    if (!hasJitter) {
      const retryLine = lines.findIndex(line => 
        isActualCode(line, 'retry') && line.includes('retry')
      );
      
      if (retryLine >= 0) {
        issues.push({
          type: 'retry',
          severity: 'info',
          file,
          line: retryLine + 1,
          message: 'No jitter detected in retry logic',
          suggestion: 'Add random jitter to prevent thundering herd',
          canFixLocally: true
        });
      }
    }
  }
}

function checkTimeoutIssues(file: string, lines: string[], issues: ScanIssue[]): void {
  const hasTimeout = lines.some(line =>
    isActualCode(line, 'timeout') && (
      line.includes('timeout') ||
      line.includes('Timeout')
    )
  );

  if (!hasTimeout) {
    const apiCallLine = lines.findIndex(line =>
      line.includes('.create(') || line.includes('completions')
    );
    
    if (apiCallLine >= 0) {
      issues.push({
        type: 'timeout',
        severity: 'error',
        file,
        line: apiCallLine + 1,
        message: 'No timeout configured - risk of hung requests',
        suggestion: 'Add timeout: 60000 (60s) for API calls',
        canFixLocally: true
      });
    }
  } else {
    // Check ALL timeout lines (not just the first one)
    const isPython = file.endsWith('.py');
    // Python: 10 seconds, JS/TS: 10000 milliseconds (10 seconds)
    const timeoutThresholdLow = isPython ? 10 : 10000;
    
    lines.forEach((line, index) => {
      if (!isActualCode(line, 'timeout') || !line.includes('timeout')) {
        return;
      }
      
      const match = line.match(/timeout[:\s=]+(\d+)/);
      if (match) {
        const timeout = parseInt(match[1], 10);
        
        if (timeout < timeoutThresholdLow) {
          const unit = isPython ? 's' : 'ms';
          const suggestion = isPython 
            ? 'Increase timeout to at least 30s' 
            : 'Increase timeout to at least 30000ms (30s)';
          
          issues.push({
            type: 'timeout',
            severity: 'warning',
            file,
            line: index + 1,
            message: `Timeout ${timeout}${unit} is too low for AI APIs`,
            suggestion,
            canFixLocally: true
          });
        }
      }
    });
  }
}

function check429Handling(
  file: string,
  lines: string[],
  issues: ScanIssue[],
  gatewayLayerIssues: ScanIssue[]
): void {
  const has429Handling = lines.some(line =>
    line.includes('429') ||
    line.includes('RateLimitError') ||
    line.includes('rate_limit')
  );

  if (!has429Handling) {
    const apiCallLine = lines.findIndex(line =>
      line.includes('.create(') || line.includes('completions')
    );
    
    if (apiCallLine >= 0) {
      gatewayLayerIssues.push({
        type: '429',
        severity: 'error',
        file,
        line: apiCallLine + 1,
        message: 'No 429 rate limit handling detected',
        suggestion: 'This requires gateway-layer rate limiting',
        canFixLocally: false
      });
    }
  }

  // Check for Retry-After header handling
  const hasRetryAfter = lines.some(line =>
    line.includes('Retry-After') ||
    line.includes('retry-after')
  );

  if (!hasRetryAfter && has429Handling) {
    const line429 = lines.findIndex(line => line.includes('429'));
    
    issues.push({
      type: '429',
      severity: 'warning',
      file,
      line: line429 + 1,
      message: 'Retry-After header not respected in 429 handling',
      suggestion: 'Respect Retry-After header from provider',
      canFixLocally: true
    });
  }
}

function checkCostIssues(file: string, lines: string[], issues: ScanIssue[]): void {
  const hasMaxTokens = lines.some(line =>
    isActualCode(line, 'max_tokens') && (
      line.includes('max_tokens') ||
      line.includes('maxTokens')
    )
  );

  if (!hasMaxTokens) {
    const apiCallLine = lines.findIndex(line =>
      line.includes('.create(') || line.includes('completions')
    );
    
    if (apiCallLine >= 0) {
      issues.push({
        type: 'cost',
        severity: 'error',
        file,
        line: apiCallLine + 1,
        message: 'No max_tokens limit set - risk of runaway costs',
        suggestion: 'Add max_tokens: 1000 or appropriate limit',
        canFixLocally: true
      });
    }
  } else {
    // Check if max_tokens is too high
    const maxTokensLine = lines.find(line => 
      isActualCode(line, 'max_tokens') && (
        line.includes('max_tokens') || line.includes('maxTokens')
      )
    );
    
    if (maxTokensLine) {
      const match = maxTokensLine.match(/max_?tokens[:\s=]+(\d+)/i);
      if (match) {
        const tokens = parseInt(match[1], 10);
        if (tokens > 4000) {
          const lineNum = lines.indexOf(maxTokensLine);
          issues.push({
            type: 'cost',
            severity: 'warning',
            file,
            line: lineNum + 1,
            message: `max_tokens=${tokens} is very high - potential cost risk`,
            suggestion: 'Consider lowering max_tokens or adding cost tracking',
            canFixLocally: true
          });
        }
      }
    }
  }
}

function checkTraceabilityIssues(
  file: string,
  lines: string[],
  issues: ScanIssue[],
  gatewayLayerIssues: ScanIssue[]
): void {
  const hasRequestId = lines.some(line =>
    line.includes('request_id') ||
    line.includes('requestId') ||
    line.includes('correlation_id') ||
    line.includes('correlationId')
  );

  if (!hasRequestId) {
    const apiCallLine = lines.findIndex(line =>
      line.includes('.create(') || line.includes('completions')
    );
    
    if (apiCallLine >= 0) {
      issues.push({
        type: 'traceability',
        severity: 'warning',
        file,
        line: apiCallLine + 1,
        message: 'No request ID tracking detected',
        suggestion: 'Add request_id or correlation_id for tracing',
        canFixLocally: true
      });
    }
  }

  // Check for idempotency keys
  const hasIdempotencyKey = lines.some(line =>
    line.includes('idempotency') ||
    line.includes('Idempotency-Key')
  );

  if (!hasIdempotencyKey) {
    const apiCallLine = lines.findIndex(line =>
      line.includes('.create(') || line.includes('completions')
    );
    
    if (apiCallLine >= 0) {
      gatewayLayerIssues.push({
        type: 'traceability',
        severity: 'info',
        file,
        line: apiCallLine + 1,
        message: 'No idempotency keys - cannot prevent duplicate charges',
        suggestion: 'This requires gateway-layer receipt tracking',
        canFixLocally: false
      });
    }
  }
}

/**
 * Print scan results
 */
export function printScanResults(result: ScanResult): void {
  console.log(`\n📁 Scanned ${result.filesScanned} files\n`);

  if (result.issues.length === 0 && result.gatewayLayerIssues.length === 0) {
    console.log(' No issues found!\n');
    return;
  }

  // Group by type
  const byType = new Map<string, ScanIssue[]>();
  
  for (const issue of result.issues) {
    const issues = byType.get(issue.type) || [];
    issues.push(issue);
    byType.set(issue.type, issues);
  }

  console.log(' Issues Found:\n');
  
  for (const [type, issues] of byType.entries()) {
    console.log(`${type.toUpperCase()} (${issues.length}):`);
    for (const issue of issues) {
      const relativePath = path.relative(process.cwd(), issue.file);
      console.log(`  ${issue.severity === 'error' ? '' : issue.severity === 'warning' ? '' : ''} ${relativePath}:${issue.line}`);
      console.log(`     ${issue.message}`);
      if (issue.suggestion) {
        console.log(`      ${issue.suggestion}`);
      }
    }
    console.log('');
  }

  // Gateway layer issues
  if (result.gatewayLayerIssues.length > 0) {
    console.log('🌐 Gateway-Layer Issues (cannot be fixed in app code):\n');
    
    for (const issue of result.gatewayLayerIssues) {
      const relativePath = path.relative(process.cwd(), issue.file);
      console.log(`  ${issue.severity === 'error' ? '' : ''} ${relativePath}:${issue.line}`);
      console.log(`     ${issue.message}`);
      if (issue.suggestion) {
        console.log(`      ${issue.suggestion}`);
      }
    }
    console.log('');
  }
}
