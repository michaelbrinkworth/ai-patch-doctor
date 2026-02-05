# AI Patch Doctor 🔍⚕️

**Code health tool for Python AI integrations**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)

Analyzes Python files calling OpenAI/Claude/Gemini APIs. Detects common integration mistakes, then presents options for resolution.

## Run it

```bash
pipx run ai-patch doctor
```

Sequence: scans repository → displays findings → prompts for action (repair code / setup infrastructure / export report)

## Install

```bash
pip install ai-patch
```

## Commands

```bash
pipx run ai-patch doctor        # Standard interactive workflow
pipx run ai-patch doctor --fix  # Automated repair mode
pipx run ai-patch doctor --ci   # Report generation only
```

See: [github.com/michaelaccount2/ai-patch-doctor](https://github.com/michaelaccount2/ai-patch-doctor)

MIT License

---

**Guided remediation for AI service calls.**
