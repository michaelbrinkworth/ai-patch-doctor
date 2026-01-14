"use strict";
/**
 * Configuration management for AI Patch
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
exports.loadSavedConfig = loadSavedConfig;
exports.saveConfig = saveConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class Config {
    constructor(baseUrl, apiKey, provider, model) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.provider = provider;
        this.model = model;
    }
    static autoDetect(provider = 'openai-compatible') {
        let baseUrl;
        let apiKey;
        let model;
        if (provider === 'openai-compatible') {
            baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com';
            apiKey = process.env.OPENAI_API_KEY || '';
            model = process.env.MODEL || 'gpt-3.5-turbo';
            // Check for common gateway env vars
            if (!baseUrl || baseUrl === 'https://api.openai.com') {
                const litellmUrl = process.env.LITELLM_PROXY_URL;
                if (litellmUrl)
                    baseUrl = litellmUrl;
                const portkeyUrl = process.env.PORTKEY_BASE_URL;
                if (portkeyUrl)
                    baseUrl = portkeyUrl;
                const heliconeUrl = process.env.HELICONE_BASE_URL;
                if (heliconeUrl)
                    baseUrl = heliconeUrl;
            }
        }
        else if (provider === 'anthropic') {
            baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
            apiKey = process.env.ANTHROPIC_API_KEY || '';
            model = process.env.MODEL || 'claude-3-5-sonnet-20241022';
        }
        else if (provider === 'gemini') {
            baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
            apiKey = process.env.GEMINI_API_KEY || '';
            model = process.env.MODEL || 'gemini-pro';
        }
        else {
            baseUrl = process.env.OPENAI_BASE_URL || '';
            apiKey = process.env.OPENAI_API_KEY || '';
            model = process.env.MODEL || 'gpt-3.5-turbo';
        }
        return new Config(baseUrl, apiKey, provider, model);
    }
    isValid() {
        return !!(this.baseUrl && this.apiKey);
    }
    getMissingVars() {
        const missing = [];
        if (!this.baseUrl) {
            if (this.provider === 'anthropic') {
                missing.push('ANTHROPIC_BASE_URL');
            }
            else if (this.provider === 'gemini') {
                missing.push('GEMINI_BASE_URL');
            }
            else {
                missing.push('OPENAI_BASE_URL');
            }
        }
        if (!this.apiKey) {
            if (this.provider === 'anthropic') {
                missing.push('ANTHROPIC_API_KEY');
            }
            else if (this.provider === 'gemini') {
                missing.push('GEMINI_API_KEY');
            }
            else {
                missing.push('OPENAI_API_KEY');
            }
        }
        return missing.join(', ');
    }
}
exports.Config = Config;
/**
 * Load saved configuration from home directory (~/.ai-patch/config.json)
 * Returns null if file doesn't exist or can't be read
 */
function loadSavedConfig() {
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
    }
    catch (error) {
        // Silently fail and return null
        return null;
    }
}
/**
 * Save configuration to home directory (~/.ai-patch/config.json)
 * Creates directory if it doesn't exist
 * Sets permissions to 0600 on Unix systems
 */
function saveConfig(config) {
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
            }
            catch (e) {
                // Ignore chmod errors
            }
        }
    }
    catch (error) {
        console.error(`Warning: Could not save config: ${error.message}`);
    }
}
//# sourceMappingURL=config.js.map