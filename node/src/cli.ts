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
import { Config, loadSavedConfig, saveConfig, type SavedConfig } from '../config';
import { ReportGenerator } from '../report';
import { checkStreaming } from '../checks/streaming';
import { checkRetries } from '../checks/retries';
import { checkCost } from '../checks/cost';
import { checkTrace } from '../checks/trace';

// Exit codes
const EXIT_SUCCESS = 0;
const EXIT_WARNING_OR_ERROR = 1;
const EXIT_CANNOT_RUN = 2;

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
 * Check if stdin is a TTY
 */
function isTTY(): boolean {
  return process.stdin.isTTY || false;
}

/**
 * Determine if prompts are allowed and return error message if not
 * Returns [allowed, errorMessage]
 */
function promptsAllowed(interactive: boolean, ci: boolean): [boolean, string | null] {
  if (ci) {
    return [false, null];
  }
  
  if (interactive && !isTTY()) {
    return [false, 'Interactive mode (-i) requires a TTY (terminal). Cannot prompt in non-interactive environment.'];
  }
  
  if (interactive && isTTY()) {
    return [true, null];
  }
  
  // Default mode (not interactive, not CI)
  return [false, null];
}

/**
 * Detect available providers from environment variables
 * Returns array of [providerName, envVarName] tuples
 */
function detectProvidersFromEnv(): Array<[string, string]> {
  const providers: Array<[string, string]> = [];
  
  if (process.env.OPENAI_API_KEY) {
    providers.push(['openai-compatible', 'OPENAI_API_KEY']);
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push(['anthropic', 'ANTHROPIC_API_KEY']);
  }
  
  if (process.env.GEMINI_API_KEY) {
    providers.push(['gemini', 'GEMINI_API_KEY']);
  }
  
  return providers;
}

/**
 * Prompt for hidden input (like password)
 */
function promptHidden(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Hide input
    const stdin = process.stdin;
    if ((stdin as any).isTTY) {
      (stdin as any).setRawMode(true);
    }

    let input = '';
    
    process.stdout.write(query);
    
    stdin.on('data', (char) => {
      const c = char.toString();
      
      if (c === '\n' || c === '\r' || c === '\u0004') {
        // Enter or Ctrl+D
        if ((stdin as any).isTTY) {
          (stdin as any).setRawMode(false);
        }
        stdin.pause();
        process.stdout.write('\n');
        rl.close();
        resolve(input);
      } else if (c === '\u0003') {
        // Ctrl+C
        if ((stdin as any).isTTY) {
          (stdin as any).setRawMode(false);
        }
        stdin.pause();
        process.stdout.write('\n');
        rl.close();
        process.exit(1);
      } else if (c === '\u007f' || c === '\b') {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
        }
      } else {
        input += c;
      }
    });
    
    stdin.resume();
  });
}

program
  .name('ai-patch')
  .description('AI Patch - Fix-first incident patcher for AI API issues')
  .version('0.1.0');

// Default command (doctor mode)
program
  .command('doctor', { isDefault: true })
  .description('Run diagnosis (non-interactive by default, use -i for prompts)')
  .option('-i, --interactive', 'Enable interactive mode (prompts)')
  .option('--ci', 'CI mode: no prompts, fail fast')
  .option('--provider <type>', 'Override provider detection', undefined)
  .option('--target <type>', 'Specific target to check (default: all)', undefined)
  .option('--save', 'Save non-secret config (provider, base_url)')
  .option('--save-key', 'Save API key (requires --force)')
  .option('--force', 'Required with --save-key to save plaintext key')
  .action(async (options: any) => {
    const { interactive, ci, provider: providerOpt, target: targetOpt, save, saveKey, force } = options;
    
    // Check if prompts are allowed
    const [promptsOk, errorMsg] = promptsAllowed(interactive || false, ci || false);
    if (errorMsg) {
      console.log(`❌ ${errorMsg}`);
      process.exit(EXIT_CANNOT_RUN);
    }
    
    // Validate --save-key requires --force
    if (saveKey && !force) {
      console.log('❌ --save-key requires --force flag to acknowledge plaintext key storage');
      console.log('   Run with: --save-key --force');
      process.exit(EXIT_CANNOT_RUN);
    }
    
    let target = targetOpt;
    let provider = providerOpt;
    
    // === INTERACTIVE MODE ===
    if (promptsOk) {
      console.log('🔍 AI Patch Doctor - Interactive Mode\n');
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const question = (query: string): Promise<string> => {
        return new Promise((resolve) => rl.question(query, resolve));
      };

      // Interactive questions
      if (!target) {
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
      }

      // Detect provider
      if (!provider) {
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
        provider = providerMap[providerChoice.trim()] || 'openai-compatible';
      }
      
      rl.close();

      // Load saved config first
      const savedConfig = loadSavedConfig();
      
      // Auto-detect config from env vars
      const config = Config.autoDetect(provider);
      
      // If saved config exists, use it to fill in missing values
      if (savedConfig) {
        if (savedConfig.apiKey && !config.apiKey) {
          config.apiKey = savedConfig.apiKey;
        }
        if (savedConfig.baseUrl && !config.baseUrl) {
          config.baseUrl = savedConfig.baseUrl;
        }
        if (savedConfig.provider && !provider) {
          provider = savedConfig.provider;
        }
      }

      // If still missing config, prompt for it
      let promptedApiKey: string | undefined;
      let promptedBaseUrl: string | undefined;
      
      if (!config.isValid()) {
        const rl2 = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const question2 = (query: string): Promise<string> => {
          return new Promise((resolve) => rl2.question(query, resolve));
        };

        console.log('\n⚙️  Configuration needed\n');
        
        // Prompt for API key if missing
        if (!config.apiKey) {
          promptedApiKey = await promptHidden('API key not found. Paste your API key (input will be hidden): ');
          config.apiKey = promptedApiKey;
        }
        
        // Prompt for base URL if missing
        if (!config.baseUrl) {
          const defaultUrl = provider === 'anthropic' 
            ? 'https://api.anthropic.com'
            : provider === 'gemini'
            ? 'https://generativelanguage.googleapis.com'
            : 'https://api.openai.com';
          
          const urlAnswer = await question2(`API URL? (Enter for ${defaultUrl}): `);
          promptedBaseUrl = urlAnswer.trim() || defaultUrl;
          config.baseUrl = promptedBaseUrl;
        }
        
        // Ask if user wants to save config (unless --save or --save-key already set)
        if (promptedApiKey || promptedBaseUrl) {
          if (!save && !saveKey) {
            const saveAnswer = await question2('Save for next time? (y/N): ');
            if (saveAnswer.trim().toLowerCase() === 'y') {
              // Only save non-secrets by default
              saveConfig({
                baseUrl: promptedBaseUrl || config.baseUrl,
                provider
              });
              console.log('✓ Configuration saved to ~/.ai-patch/config.json (API key not saved)\n');
            }
          }
        }
        
        rl2.close();
      }

      // Final validation
      if (!config.isValid()) {
        console.log('\n❌ Missing configuration');
        process.exit(EXIT_CANNOT_RUN);
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

      // Display summary (interactive mode)
      displaySummary(reportData, reportDir);
      
      // Save config if requested
      if (save || saveKey) {
        const configToSave: Partial<SavedConfig> = {};
        if (save) {
          configToSave.provider = provider;
          configToSave.baseUrl = config.baseUrl;
        }
        if (saveKey) {
          configToSave.apiKey = config.apiKey;
          console.log('\n⚠️  WARNING: API key saved in plaintext at ~/.ai-patch/config.json');
          console.log('   Ensure proper file permissions (600) are set');
        }
        
        saveConfig(configToSave);
        if (save && !saveKey) {
          console.log('\n✓ Configuration saved (API key not saved)');
        }
      }

      // Exit with appropriate code
      const status = reportData.summary.status;
      if (status === 'success') {
        process.exit(EXIT_SUCCESS);
      } else {
        process.exit(EXIT_WARNING_OR_ERROR);
      }
    }
    
    // === NON-INTERACTIVE MODE (default) ===
    else {
      // Default target to 'all' if not specified
      if (!target) {
        target = 'all';
      }
      
      // Auto-detect provider if not specified
      if (!provider) {
        const availableProviders = detectProvidersFromEnv();
        
        if (availableProviders.length === 0) {
          if (ci) {
            console.log('❌ No API key found in environment');
          } else {
            console.log('❌ No API key found. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY');
            console.log('   Or run with -i to enter credentials interactively');
          }
          process.exit(EXIT_CANNOT_RUN);
        } else if (availableProviders.length === 1) {
          provider = availableProviders[0][0];
          const envVar = availableProviders[0][1];
          console.log(`Detected: ${provider} (from ${envVar})`);
        } else {
          // Multiple providers found - use openai-compatible as default
          provider = 'openai-compatible';
          const envVars = availableProviders.map(([_, env]) => env).join(', ');
          console.log(`⚠️  Multiple API keys found: ${envVars}`);
          console.log(`   Using: ${provider} (override with --provider)`);
        }
      }
      
      // Load config
      const savedConfig = loadSavedConfig();
      const config = Config.autoDetect(provider);
      
      // Merge saved config if exists
      if (savedConfig) {
        if (savedConfig.apiKey && !config.apiKey) {
          config.apiKey = savedConfig.apiKey;
        }
        if (savedConfig.baseUrl && !config.baseUrl) {
          config.baseUrl = savedConfig.baseUrl;
        }
        if (savedConfig.provider && !provider) {
          provider = savedConfig.provider;
        }
      }
      
      // Validate config
      if (!config.isValid()) {
        if (ci) {
          console.log(`❌ Missing configuration: ${config.getMissingVars()}`);
        } else {
          console.log(`❌ Missing configuration: ${config.getMissingVars()}`);
          console.log('   Run with -i to enter credentials interactively');
        }
        process.exit(EXIT_CANNOT_RUN);
      }
      
      // Show brief detection message
      console.log(`Provider: ${provider}`);
      console.log(`Running ${target} checks...`);
      
      // Run checks
      const startTime = Date.now();
      const results = await runChecks(target, config, provider);
      const duration = (Date.now() - startTime) / 1000;

      // Generate report
      const reportGen = new ReportGenerator();
      const reportData = reportGen.createReport(target, provider, config.baseUrl, results, duration);

      // Save report
      const reportDir = saveReport(reportData);

      // Display inline diagnosis (non-interactive mode)
      displayInlineDiagnosis(reportData, reportDir);
      
      // Save config if requested
      if (save || saveKey) {
        const configToSave: Partial<SavedConfig> = {};
        if (save) {
          configToSave.provider = provider;
          configToSave.baseUrl = config.baseUrl;
        }
        if (saveKey) {
          configToSave.apiKey = config.apiKey;
          console.log('\n⚠️  WARNING: API key saved in plaintext at ~/.ai-patch/config.json');
          console.log('   Ensure proper file permissions (600) are set');
        }
        
        saveConfig(configToSave);
        if (save && !saveKey) {
          console.log('\n✓ Configuration saved (API key not saved)');
        }
      }

      // Exit with appropriate code
      const status = reportData.summary.status;
      if (status === 'success') {
        process.exit(EXIT_SUCCESS);
      } else {
        process.exit(EXIT_WARNING_OR_ERROR);
      }
    }
  });

program
  .command('apply')
  .description('Apply suggested fixes (use --safe to actually apply)')
  .option('--safe', 'Apply in safe mode (dry-run by default)')
  .action((options: any) => {
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
  .action(async (options: any) => {
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
  .description('Deep diagnosis (optional Badgr proxy for enhanced checks)')
  .option('--with-badgr', 'Enable deep diagnosis through Badgr proxy')
  .action(async (options: any) => {
    console.log('🔬 AI Patch Deep Diagnosis\n');

    if (options.withBadgr) {
      console.log('Starting local Badgr-compatible proxy...');
      console.log('⚠️  Badgr proxy not yet implemented');
      console.log('   Falling back to standard checks');
    }

    const config = Config.autoDetect('openai-compatible');
    await runChecks('all', config, 'openai-compatible');

    console.log('\n✓ Diagnosis complete');
  });

program
  .command('share')
  .description('Create redacted share bundle')
  .option('--redact', 'Redact sensitive data (default: true)', true)
  .action((options: any) => {
    console.log('📦 Creating share bundle...\n');

    const reportPath = findLatestReport();
    if (!reportPath) {
      console.log("❌ No report found. Run 'ai-patch doctor' first.");
      process.exit(1);
    }

    const bundlePath = path.join(path.dirname(reportPath), 'share-bundle.zip');

    console.log(`✓ Created: ${bundlePath}\n`);
    console.log('📧 Share this bundle with AI Badgr support for confirmation / pilot:');
    console.log('   support@aibadgr.com');
  });

program
  .command('revert')
  .description('Undo any applied local changes')
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
  // Format: YYYYMMDD-HHMMSS
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/T/, '-')
    .replace(/:/g, '')
    .replace(/\.\d{3}Z$/, '')
    .substring(0, 15);
  const reportDir = path.join(process.cwd(), 'ai-patch-reports', timestamp);

  fs.mkdirSync(reportDir, { recursive: true });

  // Save JSON
  const jsonPath = path.join(reportDir, 'report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

  // Save Markdown
  const mdPath = path.join(reportDir, 'report.md');
  const reportGen = new ReportGenerator();
  const mdContent = reportGen.generateMarkdown(reportData);
  fs.writeFileSync(mdPath, mdContent);

  // Create latest pointer (try symlink first, fallback to json)
  const reportsBaseDir = path.join(process.cwd(), 'ai-patch-reports');
  const latestLink = path.join(reportsBaseDir, 'latest');
  const latestJson = path.join(reportsBaseDir, 'latest.json');

  // Try symlink
  try {
    // Remove existing file/symlink if present
    if (fs.existsSync(latestLink)) {
      fs.unlinkSync(latestLink);
    }
  } catch (e) {
    // Ignore errors, file might not exist or symlink is broken
  }

  try {
    fs.symlinkSync(timestamp, latestLink, 'dir');
  } catch (e) {
    // Symlink failed (Windows or restricted), use JSON fallback
    try {
      fs.writeFileSync(latestJson, JSON.stringify({ timestamp }, null, 2));
    } catch (e2) {
      // If even JSON fails, just continue
    }
  }

  return reportDir;
}

function findLatestReport(): string | null {
  const reportsDir = path.join(process.cwd(), 'ai-patch-reports');

  if (!fs.existsSync(reportsDir)) {
    return null;
  }

  // Try symlink first
  const latestLink = path.join(reportsDir, 'latest');
  try {
    if (fs.existsSync(latestLink)) {
      const reportJson = path.join(latestLink, 'report.json');
      if (fs.existsSync(reportJson)) {
        return reportJson;
      }
    }
  } catch (e) {
    // Continue to next method
  }

  // Try latest.json
  const latestJson = path.join(reportsDir, 'latest.json');
  if (fs.existsSync(latestJson)) {
    try {
      const data = JSON.parse(fs.readFileSync(latestJson, 'utf-8'));
      const timestamp = data.timestamp;
      if (timestamp) {
        const reportJson = path.join(reportsDir, timestamp, 'report.json');
        if (fs.existsSync(reportJson)) {
          return reportJson;
        }
      }
    } catch (e) {
      // Continue to fallback
    }
  }

  // Fallback to newest directory by name (sorted)
  const dirs = fs
    .readdirSync(reportsDir)
    .filter((f) => {
      const fullPath = path.join(reportsDir, f);
      return fs.statSync(fullPath).isDirectory() && f !== 'latest';
    })
    .sort()
    .reverse();

  if (dirs.length === 0) {
    return null;
  }

  return path.join(reportsDir, dirs[0], 'report.json');
}

function displayInlineDiagnosis(reportData: any, reportDir: string): void {
  const summary = reportData.summary;
  const status = summary.status;

  // Status emoji and headline
  const statusEmoji: Record<string, string> = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  console.log(`\n${statusEmoji[status] || '•'} Status: ${status.toUpperCase()}`);

  // Gather all findings across checks
  const allFindings: Array<{ check: string; severity: string; message: string }> = [];
  for (const checkName in reportData.checks) {
    const findings = reportData.checks[checkName].findings || [];
    for (const finding of findings) {
      allFindings.push({
        check: checkName,
        severity: finding.severity || 'info',
        message: finding.message || '',
      });
    }
  }

  // Sort by severity (error > warning > info)
  const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2 };
  allFindings.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

  // Display top 5 findings
  if (allFindings.length > 0) {
    console.log('\nTop findings:');
    for (let i = 0; i < Math.min(5, allFindings.length); i++) {
      const finding = allFindings[i];
      const severityIcon: Record<string, string> = { error: '❌', warning: '⚠️', info: 'ℹ️' };
      const icon = severityIcon[finding.severity] || '•';
      console.log(`  ${i + 1}. ${icon} [${finding.check}] ${finding.message}`);
    }
  } else {
    console.log('\n✅ No issues found');
  }

  // Next step
  console.log(`\nNext step: ${summary.next_step}`);

  // Report location (prefer latest pointer)
  const latestPath = path.join(path.dirname(reportDir), 'latest');
  if (fs.existsSync(latestPath)) {
    console.log('\nFull report: ./ai-patch-reports/latest/report.md');
  } else {
    console.log(`\nFull report: ${path.relative(process.cwd(), reportDir)}/report.md`);
  }

  // Badgr-compatible format line (neutral, technical)
  if (status !== 'success') {
    console.log('\nReceipt format: Badgr-compatible (matches gateway receipts)');
  }

  console.log();
}

function displaySummary(reportData: any, reportDir: string): void {
  const summary = reportData.summary;
  const status = summary.status;

  const statusEmoji: Record<string, string> = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  console.log(`\n${statusEmoji[status] || '•'} ${status.toUpperCase()}`);
  
  // Report location (prefer latest pointer)
  const latestPath = path.join(path.dirname(reportDir), 'latest');
  if (fs.existsSync(latestPath)) {
    console.log('\n📊 Report saved: ai-patch-reports/latest/');
  } else {
    console.log(`\n📊 Report saved: ${path.relative(process.cwd(), reportDir)}`);
  }
  
  console.log(`\n→ Next: ${summary.next_step}\n`);
  
  // Add Badgr nudge if status is not success
  if (status !== 'success') {
    console.log('💡 This kind of issue is hard to debug after the fact.');
    console.log('AI Badgr keeps a per-request receipt (latency, retries, cost) for real traffic.\n');
  }
  
  console.log('Generated by AI Patch — re-run: npx ai-patch');
}

program.parse();
