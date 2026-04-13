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
    
    console.log('✅ 抓取成功！執行特例校正與資料過濾...');

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

      if (text.length > 0 && text.length < 30) {
        if (text.includes('榮譽') || text.includes('得獎') || text.includes('競賽')) currentCategoryIndex = 4;
        else if (text.includes('計畫') || text.includes('產學') || text.includes('合約')) currentCategoryIndex = 3;
        else if (text.includes('期刊論文') && !text.includes('研討會')) currentCategoryIndex = 0;
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

            // 🚫 【規則 1：排除不需要的資料】
            if (rawText.includes('大專生研究計畫') && rawText.includes('研究創作獎')) {
                return; // 直接跳過這筆
            }

            // 🎯 【規則 2：競賽特徵強化】
            // 即使包含「計畫」二字，只要有以下關鍵字，強制歸類為競賽得獎 (Index 4)
            const isAwardForceMatch = rawText.includes('FITI') || rawText.includes('戰國策') || 
                                     rawText.includes('創業競賽') || rawText.includes('創新創業');
            
            const isStandardAward = rawText.includes('佳作') || rawText.includes('冠軍') || 
                                    rawText.includes('第') && rawText.includes('名') ||
                                    rawText.includes('金牌') || rawText.includes('優等');

            // 💡 計畫特徵
            const isProject = (rawText.includes('計畫編號') || rawText.includes('合約編號') || rawText.includes('產學合作')) && !isAwardForceMatch;

            let actualCategoryIndex = currentCategoryIndex;
            if (isAwardForceMatch || isStandardAward) actualCategoryIndex = 4;
            else if (isProject) actualCategoryIndex = 3;

            let targetYearData = finalData[actualCategoryIndex].yearlyData.find(y => y.year === year);
            if (!targetYearData) {
                targetYearData = { year: year, items: [] };
                finalData[actualCategoryIndex].yearlyData.push(targetYearData);
            }

            if (actualCategoryIndex === 4) {
               // 🏆 競賽切割
               let awardText = "獲獎";
               let projectText = rawText;
               let competitionText = "";

               // 針對 FITI 和 戰國策 的特殊標題處理
               if (rawText.includes('FITI') || rawText.includes('戰國策')) {
                   awardText = "入圍/獲獎";
                   projectText = rawText;
                   competitionText = "創業競賽專案";
               } else {
                   const projectMatch = rawText.match(/作品[：:]\s*[「『]?(.*?)[」』]?$/);
                   if (projectMatch) projectText = projectMatch[1].trim();
                   const awardMatch = rawText.match(/榮獲(.*?)(?:[，,]|作品[：:])/);
                   if (awardMatch) awardText = awardMatch[1].trim();
               }
               
               targetYearData.items.push({ award: awardText.substring(0, 10), project: projectText, competition: competitionText });

            } else if (actualCategoryIndex === 3) {
               // 計畫切割
               const titleMatch = rawText.match(/[『「"“](.*?)[』」"”]/);
               const projectTitle = titleMatch ? titleMatch[1] : rawText.split(/[，,]/)[0];
               const amountMatch = rawText.match(/([\d,]+)元/);
               const amount = amountMatch ? amountMatch[1] + "元" : "";
               const codeMatch = rawText.match(/(計畫編號|合約編號|技轉編號)\s*[：:]\s*([A-Za-z0-9\-\s]+)/);
               
               targetYearData.items.push({
                   award: rawText.includes("國科會") ? "國科會" : "產學合作",
                   project: projectTitle,
                   competition: codeMatch ? `${codeMatch[1]}：${codeMatch[2].trim()}` : "專案計畫",
                   amount: amount
               });
            } else {
               // 論文切割
               rawText = rawText.replace(/[“”「」『』]/g, '"');
               const parts = rawText.split('"');
               if (parts.length >= 3) {
                   targetYearData.items.push({ 
                       title: parts[1].trim(), 
                       authors: parts[0].replace(/,\s*$/, '').trim(), 
                       venue: parts.slice(2).join('"').replace(/^[\s,]+/, '').trim(), 
                       link: "#" 
                   });
               }
            }
          });
        }
      }
    });

    const filePath = path.resolve('./src/data/achievements.json');
    fs.writeFileSync(filePath, JSON.stringify(finalData, null, 2), 'utf-8');
    console.log(`🎉 規則更新完成！FITI 與 戰國策 已歸位。`);
  } catch (error) { console.error('❌', error.message); }
}

scrapeData();