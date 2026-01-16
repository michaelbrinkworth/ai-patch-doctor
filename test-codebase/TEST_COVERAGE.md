# Test Coverage Summary

## Test Files Overview

This test-codebase contains **22 test files** with intentional AI API issues across **3 providers** in **2 languages**.

### Coverage by Provider

#### OpenAI (10 files)
- **Python**: streaming_issues.py, retry_issues.py, cost_issues.py, traceability_issues.py, all_issues.py
- **Node.js**: streaming_issues.js, retry_issues.js, cost_issues.js, traceability_issues.js, all_issues.js

#### Anthropic Claude (8 files)
- **Python**: streaming_issues_claude.py, retry_issues_claude.py, cost_issues_claude.py, traceability_issues_claude.py
- **Node.js**: streaming_issues_claude.js, retry_issues_claude.js, cost_issues_claude.js, traceability_issues_claude.js

#### Google Gemini (4 files)
- **Python**: streaming_issues_gemini.py, retry_issues_gemini.py, cost_issues_gemini.py, traceability_issues_gemini.py

### Issue Types Covered

1. **Streaming Issues**
   - Missing X-Accel-Buffering header
   - No timeout handling
   - Buffering enabled (SSE stalls)
   - No error handling for partial streams

2. **Retry Issues**
   - No exponential backoff
   - Infinite retries (no max limit)
   - Retrying on all errors (including 4xx)
   - No retry-after header handling

3. **Cost Issues**
   - No max_tokens limit
   - Unbounded prompt sizes
   - No cost estimation
   - Potential for runaway loops

4. **Traceability Issues**
   - No request IDs
   - No idempotency keys
   - No correlation tracking
   - Duplicate request detection disabled

## Test Script Coverage

The `test_doctor.sh` script validates the AI Patch Doctor tool with:

### Standard Tests (40+ tests)
- Python implementation tests (10 tests)
- Node.js implementation tests (10 tests)
- Cross-implementation consistency tests
- Report generation validation

### Edge Case Tests (20+ tests)
- Invalid target validation
- Conflicting flags detection (interactive + CI)
- Empty/invalid provider strings
- Invalid API key format handling
- Missing API keys detection
- Provider mismatch scenarios
- Multiple targets handling
- Help with other flags
- Very long model names
- Special characters in provider

### Multi-Provider Tests
- OpenAI-compatible provider tests
- Anthropic Claude provider tests (if ANTHROPIC_API_KEY set)
- Google Gemini provider tests (if GEMINI_API_KEY set)
- Custom base URL handling

## Total Test Coverage

- **Test Files**: 22
- **Languages**: 2 (Python, Node.js)
- **Providers**: 3 (OpenAI, Claude, Gemini)
- **Issue Categories**: 4 (Streaming, Retry, Cost, Traceability)
- **Test Script Checks**: 60+ automated tests
- **Edge Cases**: 20+ edge case scenarios

## Running Tests

```bash
# Run full test suite
cd test-codebase
./test_doctor.sh

# Test specific provider examples
python streaming_issues_claude.py  # Claude streaming issues
node cost_issues.js                # OpenAI cost issues
python retry_issues_gemini.py      # Gemini retry issues
```

## Dependencies

### Python
- openai >= 1.0.0
- anthropic >= 0.7.0
- google-generativeai >= 0.3.0
- httpx >= 0.24.0

### Node.js
- openai ^4.0.0
- @anthropic-ai/sdk ^0.9.0
