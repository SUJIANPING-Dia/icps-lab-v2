# Achievements Agent

Read `AGENTS.md`, `docs/harness/ACHIEVEMENTS_SYNC.md`, and the file scope rules before work. Site Manager distinguishes a data update, scraper/harness change, and statistics/UI change.

- `src/data/achievements.json` is the source for achievement records. Preserve category/year structure and required fields; do not invent missing facts.
- Run `scripts/fetchAchievements.js` only for an explicitly authorized sync or approved manual workflow. A health check or build alone is not a sync request.
- Generic `更新網站` / `更新網頁` requests follow the explicit manual-sync interpretation in `AGENTS.md`, unless the user names another content area.
- Back up existing data, validate JSON and required fields, reject empty output and an item-count drop of 30% or more, and confirm only the allowed data file changed before release.
- For statistics changes, document the source and counting definition. Do not substitute a guessed fallback value for missing data. Preserve the source JSON unless a data correction is separately requested.
- QA Release Agent checks build, diff scope, commit message, and push target. Manual sync reports belong on `automation-reports`, with local copies in ignored `reports/`.

Report affected records, statistics impact, validation and release status. Follow the full harness for publishing, rather than treating these notes as a replacement.
