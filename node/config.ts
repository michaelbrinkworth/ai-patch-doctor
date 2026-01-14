/**
 * Configuration management for AI Patch
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface SavedConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class Config {
  constructor(
    public baseUrl: string,
    public apiKey: string,
    public provider: string,
    public model?: string
  ) {}

  static autoDetect(provider: string = 'openai-compatible'): Config {
    let baseUrl: string;
    let apiKey: string;
    let model: string | undefined;

    if (provider === 'openai-compatible') {
      baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com';
      apiKey = process.env.OPENAI_API_KEY || '';
      model = process.env.MODEL || 'gpt-3.5-turbo';

      // Check for common gateway env vars
      if (!baseUrl || baseUrl === 'https://api.openai.com') {
        const litellmUrl = process.env.LITELLM_PROXY_URL;
        if (litellmUrl) baseUrl = litellmUrl;

        const portkeyUrl = process.env.PORTKEY_BASE_URL;
        if (portkeyUrl) baseUrl = portkeyUrl;

        const heliconeUrl = process.env.HELICONE_BASE_URL;
        if (heliconeUrl) baseUrl = heliconeUrl;
      }
    } else if (provider === 'anthropic') {
      baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
      apiKey = process.env.ANTHROPIC_API_KEY || '';
      model = process.env.MODEL || 'claude-3-5-sonnet-20241022';
    } else if (provider === 'gemini') {
      baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
      apiKey = process.env.GEMINI_API_KEY || '';
      model = process.env.MODEL || 'gemini-pro';
    } else {
      baseUrl = process.env.OPENAI_BASE_URL || '';
      apiKey = process.env.OPENAI_API_KEY || '';
      model = process.env.MODEL || 'gpt-3.5-turbo';
    }

    return new Config(baseUrl, apiKey, provider, model);
  }

  isValid(): boolean {
    return !!(this.baseUrl && this.apiKey);
  }

  getMissingVars(): string {
    const missing: string[] = [];

    if (!this.baseUrl) {
      if (this.provider === 'anthropic') {
        missing.push('ANTHROPIC_BASE_URL');
      } else if (this.provider === 'gemini') {
        missing.push('GEMINI_BASE_URL');
      } else {
        missing.push('OPENAI_BASE_URL');
      }
    }

    if (!this.apiKey) {
      if (this.provider === 'anthropic') {
        missing.push('ANTHROPIC_API_KEY');
      } else if (this.provider === 'gemini') {
        missing.push('GEMINI_API_KEY');
      } else {
        missing.push('OPENAI_API_KEY');
      }
    }

    return missing.join(', ');
  }
}

/**
 * Load saved configuration from home directory (~/.ai-patch/config.json)
 * Returns null if file doesn't exist or can't be read
 */
export function loadSavedConfig(): SavedConfig | null {
  try {
    const homeDir = os.homedir();
    if (!homeDir) {
      return null;
    }

    const configPath = path.join(homeDir, '.ai-patch', 'config.json');
    
    if (!fs.existsSync(configPath)) {
      return null;
    }

    const configData = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    return {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl
    };
  } catch (error) {
    // Silently fail and return null
    return null;
  }
}

/**
 * Save configuration to home directory (~/.ai-patch/config.json)
 * Creates directory if it doesn't exist
 * Sets permissions to 0600 on Unix systems
 */
export function saveConfig(config: SavedConfig): void {
  try {
    const homeDir = os.homedir();
    if (!homeDir) {
      console.error('Warning: Could not determine home directory. Config not saved.');
      return;
    }

    const configDir = path.join(homeDir, '.ai-patch');
    const configPath = path.join(configDir, 'config.json');

    // Create directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Write config file
    const configData = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, configData, { mode: 0o600 });

    // On Unix, explicitly set permissions to 0600
    // (writeFileSync mode option should handle this, but being explicit)
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(configPath, 0o600);
      } catch (e) {
        // Ignore chmod errors
      }
    }
  } catch (error: any) {
    console.error('Warning: Could not save config.');
  }
}
