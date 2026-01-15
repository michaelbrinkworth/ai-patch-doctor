#!/usr/bin/env python3
"""
Retry Issues (Gemini) - Problems AI Patch Doctor will detect:
1. No exponential backoff
2. Infinite retries (no max limit)
3. Retrying on all errors (including 4xx)
4. No retry-after header handling
"""

import os
import sys
import time
import google.generativeai as genai
from google.api_core import exceptions

api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print("Error: GEMINI_API_KEY environment variable not set", file=sys.stderr)
    sys.exit(1)

genai.configure(api_key=api_key)

def chat_with_bad_retries():
    """Chat with Gemini - problematic retry logic."""
    
    max_attempts = 100  # ISSUE 1: Too many retries (should be 3-5)
    
    model = genai.GenerativeModel('gemini-pro')
    
    for attempt in range(max_attempts):
        try:
            response = model.generate_content(
                "Hello",
                # ISSUE 2: No timeout in request_options
            )
            print(f"Success: {response.text}")
            return response
            
        except exceptions.ResourceExhausted as e:
            # ISSUE 3: Linear backoff instead of exponential
            wait_time = 1  # Should be 2^attempt
            print(f"Rate limited, waiting {wait_time}s (attempt {attempt + 1})...")
            time.sleep(wait_time)
            
        except Exception as e:
            # ISSUE 4: Retrying on all errors (including 4xx client errors)
            if attempt < max_attempts - 1:
                print(f"Error: {e}, retrying...")
                time.sleep(1)
            else:
                raise
    
    raise Exception("Max attempts reached")

if __name__ == "__main__":
    chat_with_bad_retries()
