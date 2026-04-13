import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import fs from 'fs';
import path from 'path';

const targetUrl = 'https://ec.nkust.edu.tw/p/404-1122-98302.php?Lang=zh-tw';
const agent = new https.Agent({ rejectUnauthorized: false });

async function scrapeData() {
  try {
    console.log('⏳ 正在重整資料庫...');
    const response = await axios.get(targetUrl, { httpsAgent: agent });
    const html = response.data;
    const $ = cheerio.load(html);
    
    const finalData = [
      { section: "📚 學術發表", category: "國際期刊論文", type: "publication", description: "實驗室國際期刊發表紀錄。", yearlyData: [] },
      { category: "國際研討會論文", type: "publication", description: "實驗室國際研討會發表紀錄。", yearlyData: [] },
      { category: "國內研討會論文", type: "publication", description: "實驗室國內研討會發表紀錄。", yearlyData: [] },
      { section: "💡 產學與計畫", category: "研究計畫 (Projects)", type: "project", description: "實驗室承接之專案與產學合作計畫。", yearlyData: [] },
      { section: "🏆 學生榮譽", category: "競賽得獎 (Awards)", type: "award", description: "實驗室學生參與競賽之獲獎紀錄。", yearlyData: [] }
    ];

    let currentCategoryIndex = -1;
    const elements = $('h2, h3, h4, div, p, ol');

    elements.each((index, element) => {
      const tagName = element.tagName.toLowerCase();
      const text = $(element).text().trim();

      // 分類偵測 (縮短字數判斷，更準確)
      if (text.length > 0 && text.length < 25) {
        if (text.includes('榮譽') || text.includes('得獎') || text.includes('競賽')) currentCategoryIndex = 4;
        else if (text.includes('計畫') || text.includes('產學') || text.includes('合約')) currentCategoryIndex = 3;
        else if (text.includes('期刊論文')) currentCategoryIndex = 0;
        else if (text.includes('國際研討會')) currentCategoryIndex = 1;
        else if (text.includes('國內研討會')) currentCategoryIndex = 2;
      }

      if (tagName === 'h3' && currentCategoryIndex !== -1) {
        const yearMatch = text.match(/^(\d{4})/);
        if (yearMatch) {
          const year = yearMatch[1];
          const olElement = $(element).nextAll('ol').first();

          olElement.find('li').each((i, liElem) => {
            let rawText = $(liElem).text().trim();
            if (!rawText) return;

            // 特例過濾
            if (rawText.includes('大專生研究計畫') && rawText.includes('研究創作獎')) return;

            // 類別校正 (FITI、戰國策強制歸類到得獎)
            let actualIdx = currentCategoryIndex;
            if (rawText.includes('FITI') || rawText.includes('戰國策') || rawText.includes('創業競賽')) actualIdx = 4;
            else if (rawText.includes('計畫編號') || rawText.includes('合約編號')) actualIdx = 3;

            let targetYear = finalData[actualIdx].yearlyData.find(y => y.year === year);
            if (!targetYear) {
                targetYear = { year: year, items: [] };
                finalData[actualIdx].yearlyData.push(targetYear);
            }

            if (actualIdx === 4) {
               // 🏆 競賽得獎：簡單切割，不強求複雜規則
               let award = "獲獎";
               let project = rawText;
               let competition = "";

               // 嘗試尋找括號內的獎項
               const awardMatch = rawText.match(/榮獲\s*(.*?)[，,]/) || rawText.match(/榮獲\s*(.*)$/);
               if (awardMatch) award = awardMatch[1].trim();

               const projectMatch = rawText.match(/[「『](.*?)[」』]/);
               if (projectMatch) project = projectMatch[1];

               targetYear.items.push({ award: award.substring(0,10), project, competition: rawText.substring(0, 50) + "..." });

            } else if (actualIdx === 3) {
               // 💡 研究計畫
               const titleMatch = rawText.match(/[『「"“](.*?)[』」"”]/);
               const amountMatch = rawText.match(/([\d,]+)元/);
               const codeMatch = rawText.match(/(計畫編號|合約編號|技轉編號)\s*[：:]\s*([A-Za-z0-9\-\s]+)/);
               
               targetYear.items.push({
                   award: rawText.includes("國科會") ? "國科會" : (rawText.includes("公司") ? "產學合作" : "專案計畫"),
                   project: titleMatch ? titleMatch[1] : rawText.split(/[，,]/)[0],
                   competition: codeMatch ? `${codeMatch[1]}：${codeMatch[2].trim()}` : "產學/計畫案",
                   amount: amountMatch ? amountMatch[1] + "元" : "",
                   type: rawText.includes("公司") ? "產學合作" : "政府計畫"
               });
            } else {
               // 📚 論文
               rawText = rawText.replace(/[“”「」『』]/g, '"');
               const parts = rawText.split('"');
               if (parts.length >= 3) {
                   targetYear.items.push({ title: parts[1].trim(), authors: parts[0].replace(/,\s*$/, '').trim(), venue: parts.slice(2).join('"').replace(/^[\s,]+/, '').trim(), link: "#" });
               } else {
                   targetYear.items.push({ title: rawText, authors: "Lab Members", venue: "", link: "#" });
               }
            }
          });
        }
      }
    });

    fs.writeFileSync(path.resolve('./src/data/achievements.json'), JSON.stringify(finalData, null, 2), 'utf-8');
    console.log(`✅ 資料重整完成！`);
  } catch (error) { console.error('❌', error.message); }
}
scrapeData();