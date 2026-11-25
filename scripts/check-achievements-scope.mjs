import { execFileSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Inspect both Git comparisons: a staged change can be undone in the worktree.
const changes = new Set();
for (const args of [
  ['diff', '--name-only', '--no-renames', '-z'],
  ['diff', '--cached', '--name-only', '--no-renames', '-z'],
  ['ls-files', '--others', '--exclude-standard', '-z'],
]) {
  for (const file of execFileSync('git', args, { encoding: 'utf8' }).split('\0').filter(Boolean)) changes.add(file);
}
if (process.env.RUNNER_TEMP) {
  writeFileSync(join(process.env.RUNNER_TEMP, 'achievements-changed-files.txt'), [...changes].join('\n'));
}
if ([...changes].some(file => file !== 'src/data/achievements.json')) {
  console.error('Unexpected changed files:', JSON.stringify([...changes]));
  process.exitCode = 1;
} else {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changes.size > 0}\n`);
  console.log(changes.size ? 'Only achievements data changed.' : 'No achievements changes');
}
