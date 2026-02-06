/**
 * Code Fixer - Applies local patches to fix AI API issues
 * 
 * Applies safe, surgical code patches to fix issues found by scanner:
 * - Add timeouts
 * - Add exponential backoff with jitter
 * - Fix SSE headers
 * - Add request ID tracking
 * - Add max_tokens limits
 */

import fs from 'fs';
import path from 'path';
import { ScanIssue } from './scanner';

export interface FixResult {
  applied: number;
  skipped: number;
  manual: number;
  error: number;
  details: Array<{
    file: string;
    line: number | null;
    type: string;
    status: 'applied' | 'skipped' | 'manual' | 'error';
    message: string;
  }>;
}

export interface FixPreview {
  file: string;
  originalContent: string;
  modifiedContent: string;
  issuesFixed: ScanIssue[];
}

export interface PreviewResult {
  previews: FixPreview[];
  totalFixes: number;
  skipped: number;
}

/**
 * Preview what fixes would be applied without modifying files
 */
export async function previewFixes(issues: ScanIssue[]): Promise<PreviewResult> {
  const result: PreviewResult = {
    previews: [],
    totalFixes: 0,
    skipped: 0
  };

  // Group issues by file
  const byFile = new Map<string, ScanIssue[]>();
  for (const issue of issues) {
    if (!issue.canFixLocally) {
      result.skipped++;
      continue;
    }

    const fileIssues = byFile.get(issue.file) || [];
    fileIssues.push(issue);
    byFile.set(issue.file, fileIssues);
  }

  // Generate previews for each file
  for (const [file, fileIssues] of byFile.entries()) {
    try {
      const originalContent = fs.readFileSync(file, 'utf-8');
      let lines = originalContent.split('\n');
      
      // Sort issues by line number (descending) to avoid offset issues
      fileIssues.sort((a, b) => b.line - a.line);
      
      const fixedIssues: ScanIssue[] = [];
      
      for (const issue of fileIssues) {
        const fixResult = applyFix(lines, issue);
        
        if (fixResult.success) {
          lines = fixResult.lines;
          fixedIssues.push(issue);
          result.totalFixes++;
        }
      }
      
      if (fixedIssues.length > 0) {
        result.previews.push({
          file,
          originalContent,
          modifiedContent: lines.join('\n'),
          issuesFixed: fixedIssues
        });
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  return result;
}

/**
 * Print preview of changes with diff
 */
export function printPreview(preview: PreviewResult): void {
  if (preview.previews.length === 0) {
    console.log('  No fixable issues found.\n');
    return;
  }

  console.log(`\n Proposed Changes (${preview.totalFixes} fixes across ${preview.previews.length} file(s)):\n`);

  for (const filePreview of preview.previews) {
    const relativePath = path.relative(process.cwd(), filePreview.file);
    console.log(`📄 ${relativePath}`);
    console.log(`   Issues fixed: ${filePreview.issuesFixed.map(i => i.type).join(', ')}\n`);
    
    // Show a simple before/after indicator
    const originalLines = filePreview.originalContent.split('\n').length;
    const modifiedLines = filePreview.modifiedContent.split('\n').length;
    const linesDiff = modifiedLines - originalLines;
    
    if (linesDiff > 0) {
      console.log(`   Lines: ${originalLines} → ${modifiedLines} (+${linesDiff} lines added)\n`);
    } else if (linesDiff < 0) {
      console.log(`   Lines: ${originalLines} → ${modifiedLines} (${-linesDiff} lines removed)\n`);
    } else {
      console.log(`   Lines: ${originalLines} (modified in place)\n`);
    }
  }

  if (preview.skipped > 0) {
    console.log(`⏭️  Skipped ${preview.skipped} issue(s) that require gateway-layer fixes\n`);
  }
}

/**
 * Apply fixes to issues found by scanner
 */
export async function applyFixes(issues: ScanIssue[], dryRun: boolean = false): Promise<FixResult> {
  const result: FixResult = {
    applied: 0,
    skipped: 0,
    manual: 0,
    error: 0,
    details: []
  };

  // Deduplicate issues by file, line, and type
  const deduped = new Map<string, ScanIssue>();
  for (const issue of issues) {
    const key = `${issue.file}:${issue.line}:${issue.type}`;
    if (!deduped.has(key)) {
      deduped.set(key, issue);
    }
  }
  const uniqueIssues = Array.from(deduped.values());

  // Group issues by file
  const byFile = new Map<string, ScanIssue[]>();
  for (const issue of uniqueIssues) {
    if (!issue.canFixLocally) {
      result.skipped++;
      result.details.push({
        file: issue.file,
        line: issue.line,
        type: issue.type,
        status: 'skipped',
        message: 'Gateway-layer issue (cannot fix in code)'
      });
      continue;
    }

    const fileIssues = byFile.get(issue.file) || [];
    fileIssues.push(issue);
    byFile.set(issue.file, fileIssues);
  }

  // Apply fixes file by file
  for (const [file, fileIssues] of byFile.entries()) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      let lines = content.split('\n');
      let modifiedCount = 0;
      
      // Sort issues by line number (descending) to avoid offset issues
      fileIssues.sort((a, b) => b.line - a.line);
      
      for (const issue of fileIssues) {
        const fixResult = applyFix(lines, issue);
        
        if (fixResult.success) {
          lines = fixResult.lines;
          modifiedCount++;
          result.applied++;
          result.details.push({
            file: issue.file,
            line: issue.line,
            type: issue.type,
            status: 'applied',
            message: fixResult.message || 'Applied fix'
          });
        } else if (fixResult.requiresManual) {
          result.manual++;
          result.details.push({
            file: issue.file,
            line: issue.line,
            type: issue.type,
            status: 'manual',
            message: fixResult.message || 'Requires manual configuration'
          });
        } else {
          result.error++;
          result.details.push({
            file: issue.file,
            line: issue.line,
            type: issue.type,
            status: 'error',
            message: fixResult.message || 'Failed to apply fix'
          });
        }
      }
      
      // Write back to file
      if (!dryRun && modifiedCount > 0) {
        fs.writeFileSync(file, lines.join('\n'), 'utf-8');
      }
    } catch (error) {
      result.error++;
      result.details.push({
        file,
        line: null,
        type: 'error',
        status: 'error',
        message: `Failed to process file: ${error}`
      });
    }
  }

  return result;
}

interface FixApplyResult {
  success: boolean;
  requiresManual?: boolean;
  lines: string[];
  message?: string;
}

/**
 * Helper: Find the position to insert imports (after shebang/encoding)
 */
function findImportInsertPosition(lines: string[]): number {
  let pos = 0;
  
  // Skip shebang if present
  if (lines[0]?.startsWith('#!')) {
    pos = 1;
  }
  
  // Skip encoding declaration if present (Python)
  if (lines[pos]?.includes('# -*- coding:') || lines[pos]?.includes('# coding:')) {
    pos++;
  }
  
  // Skip existing imports to add at the end of import block
  while (pos < lines.length && (lines[pos]?.startsWith('import ') || lines[pos]?.startsWith('from ') || lines[pos]?.trim() === '')) {
    pos++;
  }
  
  return pos;
}

/**
 * Helper: Find the full multi-line statement starting at lineIdx
 * Returns the ending line index (inclusive)
 */
function findStatementEnd(lines: string[], startIdx: number): number {
  let endIdx = startIdx;
  let openParens = 0;
  let openBraces = 0;
  let openBrackets = 0;
  
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    
    // Count opening and closing brackets
    for (const char of line) {
      if (char === '(') openParens++;
      else if (char === ')') openParens--;
      else if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
    }
    
    endIdx = i;
    
    // If all brackets are closed, we've found the end
    if (openParens === 0 && openBraces === 0 && openBrackets === 0) {
      // Check if line ends with semicolon or is a complete statement
      if (line.trim().endsWith(';') || line.trim().endsWith(')') || 
          line.trim().endsWith('}') || line.trim().endsWith(']')) {
        break;
      }
      // For Python, check if next line is not indented more (end of statement)
      if (i + 1 < lines.length) {
        const currentIndent = line.match(/^\s*/)?.[0].length || 0;
        const nextIndent = lines[i + 1].match(/^\s*/)?.[0].length || 0;
        if (nextIndent <= currentIndent && lines[i + 1].trim() !== '') {
          break;
        }
      }
    }
    
    // Safety: don't go more than 50 lines
    if (i - startIdx > 50) break;
  }
  
  return endIdx;
}

/**
 * Helper: Check if a line index is inside a function call (e.g., .create(...))
 */
function isInsideFunctionCall(lines: string[], lineIdx: number): boolean {
  // Look backwards to find if we're inside a .create( call
  let openParens = 0;
  
  for (let i = lineIdx; i >= Math.max(0, lineIdx - 10); i--) {
    const line = lines[i];
    
    // Count parens from this line to lineIdx
    if (i === lineIdx) {
      for (const char of line) {
        if (char === '(') openParens++;
        else if (char === ')') openParens--;
      }
    } else {
      for (const char of line) {
        if (char === '(') openParens++;
        else if (char === ')') openParens--;
      }
    }
    
    // If we find a .create( and we have unclosed parens, we're inside
    if (line.includes('.create(') && openParens > 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Apply a single fix to file lines
 */
function applyFix(lines: string[], issue: ScanIssue): FixApplyResult {
  const lineIdx = issue.line - 1; // Convert to 0-based index
  
  // Check for invalid line number
  if (lineIdx < 0 || lineIdx >= lines.length) {
    return {
      success: false,
      requiresManual: true,
      lines,
      message: 'Invalid line number - manual review required'
    };
  }

  switch (issue.type) {
    case 'timeout':
      return addTimeout(lines, lineIdx, issue);
    case 'retry':
      return addRetryLogic(lines, lineIdx, issue);
    case 'streaming':
      return fixStreaming(lines, lineIdx, issue);
    case 'cost':
      return addMaxTokens(lines, lineIdx, issue);
    case 'traceability':
      return addRequestId(lines, lineIdx, issue);
    case '429':
      // 429 handling is gateway-layer, provide manual guidance
      return {
        success: false,
        requiresManual: true,
        lines,
        message: '429 rate-limit handling requires gateway-layer solution (AI Badgr)'
      };
    default:
      return {
        success: false,
        lines,
        message: `Unknown issue type: ${issue.type}`
      };
  }
}

function addTimeout(lines: string[], lineIdx: number, issue: ScanIssue): FixApplyResult {
  const line = lines[lineIdx];
  
  // Check if this is a JS/TS or Python file
  const isPython = issue.file.endsWith('.py');
  
  if (isPython) {
    // Python: add timeout parameter
    if (line.includes('.create(')) {
      // Add timeout to function call
      const newLine = line.replace(/\.create\((.*?)\)/, (match, params) => {
        return `.create(${params}, timeout=60.0)`;
      });
      
      lines[lineIdx] = newLine;
      return {
        success: true,
        lines,
        message: 'Added timeout=60.0'
      };
    }
  } else {
    // JavaScript/TypeScript: add timeout to config
    if (line.includes('new OpenAI(') || line.includes('new Anthropic(')) {
      // Look for config object
      let configLineIdx = lineIdx;
      while (configLineIdx < lines.length && !lines[configLineIdx].includes('}')) {
        configLineIdx++;
      }
      
      if (configLineIdx < lines.length) {
        // Add timeout before closing brace
        const indent = lines[configLineIdx].match(/^\s*/)?.[0] || '';
        lines.splice(configLineIdx, 0, `${indent}  timeout: 60000, // 60s`);
        return {
          success: true,
          lines,
          message: 'Added timeout: 60000ms'
        };
      }
    } else if (line.includes('.create(')) {
      // Add timeout to API call options
      const newLine = line.replace(/\.create\((.*?)\)/, (match, params) => {
        // Try to find options object
        if (params.includes('{')) {
          return match.replace(/}\s*\)/, ', timeout: 60000 })');
        } else {
          return `.create(${params}, { timeout: 60000 })`;
        }
      });
      
      if (newLine !== line) {
        lines[lineIdx] = newLine;
        return {
          success: true,
          lines,
          message: 'Added timeout: 60000ms'
        };
      }
    }
  }
  
  return {
    success: false,
    requiresManual: true,
    lines,
    message: 'Could not find suitable place to add timeout - manual review required'
  };
}

function addRetryLogic(lines: string[], lineIdx: number, issue: ScanIssue): FixApplyResult {
  const line = lines[lineIdx];
  const isPython = issue.file.endsWith('.py');
  
  // Different fixes for different retry issues
  if (issue.message.includes('Linear retry')) {
    // Fix linear retry to exponential - BUG FIX: only replace if sleep/setTimeout actually found
    if (isPython) {
      // Find the sleep/delay line
      let sleepLineIdx = lineIdx;
      let foundSleep = false;
      
      while (sleepLineIdx < lines.length && !lines[sleepLineIdx].includes('sleep')) {
        sleepLineIdx++;
        if (sleepLineIdx - lineIdx > 10) break;
      }
      
      // BUG FIX: Only replace if we actually found a sleep line
      if (sleepLineIdx < lines.length && lines[sleepLineIdx].includes('sleep')) {
        foundSleep = true;
        const indent = lines[sleepLineIdx].match(/^\s*/)?.[0] || '';
        lines[sleepLineIdx] = `${indent}time.sleep((2 ** attempt) * 1 + random.uniform(0, 1))  # Exponential backoff with jitter`;
        
        // Add imports if needed at proper position
        const importPos = findImportInsertPosition(lines);
        if (!lines.some(l => l.includes('import random'))) {
          lines.splice(importPos, 0, 'import random');
        }
        if (!lines.some(l => l.includes('import time'))) {
          lines.splice(importPos, 0, 'import time');
        }
        
        return {
          success: true,
          lines,
          message: 'Changed to exponential backoff with jitter'
        };
      }
      
      // BUG FIX: If sleep not found, return manual review instead of replacing wrong line
      if (!foundSleep) {
        return {
          success: false,
          requiresManual: true,
          lines,
          message: 'Could not find sleep statement to replace - manual review required'
        };
      }
    } else {
      // JavaScript/TypeScript
      let sleepLineIdx = lineIdx;
      let foundSleep = false;
      
      while (sleepLineIdx < lines.length && !lines[sleepLineIdx].includes('sleep') && !lines[sleepLineIdx].includes('setTimeout')) {
        sleepLineIdx++;
        if (sleepLineIdx - lineIdx > 10) break;
      }
      
      // BUG FIX: Only replace if we actually found a sleep/setTimeout line
      if (sleepLineIdx < lines.length && (lines[sleepLineIdx].includes('sleep') || lines[sleepLineIdx].includes('setTimeout'))) {
        foundSleep = true;
        const indent = lines[sleepLineIdx].match(/^\s*/)?.[0] || '';
        lines[sleepLineIdx] = `${indent}await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000 + Math.random() * 1000)); // Exponential backoff with jitter`;
        
        return {
          success: true,
          lines,
          message: 'Changed to exponential backoff with jitter'
        };
      }
      
      // BUG FIX: If sleep/setTimeout not found, return manual review instead of replacing wrong line
      if (!foundSleep) {
        return {
          success: false,
          requiresManual: true,
          lines,
          message: 'Could not find sleep/setTimeout statement to replace - manual review required'
        };
      }
    }
  } else if (issue.message.includes('No retry logic')) {
    // Add basic retry wrapper - BUG FIX: wrap full multi-line statement
    const indent = line.match(/^\s*/)?.[0] || '';
    
    // BUG FIX: Find the complete statement, not just one line
    const endIdx = findStatementEnd(lines, lineIdx);
    const statementLines = lines.slice(lineIdx, endIdx + 1);
    const fullStatement = statementLines.join('\n');
    
    if (isPython) {
      // Indent the full statement for the try block
      const indentedStatement = statementLines.map(l => `${indent}    ${l.trim()}`).join('\n');
      
      const retryCode = [
        `${indent}max_retries = 3`,
        `${indent}for attempt in range(max_retries):`,
        `${indent}  try:`,
        ...indentedStatement.split('\n'),
        `${indent}    break`,
        `${indent}  except Exception as e:`,
        `${indent}    if attempt == max_retries - 1:`,
        `${indent}      raise`,
        `${indent}    time.sleep((2 ** attempt) * 1 + random.uniform(0, 1))`
      ];
      
      // Replace the full statement with retry-wrapped version
      lines.splice(lineIdx, endIdx - lineIdx + 1, ...retryCode);
      
      // Add imports at proper position
      const importPos = findImportInsertPosition(lines);
      if (!lines.some(l => l.includes('import random'))) {
        lines.splice(importPos, 0, 'import random');
      }
      if (!lines.some(l => l.includes('import time'))) {
        lines.splice(importPos, 0, 'import time');
      }
      
      return {
        success: true,
        lines,
        message: 'Added retry logic with exponential backoff'
      };
    } else {
      // JavaScript/TypeScript - indent the full statement
      const indentedStatement = statementLines.map(l => `${indent}    ${l.trim()}`).join('\n');
      
      const retryCode = [
        `${indent}const maxRetries = 3;`,
        `${indent}for (let attempt = 0; attempt < maxRetries; attempt++) {`,
        `${indent}  try {`,
        ...indentedStatement.split('\n'),
        `${indent}    break;`,
        `${indent}  } catch (error) {`,
        `${indent}    if (attempt === maxRetries - 1) throw error;`,
        `${indent}    await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000 + Math.random() * 1000));`,
        `${indent}  }`,
        `${indent}}`
      ];
      
      // Replace the full statement with retry-wrapped version
      lines.splice(lineIdx, endIdx - lineIdx + 1, ...retryCode);
      
      return {
        success: true,
        lines,
        message: 'Added retry logic with exponential backoff'
      };
    }
  } else if (issue.message.includes('No jitter')) {
    // Add jitter to existing retry
    // This is similar to fixing linear retry
    return addRetryLogic(lines, lineIdx, { ...issue, message: 'Linear retry detected' });
  }
  
  return {
    success: false,
    requiresManual: true,
    lines,
    message: 'Could not apply retry fix - manual review required'
  };
}

function fixStreaming(lines: string[], lineIdx: number, issue: ScanIssue): FixApplyResult {
  const line = lines[lineIdx];
  
  if (issue.message.includes('SSE headers')) {
    // SSE headers are framework-specific (Express, Next.js, FastAPI, etc.)
    // Cannot be safely added without knowing the framework
    return {
      success: false,
      requiresManual: true,
      lines,
      message: 'SSE header configuration is framework-specific. For Express: res.setHeader("Content-Type", "text/event-stream"); For Next.js: Add headers in next.config.js; For FastAPI: Use StreamingResponse with media_type="text/event-stream"'
    };
  } else if (issue.message.includes('flush')) {
    // Add flush call if possible - BUG FIX: check if inside function call
    const indent = line.match(/^\s*/)?.[0] || '';
    
    if (issue.file.endsWith('.py')) {
      // BUG FIX: Check if we're inside a .create() call
      if (isInsideFunctionCall(lines, lineIdx)) {
        return {
          success: false,
          requiresManual: true,
          lines,
          message: 'Cannot insert flush() inside function call - insert after the stream consumption loop manually'
        };
      }
      
      // Find a safe position after the .create() call
      // Look for the end of the statement first
      const statementEnd = findStatementEnd(lines, lineIdx);
      const insertPos = statementEnd + 1;
      
      if (insertPos < lines.length) {
        lines.splice(insertPos, 0, `${indent}sys.stdout.flush()  # Ensure streaming chunks are sent immediately`);
        
        // Add import at proper position
        if (!lines.some(l => l.includes('import sys'))) {
          const importPos = findImportInsertPosition(lines);
          lines.splice(importPos, 0, 'import sys');
        }
        
        return {
          success: true,
          lines,
          message: 'Added flush() call after stream creation'
        };
      }
    }
  }
  
  return {
    success: false,
    requiresManual: true,
    lines,
    message: 'Streaming fix requires manual framework-specific configuration'
  };
}

function addMaxTokens(lines: string[], lineIdx: number, issue: ScanIssue): FixApplyResult {
  const line = lines[lineIdx];
  const isPython = issue.file.endsWith('.py');
  
  if (issue.message.includes('No max_tokens')) {
    // Add max_tokens parameter
    if (line.includes('.create(')) {
      if (isPython) {
        const newLine = line.replace(/\.create\((.*?)\)/, (match, params) => {
          return `.create(${params}, max_tokens=1000)`;
        });
        
        lines[lineIdx] = newLine;
        return {
          success: true,
          lines,
          message: 'Added max_tokens=1000'
        };
      } else {
        const newLine = line.replace(/\{([^}]*)\}/, (match, content) => {
          return `{ ${content}, max_tokens: 1000 }`;
        });
        
        if (newLine !== line) {
          lines[lineIdx] = newLine;
          return {
            success: true,
            lines,
            message: 'Added max_tokens: 1000'
          };
        }
      }
    }
  } else if (issue.message.includes('is very high')) {
    // Lower max_tokens
    const match = issue.message.match(/max_tokens=(\d+)/);
    if (match) {
      const currentValue = match[1];
      const newValue = '2000'; // Reasonable default
      
      const newLine = line.replace(
        new RegExp(`max_?tokens[:\\s=]+${currentValue}`, 'i'),
        isPython ? `max_tokens=${newValue}` : `max_tokens: ${newValue}`
      );
      
      lines[lineIdx] = newLine;
      return {
        success: true,
        lines,
        message: `Lowered max_tokens to ${newValue}`
      };
    }
  }
  
  return {
    success: false,
    requiresManual: true,
    lines,
    message: 'Could not add max_tokens - manual review required'
  };
}

function addRequestId(lines: string[], lineIdx: number, issue: ScanIssue): FixApplyResult {
  const line = lines[lineIdx];
  const isPython = issue.file.endsWith('.py');
  
  if (issue.message.includes('No request ID tracking')) {
    const indent = line.match(/^\s*/)?.[0] || '';
    
    if (isPython) {
      // Add request_id generation and logging
      const requestIdCode = [
        `${indent}import uuid`,
        `${indent}request_id = str(uuid.uuid4())`,
        `${indent}print(f"Request ID: {request_id}")`,
        line
      ];
      
      lines.splice(lineIdx, 1, ...requestIdCode);
      
      // Add uuid import at proper position if not present
      if (!lines.some(l => l.includes('import uuid'))) {
        const importPos = findImportInsertPosition(lines);
        lines.splice(importPos, 0, 'import uuid');
      }
      
      return {
        success: true,
        lines,
        message: 'Added request_id tracking'
      };
    } else {
      // JavaScript/TypeScript
      const requestIdCode = [
        `${indent}const requestId = crypto.randomUUID();`,
        `${indent}console.log(\`Request ID: \${requestId}\`);`,
        line
      ];
      
      lines.splice(lineIdx, 1, ...requestIdCode);
      
      return {
        success: true,
        lines,
        message: 'Added request_id tracking'
      };
    }
  }
  
  return {
    success: false,
    requiresManual: true,
    lines,
    message: 'Could not add request ID tracking - manual review required'
  };
}

/**
 * Print fix results
 */
export function printFixResults(result: FixResult, dryRun: boolean): void {
  console.log(`\n${dryRun ? ' Dry Run Results' : ' Fix Results'}:\n`);
  console.log(`  Applied: ${result.applied}`);
  console.log(`  Manual required: ${result.manual}`);
  console.log(`  Skipped (gateway-layer): ${result.skipped}`);
  if (result.error > 0) {
    console.log(`  Errors: ${result.error}`);
  }
  console.log('');
  
  if (result.details.length > 0 && (result.manual > 0 || result.error > 0)) {
    console.log('Details:\n');
    
    for (const detail of result.details) {
      // Only show manual required and errors
      if (detail.status !== 'manual' && detail.status !== 'error') {
        continue;
      }
      
      const relativePath = path.relative(process.cwd(), detail.file);
      const lineStr = detail.line !== null ? `:${detail.line}` : ':(line unknown)';
      // Note: at this point `detail.status` is narrowed to 'manual' | 'error'
      // because we `continue` for other statuses above.
      const icon = detail.status === 'manual' ? '' : '';
      
      console.log(`  ${icon} ${relativePath}${lineStr} [${detail.type}]`);
      console.log(`     ${detail.message}`);
    }
  }
  
  if (dryRun && result.applied > 0) {
    console.log('\n Run without --dry-run to apply these fixes');
  }
}

/**
 * Print verification comparison (before/after)
 */
export function printVerificationComparison(
  beforeIssues: ScanIssue[],
  afterIssues: ScanIssue[],
  beforeGateway: ScanIssue[],
  afterGateway: ScanIssue[]
): void {
  const beforeLocal = beforeIssues.length;
  const afterLocal = afterIssues.length;
  const fixed = beforeLocal - afterLocal;
  
  console.log('\n Verification Results:\n');
  console.log(`  Local issues: ${beforeLocal} → ${afterLocal} (fixed ${fixed})`);
  console.log(`  Gateway issues remain: ${afterGateway.length}\n`);
  
  if (afterLocal > 0) {
    console.log('Remaining local issues:\n');
    
    // Group by type
    const byType = new Map<string, ScanIssue[]>();
    for (const issue of afterIssues) {
      const issues = byType.get(issue.type) || [];
      issues.push(issue);
      byType.set(issue.type, issues);
    }
    
    for (const [type, issues] of byType.entries()) {
      console.log(`  ${type.toUpperCase()} (${issues.length}):`);
      for (const issue of issues.slice(0, 3)) { // Show first 3
        const relativePath = path.relative(process.cwd(), issue.file);
        console.log(`    • ${relativePath}:${issue.line} - ${issue.message}`);
      }
      if (issues.length > 3) {
        console.log(`    ... and ${issues.length - 3} more`);
      }
    }
    console.log('');
  }
}
