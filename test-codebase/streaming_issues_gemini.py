#!/usr/bin/env python3
"""
Streaming Issues (Gemini) - Problems AI Patch Doctor will detect:
1. Missing streaming headers
2. No timeout handling
3. Buffering issues with Gemini streaming
"""

import os
import google.generativeai as genai

# Initialize client
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def streaming_chat_with_issues():
    """Streaming chat with Gemini - intentional issues."""
    
    # ISSUE 1: No timeout set - can hang forever
    # ISSUE 2: Missing headers for streaming
    # ISSUE 3: No error handling for partial streams
    
    print("Starting Gemini streaming chat (with issues)...")
    
    model = genai.GenerativeModel('gemini-pro')
    
    # ISSUE 4: No handling for stream interruptions
    response = model.generate_content(
        "Count from 1 to 10, one number per line",
        stream=True,
        # MISSING: timeout parameter
        # MISSING: request_options for streaming optimization
    )
    
    for chunk in response:
        if chunk.text:
            print(chunk.text, end='', flush=True)
    
    print("\nDone (but may have stalled or buffered)")

if __name__ == "__main__":
    streaming_chat_with_issues()
