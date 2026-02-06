# AI Patch Doctor 🔍⚕️

**GitHub Action for detecting AI API integration issues in your CI pipeline**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Action](https://img.shields.io/badge/GitHub-Action-blue.svg)](https://github.com/marketplace/actions/ai-patch-doctor)

> Drop-in CI check that catches AI API issues before they hit production: 429s, retry storms, streaming stalls, timeouts, and cost explosions.

## 🚀 Quick Start - Use This Action

Add to your `.github/workflows/ci.yml`:

```yaml
name: AI Doctor

on: [pull_request, push]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: michaelbrinkworth/ai-doctor-action@v1
```

**That's it!** Zero config. No API keys. Runs on every PR.

---

## 🎯 What This Action Does

Scans your code for common AI API integration issues:

- ❌ **429 Rate Limits** - Missing retry logic
- ❌ **Retry Storms** - Linear retries instead of exponential backoff
- ❌ **Streaming Stalls** - Missing SSE headers, buffering issues
- ❌ **Timeouts** - No timeout configuration or huge timeouts
- ❌ **Cost Explosions** - Unbounded max_tokens
- ❌ **Missing Traceability** - No request IDs or correlation

Automatically fixes issues where safe, reports others with file:line suggestions.

## 📊 Example Output

```
✓ Found 61 fixable issues:
  • Streaming safety issues (6)
  • Missing retry logic (23)
  • 429 (2)
  • traceability (16)
  • No timeout configured (8)
  • cost (6)

✓ Applied 28 automatic fixes
⚠️ Manual review required for 24 issues
```

Results display directly in your GitHub Actions logs.

---

## ⚙️ Configuration

### Optional: Enable Telemetry

```yaml
- uses: michaelbrinkworth/ai-doctor-action@v1
  with:
    telemetry: true  # Default is false
```

That's the only option. Everything else is automatic.

---

## 🔧 Advanced: Full Example

```yaml
name: AI Doctor

on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  scan:
    runs-on: ubuntu-latest
    name: Scan for AI API issues
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Run AI Patch Doctor
        uses: michaelbrinkworth/ai-doctor-action@v1
```

---

## 💡 Why Use This Action?

### For Teams Using AI APIs

If your codebase calls OpenAI, Anthropic, Gemini, or similar APIs, this action:

- **Catches issues early** - In PRs, before production
- **Prevents incidents** - 429 storms, streaming hangs, cost spikes
- **Enforces best practices** - Exponential backoff, timeouts, request IDs
- **Zero maintenance** - Always uses latest detection rules
- **Works immediately** - No configuration or API keys needed

### Distribution Model

This action spreads organically:
1. Dev sees CI check fail on their PR
2. Clicks to see what broke
3. Learns about AI Patch Doctor
4. Adds to other projects

CI failures spread faster than documentation.

---

## 📚 Supported AI Providers

Works with any OpenAI-compatible API:
- **OpenAI** (ChatGPT, GPT-4)
- **Anthropic** (Claude)
- **Google** (Gemini)
- **Gateways** (LiteLLM, Portkey, Helicone)
- **Custom endpoints**

Scans static code patterns - no live API calls required.

---

## 🛠️ Also Available as CLI

You can also run the tool locally:

```bash
# Node.js
npx ai-patch doctor

# Python
pipx run ai-patch doctor
```

Interactive mode for local development and debugging.

### CLI Installation

```bash
# Python (pipx recommended)
pipx install ai-patch

# Node.js (no install needed)
npx ai-patch doctor

# From source
git clone https://github.com/michaelbrinkworth/ai-patch-doctor.git
cd ai-patch-doctor/python
pip install -e .
```

### CLI Features

- **Interactive Mode** - Diagnoses your API setup with prompts
- **Auto-Detection** - Reads API config from environment variables
- **Detailed Reports** - JSON and Markdown output
- **Safe by Default** - Read-only diagnostic checks
- **Cross-Platform** - Linux, macOS, Windows

See [full CLI documentation](./AI-DOCTOR-ACTION.md) for details.

---

## 📖 Documentation

- **[ACTION-USAGE.md](./ACTION-USAGE.md)** - Detailed action usage guide
- **[AI-DOCTOR-ACTION.md](./AI-DOCTOR-ACTION.md)** - Deep technical documentation
- **[MARKETPLACE-PUBLISHING.md](./MARKETPLACE-PUBLISHING.md)** - Publishing guide (for maintainers)

---

## 🚀 Publishing to Marketplace

### For Maintainers

To publish a new version:

1. Create a release with tag `v1.x.x`
2. Check "Publish to GitHub Marketplace"
3. Select category: "Code quality"
4. Release becomes available as `@v1` (or `@v1.x.x`)

See [MARKETPLACE-PUBLISHING.md](./MARKETPLACE-PUBLISHING.md) for details.

---

## 🤝 Contributing

Contributions welcome! This is a dual-language project (Python + Node.js) with shared test coverage.

```bash
# Run tests
npm test              # Node.js tests
python validate.py    # Python validation

# Test the action locally
./workflow-test.sh    # Simulates GitHub Actions
./verify-action.sh    # Runs on test-codebase
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **GitHub Marketplace**: [AI Patch Doctor](https://github.com/marketplace/actions/ai-patch-doctor)
- **Issues**: [Report bugs](https://github.com/michaelbrinkworth/ai-patch-doctor/issues)
- **Discussion**: [Ask questions](https://github.com/michaelbrinkworth/ai-patch-doctor/discussions)

---

**Built by [@michaelbrinkworth](https://github.com/michaelbrinkworth)**

*Inspired by `brew doctor` and `kubectl doctor` - making AI API integration reliable and observable.*
