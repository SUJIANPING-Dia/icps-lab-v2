import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseAchievements, syncFromHtml } from '../scripts/fetchAchievements.js';
import { indexRecords } from '../src/lib/achievement-search.ts';

const contract = '心肺健康，合約編號：120011000216，2021.01.01~2021.12.31 (752,000元)';
const headings = ['國際期刊論文', '國際研討會論文', '國內研討會論文', '研究計畫', '競賽得獎', '專利'];
function source(publication = 'A. Author, “Example title”, Journal.') {
  const rows = [[publication], ['乙，「國際題名」，國際會議'], ['丙，『國內題名』，國內會議'],
    [contract, contract, contract.replace('12.31', '06.30'), '計畫經費未列'], ['學生競賽得獎'], ['發明專利']];
  return rows.map((records, i) => '<h2>' + headings[i] + '</h2><h3>2021年</h3><ol>' +
    records.map(raw => '<li>' + raw + '</li>').join('') + '</ol>').join('');
}
const data = JSON.parse(readFileSync(new URL('../src/data/achievements.json', import.meta.url), 'utf8'));

test('exact duplicate source contracts count once while distinct periods remain', () => {
  const { groups, quality } = parseAchievements(source());
  assert.deepEqual(quality.unparsed, []);
  assert.equal(quality.duplicateProjects[0].raw, contract);
  assert.equal(quality.missingAmounts[0].raw, '計畫經費未列');
  assert.equal(groups[3].yearlyData[0].items.length, 3);
  assert.deepEqual(quality.changes.find(change => change.category === '研究計畫 (Projects)'),
    { category: '研究計畫 (Projects)', year: '2021', before: 0, after: 3 });
  const { quality: unchanged } = parseAchievements(source(), groups);
  assert.deepEqual(unchanged.changes, []);
});

test('unparseable source rows write diagnostics and preserve the current file', t => {
  const temp = mkdtempSync(path.join(tmpdir(), 'icps-achievements-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const destination = path.join(temp, 'data.json');
  const report = path.join(temp, 'quality.json');
  const original = JSON.stringify(parseAchievements(source()).groups);
  writeFileSync(destination, original);
  assert.throws(() => syncFromHtml(source('missing title delimiters'), destination, report), /人工核對/);
  assert.equal(readFileSync(destination, 'utf8'), original);
  const { unparsed } = JSON.parse(readFileSync(report));
  assert.equal(unparsed[0].raw, 'missing title delimiters');
  assert.equal(unparsed[0].year, '2021');
  assert.equal(unparsed[0].category, '國際期刊論文');
});

test('the checked-in project data contains no repeated identical contracts within a year', () => {
  for (const block of data.find(group => group.type === 'project').yearlyData) {
    const contracts = block.items.map(item => item.project).filter(text => /(?:合約|計畫|技轉)編號\s*[:：]\s*[a-z0-9]/i.test(text));
    assert.equal(new Set(contracts).size, contracts.length, block.year);
  }
});

test('searches match both category labels, full citations and years', () => {
  const items = [{ id: 'record-1', title: 'Paper', year: '2026', detail: 'Author, Venue' }];
  const group = { slug: '', enLabel: 'International Journal Papers', zhLabel: '國際期刊論文', items };
  for (const english of [true, false]) {
    const [record] = indexRecords([group], english);
    for (const term of ['international journal papers', '國際期刊論文', 'paper', 'author', 'venue', '2026']) {
      assert.ok(record.terms.includes(term), term);
    }
    assert.equal(record.href, (english ? '/en' : '') + '/achievements#record-1');
  }
});
