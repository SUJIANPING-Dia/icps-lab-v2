# Agent Routing

All website maintenance tasks should start with Site Manager Agent. Site Manager Agent decides the task type, selects the correct specialized agent, checks file-scope rules, and decides whether QA Release Agent is required.

## Site Manager Agent Role

Site Manager Agent is the controller for the ICPS Lab Astro website maintenance workflow.

Responsibilities:

- Identify the task type before editing.
- Route the task to one specialized agent.
- Confirm the allowed file scope.
- Split mixed tasks into separate smaller tasks.
- Require QA Release Agent for build, diff, merge, push, and production release checks.
- Require every response to include the agent identity block from `docs/harness/RESPONSE_PROTOCOL.md`.
- Ask the user when the task type or file scope is unclear.

## Task Routing Table

| Task type | Agent | Main scope |
| --- | --- | --- |
| Add, edit, remove, or reorder news | News Agent | `src/components/News.astro`, optional user-provided images |
| Add, edit, remove, or reorder FAQ | FAQ Agent | `src/pages/faq.astro` |
| Add, edit, remove, or reorder members | Members Agent | `src/pages/members.astro`, optional user-provided photos |
| Add or update achievements data | Achievements Agent | `src/data/achievements.json` |
| Scheduled achievements data sync | Achievements Agent -> QA Release Agent | GitHub Actions harness; only `src/data/achievements.json` may be auto-committed |
| Maintain activity albums or activity pages | Activities Agent | Cloudinary first; code only when explicitly requested |
| Cloudinary album/photos uploaded or updated | Activities Agent -> QA Release Agent | No code edit; Vercel redeploy only when explicitly requested |
| UI redesign, RWD, layout, component refactor | UI Refactor Agent | Explicitly scoped UI files only |
| SEO title, description, structured content, SEO copy | SEO Content Agent | Explicitly scoped SEO/content files only |
| Build, diff, merge, push, release checks | QA Release Agent | Commands only, no content edits |
| Unclear or mixed task | Site Manager Agent | Ask first or split into smaller tasks |

## When To Split Tasks

Split a request when it touches more than one content domain, for example:

- News plus FAQ updates.
- Members plus achievements updates.
- Activity album changes plus release push.
- UI refactor plus content updates.
- SEO metadata plus UI refactor.

Complete one scoped task, verify it, and then start the next task.

## When To Use QA Release Agent

Use QA Release Agent for:

- `npm.cmd run build`
- `git diff --stat`
- `git diff --name-status`
- fast-forward merge into `main`
- push to `origin/main`
- release-readiness review
- Vercel Deploy Hook redeploy after Cloudinary-only activity album updates, only when the user explicitly requests it
- Scheduled achievements sync validation: diff scope, build success, commit message, push target, and no force push

QA Release Agent must not edit files, stage changes, create commits, resolve conflicts, or force push.

For Cloudinary redeploy tasks, QA Release Agent must also avoid Git commits and Git pushes, check for a clean working tree, verify `$env:VERCEL_DEPLOY_HOOK_URL` exists without printing it, and follow `docs/harness/CLOUDINARY_VERCEL_REDEPLOY.md`.

For scheduled achievements sync tasks, QA Release Agent validates the workflow rules in `docs/harness/ACHIEVEMENTS_SYNC.md`. The workflow can run `node scripts/fetchAchievements.js`, but it can commit and push only `src/data/achievements.json` after a successful build.

## Unclear Task Rule

If the task type, allowed files, branch target, or release intent is unclear:

1. Stop.
2. Set response status to `Blocked`.
3. Ask the user for clarification.
4. Do not guess the agent or edit files.
