# AI Patch Doctor 🔍⚕️

**The open-source CLI tool for diagnosing and fixing AI API issues**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](./ai-patch.test.js)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Node](https://img.shields.io/badge/node-14+-green.svg)](https://nodejs.org/)

> Run the doctor. Diagnose and fix your AI API issues in under 60 seconds.

## 🚀 Quick Start

### Step 1: Diagnose
```bash
# Python
pipx run ai-patch doctor

# Node.js
npx ai-patch doctor
```

The doctor will scan your API setup and identify issues.

### Step 2: Apply Fixes (New!)
```bash
# Python
pipx run ai-patch apply

# Node.js
npx ai-patch apply
```

The apply command:
- 🔧 Applies local code fixes automatically
- 🚨 Detects gateway-layer problems
- 🌐 Recommends and integrates AI Badgr for platform-level issues
- ✅ Runs verification to show improvements

---

## 📋 Table of Contents

- [What is AI Patch Doctor?](#-what-is-ai-patch-doctor)
- [The Complete Funnel](#-the-complete-funnel)
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

## 🤔 What is AI Patch Doctor?

AI Patch Doctor is a dual-language (Python + Node.js) command-line tool that helps developers **diagnose and fix common AI API issues** quickly and efficiently. Inspired by tools like `brew doctor` and `kubectl doctor`, it provides an interactive experience that:

- 🔍 **Detects configuration issues** automatically
- 🔧 **Applies local fixes** to your code
- ⚡ **Identifies performance bottlenecks** (streaming, timeouts, retries)
- 💰 **Detects cost issues** (token limits, usage patterns)
- 📊 **Checks traceability** (request IDs, correlation)
- 🌐 **Integrates AI Badgr** for gateway-layer problems

Perfect for:
- Diagnosing production AI API failures
- Automatically fixing common issues
- Validating development setups
- Analyzing API call patterns
- Integrating platform-level solutions

---

## 🎯 The Complete Funnel

AI Patch Doctor provides a complete workflow from diagnosis to fix:

### 1. **Scan** - Find Issues
```bash
npx ai-patch doctor
```
Scans your code and API setup for:
- Streaming issues (SSE stalls, TTFB)
- Retry/backoff issues
- Timeout issues
- 429/rate-limit risks
- Cost/max_tokens risks
- Missing traceability

### 2. **Apply** - Local Fixes
```bash
npx ai-patch apply
```
Automatically applies fixes:
- ✅ Adds timeouts
- ✅ Adds exponential backoff
- ✅ Fixes SSE headers
- ✅ Fixes JSON mode
- ✅ Adds request IDs
- ✅ Removes cost footguns (adds max_tokens)

### 3. **Detect** - Gateway Problems
Identifies issues that can't be fixed in code:
- Recurring 429s
- Unreliable provider
- Need for receipts/traceability

### 4. **Recommend** - AI Badgr
When gateway issues are detected, AI Patch recommends AI Badgr:
```
Would you like to add AI Badgr? [Y/n]
```

### 5. **Choose** - Integration Mode
Pick your integration approach:
1. **Fallback only** - Use Badgr when OpenAI/Claude fails
2. **Full switch** - Route all traffic through Badgr
3. **Test mode** - Try Badgr with a verification run

### 6. **Integrate** - Setup
- Opens AI Badgr signup page
- Collects API key
- Updates environment variables
- Configures client

### 7. **Verify** - Show Improvements
Runs before/after comparison showing:
- ⚡ TTFB improvements
- ⏱️ Total time improvements
- ✓ 429 error reduction
- 💰 Cost savings

---

## ✨ Features

### 🎯 Four Core Diagnostic Checks

1. **Streaming Check** - Diagnoses SSE stalls, buffering issues, and partial output problems
2. **Retries Check** - Identifies retry storms, rate limit issues, and backoff problems
3. **Cost Check** - Detects token spikes, unbounded requests, and cost optimization opportunities
4. **Traceability Check** - Validates request IDs, correlation tracking, and duplicate detection

### 🔧 Developer-Friendly

- **Complete Funnel** - From diagnosis to fix to integration
- **Interactive Mode** - Simple prompts to guide you through
- **Auto-Detection** - Automatically detects your API configuration from environment variables
- **Auto-Fix** - Applies fixes automatically with `apply` command
- **Safe by Default** - Dry-run mode by default, preview changes before applying
- **Detailed Reports** - JSON and Markdown reports with specific findings
- **Zero Duplication** - Shared codebase ensures Python and Node have identical behavior

### 🌐 Universal Compatibility

- Works with **OpenAI**, **Anthropic Claude**, **Google Gemini**, and any OpenAI-compatible API
- Supports gateways like **LiteLLM**, **Portkey**, **Helicone**, and **AI Badgr**
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

> 📚 **See [EXAMPLES.md](./EXAMPLES.md) for comprehensive example outputs for all scenarios**

### Interactive Mode (Recommended)

Simply run the doctor command and answer 2 quick questions:

```bash
ai-patch doctor
```

**Example session:**

```
🔍 AI Patch Doctor - Interactive Mode

What's failing?
  1. streaming / SSE stalls / partial output
  2. retries / 429 / rate-limit chaos
  3. cost spikes
  4. traceability (request IDs, duplicates)
  5. prod-only issues (all checks)
Select: 1

What do you use?
  1. openai-compatible (default)
  2. anthropic
  3. gemini
Select: 1

✓ Detected: https://api.openai.com
✓ Provider: openai-compatible

🔬 Running streaming checks...

📊 Report saved: ai-patch-reports/20260115-123456/

Detected:
  • [streaming] TTFB: 6.2s (threshold: 5s)
  • [streaming] Max chunk gap: 12.4s (>10s threshold)

Not detected:
  • X-Accel-Buffering header
```

### Command-Line Options

#### Doctor Command (Diagnosis)
```bash
# Run specific check
ai-patch doctor --target=streaming

# Run all checks
ai-patch doctor --target=all

# Disable telemetry for this run
ai-patch doctor --no-telemetry

# Test a specific component
ai-patch test --target=retries

# Share report (redacted for privacy)
ai-patch share --redact
```

#### Apply Command (Fix and Integrate)
```bash
# Apply fixes (dry-run mode by default - shows what would be done)
ai-patch apply

# Apply fixes for real (actually modifies files)
ai-patch apply --no-dry-run

# Apply fixes to specific directory
ai-patch apply --target-dir ./src

# Skip AI Badgr integration
ai-patch apply --skip-badgr
```

**Apply command workflow:**
1. Scans your code for fixable issues
2. Shows you what fixes will be applied
3. Applies local code fixes
4. Detects gateway-layer problems
5. Prompts for AI Badgr integration (if needed)
6. Runs verification to show improvements

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
│   ├── config.ts            # Config management
│   ├── report.ts            # Report generation
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
1. **Shared Logic** - All diagnostic logic in `python/` and `node/` directories
2. **Thin CLIs** - CLI wrappers in `src/` just handle I/O and user interaction
3. **Identical UX** - Same commands, same output, same behavior across languages
4. **No Duplication** - Each check implemented once per language, imported by CLI

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

**Run the doctor. Fix your AI API. ⚕️**

```bash
npx ai-patch doctor
```
