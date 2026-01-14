"""Configuration management for AI Patch."""

import os
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass


@dataclass
class Config:
    """Configuration for AI Patch checks."""
    
    base_url: str
    api_key: str
    provider: str
    model: Optional[str] = None
    
    @classmethod
    def auto_detect(cls, provider: str = 'openai-compatible') -> 'Config':
        """Auto-detect configuration from environment variables."""
        
        if provider == 'openai-compatible':
            base_url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com')
            api_key = os.getenv('OPENAI_API_KEY', '')
            model = os.getenv('MODEL', 'gpt-3.5-turbo')
            
            # Check for common gateway env vars
            if not base_url or base_url == 'https://api.openai.com':
                # Try LiteLLM proxy
                litellm_url = os.getenv('LITELLM_PROXY_URL')
                if litellm_url:
                    base_url = litellm_url
                
                # Try Portkey
                portkey_url = os.getenv('PORTKEY_BASE_URL')
                if portkey_url:
                    base_url = portkey_url
                    
                # Try Helicone
                helicone_url = os.getenv('HELICONE_BASE_URL')
                if helicone_url:
                    base_url = helicone_url
        
        elif provider == 'anthropic':
            base_url = os.getenv('ANTHROPIC_BASE_URL', 'https://api.anthropic.com')
            api_key = os.getenv('ANTHROPIC_API_KEY', '')
            model = os.getenv('MODEL', 'claude-3-5-sonnet-20241022')
        
        elif provider == 'gemini':
            base_url = os.getenv('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com')
            api_key = os.getenv('GEMINI_API_KEY', '')
            model = os.getenv('MODEL', 'gemini-pro')
        
        else:
            base_url = os.getenv('OPENAI_BASE_URL', '')
            api_key = os.getenv('OPENAI_API_KEY', '')
            model = os.getenv('MODEL', 'gpt-3.5-turbo')
        
        return cls(
            base_url=base_url,
            api_key=api_key,
            provider=provider,
            model=model
        )
    
    def is_valid(self) -> bool:
        """Check if configuration is valid."""
        return bool(self.base_url and self.api_key)
    
    def get_missing_vars(self) -> str:
        """Get list of missing environment variables."""
        missing = []
        
        if not self.base_url:
            if self.provider == 'anthropic':
                missing.append('ANTHROPIC_BASE_URL')
            elif self.provider == 'gemini':
                missing.append('GEMINI_BASE_URL')
            else:
                missing.append('OPENAI_BASE_URL')
        
        if not self.api_key:
            if self.provider == 'anthropic':
                missing.append('ANTHROPIC_API_KEY')
            elif self.provider == 'gemini':
                missing.append('GEMINI_API_KEY')
            else:
                missing.append('OPENAI_API_KEY')
        
        return ', '.join(missing)


def load_saved_config() -> Optional[Dict[str, Any]]:
    """Load saved configuration from home directory (~/.ai-patch/config.json).
    
    Returns:
        Dictionary with apiKey and baseUrl, or None if file doesn't exist or can't be read
    """
    try:
        home_dir = Path.home()
        config_path = home_dir / '.ai-patch' / 'config.json'
        
        if not config_path.exists():
            return None
        
        with open(config_path, 'r') as f:
            config_data = json.load(f)
        
        return {
            'apiKey': config_data.get('apiKey'),
            'baseUrl': config_data.get('baseUrl')
        }
    except Exception:
        # Silently fail and return None
        return None


def save_config(api_key: Optional[str] = None, base_url: Optional[str] = None) -> None:
    """Save configuration to home directory (~/.ai-patch/config.json).
    
    Creates directory if it doesn't exist.
    Sets permissions to 0600 on Unix systems.
    
    Args:
        api_key: API key to save
        base_url: Base URL to save
    """
    try:
        home_dir = Path.home()
        config_dir = home_dir / '.ai-patch'
        config_path = config_dir / 'config.json'
        
        # Create directory if it doesn't exist
        config_dir.mkdir(parents=True, exist_ok=True)
        
        # Prepare config data
        config_data = {}
        if api_key:
            config_data['apiKey'] = api_key
        if base_url:
            config_data['baseUrl'] = base_url
        
        # Write config file
        with open(config_path, 'w') as f:
            json.dump(config_data, f, indent=2)
        
        # On Unix, set permissions to 0600
        if os.name != 'nt':  # Not Windows
            try:
                os.chmod(config_path, 0o600)
            except Exception:
                # Ignore chmod errors
                pass
    except Exception as e:
        print(f'Warning: Could not save config.')

