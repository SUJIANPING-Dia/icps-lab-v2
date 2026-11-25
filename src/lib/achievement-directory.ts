import { createHash } from 'node:crypto';
import achievements from '../data/achievements.json';

const categoryInfo: Record<string, [string, string, string]> = {
  '國際期刊論文': ['', 'International Journal Papers', 'International journal papers in the lab directory.'],
  '國際研討會論文': ['international-conferences', 'International Conference Papers', 'International conference papers in the lab directory.'],
  '國內研討會論文': ['domestic-conferences', 'Domestic Conference Papers', 'Domestic conference papers in the lab directory.'],
  '研究計畫 (Projects)': ['projects', 'Research Projects', 'Research projects and industry-academia collaboration.'],
  '競賽得獎 (Awards)': ['awards', 'Awards and Honors', 'Competitions and honors earned by lab students.'],
  '專利 (Patents)': ['patents', 'Patents', 'Granted and pending patent records.'],
};

interface Item {
  title?: string;
  authors?: string;
  venue?: string;
  project?: string;
  content?: string;
  amount?: string;
  link?: string;
}

const hash = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16);

export const directory = achievements.map(group => {
  const [slug, enLabel, enDescription] = categoryInfo[group.category]
    ?? ['category-' + hash(group.category), group.category, group.description];
  const seen = new Map<string, number>();
  const years = group.yearlyData.map(block => ({
    year: block.year,
    items: block.items.map((item: Item) => {
      const title = item.title || (item.content || item.project || '').replace(/指導學生參加\s*/g, '').replace(/\([\d,]+元\)/g, '').trim();
      const id = 'record-' + hash(JSON.stringify([group.category, block.year, title, item.authors, item.venue]));
      const occurrence = seen.get(id) ?? 0;
      seen.set(id, occurrence + 1);
      return { id: occurrence ? id + '-' + occurrence : id, title, authors: item.authors, venue: item.venue, amount: item.amount, link: item.link };
    }),
  }));
  return {
    slug, enLabel, enDescription, zhLabel: group.category, description: group.description, type: group.type,
    count: years.reduce((total, block) => total + block.items.length, 0), years,
  };
});

export function categoryPath(slug: string, english = false) {
  return (english ? '/en/achievements' : '/achievements') + (slug ? '/' + slug : '');
}

export const categoryRoutes = () => directory.filter(group => group.slug).map(group => ({ params: { category: group.slug } }));
