# Pre-Launch Checklist for ai-patch-doctor

This checklist ensures safe publication to npm and PyPI before sharing commands online.

---

## 📦 Package Configuration

### Node.js (npm)
- [ ] **Version**: Check `node/package.json` version matches intended release (`0.1.2`)
- [ ] **Package name**: Verify `ai-patch` is available on npm or you own it
- [ ] **Main entry point**: Confirm `"main": "dist/src/index.js"` is correct
- [ ] **Binary**: Confirm `"bin": { "ai-patch": "dist/src/cli.js" }` is correct
- [ ] **Repository URL**: Verify GitHub URL is correct
- [ ] **License**: MIT license file exists and is referenced
- [ ] **Keywords**: Review keywords for discoverability
- [ ] **Engines**: Node >=16.0.0 requirement is acceptable

### Python (PyPI)
- [ ] **Version**: Check `python/pyproject.toml` version matches intended release (`0.1.2`)
- [ ] **Package name**: Verify `ai-patch-doctor` is available on PyPI or you own it
- [ ] **Entry point**: Confirm `ai-patch = "ai_patch.cli:main"` is correct
- [ ] **Python version**: Confirm >=3.8 requirement is acceptable
- [ ] **Dependencies**: Verify all deps are pinned with minimum versions
- [ ] **License**: MIT license is specified
- [ ] **Keywords**: Review keywords for discoverability

---

## 🔨 Build & Test

### Node.js
- [ ] **Install dependencies**: `cd node && npm install`
- [ ] **Build TypeScript**: `npm run build` (should create `dist/` folder)
- [ ] **Check build output**: Verify `dist/src/cli.js` and `dist/src/index.js` exist
- [ ] **Test CLI locally**: `node dist/src/cli.js doctor --help`
- [ ] **Test with npx**: `npx . doctor --help` (from node/ directory)
- [ ] **Run test suite**: `cd .. && npm test` (52 tests should pass)

### Python
- [ ] **Install in dev mode**: `cd python && pip install -e .`
- [ ] **Test CLI locally**: `ai-patch doctor --help`
- [ ] **Test with pipx**: `pipx run . doctor --help` (from python/ directory)
- [ ] **Run Python tests**: `python tests/test_cli.py`
- [ ] **Run validation**: `cd .. && python validate.py` (4 checks should pass)

---

## 🔐 Security & Secrets

- [ ] **No secrets in code**: Search for API keys, tokens, passwords
  ```bash
  grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=.git
  grep -r "OPENAI_API_KEY.*=" . --exclude-dir=node_modules --exclude-dir=.git
  ```
- [ ] **No .env files**: Ensure `.env` files are in `.gitignore` and not committed
- [ ] **Sanitization works**: Verify report sanitization removes sensitive fields
- [ ] **Dependencies audit**: Run `npm audit` and check for vulnerabilities
- [ ] **Python dependencies**: Check for known CVEs in requirements

---

## 📝 Documentation

- [ ] **README.md**: Verify installation instructions for both npm and PyPI
- [ ] **README.md**: Check quick start examples are correct
- [ ] **README.md**: Ensure GitHub URLs are correct
- [ ] **USERFLOW.md**: Verify mini steps match implementation (just updated)
- [ ] **LICENSE**: MIT license exists and has correct year
- [ ] **Package READMEs**: Check `node/README.md` and `python/README.md`

---

## 🚀 Pre-Publish Checks

### npm (Node.js)
- [ ] **Dry run**: `cd node && npm publish --dry-run`
- [ ] **Check what gets published**: Review the output, ensure no sensitive files
- [ ] **Verify .npmignore**: Create if needed to exclude test files, configs
- [ ] **Test install after dry-run**: Verify package size is reasonable (<1MB)
- [ ] **Authentication**: `npm login` (ensure you're logged in)
- [ ] **Organization**: If publishing to org scope, ensure permissions

### PyPI (Python)
- [ ] **Build package**: `cd python && python -m build`
- [ ] **Check dist contents**: `ls -lh dist/` (should see .tar.gz and .whl)
- [ ] **Verify manifest**: `tar -tzf dist/*.tar.gz | less` (check included files)
- [ ] **Test install from dist**: `pip install dist/*.whl` in fresh venv
- [ ] **Check PyPI credentials**: Ensure you have API token or credentials
- [ ] **TestPyPI first**: Consider publishing to TestPyPI first
  ```bash
  python -m twine upload --repository testpypi dist/*
  ```

---

## ✅ Final Validation

### Functional Testing
- [ ] **Fresh install test (Node)**: In new directory, run `npx ai-patch@latest doctor --help`
- [ ] **Fresh install test (Python)**: In new environment, run `pipx run ai-patch-doctor doctor --help`
- [ ] **Test with real API**: Run against OpenAI/Anthropic with valid key (optional)
- [ ] **Test all commands**: `doctor`, `diagnose`, `test`, `share` work as expected
- [ ] **Cross-platform**: Test on Linux, macOS, Windows if possible

### Version Control
- [ ] **Git tags**: Tag release with version: `git tag v0.1.2`
- [ ] **GitHub release**: Create GitHub release with changelog
- [ ] **Clean working tree**: `git status` shows no uncommitted changes
- [ ] **Branch protection**: Ensure main branch is protected

### Post-Publish Monitoring
- [ ] **Monitor npm**: Check https://www.npmjs.com/package/ai-patch after publish
- [ ] **Monitor PyPI**: Check https://pypi.org/project/ai-patch-doctor/ after publish
- [ ] **Test installation**: Wait 5 minutes, test `npx ai-patch` and `pipx run ai-patch-doctor`
- [ ] **Check downloads**: Monitor initial downloads/installs
- [ ] **GitHub stars**: Watch for community interest

---

## 🚨 Publishing Commands

### When ready to publish:

**npm (Node.js):**
```bash
cd node
npm run build          # Build TypeScript
npm publish            # Publish to npm
```

**PyPI (Python):**
```bash
cd python
python -m build        # Create source and wheel distributions
python -m twine upload dist/*  # Upload to PyPI
```

### After publishing:
```bash
git tag v0.1.2
git push origin v0.1.2
```

---

## 📊 Sharing Commands

Once published and verified, you can safely share:

```bash
# For Python users
pipx run ai-patch-doctor doctor

# For Node users
npx ai-patch doctor

# Or install globally
npm install -g ai-patch
pip install ai-patch-doctor
```

---

## 🐛 Rollback Plan

If issues are found after publishing:

1. **npm**: Use `npm deprecate ai-patch@0.1.2 "Issue found, use @0.1.3"`
2. **PyPI**: Cannot delete, but can yank: `twine yank ai-patch-doctor -v 0.1.2`
3. **Hotfix**: Quickly publish patched version (0.1.3)
4. **Communication**: Update GitHub issues/discussions

---

## 📌 Current Status

**Node Package:**
- Name: `ai-patch`
- Version: `0.1.2`
- Location: `node/`

**Python Package:**
- Name: `ai-patch-doctor`
- Version: `0.1.2`  
- Location: `python/`

**Known Issues:**
- TypeScript build currently has errors (needs fixing before publish)
- Check `node/tsconfig.json` - may need to add Node types to lib

---

## 🔧 Fix TypeScript Build Before Publishing

The build currently fails. Quick fix:

```json
// node/tsconfig.json - Update "lib" to include node types
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM"]  // Add DOM for console
    // OR install proper node types
  }
}
```

Or ensure `@types/node` is in dependencies and imported properly.

**DO NOT PUBLISH until build succeeds!**
