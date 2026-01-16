#!/usr/bin/env python3
"""
Streaming Issues - Problems AI Patch Doctor will detect:
1. Missing X-Accel-Buffering header
2. No timeout handling
3. Buffering enabled (causes SSE stalls)
"""

import os
import openai
from openai import OpenAI

# Initialize client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def streaming_chat_with_issues():
    """Streaming chat with intentional issues."""
    
    # ISSUE 1: No timeout set - can hang forever
    # ISSUE 2: Missing headers for streaming
    # ISSUE 3: No error handling for partial streams
    
    print("Starting streaming chat (with issues)...")
    
    stream = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": "Count from 1 to 10, one number per line"}
        ],
        stream=True,
        # MISSING: timeout parameter
        # MISSING: headers for streaming optimization
    )
    
    # ISSUE 4: No handling for stream interruptions
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            print(chunk.choices[0].delta.content, end='', flush=True)
    
    print("\nDone (but may have stalled or buffered)")

if __name__ == "__main__":
    streaming_chat_with_issues()
