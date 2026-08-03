# Project Maintenance Guide for Codex Agents

## Project Overview

This repository is an Astro-based website for the iCPS Lab. It is primarily a static content site with client-side interactions for navigation, news expansion, FAQ search, achievements filtering/search, member tabs, visitor count, and Cloudinary-powered activity albums.

The main pages now share:

- `src/layouts/BaseLayout.astro`
- `src/components/Navbar.astro`

The achievements content is data-driven through `src/data/achievements.json`. News, FAQ, and Members content are still embedded in `.astro` files and should be migrated to `src/data/` only as a separate explicit future task.

## Tech Stack

- Astro 6
- Tailwind CSS 3
- PostCSS with Autoprefixer
- Vanilla browser JavaScript inside `.astro` pages/components
- Node.js scripts using `axios` and `cheerio`
- Cloudinary REST API for activity albums
- GitHub Actions for manual achievements sync and scheduled repository snapshot backups
- Static assets served from `public/images`

## Directory Responsibilities

- `src/pages`: Astro routes and page-level composition.
- `src/components`: Reusable Astro components such as navbar, news, videos, and future shared UI.
- `src/layouts`: Shared page shells such as `BaseLayout.astro`.
- `src/data`: Structured site data. `achievements.json` is the current primary data file.
- `src/styles`: Global CSS entry point.
- `public/images`: Static committed site images.
- `scripts`: Maintenance scripts. Run only when explicitly requested or inside approved automation.
- `dist`, `.astro`, `node_modules`: Generated or local build/dependency output. Do not edit manually.

## Files and Folders That Should Not Be Edited

Do not edit these unless the user explicitly asks for that exact change:

- `.env`
- `node_modules/`
- `dist/`
- `.astro/`
- `package.json`
- `package-lock.json`
- generated build output
- dependency cache files

During normal maintenance, avoid changing:

- `scripts/fetchAchievements.js` unless the task is specifically about the scraper
- `src/data/achievements.json` unless the task is specifically about achievements data
- Cloudinary API logic unless explicitly scoped
- large image assets unless explicitly scoped

Never modify unrelated files just because they are nearby.

## Environment and Security Rules

- Treat `.env` as private. Never print, copy, rewrite, or commit secrets.
- Do not hard-code credentials, API keys, tokens, Deploy Hook URLs, or private URLs in source files.
- Cloudinary credentials must stay in environment variables.
- Vercel Deploy Hook URLs must stay outside Git and must not be displayed in full.
- Before creating or editing files, check `git status --short` when the user requests a safe maintenance flow.
- If unexpected uncommitted changes are present, stop and report them before editing.
- Do not commit generated directories or local dependency folders.

## Site Manager and Agent Routing

All maintenance tasks are controlled by Site Manager Agent by default. Site Manager Agent must identify the task type, choose the correct specialized agent, confirm file scope, and decide whether QA Release Agent is needed.

Every response must begin with this block:

```text
【執行 Agent】
總控：Site Manager Agent
實作：<Agent Name>
階段：<Planning / Editing / Build / Commit / Merge / Push / Review>
狀態：<Ready / In Progress / Blocked / Done>
```

Routing rules:

- News tasks: use News Agent (`.codex/agents/news.toml`) and read `docs/agents/NEWS_AGENT.md`.
- FAQ tasks: use FAQ Agent (`.codex/agents/faq.toml`) and read `docs/agents/FAQ_AGENT.md`.
- Members tasks: use Members Agent (`.codex/agents/members.toml`) and read `docs/agents/MEMBERS_AGENT.md`.
- Achievements tasks: use Achievements Agent (`.codex/agents/achievements.toml`) and read `docs/agents/ACHIEVEMENTS_AGENT.md`.
- Achievements manual sync tasks: use Achievements Agent and `docs/harness/ACHIEVEMENTS_SYNC.md`; QA Release Agent validates build, commit message, diff scope, and push target.
- Activities or Cloudinary album tasks: use Activities Agent (`.codex/agents/activities.toml`) and read `docs/agents/ACTIVITIES_AGENT.md`.
- Cloudinary album/photo refresh or redeploy tasks: route to Activities Agent first, then QA Release Agent must follow `docs/harness/CLOUDINARY_VERCEL_REDEPLOY.md`.
- English-version pages, bilingual navigation, EN/CH switching, or selective translation tasks: use Localization Agent (`.codex/agents/localization.toml`).
- UI redesign, RWD, layout, or component refactor tasks: use UI Refactor Agent (`.codex/agents/ui-refactor.toml`).
- SEO title, description, structured content, or SEO copy tasks: use SEO Content Agent (`.codex/agents/seo-content.toml`).
- Backup checkpoint, disaster recovery, repository snapshot, restore planning, workflow backup, or deletion-prep tasks: use Backup Recovery Agent (`.codex/agents/backup-recovery.toml`).
- Build, diff, merge, push, or release tasks: use QA Release Agent (`.codex/agents/qa-release.toml`) and read `docs/agents/QA_RELEASE_AGENT.md`.
- Agent framework or routing documentation tasks may be handled by Site Manager Agent.

Content modification tasks must not be performed by a default/general agent. They must be routed through the matching specialized agent first.

Build, merge, push, and release tasks must use QA Release Agent. Any task involving a production push must follow QA Release Agent flow.

If a task type is unclear, ask the user before choosing an agent or editing files. Do not guess.

If `.codex/agents/*.toml`, `docs/harness/*.md`, or an agent playbook conflicts with this `AGENTS.md`, this `AGENTS.md` has the highest priority.

## Backup and Recovery Rules

- Before major refactors, data migrations, batch image adjustments, or workflow changes, Site Manager Agent must ask whether to create a backup checkpoint.
- If a task involves deleting files, create or confirm a checkpoint and get explicit user confirmation before deleting anything.
- Backup and recovery tasks must be routed to Backup Recovery Agent.
- Backup Recovery Agent must not modify website content, expose secrets, or push production by itself.
- Release, merge, push, and production deployment steps still belong to QA Release Agent.
- Use Git commits or tags for code checkpoints, GitHub Actions artifacts for repository snapshots and achievements JSON backups, Vercel rollback for production deployment recovery, and Cloudinary restore tools for deleted activity media when available.

## Content Management Rules

- Prefer structured data files in `src/data` for repeatable content.
- Good future data-file candidates: site navigation, footer contact information, members, FAQ, news, videos, homepage featured works, hero slides, and research cards.
- Keep page files focused on rendering and composition.
- Preserve Traditional Chinese copy unless the user asks for rewriting or translation.
- Do not run content scraping scripts unless explicitly requested or inside approved automation.
- For HTML-rich news content, be careful with `set:html`; only render trusted local content.

## Manual Website Update Prompt Rule

- If the user says `更新網站`, `更新網頁`, `更新网页`, `更新一下網站`, `更新一下網頁`, or a close equivalent without naming a more specific content area, treat it as an explicit achievements scraper update request.
- Route the task to Achievements Agent first, then QA Release Agent for build, commit, push, and production verification.
- The default action is to run `node scripts/fetchAchievements.js`, validate `src/data/achievements.json`, confirm only that file changed, run `npm.cmd run build`, commit the data change, and push to `main` so the website updates.
- If the scraper produces no data diff, do not create a commit or push; report that the website was already up to date.
- If the user specifies another content domain, such as news, members, FAQ, activities, Cloudinary, UI, or SEO, route to that specialized flow instead of treating the prompt as an achievements scraper update.

## UI Maintenance Rules

- Preserve the existing visual identity, Tailwind utility style, lab/university branding, and responsive behavior.
- Keep mobile behavior intact when touching navbar, tabs, search, accordions, modals, counters, or galleries.
- Avoid broad redesigns during content/data tasks.
- After UI changes, run a build and visually inspect affected pages when practical.

## Image Asset Rules

- Reference committed images with `/images/...` paths from `public/images`.
- Add images only when explicitly provided or approved by the user.
- Keep image names descriptive and stable.
- Do not delete images unless the task is explicitly about asset cleanup and references have been checked.

## Cloudinary Rules

- Activity albums are loaded from Cloudinary in `src/pages/activities.astro` and `src/pages/activities/[id].astro`.
- Do not expose Cloudinary API secrets in client-side code or documentation.
- Do not change Cloudinary folder conventions without explicit approval.
- Adding or updating Cloudinary activity albums usually does not require website code changes.
- Because Astro generates activity pages during build, Cloudinary-only updates require a Vercel redeploy before production reflects latest albums/photos.
- Only QA Release Agent may trigger Cloudinary-related Vercel redeploys, and only after the user explicitly says Cloudinary upload/update is complete and asks to redeploy.

## Script Execution Rules

- Do not run `scripts/fetchAchievements.js` unless the user explicitly asks or the manual GitHub Actions achievements sync harness is executing.
- Generic prompts such as `更新網站` or `更新網頁` count as explicit permission to run `scripts/fetchAchievements.js` for achievements data sync, unless the user names a different content domain.
- That script writes to `src/data/achievements.json`; inspect diffs after running it.
- The manual achievements sync harness may only commit and push `src/data/achievements.json`.
- If `scripts/fetchAchievements.js` changes any other file, the harness must fail before build, commit, or push.
- The manual achievements sync harness must upload a pre-sync artifact, validate JSON, block empty data, block missing required fields, block a 30% or larger item-count drop, and run a build before committing and pushing.
- The manual achievements sync harness must generate report files for every run and push them to the separate `automation-reports` branch, not to `main`.
- Achievements sync reports must include both date summary files and unique per-run files so manual GitHub `workflow_dispatch` runs are preserved locally after report sync.
- Local sync reports may be copied into the ignored `reports/` folder with `scripts/sync-achievements-reports.ps1`.
- Manual achievements sync must not use force push, Cloudinary flows, or Vercel Deploy Hook.
- Do not run destructive shell commands.

## Development and Build Commands

- Install dependencies: `npm install`
- Start local development server: `npm run dev`
- Build production site: `npm run build`
- Preview production build: `npm run preview`
- Astro CLI passthrough: `npm run astro -- --help`

## Harness Documents

- `docs/harness/AGENT_ROUTING.md`
- `docs/harness/RESPONSE_PROTOCOL.md`
- `docs/harness/RELEASE_CHECKLIST.md`
- `docs/harness/CLOUDINARY_VERCEL_REDEPLOY.md`
- `docs/harness/ACHIEVEMENTS_SYNC.md`
- `docs/harness/BACKUP_RECOVERY.md`
- `docs/harness/CONTENT_UPDATE_FLOW.md`
- `docs/harness/FILE_SCOPE_RULES.md`
- `docs/harness/AGENTS_ARCHITECTURE.md`

## Working Rules for Codex

- Follow the user's file-scope restrictions exactly.
- If only one file is allowed, edit only that file.
- Start with read-only inspection when asked to analyze.
- Use `rg` or `rg --files` for fast codebase inspection.
- Use small, reviewable changes.
- Prefer `apply_patch` for manual file edits.
- Preserve unrelated user changes. Never revert user work without explicit permission.
- If uncommitted changes appear unexpectedly, stop and ask how to proceed.
- After edits, run only the verification commands relevant to the requested scope.
- Report what changed, what was not changed, and any commands that were run.

## Required Final Report Format

Every maintenance task should end with a concise report containing:

- Files changed
- Files intentionally not changed
- Commands run
- Verification result
- Current `git status --short`
- Notes or risks
- Suggested next task

If the task was stopped for safety, report:

- Why it stopped
- The exact command output that triggered the stop
- No-file-change confirmation
