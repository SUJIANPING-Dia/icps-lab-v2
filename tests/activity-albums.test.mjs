import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchActivityAlbums, getActivityAlbums } from '../src/lib/activity-albums.mjs';

const env = { CLOUDINARY_CLOUD_NAME: 'test', CLOUDINARY_API_KEY: 'test', CLOUDINARY_API_SECRET: 'test' };
const directory = name => ({ name, path: `events/${name}` });
function photo(id, folder = 'events/April') {
  return {
    asset_id: String(id), asset_folder: folder, created_at: '2026-04-02T12:00:00Z',
    secure_url: `https://res.cloudinary.com/test/image/upload/v1/${id}.jpg`,
    type: 'upload', resource_type: 'image', status: 'active', access_mode: 'public', access_control: null,
  };
}

test('uses all folder and image pages for the public album directory', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    if (new URL(url).pathname.endsWith('/folders/events')) {
      const cursor = new URL(url).searchParams.get('next_cursor');
      requests.push(['folders', cursor]);
      return Response.json(cursor ? { folders: [directory('Empty')] }
        : { folders: [directory('April'), directory('May')], next_cursor: 'two' });
    }
    const body = JSON.parse(options.body);
    assert.match(body.expression, /asset_folder:events\/\*/);
    requests.push(['images', body.next_cursor]);
    if (!body.next_cursor) return Response.json({
      resources: Array.from({ length: 500 }, (_, index) => photo(index)), next_cursor: 'more', total_count: 509,
    });
    return Response.json({ resources: [
      photo(500, 'events/April/awards'), photo(501, 'events/May/awards'), photo(502, 'events'),
      { ...photo(503), type: 'private' }, { ...photo(504), access_control: [{ access_type: 'token' }] },
      { ...photo(505), access_mode: 'authenticated' }, { ...photo(506), resource_type: 'video' },
      { ...photo(507), context: { access_control: 'token' } }, { ...photo(508), status: 'deleted' },
    ], total_count: 509 });
  };
  const albums = await fetchActivityAlbums(env, fetchImpl);
  assert.deepEqual(requests, [['folders', null], ['folders', 'two'], ['images', undefined], ['images', 'more']]);
  assert.deepEqual(albums.map(album => [album.id, album.photos.length]), [['April', 501], ['May', 1], ['Empty', 0]]);
  assert.deepEqual(albums[2], { id: 'Empty', title: 'Empty', date: '', img: null, photos: [] });
  assert.match(albums[0].photos[500].full, /\/upload\/f_auto,q_auto\/v1\/500\.jpg$/);
});

test('upstream failures, incomplete pages and invalid directories reject the build', async () => {
  const fail = new Response(null, { status: 503 });
  const folders = { folders: [directory('April')] };
  const image = { resources: [photo(1)] };
  for (const pages of [
    [fail], [folders, fail], [folders, { ...image, next_cursor: 'two' }, fail],
    [{ folders: [] }], [{ folders: [directory('..')] }], [{ folders: [directory('April'), directory('April')] }],
    [folders, { invalid: [] }], [folders, { resources: [] }], [folders, { resources: [{}] }],
    [folders, { resources: [photo(1, 'events/unlisted')] }], [folders, { ...image, total_count: 4 }],
    [folders, { ...image, next_cursor: 'two' }, { ...image, next_cursor: 'two' }],
    [{ ...folders, next_cursor: 'two' }, { ...folders, next_cursor: 'two' }],
  ]) {
    let n = 0;
    await assert.rejects(fetchActivityAlbums(env, async () => {
      const page = pages[n++];
      return page instanceof Response ? page : Response.json(page);
    }));
    assert.equal(n, pages.length);
  }
});

test('PR fixture includes an empty album but is refused in any Vercel deployment', async () => {
  const albums = await getActivityAlbums({ ICPS_ALBUM_FIXTURE: '1' });
  assert.deepEqual(albums.map(album => album.photos.length), [1, 0]);
  for (const deployment of [{ VERCEL: '1' }, { VERCEL_ENV: 'preview' }, { VERCEL_ENV: 'production' }]) {
    assert.throws(() => getActivityAlbums({ ...deployment, ICPS_ALBUM_FIXTURE: '1' }), /cannot be used on Vercel/);
  }
});
