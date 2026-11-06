// Reviewed names from achievements.json project records, 2026-11-06.
// source = [year, zero-based item index] for provenance, never an array lookup at runtime.
// Add a reviewed entry when new source records name a new organization.
const entry = (name, year, index, aliases = [name]) => ({ name, aliases, source: [year, index] });

export const partnerRegistry = {
  industry: [
    entry('日月光半導體製造股份有限公司', 2026, 5),
    entry('磐誠工程顧問股份有限公司', 2026, 6),
    entry('鑽之韻國際有限公司', 2026, 7),
    entry('名將實業有限公司', 2025, 15),
    entry('華電聯網股份有限公司', 2025, 17),
    entry('和碩聯合科技股份有限公司', 2025, 18),
    entry('睿橋資訊股份有限公司', 2025, 20),
    entry('華泰電子股份有限公司', 2024, 3),
    entry('毅智科技有限公司', 2024, 7),
    entry('佐臻股份有限公司', 2023, 5),
    entry('清大行股份有限公司', 2022, 2),
    entry('西柏容有限公司', 2022, 3),
    entry('台灣松下電器股份有限公司', 2022, 5),
    entry('雄欣科技股份有限公司', 2022, 8),
    entry('百國科技股份有限公司', 2022, 10),
    entry('東海清有限公司', 2021, 5),
    entry('髮妍科技有限公司', 2021, 6),
    entry('壟銓科技股份有限公司', 2021, 8),
    entry('經昌汽車電子工業股份有限公司', 2021, 10),
    entry('睿揚創新科技有限公司', 2021, 14),
    entry('髮林國際健康時尚有限公司', 2021, 15),
    entry('廣新開發股份有限公司', 2020, 9),
    entry('明莘科技有限公司', 2020, 10),
    entry('敦玉科技有限公司', 2020, 11),
    entry('萬泰機械廠股份有限公司', 2020, 12),
    entry('聖凡資訊有限公司', 2020, 13),
    entry('華亨科技股份有限公司', 2020, 16),
    entry('鐸拉系統整合服務股份有限公司', 2020, 17),
    entry('任采國際有限公司', 2020, 22),
    entry('敦謙國際智能酒店股份有限公司', 2020, 23),
    entry('恩比歐科技有限公司', 2019, 11),
    entry('漢程汽車客運有限公司', 2019, 15),
    entry('浩森工業有限公司', 2019, 16),
    entry('偕行科技股份有限公司', 2018, 8),
    entry('昊成股份有限公司', 2018, 9),
    entry('高光綠能有限公司', 2018, 10),
    entry('智取數位科技股份有限公司', 2018, 11),
    entry('府城新幹線有限公司', 2018, 13),
    entry('亞邦國際科技股份有限公司', 2018, 16),
    entry('宇宙新幹線科技有限公司', 2017, 9),
    entry('安捷科股份有限公司', 2017, 10),
    entry('冠陞企業管理顧問股份有限公司', 2017, 12),
    entry('寶創企業股份有限公司', 2017, 14),
    entry('易學通有限公司', 2016, 7),
    entry('米蘭時尚髮型有限公司', 2016, 9),
    entry('展洲企業有限公司', 2015, 13),
    entry('愛力達鞋業', 2015, 15),
    entry('小霸氣有限公司', 2015, 16),
    entry('上海複芯微電子技術諮詢有限公司', 2015, 21),
    entry('府城國際租賃有限公司', 2015, 22),
  ],
  healthcare: [
    entry('基督復臨安息日會醫療財團法人臺安醫院', 2025, 16),
    entry('戴德森醫療財團法人嘉義基督教醫院', 2024, 6, ['戴德森醫療財團法人嘉義基督教醫院', '嘉義基督教醫院']),
    entry('台北三軍總醫院', 2023, 6),
  ],
  institutions: [
    entry('國科會（含科技部時期）', 2026, 0, ['國科會', '科技部']),
    entry('教育部', 2026, 4),
    entry('教育部青年發展署', 2021, 3),
    entry('勞動部勞動力發展署高屏澎東分署', 2025, 13),
    entry('財團法人工業技術研究院', 2025, 14),
    entry('財團法人船舶暨海洋產業研發中心', 2025, 21),
    entry('財團法人資訊工業策進會', 2023, 3),
    entry('中華民國消費電子學會', 2026, 8),
    entry('台灣流行病學學會', 2022, 6),
    entry('勞動部勞動及職業安全衛生研究所', 2020, 6),
    entry('經濟部中小企業處', 2019, 7),
    entry('台南市政府', 2017, 7),
    entry('財團法人台灣經濟研究院', 2015, 11),
    entry('國家實驗研究院', 2017, 4),
    entry('文化部', 2016, 4),
    entry('經濟部工業局', 2018, 7),
    entry('經濟部技術處', 2015, 7),
    entry('科技部南部科學園區管理局', 2019, 4),
  ],
};

const unquoted = text => text.replace(/『[^』]*』|「[^」]*」|"[^"]*"/g, ' ');
const escapePattern = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function namesInRecord(text, alias) {
  // A parent ministry must not match the prefix of an agency or an ambiguous park name.
  if (['國科會', '科技部', '教育部', '文化部'].includes(alias)) {
    return new RegExp(`(?<![\\p{L}\\p{N}])${escapePattern(alias)}(?![\\p{L}\\p{N}])`, 'u').test(text);
  }
  return text.includes(alias);
}

export function getProjectPartners(achievements = []) {
  const records = achievements.filter(group => group.type === 'project')
    .flatMap(group => group.yearlyData ?? [])
    .flatMap(block => block.items ?? [])
    .map(item => unquoted(item.project || item.content || ''));
  return Object.fromEntries(Object.entries(partnerRegistry).map(([category, entries]) => [category,
    entries.filter(partner => records.some(record => partner.aliases.some(alias => namesInRecord(record, alias))))
      .map(partner => partner.name).sort((a, b) => a.localeCompare(b, 'zh-Hant')),
  ]));
}
