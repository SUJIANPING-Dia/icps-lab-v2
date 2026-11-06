// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** @param {string} value */
const canonicalUrl = (value) => {
  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.href;
};

// https://astro.build/config
export default defineConfig({
  site: 'https://icps-lab.com',
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'zh',
        locales: { zh: 'zh-TW', en: 'en' },
      },
      serialize(item) {
        const links = item.links?.map((link) => ({ ...link, url: canonicalUrl(link.url) }));
        const defaultLink = links?.find((link) => link.lang === 'zh-TW');
        return {
          ...item,
          url: canonicalUrl(item.url),
          links: defaultLink ? [...(links ?? []), { lang: 'x-default', url: defaultLink.url }] : links,
        };
      },
    }),
  ],
});
