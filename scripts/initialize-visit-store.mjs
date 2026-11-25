// Run once against the dedicated visitor database. Safe to rerun without resetting counts.
import { createVisitStore } from '../src/lib/visit-store.mjs';

const database = createVisitStore(process.env.VISITS_DATABASE_URL);
await database.query('CREATE TABLE IF NOT EXISTS lab_visit_total (id smallint PRIMARY KEY CHECK (id = 1), total bigint NOT NULL CHECK (total >= 0))');
await database.query('CREATE TABLE IF NOT EXISTS lab_recent_visits (visitor uuid PRIMARY KEY, counted_at timestamptz NOT NULL)');
await database.query('CREATE INDEX IF NOT EXISTS lab_recent_visits_time ON lab_recent_visits (counted_at)');
await database.query('INSERT INTO lab_visit_total (id, total) VALUES (1, 0) ON CONFLICT DO NOTHING');
console.log('Visitor database ready. Current count:', await database.read());
