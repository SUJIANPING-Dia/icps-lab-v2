import assert from "node:assert/strict";
import test from "node:test";
import { createVisitorCounter, formatVisitorCount } from "../src/lib/visitor-counter.mjs";

const NOW = 1_800_000_000_000;
const DAY_MS = 86_400_000;

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

const response = (count) => ({ ok: true, json: async () => ({ count }) });

test("HTTP errors preserve a valid cached count without recording a visit", async () => {
  const storage = memoryStorage({ icps_visit_total_v3: "3009" });
  const load = createVisitorCounter({ storage, now: () => NOW, fetchImpl: async () => ({ ok: false }) });
  assert.deepEqual(await load(), { count: 3009, source: "cached" });
  assert.equal(storage.getItem("icps_visit_time_v2"), null);
});

test("a returning visitor keeps their visit window and caches the new total without adding the opening balance twice", async () => {
  const id = crypto.randomUUID();
  const lastVisit = String(NOW - 1000);
  const storage = memoryStorage({ icps_visit_total_v2: "9", icps_visit_time_v2: lastVisit, icps_visit_id_v2: id });
  const load = fetchImpl => createVisitorCounter({ storage, now: () => NOW, fetchImpl })();
  const offline = async () => { throw new Error("Offline"); };
  const methods = [];

  assert.deepEqual(await load(offline), { count: null, source: "unavailable" });
  assert.deepEqual(await load(async (_url, options) => {
    methods.push(options.method);
    return response(3009);
  }), { count: 3009, source: "live" });
  assert.deepEqual(methods, ["GET"]);
  assert.equal(storage.getItem("icps_visit_id_v2"), id);
  assert.equal(storage.getItem("icps_visit_time_v2"), lastVisit);
  assert.deepEqual(await load(offline), { count: 3009, source: "cached" });
});

test("missing or invalid count never renders undefined or a fabricated zero", async () => {
  for (const count of [undefined, null, "undefined", "", "1.2", -1, 1.2, Infinity, {}, true]) {
    const load = createVisitorCounter({ storage: memoryStorage(), now: () => NOW, fetchImpl: async () => response(count) });
    assert.deepEqual(await load(), { count: null, source: "unavailable" });
    assert.equal(formatVisitorCount(count), null);
  }
  assert.equal(formatVisitorCount(0), "0");
  assert.equal(formatVisitorCount("3001"), "3001");
});

test("blocked storage still displays the live count using a read-only request", async () => {
  const requested = [];
  const blocked = {
    getItem() { throw new Error("Storage blocked"); },
    setItem() { throw new Error("Storage blocked"); },
    removeItem() { throw new Error("Storage blocked"); },
  };
  const load = createVisitorCounter({
    storage: blocked,
    now: () => NOW,
    fetchImpl: async (url, options) => { requested.push([url, options.method]); return response(2090); },
  });
  assert.deepEqual(await load(), { count: 2090, source: "live" });
  assert.equal(requested.length, 1);
  assert.deepEqual(requested, [["/api/visits", "GET"]]);
});

test("repeated page navigation increments once per 24 hours", async () => {
  const storage = memoryStorage();
  const requested = [];
  let clock = NOW;
  const options = {
    storage,
    now: () => clock,
    fetchImpl: async (url, options) => { requested.push(options); return response(2091); },
  };
  await createVisitorCounter(options)();
  clock += 1000;
  await createVisitorCounter(options)();
  clock = NOW + DAY_MS;
  await createVisitorCounter(options)();
  assert.deepEqual(requested.map(options => options.method), ["POST", "GET", "POST"]);
  assert.equal(requested[0].body, requested[2].body);
});

test("concurrent and repeated mounts share a single request for the page", async () => {
  let requests = 0;
  const load = createVisitorCounter({
    storage: memoryStorage(),
    now: () => NOW,
    fetchImpl: async () => { requests += 1; return response(2091); },
  });
  const first = load();
  assert.equal(first, load());
  await Promise.all([first, load(), load()]);
  await load();
  assert.equal(requests, 1);
});

test("network and JSON failures use unavailable when there is no valid cache", async () => {
  for (const fetchImpl of [
    async () => { throw new Error("Offline"); },
    async () => ({ ok: true, json: async () => { throw new Error("Invalid JSON"); } }),
  ]) {
    const load = createVisitorCounter({ storage: memoryStorage({ icps_visit_total_v3: "undefined" }), fetchImpl });
    assert.deepEqual(await load(), { count: null, source: "unavailable" });
  }
});
