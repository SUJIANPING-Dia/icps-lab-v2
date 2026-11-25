import test from 'node:test';
import assert from 'node:assert/strict';
import { getHomepageStatistics } from '../src/data/homepage.ts';

test('funding sums stated amounts and distinguishes zero from missing or ambiguous amounts', () => {
  const groups = [{
    type: 'project', category: '研究計畫', yearlyData: [
      { year: 2026, items: [{ amount: '1,234,500元' }, { amount: '0元' }] },
      { year: 2025, items: [{ amount: '8000' }, { amount: '' }, {}, { amount: 'USD 200' }] },
    ],
  }];
  const stats = getHomepageStatistics(groups);
  assert.equal(stats.reportedFunding, 1242500);
  assert.equal(stats.unreportedProjects, 3);
});
