# Node.js User Flow - Step by Step (70 Steps)

**AI Patch Doctor - Node.js Edition**

This document describes the complete user flow when running `npx ai-patch doctor` (Node.js version) in interactive mode.

---

## User Flow: Interactive Diagnosis

### Phase 1: Initialization (Steps 1-5)

**Step 1:** User executes command in terminal
```bash
npx ai-patch doctor
```

**Step 2:** Node.js runtime loads the CLI entry point (`node/src/cli.ts`)

**Step 3:** Commander.js parses the command and identifies `doctor` as the default command

**Step 4:** CLI displays welcome message
```
🔍 AI Patch Doctor - Interactive Mode
```

**Step 5:** System creates readline interface for interactive input

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

**Step 8:** CLI prompts for user selection
```
Select [1-5, default: 5]:
```

**Step 9:** User types selection (e.g., `1`) and presses Enter

**Step 10:** System reads user input from stdin

**Step 11:** CLI maps user selection to target name
- `1` → `streaming`
- `2` → `retries`
- `3` → `cost`
- `4` → `trace`
- `5` or empty → `all`

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

**Step 15:** CLI prompts for provider selection
```
Select [1-3, default: 1]:
```

**Step 16:** User types selection (e.g., `1`) and presses Enter

**Step 17:** CLI maps provider choice to provider name
- `1` or empty → `openai-compatible`
- `2` → `anthropic`
- `3` → `gemini`

**Step 18:** Readline interface closes to end interactive prompts

---

### Phase 4: Configuration Detection (Steps 19-24)

**Step 19:** System calls `loadSavedConfig()` to check for saved configuration in `~/.ai-patch/config.json`

**Step 20:** System calls `Config.autoDetect(provider)` to detect configuration from environment variables
- Checks `OPENAI_API_KEY` for openai-compatible
- Checks `ANTHROPIC_API_KEY` for anthropic
- Checks `GEMINI_API_KEY` for gemini
- Checks `OPENAI_BASE_URL` or uses default URLs

**Step 21:** If saved config exists, merge it with auto-detected config (prioritizing environment variables)

**Step 22:** System validates configuration by calling `config.isValid()`
- Checks if `apiKey` is present
- Checks if `baseUrl` is present

**Step 23:** If configuration is valid, skip to Step 27

**Step 24:** If configuration is invalid, proceed to configuration prompting

---

### Phase 5: Configuration Prompting (Steps 25-32)

**Step 25:** CLI displays configuration header
```

⚙️  Configuration needed

```

**Step 26:** If API key is missing, CLI prompts with hidden input
```
API key not found. Paste your API key (input will be hidden):
```

**Step 27:** System enables raw mode on stdin to hide user input

**Step 28:** User types API key (displayed as hidden), presses Enter

**Step 29:** System stores API key in config object and disables raw mode

**Step 30:** If base URL is missing, CLI prompts with default
```
API URL? (Enter for https://api.openai.com):
```

**Step 31:** User presses Enter to accept default or types custom URL

**Step 32:** CLI asks to save configuration
```
Save for next time? (y/N):
```

---

### Phase 6: Configuration Saving (Steps 33-35)

**Step 33:** User types `y` and presses Enter (or `n` to skip)

**Step 34:** If `y`, system calls `saveConfig()` which:
- Creates directory `~/.ai-patch/` if it doesn't exist
- Writes config to `~/.ai-patch/config.json` with API key and base URL

**Step 35:** CLI displays confirmation
```
✓ Configuration saved to ~/.ai-patch/config.json

```

---

### Phase 7: Check Preparation (Steps 36-38)

**Step 36:** System validates final configuration with `config.isValid()`
- If invalid, displays error and exits with code 1

**Step 37:** CLI displays detection confirmation
```

✓ Detected: https://api.openai.com
✓ Provider: openai-compatible
```

**Step 38:** CLI displays check start message
```

🔬 Running streaming checks...

```

---

### Phase 8: Check Execution (Steps 39-45)

**Step 39:** System records start time with `Date.now()`

**Step 40:** System calls `runChecks(target, config, provider)` function

**Step 41:** Function determines which checks to run based on target
- For `all` or `prod`: runs all four checks
- Otherwise: runs single specified check

**Step 42:** For each check, system imports and executes the corresponding check module
- `checkStreaming(config)` from `../checks/streaming`
- `checkRetries(config)` from `../checks/retries`
- `checkCost(config)` from `../checks/cost`
- `checkTrace(config)` from `../checks/trace`

**Step 43:** Each check function performs its diagnostic logic and returns a result object containing:
- `status`: 'pass' | 'warn' | 'fail' | 'skipped'
- `findings`: Array of finding objects with severity and message
- `metrics`: Optional metrics data

**Step 44:** All check results are collected into a `results` object keyed by check name

**Step 45:** System calculates total duration: `(Date.now() - startTime) / 1000`

---

### Phase 9: Report Generation (Steps 46-51)

**Step 46:** System creates `ReportGenerator` instance

**Step 47:** Generator calls `createReport(target, provider, baseUrl, results, duration)` which:
- Structures report data with metadata
- Includes timestamp, target, provider
- Adds summary with status and next steps
- Includes all check results and findings

**Step 48:** System generates timestamp for report directory name
```typescript
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
```

**Step 49:** System creates report directory path
```
./ai-patch-reports/2026-01-15T11-34-11
```

**Step 50:** System creates directory with `fs.mkdirSync(reportDir, { recursive: true })`

**Step 51:** System saves JSON report to `report.json` in report directory

---

### Phase 10: Report Finalization (Steps 52-60)

**Step 52:** System calls `reportGen.generateMarkdown(reportData)` to create markdown version

**Step 53:** Markdown generator formats report with:
- Header with timestamp and status
- Target and provider information
- Summary of findings
- Detailed results for each check
- Recommended actions

**Step 54:** System writes markdown content to `report.md` in report directory

**Step 55:** Report directory path is returned to main function

**Step 56:** CLI calls `displaySummary(reportData, reportDir)` function

**Step 57:** System extracts status from report summary

**Step 58:** System maps status to emoji
- `success` → ✅
- `warning` → ⚠️
- `error` → ❌

**Step 59:** CLI displays status banner
```

✅ SUCCESS
```

**Step 60:** CLI displays report location
```

📊 Report saved: ai-patch-reports/2026-01-15T11-34-11
```

---

### Phase 11: Summary & Exit (Steps 61-70)

**Step 61:** CLI displays next step recommendation
```

→ Next: Review report.md for detailed findings
```

**Step 62:** If status is not `success`, CLI displays Badgr promotional message
```

💡 This kind of issue is hard to debug after the fact.
AI Badgr keeps a per-request receipt (latency, retries, cost) for real traffic.

```

**Step 63:** CLI displays footer message
```
Generated by AI Patch — re-run: npx ai-patch
```

**Step 64:** System checks final status from report

**Step 65:** If status is `success`, process exits with code 0

**Step 66:** If status is not `success`, process exits with code 1

**Step 67:** Operating system receives exit code

**Step 68:** Terminal returns control to user

**Step 69:** User can view reports in `ai-patch-reports/` directory

**Step 70:** User can open `report.md` or `report.json` to see detailed findings

---

## Summary

The Node.js version provides a complete interactive diagnostic flow that:
1. Guides users through simple 2-question setup
2. Auto-detects or prompts for API configuration
3. Executes targeted diagnostic checks
4. Generates comprehensive reports in JSON and Markdown formats
5. Provides clear next steps and actionable recommendations

Total execution time: typically 5-30 seconds depending on checks selected.
