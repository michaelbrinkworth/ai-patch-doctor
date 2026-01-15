"""Retry checks - 429s, Retry-After, backoff."""

import httpx
from typing import Dict, Any
from ai_patch.config import Config


def check(config: Config) -> Dict[str, Any]:
    """Run retry checks."""
    
    findings = []
    metrics = {}
    
    try:
        # Test for 429 handling
        url = f"{config.base_url.rstrip('/')}/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": config.model or "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": "Test"}],
            "max_tokens": 10
        }
        
        # Make a test request
        response = httpx.post(url, headers=headers, json=payload, timeout=30.0)
        
        # Check for rate limit headers
        if 'retry-after' in response.headers:
            retry_after = response.headers['retry-after']
            findings.append({
                'severity': 'info',
                'message': f'Retry-After header present: {retry_after}s'
            })
            metrics['retry_after_s'] = retry_after
        
        if 'x-ratelimit-remaining' in response.headers:
            remaining = response.headers['x-ratelimit-remaining']
            metrics['ratelimit_remaining'] = remaining
            
            if int(remaining) < 10:
                findings.append({
                    'severity': 'warning',
                    'message': f'Low rate limit remaining: {remaining}'
                })
        
        # General recommendations
        findings.append({
            'severity': 'info',
            'message': 'Recommended: Use exponential backoff with jitter for retries'
        })
        
        findings.append({
            'severity': 'info',
            'message': 'Never retry after stream has started (partial response received)'
        })
        
        findings.append({
            'severity': 'info',
            'message': 'Set retry cap (e.g., 3 attempts max) to avoid infinite loops'
        })
        
        status = 'pass'
        
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            status = 'warn'
            retry_after = e.response.headers.get('retry-after', 'not set')
            findings.append({
                'severity': 'warning',
                'message': f'Rate limited (429). Retry-After: {retry_after}'
            })
        else:
            status = 'fail'
            findings.append({
                'severity': 'error',
                'message': f'HTTP error {e.response.status_code}'
            })
    except Exception as e:
        status = 'fail'
        findings.append({
            'severity': 'error',
            'message': f'Retry check failed: {str(e)}'
        })
    
    return {
        'status': status,
        'findings': findings,
        'metrics': metrics
    }
