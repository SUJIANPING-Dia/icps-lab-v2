# Achievements Sync Harness

This harness keeps `src/data/achievements.json` synchronized automatically.

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
4. Run `node scripts/fetchAchievements.js`.
5. Check the Git diff.
6. If there are no changes, output `No achievements changes` and end.
7. If there are changes, verify the only changed file is `src/data/achievements.json`.
8. If any other file changed, fail and stop.
9. Run `npm run build`.
10. If build succeeds, commit with `Sync achievements data`.
11. Push back to `main`.
12. Vercel deploys automatically because `main` receives a new commit.

## Safety Conditions

The workflow must stop without commit or push when:

- `scripts/fetchAchievements.js` fails.
- The diff includes files other than `src/data/achievements.json`.
- `npm run build` fails.
- `src/data/achievements.json` becomes empty.
- JSON parsing fails.
- Required fields are missing from generated records.
- The total achievement record count drops sharply compared with the previous committed file.
- Git commit fails.
- Git push fails.

The workflow must not:

- use force push
- modify website UI code
- modify `scripts/fetchAchievements.js`
- run Cloudinary flows
- trigger a Vercel Deploy Hook
- write secrets to files

## Data Guardrails To Implement Or Verify

The scheduled sync workflow should protect against bad scraper output. Before commit/push, verify:

- The generated file is valid JSON.
- The generated data is not empty.
- Required fields are present for every record used by the site.
- The record count does not drop sharply from the previous version.

If any guardrail fails, the workflow should fail and leave `main` unchanged.

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
