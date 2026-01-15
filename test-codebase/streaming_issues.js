#!/usr/bin/env node
/**
 * Streaming Issues (OpenAI) - Problems AI Patch Doctor will detect:
 * 1. Missing X-Accel-Buffering header
 * 2. No timeout handling
 * 3. Buffering enabled (causes SSE stalls)
 */

const OpenAI = require('openai');

// Initialize client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function streamingChatWithIssues() {
  // ISSUE 1: No timeout set - can hang forever
  // ISSUE 2: Missing headers for streaming
  // ISSUE 3: No error handling for partial streams
  
  console.log('Starting streaming chat (with issues)...');
  
  const stream = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: 'Count from 1 to 10, one number per line' }
    ],
    stream: true,
    // MISSING: timeout parameter
    // MISSING: headers for streaming optimization
  });
  
  // ISSUE 4: No handling for stream interruptions
  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) {
      process.stdout.write(chunk.choices[0].delta.content);
    }
  }
  
  console.log('\nDone (but may have stalled or buffered)');
}

if (require.main === module) {
  streamingChatWithIssues().catch(console.error);
}
