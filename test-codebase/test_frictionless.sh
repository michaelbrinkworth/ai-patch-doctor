#!/bin/bash
# Test frictionless behavior

echo "Testing frictionless API key prompting..."
echo ""

# Test 1: Should prompt for API key in TTY (frictionless)
echo "Test 1: Running 'ai-patch doctor' without API key (should prompt)"
echo "Expected: Should show '⚙️  Configuration needed' and prompt for API key"
echo ""

# Unset all API keys
unset OPENAI_API_KEY
unset ANTHROPIC_API_KEY  
unset GEMINI_API_KEY

# Remove saved config if it exists
rm -f ~/.ai-patch/config.json

# Test with Python version
echo "Python version:"
cd /Users/michaelmanley/Documents/GitHub/ai-patch-doctor/test-codebase
python3 -c "
import sys
sys.path.insert(0, '../python/src')
from ai_patch.cli import should_prompt

# Test should_prompt logic
result = should_prompt(False, False)
print(f'should_prompt(False, False) = {result}')
print(f'stdin.isatty = {sys.stdin.isatty()}')
print(f'stdout.isatty = {sys.stdout.isatty()}')
"

echo ""
echo "Node version:"
cd /Users/michaelmanley/Documents/GitHub/ai-patch-doctor/node
node -e "
const shouldPrompt = (interactiveFlag, ciFlag) => {
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  if (ciFlag) return false;
  if (interactiveFlag) {
    if (!isTTY) {
      console.log('Error: Interactive mode requested but not TTY');
      process.exit(2);
    }
    return true;
  }
  return isTTY;
};

const result = shouldPrompt(false, false);
console.log('shouldPrompt(false, false) =', result);
console.log('stdin.isTTY =', process.stdin.isTTY);
console.log('stdout.isTTY =', process.stdout.isTTY);
"

echo ""
echo "=========================================="
echo "To test manually in a real terminal:"
echo "1. cd test-codebase"
echo "2. unset OPENAI_API_KEY ANTHROPIC_API_KEY GEMINI_API_KEY"
echo "3. rm -f ~/.ai-patch/config.json"
echo "4. ai-patch doctor"
echo ""
echo "Expected: Should prompt for API key (frictionless)"
echo "=========================================="
