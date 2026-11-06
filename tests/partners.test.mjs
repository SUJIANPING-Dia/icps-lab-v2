import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getProjectPartners, partnerRegistry } from '../src/data/partners.mjs';

const source = JSON.parse(readFileSync(new URL('../src/data/achievements.json', import.meta.url), 'utf8'));
const project = (...records) => [{ type: 'project', yearlyData: [{ items: records.map(project => ({ project })) }] }];

test('reviewed partner entries have source evidence and agree across categories', () => {
  const group = source.find(group => group.type === 'project');
  for (const partner of Object.values(partnerRegistry).flat()) {
    const [year, index] = partner.source;
    const item = group.yearlyData.find(block => Number(block.year) === year)?.items[index];
    assert.ok(partner.aliases.some(alias => item?.project?.includes(alias)), `Missing provenance: ${partner.name}`);
  }
  const partners = getProjectPartners(source);
  assert.deepEqual(Object.values(partners).map(items => items.length), [50, 3, 18]);
  assert.equal(new Set(Object.values(partners).flat()).size, 71);
});

test('missing data never fabricates partners', () => {
  assert.deepEqual(getProjectPartners([]), { industry: [], healthcare: [], institutions: [] });
});

test('quoted research titles and program names do not become organizations', () => {
  const partners = getProjectPartners(project('『人工智慧專利佈局與日月光半導體製造股份有限公司研究計畫』，主持人', '第四屆(114年)高科大高醫大研發暨產學合作補助計畫'));
  assert.equal(Object.values(partners).flat().length, 0);
});

test('aliases and duplicate records count once, subordinate agency is not its parent', () => {
  const partners = getProjectPartners(project('嘉義基督教醫院', '戴德森醫療財團法人嘉義基督教醫院', '國科會，計畫', '科技部，計畫', '教育部青年發展署，計畫', '科技部南部科學園區管理局推動補助計畫'));
  assert.equal(partners.healthcare.length, 1);
  assert.deepEqual(new Set(partners.institutions), new Set(['國科會（含科技部時期）', '教育部青年發展署', '科技部南部科學園區管理局']));
  assert.equal(getProjectPartners(project('科技部台南科學工業園區')).institutions.length, 0);
});
