import assert from 'node:assert/strict';
import test from 'node:test';
import visits from '../api/visits.js';

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.code = code; return this; },
    end() { return this; },
    json(data) { this.data = data; return this; },
  };
}

test('the counter accepts only supported methods and same-origin browser visits', async () => {
  const headers = { host: 'icps-lab.com', origin: 'https://icps-lab.com' };
  for (const [req, expected] of [
    [{ method: 'DELETE', headers }, 405],
    [{ method: 'POST', headers, body: { visitor: 'invalid' } }, 400],
    [{ method: 'POST', headers: { ...headers, origin: 'https://example.org' }, body: { visitor: crypto.randomUUID() } }, 400],
  ]) {
    const res = await visits(req, response());
    assert.equal(res.code, expected);
    assert.equal(res.headers['Cache-Control'], 'no-store');
  }
});

function mockStore(t, getRows) {
  const previous = process.env.VISITS_DATABASE_URL;
  process.env.VISITS_DATABASE_URL = 'postgresql://test@unit-test.neon.tech/site';
  t.after(() => {
    if (previous === undefined) delete process.env.VISITS_DATABASE_URL;
    else process.env.VISITS_DATABASE_URL = previous;
  });
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const { query, params } = JSON.parse(options.body);
    return Response.json({ rows: getRows(query, params) });
  });
}

test('reads add the opening balance once and reject invalid or overflowing totals', async t => {
  let total;
  mockStore(t, query => {
    assert.match(query, /^SELECT total /);
    return [{ total }];
  });
  const req = { method: 'GET', headers: { host: 'icps-lab.com' } };
  const validTotals = [
    [0, 3000], [1, 3001], [9, 3009],
    [Number.MAX_SAFE_INTEGER - 3000, Number.MAX_SAFE_INTEGER],
  ];
  for (const [recorded, expected] of validTotals) {
    total = String(recorded);
    assert.deepEqual((await visits(req, response())).data, { count: expected });
  }
  for (const invalid of ['-1', '1.5', 'invalid', String(Number.MAX_SAFE_INTEGER - 2999)]) {
    total = invalid;
    assert.equal((await visits(req, response())).code, 503);
  }
  delete process.env.VISITS_DATABASE_URL;
  assert.equal((await visits(req, response())).code, 503);
});

test('a first visit and a deduplicated retry both return 3001', async t => {
  const visitor = crypto.randomUUID();
  let writeAttempts = 0;
  let reads = 0;
  mockStore(t, (query, params) => {
    if (query.startsWith('SELECT total ')) {
      reads++;
      return [{ total: '1' }];
    }
    assert.match(query, /UPDATE lab_visit_total SET total = total \+ 1/);
    assert.deepEqual(params, [visitor]);
    writeAttempts++;
    return writeAttempts === 1 ? [{ total: '1' }] : [];
  });
  const headers = { host: 'icps-lab.com', origin: 'https://icps-lab.com' };
  const req = { method: 'POST', headers, body: { visitor } };
  assert.deepEqual((await visits(req, response())).data, { count: 3001 });
  assert.deepEqual((await visits(req, response())).data, { count: 3001 });
  assert.equal(writeAttempts, 2);
  assert.equal(reads, 1);
});
