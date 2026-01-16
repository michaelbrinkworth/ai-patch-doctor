#!/usr/bin/env python3
"""
Retry Issues - Problems AI Patch Doctor will detect:
1. No exponential backoff
2. Infinite retries (no max limit)
3. Retrying on all errors (including 4xx)
4. No retry-after header handling
"""

import os
import time
import openai
from openai import OpenAI

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def chat_with_bad_retries():
    """Chat with problematic retry logic."""
    
    max_attempts = 100  # ISSUE 1: Too many retries (should be 3-5)
    
    for attempt in range(max_attempts):
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": "Hello"}
                ],
                # ISSUE 2: No timeout
            )
            print(f"Success: {response.choices[0].message.content}")
            return response
            
        except openai.RateLimitError as e:
            # ISSUE 3: Linear backoff instead of exponential
            wait_time = 1  # Should be 2^attempt
            print(f"Rate limited, waiting {wait_time}s (attempt {attempt + 1})...")
            time.sleep(wait_time)
            
        except openai.APIError as e:
            # ISSUE 4: Retrying on all errors (including 4xx client errors)
            if attempt < max_attempts - 1:
                print(f"Error: {e}, retrying...")
                time.sleep(1)
            else:
                raise
    
    raise Exception("Max attempts reached")

if __name__ == "__main__":
    chat_with_bad_retries()
