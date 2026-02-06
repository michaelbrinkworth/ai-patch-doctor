#!/usr/bin/env node
/**
 * Comprehensive validation test for false positive fixes
 */

const { scanCodebase } = require('./node/scanner.ts');
const fs = require('fs');
const path = require('path');

// Compile TypeScript first
const { execSync } = require('child_process');
console.log('🔨 Compiling TypeScript...');
try {
  execSync('cd node && npx tsc scanner.ts --outDir ../dist/scanner --downlevelIteration', { 
    stdio: 'pipe',
    cwd: __dirname 
  });
  console.log('✅ Compilation successful\n');
} catch (error) {
  console.error('❌ Compilation failed:', error.message);
  process.exit(1);
}

const { scanCodebase: scanCodebaseFn } = require('./dist/scanner/scanner.js');

async function runValidationTests() {
  console.log('🧪 Running False Positive Validation Tests\n');
  
  const testDir = '/tmp/false-positive-validation';
  
  // Clean and create test directory
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
  fs.mkdirSync(testDir, { recursive: true });
  
  // Test 1: String literals should not be flagged
  console.log('Test 1: String literals with keywords');
  fs.writeFileSync(path.join(testDir, 'test1.js'), `
import OpenAI from 'openai';
const openai = new OpenAI();

const title = "Linear retry detected";
const description = "This page explains retry policies";

async function call() {
  for (let retry = 0; retry < 3; retry++) {
    return await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{role: "user", content: "test"}],
      timeout: 60000,
      max_tokens: 100
    });
  }
}
`);
  
  // Test 2: Template strings with URLs should not be flagged
  console.log('Test 2: Template strings with URLs');
  fs.writeFileSync(path.join(testDir, 'test2.js'), `
import OpenAI from 'openai';
const openai = new OpenAI();

const example = \`
Before: https://api.openai.com/v1/chat/completions
After: https://gateway.com/v1/chat/completions
timeout: 30000
max_tokens: 4000
\`;

async function call() {
  return await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{role: "user", content: "test"}],
    timeout: 60000
  });
}
`);
  
  // Test 3: Python timeout in seconds
  console.log('Test 3: Python timeout interpretation');
  fs.writeFileSync(path.join(testDir, 'test3.py'), `
from openai import OpenAI
client = OpenAI()

# Good timeout - 60 seconds
response1 = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "test"}],
    timeout=60,
    max_tokens=100
)

# Bad timeout - 5 seconds is too low
response2 = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "test"}],
    timeout=5,
    max_tokens=100
)
`);
  
  // Test 4: JSX display code
  console.log('Test 4: JSX display code');
  fs.writeFileSync(path.join(testDir, 'test4.tsx'), `
import OpenAI from 'openai';
const openai = new OpenAI();

function RetryDisplay({ retry }: { retry: number }) {
  return <div>Retry count: {retry}</div>;
}

async function call() {
  for (let retry = 0; retry < 3; retry++) {
    return await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{role: "user", content: "test"}],
      timeout: 60000,
      max_tokens: 100
    });
  }
}
`);
  
  // Test 5: Build artifacts
  console.log('Test 5: Build artifacts exclusion');
  const nextDir = path.join(testDir, '.next', 'chunks');
  fs.mkdirSync(nextDir, { recursive: true });
  fs.writeFileSync(path.join(nextDir, 'artifact.js'), `
const retry = "this is in a build artifact";
const timeout = 100;
`);
  
  console.log('\n📊 Scanning test directory...\n');
  const results = await scanCodebaseFn(testDir);
  
  console.log('✅ Files scanned:', results.filesScanned);
  console.log('✅ Issues found:', results.issues.length);
  console.log('✅ Gateway issues:', results.gatewayLayerIssues.length);
  
  // Validation
  let allPassed = true;
  
  // Check 1: .next should not be scanned
  const nextIssues = results.issues.filter(i => i.file.includes('.next'));
  if (nextIssues.length === 0) {
    console.log('\n✅ PASS: .next directory excluded from scanning');
  } else {
    console.log('\n❌ FAIL: .next directory was scanned');
    allPassed = false;
  }
  
  // Check 2: String literals should not be flagged as retry code
  const test1RetryIssues = results.issues.filter(i => 
    i.file.includes('test1.js') && 
    i.type === 'retry' &&
    i.message.includes('Linear retry') &&
    (i.line === 5 || i.line === 6) // The string literal lines
  );
  if (test1RetryIssues.length === 0) {
    console.log('✅ PASS: String literals not flagged as retry code');
  } else {
    console.log('❌ FAIL: String literals incorrectly flagged');
    allPassed = false;
  }
  
  // Check 3: Template string URLs should not be flagged
  const test2UrlIssues = results.issues.filter(i => 
    i.file.includes('test2.js') && 
    i.type === 'timeout' && // Specifically check for timeout/max_tokens flags on template lines
    (i.line >= 5 && i.line <= 11) // Template string lines
  );
  if (test2UrlIssues.length === 0) {
    console.log('✅ PASS: Template string URLs/keywords not flagged');
  } else {
    console.log('❌ FAIL: Template strings incorrectly flagged');
    console.log('   Issues:', test2UrlIssues.map(i => `Line ${i.line}: ${i.message}`));
    allPassed = false;
  }
  
  // Check 4: Python timeout=60 should NOT be flagged
  const test3Timeout60Issues = results.issues.filter(i => 
    i.file.includes('test3.py') && 
    i.type === 'timeout' &&
    i.message.includes('60')
  );
  if (test3Timeout60Issues.length === 0) {
    console.log('✅ PASS: Python timeout=60s not flagged (correct interpretation)');
  } else {
    console.log('❌ FAIL: Python timeout=60s incorrectly flagged as milliseconds');
    allPassed = false;
  }
  
  // Check 5: Python timeout=5 SHOULD be flagged
  const test3Timeout5Issues = results.issues.filter(i => 
    i.file.includes('test3.py') && 
    i.type === 'timeout' &&
    i.message.includes('5s')
  );
  if (test3Timeout5Issues.length > 0) {
    console.log('✅ PASS: Python timeout=5s correctly flagged as too low');
  } else {
    console.log('❌ FAIL: Python timeout=5s not flagged');
    allPassed = false;
  }
  
  // Check 6: JSX text should not be flagged
  const test4JsxIssues = results.issues.filter(i => 
    i.file.includes('test4.tsx') && 
    i.line === 6 // JSX line with actual display code
  );
  if (test4JsxIssues.length === 0) {
    console.log('✅ PASS: JSX display code not flagged');
  } else {
    console.log('❌ FAIL: JSX display code incorrectly flagged');
    console.log('   Issues:', test4JsxIssues.map(i => `Line ${i.line}: ${i.message}`));
    allPassed = false;
  }
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL VALIDATION TESTS PASSED');
    console.log('='.repeat(60));
    process.exit(0);
  } else {
    console.log('❌ SOME VALIDATION TESTS FAILED');
    console.log('='.repeat(60));
    process.exit(1);
  }
}

runValidationTests().catch(error => {
  console.error('❌ Error running tests:', error);
  process.exit(1);
});
