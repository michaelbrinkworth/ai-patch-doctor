#!/usr/bin/env node
/**
 * All Issues Combined - A file with all types of problems
 * This is what you'd run AI Patch Doctor on to see all checks
 */

const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function problematicApiCall() {
  // STREAMING ISSUES:
  // - No timeout
  // - Missing streaming headers
  
  // RETRY ISSUES:
  // - No exponential backoff
  // - Too many retries
  
  // COST ISSUES:
  // - No max_tokens
  // - Large prompt
  
  // TRACEABILITY ISSUES:
  // - No request ID
  // - No idempotency key
  
  const maxRetries = 10;  // Too many
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Large prompt (cost issue)
      const largePrompt = 'Write a detailed analysis of ' + 'AI '.repeat(500);
      
      // Streaming with issues
      const stream = await client.chat.completions.create({
        model: 'gpt-4',  // Expensive
        messages: [{ role: 'user', content: largePrompt }],
        stream: true,
        // MISSING: max_tokens
        // MISSING: timeout
        // MISSING: headers for streaming
        // MISSING: idempotency-key
      });
      
      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          process.stdout.write(chunk.choices[0].delta.content);
        }
      }
      
      console.log('\n✅ Success!');
      return;
      
    } catch (error) {
      if (error.status === 429) {
        // Bad retry logic
        const wait = 1;  // Should be exponential
        console.log(`Rate limited, waiting ${wait}s...`);
        await new Promise(resolve => setTimeout(resolve, wait * 1000));
      } else {
        console.log(`Error: ${error.message}`);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw error;
        }
      }
    }
  }
}

if (require.main === module) {
  console.log('⚠️  This code has multiple issues!');
  console.log('Run: pipx run ai-patch-doctor doctor');
  console.log('Or: npx ai-patch doctor');
  console.log('\nSelect \'all\' or specific checks to see issues detected.');
}
