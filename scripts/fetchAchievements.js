import axios from 'axios';
import { load } from 'cheerio';
import { readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const targetUrl = 'https://ec.nkust.edu.tw/p/404-1122-98302.php?Lang=zh-tw';
const categories = [
  { section: '📚 學術發表', category: '國際期刊論文', type: 'publication', description: '收錄於本站的國際期刊論文。' },
  { category: '國際研討會論文', type: 'publication', description: '收錄於本站的國際研討會論文。' },
  { category: '國內研討會論文', type: 'publication', description: '收錄於本站的國內研討會論文。' },
  { section: '💡 產學與計畫', category: '研究計畫 (Projects)', type: 'project', description: '承接之各項研究計畫與產學合作案。' },
  { section: '🏆 學生榮譽', category: '競賽得獎 (Awards)', type: 'award', description: '實驗室學生參與競賽之獲獎紀錄。' },
  { section: '📜 專利', category: '專利 (Patents)', type: 'patent', description: '核准或申請中之專利成果。' },
];

function headingCategory(text) {
  if (!text || text.length >= 25) return undefined;
  if (/榮譽|得獎|競賽/.test(text)) return 4;
  if (/專利/.test(text)) return 5;
  if (/計畫|產學/.test(text)) return 3;
  if (/期刊論文/.test(text)) return 0;
  if (/國際研討會/.test(text)) return 1;
  if (/國內研討會/.test(text)) return 2;
}

function changesByYear(previous, current) {
  const changes = [];
  for (const category of new Set([...previous, ...current].map(group => group.category))) {
    const getCounts = (data) => new Map((data.find(group => group.category === category)?.yearlyData ?? [])
      .map(block => [String(block.year), block.items.length]));
    const before = getCounts(previous);
    const after = getCounts(current);
    for (const year of new Set([...before.keys(), ...after.keys()])) {
      const prior = before.get(year) ?? 0;
      const next = after.get(year) ?? 0;
      if (prior !== next) changes.push({ category, year, before: prior, after: next });
    }
  }
  return changes;
}

export function parseAchievements(html, previous = []) {
  const $ = load(html);
  const groups = categories.map(group => ({ ...group, yearlyData: [] }));
  const quality = { unparsed: [], duplicateProjects: [], missingAmounts: [], changes: [] };
  const seenContracts = new Set();
  let category;
  let year = '歷年統整';

  $('h2,h3,h4,div,p,ol').each((_, element) => {
    const node = $(element);
    if (element.tagName !== 'ol') {
      const text = node.text().trim();
      const heading = headingCategory(text);
      if (heading !== undefined && heading !== category) {
        category = heading;
        year = '歷年統整';
      }
      if (element.tagName === 'h3' && /^\d{4}/.test(text)) year = text.slice(0, 4);
      return;
    }
    if (category === undefined) return;
    node.children('li').each((_, row) => {
      const raw = $(row).text().trim();
      if (!raw) return;
      const group = groups[/FITI|戰國策/.test(raw) ? 4 : category];
      const itemYear = group.type === 'patent' ? '歷年專利' : year;
      const source = { category: group.category, year: itemYear, raw };
      let item;
      if (group.type === 'publication') {
        const normalized = raw.replace(/[“”「」『』＂]/g, '"');
        const quote = normalized.match(/^([^"]+)"([^"]+)"([\s\S]+)$/);
        if (!quote || quote.slice(1).some(part => !part.trim())) {
          quality.unparsed.push({ ...source, reason: '無法從原始列識別作者、題名及出處。' });
          return;
        }
        item = { title: quote[2].trim(), authors: quote[1].trim(), venue: quote[3].trim() };
      } else {
        const amount = raw.match(/([\d,]+)\s*元/)?.[1];
        item = { content: raw, project: raw, amount: amount ? amount + '元' : '' };
        if (group.type === 'project') {
          if (/(?:合約|計畫|技轉)編號\s*[:：]\s*[a-z0-9]/i.test(raw)) {
            // Only identical source rows in the same year qualify. Multi-year awards often share a contract number.
            const key = JSON.stringify([itemYear, raw]);
            if (seenContracts.has(key)) {
              quality.duplicateProjects.push({ ...source, reason: '同年度、同合約、期間與原文完全相同。' });
              return;
            }
            seenContracts.add(key);
          }
          if (!amount) quality.missingAmounts.push({ ...source, reason: '原始列未提供可識別的金額。' });
        }
      }
      let block = group.yearlyData.find(entry => entry.year === itemYear);
      if (!block) {
        block = { year: itemYear, items: [] };
        group.yearlyData.push(block);
      }
      block.items.push(item);
    });
  });
  for (const group of groups) {
    group.yearlyData.sort((a, b) => {
      const ay = Number(a.year), by = Number(b.year);
      if (Number.isNaN(ay)) return Number.isNaN(by) ? 0 : -1;
      return Number.isNaN(by) ? 1 : by - ay;
    });
  }
  quality.changes = changesByYear(previous, groups);
  return { groups, quality };
}

export function syncFromHtml(html, destination, reportPath) {
  const previous = JSON.parse(readFileSync(destination, 'utf8'));
  const { groups, quality } = parseAchievements(html, previous);
  if (reportPath) writeFileSync(reportPath, JSON.stringify(quality, null, 2), 'utf8');
  console.log('成果同步品質', JSON.stringify(quality));
  if (quality.unparsed.length) throw new Error('有成果列需要人工核對，已保留現有資料。');
  if (groups.some(group => !group.yearlyData.length)) throw new Error('來源未提供完整分類，已保留現有資料。');
  const total = data => data.flatMap(group => group.yearlyData).reduce((n, block) => n + block.items.length, 0);
  if (total(groups) <= 0.7 * total(previous)) throw new Error('總筆數下滑 30% 或以上，已保留現有資料。');
  const temp = destination + '.' + randomUUID() + '.tmp';
  try {
    writeFileSync(temp, JSON.stringify(groups, null, 2), 'utf8');
    renameSync(temp, destination);
  } finally {
    rmSync(temp, { force: true });
  }
  return quality;
}

if (import.meta.main) {
  try {
    const { data: html } = await axios.get(targetUrl, { timeout: 30_000 });
    const reportPath = process.env.RUNNER_TEMP && path.join(process.env.RUNNER_TEMP, 'achievements-quality.json');
    syncFromHtml(html, path.resolve('src/data/achievements.json'), reportPath);
    console.log('成果同步完成。');
  } catch (error) {
    console.error('成果同步失敗', error.message);
    process.exitCode = 1;
  }
}
