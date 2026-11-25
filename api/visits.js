import { createVisitStore } from '../src/lib/visit-store.mjs';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function visits(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD, POST');
    return res.status(405).end();
  }
  if (req.method === 'POST') {
    if (!req.headers.host || req.headers.origin !== `https://${req.headers.host}`
        || typeof req.body?.visitor !== 'string' || !uuid.test(req.body.visitor)) {
      return res.status(400).end();
    }
  }
  try {
    const store = createVisitStore(process.env.VISITS_DATABASE_URL);
    const count = req.method === 'POST' ? await store.record(req.body.visitor) : await store.read();
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid count');
    return req.method === 'HEAD' ? res.status(200).end() : res.status(200).json({ count });
  } catch {
    return res.status(503).json({ error: 'Visitor count unavailable' });
  }
}
