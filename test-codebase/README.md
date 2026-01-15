# Test Codebase for AI Patch Doctor

This is a test codebase with intentional AI API issues that AI Patch Doctor can detect.

## Issues Included

1. **Streaming Issues** - Missing headers, buffering problems
2. **Retry Issues** - No exponential backoff, infinite retries
3. **Cost Issues** - No max_tokens limit, unbounded requests
4. **Traceability Issues** - Missing request IDs, no idempotency keys

## Supported Providers

This test codebase includes examples for multiple AI providers:
- **OpenAI** - GPT-3.5, GPT-4, and OpenAI-compatible APIs
- **Anthropic Claude** - Claude 3 (Opus, Sonnet, Haiku)
- **Google Gemini** - Gemini Pro models

Both Python and Node.js implementations are provided for all providers.

## Setup

1. Set your API key(s):
```bash
# OpenAI
export OPENAI_API_KEY="your-key-here"

# Anthropic Claude
export ANTHROPIC_API_KEY="your-key-here"

# Google Gemini
export GEMINI_API_KEY="your-key-here"
```

2. Install dependencies:
```bash
# Python
pip install openai anthropic google-generativeai

# Node.js
npm install openai @anthropic-ai/sdk
```

3. Run AI Patch Doctor:
```bash
# Python
ai-patch doctor
# Or without installing: python -m ai_patch doctor

# Node.js
npx ai-patch doctor
```

4. Run the comprehensive test suite:
```bash
./test_doctor.sh
```

## Files

### Python Examples

#### OpenAI
- `streaming_issues.py` - Streaming problems (SSE stalls, buffering)
- `retry_issues.py` - Retry problems (no backoff, infinite loops)
- `cost_issues.py` - Cost problems (no limits, runaway tokens)
- `traceability_issues.py` - Traceability problems (no IDs, duplicates)
- `all_issues.py` - All problems combined

#### Anthropic Claude
- `streaming_issues_claude.py` - Claude streaming problems
- `retry_issues_claude.py` - Claude retry problems
- `cost_issues_claude.py` - Claude cost problems
- `traceability_issues_claude.py` - Claude traceability problems

#### Google Gemini
- `streaming_issues_gemini.py` - Gemini streaming problems
- `retry_issues_gemini.py` - Gemini retry problems
- `cost_issues_gemini.py` - Gemini cost problems
- `traceability_issues_gemini.py` - Gemini traceability problems

### Node.js Examples

#### OpenAI
- `streaming_issues.js` - Streaming problems
- `retry_issues.js` - Retry problems
- `cost_issues.js` - Cost problems
- `traceability_issues.js` - Traceability problems
- `all_issues.js` - All problems combined

#### Anthropic Claude
- `streaming_issues_claude.js` - Claude streaming problems
- `retry_issues_claude.js` - Claude retry problems
- `cost_issues_claude.js` - Claude cost problems
- `traceability_issues_claude.js` - Claude traceability problems

### Test Script

- `test_doctor.sh` - Comprehensive test suite that validates AI Patch Doctor with edge cases and multi-provider scenarios
