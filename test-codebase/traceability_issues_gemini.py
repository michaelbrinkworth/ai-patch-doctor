#!/usr/bin/env python3
"""
Traceability Issues (Gemini) - Problems AI Patch Doctor will detect:
1. No request IDs
2. No idempotency keys
3. No correlation tracking
4. Duplicate request detection disabled
"""

import os
import sys
import google.generativeai as genai

api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print("Error: GEMINI_API_KEY environment variable not set", file=sys.stderr)
    sys.exit(1)

genai.configure(api_key=api_key)

def chat_without_traceability():
    """Chat with Gemini without proper traceability."""
    
    # ISSUE 1: No request ID tracking
    # ISSUE 2: No correlation ID
    
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content(
        "Hello",
        # MISSING: request_options with headers (request-id, correlation-id)
        # MISSING: metadata for tracking
    )
    
    print(f"Response: {response.text}")
    print("  No traceability - can't track or deduplicate requests!")

def duplicate_requests():
    """Example of code that could create duplicate requests with Gemini."""
    
    # ISSUE 3: No duplicate detection
    prompt = "Generate a unique ID"
    
    model = genai.GenerativeModel('gemini-pro')
    
    # Could accidentally call twice (network retry, user double-click, etc.)
    response1 = model.generate_content(
        prompt,
        # MISSING: request tracking to prevent duplicates
    )
    
    response2 = model.generate_content(
        prompt,
        # MISSING: request tracking to prevent duplicates
    )
    
    print(f"Response 1: {response1.text}")
    print(f"Response 2: {response2.text}")
    print("  Duplicate requests - charged twice for same work!")

if __name__ == "__main__":
    print("Running Gemini traceability issue examples...")
    # Uncomment to test (will make API calls):
    # chat_without_traceability()
    # duplicate_requests()
    print("  Code has traceability issues - check with AI Patch Doctor!")
