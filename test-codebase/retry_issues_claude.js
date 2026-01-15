#!/usr/bin/env node
/**
 * Retry Issues (Claude/Anthropic) - Problems AI Patch Doctor will detect:
 * 1. No exponential backoff
 * 2. Infinite retries (no max limit)
 * 3. Retrying on all errors (including 4xx)
 * 4. No retry-after header handling
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

async function chatWithBadRetries() {
  const maxAttempts = 100;  // ISSUE 1: Too many retries (should be 3-5)
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const message = await client.messages.create({
        model: 'claude-3-sonnet-20240229',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 1024,
        // ISSUE 2: No timeout
      });
      console.log(`Success: ${message.content[0].text}`);
      return message;
      
    } catch (error) {
      if (error.status === 429) {
        // ISSUE 3: Linear backoff instead of exponential
        const waitTime = 1;  // Should be 2^attempt
        console.log(`Rate limited, waiting ${waitTime}s (attempt ${attempt + 1})...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      } else {
        // ISSUE 4: Retrying on all errors (including 4xx client errors)
        if (attempt < maxAttempts - 1) {
          console.log(`Error: ${error.message}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw error;
        }
      }
    }
  }
  
  throw new Error('Max attempts reached');
}

if (require.main === module) {
  chatWithBadRetries().catch(console.error);
}
