# Backup Recovery Harness

This harness defines the backup and recovery model for the ICPS Lab Astro website. Use Backup Recovery Agent for planning and documentation, and QA Release Agent for any release, merge, push, or production deployment step.

## Backup Layers

### Git Commit / Tag

- Use ordinary commits as the first recovery point for content, layout, workflow, and documentation changes.
- Before major refactors, data migrations, batch image operations, workflow changes, or deletions, ask whether to create a checkpoint commit or tag.
- Do not use destructive rollback commands unless the user explicitly approves the exact recovery action.

### GitHub Repo Snapshot

- `.github/workflows/backup-repo-snapshot.yml` creates a Git bundle artifact named `icps-lab-v2-backup.bundle`.
- The workflow supports manual runs and a weekly scheduled run.
- The snapshot workflow must not commit, push, or modify repository files.

### Achievements JSON Artifact Backup

- `.github/workflows/sync-achievements.yml` uploads the current `src/data/achievements.json` as a GitHub Actions artifact before running the scraper.
- This preserves the pre-sync data even if the scraper later fails or produces bad output.
- Artifact retention is intentionally limited; use Git history for long-term recovery.

### Achievements Sync Reports

- `.github/workflows/sync-achievements.yml` writes a report for every daily sync run.
- Reports are committed to the separate `automation-reports` branch, not to `main`.
- This keeps success, no-change, blocked, and failed run notes available without triggering Vercel deployments.

### Vercel Rollback

- If production breaks after a pushed commit, use Vercel's deployment history to roll back to a previous successful deployment.
- Vercel rollback is a production operation and should be coordinated through QA Release Agent.
- Do not expose Vercel tokens or Deploy Hook URLs in Git-tracked files or chat output.

### Cloudinary Automatic Backup

- Activity album media is managed in Cloudinary.
- If Cloudinary backup/versioning is enabled in the Cloudinary account, use Cloudinary's restore tools for deleted or overwritten media.
- Website code should not be changed until the Cloudinary-side state is confirmed.

## Checkpoint Flow Before Major Changes

Use this before major refactors, data migrations, batch image changes, workflow edits, or file deletion tasks:

1. Site Manager Agent identifies the task as needing a backup checkpoint.
2. Backup Recovery Agent asks whether to create a checkpoint.
3. Confirm the current branch and working tree:

```powershell
git branch --show-current
git status --short
```

4. If the working tree is dirty, stop and report before creating a checkpoint.
5. If the user approves, create a focused checkpoint using a commit or tag appropriate to the task.
6. Continue only after the checkpoint is confirmed.

Deletion tasks require both a checkpoint and explicit user confirmation before any delete operation.

## Website Broken Recovery Flow

1. Stop new edits and releases.
2. Identify the last known good commit and Vercel deployment.
3. Check whether the issue is code, content data, generated achievements data, Cloudinary media, or deployment-only.
4. Prefer the least invasive recovery:
   - Vercel rollback for production-only breakage.
   - Git revert or follow-up fix for bad code/content commits.
   - Restore `src/data/achievements.json` from Git or artifact for bad scraper output.
   - Cloudinary restore for deleted or overwritten activity media.
5. Run build before any new production push.
6. Use QA Release Agent for merge, push, or production verification.

## Achievements Sync Bad-Data Recovery

If the scheduled achievements sync writes bad data:

1. Stop further sync/release actions.
2. Download the `achievements-json-before-sync-*` artifact from the failed or bad workflow run when available.
3. Compare it against Git history for `src/data/achievements.json`.
4. Restore the safest known good version in a focused fix branch.
5. Run `npm.cmd run build`.
6. Commit only `src/data/achievements.json`.
7. Release through QA Release Agent.

The sync workflow must fail before commit/push when JSON is invalid, data is empty, required fields are missing, the item count drops by 30% or more, build fails, or the diff includes files outside `src/data/achievements.json`.

Daily sync reports should still be published to `automation-reports` even when the data sync fails or is blocked.

To copy reports into the local ignored `reports/` folder:

```powershell
.\scripts\sync-achievements-reports.ps1
```

Use `reports/achievements-sync/latest.md` for the most recent result.

## Cloudinary Deleted Images Flow

1. Confirm whether the missing images were deleted, moved, renamed, or only not yet reflected in Vercel's static build.
2. Check Cloudinary backup/versioning or account media history.
3. Restore media in Cloudinary first when possible.
4. If Cloudinary content is correct but the site is stale, route to Activities Agent, then QA Release Agent for the Cloudinary/Vercel redeploy flow.
5. Do not edit activity page Cloudinary API logic unless the user explicitly scopes that code change.

## Monthly Restore Drill

Once a month, perform a lightweight restore drill:

- Manually run `Backup Repository Snapshot`.
- Verify the artifact exists and retention is correct.
- Verify `git bundle verify icps-lab-v2-backup.bundle` passes after downloading in a safe local scratch folder.
- Review the latest `Sync Achievements Data` run and confirm pre-sync artifacts are being uploaded.
- Confirm Vercel rollback history is accessible.
- Confirm Cloudinary account backup/restore settings are understood.

Do not run destructive restore commands during a drill.
