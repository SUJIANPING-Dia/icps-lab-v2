import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import fs from 'fs';
import path from 'path';

const targetUrl = 'https://ec.nkust.edu.tw/p/404-1122-98302.php?Lang=zh-tw';
const agent = new https.Agent({ rejectUnauthorized: false });

async function scrapeData() {
  try {
    console.log('⏳ 正在同步原始資料...');
    const response = await axios.get(targetUrl, { httpsAgent: agent });
    const html = response.data;
    const $ = cheerio.load(html);
    
    const finalData = [
      { section: "📚 學術發表", category: "國際期刊論文", type: "publication", description: "發表於國際頂尖期刊之研究成果。", yearlyData: [] },
      { category: "國際研討會論文", type: "publication", description: "發表於國際學術研討會之研究成果。", yearlyData: [] },
      { category: "國內研討會論文", type: "publication", description: "發表於國內學術研討會之研究成果。", yearlyData: [] },
      { section: "💡 產學與計畫", category: "研究計畫 (Projects)", type: "project", description: "承接之各項研究計畫與產學合作案。", yearlyData: [] },
      { section: "🏆 學生榮譽", category: "競賽得獎 (Awards)", type: "award", description: "實驗室學生參與競賽之獲獎紀錄。", yearlyData: [] }
    ];

    let currentIdx = -1;
    const elements = $('h2, h3, h4, div, p, ol');

    elements.each((index, element) => {
      const text = $(element).text().trim();
      if (text.length > 0 && text.length < 25) {
        if (text.includes('榮譽') || text.includes('得獎') || text.includes('競賽')) currentIdx = 4;
        else if (text.includes('計畫') || text.includes('產學')) currentIdx = 3;
        else if (text.includes('期刊論文')) currentIdx = 0;
        else if (text.includes('國際研討會')) currentIdx = 1;
        else if (text.includes('國內研討會')) currentIdx = 2;
      }

      if (element.tagName.toLowerCase() === 'h3' && currentIdx !== -1) {
        const yearMatch = text.match(/^(\d{4})/);
        if (yearMatch) {
          const year = yearMatch[1];
          const ol = $(element).nextAll('ol').first();

          ol.find('li').each((i, li) => {
            const raw = $(li).text().trim();
            if (!raw) return;

            // 分類校正 (FITI、戰國策歸類到得獎)
            let actualIdx = (raw.includes('FITI') || raw.includes('戰國策')) ? 4 : currentIdx;
            
            let targetYear = finalData[actualIdx].yearlyData.find(y => y.year === year);
            if (!targetYear) {
                targetYear = { year, items: [] };
                finalData[actualIdx].yearlyData.push(targetYear);
            }

            // 全部原封不動，只區分論文和其他
            if (actualIdx <= 2) {
               // 論文
               const cleanRaw = raw.replace(/[“”「」『』]/g, '"');
               const parts = cleanRaw.split('"');
               if (parts.length >= 3) {
                   targetYear.items.push({ title: parts[1].trim(), authors: parts[0].trim(), venue: parts.slice(2).join('"').trim() });
               }
            } else {
               // 計畫與得獎：直接存入 project 欄位
               const amountMatch = raw.match(/([\d,]+)元/);
               targetYear.items.push({
                   project: raw,
                   amount: amountMatch ? amountMatch[1] + "元" : ""
               });
            }
          });
        }
      }
    });

    // 年份排序：新到舊
    finalData.forEach(cat => cat.yearlyData.sort((a, b) => b.year - a.year));

    fs.writeFileSync(path.resolve('./src/data/achievements.json'), JSON.stringify(finalData, null, 2), 'utf-8');
    console.log(`✅ 同步完成！`);
  } catch (error) { console.error('❌', error.message); }
}
scrapeData();