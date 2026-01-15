#!/usr/bin/env python3
"""
Traceability Issues - Problems AI Patch Doctor will detect:
1. No request IDs
2. No idempotency keys
3. No correlation tracking
4. Duplicate request detection disabled
"""

import os
import openai
from openai import OpenAI

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def chat_without_traceability():
    """Chat without proper traceability."""
    
    # ISSUE 1: No request ID tracking
    # ISSUE 2: No idempotency key
    # ISSUE 3: No correlation ID
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": "Hello"}
        ],
        # MISSING: headers with request-id
        # MISSING: idempotency-key
        # MISSING: correlation-id
    )
    
    print(f"Response: {response.choices[0].message.content}")
    print("⚠️  No traceability - can't track or deduplicate requests!")

def duplicate_requests():
    """Example of code that could create duplicate requests."""
    
    # ISSUE 4: No duplicate detection
    message = "Generate a unique ID"
    
    # Could accidentally call twice (network retry, user double-click, etc.)
    response1 = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": message}],
        # MISSING: idempotency-key to prevent duplicates
    )
    
    response2 = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": message}],
        # MISSING: idempotency-key to prevent duplicates
    )
    
    print(f"Response 1: {response1.choices[0].message.content}")
    print(f"Response 2: {response2.choices[0].message.content}")
    print("⚠️  Duplicate requests - charged twice for same work!")

if __name__ == "__main__":
    print("Running traceability issue examples...")
    # Uncomment to test (will make API calls):
    # chat_without_traceability()
    # duplicate_requests()
    print("⚠️  Code has traceability issues - check with AI Patch Doctor!")
