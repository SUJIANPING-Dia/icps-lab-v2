import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/check-achievements-scope.mjs', import.meta.url));
const allowed = 'src/data/achievements.json';

function fixture(t) {
  const temp = mkdtempSync(path.join(tmpdir(), 'icps-scope-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const cwd = path.join(temp, 'repo');
  const report = path.join(temp, 'achievements-changed-files.txt');
  const githubOutput = path.join(temp, 'output');
  const write = (file, value) => writeFileSync(path.join(cwd, file), value);
  mkdirSync(path.join(cwd, 'src/data'), { recursive: true });
  const git = (...args) => execFileSync('git', args, { cwd, stdio: 'pipe' });
  git('init', '--quiet');
  write(allowed, '[]\n');
  write('README.md', 'Original\n');
  git('add', '--', 'README.md', allowed);
  git('-c', 'user.name=Scope Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Fixture');
  const check = () => {
    const result = spawnSync(process.execPath, [script], { cwd, encoding: 'utf8',
      env: { ...process.env, RUNNER_TEMP: temp, GITHUB_OUTPUT: githubOutput } });
    assert.ifError(result.error);
    return {
      status: result.status,
      files: readFileSync(report, 'utf8').split('\n').filter(Boolean).sort(),
      output: existsSync(githubOutput) ? readFileSync(githubOutput, 'utf8').trim() : '',
    };
  };
  return { cwd, git, write, check };
}

test('scope gate reports an unchanged checkout', t => {
  const repo = fixture(t);
  assert.deepEqual(repo.check(), { status: 0, files: [], output: 'changed=false' });
});

test('scope gate accepts only an achievements edit, staged or unstaged', t => {
  const repo = fixture(t);
  repo.write(allowed, '[1]\n');
  assert.deepEqual(repo.check(), { status: 0, files: [allowed], output: 'changed=true' });
  repo.git('add', '--', allowed);
  const result = repo.check();
  assert.equal(result.status, 0);
  assert.deepEqual(result.files, [allowed]);
});

test('scope gate rejects an untracked path even alongside an allowed edit', t => {
  const repo = fixture(t);
  repo.write(allowed, '[1]\n');
  repo.write('new file.txt', 'unexpected\n');
  assert.deepEqual(repo.check(), { status: 1, files: ['new file.txt', allowed], output: '' });
});

test('scope gate rejects an unrelated staged edit', t => {
  const repo = fixture(t);
  repo.write('README.md', 'Modified\n');
  repo.git('add', '--', 'README.md');
  assert.deepEqual(repo.check(), { status: 1, files: ['README.md'], output: '' });
});

test('scope gate catches staged changes reversed in the working tree', t => {
  const repo = fixture(t);
  repo.write('README.md', 'Staged\n');
  repo.git('add', '--', 'README.md');
  repo.write('README.md', 'Original\n');
  repo.git('diff', '--quiet', 'HEAD', '--', 'README.md');
  assert.deepEqual(repo.check(), { status: 1, files: ['README.md'], output: '' });
});

test('scope gate rejects a rename and reports both sides', t => {
  const repo = fixture(t);
  renameSync(path.join(repo.cwd, allowed), path.join(repo.cwd, 'renamed.json'));
  repo.git('add', '--all');
  assert.deepEqual(repo.check(), { status: 1, files: ['renamed.json', allowed], output: '' });
});
