#!/usr/bin/env node
/**
 * Cost Issues (Claude/Anthropic) - Problems AI Patch Doctor will detect:
 * 1. No max_tokens limit (or set too high)
 * 2. Unbounded prompt sizes
 * 3. No cost estimation
 * 4. Potential for runaway loops
 */

const Anthropic = require('@anthropic-ai/sdk');

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Error: ANTHROPIC_API_KEY environment variable not set');
  process.exit(1);
}

const client = new Anthropic({
  apiKey: apiKey
});

async function chatWithCostIssues() {
  // ISSUE 1: Very high max_tokens - can generate expensive content
  // ISSUE 2: Large prompt with no size check
  const largePrompt = 'Write a very long story about ' + 'a cat '.repeat(1000);
  
  const message = await client.messages.create({
    model: 'claude-3-opus-20240229',  // Most expensive Claude model
    messages: [
      { role: 'user', content: largePrompt }
    ],
    max_tokens: 4096,  // ISSUE: Very high token limit
    // MISSING: cost estimation before call
  });
  
  console.log(`Response length: ${message.content[0].text.length} chars`);
  console.log('  High token limit - could be very expensive!');
}

async function potentialRunawayLoop() {
  // ISSUE 3: Loop with no safety limits
  for (let i = 0; i < 100; i++) {  // Could be infinite in production
    const message = await client.messages.create({
      model: 'claude-3-opus-20240229',
      messages: [
        { role: 'user', content: `Generate content ${i}` }
      ],
      max_tokens: 4096,  // ISSUE: No per-request cost cap
    });
    console.log(`Iteration ${i}: ${message.content[0].text.length} chars`);
  }
}

if (require.main === module) {
  console.log('Running Claude cost issue examples...');
  // Uncomment to test (will make API calls):
  // chatWithCostIssues().catch(console.error);
  // potentialRunawayLoop().catch(console.error);
  console.log('  Code has cost issues - check with AI Patch Doctor!');
}
