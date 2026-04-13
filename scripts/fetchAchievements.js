import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import fs from 'fs';
import path from 'path';

const targetUrl = 'https://ec.nkust.edu.tw/p/404-1122-98302.php?Lang=zh-tw';
const agent = new https.Agent({ rejectUnauthorized: false });

async function scrapeData() {
  try {
    console.log('⏳ 正在前往高科大網站抓取資料...');
    const response = await axios.get(targetUrl, { httpsAgent: agent });
    const html = response.data;
    const $ = cheerio.load(html);
    
    console.log('✅ 抓取成功！開始執行最強防呆分類...');

    const finalData = [
      { section: "📚 學術發表", category: "國際期刊論文", type: "publication", description: "本實驗室發表於國際頂尖與高影響力期刊之研究成果。", yearlyData: [] },
      { category: "國際研討會論文", type: "publication", description: "本實驗室發表於國際學術研討會之研究成果。", yearlyData: [] },
      { category: "國內研討會論文", type: "publication", description: "本實驗室發表於國內學術研討會之研究成果。", yearlyData: [] },
      { section: "💡 產學與計畫", category: "研究計畫 (Projects)", type: "project", description: "本實驗室承接之國科會、產學合作及各項專案研究計畫。", yearlyData: [] },
      { section: "🏆 學生榮譽", category: "競賽得獎 (Awards)", type: "award", description: "實驗室積極鼓勵學生參與各項全國性與國際性競賽，屢獲佳績。", yearlyData: [] }
    ];

    let currentCategoryIndex = -1;
    const elements = $('h2, h3, h4, div, p, ol');

    elements.each((index, element) => {
      const tagName = element.tagName.toLowerCase();
      const text = $(element).text().trim();

      // 🔍 1. 分類雷達 (加入防護罩：只有字數少於 30 字的「純標題」才能切換分類)
      if (text.length > 0 && text.length < 30) {
        if (text.includes('榮譽') || text.includes('得獎') || text.includes('競賽') || text.includes('學生獲獎')) {
          currentCategoryIndex = 4;
        } else if (text.includes('計畫') || text.includes('產學')) {
          currentCategoryIndex = 3;
        } else if (text.includes('期刊論文') && !text.includes('研討會')) {
          currentCategoryIndex = 0;
        } else if (text.includes('國際研討會')) {
          currentCategoryIndex = 1;
        } else if (text.includes('國內研討會')) {
          currentCategoryIndex = 2;
        }
      }

      // 🔍 2. 開始逐筆抓取
      if (tagName === 'h3' && currentCategoryIndex !== -1) {
        const yearMatch = text.match(/^(\d{4})/);
        if (yearMatch) {
          const year = yearMatch[1];
          const olElement = $(element).nextAll('ol').first();

          olElement.find('li').each((i, liElem) => {
            let rawText = $(liElem).text().trim();
            if (!rawText) return;

            // 🐞【單筆強制校正機制】
            // 定義「獎項」特徵
            const isAward = rawText.includes('佳作') || rawText.includes('冠軍') || rawText.includes('亞軍') || 
                            rawText.includes('季軍') || rawText.match(/第[一二三四五六七八九十]+名/) || 
                            rawText.includes('金牌') || rawText.includes('銀牌') || rawText.includes('銅牌') || 
                            rawText.includes('優勝') || rawText.includes('優等') || rawText.includes('新創獎') || rawText.includes('特別獎');
            // 定義「計畫」特徵
            const isProject = rawText.includes('計畫編號') || rawText.includes('計畫主持人') || rawText.includes('產學合作');

            let actualCategoryIndex = currentCategoryIndex;
            
            // 如果它有獎項特徵，強制踢去第 4 區 (得獎)
            if (isAward) { 
                actualCategoryIndex = 4; 
            } 
            // 如果它有計畫特徵，強制踢去第 3 區 (計畫)
            else if (isProject) { 
                actualCategoryIndex = 3; 
            }

            // 取得或建立該分類的該年份陣列
            let targetYearData = finalData[actualCategoryIndex].yearlyData.find(y => y.year === year);
            if (!targetYearData) {
                targetYearData = { year: year, items: [] };
                finalData[actualCategoryIndex].yearlyData.push(targetYearData);
            }

            // --- 開始切割邏輯 ---
            if (actualCategoryIndex === 4) {
               // 🏆 得獎切割 (用逗號、頓號切)
               const parts = rawText.split(/[,，、]/);
               if (parts.length >= 3) {
                   targetYearData.items.push({ award: parts[0].trim(), project: parts[1].trim(), competition: parts.slice(2).join(',').trim() });
               } else if (parts.length === 2) {
                   targetYearData.items.push({ award: parts[0].trim(), project: parts[1].trim(), competition: "" });
               } else {
                   targetYearData.items.push({ award: "榮譽獎項", project: rawText, competition: "" });
               }

            } else if (actualCategoryIndex === 3) {
               // 💡 計畫切割
               const titleMatch = rawText.match(/[『「"“](.*?)[』」"”]/);
               const title = titleMatch ? titleMatch[1] : rawText.split(/[，,]/)[0] || rawText;
               let details = rawText;
               if (titleMatch) details = rawText.replace(titleMatch[0], '').trim();
               details = details.replace(/^[，、,\-]+\s*/, '');
               targetYearData.items.push({ award: "計畫/產學", project: title, competition: details });

            } else {
               // 📚 論文切割 (期刊、研討會)
               rawText = rawText.replace(/[“”「」『』]/g, '"');
               const parts = rawText.split('"');
               
               if (parts.length >= 3) {
                   const authors = parts[0].replace(/,\s*$/, '').trim();
                   const title = parts[1].trim();
                   const venue = parts.slice(2).join('"').replace(/^[\s,]+/, '').trim();
                   targetYearData.items.push({ title, authors, venue, link: "#" });
               } else {
                   const fallbackParts = rawText.split(/[,，]/);
                   if(fallbackParts.length >= 2) {
                       const authors = fallbackParts[0].trim();
                       const title = fallbackParts.slice(1).join(',').trim();
                       targetYearData.items.push({ title: title, authors: authors, venue: "", link: "#" });
                   } else {
                       targetYearData.items.push({ title: rawText, authors: "作者資訊遺失", venue: "", link: "#" });
                   }
               }
            }
          });
        }
      }
    });

    const dirPath = path.resolve('./src/data');
    const filePath = path.resolve('./src/data/achievements.json');
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(finalData, null, 2), 'utf-8');
    
    console.log(`🎉 分類雷達升級完成！資料已完美歸位：${filePath}`);

  } catch (error) {
    console.error('❌ 抓取失敗：', error.message);
  }
}

scrapeData();