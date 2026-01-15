# Testing AI Patch Doctor

This test codebase contains intentional issues that AI Patch Doctor can detect.

## Quick Start

### 1. Set up environment

```bash
# Set your API key
export OPENAI_API_KEY="sk-your-actual-key-here"

# Or use a .env file (install python-dotenv first)
# pip install python-dotenv
```

### 2. Install dependencies (optional - for running the test code)

```bash
# Python
pip install -r requirements.txt

# Node
npm install
```

### 3. Run AI Patch Doctor

**Python:**
```bash
# Install first (one time)
pipx install ai-patch-doctor

# Then run
ai-patch doctor
```

Or run directly without installing:
```bash
python -m ai_patch doctor
```

**Node:**
```bash
npx ai-patch doctor
```

### 4. What to test

When prompted, select:
- **Option 1**: "streaming" - Will detect missing headers, buffering issues
- **Option 2**: "retries" - Will detect no backoff, too many retries
- **Option 3**: "cost" - Will detect no max_tokens, unbounded requests
- **Option 4**: "trace" - Will detect missing request IDs, no idempotency
- **Option 5**: "all" - Runs all checks

### 5. Expected findings

The doctor should detect:

**Streaming Issues:**
- Missing timeout configuration
- No streaming optimization headers
- Potential buffering problems

**Retry Issues:**
- Linear backoff instead of exponential
- Too many retry attempts
- Retrying on non-retryable errors

**Cost Issues:**
- No `max_tokens` limit
- Unbounded prompt sizes
- Potential for runaway costs

**Traceability Issues:**
- Missing request IDs
- No idempotency keys
- No correlation tracking

## Test Files

- `streaming_issues.py` - Streaming problems
- `retry_issues.py` - Retry problems  
- `cost_issues.py` - Cost problems
- `traceability_issues.py` - Traceability problems
- `all_issues.py` - All problems combined

## Notes

- The test files are examples - they don't need to be run
- AI Patch Doctor checks your **actual API configuration**, not the code files
- Make sure your API key is set in environment variables
- The doctor will make test API calls to diagnose issues
