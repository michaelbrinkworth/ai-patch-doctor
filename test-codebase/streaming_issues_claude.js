#!/usr/bin/env node
/**
 * Streaming Issues (Claude/Anthropic) - Problems AI Patch Doctor will detect:
 * 1. Missing streaming headers
 * 2. No timeout handling
 * 3. Buffering issues with Claude streaming
 */

const Anthropic = require('@anthropic-ai/sdk');

// Initialize client
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Error: ANTHROPIC_API_KEY environment variable not set');
  process.exit(1);
}

const client = new Anthropic({
  apiKey: apiKey
});

async function streamingChatWithIssues() {
  // ISSUE 1: No timeout set - can hang forever
  // ISSUE 2: Missing headers for streaming
  // ISSUE 3: No error handling for partial streams
  
  console.log('Starting Claude streaming chat (with issues)...');
  
  // ISSUE 4: No handling for stream interruptions
  const stream = await client.messages.stream({
    model: 'claude-3-sonnet-20240229',
    messages: [
      { role: 'user', content: 'Count from 1 to 10, one number per line' }
    ],
    max_tokens: 1024,
    // MISSING: timeout parameter
    // MISSING: headers for streaming optimization
  });
  
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      process.stdout.write(event.delta.text);
    }
  }
  
  console.log('\nDone (but may have stalled or buffered)');
}

if (require.main === module) {
  streamingChatWithIssues().catch(console.error);
}
