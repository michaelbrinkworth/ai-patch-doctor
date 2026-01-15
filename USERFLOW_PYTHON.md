# Python User Flow - Step by Step (80 Steps)

**AI Patch Doctor - Python Edition**

This document describes the complete user flow when running `pipx run ai-patch doctor` (Python version) in interactive mode.

---

## User Flow: Interactive Diagnosis

### Phase 1: Initialization (Steps 1-5)

**Step 1:** User executes command in terminal
```bash
pipx run ai-patch doctor
```

**Step 2:** Python interpreter loads the CLI entry point (`python/src/ai_patch/cli.py`)

**Step 3:** Click framework initializes and parses the command, identifying `doctor` as the invoked command

**Step 4:** CLI displays welcome message via `click.echo()`
```
🔍 AI Patch Doctor - Interactive Mode
```

**Step 5:** System prepares Click's interactive prompt infrastructure

---

### Phase 2: Target Selection (Steps 6-12)

**Step 6:** CLI displays the first question
```
What's failing?
```

**Step 7:** CLI displays option menu
```
  1. streaming / SSE stalls / partial output
  2. retries / 429 / rate-limit chaos
  3. cost spikes
  4. traceability (request IDs, duplicates)
  5. prod-only issues (all checks)
```

**Step 8:** CLI prompts for user selection using `click.prompt()` with default value of 5
```
Select [5]:
```

**Step 9:** User types selection (e.g., `1`) and presses Enter

**Step 10:** Click validates input as integer type

**Step 11:** CLI maps user selection to target name using dictionary
- `1` → `streaming`
- `2` → `retries`
- `3` → `cost`
- `4` → `trace`
- `5` or default → `all`

**Step 12:** Target is stored in variable (e.g., `target = 'streaming'`)

---

### Phase 3: Provider Selection (Steps 13-18)

**Step 13:** CLI displays second question with newline
```

What do you use?
```

**Step 14:** CLI displays provider options
```
  1. openai-compatible (default)
  2. anthropic
  3. gemini
```

**Step 15:** CLI prompts for provider selection using `click.prompt()` with default value of 1
```
Select [1]:
```

**Step 16:** User types selection (e.g., `1`) and presses Enter

**Step 17:** CLI maps provider choice to provider name using dictionary
- `1` or default → `openai-compatible`
- `2` → `anthropic`
- `3` → `gemini`

**Step 18:** Provider name is stored in variable (e.g., `provider = 'openai-compatible'`)

---

### Phase 4: Configuration Detection (Steps 19-24)

**Step 19:** System calls `load_saved_config()` to check for saved configuration in `~/.ai-patch/config.json`

**Step 20:** System calls `Config.auto_detect(provider)` to detect configuration from environment variables
- Checks `OPENAI_API_KEY` for openai-compatible
- Checks `ANTHROPIC_API_KEY` for anthropic  
- Checks `GEMINI_API_KEY` for gemini
- Checks `OPENAI_BASE_URL` or uses default URLs

**Step 21:** If saved config exists (returned as dict), merge it with auto-detected config
- Saved `apiKey` fills missing `config.api_key`
- Saved `baseUrl` fills missing `config.base_url`

**Step 22:** System validates configuration by calling `config.is_valid()`
- Checks if `api_key` attribute is present and non-empty
- Checks if `base_url` attribute is present and non-empty

**Step 23:** If configuration is valid (returns True), skip to Step 33

**Step 24:** If configuration is invalid (returns False), proceed to configuration prompting

---

### Phase 5: Configuration Prompting (Steps 25-32)

**Step 25:** CLI displays configuration header using `click.echo()`
```

⚙️  Configuration needed

```

**Step 26:** If API key is missing, CLI prompts with hidden input using `getpass.getpass()`
```
API key not found. Paste your API key (input will be hidden):
```

**Step 27:** Terminal switches to no-echo mode to hide user input

**Step 28:** User types API key (not displayed on screen), presses Enter

**Step 29:** System stores API key in config object: `config.api_key = prompted_api_key`

**Step 30:** If base URL is missing, determine default URL based on provider
- anthropic → `https://api.anthropic.com`
- gemini → `https://generativelanguage.googleapis.com`
- default → `https://api.openai.com`

**Step 31:** CLI prompts for URL using `click.prompt()` with default
```
API URL? (Enter for https://api.openai.com) [https://api.openai.com]:
```

**Step 32:** User presses Enter to accept default or types custom URL; stored in `config.base_url`

---

### Phase 6: Configuration Saving (Steps 33-37)

**Step 33:** If any configuration was prompted, CLI asks to save using `click.prompt()`
```
Save for next time? (y/N) [n]:
```

**Step 34:** User types `y` and presses Enter (or `n` to skip)

**Step 35:** If user entered `y`, system calls `save_config()` which:
- Creates directory `~/.ai-patch/` using `os.makedirs()` if it doesn't exist
- Serializes config to JSON dictionary
- Writes to `~/.ai-patch/config.json` using `json.dump()`

**Step 36:** CLI displays confirmation via `click.echo()`
```
✓ Configuration saved to ~/.ai-patch/config.json

```

**Step 37:** Configuration prompting phase completes

---

### Phase 7: Validation & Preparation (Steps 38-40)

**Step 38:** System performs final validation with `config.is_valid()`
- If still invalid, displays error and calls `sys.exit(1)`

**Step 39:** CLI displays detection confirmation
```

✓ Detected: https://api.openai.com
✓ Provider: openai-compatible
```

**Step 40:** CLI displays check start message
```

🔬 Running streaming checks...

```

---

### Phase 8: Check Execution (Steps 41-47)

**Step 41:** System records start time using `time.time()`

**Step 42:** System calls `run_checks(target, config, provider)` function

**Step 43:** Function determines which checks to run based on target
- For `all` or `prod`: creates list `['streaming', 'retries', 'cost', 'trace']`
- Otherwise: creates single-item list with specified target

**Step 44:** Function iterates through targets list, executing each check

**Step 45:** For each check, system imports and calls the corresponding check module
- `streaming.check(config)` from `checks.streaming`
- `retries.check(config)` from `checks.retries`
- `cost.check(config)` from `checks.cost`
- `trace.check(config)` from `checks.trace`

**Step 46:** Each check function performs its diagnostic logic and returns a dict containing:
- `status`: 'pass' | 'warn' | 'fail' | 'skipped'
- `findings`: List of finding dicts with severity and message
- `metrics`: Optional metrics dict

**Step 47:** All check results are collected into `results` dictionary keyed by check name

---

### Phase 9: Duration & Report Creation (Steps 48-54)

**Step 48:** System calculates total duration: `time.time() - start_time`

**Step 49:** System creates `ReportGenerator` instance from `report` module

**Step 50:** Generator calls `create_report(target, provider, base_url, results, duration)` which:
- Creates report structure as Python dict
- Includes metadata with timestamp, target, provider
- Adds summary section with status and next_step
- Includes all check results and findings arrays

**Step 51:** System calls `save_report(report_data)` function

**Step 52:** Function generates timestamp using `datetime.now().strftime("%Y%m%d-%H%M%S")`

**Step 53:** System creates report directory path using `Path` objects
```python
Path.cwd() / "ai-patch-reports" / timestamp
```

**Step 54:** System creates directory with `report_dir.mkdir(parents=True, exist_ok=True)`

---

### Phase 10: Report File Generation (Steps 55-60)

**Step 55:** System creates JSON report path: `report_dir / "report.json"`

**Step 56:** Function opens file and writes JSON with `json.dump(report_data, f, indent=2)`

**Step 57:** System creates Markdown report path: `report_dir / "report.md"`

**Step 58:** Generator calls `generate_markdown(report_data)` which:
- Formats report as Markdown string
- Includes headers, tables, and bullet points
- Adds timestamp and status badges
- Lists all findings and recommendations

**Step 59:** Function opens file and writes markdown content

**Step 60:** Function returns `report_dir` Path object

---

### Phase 11: Display Summary (Steps 61-68)

**Step 61:** CLI calls `display_summary(report_data, report_dir)` function

**Step 62:** Function extracts status from `report_data['summary']['status']`

**Step 63:** Function creates status emoji mapping dict
- `success` → '✅'
- `warning` → '⚠️'
- `error` → '❌'

**Step 64:** CLI displays status banner using `click.echo()`
```

✅ SUCCESS
```

**Step 65:** CLI displays report location using relative path
```

📊 Report saved: ai-patch-reports/20260115-113411
```

**Step 66:** CLI displays next step from summary
```

→ Next: Review report.md for detailed findings
```

**Step 67:** New line is printed

**Step 68:** If status is not `success`, CLI displays Badgr promotional message
```
💡 This kind of issue is hard to debug after the fact.
AI Badgr keeps a per-request receipt (latency, retries, cost) for real traffic.

```

---

### Phase 12: Completion & Exit (Steps 69-80)

**Step 69:** CLI displays footer message
```
Generated by AI Patch — re-run: pipx run ai-patch
```

**Step 70:** Function returns control to main `doctor()` function

**Step 71:** Main function checks report status: `report_data['summary']['status']`

**Step 72:** If status equals `'success'`, calls `sys.exit(0)`

**Step 73:** If status is not success, calls `sys.exit(1)`

**Step 74:** Python interpreter begins shutdown sequence

**Step 75:** Exit code is passed to operating system

**Step 76:** Terminal displays return status

**Step 77:** Shell prompt returns to user

**Step 78:** Report files are persisted in `ai-patch-reports/` directory

**Step 79:** User can access reports using file browser or text editor

**Step 80:** User can re-run command with saved configuration (skips prompts)

---

## Summary

The Python version provides a complete interactive diagnostic flow that:
1. Guides users through simple 2-question setup using Click framework
2. Auto-detects or prompts for API configuration with secure input handling
3. Executes targeted diagnostic checks using shared check modules
4. Generates comprehensive reports in JSON and Markdown formats
5. Provides clear next steps and actionable recommendations
6. Persists configuration for future runs

Total execution time: typically 5-30 seconds depending on checks selected.

## Key Differences from Node.js Version

While functionality is identical, implementation differs:
- **Prompting**: Uses Click framework vs Commander.js + readline
- **Hidden Input**: Uses `getpass.getpass()` vs raw mode stdin
- **Path Handling**: Uses `pathlib.Path` vs Node's `path` module
- **File I/O**: Uses Python's `open()` and `json` vs Node's `fs` module
- **Type System**: Python duck typing vs TypeScript interfaces
- **Exit Codes**: `sys.exit()` vs `process.exit()`

Both versions maintain identical user experience and diagnostic capabilities.
