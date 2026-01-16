#!/usr/bin/env python3
"""
All Issues Combined - A file with all types of problems
This is what you'd run AI Patch Doctor on to see all checks
"""

import os
import time
import openai
from openai import OpenAI

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def problematic_api_call():
    """An API call with multiple issues."""
    
    # STREAMING ISSUES:
    # - No timeout
    # - Missing streaming headers
    
    # RETRY ISSUES:
    # - No exponential backoff
    # - Too many retries
    
    # COST ISSUES:
    # - No max_tokens
    # - Large prompt
    
    # TRACEABILITY ISSUES:
    # - No request ID
    # - No idempotency key
    
    max_retries = 10  # Too many
    
    for attempt in range(max_retries):
        try:
            # Large prompt (cost issue)
            large_prompt = "Write a detailed analysis of " + "AI " * 500
            
            # Streaming with issues
            stream = client.chat.completions.create(
                model="gpt-4",  # Expensive
                messages=[{"role": "user", "content": large_prompt}],
                stream=True,
                # MISSING: max_tokens
                # MISSING: timeout
                # MISSING: headers for streaming
                # MISSING: idempotency-key
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    print(chunk.choices[0].delta.content, end='', flush=True)
            
            print("\n✅ Success!")
            return
            
        except openai.RateLimitError:
            # Bad retry logic
            wait = 1  # Should be exponential
            print(f"Rate limited, waiting {wait}s...")
            time.sleep(wait)
            
        except Exception as e:
            print(f"Error: {e}")
            if attempt < max_retries - 1:
                time.sleep(1)
            else:
                raise

if __name__ == "__main__":
    print("⚠️  This code has multiple issues!")
    print("Run: pipx run ai-patch-doctor doctor")
    print("Or: npx ai-patch doctor")
    print("\nSelect 'all' or specific checks to see issues detected.")
