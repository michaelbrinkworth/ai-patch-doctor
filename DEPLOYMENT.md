# Deployment Guide

This document describes how to deploy the AI Patch Doctor packages to PyPI (Python) and npm (Node.js) using GitHub Actions.

## Prerequisites

Before deploying, you need to configure the following secrets in your GitHub repository:

### Required Secrets

1. **PYPI_API_TOKEN** - PyPI API token for publishing Python packages
   - Go to https://pypi.org/manage/account/token/
   - Create a new API token with "Upload packages" scope
   - Add it to GitHub repository secrets

2. **NPM_TOKEN** - npm authentication token for publishing Node packages
   - Run `npm login` locally (if not already logged in)
   - Run `npm token create` to generate a new token
   - Select "Publish" permission
   - Add it to GitHub repository secrets

### Adding Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add both `PYPI_API_TOKEN` and `NPM_TOKEN`

## Deployment Methods

### Method 1: Automatic Deployment via Git Tags (Recommended)

This method automatically publishes both Python and Node packages when you push a version tag.

1. **Update Version Numbers**
   
   Update the version in both packages:
   - `python/pyproject.toml` - Update the `version` field
   - `node/package.json` - Update the `version` field

2. **Commit and Tag**
   
   ```bash
   git add python/pyproject.toml node/package.json
   git commit -m "Bump version to 0.1.5"
   git tag v0.1.5
   git push origin main
   git push origin v0.1.5
   ```

3. **Monitor Deployment**
   
   - Go to the **Actions** tab in your GitHub repository
   - Watch the "Publish Packages" workflow run
   - Both Python and Node packages will be published automatically

### Method 2: Manual Deployment via Workflow Dispatch

This method allows you to manually trigger deployment of specific packages.

1. Go to your repository on GitHub
2. Navigate to **Actions** → **Publish Packages**
3. Click **Run workflow**
4. Select which package to publish:
   - `both` - Publish both Python and Node packages
   - `python` - Publish only the Python package
   - `node` - Publish only the Node package
5. Click **Run workflow**

## Continuous Integration

The repository includes a CI workflow that runs automatically on:
- Every push to the `main` branch
- Every pull request to the `main` branch

The CI workflow:
- Tests the Node.js package on Node 16, 18, and 20
- Tests the Python package on Python 3.8, 3.9, 3.10, 3.11, and 3.12
- Validates the package structure using the validation script

## Version Management

Both packages should maintain version synchronization:

1. Use semantic versioning (MAJOR.MINOR.PATCH)
2. Update both `python/pyproject.toml` and `node/package.json` together
3. Create git tags in the format `vX.Y.Z` (e.g., `v0.1.5`)

### Version Bump Checklist

- [ ] Update `python/pyproject.toml` version
- [ ] Update `node/package.json` version
- [ ] Update CHANGELOG.md (if present)
- [ ] Commit changes
- [ ] Create and push git tag
- [ ] Verify both packages published successfully

## Troubleshooting

### PyPI Publishing Fails

- **Invalid token**: Verify `PYPI_API_TOKEN` secret is correct
- **Package already exists**: You cannot republish the same version. Bump the version number.
- **Invalid package name**: Ensure the package name in `pyproject.toml` is available on PyPI

### npm Publishing Fails

- **Invalid token**: Verify `NPM_TOKEN` secret is correct
- **Package already exists**: You cannot republish the same version. Bump the version number.
- **Scope/access issues**: Ensure the package name is available and you have permission to publish

### Build Fails

- **TypeScript errors**: Fix TypeScript compilation errors in the `node/` directory
- **Python build errors**: Ensure `pyproject.toml` is correctly configured
- **Missing dependencies**: Update `package.json` or `pyproject.toml` dependencies

## Testing Before Publishing

Before creating a release tag, always:

1. Run local tests:
   ```bash
   # Node tests
   npm test
   
   # Python tests
   cd python
   python tests/test_cli.py
   
   # Validation
   cd ..
   python validate.py
   ```

2. Build locally to catch errors:
   ```bash
   # Build Node package
   cd node
   npm run build
   
   # Build Python package
   cd ../python
   python -m build
   ```

3. Test the CLI commands:
   ```bash
   # Test Node CLI
   cd node
   node dist/src/cli.js doctor --help
   
   # Test Python CLI
   cd ../python
   pip install -e .
   ai-patch doctor --help
   ```

## Release Process

1. **Create a release branch** (optional but recommended)
   ```bash
   git checkout -b release/v0.1.5
   ```

2. **Update versions and commit**
   ```bash
   # Edit python/pyproject.toml and node/package.json
   git add python/pyproject.toml node/package.json
   git commit -m "Bump version to 0.1.5"
   ```

3. **Test everything locally**
   ```bash
   npm test
   cd python && python tests/test_cli.py
   cd .. && python validate.py
   ```

4. **Merge to main** (if using release branch)
   ```bash
   git checkout main
   git merge release/v0.1.5
   git push origin main
   ```

5. **Create and push tag**
   ```bash
   git tag v0.1.5
   git push origin v0.1.5
   ```

6. **Verify deployment**
   - Check GitHub Actions workflow completion
   - Verify package on PyPI: https://pypi.org/project/ai-patch-doctor/
   - Verify package on npm: https://www.npmjs.com/package/ai-patch

## Security Considerations

- Never commit API tokens or secrets to the repository
- Rotate tokens periodically
- Use scoped tokens with minimal required permissions
- Review the workflow logs for any exposed secrets (GitHub automatically redacts known secrets)

## Support

If you encounter issues with deployment:
1. Check the GitHub Actions logs for detailed error messages
2. Review the troubleshooting section above
3. Open an issue at https://github.com/michaelbrinkworth/ai-patch-doctor/issues
