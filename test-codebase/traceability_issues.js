#!/usr/bin/env node
/**
 * Traceability Issues (OpenAI) - Problems AI Patch Doctor will detect:
 * 1. No request IDs
 * 2. No idempotency keys
 * 3. No correlation tracking
 * 4. Duplicate request detection disabled
 */

const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function chatWithoutTraceability() {
  // ISSUE 1: No request ID tracking
  // ISSUE 2: No idempotency key
  // ISSUE 3: No correlation ID
  
  const response = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: 'Hello' }
    ],
    // MISSING: headers with request-id
    // MISSING: idempotency-key
    // MISSING: correlation-id
  });
  
  console.log(`Response: ${response.choices[0].message.content}`);
  console.log('  No traceability - can\'t track or deduplicate requests!');
}

async function duplicateRequests() {
  // ISSUE 4: No duplicate detection
  const message = 'Generate a unique ID';
  
  // Could accidentally call twice (network retry, user double-click, etc.)
  const response1 = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: message }],
    // MISSING: headers with idempotency-key to prevent duplicates
  });
  
  const response2 = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: message }],
    // MISSING: headers with idempotency-key to prevent duplicates
  });
  
  console.log(`Response 1: ${response1.choices[0].message.content}`);
  console.log(`Response 2: ${response2.choices[0].message.content}`);
  console.log('  Duplicate requests - charged twice for same work!');
}

if (require.main === module) {
  console.log('Running traceability issue examples...');
  // Uncomment to test (will make API calls):
  // chatWithoutTraceability().catch(console.error);
  // duplicateRequests().catch(console.error);
  console.log('  Code has traceability issues - check with AI Patch Doctor!');
}
