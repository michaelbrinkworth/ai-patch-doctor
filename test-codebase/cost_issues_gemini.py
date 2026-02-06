#!/usr/bin/env python3
"""
Cost Issues (Gemini) - Problems AI Patch Doctor will detect:
1. No max_output_tokens limit
2. Unbounded prompt sizes
3. No cost estimation
4. Potential for runaway loops
"""

import os
import sys
import google.generativeai as genai

api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print("Error: GEMINI_API_KEY environment variable not set", file=sys.stderr)
    sys.exit(1)

genai.configure(api_key=api_key)

def chat_with_cost_issues():
    """Chat with Gemini - cost-related problems."""
    
    # ISSUE 1: No max_output_tokens limit - can generate unlimited tokens
    # ISSUE 2: Large prompt with no size check
    large_prompt = "Write a very long story about " + "a cat " * 1000
    
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content(
        large_prompt,
        # MISSING: generation_config with max_output_tokens
        # MISSING: cost estimation before call
    )
    
    print(f"Response length: {len(response.text)} chars")
    print("  No token limit - could be very expensive!")

def potential_runaway_loop():
    """Example of code that could cause runaway costs with Gemini."""
    
    # ISSUE 3: Loop with no safety limits
    model = genai.GenerativeModel('gemini-pro')
    
    for i in range(100):  # Could be infinite in production
        response = model.generate_content(
            f"Generate content {i}",
            # MISSING: generation_config with max_output_tokens
            # MISSING: per-request cost cap
        )
        print(f"Iteration {i}: {len(response.text)} chars")

if __name__ == "__main__":
    print("Running Gemini cost issue examples...")
    # Uncomment to test (will make API calls):
    # chat_with_cost_issues()
    # potential_runaway_loop()
    print("  Code has cost issues - check with AI Patch Doctor!")
