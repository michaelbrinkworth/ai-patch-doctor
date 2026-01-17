# AI Patch Doctor - Manual Testing Guide

This guide provides step-by-step instructions for manually testing all features of AI Patch Doctor.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Testing Python Version](#testing-python-version)
- [Testing Node.js Version](#testing-nodejs-version)
- [Test Scenarios](#test-scenarios)
- [Verification Checklist](#verification-checklist)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start (TL;DR)

**Want to test right away? Here's the fastest path:**

```bash
# 1. Set your API key
export OPENAI_API_KEY="sk-your-actual-api-key-here"

# 2. Install Python version (recommended)
cd python
pip install -e .
cd ..

# 3. Run a test
ai-patch doctor

# 4. Check the report
cat ~/.ai-patch-reports/latest/report.md
```

**That's it!** For detailed testing, continue reading below.

---

## Prerequisites

### Required Software

1. **Python 3.8+**
   ```bash
   python3 --version  # Should show 3.8 or higher
   ```

2. **Node.js 14+**
   ```bash
   node --version  # Should show 14.0.0 or higher
   ```

3. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

4. **pipx** (optional, for Python)
   ```bash
   # Install pipx if not available
   python3 -m pip install --user pipx
   python3 -m pipx ensurepath
   ```

### Required Environment Setup

You'll need API keys for testing. At minimum, you should have one of these:

- **OpenAI API Key**: https://platform.openai.com/api-keys
- **Anthropic API Key**: https://console.anthropic.com/
- **Google Gemini API Key**: https://makersuite.google.com/app/apikey

**Security Note**: Never commit API keys to git. They will be used only in your terminal session.

**Tip**: Create a `.env.local` file (add to `.gitignore`) for easy testing:

```bash
# .env.local (DO NOT COMMIT)
export OPENAI_API_KEY="sk-your-key-here"
export OPENAI_BASE_URL="https://api.openai.com/v1"

# Then source it before testing:
# source .env.local
```

---

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/michaelbrinkworth/ai-patch-doctor.git
cd ai-patch-doctor
```

### 2. Install Dependencies

#### Python Setup
```bash
cd python
pip install -e .
# This installs the 'ai-patch' command globally
cd ..
```

Verify Python installation:
```bash
ai-patch --help
# OR
python3 -m ai_patch --help
```

#### Node.js Setup
```bash
cd node
npm install
npm run build
cd ..
```

Verify Node.js setup:
```bash
# Should compile TypeScript successfully
ls -la node/dist/src/cli.js  # Check if build output exists
node node/dist/src/cli.js --help  # Test the CLI
```

### 3. Verify Installation

```bash
# Test Python CLI is accessible (after installing)
ai-patch --help
# OR use module form
python3 -m ai_patch --help

# Test Node CLI is accessible (after building)
node node/dist/src/cli.js --help

# You should see the help text with available commands
```

---

## Testing Python Version

### Test 1: Basic Doctor Command (Interactive Mode)

**Purpose**: Test the full interactive flow with user prompts

**Steps**:
```bash
# Set up API key
export OPENAI_API_KEY="sk-your-actual-api-key-here"

# Run in interactive mode
python3 -m ai_patch doctor -i
```

**Expected Prompts**:
1. "What's failing?" - Select option 1-5
2. "What do you use?" - Select option 1-3

**Expected Output**:
- Welcome message: "🔍 AI Patch Doctor - Interactive Mode"
- Detection message showing your API endpoint
- Check execution message: "🔬 Running [target] checks..."
- Report saved message with path
- Findings summary (Detected / Not detected sections)

**Exit Code**: Should be 0 (success)

---

### Test 2: Non-Interactive Mode (Frictionless)

**Purpose**: Test default behavior without interactive prompts

**Steps**:
```bash
# With environment variable set
export OPENAI_API_KEY="sk-your-actual-api-key-here"

# Run without -i flag
python3 -m ai_patch doctor
```

**Expected Behavior**:
- No interactive prompts for target or provider
- Uses default target: "all"
- Auto-detects provider from OPENAI_API_KEY
- Runs all checks
- Generates report

**Exit Code**: Should be 0

---

### Test 3: CI Mode

**Purpose**: Test strict validation for CI/CD pipelines

**Steps**:
```bash
# Test 3a: With valid configuration
export OPENAI_API_KEY="sk-your-actual-api-key-here"
python3 -m ai_patch doctor --ci

# Test 3b: Without API key (should fail)
unset OPENAI_API_KEY
python3 -m ai_patch doctor --ci
echo "Exit code: $?"
```

**Expected for 3a**:
- No prompts at all
- Runs checks with environment config
- Exit code: 0

**Expected for 3b**:
- Error message about missing OPENAI_API_KEY
- Exit code: 2 (configuration error)

---

### Test 4: Specific Target Checks

**Purpose**: Test individual diagnostic checks

```bash
export OPENAI_API_KEY="sk-your-actual-api-key-here"

# Test streaming check only
python3 -m ai_patch doctor --target=streaming

# Test retries check only
python3 -m ai_patch doctor --target=retries

# Test cost check only
python3 -m ai_patch doctor --target=cost

# Test traceability check only
python3 -m ai_patch doctor --target=trace
```

**Expected**:
- Each command runs only the specified check
- Report shows only that check's findings
- Exit code: 0 or 1 (depending on findings)

---

### Test 5: Different Providers

**Purpose**: Test multi-provider support

```bash
# Test 5a: Anthropic
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
unset OPENAI_API_KEY
python3 -m ai_patch doctor --provider=anthropic

# Test 5b: Gemini
export GEMINI_API_KEY="your-gemini-key-here"
unset ANTHROPIC_API_KEY
python3 -m ai_patch doctor --provider=gemini

# Test 5c: OpenAI-compatible (default)
export OPENAI_API_KEY="sk-your-key-here"
export OPENAI_BASE_URL="https://api.openai.com/v1"
python3 -m ai_patch doctor --provider=openai-compatible
```

**Expected**:
- Each provider uses appropriate base URL
- Auto-detection works when keys present
- Appropriate error if key missing

---

### Test 6: Model Override

**Purpose**: Test custom model specification

```bash
export OPENAI_API_KEY="sk-your-key-here"

# Test with specific model
python3 -m ai_patch doctor --model=gpt-4

# Test with another model
python3 -m ai_patch doctor --model=gpt-3.5-turbo
```

**Expected**:
- Checks use specified model
- No errors if model is valid for provider

---

### Test 7: Configuration Saving

**Purpose**: Test config persistence

```bash
export OPENAI_API_KEY="sk-your-key-here"
export OPENAI_BASE_URL="https://api.openai.com/v1"

# Save non-secret config
python3 -m ai_patch doctor --save

# Check saved config
cat ~/.ai-patch/config.json

# Run without env vars (should use saved config)
unset OPENAI_BASE_URL
python3 -m ai_patch doctor
```

**Expected**:
- Config file created at ~/.ai-patch/config.json
- Contains base_url and provider, but NOT api_key
- Second run uses saved base_url

---

### Test 8: Test Command

**Purpose**: Test individual check testing

```bash
export OPENAI_API_KEY="sk-your-key-here"

# Test each check individually
python3 -m ai_patch test --target=streaming
python3 -m ai_patch test --target=retries
python3 -m ai_patch test --target=cost
python3 -m ai_patch test --target=trace
```

**Expected**:
- Each test runs independently
- Exit code 0 on pass, 1 on fail
- Clear pass/fail message

---

### Test 9: Share Command

**Purpose**: Test report sharing

```bash
export OPENAI_API_KEY="sk-your-key-here"

# First run doctor to create a report
python3 -m ai_patch doctor

# Then share the report
python3 -m ai_patch share
```

**Expected**:
- Finds latest report
- Creates share bundle
- Shows path to bundle

---

### Test 10: Security - API Key Safety

**Purpose**: Verify API keys never leak

```bash
# Use a marker string as API key
export OPENAI_API_KEY="sk-MARKER-TEST-12345"

# Run doctor
python3 -m ai_patch doctor 2>&1 | tee output.log

# Search for marker in output
grep -i "MARKER" output.log && echo "❌ FAIL: API key leaked!" || echo "✅ PASS: No key leak"

# Check saved reports
find ~/.ai-patch-reports -name "*.json" -exec grep -l "MARKER" {} \; && echo "❌ FAIL: Key in report!" || echo "✅ PASS: No key in reports"

# Clean up
rm output.log
```

**Expected**:
- Marker string should NOT appear anywhere
- Both checks should show "PASS"

---

### Test 11: Non-TTY Behavior

**Purpose**: Test behavior when not in a terminal

```bash
export OPENAI_API_KEY="sk-your-key-here"

# Run with stdin/stdout redirected (simulates non-TTY)
echo "" | python3 -m ai_patch doctor > output.txt 2>&1
cat output.txt
echo "Exit code: $?"

# Clean up
rm output.txt
```

**Expected**:
- Should run without prompts
- Uses environment config only
- Exit code 0 if config valid

---

### Test 12: Missing API Key Handling

**Purpose**: Test error handling for missing credentials

```bash
# Test 12a: Interactive mode with TTY
unset OPENAI_API_KEY
python3 -m ai_patch doctor -i
# Should prompt for API key
# Enter a test key when prompted

# Test 12b: Non-interactive mode
unset OPENAI_API_KEY
python3 -m ai_patch doctor
echo "Exit code: $?"
```

**Expected for 12a**:
- Prompt: "Enter OpenAI API key:"
- Hidden input (characters not shown)
- Continues after key entry

**Expected for 12b**:
- Error message about missing OPENAI_API_KEY
- Exit code: 2

---

## Testing Node.js Version

All tests are identical to Python version, just use Node.js commands:

### Basic Command Syntax

```bash
# Replace Python commands with Node equivalents:
python3 -m ai_patch doctor     →    node node/dist/src/cli.js doctor
python3 -m ai_patch test       →    node node/dist/src/cli.js test
python3 -m ai_patch share      →    node node/dist/src/cli.js share

# Or if installed via npm:
ai-patch doctor
ai-patch test --target=streaming
```

### Quick Node.js Test Suite

```bash
export OPENAI_API_KEY="sk-your-key-here"

# Test 1: Interactive mode
node node/dist/src/cli.js doctor -i

# Test 2: Non-interactive (default)
node node/dist/src/cli.js doctor

# Test 3: CI mode
node node/dist/src/cli.js doctor --ci

# Test 4: Specific target
node node/dist/src/cli.js doctor --target=streaming

# Test 5: Test command
node node/dist/src/cli.js test --target=cost

# Test 6: Share report
node node/dist/src/cli.js doctor
node node/dist/src/cli.js share
```

---

## Test Scenarios

### Scenario 1: First-Time User (No Config)

**Goal**: Simulate a new user trying the tool

```bash
# Clear all config
rm -rf ~/.ai-patch/
unset OPENAI_API_KEY
unset OPENAI_BASE_URL

# Try to run
python3 -m ai_patch doctor -i
# Should prompt for provider, then API key
```

---

### Scenario 2: Production Debugging

**Goal**: Simulate debugging a production issue

```bash
export OPENAI_API_KEY="sk-your-key-here"

# Run all checks (prod mode)
python3 -m ai_patch doctor --target=prod

# Review report
ls -la ~/.ai-patch-reports/latest/
cat ~/.ai-patch-reports/latest/report.md
```

---

### Scenario 3: CI Pipeline Integration

**Goal**: Test in automated pipeline

```bash
# Simulate CI environment
export CI=true
export OPENAI_API_KEY="sk-your-key-here"

# Run in CI mode
python3 -m ai_patch doctor --ci --target=all
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All checks passed"
elif [ $EXIT_CODE -eq 1 ]; then
  echo "⚠️  Issues detected"
elif [ $EXIT_CODE -eq 2 ]; then
  echo "❌ Configuration error"
fi
```

---

### Scenario 4: Custom Gateway Testing

**Goal**: Test with a custom OpenAI-compatible gateway

```bash
export OPENAI_API_KEY="sk-your-gateway-key"
export OPENAI_BASE_URL="https://your-gateway.com/v1"

python3 -m ai_patch doctor --provider=openai-compatible
```

---

### Scenario 5: Multiple Provider Switching

**Goal**: Test switching between providers

```bash
# OpenAI
export OPENAI_API_KEY="sk-openai-key"
python3 -m ai_patch doctor --provider=openai-compatible

# Anthropic
export ANTHROPIC_API_KEY="sk-ant-key"
python3 -m ai_patch doctor --provider=anthropic

# Back to OpenAI
python3 -m ai_patch doctor --provider=openai-compatible
```

---

## Verification Checklist

Use this checklist to verify all functionality works:

### Core Functionality
- [ ] `doctor` command runs successfully
- [ ] Interactive mode (`-i`) prompts for input
- [ ] Non-interactive mode runs without prompts
- [ ] CI mode (`--ci`) fails fast on errors
- [ ] All 4 diagnostic checks run (streaming, retries, cost, trace)
- [ ] Reports are generated and saved

### Configuration
- [ ] Auto-detection works from environment variables
- [ ] Provider auto-detection (OpenAI, Anthropic, Gemini)
- [ ] `--model` flag overrides default model
- [ ] `--save` persists configuration
- [ ] Saved config is loaded on subsequent runs

### Security
- [ ] API keys never appear in terminal output
- [ ] API keys never appear in saved reports
- [ ] Hidden input works for API key prompts
- [ ] Non-TTY environments handle missing keys correctly

### Exit Codes
- [ ] Exit code 0 on success
- [ ] Exit code 1 on diagnostic failures
- [ ] Exit code 2 on configuration errors

### Commands
- [ ] `doctor` command works
- [ ] `test --target=X` command works
- [ ] `share` command works
- [ ] `diagnose` command works
- [ ] `apply` command shows appropriate message
- [ ] `revert` command shows appropriate message

### Multi-Language Parity
- [ ] Python and Node.js versions behave identically
- [ ] Same commands, same flags, same output
- [ ] Both generate compatible reports

---

## Troubleshooting

### Issue: "Command not found"

**Python**:
```bash
# Make sure package is installed
cd python
pip install -e .

# Try full path
python3 -m ai_patch --help
```

**Node.js**:
```bash
# Build TypeScript
cd node
npm run build

# Use compiled output
node node/dist/src/cli.js --help
```

---

### Issue: "Missing API key"

**Solution**:
```bash
# Set environment variable
export OPENAI_API_KEY="sk-your-key-here"

# Or use interactive mode to enter it
python3 -m ai_patch doctor -i
```

---

### Issue: "Provider not detected"

**Solution**:
```bash
# Explicitly specify provider
python3 -m ai_patch doctor --provider=openai-compatible

# Or set appropriate environment variable
export OPENAI_API_KEY="sk-..."  # For OpenAI
export ANTHROPIC_API_KEY="sk-ant-..."  # For Anthropic
export GEMINI_API_KEY="..."  # For Gemini
```

---

### Issue: "Interactive mode not working"

**Solution**:
- Make sure you're in an actual terminal (TTY)
- Don't redirect stdin/stdout
- Don't use with pipes or non-interactive shells

---

### Issue: Reports not saving

**Check permissions**:
```bash
# Check if directory is writable
ls -la ~/.ai-patch-reports/

# Create directory if missing
mkdir -p ~/.ai-patch-reports/

# Check disk space
df -h ~
```

---

### Issue: Tests failing

**Debug steps**:
```bash
# Run with verbose output
python3 -m ai_patch doctor --target=streaming 2>&1 | tee debug.log

# Check actual API connectivity
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  | jq

# Verify API key format
echo $OPENAI_API_KEY | grep -E "^sk-[a-zA-Z0-9]{48}$"
```

---

## Quick Test Script

Save this as `test-all.sh` for quick validation:

```bash
#!/bin/bash
set -e

echo "🧪 AI Patch Doctor - Quick Test Suite"
echo "======================================"

# Check prerequisites
echo ""
echo "1. Checking prerequisites..."
python3 --version || exit 1
node --version || exit 1

# Check API key
if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ OPENAI_API_KEY not set"
  echo "   Export your API key: export OPENAI_API_KEY='sk-...'"
  exit 1
fi
echo "✅ API key found"

# Test Python version
echo ""
echo "2. Testing Python version..."
python3 -m ai_patch doctor --target=streaming
echo "✅ Python test passed"

# Test Node version
echo ""
echo "3. Testing Node.js version..."
node node/dist/src/cli.js doctor --target=streaming
echo "✅ Node.js test passed"

# Test report generation
echo ""
echo "4. Checking reports..."
if [ -d ~/.ai-patch-reports/latest ]; then
  echo "✅ Reports directory exists"
  ls -la ~/.ai-patch-reports/latest/
else
  echo "❌ No reports found"
  exit 1
fi

echo ""
echo "✅ All tests passed!"
```

Make it executable:
```bash
chmod +x test-all.sh
./test-all.sh
```

---

## Advanced Testing

### Testing Without Real API Calls

**Note**: AI Patch Doctor makes real API calls to diagnose issues. To test the CLI without making API calls, you can:

1. **Test Help Commands** (no API calls):
   ```bash
   ai-patch --help
   ai-patch doctor --help
   ai-patch test --help
   ```

2. **Test Configuration Validation** (no API calls):
   ```bash
   # Test missing API key handling
   unset OPENAI_API_KEY
   ai-patch doctor --ci
   # Should exit with code 2
   ```

3. **Test Interactive Prompts** (no API calls initially):
   ```bash
   # Start interactive mode
   # Cancel with Ctrl+C before running checks
   ai-patch doctor -i
   ```

4. **Use Invalid API Key** (will fail gracefully):
   ```bash
   export OPENAI_API_KEY="sk-test-invalid-key"
   ai-patch doctor --target=streaming
   # Will fail but test error handling
   ```

**For Full Testing**: You'll need a valid API key to test the actual diagnostic checks.

---

### Performance Testing

```bash
# Time the execution
time python3 -m ai_patch doctor --target=streaming

# Run multiple iterations
for i in {1..5}; do
  echo "Run $i:"
  time python3 -m ai_patch doctor --target=cost
done
```

---

### Stress Testing

```bash
# Run all checks repeatedly
for i in {1..10}; do
  echo "Iteration $i"
  python3 -m ai_patch doctor --target=all
done

# Check report directory size
du -sh ~/.ai-patch-reports/
```

---

### Edge Cases

```bash
# Empty API key
export OPENAI_API_KEY=""
python3 -m ai_patch doctor
# Should fail with exit code 2

# Very long API key
export OPENAI_API_KEY="sk-$(head -c 100 /dev/urandom | base64)"
python3 -m ai_patch doctor
# Should fail gracefully

# Invalid base URL
export OPENAI_BASE_URL="not-a-url"
python3 -m ai_patch doctor
# Should handle gracefully
```

---

## Summary

This guide covers:
- ✅ All CLI commands (`doctor`, `test`, `share`, etc.)
- ✅ All modes (interactive, non-interactive, CI)
- ✅ All providers (OpenAI, Anthropic, Gemini)
- ✅ All diagnostic checks (streaming, retries, cost, trace)
- ✅ Security testing (API key safety)
- ✅ Configuration management
- ✅ Error handling
- ✅ Both Python and Node.js implementations

**Next Steps:**
1. Start with the Quick Test Script
2. Run through Test Scenarios 1-5
3. Complete the Verification Checklist
4. Report any issues found

**Questions?**
- Check the [README.md](./README.md) for feature documentation
- Check the [USERFLOW.md](./USERFLOW.md) for detailed flow documentation
- Open an issue on GitHub for bugs or feature requests

---

**Happy Testing! 🔍⚕️**
