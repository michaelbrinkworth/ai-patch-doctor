# AI Patch Doctor 🔍⚕️

**Your AI integration code reviewer and fixer**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-16+-green.svg)](https://nodejs.org/)

Examines your JavaScript/TypeScript files for common AI API mistakes. When it finds issues (hanging calls, naive retries, runaway costs), you decide what happens next.

## How to use it

```bash
# Run this - it'll scan and ask what you want to do
npx ai-patch doctor
```

The flow:
- Walks through your source files
- Lists every problem it discovers
- Gives you 3 choices: auto-fix safe stuff, setup complete protection, or just get the report

## Install permanently

```bash
npm install -g ai-patch
```

## Commands

```bash
npx ai-patch doctor           # Main interactive flow
npx ai-patch doctor --fix     # Skip questions, just fix
npx ai-patch doctor --ci      # Generate report only
```

## Common fixes

- Adds timeout guards to prevent hangs
- Implements exponential backoff for retries
- Sets max_tokens to control costs
- Generates request IDs for debugging

Full documentation: [github.com/michaelaccount2/ai-patch-doctor](https://github.com/michaelaccount2/ai-patch-doctor)

MIT License

---

**Healthier AI code through guided repairs.**
