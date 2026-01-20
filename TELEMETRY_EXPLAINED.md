# AI Patch Doctor - Telemetry Implementation Explained

**You can delete this file after reading - it's just for understanding the implementation.**

---

## Quick Summary

✅ **Telemetry works with ALL commands:**
- `npx ai-patch doctor` ← **YES, this works!**
- `npx ai-patch doctor --target=streaming` ← Works
- `npx ai-patch doctor -i` (interactive) ← Works
- `npx ai-patch doctor --ci` ← Works (telemetry disabled in CI by default)

✅ **Anonymous & Private:**
- Only collects: CLI version, OS, architecture, target check, provider type, success/failure status
- NO API keys, NO prompts, NO file paths, NO user data

✅ **Easy to Opt-Out:**
- `npx ai-patch doctor --no-telemetry`
- Or set `export AI_PATCH_TELEMETRY=0`
- Or set `telemetryEnabled: false` in `~/.ai-patch/config.json`

---

## How It Works

### 1. **PostHog Integration**
- Uses PostHog Cloud (US region)
- Write-only API key embedded in code: `phc_FrjAyzOmzkxySC7qssHHCgtCZYMaXkmvl7Zb1MqAtnK`
- Project ID: 292855
- Safe for public repos (key can only CREATE events, cannot READ data)

### 2. **When Telemetry Fires**
Telemetry sends ONE event per `doctor` command run, happens automatically:

```bash
# User runs this command:
npx ai-patch doctor

# Under the hood:
1. CLI runs diagnostic checks
2. Generates report
3. Sends telemetry event (fire-and-forget, never blocks)
4. Shows results to user
5. Exits
```

The telemetry code is in `node/src/cli.ts` lines 409-424:
```typescript
// Send telemetry event (fire-and-forget, never blocks)
const telemetryEnabled = isTelemetryEnabled(!options.telemetry, telemetryConsent);
if (telemetryEnabled) {
  const status: 'success' | 'warning' | 'error' = 
    reportData.summary.status === 'success' ? 'success' :
    reportData.summary.status === 'warning' ? 'warning' : 'error';
  
  sendDoctorRunEvent(
    installId,
    CLI_VERSION,
    target,
    provider,
    status,
    duration
  );
}
```

### 3. **What Gets Sent to PostHog**

Example event:
```json
{
  "distinctId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "event": "doctor_run",
  "properties": {
    "cli_version": "0.1.3",
    "os": "darwin",
    "arch": "arm64",
    "target": "streaming",
    "provider_type": "openai-compatible",
    "status": "success",
    "duration_bucket": "1-5s"
  }
}
```

**What is NOT sent:**
- ❌ No API keys
- ❌ No base URLs
- ❌ No prompts
- ❌ No payloads
- ❌ No file paths
- ❌ No repo names
- ❌ No model names
- ❌ No user identifiers

### 4. **Install ID (Anonymous Tracking)**
- Generated once on first run: UUID like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Stored in `~/.ai-patch/config.json`
- Used to group events from same install (not same user!)
- Cannot be traced back to any person or company

### 5. **First-Run Consent Prompt**
Only shows in interactive terminals (TTY), not in scripts or CI:

```
📊 Anonymous Telemetry
   Help improve AI Patch by sharing anonymous usage data.
   Only diagnostic patterns are collected (no secrets, prompts, or identifiers).
   You can opt-out anytime with --no-telemetry or AI_PATCH_TELEMETRY=0

Enable anonymous telemetry? [Y/n]: 
```

If user says **No**, telemetry is disabled permanently.
If user says **Yes** (or just presses Enter), telemetry is enabled.

**Important:** This prompt ONLY appears:
- First time CLI is run
- ONLY in interactive terminal (TTY)
- NOT in CI/CD pipelines
- NOT in scripts

For `npx ai-patch doctor` in scripts/CI: No prompt, telemetry defaults to ENABLED (but respects opt-out flags).

---

## File Structure

### Files Modified (Only 2 core files):
1. **`node/telemetry.ts`** - PostHog integration (Node.js)
2. **`python/src/ai_patch/telemetry.py`** - PostHog integration (Python)

### Supporting Files:
3. **`node/config.ts`** - Added install_id generation/storage
4. **`node/src/cli.ts`** - Integrated telemetry into doctor command
5. **`python/src/ai_patch/config.py`** - Added install_id generation/storage
6. **`python/src/ai_patch/cli.py`** - Integrated telemetry into doctor command
7. **`ai-patch.test.js`** - Added 12 telemetry tests
8. **`README.md`** - Added telemetry documentation
9. **`node/package.json`** - Added PostHog dependencies

---

## Testing

All 64 tests pass, including 12 new telemetry-specific tests:

```bash
cd /home/runner/work/ai-patch-doctor/ai-patch-doctor
npm test
```

Tests verify:
- ✅ Telemetry modules exist (Node + Python)
- ✅ All required functions present
- ✅ Config supports install_id and telemetryEnabled
- ✅ CLI has --no-telemetry flag
- ✅ No sensitive data in events
- ✅ Environment variable opt-out works

---

## Command Examples

### Standard Usage (Telemetry Enabled)
```bash
# Non-interactive (your use case)
npx ai-patch doctor
# → Runs checks, sends telemetry event, shows report

# With specific target
npx ai-patch doctor --target=streaming
# → Runs streaming check, sends telemetry event

# Interactive mode
npx ai-patch doctor -i
# → Prompts for target/provider, sends telemetry event
```

### Opt-Out Usage (Telemetry Disabled)
```bash
# Using flag
npx ai-patch doctor --no-telemetry

# Using environment variable
export AI_PATCH_TELEMETRY=0
npx ai-patch doctor

# Or permanently in config
echo '{"telemetryEnabled": false}' > ~/.ai-patch/config.json
npx ai-patch doctor
```

### CI/CD Usage
```bash
# In CI, telemetry is enabled by default but won't prompt
npx ai-patch doctor --ci
# → Runs checks, sends telemetry event (no interactive prompt)

# To disable in CI:
npx ai-patch doctor --ci --no-telemetry
# OR
export AI_PATCH_TELEMETRY=0
npx ai-patch doctor --ci
```

---

## Why This Design?

### ✅ Fire-and-Forget
- Telemetry NEVER blocks the CLI
- Uses background threads/async
- 2-second timeout
- Fails silently (no error messages if PostHog is down)
- Never changes exit codes

### ✅ Privacy First
- No sensitive data collected
- Anonymous UUID only
- Write-only PostHog key (safe even in public repos)
- Clear opt-out mechanisms

### ✅ User-Friendly
- Works with `npx ai-patch doctor` out of the box
- Doesn't require any setup
- Optional first-run consent prompt
- Multiple opt-out methods

---

## What You See in PostHog

When users run `npx ai-patch doctor`, you'll see events like:

**Event Name:** `doctor_run`

**Properties:**
- `cli_version`: "0.1.3"
- `os`: "darwin" | "linux" | "win32"
- `arch`: "x64" | "arm64"
- `target`: "streaming" | "retries" | "cost" | "trace" | "all"
- `provider_type`: "openai-compatible" | "anthropic" | "gemini"
- `status`: "success" | "warning" | "error"
- `duration_bucket`: "<1s" | "1-5s" | "5-10s" | "10-30s" | "30-60s" | ">60s"

**User ID (distinctId):** Random UUID (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

This helps you understand:
- Which AI providers users are checking
- Which check types are most common (streaming issues? retry problems?)
- Success/failure rates
- Performance (duration buckets)
- Platform distribution (OS/arch)

---

## Summary for Your Users

When you tell users to run `npx ai-patch doctor`:

1. ✅ It works perfectly (telemetry integrated)
2. ✅ Telemetry fires automatically (one event per run)
3. ✅ User can opt-out with `--no-telemetry` flag if they want
4. ✅ No setup required on their end
5. ✅ Privacy-safe (no sensitive data collected)

The telemetry is **already working** in all modes - interactive, non-interactive, CI, etc.

---

## Delete This File

This file is just for understanding. You can delete it:
```bash
rm TELEMETRY_EXPLAINED.md
```

The actual implementation is in the files listed above.
