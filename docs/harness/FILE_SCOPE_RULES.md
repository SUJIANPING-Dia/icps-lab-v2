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

Forbidden:

- editing `scripts/fetchAchievements.js` unless explicitly requested
- achievements page UI
- homepage UI
- layout files
- Navbar
- other pages
- package or environment files

Scheduled sync harness rule:

- The workflow may execute `node scripts/fetchAchievements.js`.
- Automatic sync mode may commit and push only `src/data/achievements.json`.
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

## QA Release Tasks

Allowed:

- read-only checks
- `npm.cmd run build`
- fast-forward pull, merge, and push when requested
- validating scheduled achievements sync workflow rules

Forbidden:

- file edits
- staging
- new commits
- conflict resolution
- force push
- hard reset
- clean
- force push in scheduled achievements sync

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

## Out-of-Scope Rule

When any command or diff reveals files outside the requested scope:

1. Stop.
2. Do not stage, commit, merge, or push.
3. Report the unexpected files.
4. Ask the user how to proceed.
