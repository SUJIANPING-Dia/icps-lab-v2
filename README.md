# iCPS Lab website

The bilingual iCPS Lab website at [icps-lab.com](https://icps-lab.com), built as an Astro static site and deployed on Vercel. Activity albums come from Cloudinary at build time; committed images are served from `public/images`.

## Development

Use Node.js **24.x**, matching `.nvmrc`, `package.json`, and the achievements workflow. On Windows use `npm.cmd` if PowerShell blocks the npm script shim.

```sh
npm ci
npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm run build` | Generate the production site in `dist/` |
| `npm run preview` | Serve the latest production build locally |
| `npm test` | Run focused regression checks |
| `npm audit` | Check dependency advisories |
| `node scripts/verify-site.mjs` | Check all built routes, local assets, metadata, sitemap and ARIA references |

Builds that include activity albums need the existing Cloudinary credentials in the environment. Obtain them through the maintainer's private configuration process. Never commit, print, or copy `.env` into reports or backups. A preview is local; it does not update production.

## Where to edit

| Area | Source |
| --- | --- |
| Pages and English counterparts | `src/pages/`, `src/pages/en/` |
| Shared document and metadata | `src/layouts/BaseLayout.astro` |
| Shared navigation and UI | `src/components/` |
| News and bilingual presentation metadata | `src/data/news.ts` |
| Achievements and derived statistics | `src/data/achievements.json` |
| Video records | `src/data/videos.ts` |
| FAQ and member records | Their respective `.astro` pages |
| Static images | `public/images/` |
| Global styles | `src/styles/` |

Maintain Traditional Chinese source copy and existing formal names. Do not run the achievements scraper as part of an ordinary build or UI check.

## Maintenance and release

Read [AGENTS.md](AGENTS.md) and [MAINTENANCE.md](MAINTENANCE.md) before changes. Site Manager assigns content/UI work to the appropriate specialist; QA Release Agent validates builds and handles authorized releases.

- Achievements sync is **manual-only**. Use the [sync harness](docs/harness/ACHIEVEMENTS_SYNC.md); generated run reports belong on `automation-reports`, not `main`.
- Cloudinary updates require a rebuilt deployment. Follow the [redeploy harness](docs/harness/CLOUDINARY_VERCEL_REDEPLOY.md) after uploads are complete and redeployment is requested.
- Before major changes, create and verify a checkpoint following [backup and recovery](docs/harness/BACKUP_RECOVERY.md). Repository snapshots run weekly and on manual dispatch; artifacts are retained for 90 days.
- Keep local reports/backups in ignored `reports/`. Do not commit `dist/`, `.astro/`, `node_modules/`, credentials, or deployment hooks.
- A successful local build is a release prerequisite. Publishing is a separate authorized action under the [release checklist](docs/harness/RELEASE_CHECKLIST.md).
