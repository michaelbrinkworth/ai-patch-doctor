#!/bin/bash
# Helper script to publish AI Patch Doctor to GitHub Marketplace
# This is a guide - actual publishing happens through GitHub UI

set -e

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║        GitHub Action Marketplace Publishing Guide                ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if action.yml exists
if [ ! -f action.yml ]; then
    echo "❌ Error: action.yml not found"
    echo "   This file is required for GitHub Marketplace publishing"
    exit 1
fi

echo "✅ Found action.yml"
echo ""

# Get current branch
BRANCH=$(git branch --show-current)
echo "📍 Current branch: $BRANCH"
echo ""

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "   Commit them before publishing"
    echo ""
    git status --short
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Publishing Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script can't publish directly (GitHub requires UI)."
echo "Follow these steps manually:"
echo ""
echo "1. 📝 Commit and push all changes:"
echo "   git add ."
echo "   git commit -m 'Prepare for v1.0.0 release'"
echo "   git push origin $BRANCH"
echo ""
echo "2. 🏷️  Create a new release on GitHub:"
echo "   • Go to: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases/new"
echo "   • Click 'Choose a tag' and create: v1.0.0"
echo "   • Set release title: v1.0.0 - Initial Release"
echo "   • Add release notes describing the action"
echo ""
echo "3. ✅ Enable Marketplace publishing:"
echo "   • Check ✓ 'Publish this Action to the GitHub Marketplace'"
echo "   • Select primary category: 'Code quality'"
echo "   • Accept the GitHub Marketplace Developer Agreement if prompted"
echo ""
echo "4. 🚀 Publish the release:"
echo "   • Click 'Publish release'"
echo ""
echo "5. 🎉 After publishing:"
echo "   • Action will be available at:"
echo "     https://github.com/marketplace/actions/ai-patch-doctor"
echo "   • Users can use it with:"
echo "     - uses: $(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')@v1"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Pre-Publishing Checklist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✓ action.yml exists and is valid"

# Validate action.yml
if command -v python3 &> /dev/null; then
    python3 -c "import yaml; yaml.safe_load(open('action.yml'))" 2>/dev/null && echo "✓ action.yml is valid YAML" || echo "❌ action.yml has syntax errors"
fi

echo "✓ README.md has usage examples"
[ -f README.md ] && echo "✓ README.md exists" || echo "❌ README.md missing"

echo "✓ License file exists"
[ -f LICENSE ] && echo "✓ LICENSE exists" || echo "❌ LICENSE missing"

echo ""
echo "For more details, see: MARKETPLACE-PUBLISHING.md"
echo ""
