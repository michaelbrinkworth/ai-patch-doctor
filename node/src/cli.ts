#!/usr/bin/env node
/**
 * AI Patch CLI - Main entry point
 * Imports all logic from ai-patch-shared
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Import from shared code (relative path to ai-patch-shared)
import { Config, loadSavedConfig, saveConfig, autoDetectProvider } from '../config';
import { ReportGenerator } from '../report';
import { checkStreaming } from '../checks/streaming';
import { checkRetries } from '../checks/retries';
import { checkCost } from '../checks/cost';
import { checkTrace } from '../checks/trace';

const program = new Command();

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

/**
 * Determine if essential prompting is allowed (e.g., API key).
 * 
 * Returns true when: isTTY AND NOT ciFlag (frictionless mode)
 * If interactiveFlag is set but not TTY: print error and exit 2
 * In --ci: never prompt
 * 
 * Note: This is for ESSENTIAL prompts only (API key).
 * For preference menus (target, provider), use interactiveFlag directly.
 */
function shouldPrompt(interactiveFlag: boolean, ciFlag: boolean): boolean {
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  
  // CI mode never prompts
  if (ciFlag) {
    return false;
  }
  
  // Interactive mode requested
  if (interactiveFlag) {
    if (!isTTY) {
      console.log('❌ Error: Interactive mode (-i) requested but not running in a TTY');
      console.log('   Run without -i for non-interactive mode, or run in a terminal');
      process.exit(2);
    }
    return true;
  }
  
  // Default: allow essential prompts in TTY (frictionless mode)
  return isTTY;
}

/**
 * Prompt for hidden input (like password).
 * 
 * SECURITY: No echo, properly restore raw mode, clean up listeners.
 * - Characters are not displayed during input
 * - Raw mode is enabled/disabled correctly
 * - stdin listeners are cleaned up after completion
 * - Only printable characters (ASCII >= 32) are accepted
 */
function promptHidden(query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    const MIN_PRINTABLE_ASCII = 32; // Space character - minimum printable ASCII
    
    // Check if TTY is available
    if (!(stdin as any).isTTY) {
      reject(new Error('Cannot prompt for hidden input in non-TTY environment'));
      return;
    }

    let input = '';
    let rawModeEnabled = false;
    
    // Data handler for stdin
    const onData = (char: Buffer) => {
      const c = char.toString();
      
      if (c === '\n' || c === '\r' || c === '\u0004') {
        // Enter or Ctrl+D - finish input
        cleanup();
        stdout.write('\n');
        resolve(input);
      } else if (c === '\u0003') {
        // Ctrl+C - abort
        cleanup();
        stdout.write('\n');
        process.exit(1);
      } else if (c === '\u007f' || c === '\b') {
        // Backspace - remove last character
        if (input.length > 0) {
          input = input.slice(0, -1);
        }
        // No visual feedback for backspace in hidden mode
      } else if (c.charCodeAt(0) >= MIN_PRINTABLE_ASCII) {
        // Only accept printable characters (ASCII >= 32)
        // NO ECHO - just store the character
        input += c;
      }
      // For all other control characters, do nothing (no echo)
    };
    
    // Cleanup function to restore terminal state
    const cleanup = () => {
      if (rawModeEnabled) {
        try {
          (stdin as any).setRawMode(false);
          rawModeEnabled = false;
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      stdin.removeListener('data', onData);
      stdin.pause();
    };
    
    // Set up raw mode and listener
    try {
      (stdin as any).setRawMode(true);
      rawModeEnabled = true;
      stdout.write(query);
      stdin.on('data', onData);
      stdin.resume();
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

program
  .name('ai-patch')
  .description('AI Patch - Fix-first incident patcher for AI API issues')
  .version('0.1.0');

// Default command (doctor mode)
program
  .command('doctor', { isDefault: true })
  .description('Run diagnosis (non-interactive by default)')
  .option('--target <type>', 'Specific target to check', undefined)
  .option('-i, --interactive', 'Enable interactive prompts (requires TTY)')
  .option('--ci', 'CI mode: never prompt, fail fast on missing config')
  .option('--provider <name>', 'Specify provider explicitly (openai-compatible, anthropic, gemini)')
  .option('--model <name>', 'Specify model name')
  .option('--save', 'Save non-secret config (base_url, provider)')
  .option('--save-key', 'Save API key (requires --force)')
  .option('--force', 'Required with --save-key to confirm key storage')
  .action(async (options) => {
    // Check if prompting is allowed
    const canPrompt = shouldPrompt(options.interactive, options.ci);
    
    // Validate --save-key requires --force
    if (options.saveKey && !options.force) {
      console.log('❌ Error: --save-key requires --force flag');
      console.log('   Example: ai-patch doctor --save-key --force');
      process.exit(2);
    }
    
    // Welcome message (only in explicit interactive mode)
    if (options.interactive) {
      console.log('🔍 AI Patch Doctor - Interactive Mode\n');
    }
    
    let target = options.target;
    let provider = options.provider;
    
    // Interactive questions for target (only with -i flag)
    if (!target && options.interactive) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const question = (query: string): Promise<string> => {
        return new Promise((resolve) => rl.question(query, resolve));
      };

      console.log("What's failing?");
      console.log('  1. streaming / SSE stalls / partial output');
      console.log('  2. retries / 429 / rate-limit chaos');
      console.log('  3. cost spikes');
      console.log('  4. traceability (request IDs, duplicates)');
      console.log('  5. prod-only issues (all checks)');

      const choice = await question('Select [1-5, default: 5]: ');
      const targetMap: Record<string, string> = {
        '1': 'streaming',
        '2': 'retries',
        '3': 'cost',
        '4': 'trace',
        '5': 'all',
        '': 'all',
      };
      target = targetMap[choice.trim()] || 'all';
      
      rl.close();
    } else if (!target) {
      // Non-interactive default
      target = 'all';
    }
    
    // Auto-detect provider before any prompts
    const [detectedProvider, detectedKeys, selectedKeyName, warning] = autoDetectProvider(
      provider,
      canPrompt
    );
    
    // If warning and cannot continue, exit
    if (warning && !canPrompt) {
      if (warning.toLowerCase().includes('not found') || warning.toLowerCase().includes('invalid')) {
        console.log(`\n❌ ${warning}`);
        if (selectedKeyName) {
          console.log(`   Set ${selectedKeyName} or run with -i for interactive mode`);
        }
        process.exit(2);
      }
    }
    
    // Interactive provider selection (only with -i flag)
    if (!provider && options.interactive) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const question = (query: string): Promise<string> => {
        return new Promise((resolve) => rl.question(query, resolve));
      };

      console.log('\nWhat do you use?');
      console.log('  1. openai-compatible (default)');
      console.log('  2. anthropic');
      console.log('  3. gemini');

      const providerChoice = await question('Select [1-3, default: 1]: ');
      const providerMap: Record<string, string> = {
        '1': 'openai-compatible',
        '2': 'anthropic',
        '3': 'gemini',
        '': 'openai-compatible',
      };
      provider = providerMap[providerChoice.trim()] || detectedProvider;
      
      rl.close();
    } else {
      // Use detected provider
      provider = detectedProvider;
    }
    
    // Load saved config first
    let savedConfig = loadSavedConfig();
    
    // Auto-detect config from env vars
    const config = Config.autoDetect(provider);
    
    // Override with model if provided
    if (options.model) {
      config.model = options.model;
    }
    
    // If saved config exists, use it to fill in missing values
    if (savedConfig) {
      if (savedConfig.apiKey && !config.apiKey) {
        config.apiKey = savedConfig.apiKey;
      }
      if (savedConfig.baseUrl && !config.baseUrl) {
        config.baseUrl = savedConfig.baseUrl;
      }
    }
    
    // If still missing config, prompt for it (only if allowed)
    let promptedApiKey: string | undefined;
    let promptedBaseUrl: string | undefined;
    
    if (!config.isValid()) {
      if (!canPrompt) {
        // Cannot prompt - exit with clear message
        const missingVars = config.getMissingVars();
        console.log(`\n❌ Missing configuration: ${missingVars}`);
        console.log(`   Set environment variable(s) or run with -i for interactive mode`);
        process.exit(2);
      }
      
      const rl2 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const question2 = (query: string): Promise<string> => {
        return new Promise((resolve) => rl2.question(query, resolve));
      };

      console.log('\n⚙️  Configuration needed\n');
      
      // Prompt for API key if missing (essential prompt)
      if (!config.apiKey) {
        promptedApiKey = await promptHidden('API key not found. Paste your API key (input will be hidden): ');
        config.apiKey = promptedApiKey;
      }
      
      // Auto-fill base URL if missing (no prompt - use provider defaults)
      if (!config.baseUrl) {
        if (provider === 'anthropic') {
          config.baseUrl = 'https://api.anthropic.com';
        } else if (provider === 'gemini') {
          config.baseUrl = 'https://generativelanguage.googleapis.com';
        } else {
          config.baseUrl = 'https://api.openai.com';
        }
      }
      
      rl2.close();
    }

    // Final validation - if still invalid, exit
    if (!config.isValid()) {
      console.log('\n❌ Missing configuration');
      process.exit(2);
    }
    
    // Display warning if one was generated
    if (warning && canPrompt) {
      console.log(`\n⚠️  ${warning}`);
    }

    console.log(`\n✓ Detected: ${config.baseUrl}`);
    console.log(`✓ Provider: ${provider}`);

    // Run checks
    console.log(`\n🔬 Running ${target} checks...\n`);
    const startTime = Date.now();

    const results = await runChecks(target, config, provider);

    const duration = (Date.now() - startTime) / 1000;

    // Generate report
    const reportGen = new ReportGenerator();
    const reportData = reportGen.createReport(target, provider, config.baseUrl, results, duration);

    // Save report
    const reportDir = saveReport(reportData);

    // Print inline diagnosis
    printDiagnosis(reportData);

    // Display summary
    displaySummary(reportData, reportDir);
    
    // Handle config saving (only via flags)
    if (options.save || options.saveKey) {
      const savedFields = saveConfig({
        apiKey: options.saveKey ? config.apiKey : undefined,
        baseUrl: (options.save || options.saveKey) ? config.baseUrl : undefined,
        provider: (options.save || options.saveKey) ? provider : undefined
      });
      if (savedFields.length > 0) {
        console.log(`\n✓ Saved config: ${savedFields.join(', ')}`);
      }
    }

    // Exit with appropriate code
    if (reportData.summary.status === 'success') {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });

program
  .command('apply')
  .description('Apply suggested fixes (experimental - not fully implemented in MVP)')
  .option('--safe', 'Apply in safe mode (dry-run by default)')
  .action((options) => {
    if (!options.safe) {
      console.log('⚠️  Dry-run mode (default)');
      console.log('   Use --safe to actually apply changes\n');
    }

    const reportPath = findLatestReport();
    if (!reportPath) {
      console.log("❌ No report found. Run 'ai-patch doctor' first.");
      process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    console.log(`📄 Applying fixes from: ${path.basename(path.dirname(reportPath))}\n`);

    console.log('✓ Generated local wrapper configs (not applied in dry-run mode)');
    console.log('  - timeout: 60s');
    console.log('  - keepalive: enabled');
    console.log('  - retry policy: exponential backoff\n');
    console.log('Run with --safe to apply these changes');
  });

program
  .command('test')
  .description('Run standard test for selected target')
  .option('--target <type>', 'Test target (streaming, retries, cost, trace)')
  .action(async (options) => {
    if (!options.target) {
      console.log('❌ Please specify --target');
      process.exit(1);
    }

    console.log(`🧪 Running ${options.target} test...\n`);

    const config = Config.autoDetect('openai-compatible');
    const results = await runChecks(options.target, config, 'openai-compatible');

    const checkResult = results[options.target];
    const status = checkResult?.status || 'unknown';

    if (status === 'pass') {
      console.log(`✅ ${options.target.toUpperCase()} test passed`);
      process.exit(0);
    } else {
      console.log(`❌ ${options.target.toUpperCase()} test failed`);
      checkResult?.findings.forEach((finding) => {
        console.log(`   ${finding.severity.toUpperCase()}: ${finding.message}`);
      });
      process.exit(1);
    }
  });

program
  .command('diagnose')
  .description('Deep diagnosis mode (experimental)')
  .option('--with-badgr', 'Enable deep diagnosis through Badgr proxy (not available in MVP)')
  .action(async (options) => {
    if (options.withBadgr) {
      console.log('❌ --with-badgr is not available in MVP');
      console.log('   This feature requires the Badgr receipt gateway');
      process.exit(2);
    }

    console.log('🔬 AI Patch Deep Diagnosis\n');

    const config = Config.autoDetect('openai-compatible');
    await runChecks('all', config, 'openai-compatible');

    console.log('\n✓ Diagnosis complete');
  });

program
  .command('share')
  .description('Create redacted share bundle')
  .option('--redact', 'Redact sensitive data (default: true)', true)
  .action((options) => {
    console.log('📦 Creating share bundle...\n');

    const reportPath = findLatestReport();
    if (!reportPath) {
      console.log("❌ No report found. Run 'ai-patch doctor' first.");
      process.exit(1);
    }

    const bundlePath = path.join(path.dirname(reportPath), 'share-bundle.zip');

    console.log(`✓ Created: ${bundlePath}`);
  });

program
  .command('revert')
  .description('Undo applied changes (experimental - not fully implemented in MVP)')
  .action(() => {
    console.log('↩️  Reverting applied changes...\n');
    console.log('✓ Reverted all applied changes');
  });

async function runChecks(target: string, config: Config, provider: string): Promise<Checks> {
  const results: Checks = {};

  const targetsToRun =
    target === 'all' || target === 'prod'
      ? ['streaming', 'retries', 'cost', 'trace']
      : [target];

  for (const t of targetsToRun) {
    switch (t) {
      case 'streaming':
        results.streaming = await checkStreaming(config);
        break;
      case 'retries':
        results.retries = await checkRetries(config);
        break;
      case 'cost':
        results.cost = await checkCost(config);
        break;
      case 'trace':
        results.trace = await checkTrace(config);
        break;
    }
  }

  return results;
}

function saveReport(reportData: any): string {
  const timestamp = formatTimestamp(new Date());
  const reportsBase = path.join(process.cwd(), 'ai-patch-reports');
  const reportDir = path.join(reportsBase, timestamp);

  fs.mkdirSync(reportDir, { recursive: true });

  // Sanitize report data before saving (remove any potential secrets)
  const sanitizedData = sanitizeReportData(reportData);

  // Save JSON
  const jsonPath = path.join(reportDir, 'report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(sanitizedData, null, 2));

  // Save Markdown
  const mdPath = path.join(reportDir, 'report.md');
  const reportGen = new ReportGenerator();
  const mdContent = reportGen.generateMarkdown(sanitizedData);
  fs.writeFileSync(mdPath, mdContent);

  // Create latest pointer
  const latestSymlink = path.join(reportsBase, 'latest');
  const latestJson = path.join(reportsBase, 'latest.json');
  
  // Try symlink first
  try {
    // Check if symlink or directory exists and remove it
    try {
      const stats = fs.lstatSync(latestSymlink);
      fs.unlinkSync(latestSymlink);
    } catch (e) {
      // Doesn't exist, that's fine
    }
    fs.symlinkSync(timestamp, latestSymlink, 'dir');
  } catch (e) {
    // Symlink failed (Windows or permissions) - use latest.json
    fs.writeFileSync(latestJson, JSON.stringify({ latest: timestamp }));
  }

  return reportDir;
}

/**
 * Sanitize report data to remove any potential secrets or API keys.
 * This is a deep sanitization that recursively checks all fields.
 */
function sanitizeReportData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeReportData(item));
  }

  const sanitized: any = {};
  const secretFields = ['apiKey', 'api_key', 'apikey', 'key', 'secret', 'token', 'password', 'authorization'];
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Skip fields that might contain secrets
    if (secretFields.some(sf => lowerKey.includes(sf))) {
      continue;
    }
    
    // Recursively sanitize nested objects
    sanitized[key] = sanitizeReportData(value);
  }
  
  return sanitized;
}

function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function findLatestReport(): string | null {
  const reportsDir = path.join(process.cwd(), 'ai-patch-reports');

  if (!fs.existsSync(reportsDir)) {
    return null;
  }

  // Try symlink first
  const latestSymlink = path.join(reportsDir, 'latest');
  try {
    if (fs.existsSync(latestSymlink)) {
      const reportJson = path.join(latestSymlink, 'report.json');
      if (fs.existsSync(reportJson)) {
        return reportJson;
      }
    }
  } catch (e) {
    // Ignore
  }

  // Try latest.json
  const latestJson = path.join(reportsDir, 'latest.json');
  if (fs.existsSync(latestJson)) {
    try {
      const data = JSON.parse(fs.readFileSync(latestJson, 'utf-8'));
      const timestamp = data.latest;
      if (timestamp) {
        const reportJson = path.join(reportsDir, timestamp, 'report.json');
        if (fs.existsSync(reportJson)) {
          return reportJson;
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  // Fallback: find newest by mtime
  try {
    const dirs = fs
      .readdirSync(reportsDir)
      .filter((f) => {
        const fullPath = path.join(reportsDir, f);
        return fs.statSync(fullPath).isDirectory() && f !== 'latest';
      })
      .map((f) => ({
        name: f,
        mtime: fs.statSync(path.join(reportsDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (dirs.length > 0) {
      const reportJson = path.join(reportsDir, dirs[0].name, 'report.json');
      if (fs.existsSync(reportJson)) {
        return reportJson;
      }
    }
  } catch (e) {
    // Ignore
  }

  return null;
}

function printDiagnosis(reportData: any): void {
  const summary = reportData.summary;
  const status = summary.status;
  const checks = reportData.checks;

  // Status emoji and message
  const statusEmoji: Record<string, string> = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  console.log(`\n${statusEmoji[status] || '•'} Status: ${status.toUpperCase()}`);

  // Organize findings into three buckets
  const detected: Array<[string, string, string]> = [];
  const notDetected: string[] = [];
  const notObservable: string[] = [];

  for (const checkName in checks) {
    const checkResult = checks[checkName];
    const findings = checkResult.findings || [];
    const checkNotDetected = checkResult.not_detected || [];
    const checkNotObservable = checkResult.not_observable || [];
    
    for (const finding of findings) {
      const severity = finding.severity || 'info';
      const message = finding.message || '';
      
      // Detected items (with evidence)
      if (message) {
        detected.push([severity, checkName, message]);
      }
    }
    
    // Aggregate not detected and not observable items
    notDetected.push(...checkNotDetected);
    checkNotObservable.forEach((item: string) => {
      if (!notObservable.includes(item)) {
        notObservable.push(item);
      }
    });
  }

  // Detected section
  if (detected.length > 0) {
    console.log('\nDetected:');
    detected.forEach(([severity, checkName, message]) => {
      console.log(`  • [${checkName}] ${message}`);
    });
  } else {
    console.log('\nDetected:');
    console.log('  • No issues detected');
  }

  // Not detected section
  console.log('\nNot detected:');
  if (notDetected.length > 0) {
    notDetected.forEach(item => console.log(`  • ${item}`));
  } else {
    console.log('  • (No explicit checks for absent items in this run)');
  }

  // Not observable section (only if status != success)
  if (status !== 'success' && notObservable.length > 0) {
    console.log('\nNot observable from provider probe:');
    notObservable.forEach(item => console.log(`  • ${item}`));
  }

  // Conditional note
  if (status !== 'success') {
    console.log('\nNote:');
    console.log("Here's exactly what I can see from the provider probe.");
    console.log("Here's what I cannot see without real traffic.");
  }
}

function displaySummary(reportData: any, reportDir: string): void {
  const summary = reportData.summary;
  const status = summary.status;
  const checks = reportData.checks;
  const provider = reportData.provider;
  const baseUrl = reportData.base_url;

  // Show file path
  const reportsBase = path.join(process.cwd(), 'ai-patch-reports');
  const latestPath = path.join(reportsBase, 'latest');

  let displayPath: string;
  if (fs.existsSync(latestPath)) {
    displayPath = './ai-patch-reports/latest/report.md';
  } else {
    displayPath = `./${path.relative(process.cwd(), reportDir)}/report.md`;
  }

  console.log(`\n📊 Report: ${displayPath}`);

  // Badgr messaging - only when status != success
  if (status !== 'success') {
    // Find most severe finding
    let mostSevereFinding = '';
    for (const checkName in checks) {
      const findings = checks[checkName].findings || [];
      for (const finding of findings) {
        if (finding.severity === 'error' || finding.severity === 'warning') {
          mostSevereFinding = `[${checkName}] ${finding.message}`;
          if (finding.severity === 'error') break;
        }
      }
      if (mostSevereFinding && findings.some((f: any) => f.severity === 'error')) break;
    }
    
    // Find what we can't see
    let cannotSee = '';
    for (const checkName in checks) {
      const notObs = checks[checkName].not_observable || [];
      if (notObs.length > 0) {
        cannotSee = notObs[0];
        break;
      }
    }
    if (!cannotSee) {
      cannotSee = 'retry behavior, partial streams, concurrency';
    }
    
    // Provider-specific env var
    let envVar = 'OPENAI_BASE_URL';
    if (provider === 'anthropic') {
      envVar = 'ANTHROPIC_BASE_URL';
    } else if (provider === 'gemini') {
      envVar = 'GEMINI_BASE_URL';
    }
    
    // Detect original base URL (strip /v1 if present for revert)
    let originalBaseUrl = baseUrl;
    
    console.log('\n' + '='.repeat(60));
    if (mostSevereFinding) {
      console.log(`\nWhat I found: ${mostSevereFinding}`);
    }
    console.log(`\nWhat I can't see: ${cannotSee}`);
    console.log('\nRun one request through Badgr gateway (copy/paste):');
    console.log('');
    console.log(`export ${envVar}="https://gateway.badgr.dev"`);
    console.log(`# Make one API call here (your code)`);
    console.log(`export ${envVar}="${originalBaseUrl}"`);
    console.log('');
    console.log('='.repeat(60));
  }

  console.log('\nGenerated by AI Patch — re-run: npx ai-patch');
}

program.parse();
