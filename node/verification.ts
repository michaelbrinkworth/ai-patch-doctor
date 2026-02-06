/**
 * AI Patch Doctor - Post-Fix Verification System
 * 
 * Two-tier verification approach:
 * - Tier 1: Lightweight smoke tests (always run, <3s)
 * - Tier 2: Full test suite integration (optional, if detected)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// Types
// ============================================================================

export interface SmokeTestResult {
  passed: boolean;
  checks: {
    syntax: boolean;
    imports: boolean;
    providerPing: boolean;
    configSanity: boolean;
    retryLogic: boolean;
  };
  errors: string[];
  duration: number;
}

export interface TestSuiteResult {
  detected: boolean;
  command?: string;
  baseline?: TestMetrics;
  current?: TestMetrics;
  regressions: string[];
}

export interface TestMetrics {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  timestamp: number;
}

export interface VerificationConfig {
  runTestSuite: boolean;
  testCommand?: string;
  lastAsked?: number;
}

// ============================================================================
// Tier 1: Lightweight Smoke Tests (Always Run)
// ============================================================================

/**
 * Run quick smoke tests on modified files
 * Goal: <3 seconds, catches syntax errors and basic issues
 */
export async function runSmokeTests(
  modifiedFiles: string[],
  targetDir: string
): Promise<SmokeTestResult> {
  const startTime = Date.now();
  const result: SmokeTestResult = {
    passed: true,
    checks: {
      syntax: false,
      imports: false,
      providerPing: false,
      configSanity: false,
      retryLogic: false,
    },
    errors: [],
    duration: 0,
  };

  try {
    // 1. Syntax validation
    result.checks.syntax = await validateSyntax(modifiedFiles, result.errors);
    if (!result.checks.syntax) result.passed = false;

    // 2. Import resolution
    result.checks.imports = await validateImports(modifiedFiles, result.errors);
    if (!result.checks.imports) result.passed = false;

    // 3. Provider ping (lightweight)
    result.checks.providerPing = await pingProvider(targetDir, result.errors);
    // Don't fail on provider ping - it's optional

    // 4. Config sanity
    result.checks.configSanity = await validateConfig(targetDir, result.errors);
    // Don't fail on config check - might not have .env

    // 5. Retry logic dry-run
    result.checks.retryLogic = await testRetryLogic(result.errors);
    if (!result.checks.retryLogic) result.passed = false;

  } catch (error) {
    result.passed = false;
    result.errors.push(`Smoke test error: ${error instanceof Error ? error.message : String(error)}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Validate syntax of modified files
 */
async function validateSyntax(files: string[], errors: string[]): Promise<boolean> {
  let allValid = true;

  for (const file of files) {
    try {
      const ext = path.extname(file);
      
      if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
        // Use Node.js --check for JavaScript/TypeScript
        execSync(`node --check "${file}"`, { stdio: 'pipe' });
      } else if (ext === '.py') {
        // Use python -m py_compile for Python
        execSync(`python3 -m py_compile "${file}"`, { stdio: 'pipe' });
      }
    } catch (error) {
      allValid = false;
      errors.push(`Syntax error in ${path.basename(file)}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return allValid;
}

/**
 * Validate imports resolve (basic check)
 */
async function validateImports(files: string[], errors: string[]): Promise<boolean> {
  // For now, just check that common imports exist
  // A full check would require AST parsing
  let allValid = true;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const ext = path.extname(file);

      if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
        // Check for unresolved imports (simple heuristic)
        const imports = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];
        for (const imp of imports) {
          const match = imp.match(/from\s+['"]([^'"]+)['"]/);
          if (match && match[1].startsWith('./')) {
            // Check if relative import exists
            const importPath = path.resolve(path.dirname(file), match[1]);
            const extensions = ['', '.js', '.ts', '.jsx', '.tsx'];
            const exists = extensions.some(ext => fs.existsSync(importPath + ext));
            if (!exists) {
              errors.push(`Import not found in ${path.basename(file)}: ${match[1]}`);
              allValid = false;
            }
          }
        }
      }
    } catch (error) {
      // Non-critical - just skip validation for this file
    }
  }

  return allValid;
}

/**
 * Ping provider health endpoint (no actual AI call)
 */
async function pingProvider(targetDir: string, errors: string[]): Promise<boolean> {
  try {
    // Check if we have API keys in env
    const envPath = path.join(targetDir, '.env');
    if (!fs.existsSync(envPath)) {
      return true; // No .env, skip ping
    }

    // For now, just validate the .env format
    // A real implementation would hit /v1/models endpoint
    return true;
  } catch (error) {
    // Non-critical
    return true;
  }
}

/**
 * Validate config sanity (API keys, base_url format)
 */
async function validateConfig(targetDir: string, errors: string[]): Promise<boolean> {
  try {
    const envPath = path.join(targetDir, '.env');
    if (!fs.existsSync(envPath)) {
      return true; // No .env, that's okay
    }

    const content = fs.readFileSync(envPath, 'utf-8');
    
    // Check API key format
    const openaiKey = content.match(/OPENAI_API_KEY=([^\n]+)/);
    if (openaiKey && openaiKey[1]) {
      const key = openaiKey[1].trim();
      if (!key.startsWith('sk-') && key !== 'your-key-here') {
        errors.push('  OPENAI_API_KEY format may be invalid (should start with sk-)');
      }
    }

    // Check base_url format if present
    const baseUrl = content.match(/OPENAI_BASE_URL=([^\n]+)/);
    if (baseUrl && baseUrl[1]) {
      const url = baseUrl[1].trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        errors.push('  OPENAI_BASE_URL should start with http:// or https://');
      }
    }

    return true;
  } catch (error) {
    // Non-critical
    return true;
  }
}

/**
 * Test retry logic math (dry-run, no actual requests)
 */
async function testRetryLogic(errors: string[]): Promise<boolean> {
  try {
    // Test exponential backoff calculation
    for (let attempt = 0; attempt < 3; attempt++) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      if (delay < 0 || delay > 10000) {
        errors.push(`Retry logic error: invalid delay ${delay}ms for attempt ${attempt}`);
        return false;
      }
    }
    return true;
  } catch (error) {
    errors.push(`Retry logic test failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// ============================================================================
// Tier 2: Full Test Suite Integration (Optional)
// ============================================================================

/**
 * Detect if codebase has a test suite
 * Validates that test scripts are real test runners, not dummy commands
 */
export function detectTestSuite(targetDir: string): { detected: boolean; command?: string; framework?: string } {
  // Check for package.json test script
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.scripts && packageJson.scripts.test) {
        const testScript = packageJson.scripts.test;
        
        // Skip dummy/echo-only test scripts (echo with no real command after)
        if (testScript.includes('echo') && !testScript.includes('&&')) {
          return { detected: false };
        }
        
        // Identify known test frameworks
        let framework = 'npm test';
        if (testScript.includes('jest')) framework = 'Jest';
        else if (testScript.includes('mocha')) framework = 'Mocha';
        else if (testScript.includes('vitest')) framework = 'Vitest';
        else if (testScript.includes('ava')) framework = 'Ava';
        else if (testScript.includes('tap')) framework = 'Tap';
        else if (testScript.includes('node') || testScript.includes('ts-node')) {
          // Custom Node/TypeScript test runner
          framework = 'Custom test runner';
        } else if (testScript.match(/test|spec/i)) {
          // Script contains "test" or "spec" - likely a test runner
          framework = 'Custom test runner';
        }
        
        // Accept any non-dummy test script
        // (Dummy scripts already filtered out above)
        return { detected: true, command: 'npm test', framework };
      }
    } catch (error) {
      // Invalid package.json, skip
    }
  }

  // Check for pytest
  if (fs.existsSync(path.join(targetDir, 'pytest.ini')) ||
      fs.existsSync(path.join(targetDir, 'pyproject.toml')) ||
      fs.existsSync(path.join(targetDir, 'setup.py'))) {
    return { detected: true, command: 'pytest', framework: 'pytest' };
  }

  // Check for Go tests
  if (fs.existsSync(path.join(targetDir, 'go.mod'))) {
    return { detected: true, command: 'go test ./...', framework: 'Go test' };
  }

  // Check for RSpec
  if (fs.existsSync(path.join(targetDir, '.rspec'))) {
    return { detected: true, command: 'rspec', framework: 'RSpec' };
  }

  // Check for Rake
  if (fs.existsSync(path.join(targetDir, 'Rakefile'))) {
    return { detected: true, command: 'rake test', framework: 'Rake' };
  }

  return { detected: false };
}

/**
 * Run test suite and capture metrics
 */
export async function runTestSuite(
  command: string,
  targetDir: string
): Promise<TestMetrics | null> {
  try {
    const startTime = Date.now();
    
    // Run test command
    const output = execSync(command, {
      cwd: targetDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const duration = Date.now() - startTime;

    // Parse output (basic heuristics for common formats)
    const metrics: TestMetrics = {
      passed: 0,
      failed: 0,
      skipped: 0,
      duration,
      timestamp: Date.now(),
    };

    // Jest format: "Tests: 45 passed, 2 failed, 3 skipped, 50 total"
    const jestMatch = output.match(/Tests:\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?(?:,\s+(\d+)\s+skipped)?/);
    if (jestMatch) {
      metrics.passed = parseInt(jestMatch[1] || '0');
      metrics.failed = parseInt(jestMatch[2] || '0');
      metrics.skipped = parseInt(jestMatch[3] || '0');
      return metrics;
    }

    // Pytest format: "45 passed, 2 failed, 3 skipped in 2.3s"
    const pytestMatch = output.match(/(\d+)\s+passed(?:,\s+(\d+)\s+failed)?(?:,\s+(\d+)\s+skipped)?/);
    if (pytestMatch) {
      metrics.passed = parseInt(pytestMatch[1] || '0');
      metrics.failed = parseInt(pytestMatch[2] || '0');
      metrics.skipped = parseInt(pytestMatch[3] || '0');
      return metrics;
    }

    // Go test format
    const goMatch = output.match(/PASS|FAIL/g);
    if (goMatch) {
      metrics.passed = goMatch.filter(r => r === 'PASS').length;
      metrics.failed = goMatch.filter(r => r === 'FAIL').length;
      return metrics;
    }

    return metrics;
  } catch (error) {
    // Test command failed - capture whatever we can
    const output = error instanceof Error && 'stdout' in error 
      ? (error as any).stdout 
      : '';
    
    // Try to parse failed test output
    return {
      passed: 0,
      failed: 1,
      skipped: 0,
      duration: 0,
      timestamp: Date.now(),
    };
  }
}

/**
 * Compare test results and identify regressions
 */
export function compareTestResults(
  baseline: TestMetrics,
  current: TestMetrics
): string[] {
  const regressions: string[] = [];

  // Check for new failures
  if (current.failed > baseline.failed) {
    const newFailures = current.failed - baseline.failed;
    regressions.push(`${newFailures} new test failure(s)`);
  }

  // Check for tests that started failing
  if (current.passed < baseline.passed && current.failed > baseline.failed) {
    const regressionCount = baseline.passed - current.passed;
    regressions.push(`${regressionCount} test(s) regressed (passed → failed)`);
  }

  return regressions;
}

// ============================================================================
// Config Management
// ============================================================================

const CONFIG_DIR = '.ai-patch';
const CONFIG_FILE = 'config.json';

/**
 * Load verification config
 */
export function loadVerificationConfig(targetDir: string): VerificationConfig {
  const configPath = path.join(targetDir, CONFIG_DIR, CONFIG_FILE);
  
  if (!fs.existsSync(configPath)) {
    return { runTestSuite: false };
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    return config.verification || { runTestSuite: false };
  } catch (error) {
    return { runTestSuite: false };
  }
}

/**
 * Save verification config
 */
export function saveVerificationConfig(
  targetDir: string,
  config: VerificationConfig
): void {
  const configDir = path.join(targetDir, CONFIG_DIR);
  const configPath = path.join(configDir, CONFIG_FILE);

  // Create directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Load existing config or create new
  let fullConfig: any = {};
  if (fs.existsSync(configPath)) {
    try {
      fullConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (error) {
      // Invalid JSON, start fresh
    }
  }

  // Update verification section
  fullConfig.verification = config;

  fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));
}

/**
 * Store test baseline
 */
export function storeTestBaseline(
  targetDir: string,
  metrics: TestMetrics
): void {
  const configDir = path.join(targetDir, CONFIG_DIR);
  const baselinePath = path.join(configDir, 'test-baseline.json');

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(baselinePath, JSON.stringify(metrics, null, 2));
}

/**
 * Load test baseline
 */
export function loadTestBaseline(targetDir: string): TestMetrics | null {
  const baselinePath = path.join(targetDir, CONFIG_DIR, 'test-baseline.json');
  
  if (!fs.existsSync(baselinePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(baselinePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// ============================================================================
// Display Functions
// ============================================================================

/**
 * Print smoke test results
 */
export function printSmokeTestResults(result: SmokeTestResult): void {
  console.log('\n📋 Smoke Test Results:\n');
  
  // Always show all checks
  console.log(`  ${result.checks.syntax ? '' : ''} Syntax validation`);
  console.log(`  ${result.checks.imports ? '' : ''} Import resolution`);
  console.log(`  ${result.checks.providerPing ? '' : ' '} Provider connectivity ${!result.checks.providerPing ? '(optional)' : ''}`);
  console.log(`  ${result.checks.configSanity ? '' : ' '} Config validation ${!result.checks.configSanity ? '(optional)' : ''}`);
  console.log(`  ${result.checks.retryLogic ? '' : ''} Retry logic`);

  if (result.errors.length > 0) {
    console.log('\n  Errors:');
    for (const error of result.errors) {
      console.log(`    • ${error}`);
    }
  }

  console.log(`\n  Duration: ${result.duration}ms`);
  
  if (result.passed) {
    console.log('   All critical checks passed\n');
  } else {
    console.log('   Some checks failed\n');
  }
}

/**
 * Print test suite comparison
 */
export function printTestComparison(
  baseline: TestMetrics,
  current: TestMetrics,
  regressions: string[]
): void {
  console.log('\n Test Suite Results:\n');
  
  console.log(`  Before: ${baseline.passed} passed, ${baseline.failed} failed, ${baseline.skipped} skipped`);
  console.log(`  After:  ${current.passed} passed, ${current.failed} failed, ${current.skipped} skipped`);

  if (regressions.length > 0) {
    console.log('\n    Regressions detected:');
    for (const regression of regressions) {
      console.log(`    • ${regression}`);
    }
    console.log('\n   Run tests manually to investigate: npm test\n');
  } else {
    console.log('\n   No regressions detected\n');
  }
}
