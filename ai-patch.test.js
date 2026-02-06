/**
 * AI Patch Doctor - Comprehensive Test Suite
 * 
 * Tests code reuse, structure, and functionality
 */

const fs = require('fs');
const path = require('path');

describe('AI Patch Doctor - Code Reuse & Structure', () => {
  
  describe('Shared Code Structure', () => {
    test('shared directory exists', () => {
      const sharedPath = path.join(__dirname, 'shared');
      expect(fs.existsSync(sharedPath)).toBe(true);
    });

    test('report-schema.json exists in shared', () => {
      const schemaPath = path.join(__dirname, 'shared', 'report-schema.json');
      expect(fs.existsSync(schemaPath)).toBe(true);
    });
  });

  describe('Python Shared Code', () => {
    test('Python checks directory exists in package', () => {
      const checksPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'checks');
      expect(fs.existsSync(checksPath)).toBe(true);
    });

    test('Python streaming check exists', () => {
      const streamingPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'checks', 'streaming.py');
      expect(fs.existsSync(streamingPath)).toBe(true);
    });

    test('Python retries check exists', () => {
      const retriesPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'checks', 'retries.py');
      expect(fs.existsSync(retriesPath)).toBe(true);
    });

    test('Python cost check exists', () => {
      const costPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'checks', 'cost.py');
      expect(fs.existsSync(costPath)).toBe(true);
    });

    test('Python trace check exists', () => {
      const tracePath = path.join(__dirname, 'python', 'src', 'ai_patch', 'checks', 'trace.py');
      expect(fs.existsSync(tracePath)).toBe(true);
    });

    test('Python config.py exists in package', () => {
      const configPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'config.py');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    test('Python report.py exists in package', () => {
      const reportPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'report.py');
      expect(fs.existsSync(reportPath)).toBe(true);
    });
  });

  describe('Node Shared Code', () => {
    test('Node checks directory exists', () => {
      const checksPath = path.join(__dirname, 'node', 'checks');
      expect(fs.existsSync(checksPath)).toBe(true);
    });

    test('Node streaming check exists', () => {
      const streamingPath = path.join(__dirname, 'node', 'checks', 'streaming.ts');
      expect(fs.existsSync(streamingPath)).toBe(true);
    });

    test('Node retries check exists', () => {
      const retriesPath = path.join(__dirname, 'node', 'checks', 'retries.ts');
      expect(fs.existsSync(retriesPath)).toBe(true);
    });

    test('Node cost check exists', () => {
      const costPath = path.join(__dirname, 'node', 'checks', 'cost.ts');
      expect(fs.existsSync(costPath)).toBe(true);
    });

    test('Node trace check exists', () => {
      const tracePath = path.join(__dirname, 'node', 'checks', 'trace.ts');
      expect(fs.existsSync(tracePath)).toBe(true);
    });

    test('Node config.ts exists', () => {
      const configPath = path.join(__dirname, 'node', 'config.ts');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    test('Node report.ts exists', () => {
      const reportPath = path.join(__dirname, 'node', 'report.ts');
      expect(fs.existsSync(reportPath)).toBe(true);
    });
  });

  describe('Python CLI Structure', () => {
    test('Python CLI directory exists', () => {
      const cliPath = path.join(__dirname, 'python');
      expect(fs.existsSync(cliPath)).toBe(true);
    });

    test('Python CLI main file exists', () => {
      const mainPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'cli.py');
      expect(fs.existsSync(mainPath)).toBe(true);
    });

    test('Python CLI imports from ai_patch package', () => {
      const mainPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'cli.py');
      const content = fs.readFileSync(mainPath, 'utf8');
      // Check for package imports
      const hasPackageImport = content.includes('from ai_patch.checks import') &&
                               content.includes('from ai_patch.report import') &&
                               content.includes('from ai_patch.config import');
      expect(hasPackageImport).toBe(true);
    });

    test('Python CLI has checks directory in src/ai_patch', () => {
      const checksPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'checks');
      expect(fs.existsSync(checksPath)).toBe(true);
    });

    test('Python CLI has config.py in src/ai_patch', () => {
      const configPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'config.py');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    test('Python CLI has report.py in src/ai_patch', () => {
      const reportPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'report.py');
      expect(fs.existsSync(reportPath)).toBe(true);
    });
  });

  describe('Node CLI Structure', () => {
    test('Node CLI directory exists', () => {
      const cliPath = path.join(__dirname, 'node');
      expect(fs.existsSync(cliPath)).toBe(true);
    });

    test('Node CLI main file exists', () => {
      const mainPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      expect(fs.existsSync(mainPath)).toBe(true);
    });

    test('Node CLI imports from shared code', () => {
      const mainPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(mainPath, 'utf8');
      // Check for shared imports from parent directories
      const hasSharedImport = content.includes('../config') ||
                             content.includes('../report') ||
                             content.includes('../checks/');
      expect(hasSharedImport).toBe(true);
    });

    test('Node CLI does NOT have duplicate checks directory in src', () => {
      const checksPath = path.join(__dirname, 'node', 'src', 'checks');
      expect(fs.existsSync(checksPath)).toBe(false);
    });

    test('Node CLI does NOT have duplicate config.ts in src', () => {
      const configPath = path.join(__dirname, 'node', 'src', 'config.ts');
      expect(fs.existsSync(configPath)).toBe(false);
    });

    test('Node CLI does NOT have duplicate report.ts in src', () => {
      const reportPath = path.join(__dirname, 'node', 'src', 'report.ts');
      expect(fs.existsSync(reportPath)).toBe(false);
    });
  });

  describe('Documentation', () => {
    test('README.md exists', () => {
      const docPath = path.join(__dirname, 'README.md');
      expect(fs.existsSync(docPath)).toBe(true);
    });

    test('Old deployment guide removed', () => {
      const oldDoc1 = path.join(__dirname, 'DEPLOYMENT_GUIDE.md');
      expect(fs.existsSync(oldDoc1)).toBe(false);
    });

    test('README contains key sections', () => {
      const docPath = path.join(__dirname, 'README.md');
      const content = fs.readFileSync(docPath, 'utf8');
      expect(content).toContain('Quick Start');
      expect(content).toContain('Installation');
      expect(content).toContain('Architecture');
      expect(content).toContain('The 4 Wedge Checks');
      expect(content).toContain('Testing');
    });
  });

  describe('Package Structure', () => {
    test('Python pyproject.toml exists', () => {
      const pyprojectPath = path.join(__dirname, 'python', 'pyproject.toml');
      expect(fs.existsSync(pyprojectPath)).toBe(true);
    });

    test('Node package.json exists', () => {
      const packagePath = path.join(__dirname, 'node', 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
    });

    test('Node package.json has correct structure', () => {
      const packagePath = path.join(__dirname, 'node', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      expect(packageJson.name).toBeDefined();
      expect(packageJson.version).toBeDefined();
    });
  });

  describe('Code Quality Checks', () => {
    test('Python checks modules are in the package', () => {
      const packageChecksPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'checks');
      const oldChecksPath = path.join(__dirname, 'python', 'checks');
      
      // Checks should be in the package now
      expect(fs.existsSync(packageChecksPath)).toBe(true);
      // Old location should not exist anymore
      expect(fs.existsSync(oldChecksPath)).toBe(false);
    });

    test('No duplicate code between Node CLI and shared modules', () => {
      const cliChecksPath = path.join(__dirname, 'node', 'src', 'checks');
      const sharedChecksPath = path.join(__dirname, 'node', 'checks');
      
      // CLI src should not have checks directory (imports from parent)
      expect(fs.existsSync(cliChecksPath)).toBe(false);
      // Node root should have checks
      expect(fs.existsSync(sharedChecksPath)).toBe(true);
    });

    test('Report schema is valid JSON', () => {
      const schemaPath = path.join(__dirname, 'shared', 'report-schema.json');
      const content = fs.readFileSync(schemaPath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    });
  });

  describe('Open Source & Clean', () => {
    test('README.md exists', () => {
      const readmePath = path.join(__dirname, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('LICENSE file exists', () => {
      const licensePath = path.join(__dirname, 'LICENSE');
      expect(fs.existsSync(licensePath)).toBe(true);
    });

    test('.gitignore exists', () => {
      const gitignorePath = path.join(__dirname, '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);
    });
  });
});

describe('AI Patch Doctor - Functional Tests', () => {
  test('Python CLI has main entry point', () => {
    const mainPath = path.join(__dirname, 'python', 'src', 'ai_patch', '__main__.py');
    expect(fs.existsSync(mainPath)).toBe(true);
  });

  test('Python CLI has doctor command', () => {
    const cliPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'cli.py');
    const content = fs.readFileSync(cliPath, 'utf8');
    expect(content).toContain('def doctor');
  });

  test('Node CLI has doctor command', () => {
    const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
    const content = fs.readFileSync(cliPath, 'utf8');
    expect(content).toContain('doctor');
  });
  
  test('Python has all 4 check modules', () => {
    const checks = ['streaming', 'retries', 'cost', 'trace'];
    checks.forEach(check => {
      const checkPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'checks', `${check}.py`);
      expect(fs.existsSync(checkPath)).toBe(true);
    });
  });
  
  test('Node has all 4 check modules', () => {
    const checks = ['streaming', 'retries', 'cost', 'trace'];
    checks.forEach(check => {
      const checkPath = path.join(__dirname, 'node', 'checks', `${check}.ts`);
      expect(fs.existsSync(checkPath)).toBe(true);
    });
  });
});

describe('AI Patch Doctor - Feature Tests', () => {
  test('Apply command exists in Python CLI (stub for now)', () => {
    const cliPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'cli.py');
    const content = fs.readFileSync(cliPath, 'utf8');
    
    // Check that apply command exists
    expect(content).toContain('def apply');
    
    // Python version is still a stub (Node.js has full implementation)
    // This is okay - the implementation is Node-first
  });

  test('Apply command is implemented in Node CLI', () => {
    const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
    const content = fs.readFileSync(cliPath, 'utf8');
    
    // Check that apply command exists (now marked as INTERNAL)
    expect(content).toContain('.command(\'apply\')');
    
    // Check that doctor command now has the full funnel implementation
    expect(content).toContain('THE FORK');
    expect(content).toContain('scanCodebase');
    expect(content).toContain('previewFixes');
    expect(content).toContain('applyFixes');
    expect(content).toContain('shouldRecommendBadgr');
  });

  test('Python report generator does not have getNextStep method', () => {
    const reportPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'report.py');
    const content = fs.readFileSync(reportPath, 'utf8');
    
    // Should not have _get_next_step method
    expect(content).not.toContain('def _get_next_step');
    expect(content).not.toContain('_get_next_step(');
  });

  test('Node report generator does not have getNextStep method', () => {
    const reportPath = path.join(__dirname, 'node', 'report.ts');
    const content = fs.readFileSync(reportPath, 'utf8');
    
    // Should not have getNextStep method
    expect(content).not.toContain('getNextStep(');
    expect(content).not.toContain('private getNextStep');
  });

  test('Python CLI has repeat pain footer', () => {
    const cliPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'cli.py');
    const content = fs.readFileSync(cliPath, 'utf8');
    
    // Check for repeat pain footer
    expect(content).toContain('This report explains this incident only');
    expect(content).toContain('If this happens again in production');
  });

  test('Node CLI has repeat pain footer', () => {
    const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
    const content = fs.readFileSync(cliPath, 'utf8');
    
    // Check for repeat pain footer
    expect(content).toContain('This report explains this incident only');
    expect(content).toContain('If this happens again in production');
  });

  test('README does not contain fix examples', () => {
    const readmePath = path.join(__dirname, 'README.md');
    const content = fs.readFileSync(readmePath, 'utf8');
    
    // Should not have "Example Fix:" sections
    expect(content).not.toContain('Example Fix:');
    
    // Should have observation-based language
    expect(content).toContain('Detected:');
    expect(content).toContain('Not detected:');
  });
});

describe('AI Patch Doctor - Telemetry Tests', () => {
  describe('Telemetry Module Exists', () => {
    test('Node telemetry module exists', () => {
      const telemetryPath = path.join(__dirname, 'node', 'telemetry.ts');
      expect(fs.existsSync(telemetryPath)).toBe(true);
    });

    test('Python telemetry module exists', () => {
      const telemetryPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'telemetry.py');
      expect(fs.existsSync(telemetryPath)).toBe(true);
    });
  });

  describe('Telemetry Functions', () => {
    test('Node telemetry has required functions', () => {
      const telemetryPath = path.join(__dirname, 'node', 'telemetry.ts');
      const content = fs.readFileSync(telemetryPath, 'utf8');
      
      expect(content).toContain('generateInstallId');
      expect(content).toContain('getDurationBucket');
      expect(content).toContain('isTelemetryEnabled');
      expect(content).toContain('sendTelemetryEvent');
      expect(content).toContain('sendDoctorRunEvent');
    });

    test('Python telemetry has required functions', () => {
      const telemetryPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'telemetry.py');
      const content = fs.readFileSync(telemetryPath, 'utf8');
      
      expect(content).toContain('generate_install_id');
      expect(content).toContain('get_duration_bucket');
      expect(content).toContain('is_telemetry_enabled');
      expect(content).toContain('send_telemetry_event');
      expect(content).toContain('send_doctor_run_event');
    });
  });

  describe('Config Updates for Telemetry', () => {
    test('Node config supports installId', () => {
      const configPath = path.join(__dirname, 'node', 'config.ts');
      const content = fs.readFileSync(configPath, 'utf8');
      
      expect(content).toContain('installId');
      expect(content).toContain('telemetryEnabled');
      expect(content).toContain('getOrCreateInstallId');
    });

    test('Python config supports installId', () => {
      const configPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'config.py');
      const content = fs.readFileSync(configPath, 'utf8');
      
      expect(content).toContain('installId');
      expect(content).toContain('telemetryEnabled');
      expect(content).toContain('get_or_create_install_id');
    });
  });

  describe('CLI Integration', () => {
    test('Node CLI has --no-telemetry flag', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      
      expect(content).toContain('--no-telemetry');
      expect(content).toContain('sendDoctorRunEvent');
      expect(content).toContain('isTelemetryEnabled');
    });

    test('Python CLI has --no-telemetry flag', () => {
      const cliPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'cli.py');
      const content = fs.readFileSync(cliPath, 'utf8');
      
      expect(content).toContain('--no-telemetry');
      expect(content).toContain('send_doctor_run_event');
      expect(content).toContain('is_telemetry_enabled');
    });
  });

  describe('Privacy and Security', () => {
    test('Node telemetry does not log sensitive data', () => {
      const telemetryPath = path.join(__dirname, 'node', 'telemetry.ts');
      const content = fs.readFileSync(telemetryPath, 'utf8');
      
      // Should have privacy documentation
      expect(content).toContain('Strictly forbidden');
      expect(content).toContain('Prompts, payloads, request bodies');
      expect(content).toContain('API keys');
      
      // Should not include API key or other sensitive fields in event
      expect(content).not.toContain('apiKey:');
      expect(content).not.toContain('api_key:');
    });

    test('Python telemetry does not log sensitive data', () => {
      const telemetryPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'telemetry.py');
      const content = fs.readFileSync(telemetryPath, 'utf8');
      
      // Should have privacy documentation
      expect(content).toContain('Strictly forbidden');
      expect(content).toContain('Prompts, payloads, request bodies');
      expect(content).toContain('API keys');
    });
  });

  describe('Opt-out Mechanisms', () => {
    test('Node telemetry respects environment variable', () => {
      const telemetryPath = path.join(__dirname, 'node', 'telemetry.ts');
      const content = fs.readFileSync(telemetryPath, 'utf8');
      
      expect(content).toContain('AI_PATCH_TELEMETRY');
    });

    test('Python telemetry respects environment variable', () => {
      const telemetryPath = path.join(__dirname, 'python', 'src', 'ai_patch', 'telemetry.py');
      const content = fs.readFileSync(telemetryPath, 'utf8');
      
      expect(content).toContain('AI_PATCH_TELEMETRY');
    });
  });
});

console.log('\n AI Patch Doctor Test Suite');
console.log('Testing code reuse, structure, and functionality...\n');

describe('AI Patch Funnel - Scanner & Fixer', () => {
  
  describe('Scanner Module', () => {
    test('scanner.ts exists in node directory', () => {
      const scannerPath = path.join(__dirname, 'node', 'scanner.ts');
      expect(fs.existsSync(scannerPath)).toBe(true);
    });

    test('scanner has required exports', () => {
      const scannerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'scanner.ts'),
        'utf-8'
      );
      expect(scannerContent).toContain('export async function scanCodebase');
      expect(scannerContent).toContain('export function printScanResults');
      expect(scannerContent).toContain('export interface ScanIssue');
      expect(scannerContent).toContain('export interface ScanResult');
    });

    test('scanner detects all 6 issue types', () => {
      const scannerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'scanner.ts'),
        'utf-8'
      );
      expect(scannerContent).toContain('checkStreamingIssues');
      expect(scannerContent).toContain('checkRetryIssues');
      expect(scannerContent).toContain('checkTimeoutIssues');
      expect(scannerContent).toContain('check429Handling');
      expect(scannerContent).toContain('checkCostIssues');
      expect(scannerContent).toContain('checkTraceabilityIssues');
    });
  });

  describe('Fixer Module', () => {
    test('fixer.ts exists in node directory', () => {
      const fixerPath = path.join(__dirname, 'node', 'fixer.ts');
      expect(fs.existsSync(fixerPath)).toBe(true);
    });

    test('fixer has required exports', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('export async function applyFixes');
      expect(fixerContent).toContain('export function printFixResults');
      expect(fixerContent).toContain('export interface FixResult');
    });

    test('fixer can apply all fix types', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('function addTimeout');
      expect(fixerContent).toContain('function addRetryLogic');
      expect(fixerContent).toContain('function fixStreaming');
      expect(fixerContent).toContain('function addMaxTokens');
      expect(fixerContent).toContain('function addRequestId');
    });
  });

  describe('Badgr Integration Module', () => {
    test('badgr-integration.ts exists in node directory', () => {
      const badgrPath = path.join(__dirname, 'node', 'badgr-integration.ts');
      expect(fs.existsSync(badgrPath)).toBe(true);
    });

    test('badgr integration has required exports', () => {
      const badgrContent = fs.readFileSync(
        path.join(__dirname, 'node', 'badgr-integration.ts'),
        'utf-8'
      );
      expect(badgrContent).toContain('export function shouldRecommendBadgr');
      expect(badgrContent).toContain('export function printBadgrRecommendation');
      expect(badgrContent).toContain('export async function promptBadgrIntegration');
      expect(badgrContent).toContain('export async function openSignupPage');
      expect(badgrContent).toContain('export async function promptApiKey');
      expect(badgrContent).toContain('export async function applyBadgrConfig');
      expect(badgrContent).toContain('export async function runVerification');
      expect(badgrContent).toContain('export function printVerificationResults');
    });

    test('badgr integration has 3 modes', () => {
      const badgrContent = fs.readFileSync(
        path.join(__dirname, 'node', 'badgr-integration.ts'),
        'utf-8'
      );
      expect(badgrContent).toContain("mode: 'fallback'");
      expect(badgrContent).toContain("mode: 'full-switch'");
      expect(badgrContent).toContain("mode: 'test-only'");
    });
  });

  describe('CLI Integration', () => {
    test('CLI imports scanner, fixer, and badgr modules', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      // Check that CLI imports from scanner
      expect(cliContent).toContain("from '../scanner'");
      expect(cliContent).toContain("scanCodebase");
      expect(cliContent).toContain("printScanResults");
      expect(cliContent).toContain("ScanIssue");
      expect(cliContent).toContain("ScanResult");
      
      // Check that CLI imports from fixer
      expect(cliContent).toContain("from '../fixer'");
      expect(cliContent).toContain("applyFixes");
      expect(cliContent).toContain("printFixResults");
      expect(cliContent).toContain("previewFixes");
      expect(cliContent).toContain("printPreview");
      expect(cliContent).toContain("printVerificationComparison");
      
      // Check that CLI imports from badgr-integration
      expect(cliContent).toContain('from \'../badgr-integration\'');
      expect(cliContent).toContain("openSignupPage");
    });

    test('apply command is implemented', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('.command(\'apply\')');
      // Apply command now marked as INTERNAL for advanced use
      expect(cliContent).toContain('[INTERNAL]');
    });

    test('apply command has clear phases', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      // Apply command still exists for advanced users
      expect(cliContent).toContain('.command(\'apply\')');
      // But doctor command now has the interactive flow
      expect(cliContent).toContain('THE FORK');
    });
  });

  describe('Code Quality', () => {
    test('scanner uses TypeScript types', () => {
      const scannerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'scanner.ts'),
        'utf-8'
      );
      expect(scannerContent).toContain('interface ScanIssue');
      expect(scannerContent).toContain('interface ScanResult');
      expect(scannerContent).toContain(': string');
      expect(scannerContent).toContain(': number');
      expect(scannerContent).toContain(': boolean');
    });

    test('fixer uses TypeScript types', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('interface FixResult');
      expect(fixerContent).toContain('interface FixApplyResult');
      expect(fixerContent).toContain(': ScanIssue');
    });

    test('modules have proper JSDoc comments', () => {
      const scannerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'scanner.ts'),
        'utf-8'
      );
      expect(scannerContent).toContain('/**');
      expect(scannerContent).toContain(' * Scan a directory for AI API issues');
    });
  });
});

describe('AI Patch Safety Features', () => {
  
  describe('Preview-First Behavior', () => {
    test('previewFixes function exists', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('export async function previewFixes');
      expect(fixerContent).toContain('interface PreviewResult');
      expect(fixerContent).toContain('interface FixPreview');
    });

    test('printPreview function exists', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('export function printPreview');
    });

    test('apply command uses preview before applying', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('previewFixes');
      expect(cliContent).toContain('printPreview');
      expect(cliContent).toContain('confirmAction');
    });

    test('apply command requires confirmation', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('Apply these changes?');
      expect(cliContent).toContain('No files were modified');
    });
  });

  describe('Test-First Badgr Integration', () => {
    test('runBadgrTestOnly function exists', () => {
      const badgrContent = fs.readFileSync(
        path.join(__dirname, 'node', 'badgr-integration.ts'),
        'utf-8'
      );
      expect(badgrContent).toContain('export async function runBadgrTestOnly');
      expect(badgrContent).toContain('non-destructive');
      expect(badgrContent).toContain('no file changes');
    });

    test('test-only mode makes no file modifications', () => {
      const badgrContent = fs.readFileSync(
        path.join(__dirname, 'node', 'badgr-integration.ts'),
        'utf-8'
      );
      const testFunction = badgrContent.match(/export async function runBadgrTestOnly[\s\S]*?(?=\nexport|$)/);
      
      if (testFunction) {
        // Should not contain file write operations
        expect(testFunction[0]).not.toContain('fs.writeFileSync');
        expect(testFunction[0]).not.toContain('writeFile');
      }
    });

    test('promptBadgrIntegrationAfterTest exists for post-test options', () => {
      const badgrContent = fs.readFileSync(
        path.join(__dirname, 'node', 'badgr-integration.ts'),
        'utf-8'
      );
      expect(badgrContent).toContain('export async function promptBadgrIntegrationAfterTest');
    });
  });

  describe('Separate Phases', () => {
    test('apply command has clear phase separation', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('Phase 1: Scan codebase');
      expect(cliContent).toContain('Phase 2: Preview and apply local fixes');
      expect(cliContent).toContain('Phase 3: Gateway issues detection');
    });

    test('local fixes applied before gateway detection', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      
      const localFixesIndex = cliContent.indexOf('Preview and apply local fixes');
      const gatewayIndex = cliContent.indexOf('Gateway issues detection');
      
      expect(localFixesIndex).toBeGreaterThan(0);
      expect(gatewayIndex).toBeGreaterThan(0);
      expect(localFixesIndex).toBeLessThan(gatewayIndex);
    });
  });

  describe('Credentials Safety', () => {
    test('confirmAction helper exists', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('async function confirmAction');
    });

    test('apply asks for .env confirmation', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('Write API key to .env');
    });

    test('apply asks for file modification confirmation', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('This will modify your project files');
    });
  });

  describe('Safe Defaults', () => {
    test('confirmation defaults to No (safe)', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      
      // Check that confirmAction helper has safe default
      expect(cliContent).toContain('defaultYes: boolean = false');
      // Check that explicit false is used for safety-critical confirmations
      expect(cliContent).toContain('false  // Default to No for safety');
    });

    test('--yes flag exists but does not auto-enable Badgr', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain("'--yes'");
      expect(cliContent).toContain('never auto-enables Badgr');
    });

    test('test option is recommended as safe choice', () => {
      const badgrContent = fs.readFileSync(
        path.join(__dirname, 'node', 'badgr-integration.ts'),
        'utf-8'
      );
      expect(badgrContent).toContain('[Recommended]');
      expect(badgrContent).toContain('Test Badgr');
    });
  });

  describe('User Communication', () => {
    test('clear messaging about file modifications', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('No files were modified');
      expect(cliContent).toContain('Skipped');
      expect(cliContent).toContain('cancelled');
    });

    test('shows what will be modified before applying', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('Proposed Changes');
      expect(fixerContent).toContain('Issues fixed');
    });
  });
});

describe('AI Patch Doctor - CLI Flags from todo.md', () => {
  
  describe('--fix Flag', () => {
    test('--fix flag exists in doctor command', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain("'--fix'");
      expect(cliContent).toContain('Automatically apply safe code patches');
    });

    test('--fix mode is non-interactive', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('Auto-fix mode');
      expect(cliContent).toMatch(/if.*options\.fix/);
    });

    test('--fix applies local patches automatically', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('applyFixes');
      expect(cliContent).toContain('Applying fixes');
    });
  });

  describe('--share Flag', () => {
    test('--share flag exists in doctor command', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain("'--share'");
      expect(cliContent).toContain('Generate shareable report');
    });

    test('--share generates report.md and report.json', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('report.md');
      expect(cliContent).toContain('report.json');
    });

    test('generateMarkdownReport function exists', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('function generateMarkdownReport');
      expect(cliContent).toContain('AI Patch Doctor Report');
    });
  });

  describe('--ci Flag Enhancement', () => {
    test('--ci flag exists and documented', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain("'--ci'");
      expect(cliContent).toContain('CI mode');
    });

    test('--ci mode never prompts', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('options.ci');
      expect(cliContent).toContain('never prompt');
    });
  });

  describe('Doctor Command Integration', () => {
    test('doctor command is default command', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain("command('doctor'");
      expect(cliContent).toContain('isDefault: true');
    });

    test('doctor has interactive flow (THE FORK)', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('THE FORK');
      expect(cliContent).toContain('Fix safe code issues');
      expect(cliContent).toContain('Fix everything');
      expect(cliContent).toContain('Just show me the report');
    });

    test('apply command marked as [INTERNAL]', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain("[INTERNAL]");
    });
  });
  
  describe('Verification Re-scan', () => {
    test('doctor includes verification re-scan after fixes', () => {
      const cliContent = fs.readFileSync(
        path.join(__dirname, 'node', 'src', 'cli.ts'),
        'utf-8'
      );
      expect(cliContent).toContain('Verifying fixes');
      expect(cliContent).toContain('afterScan');
      expect(cliContent).toContain('printVerificationComparison');
    });
    
    test('printVerificationComparison function exists', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('export function printVerificationComparison');
      expect(fixerContent).toContain('beforeIssues');
      expect(fixerContent).toContain('afterIssues');
    });
    
    test('verification shows before/after counts', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('Local issues:');
      expect(fixerContent).toContain('fixed');
      expect(fixerContent).toContain('Gateway issues remain');
    });
  });
  
  describe('Fix Reliability Improvements', () => {
    test('429 type is handled in fixer', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain("case '429'");
      expect(fixerContent).toContain('gateway-layer');
    });
    
    test('invalid line numbers handled gracefully', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('Invalid line number');
      expect(fixerContent).toContain('manual review required');
    });
    
    test('streaming marked as manual required', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('requiresManual');
      expect(fixerContent).toContain('framework-specific');
    });
    
    test('issues are deduplicated', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('Deduplicate issues');
      expect(fixerContent).toContain('uniqueIssues');
    });
  });
  
  describe('Better Result Reporting', () => {
    test('result buckets updated', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('applied:');
      expect(fixerContent).toContain('manual:');
      expect(fixerContent).toContain('skipped:');
      expect(fixerContent).toContain('error:');
    });
    
    test('printFixResults uses new labels', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).toContain('Applied:');
      expect(fixerContent).toContain('Manual required:');
      expect(fixerContent).toContain('gateway-layer');
    });
    
    test('no scary Failed counts for manual items', () => {
      const fixerContent = fs.readFileSync(
        path.join(__dirname, 'node', 'fixer.ts'),
        'utf-8'
      );
      expect(fixerContent).not.toContain('Failed: ${result.failed}');
      expect(fixerContent).toContain('Manual required: ${result.manual}');
    });
  });
});
