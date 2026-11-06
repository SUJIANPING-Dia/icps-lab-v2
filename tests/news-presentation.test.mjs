import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { newsData, englishNewsTitles, getEnglishNewsTag, sortNews, prepareNewsContent } from '../src/data/news.ts';

test('pinned announcements lead a chronological list without mutating input', () => {
  const items = [
    { slug: 'older', date: '2026.05.14' },
    { slug: 'newer', date: '2026.05.18' },
    { slug: 'announcement', date: '2026.01.01', isPinned: true },
  ];
  assert.deepEqual(sortNews(items).map(item => item.slug), ['announcement', 'newer', 'older']);
  assert.deepEqual(items.map(item => item.slug), ['older', 'newer', 'announcement']);
});

test('published news has unique routes, sortable dates and English titles', () => {
  assert.equal(new Set(newsData.map(item => item.slug)).size, newsData.length);
  for (const item of newsData) {
    assert.match(item.date, /^\d{4}\.\d{2}\.\d{2}$/);
    assert.ok(englishNewsTitles[item.slug], `Missing English title: ${item.slug}`);
    assert.ok(getEnglishNewsTag(item.slug));
  }
  assert.equal(getEnglishNewsTag('2026-master-defense-hsu-lai'), 'Academic');
});

test('video preparation defers the player while preserving accessible context', () => {
  const html = '<p id="caption">Research demo</p><iframe src="https://www.youtube.com/embed/FYVEmAv1t38" title="YouTube video player" class="absolute inset-0 w-full h-full" aria-describedby="caption"></iframe><img src="/images/example.jpg" alt="Example">';
  const $ = load(prepareNewsContent(html, 'en', 'Glasses <research>'), null, false);
  assert.equal($('iframe').length, 0);
  const trigger = $('[data-video-trigger]');
  assert.equal(trigger.attr('href'), 'https://www.youtube.com/watch?v=FYVEmAv1t38');
  assert.equal(trigger.attr('data-video-title'), 'Glasses <research>');
  assert.equal(trigger.attr('aria-describedby'), 'caption');
  assert.equal(trigger.attr('data-video-class'), 'absolute inset-0 w-full h-full');
  assert.equal($('research').length, 0);
  assert.ok($('img').toArray().every(image => $(image).attr('loading') === 'lazy'));
});

test('every authored YouTube embed is deferred in both languages', () => {
  for (const item of newsData) {
    for (const lang of ['zh', 'en']) {
      const content = lang === 'en' ? item.contentEn ?? item.content : item.content;
      const $ = load(prepareNewsContent(content, lang, item.title), null, false);
      assert.equal($('iframe[src*="youtube"]').length, 0, `${lang}: ${item.slug}`);
    }
  }
});
