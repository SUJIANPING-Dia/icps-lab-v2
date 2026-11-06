// Read-only verification of the latest Astro build. Run after npm run build.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const root = path.resolve('dist');
const origin = 'https://icps-lab.com';
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
if (!existsSync(root)) throw new Error('Build output missing; run npm run build first.');
const walk = (folder) => readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(folder, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});
const htmlFiles = walk(root).filter(file => file.endsWith('.html'));
const redirects = JSON.parse(readFileSync('vercel.json', 'utf8')).redirects;
const redirectMap = new Map(redirects.map(rule => [rule.source, rule.destination]));
const routeFor = file => {
  const relative = path.relative(root, file).split(path.sep).join('/');
  return '/' + relative.replace(/(?:^|\/)index\.html$/, '').replace(/\.html$/, '');
};
const canonical = route => new URL(route.split('/').map(segment => encodeURIComponent(decodeURIComponent(segment))).join('/'), origin).href;
const pages = new Map(htmlFiles.map(file => [canonical(routeFor(file)), { file, $: load(readFileSync(file, 'utf8')) }]));
check(pages.size > 0, 'No built HTML pages');
let linksChecked = 0;

function findLocalFile(url) {
  const pathname = redirectMap.get(decodeURIComponent(url.pathname)) ?? decodeURIComponent(url.pathname);
  const base = path.resolve(root, '.' + pathname);
  if (!base.startsWith(root + path.sep) && base !== root) return null;
  return [base, `${base}.html`, path.join(base, 'index.html')].find(candidate => existsSync(candidate) && statSync(candidate).isFile());
}

function verifyReference(raw, from, { anchor = false } = {}) {
  if (!raw || /^(?:data:|mailto:|tel:|javascript:)/i.test(raw)) return;
  let url;
  try { url = new URL(raw, from); } catch { check(false, `${from}: malformed URL ${raw}`); return; }
  if (url.origin !== origin) return;
  linksChecked++;
  const target = findLocalFile(url);
  check(Boolean(target), `${from}: missing local target ${raw}`);
  if (target && anchor && url.hash && target.endsWith('.html')) {
    const destination = pages.get(canonical(routeFor(target)));
    const id = decodeURIComponent(url.hash.slice(1));
    check(destination && destination.$('[id]').toArray().some(element => destination.$(element).attr('id') === id), `${from}: missing anchor ${raw}`);
  }
}

for (const [url, { $ }] of pages) {
  check($('title').text().trim().length > 0, `${url}: missing title`);
  check($('meta[name="description"]').attr('content')?.trim(), `${url}: missing description`);
  check($('link[rel="canonical"]').length === 1 && $('link[rel="canonical"]').attr('href') === url, `${url}: canonical mismatch`);
  check($('meta[property="og:url"]').attr('content') === url, `${url}: OG URL mismatch`);
  check($('meta[property="og:title"]').attr('content') === $('title').text(), `${url}: OG title mismatch`);
  check($('meta[name="twitter:card"]').attr('content') === 'summary_large_image', `${url}: missing Twitter card`);
  const image = $('meta[property="og:image"]').attr('content');
  check(image?.startsWith(origin + '/'), `${url}: invalid social image`);
  check(image && /\.(?:png|jpe?g|webp|gif)$/i.test(new URL(image, origin).pathname), `${url}: social image is not an image asset`);
  verifyReference(image, url);
  const chinesePath = new URL(url).pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  const expected = { 'zh-TW': canonical(chinesePath), en: canonical('/en' + (chinesePath === '/' ? '' : chinesePath)), 'x-default': canonical(chinesePath) };
  for (const [language, alternate] of Object.entries(expected)) {
    check($(`link[rel="alternate"][hreflang="${language}"]`).attr('href') === alternate, `${url}: wrong ${language} alternate`);
    check(pages.has(alternate), `${url}: missing alternate page ${alternate}`);
  }
  check($('footer').length === 1 && $('#visitor-count').length === 1, `${url}: duplicated/missing footer or counter`);
  check($('iframe[src*="youtube"]').length === 0, `${url}: eager YouTube iframe`);
  const ids = $('[id]').toArray().map(element => $(element).attr('id'));
  check(new Set(ids).size === ids.length, `${url}: duplicate element IDs`);
  $('[href]').each((_, element) => verifyReference($(element).attr('href'), url, { anchor: true }));
  $('[src],[poster]').each((_, element) => {
    const node = $(element);
    if (node.attr('src') !== undefined) check(node.attr('src') !== '', `${url}: empty src`);
    verifyReference(node.attr('src'), url);
    verifyReference(node.attr('poster'), url);
  });
  $('[srcset]').each((_, element) => {
    for (const candidate of ($(element).attr('srcset') ?? '').split(',')) verifyReference(candidate.trim().split(/\s+/)[0], url);
  });
  $('[aria-controls],[aria-labelledby],[aria-describedby]').each((_, element) => {
    for (const attribute of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
      for (const id of ($(element).attr(attribute) ?? '').split(/\s+/).filter(Boolean)) check(ids.includes(id), `${url}: unresolved ${attribute} ${id}`);
    }
  });
}

check(existsSync(path.join(root, 'robots.txt')), 'Missing robots.txt');
const sitemapIndex = path.join(root, 'sitemap-index.xml');
check(existsSync(sitemapIndex), 'Missing sitemap index');
const sitemapUrls = new Set();
if (existsSync(sitemapIndex)) {
  const index = load(readFileSync(sitemapIndex, 'utf8'), { xml: true });
  for (const element of index('sitemap > loc').toArray()) {
    const file = findLocalFile(new URL(index(element).text()));
    check(file, 'Missing sitemap referenced by index');
    if (!file) continue;
    const xml = load(readFileSync(file, 'utf8'), { xml: true });
    for (const entry of xml('url').toArray()) {
      const loc = xml(entry).find('loc').text();
      check(pages.has(loc), `Sitemap has unknown/noncanonical page ${loc}`);
      sitemapUrls.add(loc);
      for (const alternate of xml(entry).find('xhtml\\:link').toArray()) check(pages.has(xml(alternate).attr('href')), `${loc}: broken sitemap alternate`);
    }
  }
}
for (const url of pages.keys()) check(sitemapUrls.has(url), `Missing from sitemap: ${url}`);
for (const redirect of redirects) {
  check(redirect.permanent === true, `Nonpermanent archive redirect: ${redirect.source}`);
  check(existsSync(path.join('assets/archive', path.basename(redirect.source))), `Missing archived original: ${redirect.source}`);
  check(existsSync(path.join(root, redirect.destination)), `Missing redirect destination: ${redirect.destination}`);
  check(!existsSync(path.join(root, redirect.source)), `Archived original still deployed: ${redirect.source}`);
}
if (errors.length) {
  console.error([...new Set(errors)].join('\n'));
  console.error(`FAILED: ${errors.length} findings across ${pages.size} pages.`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${pages.size} pages, ${linksChecked} local references, ${sitemapUrls.size} sitemap entries, ${redirects.length} archive redirects; metadata, ARIA targets, IDs and deferred video checks passed.`);
}
