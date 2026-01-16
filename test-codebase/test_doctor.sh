#!/bin/bash
# Comprehensive test script for AI Patch Doctor (Python and Node)
#
# Usage:
#   ./test_doctor.sh              - Run tests normally
#   VERBOSE=1 ./test_doctor.sh    - Show build errors when they occur

set -e  # Exit on error

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$TEST_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Helper functions
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Check if API key is set
check_api_key() {
    if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
        log_info "No API key detected. Some tests will be skipped."
        return 1
    fi
    return 0
}

# Test function
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_exit="$3"
    local expected_output="$4"
    
    log_test "$test_name"
    
    # Run command and capture output
    if output=$(eval "$command" 2>&1); then
        exit_code=0
    else
        exit_code=$?
    fi
    
    # Check exit code
    if [ "$exit_code" -ne "$expected_exit" ]; then
        log_fail "$test_name - Expected exit code $expected_exit, got $exit_code"
        echo "Output: $output"
        return 1
    fi
    
    # Check output if expected_output is provided
    if [ -n "$expected_output" ]; then
        if echo "$output" | grep -q "$expected_output"; then
            log_pass "$test_name"
            return 0
        else
            log_fail "$test_name - Expected output containing '$expected_output' not found"
            echo "Output: $output"
            return 1
        fi
    else
        log_pass "$test_name"
        return 0
    fi
}

echo "=========================================="
echo "AI Patch Doctor - Comprehensive Test Suite"
echo "=========================================="
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3 -m ai_patch.cli"
    log_pass "Python found"
else
    log_fail "Python3 not found"
    PYTHON_CMD=""
fi

# Check Node
if command -v node &> /dev/null; then
    NODE_CMD="node ../node/dist/src/cli.js"
    if [ ! -f "../node/dist/src/cli.js" ]; then
        log_info "Node CLI not built, attempting to build..."
        BUILD_OUTPUT=$(cd ../node && npm install && npm run build 2>&1)
        BUILD_STATUS=$?
        cd "$TEST_DIR" || exit 1
        
        if [ $BUILD_STATUS -eq 0 ]; then
            log_pass "Node CLI built successfully"
        else
            log_info "Node CLI build failed - skipping Node tests"
            if [ -n "$VERBOSE" ]; then
                echo "$BUILD_OUTPUT"
            fi
            NODE_CMD=""
        fi
    else
        log_pass "Node found"
    fi
else
    log_fail "Node not found"
    NODE_CMD=""
fi

# Check API key
HAS_API_KEY=false
if check_api_key; then
    HAS_API_KEY=true
    log_pass "API key detected"
else
    log_info "No API key - some tests will be skipped"
fi

echo ""
echo "=========================================="
echo "Testing Python Implementation"
echo "=========================================="
echo ""

if [ -n "$PYTHON_CMD" ]; then
    # Test 1: Help command
    run_test "Python: Help command" \
        "$PYTHON_CMD doctor --help" \
        0 \
        "Run diagnosis"
    
    # Test 2: Non-interactive default (should work if API key exists)
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Python: Non-interactive default mode" \
            "$PYTHON_CMD doctor" \
            0 \
            "Running all checks"
    else
        # Clear any saved config and env vars for this test
        run_test "Python: Non-interactive default (no API key)" \
            "OPENAI_API_KEY='' ANTHROPIC_API_KEY='' GEMINI_API_KEY='' unset OPENAI_API_KEY ANTHROPIC_API_KEY GEMINI_API_KEY; rm -f ~/.ai-patch/config.json 2>/dev/null; $PYTHON_CMD doctor" \
            2 \
            "Missing configuration"
    fi
    
    # Test 3: Specific target
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Python: Specific target (streaming)" \
            "$PYTHON_CMD doctor --target streaming" \
            0 \
            "Running streaming checks"
    fi
    
    # Test 4: CI mode (should fail fast without API key)
    run_test "Python: CI mode without API key" \
        "OPENAI_API_KEY='' ANTHROPIC_API_KEY='' GEMINI_API_KEY='' unset OPENAI_API_KEY ANTHROPIC_API_KEY GEMINI_API_KEY; rm -f ~/.ai-patch/config.json 2>/dev/null; $PYTHON_CMD doctor --ci" \
        2 \
        "Missing configuration"
    
    # Test 5: Provider flag
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Python: Provider flag" \
            "$PYTHON_CMD doctor --provider openai-compatible --target cost" \
            0 \
            "Provider: openai-compatible"
    fi
    
    # Test 6: Invalid provider
    run_test "Python: Invalid provider" \
        "$PYTHON_CMD doctor --provider invalid" \
        2 \
        "Invalid value"
    
    # Test 7: Save flag (should not save without --force for key)
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Python: Save-key without force" \
            "$PYTHON_CMD doctor --save-key" \
            2 \
            "requires --force"
    fi
    
    # Test 8: Interactive mode (should show interactive message)
    run_test "Python: Interactive mode flag" \
        "$PYTHON_CMD doctor -i --help" \
        0 \
        "interactive"
    
    # Test 9: All targets
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Python: All targets" \
            "$PYTHON_CMD doctor --target all" \
            0 \
            "Running all checks"
    fi
    
    # Test 10: Report generation
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Python: Report generation" \
            "$PYTHON_CMD doctor --target cost" \
            0 \
            "Report:"
        
        # Check if report was created
        if [ -f "ai-patch-reports/latest/report.md" ] || [ -f "ai-patch-reports/latest/report.json" ]; then
            log_pass "Python: Report file created"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            log_fail "Python: Report file not found"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    fi
else
    log_info "Skipping Python tests (Python not available)"
fi

echo ""
echo "=========================================="
echo "Testing Node Implementation"
echo "=========================================="
echo ""

if [ -n "$NODE_CMD" ]; then
    # Test 1: Help command
    run_test "Node: Help command" \
        "$NODE_CMD doctor --help" \
        0 \
        "Run diagnosis"
    
    # Test 2: Non-interactive default (should work if API key exists)
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Node: Non-interactive default mode" \
            "$NODE_CMD doctor" \
            0 \
            "Running all checks"
    else
        # Clear any saved config and env vars for this test
        run_test "Node: Non-interactive default (no API key)" \
            "OPENAI_API_KEY='' ANTHROPIC_API_KEY='' GEMINI_API_KEY='' unset OPENAI_API_KEY ANTHROPIC_API_KEY GEMINI_API_KEY; rm -f ~/.ai-patch/config.json 2>/dev/null; $NODE_CMD doctor" \
            2 \
            "Missing configuration"
    fi
    
    # Test 3: Specific target
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Node: Specific target (streaming)" \
            "$NODE_CMD doctor --target streaming" \
            0 \
            "Running streaming checks"
    fi
    
    # Test 4: CI mode (should fail fast without API key)
    run_test "Node: CI mode without API key" \
        "OPENAI_API_KEY='' ANTHROPIC_API_KEY='' GEMINI_API_KEY='' unset OPENAI_API_KEY ANTHROPIC_API_KEY GEMINI_API_KEY; rm -f ~/.ai-patch/config.json 2>/dev/null; $NODE_CMD doctor --ci" \
        2 \
        "Missing configuration"
    
    # Test 5: Provider flag
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Node: Provider flag" \
            "$NODE_CMD doctor --provider openai-compatible --target cost" \
            0 \
            "Provider: openai-compatible"
    fi
    
    # Test 6: Invalid provider
    run_test "Node: Invalid provider" \
        "$NODE_CMD doctor --provider invalid" \
        2 \
        "Invalid"
    
    # Test 7: Save flag (should not save without --force for key)
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Node: Save-key without force" \
            "$NODE_CMD doctor --save-key" \
            2 \
            "requires --force"
    fi
    
    # Test 8: Interactive mode (should show interactive message)
    run_test "Node: Interactive mode flag" \
        "$NODE_CMD doctor -i --help" \
        0 \
        "interactive"
    
    # Test 9: All targets
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Node: All targets" \
            "$NODE_CMD doctor --target all" \
            0 \
            "Running all checks"
    fi
    
    # Test 10: Report generation
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Node: Report generation" \
            "$NODE_CMD doctor --target cost" \
            0 \
            "Report:"
        
        # Check if report was created
        if [ -f "ai-patch-reports/latest/report.md" ] || [ -f "ai-patch-reports/latest/report.json" ]; then
            log_pass "Node: Report file created"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            log_fail "Node: Report file not found"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    fi
else
    log_info "Skipping Node tests (Node not available)"
fi

echo ""
echo "=========================================="
echo "Cross-Implementation Tests"
echo "=========================================="
echo ""

if [ -n "$PYTHON_CMD" ] && [ -n "$NODE_CMD" ] && [ "$HAS_API_KEY" = true ]; then
    # Test: Both should produce similar output
    log_test "Cross: Python and Node output consistency"
    
    PYTHON_OUTPUT=$($PYTHON_CMD doctor --target cost 2>&1)
    NODE_OUTPUT=$($NODE_CMD doctor --target cost 2>&1)
    
    # Check if both have similar status indicators
    if echo "$PYTHON_OUTPUT" | grep -q "Status:" && echo "$NODE_OUTPUT" | grep -q "Status:"; then
        log_pass "Cross: Both implementations produce status output"
    else
        log_fail "Cross: Output format mismatch"
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

echo ""
echo "=========================================="
echo "Edge Case Tests"
echo "=========================================="
echo ""

if [ -n "$PYTHON_CMD" ]; then
    # Edge Case 1: Invalid target
    run_test "Edge Case: Invalid target" \
        "$PYTHON_CMD doctor --target invalid_target" \
        2 \
        "Invalid"
    
    # Edge Case 2: Multiple conflicting flags
    run_test "Edge Case: Conflicting flags (interactive + CI)" \
        "$PYTHON_CMD doctor -i --ci" \
        2 \
        ""
    
    # Edge Case 3: Empty provider string
    run_test "Edge Case: Empty provider string" \
        "$PYTHON_CMD doctor --provider ''" \
        2 \
        ""
    
    # Edge Case 4: Invalid API key format
    run_test "Edge Case: Invalid API key format" \
        "OPENAI_API_KEY='invalid' $PYTHON_CMD doctor --target cost --ci" \
        1 \
        ""
    
    # Edge Case 5: Test with all API keys unset
    run_test "Edge Case: All API keys unset" \
        "env -u OPENAI_API_KEY -u ANTHROPIC_API_KEY -u GEMINI_API_KEY $PYTHON_CMD doctor --ci" \
        2 \
        "Missing configuration"
    
    # Edge Case 6: Valid provider but no matching API key
    run_test "Edge Case: Provider mismatch (anthropic without key)" \
        "env -u ANTHROPIC_API_KEY $PYTHON_CMD doctor --provider anthropic --ci" \
        2 \
        ""
    
    # Edge Case 7: Multiple targets (should fail or handle gracefully)
    run_test "Edge Case: Multiple targets flag" \
        "$PYTHON_CMD doctor --target cost --target streaming" \
        2 \
        ""
    
    # Edge Case 8: Help with other flags (should show help)
    run_test "Edge Case: Help with target flag" \
        "$PYTHON_CMD doctor --help --target streaming" \
        0 \
        "Run diagnosis"
    
    # Edge Case 9: Very long model name
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Edge Case: Very long model name" \
            "$PYTHON_CMD doctor --model 'this-is-a-very-long-model-name-that-does-not-exist' --target cost --ci" \
            1 \
            ""
    fi
    
    # Edge Case 10: Special characters in provider
    run_test "Edge Case: Special characters in provider" \
        "$PYTHON_CMD doctor --provider 'openai@#$%' --ci" \
        2 \
        ""
fi

if [ -n "$NODE_CMD" ]; then
    # Edge Case 1: Invalid target
    run_test "Node Edge Case: Invalid target" \
        "$NODE_CMD doctor --target invalid_target" \
        2 \
        "Invalid"
    
    # Edge Case 2: Multiple conflicting flags
    run_test "Node Edge Case: Conflicting flags (interactive + CI)" \
        "$NODE_CMD doctor -i --ci" \
        2 \
        ""
    
    # Edge Case 3: Empty provider string
    run_test "Node Edge Case: Empty provider string" \
        "$NODE_CMD doctor --provider ''" \
        2 \
        ""
    
    # Edge Case 4: Test with all API keys unset
    run_test "Node Edge Case: All API keys unset" \
        "env -u OPENAI_API_KEY -u ANTHROPIC_API_KEY -u GEMINI_API_KEY $NODE_CMD doctor --ci" \
        2 \
        "Missing configuration"
    
    # Edge Case 5: Help with other flags
    run_test "Node Edge Case: Help with target flag" \
        "$NODE_CMD doctor --help --target streaming" \
        0 \
        "Run diagnosis"
    
    # Edge Case 6: Special characters in provider
    run_test "Node Edge Case: Special characters in provider" \
        "$NODE_CMD doctor --provider 'openai@#$%' --ci" \
        2 \
        ""
fi

echo ""
echo "=========================================="
echo "Multi-Provider Tests"
echo "=========================================="
echo ""

if [ -n "$PYTHON_CMD" ]; then
    # Test Claude/Anthropic provider
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        run_test "Python: Anthropic provider" \
            "$PYTHON_CMD doctor --provider anthropic --target streaming --ci" \
            0 \
            "Provider: anthropic"
    else
        log_info "Skipping Anthropic tests (no ANTHROPIC_API_KEY)"
    fi
    
    # Test Gemini provider
    if [ -n "$GEMINI_API_KEY" ]; then
        run_test "Python: Gemini provider" \
            "$PYTHON_CMD doctor --provider gemini --target cost --ci" \
            0 \
            "Provider: gemini"
    else
        log_info "Skipping Gemini tests (no GEMINI_API_KEY)"
    fi
    
    # Test OpenAI-compatible with custom base URL
    if [ "$HAS_API_KEY" = true ]; then
        run_test "Python: OpenAI-compatible with custom base" \
            "OPENAI_BASE_URL='https://api.openai.com/v1' $PYTHON_CMD doctor --provider openai-compatible --target retry --ci" \
            0 \
            "Provider: openai-compatible"
    fi
fi

if [ -n "$NODE_CMD" ]; then
    # Test Claude/Anthropic provider
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        run_test "Node: Anthropic provider" \
            "$NODE_CMD doctor --provider anthropic --target streaming --ci" \
            0 \
            "Provider: anthropic"
    else
        log_info "Skipping Node Anthropic tests (no ANTHROPIC_API_KEY)"
    fi
    
    # Test Gemini provider
    if [ -n "$GEMINI_API_KEY" ]; then
        run_test "Node: Gemini provider" \
            "$NODE_CMD doctor --provider gemini --target cost --ci" \
            0 \
            "Provider: gemini"
    else
        log_info "Skipping Node Gemini tests (no GEMINI_API_KEY)"
    fi
fi

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
