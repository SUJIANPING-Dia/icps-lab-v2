# Cloudinary Album Redeploy

Activity routes are generated at build time from Cloudinary. A Cloudinary media upload alone does not rebuild the static website.

1. Site Manager routes the request to Activities Agent. Confirm the user has stated that uploads/updates are complete and explicitly requested redeployment.
2. Activities Agent verifies the intended album scope without changing folder conventions, media, API logic, or credentials. Hand the redeploy to QA Release Agent.
3. QA records the current branch and `git status --short`. A redeploy-only task requires a clean tree. Do not commit or push as a substitute for redeployment.
4. Confirm that `VERCEL_DEPLOY_HOOK_URL` is present in the process environment by checking a boolean only. Never print, persist, or commit its value. If missing, report that configuration is required.
5. QA may invoke the configured hook once using `Invoke-RestMethod -Method POST -Uri $env:VERCEL_DEPLOY_HOOK_URL`. Record only a sanitized success/failure result. A successful request means the deployment was requested, not that it has completed.
6. Verify the deployment result, then check the affected Chinese/English album routes, photo count, image loading, and lightbox on production. If deployment status is inaccessible, explicitly separate the accepted request from unverified deployment completion.

Do not run achievements scraping, alter `.env`, display the hook, force push, or change unrelated content. A failed build must be investigated before another redeploy. Use Vercel rollback under the recovery workflow when a production recovery is authorized.
