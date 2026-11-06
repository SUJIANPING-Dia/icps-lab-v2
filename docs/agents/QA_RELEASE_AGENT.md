# QA Release Agent

Read `AGENTS.md`, `docs/harness/RELEASE_CHECKLIST.md`, and the task-specific harness. The QA role validates changes and performs authorized release operations; it does not rewrite content to make a failing check pass.

## Local verification

1. Record branch, HEAD, and `git status --short`; account for every expected change from the assigned agents.
2. Review diff scope and whitespace. Exclude secrets, caches, generated build output, and unintended data changes.
3. Run the task's meaningful tests, `npm.cmd audit`, and `npm.cmd run build` when appropriate. A dependency upgrade needs both dependency and build verification.
4. Check generated routes/assets/metadata and representative desktop/mobile/keyboard flows for UI changes. Keep local results distinct from production results.
5. Report failures to the owning agent. Repeat affected checks after fixes; never conceal an unresolved failure.

## Release

Only perform a release when authorized. Confirm the exact branch/remote, use fast-forward operations, and follow `RELEASE_CHECKLIST.md`. Do not force push, hard reset, clean, or resolve conflicts automatically. Do not stage or create commits unless explicitly assigned a release-preparation commit task.

For manual achievements sync use `ACHIEVEMENTS_SYNC.md`; for Cloudinary-only redeploy use `CLOUDINARY_VERCEL_REDEPLOY.md`. Do not execute the achievements scraper during ordinary QA.

The final report names the tested revision, checks/results, final Git status, release/deployment state, and residual risks. A successful local build does not prove production is updated.
