#!/usr/bin/env python3
"""
Streaming Issues (Claude/Anthropic) - Problems AI Patch Doctor will detect:
1. Missing streaming headers
2. No timeout handling
3. Buffering issues with Claude streaming
"""

import os
import sys
from anthropic import Anthropic

# Initialize client
api_key = os.getenv('ANTHROPIC_API_KEY')
if not api_key:
    print("Error: ANTHROPIC_API_KEY environment variable not set", file=sys.stderr)
    sys.exit(1)

client = Anthropic(api_key=api_key)

def streaming_chat_with_issues():
    """Streaming chat with Claude - intentional issues."""
    
    # ISSUE 1: No timeout set - can hang forever
    # ISSUE 2: Missing headers for streaming
    # ISSUE 3: No error handling for partial streams
    
    print("Starting Claude streaming chat (with issues)...")
    
    # ISSUE 4: No handling for stream interruptions
    with client.messages.stream(
        model="claude-3-sonnet-20240229",
        messages=[
            {"role": "user", "content": "Count from 1 to 10, one number per line"}
        ],
        max_tokens=1024,
        # MISSING: timeout parameter
        # MISSING: headers for streaming optimization
    ) as stream:
        for text in stream.text_stream:
            print(text, end='', flush=True)
    
    print("\nDone (but may have stalled or buffered)")

if __name__ == "__main__":
    streaming_chat_with_issues()
