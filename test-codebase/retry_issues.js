#!/usr/bin/env node
/**
 * Retry Issues (OpenAI) - Problems AI Patch Doctor will detect:
 * 1. No exponential backoff
 * 2. Infinite retries (no max limit)
 * 3. Retrying on all errors (including 4xx)
 * 4. No retry-after header handling
 */

const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function chatWithBadRetries() {
  const maxAttempts = 100;  // ISSUE 1: Too many retries (should be 3-5)
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        // ISSUE 2: No timeout
      });
      console.log(`Success: ${response.choices[0].message.content}`);
      return response;
      
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
