/**
 * Configuration management for AI Patch
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface SavedConfig {
  apiKey?: string;
  baseUrl?: string;
  provider?: string;
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
      baseUrl: config.baseUrl,
      provider: config.provider
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
 * Returns list of fields that were saved
 */
export function saveConfig(config: SavedConfig): string[] {
  try {
    const homeDir = os.homedir();
    if (!homeDir) {
      console.error('Warning: Could not determine home directory. Config not saved.');
      return [];
    }

    const configDir = path.join(homeDir, '.ai-patch');
    const configPath = path.join(configDir, 'config.json');

    // Create directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Build config data and track saved fields
    const configData: SavedConfig = {};
    const savedFields: string[] = [];
    
    if (config.apiKey) {
      configData.apiKey = config.apiKey;
      savedFields.push('api_key');
    }
    if (config.baseUrl) {
      configData.baseUrl = config.baseUrl;
      savedFields.push('base_url');
    }
    if (config.provider) {
      configData.provider = config.provider;
      savedFields.push('provider');
    }

    // Write config file
    const configJson = JSON.stringify(configData, null, 2);
    fs.writeFileSync(configPath, configJson, { mode: 0o600 });

    // On Unix, explicitly set permissions to 0600
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(configPath, 0o600);
      } catch (e) {
        // Ignore chmod errors
      }
    }
    
    return savedFields;
  } catch (error: any) {
    console.error('Warning: Could not save config.');
    return [];
  }
}

/**
 * Auto-detect provider from environment variables.
 * 
 * Returns tuple of [provider, detectedKeys, selectedKeyName, warningMessage]
 */
export function autoDetectProvider(
  providerFlag?: string,
  canPrompt: boolean = false
): [string, string[], string | null, string | null] {
  // Define provider order and their corresponding env var names
  const providerKeys: Record<string, string> = {
    'openai-compatible': 'OPENAI_API_KEY',
    'anthropic': 'ANTHROPIC_API_KEY',
    'gemini': 'GEMINI_API_KEY'
  };

  // Check which keys exist in environment
  const detectedKeys: string[] = [];
  for (const [prov, keyName] of Object.entries(providerKeys)) {
    if (process.env[keyName]) {
      detectedKeys.push(prov);
    }
  }

  let warningMessage: string | null = null;
  let selectedProvider: string | null = null;
  let selectedKeyName: string | null = null;

  // If --provider is provided, validate it
  if (providerFlag) {
    if (!providerKeys[providerFlag]) {
      // Invalid provider
      return [providerFlag, detectedKeys, null, `Invalid provider: ${providerFlag}`];
    }

    // Check if provider has key in env
    if (!detectedKeys.includes(providerFlag)) {
      if (canPrompt) {
        // Allow user to paste key interactively
        warningMessage = `${providerKeys[providerFlag]} not found in environment`;
      } else {
        return [providerFlag, detectedKeys, null,
          `Provider '${providerFlag}' specified but ${providerKeys[providerFlag]} not found`];
      }
    }

    selectedProvider = providerFlag;
    selectedKeyName = providerKeys[providerFlag];
  }
  // If exactly one key exists, use it
  else if (detectedKeys.length === 1) {
    selectedProvider = detectedKeys[0];
    selectedKeyName = providerKeys[selectedProvider];
  }
  // If multiple keys exist, use heuristics
  else if (detectedKeys.length > 1) {
    // Prefer provider with custom base URL env var set
    for (const prov of detectedKeys) {
      if (prov === 'openai-compatible' && process.env.OPENAI_BASE_URL) {
        selectedProvider = prov;
        selectedKeyName = providerKeys[prov];
        break;
      } else if (prov === 'anthropic' && process.env.ANTHROPIC_BASE_URL) {
        selectedProvider = prov;
        selectedKeyName = providerKeys[prov];
        break;
      } else if (prov === 'gemini' && process.env.GEMINI_BASE_URL) {
        selectedProvider = prov;
        selectedKeyName = providerKeys[prov];
        break;
      }
    }

    // Default to openai-compatible if no custom base URL
    if (!selectedProvider) {
      selectedProvider = 'openai-compatible';
      selectedKeyName = providerKeys[selectedProvider];
      warningMessage = `Multiple API keys detected (${detectedKeys.join(', ')}). Defaulting to openai-compatible.`;
    }
  }
  // No keys detected
  else {
    selectedProvider = providerFlag || 'openai-compatible';
    selectedKeyName = providerKeys[selectedProvider];
    if (!canPrompt) {
      warningMessage = `No API keys found. Set ${selectedKeyName} or run with -i`;
    }
  }

  return [selectedProvider, detectedKeys, selectedKeyName, warningMessage];
}
