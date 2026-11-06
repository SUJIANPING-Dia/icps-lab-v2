const COUNTER_URL = "https://api.counterapi.dev/v1/icpslab_site/visits";
const COUNT_KEY = "icps_saved_count";
const VISIT_KEY = "icps_last_visit_time";
const STORAGE_PROBE_KEY = "icps_counter_storage_probe";
const DAY_MS = 24 * 60 * 60 * 1000;

function parseCount(value) {
  if (typeof value === "string" && !/^\d+$/.test(value)) return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

export function formatVisitorCount(value) {
  const count = parseCount(value);
  return count === null ? null : String(count).padStart(6, "0");
}

function browserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function readStorage(storage, key) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function canRememberVisit(storage) {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_PROBE_KEY, "1");
    storage.removeItem(STORAGE_PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** One loader per document; concurrent or repeated mounts share its request. */
export function createVisitorCounter({
  fetchImpl = (...args) => globalThis.fetch(...args),
  storage = browserStorage(),
  now = () => Date.now(),
  timeoutMs = 8000,
} = {}) {
  let request;

  async function load() {
    const cachedCount = parseCount(readStorage(storage, COUNT_KEY));
    const lastVisit = Number(readStorage(storage, VISIT_KEY));
    const currentTime = now();
    const visitedRecently = Number.isFinite(lastVisit) && lastVisit > 0
      && currentTime >= lastVisit && currentTime - lastVisit < DAY_MS;
    // Without writable storage, read only: repeated navigation must not inflate visits.
    const increment = !visitedRecently && canRememberVisit(storage);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(increment ? `${COUNTER_URL}/up` : COUNTER_URL, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Counter request failed");
      const data = await response.json();
      const count = parseCount(data?.count);
      if (count === null) throw new Error("Invalid counter response");

      try {
        if (increment) storage?.setItem(VISIT_KEY, String(currentTime));
        storage?.setItem(COUNT_KEY, String(count));
      } catch {
        // A valid response remains usable if storage becomes unavailable afterwards.
      }
      return { count, source: "live" };
    } catch {
      return { count: cachedCount, source: cachedCount === null ? "unavailable" : "cached" };
    } finally {
      clearTimeout(timeout);
    }
  }

  return () => {
    request ??= load();
    return request;
  };
}

export const loadVisitorCount = createVisitorCounter();
