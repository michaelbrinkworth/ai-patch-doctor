#!/usr/bin/env python3
"""
Cost Issues - Problems AI Patch Doctor will detect:
1. No max_tokens limit
2. Unbounded prompt sizes
3. No cost estimation
4. Potential for runaway loops
"""

import os
import openai
from openai import OpenAI

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def chat_with_cost_issues():
    """Chat with cost-related problems."""
    
    # ISSUE 1: No max_tokens limit - can generate unlimited tokens
    # ISSUE 2: Large prompt with no size check
    large_prompt = "Write a very long story about " + "a cat " * 1000
    
    response = client.chat.completions.create(
        model="gpt-4",  # Expensive model
        messages=[
            {"role": "user", "content": large_prompt}
        ],
        # MISSING: max_tokens parameter
        # MISSING: cost estimation before call
        temperature=0.7,
    )
    
    print(f"Response length: {len(response.choices[0].message.content)} chars")
    print("⚠️  No token limit - could be very expensive!")

def potential_runaway_loop():
    """Example of code that could cause runaway costs."""
    
    # ISSUE 3: Loop with no safety limits
    for i in range(100):  # Could be infinite in production
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "user", "content": f"Generate content {i}"}
            ],
            # MISSING: max_tokens
            # MISSING: per-request cost cap
        )
        print(f"Iteration {i}: {len(response.choices[0].message.content)} chars")

if __name__ == "__main__":
    print("Running cost issue examples...")
    # Uncomment to test (will make API calls):
    # chat_with_cost_issues()
    # potential_runaway_loop()
    print("⚠️  Code has cost issues - check with AI Patch Doctor!")
