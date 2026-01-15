#!/bin/bash
# Comprehensive test script for AI Patch Doctor (Python and Node)

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
        log_info "Node CLI not built, building..."
        cd ../node && npm run build && cd "$TEST_DIR"
    fi
    log_pass "Node found"
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
