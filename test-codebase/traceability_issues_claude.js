#!/usr/bin/env node
/**
 * Traceability Issues (Claude/Anthropic) - Problems AI Patch Doctor will detect:
 * 1. No request IDs
 * 2. No idempotency keys
 * 3. No correlation tracking
 * 4. Duplicate request detection disabled
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

async function chatWithoutTraceability() {
  // ISSUE 1: No request ID tracking
  // ISSUE 2: No idempotency key
  // ISSUE 3: No correlation ID
  
  const message = await client.messages.create({
    model: 'claude-3-sonnet-20240229',
    messages: [
      { role: 'user', content: 'Hello' }
    ],
    max_tokens: 1024,
    // MISSING: headers with request-id
    // MISSING: headers with idempotency-key
    // MISSING: headers with correlation-id
  });
  
  console.log(`Response: ${message.content[0].text}`);
  console.log('⚠️  No traceability - can\'t track or deduplicate requests!');
}

async function duplicateRequests() {
  // ISSUE 4: No duplicate detection
  const messageText = 'Generate a unique ID';
  
  // Could accidentally call twice (network retry, user double-click, etc.)
  const message1 = await client.messages.create({
    model: 'claude-3-sonnet-20240229',
    messages: [{ role: 'user', content: messageText }],
    max_tokens: 1024,
    // MISSING: headers with idempotency-key to prevent duplicates
  });
  
  const message2 = await client.messages.create({
    model: 'claude-3-sonnet-20240229',
    messages: [{ role: 'user', content: messageText }],
    max_tokens: 1024,
    // MISSING: headers with idempotency-key to prevent duplicates
  });
  
  console.log(`Response 1: ${message1.content[0].text}`);
  console.log(`Response 2: ${message2.content[0].text}`);
  console.log('⚠️  Duplicate requests - charged twice for same work!');
}

if (require.main === module) {
  console.log('Running Claude traceability issue examples...');
  // Uncomment to test (will make API calls):
  // chatWithoutTraceability().catch(console.error);
  // duplicateRequests().catch(console.error);
  console.log('⚠️  Code has traceability issues - check with AI Patch Doctor!');
}
