// Build-time only. All four album routes consume the same completed snapshot.
const folder = 'events';
const pageSize = 500;

async function readPages(field, request) {
  const rows = [];
  const cursors = new Set();
  let cursor;
  let total;
  do {
    const response = await request(cursor);
    if (!response.ok) throw new Error(`Cloudinary ${field} returned HTTP ${response.status}`);
    const page = await response.json();
    if (!Array.isArray(page?.[field])) throw new Error(`Cloudinary returned invalid ${field}`);
    rows.push(...page[field]);
    if (page.total_count !== undefined) total = page.total_count;
    cursor = page.next_cursor;
    if (cursor != null && (typeof cursor !== 'string' || !cursor || cursors.has(cursor))) {
      throw new Error(`Cloudinary returned an invalid or repeated ${field} cursor`);
    }
    if (cursor) cursors.add(cursor);
  } while (cursor);
  if (total !== undefined && total !== rows.length) throw new Error(`Cloudinary ${field} count changed during pagination`);
  return rows;
}

/** Fetch the directory and its public images once, including all continuation pages. */
export async function fetchActivityAlbums(env, fetchImpl = fetch) {
  const { CLOUDINARY_CLOUD_NAME: name, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = env;
  if (!name || !key || !secret) throw new Error('Cloudinary album credentials are missing');
  const base = `https://api.cloudinary.com/v1_1/${encodeURIComponent(name)}`;
  const headers = { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` };
  const folders = await readPages('folders', cursor => {
    const url = new URL(`${base}/folders/${folder}`);
    url.searchParams.set('max_results', String(pageSize));
    if (cursor) url.searchParams.set('next_cursor', cursor);
    return fetchImpl(url, { headers, signal: AbortSignal.timeout(30000) });
  });
  const albums = new Map();
  for (const entry of folders) {
    const id = entry?.name;
    if (typeof id !== 'string' || !id.trim() || /[/\\]/.test(id) || id === '.' || id === '..'
        || entry.path !== `${folder}/${id}` || albums.has(id)) {
      throw new Error('Cloudinary returned an invalid or duplicate album directory');
    }
    albums.set(id, { id, title: id, date: '', img: null, photos: [] });
  }
  if (albums.size === 0) throw new Error('No activity album directories found; refusing an empty site build');

  const resources = await readPages('resources', cursor => fetchImpl(`${base}/resources/search`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({
      expression: 'asset_folder:events/* AND resource_type:image AND type:upload',
      with_field: ['context'],
      sort_by: [{ created_at: 'desc' }],
      max_results: pageSize,
      next_cursor: cursor,
    }),
  }));

  const seenImages = new Set();
  for (const asset of resources) {
    if (!asset || typeof asset.type !== 'string' || typeof asset.resource_type !== 'string'
        || typeof asset.status !== 'string' || (asset.access_control != null && !Array.isArray(asset.access_control))) {
      throw new Error('Cloudinary returned an invalid image resource');
    }
    // Delivery type and access-control rules both affect anonymous access.
    if (asset.resource_type !== 'image' || asset.type !== 'upload' || asset.status !== 'active'
        || (asset.access_mode != null && asset.access_mode !== 'public') || asset.access_control?.length
        || asset.context?.access_control || asset.context?.custom?.access_control) continue;
    const path = asset.asset_folder ?? asset.folder;
    if (typeof path !== 'string') throw new Error('Cloudinary image has no folder');
    if (path === folder) continue; // An image directly under events is not an album.
    const [root, id] = path.split('/');
    const album = albums.get(id);
    if (root !== folder || !album) throw new Error('Cloudinary image directory does not match the album listing');
    const assetId = asset.asset_id ?? asset.public_id;
    if (!assetId || seenImages.has(assetId)) throw new Error('Cloudinary returned an unidentified or duplicate photo');
    seenImages.add(assetId);
    const url = new URL(asset.secure_url);
    if (url.protocol !== 'https:' || !url.pathname.includes('/image/upload/')
        || !Number.isFinite(Date.parse(asset.created_at))) throw new Error('Cloudinary returned invalid public photo metadata');
    const full = url.href.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
    const thumb = url.href.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_800/');
    if (!album.photos.length) {
      const title = asset.context?.custom?.title ?? asset.context?.title;
      if (typeof title === 'string' && title.trim()) album.title = title;
      album.date = asset.created_at.slice(0, 10).replaceAll('-', '.');
      album.img = thumb;
    }
    album.photos.push({ thumb, full });
  }
  if (!seenImages.size) throw new Error('No public activity photos found; refusing to replace the published galleries');
  return [...albums.values()].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

let snapshot;
export function getActivityAlbums(env = {}) {
  // Astro injects only private keys referenced in the same server module.
  const buildEnv = { ...process.env, ...import.meta.env, ...env };
  if (buildEnv.ICPS_ALBUM_FIXTURE === '1') {
    if (buildEnv.VERCEL || buildEnv.VERCEL_ENV) {
      throw new Error('Fixture albums cannot be used on Vercel');
    }
    return Promise.resolve([
      { id: 'CI Album', title: 'CI Album', date: '2026.01.01', img: '/images/activity-banner.jpg',
        photos: [{ thumb: '/images/activity-banner.jpg', full: '/images/activity-banner.jpg' }] },
      { id: 'CI 空相簿', title: 'CI 空相簿', date: '', img: null, photos: [] },
    ]);
  }
  snapshot ??= fetchActivityAlbums(buildEnv).catch(error => {
    snapshot = undefined;
    throw error;
  });
  return snapshot;
}
