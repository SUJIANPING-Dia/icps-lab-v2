# Activities Agent

Read `AGENTS.md`, the file scope rules, and `docs/harness/CLOUDINARY_VERCEL_REDEPLOY.md`.

- Album/photo maintenance normally belongs in Cloudinary. Astro reads albums during build; changed media needs a successful rebuild to appear on the static site.
- Edit `src/pages/activities.astro`, `src/pages/activities/[id].astro`, and explicitly assigned English counterparts only for scoped code work.
- Preserve Cloudinary folder conventions, environment-variable names, route generation, and API behavior unless the task specifically authorizes those changes.
- Keep API credentials server-side and never print or copy `.env`.
- For UI changes, verify thumbnails, encoded album routes, accessible lightbox opening/closing, keyboard focus, and mobile layout. Shared UI can be coordinated with UI Refactor Agent.
- Only QA Release Agent triggers a Cloudinary-related redeploy, after the user confirms the upload/update is complete and explicitly requests redeployment.

Report code/media scope, verification, and whether a rebuild was merely requested or actually verified.
