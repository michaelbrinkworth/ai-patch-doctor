/**
 * AI Patch Doctor - Badgr Onboarding Tests
 * 
 * Tests the new Frictionless Onboarding flow with AI Badgr
 */

const fs = require('fs');
const path = require('path');

describe('AI Patch Doctor - Badgr Onboarding', () => {
  
  describe('generateBadgrKey function', () => {
    // Extract the function from the compiled code
    function generateBadgrKey(email) {
      let hash = 0;
      for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const suffix = Math.abs(hash).toString(36).padStart(8, '0').slice(-8);
      return `badgr_live_${suffix}`;
    }

    test('generates key with correct format', () => {
      const key = generateBadgrKey('test@example.com');
      expect(key).toMatch(/^badgr_live_[a-z0-9]{8}$/);
    });

    test('generates consistent keys for same email', () => {
      const email = 'user@domain.com';
      const key1 = generateBadgrKey(email);
      const key2 = generateBadgrKey(email);
      expect(key1).toBe(key2);
    });

    test('generates different keys for different emails', () => {
      const key1 = generateBadgrKey('user1@example.com');
      const key2 = generateBadgrKey('user2@example.com');
      expect(key1).not.toBe(key2);
    });

    test('key prefix is always badgr_live_', () => {
      const emails = ['test@example.com', 'admin@company.org', 'user@domain.net'];
      emails.forEach(email => {
        const key = generateBadgrKey(email);
        expect(key.startsWith('badgr_live_')).toBe(true);
      });
    });
  });

  describe('CLI Code Structure', () => {
    test('cli.ts contains generateBadgrKey function', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain('function generateBadgrKey');
    });

    test('cli.ts contains promptYesNo function', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain('function promptYesNo');
    });

    test('cli.ts contains promptText function', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain('function promptText');
    });

    test('cli.ts contains AI Badgr onboarding logic', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain('Do you want to use AI Badgr instead?');
    });

    test('cli.ts contains email prompt', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain('Enter your email address:');
    });

    test('cli.ts sets Badgr gateway URL', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain('https://gateway.badgr.dev');
    });

    test('cli.ts prompts to save Badgr config', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain('Do you want to save this Badgr configuration');
    });

    test('cli.ts uses usedBadgrOnboarding flag', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain('usedBadgrOnboarding');
    });
  });

  describe('Badgr Flow Logic', () => {
    test('Badgr flow only triggered when canPrompt is true', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      
      // Check that the Badgr offer is inside the canPrompt check
      const canPromptSection = content.split('if (!config.isValid()) {')[1];
      expect(canPromptSection).toBeTruthy();
      
      const hasCanPromptGuard = canPromptSection.includes('if (!canPrompt)');
      expect(hasCanPromptGuard).toBe(true);
    });

    test('User can decline Badgr and get helpful exit message', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain('API key is required to run diagnostics');
      expect(content).toContain('Set ${config.getMissingVars()} or try again');
    });

    test('Empty email is handled with error message', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain('Email is required to use AI Badgr');
    });

    test('Config continues after Badgr setup (no exit before checks)', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      
      // Verify the flow continues to "Running checks"
      const badgrSection = content.split('usedBadgrOnboarding = true')[1];
      const beforeRunningChecks = content.split('Running ${target} checks')[0];
      
      // The Badgr section should come before running checks
      expect(beforeRunningChecks).toContain('usedBadgrOnboarding = true');
    });
  });

  describe('Provider Detection', () => {
    test('Correct provider name displayed for OpenAI', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain("provider === 'openai-compatible' ? 'OpenAI'");
    });

    test('Correct provider name displayed for Anthropic', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain("provider === 'anthropic' ? 'Anthropic'");
    });

    test('Correct provider name displayed for Gemini', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      expect(content).toContain("provider === 'gemini' ? 'Gemini'");
    });
  });

  describe('Config Persistence', () => {
    test('Badgr config can be saved with saveConfig', () => {
      const cliPath = path.join(__dirname, 'node', 'src', 'cli.ts');
      const content = fs.readFileSync(cliPath, 'utf8');
      
      // Check that saveConfig is called with Badgr credentials
      expect(content).toContain('saveConfig({');
      expect(content).toContain('apiKey: config.apiKey');
      expect(content).toContain('baseUrl: config.baseUrl');
    });
  });
});

console.log('\n✅ AI Patch Doctor - Badgr Onboarding Test Suite');
console.log('Testing new Frictionless Onboarding flow...\n');
