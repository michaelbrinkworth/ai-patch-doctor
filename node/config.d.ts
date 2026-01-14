/**
 * Configuration management for AI Patch
 */
interface SavedConfig {
    apiKey?: string;
    baseUrl?: string;
}
export declare class Config {
    baseUrl: string;
    apiKey: string;
    provider: string;
    model?: string | undefined;
    constructor(baseUrl: string, apiKey: string, provider: string, model?: string | undefined);
    static autoDetect(provider?: string): Config;
    isValid(): boolean;
    getMissingVars(): string;
}
/**
 * Load saved configuration from home directory (~/.ai-patch/config.json)
 * Returns null if file doesn't exist or can't be read
 */
export declare function loadSavedConfig(): SavedConfig | null;
/**
 * Save configuration to home directory (~/.ai-patch/config.json)
 * Creates directory if it doesn't exist
 * Sets permissions to 0600 on Unix systems
 */
export declare function saveConfig(config: SavedConfig): void;
export {};
//# sourceMappingURL=config.d.ts.map