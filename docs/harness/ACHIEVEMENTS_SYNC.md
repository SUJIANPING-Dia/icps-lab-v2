# Achievements Sync Harness

This harness keeps `src/data/achievements.json` synchronized automatically while protecting production from bad scraper output.

## Schedule

GitHub Actions schedule syntax uses UTC. The workflow runs every day at:

- Taiwan time: 00:07
- UTC time: 16:07 on the previous day
- Cron: `7 16 * * *`

The job intentionally avoids the top of the hour because GitHub Actions scheduled workflows can be delayed during high-traffic times.

## Workflow File

The workflow lives at:

```text
.github/workflows/sync-achievements.yml
```

Workflow name:

```text
Sync Achievements Data
```

Triggers:

- `workflow_dispatch` for manual runs
- scheduled daily run at `7 16 * * *`

Permissions:

- `contents: write`

## Automatic Flow

1. Checkout `main`.
2. Setup Node.js.
3. Run `npm ci`.
4. Upload the current `src/data/achievements.json` as a GitHub Actions artifact.
5. Inspect the current achievements data and count existing achievement items.
6. Run `node scripts/fetchAchievements.js`.
7. Validate the updated JSON.
8. Check the Git diff.
9. If there are no changes, output `No achievements changes` and end.
10. If there are changes, verify the only changed file is `src/data/achievements.json`.
11. If any other file changed, fail and stop.
12. Run `npm run build`.
13. If build succeeds, commit with `Sync achievements data`.
14. Push back to `main`.
15. Vercel deploys automatically because `main` receives a new commit.

## Bad-Data Guardrails

The workflow must stop without commit or push when:

- `scripts/fetchAchievements.js` fails.
- The current or updated `src/data/achievements.json` is invalid JSON.
- The updated achievements root is not a non-empty array.
- The updated data has zero achievement items.
- A group is missing `category`, `description`, or non-empty `yearlyData`.
- A year block is missing `year` or `items`.
- An achievement item is missing `title`.
- The total achievement item count drops by 30% or more compared with the pre-sync file.
- The diff includes files other than `src/data/achievements.json`.
- `npm run build` fails.
- Git commit fails.
- Git push fails.

The workflow must not:

- use force push
- modify website UI code
- modify `scripts/fetchAchievements.js`
- run Cloudinary flows
- trigger a Vercel Deploy Hook
- write secrets to files

## Artifact Backup

Before running the scraper, the workflow uploads the current `src/data/achievements.json` as:

```text
achievements-json-before-sync-<run_id>
```

This artifact is intended for quick recovery from a bad sync run. Long-term recovery should still rely on Git history and normal release commits.

## Manual Trigger

To run manually:

1. Open the repository on GitHub.
2. Go to Actions.
3. Select `Sync Achievements Data`.
4. Choose `Run workflow`.
5. Run it on `main`.

## Production Check

If the workflow commits and pushes changes, Vercel should deploy from the new `main` commit automatically.

The next day, or a few minutes after a manual run, check:

```text
https://icps-lab.com/achievements
```

Also check the homepage if achievement counts or featured achievement data are expected to change.
