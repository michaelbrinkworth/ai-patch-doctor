#!/bin/bash
# Test script to verify API keys never leak in output or reports
# This script uses a marker string as the API key and verifies it never appears

set -e

MARKER="SECRET_KEY_MARKER_XYZ123"
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

echo "Testing API key safety..."
echo "Working directory: $TEST_DIR"
echo ""

# Test 1: Non-TTY scenario with missing key should exit with code 2
echo "Test 1: Non-TTY with missing key (should exit 2)"
export OPENAI_API_KEY=""
export OPENAI_BASE_URL="https://api.openai.com"
EXIT_CODE=0
OUTPUT=$(echo "" | node /home/runner/work/ai-patch-doctor/ai-patch-doctor/node/dist/src/cli.js doctor 2>&1) || EXIT_CODE=$?

if [ $EXIT_CODE -eq 2 ]; then
    echo "✓ Correctly exited with code 2"
else
    echo "✗ Expected exit code 2, got $EXIT_CODE"
    echo "Output:"
    echo "$OUTPUT"
    exit 1
fi

# Check that marker doesn't appear in output
if echo "$OUTPUT" | grep -q "$MARKER"; then
    echo "✗ FAIL: Marker found in output!"
    echo "$OUTPUT"
    exit 1
else
    echo "✓ Marker not found in output"
fi

echo ""

# Test 2: With API key set, check reports don't contain it
echo "Test 2: Reports don't contain API key"
export OPENAI_API_KEY="$MARKER"
export OPENAI_BASE_URL="https://api.openai.com"

# Run doctor in non-interactive mode (will fail to connect but should generate report structure)
EXIT_CODE=0
OUTPUT=$(node /home/runner/work/ai-patch-doctor/ai-patch-doctor/node/dist/src/cli.js doctor --ci 2>&1) || EXIT_CODE=$?

echo "Exit code: $EXIT_CODE"

# Check if any reports were generated
if [ -d "ai-patch-reports" ]; then
    echo "Reports generated, checking for API key leaks..."
    
    # Search all generated files for the marker
    if grep -r "$MARKER" ai-patch-reports/; then
        echo "✗ FAIL: API key marker found in report files!"
        exit 1
    else
        echo "✓ API key marker not found in any report files"
    fi
else
    echo "✓ No reports generated (expected if API call failed)"
fi

# Check stdout/stderr for marker
if echo "$OUTPUT" | grep -q "$MARKER"; then
    echo "✗ FAIL: API key marker found in stdout/stderr!"
    echo "$OUTPUT"
    exit 1
else
    echo "✓ API key marker not found in output"
fi

echo ""
echo "✓ All API key safety tests passed!"

# Cleanup
cd /
rm -rf "$TEST_DIR"
