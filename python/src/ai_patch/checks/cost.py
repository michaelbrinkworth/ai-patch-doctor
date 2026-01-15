"""Cost checks - token limits, cost estimation."""

from typing import Dict, Any
from ai_patch.config import Config


def check(config: Config) -> Dict[str, Any]:
    """Run cost checks."""
    
    findings = []
    metrics = {}
    
    # Cost estimation (simplified - in production, would query actual pricing)
    # These are approximate OpenAI prices per 1M tokens
    pricing_map = {
        'gpt-4': (30.0, 60.0),
        'gpt-4-turbo': (10.0, 30.0),
        'gpt-4o': (2.5, 10.0),
        'gpt-4o-mini': (0.15, 0.60),
        'gpt-3.5-turbo': (0.50, 1.50),
    }
    
    model = config.model or 'gpt-3.5-turbo'
    
    # Find pricing
    input_price, output_price = pricing_map.get('gpt-3.5-turbo')
    for key, prices in pricing_map.items():
        if model.startswith(key):
            input_price, output_price = prices
            break
    
    metrics['input_price_per_1m'] = input_price
    metrics['output_price_per_1m'] = output_price
    
    # Recommendations
    findings.append({
        'severity': 'info',
        'message': f'Model pricing: ${input_price}/1M input, ${output_price}/1M output tokens'
    })
    
    findings.append({
        'severity': 'info',
        'message': 'Set max_tokens cap to prevent runaway costs (e.g., max_tokens: 2000)'
    })
    
    findings.append({
        'severity': 'info',
        'message': 'Monitor for tool/function call loops that can burn tokens quickly'
    })
    
    findings.append({
        'severity': 'info',
        'message': 'Consider implementing per-user or per-session token budgets'
    })
    
    findings.append({
        'severity': 'warning',
        'message': 'No prompt size validation detected. Large prompts can cause cost spikes.'
    })
    
    status = 'warn'  # Always warn since cost controls are critical
    
    return {
        'status': status,
        'findings': findings,
        'metrics': metrics
    }
