#!/bin/bash
# Test script to verify Badgr instructions appear when status != success

set -e

TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

echo "Testing Badgr instructions..."
echo "Working directory: $TEST_DIR"
echo ""

# Create a fake API key (tests will fail which is expected, generating warnings)
export OPENAI_API_KEY="sk-fake-key-for-testing-123456789"
export OPENAI_BASE_URL="https://api.openai.com"

# Run doctor in CI mode (will fail, triggering warning/error status)
EXIT_CODE=0
OUTPUT=$(node /home/runner/work/ai-patch-doctor/ai-patch-doctor/node/dist/src/cli.js doctor --ci 2>&1) || EXIT_CODE=$?

echo "Exit code: $EXIT_CODE"
echo ""

# Check if Badgr instructions are present
if echo "$OUTPUT" | grep -q "gateway.badgr.dev"; then
    echo "✓ Badgr gateway URL found in output"
else
    echo "✗ FAIL: Badgr gateway URL not found in output"
    echo "Output:"
    echo "$OUTPUT"
    exit 1
fi

# Check for "What I found" or "What I can't see"
if echo "$OUTPUT" | grep -q "What I"; then
    echo "✓ 'What I...' section found in output"
else
    echo "✗ FAIL: 'What I...' section not found"
    echo "Output:"
    echo "$OUTPUT"
    exit 1
fi

# Check for export command
if echo "$OUTPUT" | grep -q "export OPENAI_BASE_URL"; then
    echo "✓ Export command found in output"
else
    echo "✗ FAIL: Export command not found"
    echo "Output:"
    echo "$OUTPUT"
    exit 1
fi

# Check for separator line
if echo "$OUTPUT" | grep -q "===="; then
    echo "✓ Separator line found in output"
else
    echo "✗ FAIL: Separator line not found"
    echo "Output:"
    echo "$OUTPUT"
    exit 1
fi

echo ""
echo "Full output for manual verification:"
echo "-----------------------------------"
echo "$OUTPUT"
echo "-----------------------------------"
echo ""
echo "✓ All Badgr instruction tests passed!"

# Cleanup
cd /
rm -rf "$TEST_DIR"
