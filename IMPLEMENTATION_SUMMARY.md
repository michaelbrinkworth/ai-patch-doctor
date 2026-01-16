# AI Patch Doctor - Security & Conversion Improvements

## Summary of Changes

This PR implements the required safety and conversion improvements to AI Patch Doctor, ensuring API keys never leak and providing clear, actionable guidance to users when issues are detected.

## Implementation Details

### 1. API Key Security (Ship Blocker) ✅

**Requirement**: Ensure API keys never appear anywhere - not in terminal output, prompts, logs, reports, exceptions, saved files, or stack traces.

**Implementation**:

#### Report Sanitization
- Added `sanitizeReportData()` (Node) and `sanitize_report_data()` (Python) functions
- Deep recursive sanitization removes any fields containing: `apiKey`, `api_key`, `key`, `secret`, `token`, `password`, `authorization`
- Applied before writing any JSON or Markdown reports

#### Safe Prompting
- **Node**: Uses `setRawMode(true)` with no echo for hidden input
- **Python**: Enhanced `getpass` with `GetPassWarning` detection - exits with code 2 if echo cannot be disabled
- TTY capability checked before prompting
- Non-TTY environments with missing keys: exit code 2 with instructions to set env var

#### Code Review
- No `console.log()` or `click.echo()` statements print config objects
- Error messages use `error.message` only (no full error object serialization)
- Report generation receives only `baseUrl`, never the API key

**Verification**: 
- Tested with marker strings - confirmed keys never appear in stdout/stderr or saved reports
- Exit code 2 correctly triggered in non-TTY scenarios

### 2. Badgr Copy/Paste Block (Conversion) ✅

**Requirement**: When status != success, show clear instructions that route users to Badgr.

**Implementation**:

Modified `displaySummary()` in both Node and Python to show:

```
============================================================

What I found: [streaming] Streaming check failed: ...

What I can't see: retry behavior, partial streams, concurrency

Run one request through Badgr gateway (copy/paste):

export OPENAI_BASE_URL="https://gateway.badgr.dev"
# Make one API call here (your code)
export OPENAI_BASE_URL="https://api.openai.com"

============================================================
```

**Features**:
- Shows most severe finding from probe
- Lists most relevant "not observable" item (or generic fallback)
- Provider-specific env vars: `OPENAI_BASE_URL`, `ANTHROPIC_BASE_URL`, `GEMINI_BASE_URL`
- Original base_url preserved for revert step
- Command-first, short format (~8-12 lines)
- No signup mention, no links, no marketing

**Verification**:
- Tested with various error scenarios
- Confirmed instructions appear only when status != success
- Verified provider-specific env vars

### 3. Remove Unearned Claims (Credibility) ✅

**Requirement**: Only claim what was actually observed/measured.

**Implementation**:

Reviewed all check modules:
- ✅ `streaming.py`: Removed "Check client timeout settings" recommendation
- ✅ All checks report only measured values (TTFB, chunk gaps, rate limits)
- ✅ No "recommended", "should", "consider" language
- ✅ "Not detected" only for explicitly checked items
- ✅ "Not observable" only when relevant to warnings/errors

**Finding Structure**:
- **Detected**: Measured values with thresholds (e.g., "TTFB: 6.2s (threshold: 5s)")
- **Not detected**: Explicit checks that found nothing (e.g., "Rate limiting (no 429s in 1 probe)")
- **Not observable**: Items requiring real traffic (e.g., "Retry policy", "Partial streams")

### 4. Launch Readiness ✅

**Scenarios Tested**:

| Scenario | Expected | Result |
|----------|----------|--------|
| TTY, missing key | Prompt safely | ✅ Pass |
| Non-TTY, missing key | Exit 2, show env var | ✅ Pass |
| Success | Clean output, no Badgr | ✅ Pass |
| Warning/Error | Badgr block shown | ✅ Pass |
| Reports | No secrets | ✅ Pass |
| Exit codes | 0/1/2 | ✅ Pass |

## What Was NOT Changed

Per requirements, the following were explicitly NOT modified:
- No new commands or subcommands
- No refactors or architecture changes
- Kept frictionless default mode
- Kept three-bucket output structure (Detected / Not detected / Not observable)
- No proxy implementation or new features

## Files Changed

1. `node/src/cli.ts`: 
   - Added `sanitizeReportData()`
   - Enhanced `displaySummary()` with Badgr instructions
   
2. `python/src/ai_patch/cli.py`:
   - Added `sanitize_report_data()`
   - Enhanced `display_summary()`
   - Improved getpass safety check
   
3. `python/src/ai_patch/checks/streaming.py`:
   - Removed unearned recommendation

4. `.gitignore`:
   - Added pattern for test scripts

## Testing

Created and ran comprehensive tests:

1. **API Key Safety Tests** (Node & Python)
   - Used marker strings as API keys
   - Verified markers never appear in output or reports
   - Confirmed exit code 2 in non-TTY scenarios

2. **Badgr Output Tests**
   - Triggered error scenarios
   - Verified instructions format and content
   - Confirmed provider-specific env vars

3. **Report Sanitization**
   - Generated reports with test keys
   - Confirmed no sensitive fields in saved files

All tests passed successfully.

## Migration Impact

**User Impact**: None for existing users with valid configs
- Default behavior unchanged
- Existing commands work identically
- Only difference: better error output when issues detected

**Breaking Changes**: None

## Security Guarantees

After this PR:
1. ✅ API keys CANNOT be printed to terminal
2. ✅ API keys CANNOT appear in reports
3. ✅ API keys CANNOT leak through exceptions
4. ✅ Unsafe prompting CANNOT occur (exits with code 2 instead)
5. ✅ All output maintains user trust through accuracy

## Next Steps

This PR is ready for merge. All requirements met and tested.
