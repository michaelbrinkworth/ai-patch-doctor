#!/usr/bin/env node
/**
 * Cost Issues (OpenAI) - Problems AI Patch Doctor will detect:
 * 1. No max_tokens limit
 * 2. Unbounded prompt sizes
 * 3. No cost estimation
 * 4. Potential for runaway loops
 */

const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function chatWithCostIssues() {
  // ISSUE 1: No max_tokens limit - can generate unlimited tokens
  // ISSUE 2: Large prompt with no size check
  const largePrompt = 'Write a very long story about ' + 'a cat '.repeat(1000);
  
  const response = await client.chat.completions.create({
    model: 'gpt-4',  // Expensive model
    messages: [
      { role: 'user', content: largePrompt }
    ],
    // MISSING: max_tokens parameter
    // MISSING: cost estimation before call
    temperature: 0.7,
  });
  
  console.log(`Response length: ${response.choices[0].message.content.length} chars`);
  console.log('  No token limit - could be very expensive!');
}

async function potentialRunawayLoop() {
  // ISSUE 3: Loop with no safety limits
  for (let i = 0; i < 100; i++) {  // Could be infinite in production
    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: `Generate content ${i}` }
      ],
      // MISSING: max_tokens
      // MISSING: per-request cost cap
    });
    console.log(`Iteration ${i}: ${response.choices[0].message.content.length} chars`);
  }
}

if (require.main === module) {
  console.log('Running cost issue examples...');
  // Uncomment to test (will make API calls):
  // chatWithCostIssues().catch(console.error);
  // potentialRunawayLoop().catch(console.error);
  console.log('  Code has cost issues - check with AI Patch Doctor!');
}
