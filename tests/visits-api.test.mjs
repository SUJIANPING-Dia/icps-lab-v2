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

test('a counter read returns the database total without recording a visit', async t => {
  const previous = process.env.VISITS_DATABASE_URL;
  process.env.VISITS_DATABASE_URL = 'postgresql://test@unit-test.neon.tech/site';
  t.after(() => {
    if (previous === undefined) delete process.env.VISITS_DATABASE_URL;
    else process.env.VISITS_DATABASE_URL = previous;
  });
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.match(JSON.parse(options.body).query, /^SELECT total /);
    return Response.json({ rows: [{ total: '19' }] });
  });
  const req = { method: 'GET', headers: { host: 'icps-lab.com' } };
  assert.deepEqual((await visits(req, response())).data, { count: 19 });
  delete process.env.VISITS_DATABASE_URL;
  assert.equal((await visits(req, response())).code, 503);
});
