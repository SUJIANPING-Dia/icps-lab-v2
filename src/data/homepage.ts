import { getProjectPartners } from "./partners.mjs";

interface AchievementGroup {
  type: string;
  category: string;
  yearlyData: { items: { amount?: string; title?: string; project?: string; content?: string }[] }[];
}

export function getHomepageStatistics(groups: AchievementGroup[]) {
  const countRecords = (matches: (group: AchievementGroup) => boolean) => groups
    .filter(matches)
    .reduce((total, group) => total + group.yearlyData.reduce((n, year) => n + year.items.length, 0), 0);

  let reportedFunding = 0;
  let unreportedProjects = 0;
  for (const group of groups.filter(group => group.type === "project")) {
    for (const year of group.yearlyData) {
      for (const project of year.items) {
        const amount = project.amount?.trim();
        if (amount && /^(?:\d+|\d{1,3}(?:,\d{3})+)元?$/.test(amount)) {
          reportedFunding += Number(amount.replace(/[,元]/g, ""));
        } else {
          unreportedProjects++;
        }
      }
    }
  }
  return {
    awardCount: countRecords(group => group.type === "award"),
    patentCount: countRecords(group => group.type === "patent"),
    journalCount: countRecords(group => group.category.includes("國際期刊")),
    confCount: countRecords(group => group.category.includes("國際研討會")),
    partnerCount: getProjectPartners(groups).industry.length,
    reportedFunding, unreportedProjects,
  };
}

const featuredWorks = [
  { title: "KneeEye", category: "Healthcare AI", image: "kneeeye", zh: "雙模態膝反射量化評估系統", en: "Dual-modal patellar tendon reflex quantification system" },
  { title: "PigView", category: "Smart Farming", image: "pigview", zh: "AI 豬隻體重估測系統", en: "AI-based pig weight estimation system" },
  { title: "iEar", category: "Healthcare AI", image: "iear", zh: "AI 智慧中耳炎診斷系統", en: "AI-powered otitis media diagnosis system" },
  { title: "iNoodle", category: "Smart Manufacturing", image: "inoodle", zh: "泡麵調味包 AI 辨識系統", en: "AI seasoning packet recognition system" },
  { title: "ToFPose", category: "Healthcare AI", image: "tofpose", zh: "具隱私保護之飛時測距骨架估測", en: "Privacy-preserving ToF skeleton estimation" },
  { title: "GaitMirror", category: "Healthcare AI", image: "gaitmirror", zh: "AI 步態偵測系統", en: "AI gait analysis system" },
  { title: "AOI+", category: "Smart Manufacturing", image: "aoi-plus", full: "aoi-plus-full.png", zh: "主機板 CPU 周圍電容缺漏焊自動檢測系統", en: "Automated missing-solder inspection for capacitors around motherboard CPUs" },
  { title: "iMP Viewer", category: "Environmental AI", image: "imp-viewer", full: "imp-viewer-full.png", zh: "空氣微塑膠辨識與二維尺寸估測系統", en: "Edge-AI airborne microplastic detection and 2D size estimation" },
  { title: "SDView", category: "Smart Manufacturing", image: "sdview", full: "sdview-full.png", zh: "SD 卡印刷瑕疵非監督式檢測系統", en: "Unsupervised SD card printing defect inspection" },
];

export function getFeaturedWorks(lang: "zh" | "en") {
  return featuredWorks.map(work => {
    const thumb = `/images/${work.image}-display.webp`;
    return { title: work.title, category: work.category, desc: work[lang], thumb, full: work.full ? `/images/${work.full}` : thumb };
  });
}
