---
name: vibe-release
description: Standard operating procedure for building, testing, versioning, and publishing GitHub releases and package bundles for Vibe Inspector.
---

# Vibe Inspector Release & Git Operations Skill

Use this skill whenever you need to:
- Package and publish a new GitHub release.
- Build the precompiled Chrome Extension zip.
- Build the standalone CLI bridge tarball (`.tgz`).
- Push/pull changes to `origin/main` on GitHub.
- Ensure users without `pnpm` can install and run the tool effortlessly.

---

## 1. Prime Release Directives

1. **Test First**: Never cut a release without running and verifying `pnpm test` (or `npm test`) with 100% passing tests.
2. **Double Package Deliverable**: Every GitHub release MUST attach:
   - `vibe-inspector-chrome-extension-v<version>.zip` (unpacked directory contents of `extension/dist`).
   - `vibe-inspector-bridge-<version>.tgz` (packed npm tarball from `bridge/`).
3. **Clean-Up**: Never commit `.zip` or `.tgz` artifacts to git; clean them up immediately after the GitHub release command succeeds.
4. **Standard npm Compatibility**: Always document and preserve installation commands that use standard `npm` (e.g. `npm link ./bridge`, `npm install -g <tarball-url>`) so developers without `pnpm` can use the project immediately.

---

## 2. Release & Packaging Procedure

When cutting a new release (e.g., `v1.0.1`):

### Step 1: Run Full Test Suite & Build
```powershell
# In project root
pnpm build
pnpm test
```

### Step 2: Create Extension Zip Bundle
```powershell
Compress-Archive -Path "extension/dist/*" -DestinationPath "vibe-inspector-chrome-extension-v1.0.1.zip" -Force
```

### Step 3: Create Bridge NPM Tarball
```powershell
cd bridge
npm pack
cd ..
Move-Item -Path "bridge/vibe-inspector-bridge-*.tgz" -Destination "vibe-inspector-bridge-1.0.1.tgz" -Force
```

### Step 4: Publish to GitHub Releases
```powershell
gh release create v1.0.1 `
  "vibe-inspector-chrome-extension-v1.0.1.zip" `
  "vibe-inspector-bridge-1.0.1.tgz" `
  --title "v1.0.1 - Title of release" `
  --notes "Detailed release notes and change summary"
```

### Step 5: Clean Up Local Archives
```powershell
Remove-Item "vibe-inspector-chrome-extension-*.zip", "vibe-inspector-bridge-*.tgz" -Force
```

---

## 3. Git Workflow Directives

1. Check status with `git status` before making edits.
2. Commit changes atomically with conventional commit prefixes:
   - `feat: <description>`
   - `fix: <description>`
   - `docs: <description>`
   - `chore: <description>`
3. Push to `origin/main` using `git push origin main`.
4. Check GitHub issues or pull requests using `gh issue list` and `gh pr list`.
