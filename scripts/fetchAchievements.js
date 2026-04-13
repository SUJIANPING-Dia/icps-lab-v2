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
      { section: "🏆 學生榮譽", category: "競賽得獎 (Awards)", type: "award", description: "實驗室學生參與競賽之獲獎紀錄。", yearlyData: [] },
      { section: "📜 專利", category: "專利 (Patents)", type: "patent", description: "核准或申請中之專利成果。", yearlyData: [] }
    ];

    let currentIdx = -1;
    let currentYear = "歷年統整"; 

    const elements = $('h2, h3, h4, div, p, ol');

    elements.each((index, element) => {
      const text = $(element).text().trim();
      const tagName = element.tagName.toLowerCase();

      // 1. 判斷目前的分類
      if (text.length > 0 && text.length < 25) {
        let newIdx = currentIdx;
        if (text.includes('榮譽') || text.includes('得獎') || text.includes('競賽')) newIdx = 4;
        else if (text.includes('專利')) newIdx = 5; 
        else if (text.includes('計畫') || text.includes('產學')) newIdx = 3;
        else if (text.includes('期刊論文')) newIdx = 0;
        else if (text.includes('國際研討會')) newIdx = 1;
        else if (text.includes('國內研討會')) newIdx = 2;

        if (newIdx !== currentIdx) {
            currentIdx = newIdx;
            currentYear = "歷年統整";
        }
      }

      // 2. 更新目前的年份標籤
      if (tagName === 'h3') {
        const yearMatch = text.match(/^(\d{4})/);
        if (yearMatch) {
          currentYear = yearMatch[1];
        }
      }

      // 3. 遇到 ol 時，抓取資料
      if (tagName === 'ol' && currentIdx !== -1) {
        $(element).find('li').each((i, li) => {
          const raw = $(li).text().trim();
          if (!raw) return;

          let actualIdx = (raw.includes('FITI') || raw.includes('戰國策')) ? 4 : currentIdx;
          
          // 🌟 核心修改：如果是專利 (actualIdx === 5)，強制全部標記為「歷年專利」
          let itemYear = currentYear;
          if (actualIdx === 5) {
            itemYear = "歷年專利"; 
          }

          let targetYear = finalData[actualIdx].yearlyData.find(y => y.year === itemYear);
          if (!targetYear) {
              targetYear = { year: itemYear, items: [] };
              finalData[actualIdx].yearlyData.push(targetYear);
          }

          if (actualIdx <= 2) {
             const cleanRaw = raw.replace(/[“”「」『』]/g, '"');
             const parts = cleanRaw.split('"');
             if (parts.length >= 3) {
                 targetYear.items.push({ title: parts[1].trim(), authors: parts[0].trim(), venue: parts.slice(2).join('"').trim() });
             }
          } else {
             const amountMatch = raw.match(/([\d,]+)元/);
             targetYear.items.push({
                 content: raw,
                 project: raw,
                 amount: amountMatch ? amountMatch[1] + "元" : ""
             });
          }
        });
      }
    });

    // 年份排序：確保數字年份可以正常排序，文字標籤(歷年專利/統整)則放最前面
    finalData.forEach(cat => {
        cat.yearlyData.sort((a, b) => {
            // 如果是文字標籤，就不做數字相減，避免報錯 NaN
            if (isNaN(a.year) && isNaN(b.year)) return 0;
            if (isNaN(a.year)) return -1;
            if (isNaN(b.year)) return 1;
            return parseInt(b.year) - parseInt(a.year);
        });
    });

    fs.writeFileSync(path.resolve('./src/data/achievements.json'), JSON.stringify(finalData, null, 2), 'utf-8');
    console.log(`✅ 同步完成！`);
  } catch (error) { 
    console.error('❌', error.message); 
  }
}

scrapeData();