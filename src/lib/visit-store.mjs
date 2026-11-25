// Server-only. The Vercel project provides the connection string at runtime.
export function createVisitStore(connectionString, fetchImpl = fetch) {
  const database = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(database.protocol) || !database.hostname.endsWith('.neon.tech')) {
    throw new Error('Visitor database is not configured');
  }
  const endpoint = `https://${database.hostname}/sql`;
  async function query(sql, params = []) {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': connectionString },
      body: JSON.stringify({ query: sql, params }),
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error('Visitor database request failed');
    return (await response.json()).rows;
  }
  const read = async () => Number((await query('SELECT total FROM lab_visit_total WHERE id = 1'))[0].total);
  async function record(visitor) {
    // Concurrent requests with the same opaque ID count at most once per rolling day.
    // The row lock on the total also serializes increments by different visitors.
    const rows = await query(`
      WITH eligible AS (
        INSERT INTO lab_recent_visits (visitor, counted_at) VALUES ($1::uuid, now())
        ON CONFLICT (visitor) DO UPDATE SET counted_at = excluded.counted_at
          WHERE lab_recent_visits.counted_at <= now() - interval '24 hours'
        RETURNING 1
      ), expired AS (
        DELETE FROM lab_recent_visits WHERE visitor IN (
          SELECT visitor FROM lab_recent_visits
          WHERE counted_at < now() - interval '48 hours' AND visitor <> $1::uuid
          ORDER BY counted_at LIMIT 128 FOR UPDATE SKIP LOCKED
        )
      )
      UPDATE lab_visit_total SET total = total + 1
      WHERE id = 1 AND EXISTS (SELECT 1 FROM eligible) RETURNING total
    `, [visitor]);
    return rows.length ? Number(rows[0].total) : read();
  }
  return { query, read, record };
}
