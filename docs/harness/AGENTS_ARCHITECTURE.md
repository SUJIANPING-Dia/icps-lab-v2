# ICPS Lab Website Agents Architecture

This document describes the current Codex agent architecture for long-term maintenance of the ICPS Lab Astro website.

## 1. Control Model

All tasks start with Site Manager Agent.

```text
User request
  |
  v
Site Manager Agent
  |
  +-- News Agent
  +-- FAQ Agent
  +-- Members Agent
  +-- Achievements Agent
  +-- Activities Agent
  +-- Localization Agent
  +-- UI Refactor Agent
  +-- SEO Content Agent
  +-- QA Release Agent
```

Site Manager Agent classifies the task, checks file scope, and routes execution to exactly one implementation agent whenever possible. Mixed tasks should be split into smaller tasks.

## 2. Established Agents

These agents now have concrete `.codex/agents/*.toml` definitions.

| Agent | Config | Purpose |
| --- | --- | --- |
| Site Manager Agent | `.codex/agents/site-manager.toml` | Routing, scope control, task splitting |
| News Agent | `.codex/agents/news.toml` | News items and user-provided news images |
| FAQ Agent | `.codex/agents/faq.toml` | FAQ entries and FAQ categories |
| Members Agent | `.codex/agents/members.toml` | Member records and user-provided member photos |
| Achievements Agent | `.codex/agents/achievements.toml` | Achievements data and achievements sync harness |
| Activities Agent | `.codex/agents/activities.toml` | Cloudinary album workflow and explicitly scoped activity page edits |
| Localization Agent | `.codex/agents/localization.toml` | Selective English pages, bilingual navigation, EN/CH switching |
| UI Refactor Agent | `.codex/agents/ui-refactor.toml` | Layout, RWD, component extraction, UI structure |
| SEO Content Agent | `.codex/agents/seo-content.toml` | Title, description, structured content, SEO copy |
| QA Release Agent | `.codex/agents/qa-release.toml` | Build, diff, release, push, redeploy validation |

## 3. Current Content Ownership

Some content is still embedded in Astro files. This is intentional for now; do not migrate content unless the user asks for a separate data migration task.

| Content area | Current location | Owning agent |
| --- | --- | --- |
| News | `src/components/News.astro` | News Agent |
| FAQ | `src/pages/faq.astro` | FAQ Agent |
| Members | `src/pages/members.astro` | Members Agent |
| Achievements | `src/data/achievements.json` | Achievements Agent |
| Activities albums | Cloudinary, rendered by `src/pages/activities*.astro` | Activities Agent |
| English pages | `src/pages/en/` plus shared language support | Localization Agent |
| SEO metadata | Page/layout frontmatter and BaseLayout props | SEO Content Agent |
| Shared UI | `src/layouts/`, `src/components/`, page composition | UI Refactor Agent |

## 4. Long-Term Data Migration Candidates

Recommended future migrations:

- Move news items from `src/components/News.astro` to `src/data/news.json` or `src/data/news.ts`.
- Move FAQ entries from `src/pages/faq.astro` to `src/data/faq.json` or `src/data/faq.ts`.
- Move members data from `src/pages/members.astro` to `src/data/members.json` or `src/data/members.ts`.
- Consider structured SEO metadata in `src/data/seo.ts` after page metadata stabilizes.

Do not perform these migrations during ordinary content updates.

## 5. Agent Capabilities And Boundaries

### Site Manager Agent

Can:

- Classify tasks.
- Route to specialized agents.
- Check file scope.
- Split mixed tasks.
- Decide when QA Release Agent is required.

Cannot:

- Guess unclear task scope.
- Bypass specialized content agents.
- Bypass QA Release Agent for release, push, or redeploy tasks.
- Use destructive Git commands.

### News Agent

Can:

- Add, edit, remove, or reorder news.
- Add user-provided news images.
- Update news image paths and alt text.

Cannot:

- Edit homepage layout.
- Edit unrelated pages/components.
- Edit achievements data.
- Run or edit the achievements scraper.
- Migrate news to `src/data` unless explicitly requested.

### FAQ Agent

Can:

- Add, edit, remove, or reorder FAQ entries.
- Preserve existing search, tabs, and accordion behavior.

Cannot:

- Edit layout, Navbar, or unrelated pages.
- Move FAQ to `src/data` unless explicitly requested.
- Change FAQ-unrelated page behavior.

### Members Agent

Can:

- Add, edit, remove, or reorder member records.
- Add user-provided member photos.
- Preserve member categories and internal tabs/nav.

Cannot:

- Edit layout, Navbar, or unrelated pages.
- Migrate members to `src/data` unless explicitly requested.
- Invent member details or photos.

### Achievements Agent

Can:

- Edit `src/data/achievements.json`.
- Maintain the achievements sync workflow and docs.
- Allow GitHub Actions to run `node scripts/fetchAchievements.js`.

Cannot:

- Edit `scripts/fetchAchievements.js` unless explicitly requested.
- Edit achievements page UI or homepage UI.
- Auto-commit anything except `src/data/achievements.json` in sync mode.
- Commit/push if build fails or safety checks fail.

### Activities Agent

Can:

- Decide whether album work belongs in Cloudinary.
- Route Cloudinary-only refreshes to QA Release Agent for redeploy.
- Edit activity page code only when explicitly scoped.

Cannot:

- Edit `.env`.
- Expose Cloudinary secrets.
- Change Cloudinary API logic, `getStaticPaths()`, or album route rules unless explicitly requested.
- Trigger Vercel Deploy Hook directly.

### Localization Agent

Can:

- Add selective English routes such as `/en/about`.
- Add EN/CH switching and bilingual navigation support.
- Translate page-level headings, metadata, and explanatory copy.
- Preserve formal names while adding English context.

Cannot:

- Translate people names, project titles, paper titles, award names, or activity album names unless explicitly requested.
- Create a full-site English version in one task.
- Migrate News, FAQ, Members, Achievements, or Activities data.
- Edit Cloudinary API logic, scraper scripts, package files, or `.env`.

### UI Refactor Agent

Can:

- Refactor shared layout and UI components.
- Improve RWD and accessibility.
- Extract repeated UI structure when scoped.

Cannot:

- Change content facts or data.
- Migrate content to `src/data` unless explicitly requested.
- Edit scraper, Cloudinary API logic, package files, or `.env`.

### SEO Content Agent

Can:

- Update title and description metadata.
- Improve SEO copy and structured headings.
- Propose structured SEO content.

Cannot:

- Change functional JavaScript logic.
- Change routing, Cloudinary logic, scraper logic, or UI behavior.
- Invent claims, awards, people, dates, or metrics.

### QA Release Agent

Can:

- Run build and diff checks.
- Validate allowed file scope.
- Push approved release commits to `main`.
- Trigger Vercel redeploy only for explicitly approved Cloudinary refresh tasks.
- Validate manual achievements sync safety rules.

Cannot:

- Edit content.
- Use force push.
- Use `git reset --hard` or `git clean`.
- Resolve conflicts without explicit authorization.
- Display or store Deploy Hook URLs.

## 6. Harness Documents

| File | Role |
| --- | --- |
| `docs/harness/AGENT_ROUTING.md` | Task routing table |
| `docs/harness/FILE_SCOPE_RULES.md` | Allowed and forbidden file scope |
| `docs/harness/CONTENT_UPDATE_FLOW.md` | Content update workflows |
| `docs/harness/ACHIEVEMENTS_SYNC.md` | Manual achievements sync workflow |
| `docs/harness/RELEASE_CHECKLIST.md` | Release checks |
| `docs/harness/AGENTS_ARCHITECTURE.md` | Agent architecture overview |

## 7. Universal Prohibitions

No agent may:

- Edit `.env`.
- Expose secrets or Deploy Hook URLs.
- Use `git push --force`.
- Use `git reset --hard`.
- Use `git clean`.
- Modify unapproved files.
- Commit generated output, `dist/`, `.astro/`, or `node_modules/`.
