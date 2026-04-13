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
    
    console.log('✅ 抓取成功！開始執行進階金額過濾機制...');

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
        else if (text.includes('計畫') || text.includes('產學')) currentCategoryIndex = 3;
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

            const isProject = rawText.includes('計畫編號') || rawText.includes('計畫主持人') || rawText.includes('產學合作');
            const isAward = !isProject && (rawText.includes('佳作') || rawText.includes('冠軍') || rawText.includes('第') && rawText.includes('名'));

            let actualCategoryIndex = currentCategoryIndex;
            if (isAward) actualCategoryIndex = 4;
            else if (isProject) actualCategoryIndex = 3;

            let targetYearData = finalData[actualCategoryIndex].yearlyData.find(y => y.year === year);
            if (!targetYearData) {
                targetYearData = { year: year, items: [] };
                finalData[actualCategoryIndex].yearlyData.push(targetYearData);
            }

            if (actualCategoryIndex === 3) {
               // 💡 【計畫金額邏輯優化】
               const titleMatch = rawText.match(/[『「"“](.*?)[』」"”]/);
               const projectTitle = titleMatch ? titleMatch[1] : rawText.split(/[，,]/)[0];
               
               // 💰 修改點：優先抓取出現的第一組「數字+元」，並過濾掉複雜的內文
               // 這樣即使後面有「含技轉金XXX元」，也會因為這條規則只抓最前面的總額
               const amountMatch = rawText.match(/([\d,]+)元/);
               const amount = amountMatch ? amountMatch[1] + "元" : "";

               const agencies = ["國科會", "教育部", "經濟部", "科技部", "國防部", "內政部", "衛生福利部"];
               let agency = "合作機構";
               for (const a of agencies) {
                   if (rawText.includes(a)) { agency = a; break; }
               }
               if (agency === "合作機構") {
                   const companyMatch = rawText.match(/([\u4e00-\u9fa5]{2,15}(?:公司|廠|醫院))/);
                   if (companyMatch) agency = companyMatch[1];
               }

               const codeMatch = rawText.match(/計畫編號\s*[：:]\s*([A-Za-z0-9\-\s]+)/);
               const code = codeMatch ? codeMatch[1].trim() : "";

               targetYearData.items.push({
                   award: agency,
                   project: projectTitle,
                   competition: code ? `計畫編號：${code}` : "專案計畫",
                   amount: amount
               });

            } else if (actualCategoryIndex === 4) {
               // 競賽處理...
               let awardText = "獎項";
               let projectText = rawText;
               let competitionText = "";
               const projectMatch = rawText.match(/作品[：:]\s*[「『]?(.*?)[」』]?$/);
               if (projectMatch) projectText = projectMatch[1].trim();
               const compMatch = rawText.match(/[『「](.*?)[』」](.*?)(?:[-－]+|榮獲)/);
               if (compMatch) competitionText = (compMatch[1] + " " + compMatch[2]).trim();
               const awardMatch = rawText.match(/榮獲(.*?)(?:[，,]|作品[：:])/);
               if (awardMatch) awardText = awardMatch[1].trim();
               
               targetYearData.items.push({ award: awardText.substring(0, 8), project: projectText, competition: competitionText });

            } else {
               // 論文處理...
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
    console.log(`🎉 金額校正完成！`);
  } catch (error) { console.error('❌', error.message); }
}

scrapeData();