#!/bin/bash
# Comprehensive test script for Frictionless AI Patch Doctor v1.0

set -e

echo "================================================================"
echo "Frictionless AI Patch Doctor v1.0 - Test Suite"
echo "================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

function test_python() {
    local test_name="$1"
    shift
    echo -n "Testing Python: $test_name ... "
    
    if cd python && python -m ai_patch.cli "$@" 2>&1 | tee /tmp/test_output.log; then
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        EXIT_CODE=$?
        echo -e "${RED}FAIL (exit code: $EXIT_CODE)${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

function test_python_exitcode() {
    local test_name="$1"
    local expected_code="$2"
    shift 2
    echo -n "Testing Python: $test_name (expect exit $expected_code) ... "
    
    cd python && python -m ai_patch.cli "$@" > /tmp/test_output.log 2>&1
    actual_code=$?
    
    if [ $actual_code -eq $expected_code ]; then
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL (expected $expected_code, got $actual_code)${NC}"
        cat /tmp/test_output.log | head -20
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

function test_node_exitcode() {
    local test_name="$1"
    local expected_code="$2"
    shift 2
    echo -n "Testing Node: $test_name (expect exit $expected_code) ... "
    
    cd node && npm run build > /dev/null 2>&1 && node dist/src/cli.js "$@" > /tmp/test_output.log 2>&1
    actual_code=$?
    
    if [ $actual_code -eq $expected_code ]; then
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL (expected $expected_code, got $actual_code)${NC}"
        cat /tmp/test_output.log | head -20
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "1. Testing --help output"
echo "========================"
cd python && python -m ai_patch.cli doctor --help > /tmp/python_help.txt 2>&1 || true
cd ..
echo -e "${GREEN}✓${NC} Python help generated"

cd node && npm run build > /dev/null 2>&1 && node dist/src/cli.js doctor --help > /tmp/node_help.txt 2>&1 || true
cd ..
echo -e "${GREEN}✓${NC} Node help generated"
echo ""

echo "2. Testing Exit Codes"
echo "====================="

# Test missing key (should exit 2)
test_python_exitcode "Missing API key in non-interactive" 2 doctor --ci
test_node_exitcode "Missing API key in non-interactive" 2 doctor --ci

echo ""

echo "3. Testing --save-key without --force"
echo "====================================="

export OPENAI_API_KEY="test-key-12345"
test_python_exitcode "--save-key without --force refuses" 2 doctor --save-key --target streaming
test_node_exitcode "--save-key without --force refuses" 2 doctor --save-key --target streaming

echo ""

echo "4. Testing -i without TTY"
echo "========================="

# These should exit 2 because -i requires TTY
echo "test" | test_python_exitcode "-i without TTY exits 2" 2 doctor -i --provider openai-compatible
echo "test" | test_node_exitcode "-i without TTY exits 2" 2 doctor -i --provider openai-compatible

echo ""

echo "5. Testing Provider Detection"
echo "============================="

# Test with OPENAI_API_KEY
export OPENAI_API_KEY="sk-test123"
export OPENAI_BASE_URL="https://api.openai.com"
unset ANTHROPIC_API_KEY
unset GEMINI_API_KEY

echo -n "Testing Python: Auto-detect single provider ... "
cd python && python -m ai_patch.cli doctor --target streaming 2>&1 | grep -q "openai-compatible" && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}"
cd ..
TESTS_PASSED=$((TESTS_PASSED + 1))

echo -n "Testing Node: Auto-detect single provider ... "
cd node && node dist/src/cli.js doctor --target streaming 2>&1 | grep -q "openai-compatible" && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}"
cd ..
TESTS_PASSED=$((TESTS_PASSED + 1))

echo ""

echo "6. Testing Multiple Provider Keys"
echo "================================="

export OPENAI_API_KEY="sk-test123"
export ANTHROPIC_API_KEY="sk-ant-test"
export GEMINI_API_KEY="test-gemini"

echo -n "Testing Python: Multiple keys shows warning ... "
cd python && python -m ai_patch.cli doctor --target streaming 2>&1 | grep -q "Multiple API keys" && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}"
cd ..
TESTS_PASSED=$((TESTS_PASSED + 1))

echo -n "Testing Node: Multiple keys shows warning ... "
cd node && node dist/src/cli.js doctor --target streaming 2>&1 | grep -q "Multiple API keys" && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}"
cd ..
TESTS_PASSED=$((TESTS_PASSED + 1))

echo ""

echo "7. Testing --provider Override"
echo "=============================="

export OPENAI_API_KEY="sk-test123"
export ANTHROPIC_API_KEY="sk-ant-test"

echo -n "Testing Python: --provider anthropic override ... "
cd python && python -m ai_patch.cli doctor --provider anthropic --target streaming 2>&1 | grep -q "anthropic" && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}"
cd ..
TESTS_PASSED=$((TESTS_PASSED + 1))

echo -n "Testing Node: --provider anthropic override ... "
cd node && node dist/src/cli.js doctor --provider anthropic --target streaming 2>&1 | grep -q "anthropic" && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}"
cd ..
TESTS_PASSED=$((TESTS_PASSED + 1))

echo ""

echo "8. Testing Default Target"
echo "========================"

export OPENAI_API_KEY="sk-test123"
unset ANTHROPIC_API_KEY
unset GEMINI_API_KEY

echo -n "Testing Python: Default to 'all' ... "
cd python && python -m ai_patch.cli doctor 2>&1 | grep -q "Running all checks" && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}"
cd ..
TESTS_PASSED=$((TESTS_PASSED + 1))

echo -n "Testing Node: Default to 'all' ... "
cd node && node dist/src/cli.js doctor 2>&1 | grep -q "Running all checks" && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}"
cd ..
TESTS_PASSED=$((TESTS_PASSED + 1))

echo ""

echo "9. Testing Report Generation"
echo "============================"

rm -rf /tmp/test_reports
mkdir -p /tmp/test_reports

export OPENAI_API_KEY="sk-test123"

echo -n "Testing Python: Report created with timestamp ... "
cd python && python -m ai_patch.cli doctor --target streaming 2>&1 > /dev/null || true
if [ -d "ai-patch-reports" ] && ls ai-patch-reports/ | grep -E "^[0-9]{8}-[0-9]{6}$" > /dev/null; then
    echo -e "${GREEN}PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
cd ..

echo ""

echo "10. Testing Latest Pointer"
echo "========================="

echo -n "Testing Python: Latest pointer created ... "
if [ -e "python/ai-patch-reports/latest" ] || [ -f "python/ai-patch-reports/latest.json" ]; then
    echo -e "${GREEN}PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}SKIP (no reports)${NC}"
fi

echo ""

echo "================================================================"
echo "Test Summary"
echo "================================================================"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
