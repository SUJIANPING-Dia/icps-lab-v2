# Project Maintenance Guide for Codex Agents

## Project Overview

This repository is an Astro-based website for the iCPS Lab. It is primarily a static content site with interactive client-side behavior for navigation, news expansion, FAQ search, achievements search, member tabs, visitor count, and Cloudinary-powered activity albums.

The current codebase is mostly page-centric: major pages contain their own markup, Tailwind classes, inline styles, inline scripts, and repeated navbar/footer/counter code. The achievements content is already data-driven through `src/data/achievements.json`; several other content areas are still embedded directly inside `.astro` files.

## Tech Stack

- Astro 6
- Tailwind CSS 3
- PostCSS with Autoprefixer
- Vanilla browser JavaScript inside `.astro` pages/components
- Node.js scripts using `axios` and `cheerio`
- Cloudinary REST API for activity albums
- Static assets served from `public/images`

## Directory Responsibilities

- `src/pages`: Astro routes. This folder owns page-level composition and routing only. Avoid placing large reusable data or duplicated layout code here when a dedicated component or data file is more appropriate.
- `src/components`: Reusable Astro components. Current examples include `News.astro` and `Videos.astro`. Future shared UI such as navbar, footer, layout, counters, cards, tabs, accordions, and media grids should live here.
- `src/data`: Structured site data. `achievements.json` is the current primary data file. New structured data for members, FAQ, news, videos, homepage featured works, and site navigation should be added here when content is being made easier to maintain.
- `src/styles`: Global CSS entry point. Keep global styles small and intentional; prefer component-local styles or Tailwind classes unless behavior must be shared.
- `public/images`: Static image assets referenced by the site. Use this for committed site images, logos, placeholders, news images, member photos, and hero images.
- `scripts`: Maintenance scripts. Scripts may read external sources and may write generated data files, so they must only be run when explicitly requested.
- `dist`, `.astro`, `node_modules`: Generated or local build/dependency output. Do not edit manually.

## Files and Folders That Should Not Be Edited

Do not edit these unless the user explicitly asks for that exact change:

- `.env`
- `node_modules/`
- `dist/`
- `.astro/`
- `package-lock.json`
- `package.json`
- generated build output
- dependency cache files

During normal content or UI maintenance, avoid changing:

- `scripts/fetchAchievements.js` unless the task is specifically about the scraper
- `src/data/achievements.json` unless the task is specifically about achievements data
- large image assets unless the task is specifically about image replacement or optimization

Never modify unrelated files just because they are nearby.

## Environment and Security Rules

- Treat `.env` as private. Never print, copy, rewrite, or commit secrets.
- Cloudinary credentials must stay in environment variables:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Do not hard-code credentials, API keys, tokens, or private URLs in source files.
- Before creating or editing files, check `git status --short` when the user requests a safe maintenance flow.
- If unexpected uncommitted changes are present, stop and report them before editing.
- Do not commit generated directories or local dependency folders.

## Content Management Rules

- Prefer structured data files in `src/data` for repeatable content.
- Good candidates for data files:
  - site navigation and footer contact information
  - members, assistants, students, project summaries
  - FAQ categories and questions
  - news items and pinned news
  - YouTube video IDs
  - homepage featured works/posters
  - hero slides and research cards
- Keep page files focused on rendering and composition.
- When editing existing content, preserve Traditional Chinese copy unless the user asks for rewriting or translation.
- Do not run content scraping scripts unless explicitly requested.
- For HTML-rich news content, be careful with `set:html`; only render trusted local content.

## UI Maintenance Rules

- Preserve the existing visual identity: white/slate surfaces, blue accents, lab/university branding, Tailwind utility-first styling, and responsive layouts.
- When reducing duplication, extract shared UI gradually:
  - `BaseLayout.astro`
  - `Navbar.astro`
  - `Footer.astro`
  - `VisitorCounter.astro`
  - shared card/list/tab/accordion components
- Keep mobile behavior intact when touching navbar, tabs, search, accordions, or galleries.
- Reuse existing interaction patterns before introducing new ones.
- Avoid broad redesigns during content/data tasks.
- After UI changes, run a build and visually inspect affected pages when practical.

## Image Asset Rules

- Reference committed images with `/images/...` paths from `public/images`.
- Before adding new images, check whether an existing asset can be reused.
- Keep image names descriptive and stable.
- Avoid committing unnecessarily large images. Large assets should be optimized when the task is about asset cleanup.
- Known asset hygiene items to check in future tasks:
  - `/images/default-avatar.png` is referenced but not currently present.
  - `/images/team-group.jpg` is referenced but not currently present.
  - Some images may be unused, such as older hero or placeholder assets.
- Do not delete images unless the task is explicitly about asset cleanup and references have been checked.

## Cloudinary Rules

- Activity albums are loaded from Cloudinary in:
  - `src/pages/activities.astro`
  - `src/pages/activities/[id].astro`
- Do not expose Cloudinary API secrets in client-side code or documentation.
- Keep Cloudinary fetch logic server-side in Astro frontmatter or dedicated server utilities.
- If refactoring, centralize Cloudinary album/folder fetching into a shared utility.
- Handle missing credentials and API failures gracefully.
- Do not change Cloudinary folder conventions without explicit user approval. Current convention expects event albums under `events/...`.

## Script Execution Rules

- Do not run `scripts/fetchAchievements.js` unless the user explicitly asks.
- That script writes to `src/data/achievements.json`; inspect diffs after running it.
- Do not run destructive shell commands.
- Do not delete or regenerate `dist`, `.astro`, or `node_modules` as part of ordinary maintenance.
- Use `npm run build` for verification after code changes when allowed.
- Use `npm run dev` only when a local preview is needed.

## Development and Build Commands

- Install dependencies: `npm install`
- Start local development server: `npm run dev`
- Build production site: `npm run build`
- Preview production build: `npm run preview`
- Astro CLI passthrough: `npm run astro -- --help`

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
