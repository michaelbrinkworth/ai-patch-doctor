# AI Patch Doctor - User Flow Documentation

This document provides detailed mini-steps for how the user flow works in AI Patch Doctor for both Node.js and Python implementations.

---

## 40 Node.js Mini Steps

### Step 1: User Invokes CLI
User runs `npx ai-patch doctor` or `ai-patch doctor` if installed globally.

### Step 2: Parse Command Line Arguments
Commander.js parses arguments including `--target`, `-i/--interactive`, `--ci`, `--provider`, `--model`, `--save`, `--save-key`, `--force`.

### Step 3: Check TTY Status
System checks if `process.stdin.isTTY` and `process.stdout.isTTY` to determine if running in a terminal.

### Step 4: Determine Prompting Mode
`shouldPrompt()` function evaluates if interactive prompts are allowed based on `--interactive` flag, `--ci` flag, and TTY status.

### Step 5: Validate Force Flag
If `--save-key` is provided without `--force`, exit with error code 2 and message.

### Step 6: Display Welcome Message
If interactive mode, display "🔍 AI Patch Doctor - Interactive Mode".

### Step 7: Check Target Parameter
Check if `--target` parameter was provided on command line.

### Step 8: Interactive Target Selection (if allowed)
If no target and interactive mode, display menu with 5 options: streaming, retries, cost, traceability, all checks.

### Step 9: Prompt for Target Choice
Use readline to prompt "Select [1-5, default: 5]:" and read user input.

### Step 10: Map Target Choice
Map numeric choice (1-5) to target string using `targetMap`: 1→streaming, 2→retries, 3→cost, 4→trace, 5→all.

### Step 11: Default Target Assignment
If non-interactive mode and no target specified, default to 'all'.

### Step 12: Auto-Detect Provider
Call `autoDetectProvider()` with provider flag and canPrompt status.

### Step 13: Check Environment Variables
Look for `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` in environment.

### Step 14: Detect Provider from Keys
Determine provider based on which API key environment variables exist.

### Step 15: Handle Missing Keys Warning
If no keys found and non-interactive, display error and exit with code 2.

### Step 16: Interactive Provider Selection (if needed)
If no provider specified and interactive mode, display provider menu with 3 options.

### Step 17: Prompt for Provider Choice
Use readline to prompt "Select [1-3, default: 1]:" for provider selection.

### Step 18: Map Provider Choice
Map numeric choice to provider string: 1→openai-compatible, 2→anthropic, 3→gemini.

### Step 19: Load Saved Configuration
Call `loadSavedConfig()` to read previously saved config from `~/.ai-patch/config.json`.

### Step 20: Auto-Detect Configuration
Call `Config.autoDetect(provider)` to create config from environment variables.

### Step 21: Override with Model Parameter
If `--model` flag provided, override `config.model` with specified value.

### Step 22: Merge Saved Config
If saved config exists, fill in missing apiKey and baseUrl from saved values.

### Step 23: Validate Configuration
Call `config.isValid()` to check if apiKey and baseUrl are present.

### Step 24: Handle Invalid Config (Non-Interactive)
If invalid and non-interactive, call `config.getMissingVars()`, display error, and exit with code 2.

### Step 25: Prompt for Missing API Key
If missing API key in interactive mode, use `promptHidden()` to securely read API key without displaying it.

### Step 26: Handle Hidden Input
Raw mode enabled on stdin, characters read one by one, backspace handled, no echo to terminal.

### Step 27: Auto-Fill Missing Base URL
If missing base URL, automatically set it based on provider (api.openai.com, api.anthropic.com, or generativelanguage.googleapis.com). No prompt required.

### Step 28: Final Configuration Validation
Check if config is valid after prompting, exit with code 2 if still invalid.

### Step 29: Display Configuration Summary
Show detected base URL and provider with checkmarks: "✓ Detected: [url]" and "✓ Provider: [name]".

### Step 30: Display Check Start Message
Show "🔬 Running [target] checks..." message to user.

### Step 31: Record Start Time
Capture `Date.now()` to track total execution duration.

### Step 32: Execute Checks
Call `runChecks()` with target, config, and provider to run diagnostic checks.

### Step 33: Determine Targets to Run
If target is 'all' or 'prod', set targetsToRun to ['streaming', 'retries', 'cost', 'trace'], otherwise use single target.

### Step 34: Execute Individual Checks
Loop through targets, calling `checkStreaming()`, `checkRetries()`, `checkCost()`, or `checkTrace()` as needed.

### Step 35: Collect Check Results
Each check returns status ('pass', 'warn', 'fail', 'skipped') and findings array with severity, message, and details.

### Step 36: Calculate Duration
Compute duration in seconds: `(Date.now() - startTime) / 1000`.

### Step 37: Generate Report Data
Create `ReportGenerator` instance and call `createReport()` with target, provider, baseUrl, results, and duration.

### Step 38: Save Report to Disk
Create timestamped directory, write JSON and Markdown reports, create 'latest' pointer.

### Step 39: Print Inline Diagnosis
Call `printDiagnosis()` to display status, top 5 findings sorted by severity, and next steps.

### Step 40: Exit with Status Code
Exit with code 0 for success, 1 for diagnostic failures, or 2 for configuration errors.

---

## 40 Python Mini Steps

### Step 1: User Invokes CLI
User runs `pipx run ai-patch doctor` or `ai-patch doctor` if installed via pip.

### Step 2: Parse Command Line Arguments
Click parses arguments including `--target`, `-i/--interactive`, `--ci`, `--provider`, `--model`, `--save`, `--save-key`, `--force`.

### Step 3: Check TTY Status
System checks if `sys.stdin.isatty()` and `sys.stdout.isatty()` to determine terminal context.

### Step 4: Determine Prompting Mode
`should_prompt()` function evaluates if interactive prompts are allowed based on flags and TTY status.

### Step 5: Validate Force Flag
If `--save-key` is provided without `--force`, display error via `click.echo()` and exit with code 2.

### Step 6: Display Welcome Message
If interactive mode, use `click.echo()` to display "🔍 AI Patch Doctor - Interactive Mode".

### Step 7: Check Target Parameter
Check if `--target` parameter was provided via Click option.

### Step 8: Interactive Target Selection (if allowed)
If no target and interactive mode, display menu using `click.echo()` with 5 options.

### Step 9: Prompt for Target Choice
Use `click.prompt()` with type=int and default=5 to read user selection.

### Step 10: Map Target Choice
Use `target_map` dictionary to convert numeric choice (1-5) to target string.

### Step 11: Default Target Assignment
If non-interactive mode and no target specified, assign 'all' as default.

### Step 12: Auto-Detect Provider
Call `auto_detect_provider()` function with provider_flag and can_prompt parameters.

### Step 13: Check Environment Variables
Scan `os.environ` for `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`.

### Step 14: Detect Provider from Keys
Return detected provider, available keys, selected key name, and any warnings.

### Step 15: Handle Missing Keys Warning
If warning exists and non-interactive mode, display error message and exit with code 2.

### Step 16: Interactive Provider Selection (if needed)
If no provider specified and interactive mode, display provider menu via `click.echo()`.

### Step 17: Prompt for Provider Choice
Use `click.prompt()` with type=int and default=1 for provider selection.

### Step 18: Map Provider Choice
Use `provider_map` dictionary: 1→openai-compatible, 2→anthropic, 3→gemini.

### Step 19: Load Saved Configuration
Call `load_saved_config()` to read from `~/.ai-patch/config.json` using Path and json.

### Step 20: Auto-Detect Configuration
Call `Config.auto_detect(provider)` class method to create config from environment.

### Step 21: Override with Model Parameter
If `--model` flag provided, set `config.model` to specified value.

### Step 22: Merge Saved Config
If `saved_config` dict exists, populate missing `config.api_key` and `config.base_url`.

### Step 23: Validate Configuration
Call `config.is_valid()` method to verify required fields are present.

### Step 24: Handle Invalid Config (Non-Interactive)
If invalid and non-interactive, call `config.get_missing_vars()`, display error, and `sys.exit(2)`.

### Step 25: Prompt for Missing API Key
If missing API key in interactive mode, use `getpass.getpass()` for secure hidden input.

### Step 26: Handle Hidden Input
Getpass module reads password without echoing characters to terminal.

### Step 27: Auto-Fill Missing Base URL
If missing base URL, automatically set it based on provider. No prompt required - uses provider-specific default URL.

### Step 28: Final Configuration Validation
Check `config.is_valid()` after prompting, call `sys.exit(2)` if still invalid.

### Step 29: Display Configuration Summary
Use `click.echo()` to show detected base URL and provider with checkmarks.

### Step 30: Display Check Start Message
Show "🔬 Running [target] checks..." using f-string formatting.

### Step 31: Record Start Time
Capture `time.time()` to track total execution duration.

### Step 32: Execute Checks
Call `run_checks()` function passing target, config, and provider.

### Step 33: Determine Targets to Run
If target is 'all' or 'prod', create list ['streaming', 'retries', 'cost', 'trace'], else single-item list.

### Step 34: Execute Individual Checks
Loop through targets, calling `streaming.check()`, `retries.check()`, `cost.check()`, or `trace.check()`.

### Step 35: Collect Check Results
Each check returns dict with 'status' and 'findings' containing severity, message, and details.

### Step 36: Calculate Duration
Compute duration in seconds: `time.time() - start_time`.

### Step 37: Generate Report Data
Create `ReportGenerator` instance and call `create_report()` method with all diagnostic data.

### Step 38: Save Report to Disk
Create timestamped directory using strftime, write JSON and Markdown reports, create 'latest' pointer.

### Step 39: Print Inline Diagnosis
Call `print_diagnosis()` to display status, top 5 findings sorted by severity, and next steps.

### Step 40: Exit with Status Code
Exit with code 0 for success, 1 for diagnostic failures, or 2 for configuration errors using `sys.exit()`.

---

## Additional Commands

Both implementations support additional commands beyond the main `doctor` command:

### Apply Command
- Reads latest report
- Shows suggested fixes
- Applies changes only with `--safe` flag
- Default dry-run mode

### Test Command
- Requires `--target` parameter
- Runs single diagnostic check
- Exits 0 on pass, 1 on fail
- Displays findings on failure

### Diagnose Command
- Deep diagnosis mode
- Optional `--with-badgr` flag
- Falls back to standard checks
- Placeholder for Badgr proxy integration

### Share Command
- Creates redacted share bundle
- Finds latest report
- Generates zip bundle
- Default redaction enabled

### Revert Command
- Undoes applied changes
- Placeholder for revert logic
- Safe rollback mechanism

---

## Interactive vs Non-Interactive Flow

### Interactive Mode (`-i` flag)
1. Requires TTY (terminal)
2. Prompts for missing configuration
3. Displays selection menus
4. Accepts user input for target and provider
5. Shows warnings but continues
6. Allows manual API key entry

### Non-Interactive Mode (default / frictionless mode)
1. No preference menus (target, provider)
2. Allows essential prompts (API key) if TTY available
3. Exits immediately on missing config if no TTY
4. Uses defaults where possible
5. All config from environment, flags, or essential prompts
6. Suitable for terminal use with minimal friction

### CI Mode (`--ci` flag)
1. Explicitly disables all prompts (including essential prompts)
2. Strict validation
3. Clear error messages
4. Exit code 2 for configuration errors
5. Exit code 1 for diagnostic failures
6. Exit code 0 only on complete success
7. Suitable for CI/CD pipelines with fail-fast behavior

---

## Configuration Sources Priority

1. **Command-line flags** (highest priority)
   - `--provider`, `--model`
2. **Environment variables**
   - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
   - `OPENAI_BASE_URL`, etc.
3. **Saved configuration**
   - `~/.ai-patch/config.json`
4. **Interactive prompts** (lowest priority)
   - Only when `-i` flag and TTY available
5. **Defaults**
   - provider: openai-compatible
   - target: all
   - base URLs: standard API endpoints

---

## Report Generation Flow

### JSON Report Structure
```json
{
  "summary": {
    "status": "success|warning|error",
    "next_step": "string",
    "total_issues": 0
  },
  "checks": {
    "streaming": { "status": "pass", "findings": [] },
    "retries": { "status": "pass", "findings": [] },
    "cost": { "status": "pass", "findings": [] },
    "trace": { "status": "pass", "findings": [] }
  },
  "metadata": {
    "timestamp": "ISO8601",
    "duration": 1.23,
    "provider": "openai-compatible",
    "base_url": "https://api.openai.com"
  }
}
```

### Markdown Report
- Formatted for human readability
- Includes severity badges
- Lists all findings with details
- Provides fix recommendations
- Shows configuration summary

---

## Error Handling Strategy

### Exit Codes
- **0**: Success - all checks passed
- **1**: Failure - diagnostic issues found
- **2**: Configuration error - missing required config

### Error Messages
- Clear, actionable messages
- Include fix suggestions
- Reference specific environment variables
- Guide user to next steps

### TTY Detection Errors
- Specific message when `-i` used without TTY
- Suggests running without `-i` flag
- Or running in actual terminal

---

This userflow documentation ensures developers understand exactly how users interact with AI Patch Doctor at each step of the process.
