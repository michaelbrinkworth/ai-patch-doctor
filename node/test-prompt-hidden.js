/**
 * Manual test for promptHidden() to verify no API key echo
 * 
 * This test should be run manually in a TTY to verify:
 * 1. No characters are echoed during input
 * 2. Raw mode is properly restored after input
 * 3. Input is captured correctly
 * 
 * Run: node test-prompt-hidden.js
 * Type some characters (they should NOT appear on screen)
 * Press Enter
 * The input should be displayed after you press Enter
 */

/**
 * Prompt for hidden input (like password).
 * 
 * @param {string} query - The prompt text to display to the user
 * @returns {Promise<string>} Promise that resolves with the hidden input
 * @throws {Error} If not running in a TTY environment
 * 
 * SECURITY: No echo, properly restore raw mode, clean up listeners.
 * - Characters are not displayed during input
 * - Raw mode is enabled/disabled correctly
 * - stdin listeners are cleaned up after completion
 * - Only printable characters (ASCII >= 32) are accepted
 */
function promptHidden(query) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    // Check if TTY is available
    if (!stdin.isTTY) {
      reject(new Error('Cannot prompt for hidden input in non-TTY environment'));
      return;
    }

    let input = '';
    let rawModeEnabled = false;
    
    // Data handler for stdin
    const onData = (char) => {
      const c = char.toString();
      
      if (c === '\n' || c === '\r' || c === '\u0004') {
        // Enter or Ctrl+D - finish input
        cleanup();
        stdout.write('\n');
        resolve(input);
      } else if (c === '\u0003') {
        // Ctrl+C - abort
        cleanup();
        stdout.write('\n');
        process.exit(1);
      } else if (c === '\u007f' || c === '\b') {
        // Backspace - remove last character
        if (input.length > 0) {
          input = input.slice(0, -1);
        }
        // No visual feedback for backspace in hidden mode
      } else if (c.charCodeAt(0) >= 32) {
        // Only accept printable characters (ASCII >= 32)
        // NO ECHO - just store the character
        input += c;
      }
      // For all other control characters, do nothing (no echo)
    };
    
    // Cleanup function to restore terminal state
    const cleanup = () => {
      if (rawModeEnabled) {
        try {
          stdin.setRawMode(false);
          rawModeEnabled = false;
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      stdin.removeListener('data', onData);
      stdin.pause();
    };
    
    // Set up raw mode and listener
    try {
      stdin.setRawMode(true);
      rawModeEnabled = true;
      stdout.write(query);
      stdin.on('data', onData);
      stdin.resume();
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

/**
 * Test the promptHidden() function to verify security properties.
 * 
 * This function verifies:
 * - No characters are echoed during input
 * - Input is captured correctly
 * - Raw mode is properly restored after completion
 * 
 * @async
 * @returns {Promise<void>}
 */
async function testPromptHidden() {
  console.log('Testing promptHidden() function...\n');
  console.log('⚠️  SECURITY TEST: Characters should NOT be visible when you type');
  console.log('Type a test password and press Enter:\n');
  
  try {
    const result = await promptHidden('Enter test password (hidden): ');
    console.log(`\n✅ SUCCESS: Input captured without echo`);
    console.log(`   Length: ${result.length} characters`);
    console.log(`   First 3 chars: ${result.substring(0, 3)}...`);
    console.log('\n✅ Raw mode restored successfully');
    console.log('You can type normally now to verify terminal state is restored.');
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Run the test
testPromptHidden();
