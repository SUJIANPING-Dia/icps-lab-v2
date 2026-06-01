# Release Checklist

Use QA Release Agent for build, diff, merge, push, and production release checks. QA Release Agent must not edit files, stage files, create commits, resolve conflicts, or force push.

Every response must follow `docs/harness/RESPONSE_PROTOCOL.md`.

For Cloudinary-only activity album updates, use `docs/harness/CLOUDINARY_VERCEL_REDEPLOY.md` instead of a Git release flow.

For scheduled achievements data sync, use `docs/harness/ACHIEVEMENTS_SYNC.md`. The workflow may commit and push only `src/data/achievements.json` after a successful build.

## 1. Pre-Change Checks

Run:

```powershell
git branch --show-current
git status --short
```

If the working tree is dirty, stop and report before editing or merging.

For release tasks, also inspect the recent branch graph:

```powershell
git log --oneline --decorate --graph --all -10
```

## 2. Build Check

Run:

```powershell
npm.cmd run build
```

Build must succeed before merge or push. Existing Vite unused import warnings are acceptable if the build exits successfully.

## 3. Diff Check

Run:

```powershell
git diff --stat
git diff --name-status
```

For release branches, compare against remote main:

```powershell
git diff --name-status origin/main...HEAD
git diff --stat origin/main...HEAD
```

Only files explicitly allowed by the task may appear.

## 4. Merge Main Check

Use fast-forward-only flows:

```powershell
git switch main
git pull --ff-only origin main
git merge --ff-only <source-branch>
```

If pull or merge cannot fast-forward, stop and report. Do not resolve conflicts unless the user explicitly authorizes a conflict-resolution task.

## 5. Push-Prohibited Actions

Never use:

- `git push --force`
- `git reset --hard`
- `git clean`
- broad `git add .`
- unrequested package changes
- unrequested `.env` changes
- unrequested script execution

Do not run `scripts/fetchAchievements.js` unless explicitly requested.

## 6. Push Readiness

Before `git push origin main`, confirm:

- Current branch is `main`.
- Build succeeded.
- Diff against `origin/main...HEAD` only includes user-approved files.
- `git status --short` is clean or contains only expected release-state output.
- User explicitly requested the push.

## 7. Mobile Production Checks

After deployment, inspect the affected page on mobile:

- Global navbar opens and closes.
- Current page link still navigates correctly.
- Page-specific interactions still work.
- Footer remains visible and aligned.
- Visitor counter still renders.
- No obvious horizontal overflow.
- No text overlaps or clipped buttons.

Suggested wait before checking production: 2 to 5 minutes, or 10 minutes if deployment is slow.

## 8. Cloudinary Redeploy Checks

When the user explicitly says Cloudinary upload/update is complete and asks to redeploy:

1. Use QA Release Agent.
2. Run `git branch --show-current`.
3. Run `git status --short`.
4. If the working tree is dirty, stop and report.
5. Confirm `$env:VERCEL_DEPLOY_HOOK_URL` exists without printing it.
6. If the variable is missing, stop and report.
7. Run `Invoke-RestMethod -Method POST -Uri $env:VERCEL_DEPLOY_HOOK_URL`.

Do not:

- commit
- push Git
- modify files
- display the Deploy Hook URL
- write the Deploy Hook URL to any repository file

## 9. Scheduled Achievements Sync Checks

For `.github/workflows/sync-achievements.yml`, verify:

- The workflow runs `node scripts/fetchAchievements.js`.
- The only allowed changed file is `src/data/achievements.json`.
- If no diff exists, the workflow prints `No achievements changes` and exits.
- If other files changed, the workflow fails before build, commit, or push.
- `npm run build` succeeds before commit.
- Commit message is `Sync achievements data`.
- Push target is `main`.
- Force push is not used.
- Cloudinary and Vercel Deploy Hook flows are not triggered.
