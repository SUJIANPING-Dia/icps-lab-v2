# Website Maintenance Manual

This document is the human-readable maintenance guide for the iCPS Lab Astro website. All maintenance tasks should start with Site Manager Agent, then route to the relevant specialized agent, Backup Recovery Agent, or QA Release Agent.

## Current Architecture

- Astro static site with Tailwind CSS.
- Shared page shell: `src/layouts/BaseLayout.astro`.
- Shared global navigation: `src/components/Navbar.astro`.
- Achievements data: `src/data/achievements.json`.
- Achievements sync: `.github/workflows/sync-achievements.yml` runs the scraper daily.
- Repository snapshot backups: `.github/workflows/backup-repo-snapshot.yml` creates a weekly Git bundle artifact.
- News content: `src/components/News.astro`.
- FAQ content: `src/pages/faq.astro`.
- Members content: `src/pages/members.astro`.
- Activities albums: Cloudinary-backed pages in `src/pages/activities.astro` and `src/pages/activities/[id].astro`.
- Cloudinary-only album updates normally need a Vercel redeploy, not website code changes.

## Agent Playbook Index

- Site Manager config: `.codex/agents/site-manager.toml`
- Codex subagent config: `.codex/config.toml`
- News agent config: `.codex/agents/news.toml`
- FAQ agent config: `.codex/agents/faq.toml`
- Members agent config: `.codex/agents/members.toml`
- Achievements agent config: `.codex/agents/achievements.toml`
- Activities agent config: `.codex/agents/activities.toml`
- UI Refactor agent config: `.codex/agents/ui-refactor.toml`
- SEO Content agent config: `.codex/agents/seo-content.toml`
- Backup Recovery agent config: `.codex/agents/backup-recovery.toml`
- QA Release agent config: `.codex/agents/qa-release.toml`

Legacy detailed playbooks:

- News updates: `docs/agents/NEWS_AGENT.md`
- FAQ updates: `docs/agents/FAQ_AGENT.md`
- Members updates: `docs/agents/MEMBERS_AGENT.md`
- Achievements data updates: `docs/agents/ACHIEVEMENTS_AGENT.md`
- Activities and Cloudinary album work: `docs/agents/ACTIVITIES_AGENT.md`
- Build, merge, push, and release checks: `docs/agents/QA_RELEASE_AGENT.md`

If the task type is unclear, Site Manager Agent must ask the user before choosing a playbook.

## Lightweight Harness Documents

- Agent routing: `docs/harness/AGENT_ROUTING.md`
- Agent architecture: `docs/harness/AGENTS_ARCHITECTURE.md`
- Response protocol: `docs/harness/RESPONSE_PROTOCOL.md`
- Release checklist: `docs/harness/RELEASE_CHECKLIST.md`
- Cloudinary Vercel redeploy workflow: `docs/harness/CLOUDINARY_VERCEL_REDEPLOY.md`
- Achievements sync workflow: `docs/harness/ACHIEVEMENTS_SYNC.md`
- Backup and recovery workflow: `docs/harness/BACKUP_RECOVERY.md`
- Content update flow: `docs/harness/CONTENT_UPDATE_FLOW.md`
- File scope rules: `docs/harness/FILE_SCOPE_RULES.md`

Use these files as the default lightweight harness before adding heavier automation.

## Response Protocol

Every Codex response for this project should start with:

```text
【執行 Agent】
總控：Site Manager Agent
實作：<Agent Name>
階段：<Planning / Editing / Build / Commit / Merge / Push / Review>
狀態：<Ready / In Progress / Blocked / Done>
```

Use `None` for planning-only work, the matching specialized agent for content changes, `Backup Recovery Agent` for backup/restore planning, and `QA Release Agent` for build, merge, push, and release checks.

## Standard Safe Maintenance Flow

Run safety checks first:

```powershell
git branch --show-current
git status --short
git pull --ff-only origin main
```

If the working tree is dirty, stop and report before editing or merging.

Before major refactors, data migrations, batch image changes, workflow edits, or deletion tasks, ask whether to create a backup checkpoint. Deletion tasks require a checkpoint and explicit user confirmation before continuing.

Then create a focused branch:

```powershell
git switch -c codex/<task-name>
```

After edits:

```powershell
npm.cmd run build
git diff --stat
git diff --name-status
git status --short
```

Only commit when:

- Build succeeds.
- Changed files match the task's allowed scope.
- No generated, dependency, package, environment, or unrelated files changed.

## Release Flow

Use `docs/agents/QA_RELEASE_AGENT.md` and `docs/harness/RELEASE_CHECKLIST.md` for merge and push tasks.

Default release target is `origin/main`. Use only fast-forward operations unless the user explicitly asks for another flow.

## Cloudinary Album Redeploy Flow

When activity photos or albums are added in Cloudinary, the repository usually does not need code changes. Astro activity pages are generated during build, so production must be rebuilt by Vercel to reflect Cloudinary updates.

Use `docs/harness/CLOUDINARY_VERCEL_REDEPLOY.md` for this flow. The Vercel Deploy Hook URL must stay outside Git and should exist only in local environment variable `VERCEL_DEPLOY_HOOK_URL`.

QA Release Agent may trigger the deploy hook only when the user explicitly says Cloudinary upload/update is complete and asks to redeploy. It must first confirm a clean working tree and must not commit, push Git, modify files, display the full hook URL, or write the hook URL to any file.

## Achievements Automatic Sync Flow

The GitHub Actions workflow `Sync Achievements Data` runs daily at Taiwan time 00:07 using UTC cron `7 16 * * *`. It can also be started manually from the GitHub Actions tab with `workflow_dispatch`.

The workflow uploads the current `src/data/achievements.json` as an artifact, runs `node scripts/fetchAchievements.js`, validates the updated JSON, checks whether `src/data/achievements.json` changed, and exits with `No achievements changes` when there is no diff.

If data changed, the workflow must verify that no file except `src/data/achievements.json` changed, then run `npm run build`. It must stop before commit/push if the JSON is invalid, data is empty, required fields are missing, item count drops by 30% or more, or build fails. Only after a successful build can it commit with `Sync achievements data` and push to `main`.

Vercel deploys automatically when `main` receives that commit. The workflow must not use force push, modify website UI code, trigger Cloudinary flows, or call a Vercel Deploy Hook.

Every run also writes reports to the separate `automation-reports` branch. This happens for successful runs, no-change runs, blocked runs, and failed runs. These report commits stay off `main`, so they do not trigger Vercel deployments.

The workflow keeps both daily summary files and unique per-run files. Manual GitHub `Run workflow` executions are saved under `achievements-sync/runs/` with the run id and attempt number, so multiple runs on the same date do not overwrite each other.

To read the latest reports locally, run:

```powershell
.\scripts\sync-achievements-reports.ps1
```

This fetches `origin/automation-reports` and writes the files into the ignored local folder:

```text
reports/
```

Open `reports/achievements-sync/latest.md` for the latest daily summary, or `reports/achievements-sync/runs/latest-run.md` for the most recent individual run. All individual run reports are stored under `reports/achievements-sync/runs/`.

After an automatic or manual sync, check `https://icps-lab.com/achievements` once the Vercel deployment finishes.

## Backup and Recovery Flow

Use Backup Recovery Agent for checkpoint planning, repository snapshots, achievements artifact backup strategy, disaster recovery planning, and restore drills.

Backup layers:

- Git commits or tags for code and documentation checkpoints.
- GitHub Actions repository snapshot artifacts from `Backup Repository Snapshot`.
- `achievements-json-before-sync-*` artifacts from scheduled achievements sync runs.
- Vercel deployment rollback for production deployment recovery.
- Cloudinary restore tools for activity media when available.

The repository snapshot workflow creates `icps-lab-v2-backup.bundle` weekly and on manual dispatch. It uploads the bundle as an artifact and must not commit, push, or modify repository files.

Run a monthly restore drill by verifying the latest repository snapshot artifact, checking achievements pre-sync artifacts, and confirming Vercel/Cloudinary restore access. Do not run destructive restore commands during a drill.

## Long-Term Content Data Plan

The following content is still embedded in Astro files:

- News: `src/components/News.astro`
- FAQ: `src/pages/faq.astro`
- Members: `src/pages/members.astro`

For long-term maintenance, migrate these into `src/data/` gradually in separate explicit tasks. Do not combine data migration with routine content updates.

## Files That Usually Need Extra Care

- `.env`: never print or edit secrets.
- `scripts/fetchAchievements.js`: do not run unless explicitly requested or inside the approved scheduled workflow.
- `src/data/achievements.json`: changes affect achievements page and homepage stats.
- `src/pages/activities.astro` and `src/pages/activities/[id].astro`: preserve Cloudinary API logic unless explicitly scoped.
- `src/components/Navbar.astro` and `src/layouts/BaseLayout.astro`: shared across all main pages.

## Lightweight QA

For now, use a lightweight maintenance process:

- Small scoped branch per task.
- Build verification with `npm.cmd run build`.
- Diff checks with `git diff --stat` and `git diff --name-status`.
- Manual mobile production check after deployment.
- Monthly backup/restore drill.

Consider adding automated browser checks later if navbar, modal, lightbox, tabs, or Cloudinary behavior begins changing frequently.
