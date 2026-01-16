#!/usr/bin/env python3
"""
Traceability Issues (Claude/Anthropic) - Problems AI Patch Doctor will detect:
1. No request IDs
2. No idempotency keys
3. No correlation tracking
4. Duplicate request detection disabled
"""

import os
import sys
from anthropic import Anthropic

api_key = os.getenv('ANTHROPIC_API_KEY')
if not api_key:
    print("Error: ANTHROPIC_API_KEY environment variable not set", file=sys.stderr)
    sys.exit(1)

client = Anthropic(api_key=api_key)

def chat_without_traceability():
    """Chat with Claude without proper traceability."""
    
    # ISSUE 1: No request ID tracking
    # ISSUE 2: No idempotency key
    # ISSUE 3: No correlation ID
    
    message = client.messages.create(
        model="claude-3-sonnet-20240229",
        messages=[
            {"role": "user", "content": "Hello"}
        ],
        max_tokens=1024,
        # MISSING: extra_headers with request-id
        # MISSING: extra_headers with idempotency-key
        # MISSING: extra_headers with correlation-id
    )
    
    print(f"Response: {message.content[0].text}")
    print("⚠️  No traceability - can't track or deduplicate requests!")

def duplicate_requests():
    """Example of code that could create duplicate requests with Claude."""
    
    # ISSUE 4: No duplicate detection
    message_text = "Generate a unique ID"
    
    # Could accidentally call twice (network retry, user double-click, etc.)
    message1 = client.messages.create(
        model="claude-3-sonnet-20240229",
        messages=[{"role": "user", "content": message_text}],
        max_tokens=1024,
        # MISSING: extra_headers with idempotency-key to prevent duplicates
    )
    
    message2 = client.messages.create(
        model="claude-3-sonnet-20240229",
        messages=[{"role": "user", "content": message_text}],
        max_tokens=1024,
        # MISSING: extra_headers with idempotency-key to prevent duplicates
    )
    
    print(f"Response 1: {message1.content[0].text}")
    print(f"Response 2: {message2.content[0].text}")
    print("⚠️  Duplicate requests - charged twice for same work!")

if __name__ == "__main__":
    print("Running Claude traceability issue examples...")
    # Uncomment to test (will make API calls):
    # chat_without_traceability()
    # duplicate_requests()
    print("⚠️  Code has traceability issues - check with AI Patch Doctor!")
