# Test Codebase for AI Patch Doctor

This is a test codebase with intentional AI API issues that AI Patch Doctor can detect.

## Issues Included

1. **Streaming Issues** - Missing headers, buffering problems
2. **Retry Issues** - No exponential backoff, infinite retries
3. **Cost Issues** - No max_tokens limit, unbounded requests
4. **Traceability Issues** - Missing request IDs, no idempotency keys

## Setup

1. Set your API key:
```bash
export OPENAI_API_KEY="your-key-here"
# Or for Anthropic:
export ANTHROPIC_API_KEY="your-key-here"
```

2. Install dependencies:
```bash
# Python
pip install openai anthropic httpx

# Node
npm install openai @anthropic-ai/sdk
```

3. Run AI Patch Doctor:
```bash
# Python
ai-patch doctor
# Or without installing: python -m ai_patch doctor

# Node
npx ai-patch doctor
```

## Files

- `streaming_issues.py` - Streaming problems (SSE stalls, buffering)
- `retry_issues.py` - Retry problems (no backoff, infinite loops)
- `cost_issues.py` - Cost problems (no limits, runaway tokens)
- `traceability_issues.py` - Traceability problems (no IDs, duplicates)
- `all_issues.py` - All problems combined
