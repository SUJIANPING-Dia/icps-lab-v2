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
    
    console.log('✅ 抓取成功！開始執行終極資料淨化...');

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

      if (tagName === 'h3' && currentCategoryIndex !== -1) {
        const yearMatch = text.match(/^(\d{4})/);
        if (yearMatch) {
          const year = yearMatch[1];
          const olElement = $(element).nextAll('ol').first();

          olElement.find('li').each((i, liElem) => {
            let rawText = $(liElem).text().trim();
            if (!rawText) return;

            const isAward = rawText.includes('佳作') || rawText.includes('冠軍') || rawText.includes('亞軍') || 
                            rawText.includes('季軍') || rawText.match(/第[一二三四五六七八九十]+名/) || 
                            rawText.includes('金牌') || rawText.includes('銀牌') || rawText.includes('銅牌') || 
                            rawText.includes('優勝') || rawText.includes('優等') || rawText.includes('新創獎') || rawText.includes('特別獎');
            const isProject = rawText.includes('計畫編號') || rawText.includes('計畫主持人') || rawText.includes('產學合作');

            let actualCategoryIndex = currentCategoryIndex;
            if (isAward) actualCategoryIndex = 4; 
            else if (isProject) actualCategoryIndex = 3; 

            let targetYearData = finalData[actualCategoryIndex].yearlyData.find(y => y.year === year);
            if (!targetYearData) {
                targetYearData = { year: year, items: [] };
                finalData[actualCategoryIndex].yearlyData.push(targetYearData);
            }

            if (actualCategoryIndex === 4) {
               // 🏆 【精準萃取】得獎紀錄智慧切割
               let awardText = "榮譽獎項";
               let projectText = rawText;
               let competitionText = "";

               // 1. 抓取「作品名稱」 (找"作品："後面的字)
               let projectMatch = rawText.match(/作品[：:]\s*[「『]?(.*?)[」』]?$/);
               if (projectMatch) {
                   projectText = projectMatch[1].trim();
               }

               // 2. 抓取「競賽名稱」 (找引號內，或是破折號前面的字)
               let compMatch = rawText.match(/[『「](.*?)[』」](.*?)(?:[-－–—]+|榮獲)/);
               if (compMatch) {
                   competitionText = (compMatch[1] + " " + compMatch[2]).trim();
               } else {
                   let plainCompMatch = rawText.match(/^(?:指導學生參加)?(.*?)[-－–—]/);
                   if (plainCompMatch) {
                       competitionText = plainCompMatch[1].trim();
                   }
               }

               // 3. 抓取「獎項」 (找"榮獲"後面的字)
               let awardMatch = rawText.match(/榮獲(.*?)(?:[，,]|作品[：:])/);
               if (awardMatch) {
                   awardText = awardMatch[1].trim();
               } else {
                   let dashMatch = rawText.match(/[-－–—]\s*(.*?)[，,]\s*作品/);
                   if (dashMatch) {
                       awardText = dashMatch[1].trim();
                   }
               }

               // 萬一完全不符合常見格式，做簡單的切割防呆
               if (!projectMatch && competitionText === "" && awardText === "榮譽獎項") {
                   const parts = rawText.split(/[,，、]/);
                   if (parts.length >= 3) {
                       awardText = parts[0].replace(/指導學生參加.*?[-－–—]\s*榮獲/, '').replace(/指導學生參加.*?[-－–—]\s*/, '').trim();
                       projectText = parts[1].replace(/作品[：:]\s*/, '').replace(/^[「『]/, '').replace(/[」』]$/, '').trim();
                       competitionText = parts.slice(2).join(',').trim();
                   } else if (parts.length === 2) {
                       awardText = parts[0].replace(/指導學生參加.*?[-－–—]\s*榮獲/, '').trim();
                       projectText = parts[1].replace(/作品[：:]\s*/, '').replace(/^[「『]/, '').replace(/[」』]$/, '').trim();
                   }
               }

               // 把殘留的破折號清乾淨
               awardText = awardText.replace(/[-－–—]/g, '').trim();
               
               // 防止太長破壞版面，如果真的切錯超過 8 個字，就只取前 6 個字加 ...
               if(awardText.length > 8) {
                   awardText = awardText.substring(0, 6) + '...';
               }

               targetYearData.items.push({ 
                   award: awardText || "獎項", 
                   project: projectText || "無專案名稱", 
                   competition: competitionText 
               });

            } else if (actualCategoryIndex === 3) {
               // 計畫切割
               const titleMatch = rawText.match(/[『「"“](.*?)[』」"”]/);
               const title = titleMatch ? titleMatch[1] : rawText.split(/[，,]/)[0] || rawText;
               let details = rawText;
               if (titleMatch) details = rawText.replace(titleMatch[0], '').trim();
               details = details.replace(/^[，、,\-]+\s*/, '');
               targetYearData.items.push({ award: "計畫/產學", project: title, competition: details });

            } else {
               // 論文切割
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
                       targetYearData.items.push({ title: rawText, authors: "作者資訊", venue: "", link: "#" });
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
    
    console.log(`🎉 資料淨化完成！`);

  } catch (error) {
    console.error('❌ 抓取失敗：', error.message);
  }
}

scrapeData();