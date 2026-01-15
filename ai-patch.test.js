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

console.log('\n✅ AI Patch Doctor Test Suite');
console.log('Testing code reuse, structure, and functionality...\n');
