# AI Patch Doctor 🔍⚕️

**Automated code health checks and repairs for LLM API integrations**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](./ai-patch.test.js)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Node](https://img.shields.io/badge/node-14+-green.svg)](https://nodejs.org/)

> Give it your repository. Get back production-ready AI integration code.

## 🚀 Getting Started

### The Main Flow (Recommended)

```bash
# JavaScript/TypeScript projects
npx ai-patch doctor

# Python projects  
pipx run ai-patch doctor
```

**What happens:** 
1. Scans your codebase for AI API integration issues
2. Shows you what it found (missing timeouts, broken retries, etc.)
3. Asks what you want to do:
   - Fix safe code issues automatically
   - Fix everything (includes setting up gateway protection)
   - Just show me the report and exit

This is the complete flow that handles everything interactively.

### For CI/CD or Report-Only

When you need non-interactive mode (for automation):

```bash
npx ai-patch doctor --ci    # Scans and reports, no prompts
```

Or preview fixes without applying them:

```bash
npx ai-patch doctor --fix --dry-run
```

---

## ⚡ GitHub Action (60-second setup)

Add AI Patch Doctor to your CI pipeline. Runs on every PR and push with zero config.

```yaml
name: AI Patch Doctor
on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  ai-patch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: michaelbrinkworth/ai-patch-doctor@v1
```

**What it does:** Scans your code for AI API integration issues (missing timeouts, broken retries, cost risks) and reports them in the Actions tab. No API keys or secrets needed.

---

## 📋 Table of Contents

- [What is AI Patch Doctor?](#-what-is-ai-patch-doctor)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Example Outputs](./EXAMPLES.md) 📚
- [The 4 Wedge Checks](#-the-4-wedge-checks)
- [Supported Providers](#-supported-providers)
- [Architecture](#-architecture)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🤔 What Does This Tool Do?

**Think of it as an AI API code health checker with automatic repair.**

Most developers integrating OpenAI, Claude, or Gemini APIs make the same preventable mistakes:
- Forget to set timeouts (leading to hanging requests)
- Implement naive retry logic (making rate-limit problems worse)
- Skip token limits (hello surprise bills!)
- Don't track requests (debugging becomes impossible)

### The Default Flow (just run `ai-patch doctor`)

When you run the tool without flags, it:
1. **Scans** your codebase for API integration problems
2. **Shows** you what it found
3. **Asks** what you want to do - you choose whether to:
   - Fix safe issues automatically
   - Set up complete protection (code + gateway)
   - Just get a report

### Other Modes

- **`--fix` flag**: Skips the questions and auto-fixes everything it can
- **`--ci` flag**: Non-interactive mode for automation/CI pipelines
- **`--dry-run` with `--fix`**: Shows what would be fixed without changing files

**Use cases:**
- Production incidents (rate limits, timeouts, cost spikes)
- Pre-deployment hardening (find bugs before they hit prod)
- Code review automation (integrate into CI/CD)
- Onboarding (learn AI API best practices by seeing what gets flagged)

---

## ✨ What Makes This Useful

### 🔧 Autonomous Code Remediation

**The headline feature:** This isn't just a linter that complains. It actually rewrites your code.

What gets modified:
- **Timeout guards** - Prevents indefinite hangs by adding 60-second maximums
- **Intelligent retry loops** - Replaces broken retry logic with exponential backoff + randomization
- **Token budget controls** - Inserts `max_tokens` parameters to cap generation costs  
- **Request tracing** - Generates unique IDs so you can correlate requests with responses
- **Streaming optimizations** - Adds flush operations to prevent buffer-related delays
- **Conservative approach** - Changes only problematic lines, ignores working code

Try it risk-free with preview mode:
```bash
ai-patch doctor --fix --dry-run  # Shows planned changes without modifying files
```

### 🎯 Four Diagnostic Categories

The live testing mode organizes checks into four failure types:

1. **Streaming Problems** - SSE connection stalls, slow first-byte times, buffer interference
2. **Retry Failures** - Rate limit cascades, missing backoff, predictable timing
3. **Cost Control Gaps** - Unbounded token usage, missing budget parameters
4. **Observability Holes** - No request correlation, duplicate detection missing

### 🔧 Designed For Real Development

- **Works locally** - Scans files on disk, no cloud dependency
- **Provider agnostic** - Supports OpenAI, Anthropic, Gemini, custom endpoints
- **Reads your environment** - Pulls API keys from `.env` automatically  
- **Safe by default** - Preview mode lets you review before committing
- **Multiple output formats** - JSON for automation, Markdown for humans
- **Post-modification testing** - Runs syntax checks after each change
- **Bilingual** - Python and Node.js versions produce identical results

### 🌐 Universal Compatibility

- Works with **OpenAI**, **Anthropic Claude**, **Google Gemini**, and any OpenAI-compatible API
- Supports gateways like **LiteLLM**, **Portkey**, and **Helicone**
- Cross-platform: **Linux**, **macOS**, **Windows**

---

## 📦 Installation

### Python (pipx recommended)

```bash
# Using pipx (recommended)
pipx install ai-patch

# Or using pip
pip install ai-patch

# From source
git clone https://github.com/michaelbrinkworth/ai-patch-doctor.git
cd ai-patch-doctor/python
pip install -e .
```

### Node.js

```bash
# No installation needed - use npx
npx ai-patch doctor

# Or install globally
npm install -g ai-patch

# From source
git clone https://github.com/michaelbrinkworth/ai-patch-doctor.git
cd ai-patch-doctor/node
npm install
npm run build
```

---

## 💻 Usage

> 📚 **More examples:** Check out [EXAMPLES.md](./EXAMPLES.md)

### The Complete Flow (Just Run It)

```bash
npx ai-patch doctor
```

This is the main way to use the tool. Here's what happens:

1. **Scans your code** - Looks through JS/TS/Python files for API integration issues
2. **Shows what it found** - Lists problems like missing timeouts, broken retries, no token limits
3. **Asks you what to do:**
   - Option 1: Fix safe code issues automatically
   - Option 2: Fix everything (code + set up gateway protection)  
   - Option 3: Just show me the report and exit

You're in control. The tool finds the problems, you choose the solution.

### Automation Modes

**Auto-fix everything** (skips the questions):
```bash
ai-patch doctor --fix
```

**Report-only for CI/CD** (no interaction, no changes):
```bash
ai-patch doctor --ci
```

**Preview mode** (see what would be fixed):
```bash
ai-patch doctor --fix --dry-run
```

### Available Flags

```bash
--fix              # Auto-fix mode (no interaction)
--ci               # CI mode (report only, no prompts)
--dry-run          # Preview changes without applying
--target=TYPE      # Only check specific area (streaming, retries, cost, trace, all)
--no-telemetry     # Skip anonymous usage stats
```

### Anonymous Telemetry

AI Patch collects anonymous usage data via PostHog to help maintainers understand which AI issues users are facing. This helps prioritize development and improve the tool.

**What is collected:**
- Install ID (random UUID, locally generated)
- CLI version
- Operating system and architecture
- Target check type (streaming, retries, cost, trace, all)
- Provider type (openai-compatible, anthropic, gemini)
- Status (success, warning, error)
- Duration bucket (anonymized time ranges)

**What is NOT collected:**
- No prompts, payloads, or request bodies
- No API keys, base URLs, or file paths
- No repository names or model names
- No user or company identifiers
- No tracking or monitoring over time

**Telemetry Backend:**
Data is sent to PostHog Cloud (US region) for analytics. The PostHog API key is embedded in the CLI code for simplicity.

**Opt-out options:**
Telemetry is enabled by default (opt-out model). You can disable it:

1. Use the `--no-telemetry` flag: `ai-patch doctor --no-telemetry`
2. Set environment variable: `export AI_PATCH_TELEMETRY=0`
3. Set in config file: `~/.ai-patch/config.json` with `"telemetryEnabled": false`

On first run in an interactive terminal, you'll be prompted to enable or disable telemetry. Your choice is saved and respected for future runs.

---

## 🔧 What Gets Fixed

The `--fix` flag lets the tool rewrite your code. Here's what it changes:

| Problem | Solution | Notes |
|---------|----------|-------|
| No timeout | Adds timeout: 60000 | Won't hang forever anymore |
| No retries | Wraps call in retry loop | Uses exponential backoff |
| Bad retry timing | Fixes the math | Prevents thundering herd |
| No max_tokens | Adds max_tokens: 1000 | Caps your costs |
| max_tokens too high | Lowers to 2000 | Review if you need more |
| No request IDs | Generates UUIDs | Better logging |
| No flush() in streams | Adds flush calls | Improves streaming speed |

Some things can't be fixed in code:
- 429 rate limiting (need a gateway)
- Idempotency (need a database)
- Framework-specific headers

For those, you get instructions on what to do.

---

## 🔬 The 4 Wedge Checks

### 1. Streaming Check

**Diagnoses:** Server-Sent Events (SSE) stalls, buffering issues, chunk gaps, slow time-to-first-byte (TTFB)

**Common Issues Detected:**
- ✅ Detected: nginx proxy buffering enabled
- ✅ Detected: Missing X-Accel-Buffering header
- ✅ Detected: Client-side timeout configuration
- ✅ Detected: gzip/compression interfering with streaming

### 2. Retries Check

**Diagnoses:** Rate limit (429) storms, retry chaos, exponential backoff issues

**Common Issues Detected:**
- ✅ Detected: retry-after header present/absent
- ✅ Detected: Rate limiting (HTTP 429)
- ✅ Not detected: Linear retry patterns
- ✅ Not detected: Retry cap configuration

### 3. Cost Check

**Diagnoses:** Token usage spikes, runaway costs, missing guardrails

**Common Issues Detected:**
- ✅ Detected: max_tokens limit present/absent
- ✅ Detected: Token usage in request
- ✅ Not detected: Cost estimation before calls
- ✅ Not detected: Unbounded prompt sizes

### 4. Traceability Check

**Diagnoses:** Missing request IDs, duplicate requests, correlation gaps

**Common Issues Detected:**
- ✅ Detected: Request ID present in response headers
- ✅ Detected: Correlation ID tracking
- ✅ Not detected: Idempotency keys
- ✅ Not detected: Duplicate request detection

---

## 🌍 Supported Providers

### OpenAI-Compatible (Default)

Works with any OpenAI-compatible API:
- OpenAI API
- Azure OpenAI
- Together AI
- Anyscale Endpoints
- Fireworks AI
- OpenRouter
- Custom OpenAI-compatible proxies

**Auto-detected from:** `OPENAI_API_KEY`, `OPENAI_BASE_URL`

### Anthropic

Direct support for Claude API
- Claude 3 (Opus, Sonnet, Haiku)
- Claude 2.1, 2.0
- Claude Instant

**Auto-detected from:** `ANTHROPIC_API_KEY`

### Google Gemini

Direct support for Gemini API
- Gemini Pro
- Gemini Ultra

**Auto-detected from:** `GEMINI_API_KEY`

### Gateways

Compatible with popular AI gateways:
- LiteLLM
- Portkey
- Helicone
- Custom proxies

---

## 🏗️ Architecture

AI Patch Doctor uses a unique **shared code architecture** to ensure zero duplication between Python and Node implementations:

```
ai-patch-doctor/
├── python/                   # Python CLI + shared modules
│   ├── src/ai_patch/        # CLI wrapper (thin)
│   │   ├── cli.py           # Main CLI entry point
│   │   ├── __main__.py      # Python entry point
│   │   └── __init__.py      # Package init
│   ├── checks/              # 4 wedge checks (shared)
│   │   ├── streaming.py     # SSE diagnostics
│   │   ├── retries.py       # Retry logic diagnostics
│   │   ├── cost.py          # Cost optimization
│   │   └── trace.py         # Request tracing
│   ├── scanner.py           # Code scanner (static analysis)
│   ├── fixer.py             # Auto-fix engine
│   ├── verification.py      # Post-fix verification
│   ├── config.py            # Config management
│   ├── report.py            # Report generation
│   ├── tests/               # Python tests
│   └── pyproject.toml       # Python package config
│
├── node/                     # Node CLI + shared modules
│   ├── src/                 # CLI wrapper (thin)
│   │   └── cli.ts           # Main CLI entry point
│   ├── checks/              # 4 wedge checks (shared)
│   │   ├── streaming.ts     # SSE diagnostics
│   │   ├── retries.ts       # Retry logic diagnostics
│   │   ├── cost.ts          # Cost optimization
│   │   └── trace.ts         # Request tracing
│   ├── scanner.ts           # Code scanner (static analysis)
│   ├── fixer.ts             # Auto-fix engine
│   ├── verification.ts      # Post-fix verification
│   ├── config.ts            # Config management
│   ├── report.ts            # Report generation
│   ├── badgr-integration.ts # AI Badgr integration
│   ├── package.json         # Node package config
│   └── tsconfig.json        # TypeScript config
│
├── shared/                   # Shared schema
│   └── report-schema.json   # Report format specification
│
├── ai-patch.test.js         # Jest test suite (45 tests)
├── validate.py              # Package validation script
├── README.md                # This file
└── LICENSE                  # MIT License
```

**Key Principles:**
1. **Shared Logic** - All diagnostic and fix logic in `python/` and `node/` directories
2. **Thin CLIs** - CLI wrappers in `src/` just handle I/O and user interaction
3. **Identical UX** - Same commands, same output, same behavior across languages
4. **No Duplication** - Each check implemented once per language, imported by CLI
5. **Static + Live Analysis** - Scanner for code analysis, checks for live API diagnosis

---

## 🧪 Testing

### Run All Tests

```bash
# Jest tests (Node)
npm install
npm test

# Python tests
cd python
python tests/test_cli.py

# Validation script
python validate.py
```

### Test Coverage

**Jest Suite** (45 tests):
- ✅ Shared code structure validation
- ✅ No code duplication checks
- ✅ CLI imports verification
- ✅ Package structure validation
- ✅ Documentation completeness

**Python Suite** (4 tests):
- ✅ Config auto-detection
- ✅ Report generation
- ✅ Module imports
- ✅ Config validation

**Validation Script** (4 checks):
- ✅ Schema validation (report-schema.json)
- ✅ Python package structure
- ✅ Node package structure
- ✅ Command consistency

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Clone the repo
git clone https://github.com/michaelbrinkworth/ai-patch-doctor.git
cd ai-patch-doctor

# Install Python dependencies
cd python
pip install -e .[dev]

# Install Node dependencies
cd ../node
npm install

# Run tests
npm test
python tests/test_cli.py
python validate.py
```

### Contribution Guidelines

1. **Keep it minimal** - Make the smallest possible changes
2. **Test everything** - All tests must pass
3. **Match the style** - Follow existing code conventions
4. **Update docs** - Keep README and comments current
5. **One feature per PR** - Keep pull requests focused

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

Copyright (c) 2026 AI Patch Doctor Contributors

---

## 🙏 Acknowledgments

- Inspired by `brew doctor`, `kubectl doctor`, and similar diagnostic tools
- Built with ❤️ for the AI developer community
- Special thanks to all contributors

---

## 🔗 Links

- **GitHub Repository:** [github.com/michaelbrinkworth/ai-patch-doctor](https://github.com/michaelbrinkworth/ai-patch-doctor)
- **Issue Tracker:** [github.com/michaelbrinkworth/ai-patch-doctor/issues](https://github.com/michaelbrinkworth/ai-patch-doctor/issues)
- **PyPI Package:** `pip install ai-patch` (coming soon)
- **npm Package:** `npm install -g ai-patch` (coming soon)

---

**One command. Safer AI integrations. ⚕️**

```bash
npx ai-patch doctor --fix
```
