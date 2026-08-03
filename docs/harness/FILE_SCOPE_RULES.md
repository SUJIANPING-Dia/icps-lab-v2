# File Scope Rules

Site Manager Agent must confirm the allowed file scope before routing a task. If a task requires files outside the allowed scope, stop and report before editing.

Every response must follow `docs/harness/RESPONSE_PROTOCOL.md`.

## News Tasks

Allowed:

- `src/components/News.astro`
- `public/images/` only when the user explicitly provides an image

Forbidden:

- `src/pages/index.astro`
- `src/layouts/BaseLayout.astro`
- `src/components/Navbar.astro`
- other pages
- Cloudinary code
- `src/data/achievements.json`
- `scripts/fetchAchievements.js`
- `.env`
- package files

## FAQ Tasks

Allowed:

- `src/pages/faq.astro`

Forbidden:

- layout files
- Navbar
- other pages
- FAQ-unrelated content
- data migration unless explicitly requested

## Members Tasks

Allowed:

- `src/pages/members.astro`
- `public/images/` only when the user explicitly provides a photo

Forbidden:

- layout files
- Navbar
- other pages
- members data migration unless explicitly requested
- unrelated content

## Achievements Tasks

Allowed:

- `src/data/achievements.json`
- `.github/workflows/sync-achievements.yml` only for achievements sync harness tasks
- `docs/harness/ACHIEVEMENTS_SYNC.md` only for achievements sync documentation tasks
- `scripts/sync-achievements-reports.ps1` only for local achievements report sync tasks
- `.gitignore` only to keep local `reports/` out of Git

Forbidden:

- editing `scripts/fetchAchievements.js` unless explicitly requested
- achievements page UI
- homepage UI
- layout files
- Navbar
- other pages
- package or environment files

Manual sync harness rule:

- The workflow may execute `node scripts/fetchAchievements.js`.
- Generic prompts such as `更新網站`, `更新網頁`, `更新网页`, `更新一下網站`, or `更新一下網頁` count as explicit permission for Codex to run `node scripts/fetchAchievements.js` for achievements data sync unless another content domain is named.
- Manual sync mode may commit and push only `src/data/achievements.json`.
- Manual sync reports must be pushed to `automation-reports`, not `main`.
- Local copies of reports must stay in the ignored `reports/` folder.
- The workflow must upload the pre-sync `src/data/achievements.json` as an artifact.
- The workflow must stop on invalid JSON, empty data, missing required fields, or a 30% or larger item-count drop.
- If any other file changes, the workflow must fail before build, commit, or push.
- If build fails, the workflow must fail before commit or push.

## Activities Tasks

Allowed only when explicitly requested:

- `src/pages/activities.astro`
- `src/pages/activities/[id].astro`

Usually, new activity albums should be handled in Cloudinary without repository changes.

Forbidden:

- Cloudinary environment variable names
- Cloudinary API logic unless explicitly requested
- `getStaticPaths()` unless explicitly requested
- album route rules
- `.env`
- unrelated pages
- layout files
- Navbar

## UI Refactor Tasks

Allowed:

- Only UI files explicitly named by the user.
- Typical future scopes may include `src/layouts/`, `src/components/`, `src/pages/`, or `src/styles/`.

Forbidden:

- content facts and records
- `src/data/achievements.json`
- news/FAQ/members data edits unless separately routed
- Cloudinary API logic
- `scripts/fetchAchievements.js`
- `.env`
- package files

## Localization Tasks

Allowed:

- Explicitly scoped English pages under `src/pages/en/`.
- Explicitly scoped language support in `src/layouts/BaseLayout.astro`.
- Explicitly scoped bilingual navigation support in `src/components/Navbar.astro`.
- Localization-related agent and harness documentation when the task is about workflow rules.

Forbidden:

- full-site translation in a single task
- translating names, project titles, paper titles, award names, or activity album names unless explicitly requested
- content data migration
- Cloudinary API logic
- `scripts/fetchAchievements.js`
- `.env`
- package files

## SEO Content Tasks

Allowed:

- Only SEO/content files explicitly named by the user.
- Typical future scopes may include page metadata, BaseLayout metadata props, or future `src/data/seo.*`.

Forbidden:

- functional JavaScript logic
- routing behavior
- Cloudinary API logic
- scraper logic
- invented claims, awards, people, dates, or metrics
- `.env`
- package files

## QA Release Tasks

Allowed:

- read-only checks
- `npm.cmd run build`
- fast-forward pull, merge, and push when requested
- validating manual achievements sync workflow rules

Forbidden:

- file edits
- staging
- new commits
- conflict resolution
- force push
- hard reset
- clean
- force push in manual achievements sync

## Backup Recovery Tasks

Allowed:

- `.codex/agents/backup-recovery.toml`
- `.codex/agents/site-manager.toml`
- `.codex/agents/qa-release.toml`
- `.github/workflows/backup-repo-snapshot.yml`
- `.github/workflows/sync-achievements.yml` only for backup/guardrail additions
- `docs/harness/BACKUP_RECOVERY.md`
- related harness docs, including routing, release checklist, file scope, and achievements sync docs
- `AGENTS.md`
- `MAINTENANCE.md`

Forbidden:

- website content code
- `src/pages/`
- `src/components/`
- `src/layouts/`
- `public/`
- `scripts/fetchAchievements.js`
- package files
- `.env`
- `astro.config.mjs`
- production push without QA Release Agent
- secrets, tokens, or Deploy Hook URLs in Git-tracked files
- destructive Git commands

Checkpoint rule:

- Major refactors, data migrations, batch image changes, workflow changes, and deletion tasks require a checkpoint discussion first.
- Deletion tasks require both a checkpoint and explicit user confirmation before any delete operation.

## Site Manager Framework Tasks

Allowed:

- `.codex/config.toml`
- `.codex/agents/*.toml`
- `docs/harness/*.md`
- `docs/agents/*.md`
- `AGENTS.md`
- `MAINTENANCE.md`

Forbidden:

- website feature code unless explicitly scoped
- generated output
- dependency files
- environment files

## Long-Term Data Migration Note

News, FAQ, and Members are still embedded in `.astro` files. Long-term maintenance would improve if they are gradually migrated to `src/data/`, but that migration must be a separate explicit task. Do not perform data migration during ordinary content updates.

## Out-of-Scope Rule

When any command or diff reveals files outside the requested scope:

1. Stop.
2. Do not stage, commit, merge, or push.
3. Report the unexpected files.
4. Ask the user how to proceed.
