# This is a GitHub Action Repository

## What This Repository Contains

This repository contains a **GitHub Action** - a reusable module that other developers can drop into their CI pipelines.

## What IS This?

✅ **A GitHub Action** - Reusable component for other people's workflows
✅ **Published to GitHub Marketplace** - Available as `michaelbrinkworth/ai-doctor-action@v1`
✅ **The Tool** - The thing that goes viral and spreads across repos

## What This IS NOT

❌ **Not a workflow** - Users create their own workflows that call this Action
❌ **Not just a CLI tool** - The CLI exists, but the Action is the distribution mechanism
❌ **Not tied to one repo** - This Action can be used in thousands of repos

## How Users Use It

Users add ONE LINE to their workflow:

```yaml
- uses: michaelbrinkworth/ai-doctor-action@v1
```

That's it. The Action (from this repo) runs in their CI pipeline.

## The Key Files

1. **`action.yml`** - Defines what the Action does (required for Marketplace)
2. **`README.md`** - Shows users how to use the Action
3. **Documentation** - Detailed guides in ACTION-USAGE.md, etc.
4. **`.github/workflows/ai-doctor.yml`** - EXAMPLE ONLY (for testing THIS repo)

## The Distribution Model

1. This Action gets published to GitHub Marketplace
2. Developers discover it and add the one-liner to their repos
3. The Action runs on every PR in THEIR repo (not this one)
4. When it finds issues, developers learn about it
5. They add it to more projects
6. Repeat

**CI failures spread faster than documentation.**

## What Gets Published?

When you tag `v1.0.0` and publish to Marketplace:
- The `action.yml` metadata
- All the code in this repo
- Users reference it as `@v1` (or `@v1.0.0`)

The Action runs in their environment, checking their code.

## Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│ THIS REPO (ai-patch-doctor)                                  │
│ • Contains: action.yml, CLI code, documentation              │
│ • Published as: michaelbrinkworth/ai-doctor-action@v1        │
│ • Purpose: The reusable Action module                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
                         used by
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ USER'S REPO (any-company/their-project)                      │
│ • Contains: Their code + workflow that calls the Action      │
│ • Workflow: - uses: michaelbrinkworth/ai-doctor-action@v1    │
│ • Purpose: Their project with AI API code                    │
└─────────────────────────────────────────────────────────────┘
```

The **Action** lives here. The **workflow** lives in their repo.

## Why This Matters

This is how Actions go viral:
- ✅ Dead simple to adopt (one line)
- ✅ Lightweight (just add to workflow)
- ✅ Drop-in (no configuration needed)
- ✅ Immediate value (catches issues in PRs)

Users don't need to understand the implementation. They just add the line and it works.

## Next Step: Publishing

1. Create a release with tag `v1.0.0`
2. Check "Publish to GitHub Marketplace"
3. Select category: "Code quality"
4. The Action becomes instantly available

Then anyone can use it with:
```yaml
- uses: michaelbrinkworth/ai-doctor-action@v1
```

That's the whole point. That's what makes it go viral.
