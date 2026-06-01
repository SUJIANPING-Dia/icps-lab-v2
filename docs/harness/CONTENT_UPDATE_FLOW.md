# Content Update Flow

Site Manager Agent must route every content update to the matching specialized agent before editing. Use `docs/harness/AGENT_ROUTING.md` and `docs/harness/FILE_SCOPE_RULES.md` to confirm scope.

Every response must follow `docs/harness/RESPONSE_PROTOCOL.md`.

## 1. Add News

Use:

- `.codex/agents/news.toml`
- `docs/agents/NEWS_AGENT.md`

Flow:

1. Site Manager Agent routes the task to News Agent.
2. Inspect `src/components/News.astro`.
3. Add or update the news item in the existing format.
4. Add images to `public/images/` only if the user provided them.
5. Run `npm.cmd run build`.
6. Confirm only allowed files changed.
7. Commit with `Add news item: <short title>` or `Update news item: <short title>`.

## 2. Add or Update FAQ

Use:

- `.codex/agents/faq.toml`
- `docs/agents/FAQ_AGENT.md`

Flow:

1. Site Manager Agent routes the task to FAQ Agent.
2. Inspect the FAQ data inside `src/pages/faq.astro`.
3. Add, edit, remove, or reorder FAQ entries in the existing structure.
4. Preserve FAQ search, tabs, and accordion scripts.
5. Run `npm.cmd run build`.
6. Confirm only `src/pages/faq.astro` changed.
7. Commit with `Update FAQ content`.

## 3. Update Members

Use:

- `.codex/agents/members.toml`
- `docs/agents/MEMBERS_AGENT.md`

Flow:

1. Site Manager Agent routes the task to Members Agent.
2. Inspect `src/pages/members.astro`.
3. Update the matching member category.
4. Add photos to `public/images/` only if the user provided them.
5. Preserve members page internal tabs/nav and grouping logic.
6. Run `npm.cmd run build`.
7. Confirm only allowed files changed.
8. Commit with `Update members content`.

## 4. Update Achievements

Use:

- `.codex/agents/achievements.toml`
- `docs/agents/ACHIEVEMENTS_AGENT.md`
- `docs/harness/ACHIEVEMENTS_SYNC.md` for scheduled automatic sync

Flow:

1. Site Manager Agent routes the task to Achievements Agent.
2. Inspect `src/data/achievements.json`.
3. Add or update records under the correct category and year.
4. Preserve field names and valid JSON.
5. Do not run `scripts/fetchAchievements.js` unless explicitly requested.
6. Run `npm.cmd run build`.
7. Confirm only `src/data/achievements.json` changed.
8. Commit with `Update achievements data`.

Scheduled sync flow:

1. GitHub Actions runs `Sync Achievements Data` daily at Taiwan time 00:07.
2. The workflow can also be triggered manually with `workflow_dispatch`.
3. The workflow runs `node scripts/fetchAchievements.js`.
4. If no data changes exist, it prints `No achievements changes` and stops.
5. If data changes exist, the workflow confirms only `src/data/achievements.json` changed.
6. If the diff includes any other file, the workflow fails and does not commit or push.
7. If the diff is valid, it runs `npm run build`.
8. Build failure stops the workflow without commit or push.
9. Build success commits `Sync achievements data` and pushes to `main`.
10. Vercel deploys from the new `main` commit automatically.
11. Every run writes a report to the `automation-reports` branch.
12. To view the latest report locally, run `.\scripts\sync-achievements-reports.ps1` and open `reports/achievements-sync/latest.md`.

## 5. Maintain Activity Albums

Use:

- `.codex/agents/activities.toml`
- `docs/agents/ACTIVITIES_AGENT.md`
- `docs/harness/CLOUDINARY_VERCEL_REDEPLOY.md` for Cloudinary-only album refreshes

Flow:

1. Site Manager Agent routes the task to Activities Agent.
2. For a new album, first confirm whether the work should be done in Cloudinary.
3. Preserve the `events/...` Cloudinary folder convention.
4. Do not modify Cloudinary API logic unless explicitly requested.
5. If a code change is requested, limit changes to the exact scoped file.
6. Run `npm.cmd run build` after code changes.
7. Confirm only allowed files changed.
8. Commit with `Update activities content`.

Cloudinary-only refresh flow:

1. If the user says Cloudinary photos were uploaded, a new album was added, or an album was updated, classify the task as Activities refresh / redeploy.
2. Do not modify `src/pages/activities.astro` or `src/pages/activities/[id].astro`.
3. Ask whether Cloudinary upload/update is complete if the user has not clearly said so.
4. When the user explicitly says Cloudinary is complete and asks to redeploy, hand off to QA Release Agent.
5. QA Release Agent follows `docs/harness/CLOUDINARY_VERCEL_REDEPLOY.md`.
6. No Git commit or push is needed for a Cloudinary-only redeploy.

## 6. Release After Content Update

Use QA Release Agent for release work after a content commit exists:

1. Confirm branch and working tree.
2. Fast-forward `main` from `origin/main`.
3. Fast-forward merge the scoped branch.
4. Check `origin/main...HEAD` diff.
5. Run `npm.cmd run build`.
6. Push `origin main` only when requested.

## 7. UI Refactor Flow

Use:

- `.codex/agents/ui-refactor.toml`

Flow:

1. Site Manager Agent confirms this is a UI, RWD, layout, or component refactor task.
2. Scope the exact files before editing.
3. Preserve content data and facts.
4. Run `npm.cmd run build`.
5. Recommend mobile/browser checks for affected pages.

## 8. SEO Content Flow

Use:

- `.codex/agents/seo-content.toml`

Flow:

1. Site Manager Agent confirms this is an SEO title, description, structured content, or SEO copy task.
2. Scope the exact pages or metadata files before editing.
3. Preserve functional logic and factual accuracy.
4. Run `npm.cmd run build`.
5. Report changed metadata/copy and any pages that should be checked after deployment.

## 9. Long-Term Data Migration

News, FAQ, and Members are still embedded in `.astro` files. Future data migration candidates:

- `src/components/News.astro` -> `src/data/news.*`
- `src/pages/faq.astro` -> `src/data/faq.*`
- `src/pages/members.astro` -> `src/data/members.*`

Do not perform these migrations during ordinary content updates. Treat each migration as a separate UI/data refactor task.
