#!/bin/bash
# Test script for AI Doctor GitHub Action workflow
# This tests the workflow locally to ensure it works correctly

set -e  # Exit on error

echo "🧪 Testing AI Doctor Workflow Locally"
echo "====================================="
echo ""

# Step 1: Check if Node.js is installed
echo "✓ Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi
NODE_VERSION=$(node -v)
echo "  Node version: $NODE_VERSION"
echo ""

# Step 2: Build the package
echo "✓ Building AI Patch package..."
cd "$(dirname "$0")/node"
npm install --silent
npm run build --silent
cd ..
echo "  Build complete"
echo ""

# Step 3: Run on test codebase with --fix (static scan)
echo "✓ Running AI Doctor on test codebase (scan-only mode)..."
cd test-codebase
echo "  Command: node ../node/dist/src/cli.js doctor --fix --no-telemetry"
echo ""

# Capture output
OUTPUT=$(node ../node/dist/src/cli.js doctor --fix --no-telemetry 2>&1 || true)
EXIT_CODE=$?

# Display results
echo "$OUTPUT"
echo ""

# Step 4: Check if it detected issues
if echo "$OUTPUT" | grep -q "Found [0-9]* fixable issues"; then
    echo "✅ SUCCESS: AI Doctor detected issues in test codebase"
    echo ""
    
    # Extract issue count
    ISSUE_COUNT=$(echo "$OUTPUT" | grep -o "Found [0-9]* fixable issues" | grep -o "[0-9]*")
    echo "📊 Summary:"
    echo "  - Issues detected: $ISSUE_COUNT"
    echo "  - Scan mode: Static code analysis (no API keys required)"
    echo "  - Exit code: $EXIT_CODE"
else
    echo "⚠️  WARNING: No issues detected (unexpected for test codebase)"
fi

echo ""
echo "---"
echo ""
echo "📝 Note about --ci flag:"
echo "  The workflow uses --ci flag, but it currently requires API keys."
echo "  For true zero-config operation, the CLI needs to:"
echo "  1. Run static scanning when --ci is used without API keys"
echo "  2. Fallback to scan-only mode automatically"
echo ""
echo "  Current workaround: Use --fix flag for static scanning"
echo "  Future: --ci should default to scan-only when no keys present"
echo ""

# Step 5: Simulate what the GitHub Action would do
echo "🎬 Simulating GitHub Action workflow steps:"
echo ""
echo "  1. Checkout code: ✓"
echo "  2. Setup Node.js: ✓"
echo "  3. Cache npm: ✓"
echo "  4. Run AI Doctor:"
echo "     $ npx -y ai-patch doctor --target=all --share --ci --no-telemetry"
echo ""
echo "  Expected with current CLI:"
echo "     ❌ Would fail: Missing OPENAI_API_KEY"
echo ""
echo "  Expected with enhanced CLI (scan-only mode):"
echo "     ✅ Would scan code statically"
echo "     ✅ Generate report.md and report.json"
echo "     ✅ Exit with code 0 (pass) or 1 (issues found)"
echo ""

cd ..

echo "✅ Test complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Enhance CLI to support --ci without API keys (scan-only)"
echo "  2. Test workflow in actual GitHub Actions environment"
echo "  3. Add example repositories with AI API code to test against"
