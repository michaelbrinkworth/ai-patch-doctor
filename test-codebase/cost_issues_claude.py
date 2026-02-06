#!/usr/bin/env python3
"""
Cost Issues (Claude/Anthropic) - Problems AI Patch Doctor will detect:
1. No max_tokens limit (or set too high)
2. Unbounded prompt sizes
3. No cost estimation
4. Potential for runaway loops
"""

import os
import sys
from anthropic import Anthropic

api_key = os.getenv('ANTHROPIC_API_KEY')
if not api_key:
    print("Error: ANTHROPIC_API_KEY environment variable not set", file=sys.stderr)
    sys.exit(1)

client = Anthropic(api_key=api_key)

def chat_with_cost_issues():
    """Chat with Claude - cost-related problems."""
    
    # ISSUE 1: Very high max_tokens - can generate expensive content
    # ISSUE 2: Large prompt with no size check
    large_prompt = "Write a very long story about " + "a cat " * 1000
    
    message = client.messages.create(
        model="claude-3-opus-20240229",  # Most expensive Claude model
        messages=[
            {"role": "user", "content": large_prompt}
        ],
        max_tokens=4096,  # ISSUE: Very high token limit
        # MISSING: cost estimation before call
    )
    
    print(f"Response length: {len(message.content[0].text)} chars")
    print("  High token limit - could be very expensive!")

def potential_runaway_loop():
    """Example of code that could cause runaway costs with Claude."""
    
    # ISSUE 3: Loop with no safety limits
    for i in range(100):  # Could be infinite in production
        message = client.messages.create(
            model="claude-3-opus-20240229",
            messages=[
                {"role": "user", "content": f"Generate content {i}"}
            ],
            max_tokens=4096,  # ISSUE: No per-request cost cap
        )
        print(f"Iteration {i}: {len(message.content[0].text)} chars")

if __name__ == "__main__":
    print("Running Claude cost issue examples...")
    # Uncomment to test (will make API calls):
    # chat_with_cost_issues()
    # potential_runaway_loop()
    print("  Code has cost issues - check with AI Patch Doctor!")
