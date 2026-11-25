type Language = "zh" | "en";
type Localized<T> = Record<Language, T>;

export interface Student {
  id: string;
  name: string;
  degree: "master" | "phd" | "undergrad" | "international";
  track?: "preMaster";
  grade?: string;
  status: "active" | "graduated";
  enrollmentYear: number | null;
  graduationYear: number | null;
  project: string;
  summary?: string;
  img: string | null;
}

const assistants = [
  {
    id: "assistant-001", name: "孫婉怡",
    email: "avasun33@nkust.edu.tw", ext: "07-3814526 #15650", img: "/images/S2.JPG",
    title: { zh: "專任資深經理", en: "Senior Full-Time Manager" },
    duties: {
      zh: ["公部門計畫進度與經費管控","協助執行勞動部「AI智慧製造產業人才培訓據點」計畫","公文收發與行政庶務","臨時交辦任務"],
      en: ["Public-sector project schedule and budget management","Support the Ministry of Labor AI Smart Manufacturing Talent Training Hub project","Official correspondence and administrative affairs","Ad hoc assignments"],
    },
  },
  {
    id: "assistant-002", name: "林穎琪",
    email: "yingchi2025@nkust.edu.tw", ext: "07-3814526 #15650", img: "/images/S1.JPG",
    title: { zh: "專任經理", en: "Full-Time Manager" },
    duties: {
      zh: ["實驗室相關業務","公部門計畫進度與經費管控","產學合作進度管控","勞動部計畫進度管控","公文收發與行政庶務","臨時交辦任務"],
      en: ["Laboratory operations","Public-sector project schedule and budget management","Industry-academia collaboration progress tracking","Ministry of Labor project progress tracking","Official correspondence and administrative affairs","Ad hoc assignments"],
    },
  },
  {
    id: "assistant-003", name: "邱于菁",
    email: "ycc0613@nkust.edu.tw", ext: "07-3814526 #15678", img: "/images/S3.jpg",
    title: { zh: "專任經理", en: "Full-Time Manager" },
    duties: {
      zh: ["勞動部「AI智慧製造產業人才培訓據點」計畫(聯絡窗口)","公文收發與行政庶務","臨時交辦任務"],
      en: ["Contact window for the Ministry of Labor AI Smart Manufacturing Talent Training Hub project","Official correspondence and administrative affairs","Ad hoc assignments"],
    },
  },
];

const students: (Omit<Student, "summary"> & { summary?: Localized<string> })[] = [
  {
    id: "student-001", name: "賴穎寬", degree: "master", status: "graduated",
    enrollmentYear: 113, graduationYear: 114,
    project: "基於人工智慧低解析熱影像骨幹辨識技術之精神病患自我傷害行為照護系統", img: "/images/A1.jpg",
    summary: {
      zh: "本專題運用低解析熱影像與骨架辨識技術，建立自傷行為即時偵測系統，透過關節動態分析提升辨識準確性，兼顧隱私保護與醫療照護安全。",
      en: "This project uses low-resolution thermal imaging and skeleton recognition to build a real-time self-harm detection system. Joint-motion analysis improves recognition accuracy while preserving privacy and medical-care safety.",
    },
  },
  {
    id: "student-002", name: "許庭瑄", degree: "master", status: "graduated",
    enrollmentYear: 113, graduationYear: 114,
    project: "基於ToF感測器之人體姿態日常行為辨識模型", img: "/images/A2.jpg",
    summary: {
      zh: "本研究以深度感測器(ToF Sensor)結合人體骨幹辨識模型，並加入時間序列模型進行連續動作識別，建立具有隱私保護的人體日常行為辨識系統。",
      en: "This study combines ToF depth sensors with human skeleton recognition and time-series modeling to recognize continuous daily activities while protecting personal privacy.",
    },
  },
  {
    id: "student-003", name: "陳閔昱", degree: "master", status: "active",
    enrollmentYear: 114, graduationYear: null,
    project: "中外耳病灶識別暨臨床診斷報告自動生成系統", img: "/images/A3.jpg",
    summary: {
      zh: "本研究iEar智慧耳膜病灶辨識系統，結合目標偵測與影像分割技術，實現病灶定位與輪廓分析，提升診斷準確性並提供臨床即時決策輔助。",
      en: "This study develops the iEar intelligent eardrum lesion recognition system, combining object detection and image segmentation to locate lesions, analyze contours, and support real-time clinical decisions.",
    },
  },
  {
    id: "student-004", name: "張鈞翔", degree: "master", status: "active",
    enrollmentYear: 114, graduationYear: null,
    project: "精神病房隔離室病患之自我傷害行為辨識暨護理紀錄自動生成系統", img: "/images/A4.jpg",
    summary: {
      zh: "本研究以低解析熱影像與人體骨架辨識技術，建立頭部自傷行為即時偵測系統，兼顧隱私保護與準確預警，提升精神醫療照護安全性與監測效率。",
      en: "This study uses low-resolution thermal images and human skeleton recognition to detect head-related self-harm behaviors in real time, balancing privacy protection, accurate alerts, and psychiatric-care safety.",
    },
  },
  {
    id: "student-005", name: "李家馨", degree: "master", status: "active",
    enrollmentYear: 114, graduationYear: null,
    project: "基於熱影像與ToF感測器之翻身拍背系統", img: "/images/A5.jpg",
    summary: {
      zh: "本研究結合ToF感測與深度學習，建立護理行為辨識系統，透過YOLO與手部骨幹辨識翻身與拍背動作，判斷執行時機，提升照護品質與病患安全。",
      en: "This study combines ToF sensing and deep learning to recognize nursing actions. YOLO and hand-skeleton recognition identify turning and back-patting actions to support care quality and patient safety.",
    },
  },
  {
    id: "student-006", name: "陳冠廷", degree: "master", status: "active",
    enrollmentYear: 114, graduationYear: null,
    project: "基於yolo物件辨識之舌肌復健遊戲平台", img: "/images/A6.jpg",
    summary: {
      zh: "本研究建構reTon舌肌復健遊戲平台，結合YOLO物件辨識與追蹤技術，即時偵測舌頭運動並轉換為遊戲控制，提升復健互動性與訓練成效。",
      en: "This study builds the reTon tongue-muscle rehabilitation game platform, using YOLO object detection and tracking to convert tongue movements into interactive game control for rehabilitation training.",
    },
  },
  {
    id: "student-007", name: "鍾詩威", degree: "master", status: "active",
    enrollmentYear: 114, graduationYear: null,
    project: "智慧型手術器械辨識與教育訓練平台", img: "/images/A7.jpg",
    summary: {
      zh: "本研究結合YOLO物件辨識與創新演算法，建立手術器械智慧辨識與訓練平台，提升辨識準確性與視覺穩定性，並實現標準化醫學教育與客觀學習評估。",
      en: "This study combines YOLO object detection with custom algorithms to build an intelligent surgical instrument recognition and training platform for standardized medical education and objective learning assessment.",
    },
  },
  {
    id: "student-008", name: "蔡一銘", degree: "undergrad", track: "preMaster", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "FitMirror：基於單一 RGB 影像與人體姿態估測之即時運動分析系統", img: "/images/member-placeholder.png",
    summary: {
      zh: "",
      en: "",
    },
  },
  {
    id: "student-009", name: "林詩婷", degree: "undergrad", status: "active",
    enrollmentYear: 112, graduationYear: null,
    project: "AI銀髮族體適能健身系統", img: null,
  },
  {
    id: "student-010", name: "許峻銘", degree: "undergrad", status: "active",
    enrollmentYear: 112, graduationYear: null,
    project: "AI銀髮族體適能健身系統", img: null,
  },
  {
    id: "student-011", name: "王柏鑑", degree: "undergrad", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "AI手術器械辨識", img: null,
  },
  {
    id: "student-012", name: "林傳巽", degree: "undergrad", track: "preMaster", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "題目未定", img: "/images/member-placeholder.png",
    summary: {
      zh: "",
      en: "",
    },
  },
  {
    id: "student-013", name: "林建宇", degree: "undergrad", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "AI手術器械辨識", img: null,
  },
  {
    id: "student-014", name: "紀政佑", degree: "undergrad", track: "preMaster", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "復健手套", img: "/images/member-placeholder.png",
    summary: {
      zh: "本研究旨在開發一套結合導電紗線感測與人工智慧影像辨識之智慧復健手套系統，應用於中風或神經功能受損患者之上肢復健評估。系統利用導電紗線於手指彎曲與手腕活動時產生的電性變化，量化手指關節與手腕關節之活動狀態；同時結合人工智慧影像辨識技術，分析患者執行指定復健動作時的手部姿態與動作表現。透過穿戴式感測與視覺辨識兩種資訊進行整合，可更客觀地評估患者關節活動度、動作完成程度及復健進展，降低傳統人工觀察所產生的主觀差異。未來期望本系統可應用於臨床與居家復健，提供復健人員即時且量化的評估依據，提升復健追蹤與個人化訓練之效率。",
      en: "This study aims to develop an intelligent rehabilitation glove system integrating conductive-yarn sensing and artificial intelligence-based image recognition for upper-limb rehabilitation assessment in patients with stroke or neurological impairments. Conductive yarns are embedded in the glove to detect electrical changes caused by finger flexion and wrist movement, enabling quantitative evaluation of finger-joint and wrist-joint activities. In addition, an AI-based vision system is employed to analyze hand postures and movement performance while patients perform designated rehabilitation exercises. By integrating wearable sensing data with visual information, the proposed system provides a more objective assessment of joint mobility, movement completion, and rehabilitation progress, thereby reducing the subjectivity associated with conventional visual observation. The proposed system is expected to support both clinical and home-based rehabilitation by providing therapists with quantitative and real-time information for rehabilitation monitoring. Ultimately, it may improve the efficiency of rehabilitation assessment, progress tracking, and personalized training for patients with impaired upper-limb motor functions.",
    },
  },
  {
    id: "student-015", name: "李政曄", degree: "undergrad", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "AI膝反射辨識系統", img: null,
  },
  {
    id: "student-016", name: "張德煜", degree: "undergrad", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "AI膝反射辨識系統", img: null,
  },
  {
    id: "student-017", name: "林竣宇", degree: "undergrad", status: "active",
    enrollmentYear: 112, graduationYear: null,
    project: "AI膝反射辨識系統", img: null,
  },
  {
    id: "student-018", name: "梁書毓", degree: "undergrad", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "AI膝反射辨識系統", img: null,
  },
  {
    id: "student-019", name: "陳品勳", degree: "undergrad", track: "preMaster", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "題目未定", img: "/images/member-placeholder.png",
    summary: {
      zh: "",
      en: "",
    },
  },
  {
    id: "student-020", name: "李沛琪", degree: "undergrad", track: "preMaster", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "題目未定", img: "/images/member-placeholder.png",
    summary: {
      zh: "",
      en: "",
    },
  },
  {
    id: "student-021", name: "吳亮廷", degree: "undergrad", status: "active",
    enrollmentYear: 112, graduationYear: null,
    project: "AI塑膠微粒辨識系統", img: null,
  },
  {
    id: "student-022", name: "謝修瑜", degree: "undergrad", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "AI電容焊接瑕疵辨識", img: null,
  },
  {
    id: "student-023", name: "楊宗翰", degree: "undergrad", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "AI電容焊接瑕疵辨識", img: null,
  },
  {
    id: "student-024", name: "丁維暘", degree: "undergrad", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "AI電容焊接瑕疵辨識", img: null,
  },
  {
    id: "student-025", name: "藍信安", degree: "undergrad", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "AI電容焊接瑕疵辨識", img: null,
  },
  {
    id: "student-026", name: "胡景翔", degree: "undergrad", status: "active",
    grade: "大四", enrollmentYear: 112, graduationYear: null,
    project: "AI電容焊接瑕疵辨識", img: null,
  },
  {
    id: "student-027", name: "蔡柏昀", degree: "master", status: "active",
    enrollmentYear: 115, graduationYear: null,
    project: "PoseAgent: A Vision-Language Model Agent Framework for Automatic Pig Skeletal Keypoint Annotation", img: "/images/member-placeholder.png",
    summary: {
      zh: "本研究提出 PoseAgent VLM Agent框架，透過多重標註Agent與專家Agent審查機制自動標記豬隻骨架關鍵點，建立豬隻專屬 OKS 容忍值與骨架資料集，降低人工標註成本並支援後續行為監測應用。",
      en: "This study proposes PoseAgent, a VLM agent framework that automatically annotates pig skeletal keypoints through multiple annotator agents and an expert-agent review mechanism, establishing pig-specific OKS tolerances and a skeleton dataset to reduce manual annotation cost and support subsequent behavior monitoring applications.",
    },
  },
  {
    id: "student-028", name: "施為元", degree: "master", status: "active",
    enrollmentYear: 115, graduationYear: null,
    project: "iCattle：基於臉部關鍵點的乳牛咀嚼和反芻監測視覺系統", img: "/images/member-placeholder.png",
    summary: {
      zh: "",
      en: "",
    },
  },
  {
    id: "student-029", name: "吳嘉祐", degree: "master", status: "active",
    enrollmentYear: 115, graduationYear: null,
    project: "雙站式深度學習視覺檢測系統於乾麵包裝產線之設計與實現", img: "/images/member-placeholder.png",
    summary: {
      zh: "本研究以深度學習物件偵測技術建置雙站式 AI 檢測系統，分別完成醬料包種類數量核對與麵塊頭髮異物偵測，並整合邊緣運算平台與 PLC 控制，於產線運轉中即時判定並觸發告警，建立可實際部署於食品包裝現場的自動化品檢流程。",
      en: "This study develops a dual-station AI inspection system based on deep learning object detection, which verifies the type and quantity of seasoning packets and detects hair foreign objects on noodle blocks. By integrating an edge computing platform with PLC control, the system performs real-time determination and triggers alerts while the production line is running, establishing an automated quality inspection workflow deployable in food packaging facilities.",
    },
  },
  {
    id: "student-030", name: "佘秉穎", degree: "undergrad", status: "active",
    enrollmentYear: 111, graduationYear: null,
    project: "AI調料包缺陷辨識系統", img: null,
  },
  {
    id: "student-031", name: "吳秉宣", degree: "master", status: "active",
    enrollmentYear: 115, graduationYear: null,
    project: "題目未定", img: "/images/member-placeholder.png",
    summary: {
      zh: "",
      en: "",
    },
  },
  {
    id: "student-032", name: "杜侑蓁", degree: "master", status: "active",
    enrollmentYear: 115, graduationYear: null,
    project: "基於物件偵測技術之港區船舶辨識監控系統", img: "/images/member-placeholder.png",
    summary: {
      zh: "現行港口管理依賴船舶的AIS，但實務上常遇到船長關閉訊號，本研究利用港口CCTV 監視器畫面，在無訊號下進行監控，系統利用深度學習技術辨識船隻外觀與行進軌跡，自動判定船隻是否進入港區範圍或停留在港內，有效達到自動化監控與確保安全。",
      en: "",
    },
  },
  {
    id: "student-033", name: "周中仁", degree: "master", status: "active",
    enrollmentYear: 115, graduationYear: null,
    project: "題目未定", img: "/images/member-placeholder.png",
    summary: {
      zh: "",
      en: "",
    },
  },
  {
    id: "student-034", name: "柯妤杰", degree: "master", status: "active",
    enrollmentYear: 115, graduationYear: null,
    project: "題目未定", img: "/images/member-placeholder.png",
    summary: {
      zh: "",
      en: "",
    },
  },
  {
    id: "student-035", name: "黃睿程", degree: "master", status: "active",
    enrollmentYear: 115, graduationYear: null,
    project: "題目未定", img: "/images/member-placeholder.png",
    summary: {
      zh: "",
      en: "",
    },
  },
  {
    id: "student-036", name: "吳海睿", degree: "undergrad", status: "active",
    grade: "大三", enrollmentYear: null, graduationYear: null,
    project: "題目未定", img: null,
  },
  {
    id: "student-037", name: "李安婕", degree: "undergrad", status: "active",
    grade: "大三", enrollmentYear: null, graduationYear: null,
    project: "題目未定", img: null,
  },
  {
    id: "student-038", name: "林峻宇", degree: "undergrad", status: "active",
    grade: "大四", enrollmentYear: null, graduationYear: null,
    project: "AI膝反射辨識系統", img: null,
  },
  {
    id: "student-039", name: "張家憲", degree: "undergrad", status: "active",
    grade: "大三", enrollmentYear: null, graduationYear: null,
    project: "題目未定", img: null,
  },
  {
    id: "student-040", name: "陳俐今", degree: "undergrad", status: "active",
    grade: "大三", enrollmentYear: null, graduationYear: null,
    project: "題目未定", img: null,
  },
  {
    id: "student-041", name: "章名湘", degree: "undergrad", status: "active",
    grade: "大三", enrollmentYear: null, graduationYear: null,
    project: "題目未定", img: null,
  },
  {
    id: "student-042", name: "黃重程", degree: "undergrad", status: "active",
    grade: "大三", enrollmentYear: null, graduationYear: null,
    project: "題目未定", img: null,
  },
  {
    id: "student-043", name: "黃健程", degree: "undergrad", status: "active",
    grade: "大三", enrollmentYear: null, graduationYear: null,
    project: "題目未定", img: null,
  },
  {
    id: "student-044", name: "鄭閎元", degree: "undergrad", status: "active",
    grade: "大三", enrollmentYear: null, graduationYear: null,
    project: "題目未定", img: null,
  },
  {
    id: "student-045", name: "賴柏銘", degree: "undergrad", status: "active",
    grade: "大三", enrollmentYear: null, graduationYear: null,
    project: "題目未定", img: null,
  },
  {
    id: "student-046", name: "簡廷軒", degree: "undergrad", status: "active",
    grade: "大三", enrollmentYear: null, graduationYear: null,
    project: "題目未定", img: null,
  },
];

const projectSummaries: Record<string, Localized<string>> = {
  "題目未定": {
    zh: "",
    en: "",
  },
  "AI銀髮族體適能健身系統": {
    zh: "本專題結合多模型姿態辨識與單鏡頭3D定位技術，建構銀髮族體適能運動品質自動化評估系統，兼具高精準度與隱私保護，並有效降低人力成本。",
    en: "This project combines multi-model pose recognition and monocular 3D localization to evaluate exercise quality for older adults, balancing accuracy, privacy, and reduced manual workload.",
  },
  "AI手術器械辨識": {
    zh: "本專題結合YOLO之手術器械辨識與LLM生成教學，提供護理新人即時識別與反饋，有效減輕臨床教學負擔並提升護理人員自學成效。",
    en: "This project combines YOLO-based surgical instrument recognition with LLM-generated guidance to provide real-time feedback for novice nurses and reduce clinical teaching workload.",
  },
  "AI膝反射辨識系統": {
    zh: "本專題整合AI影像辨識與導電紗感測技術，開發膝反射自動量測系統，可即時分析多項關鍵指標，實現客觀量化評估，提升臨床診斷準確性與追蹤效率。",
    en: "This project integrates AI image recognition and conductive-yarn sensing to build an automated knee-reflex measurement system for objective clinical assessment and follow-up.",
  },
  "AI塑膠微粒辨識系統": {
    zh: "本專題運用YOLO深度學習技術，建立微塑膠顯微影像自動辨識系統，可精準分類多種型態並提升檢測效率，大幅降低人工判讀誤差，實現快速且標準化之環境監測。",
    en: "This project applies YOLO deep learning to microscopic microplastic images, improving classification efficiency and reducing manual interpretation errors for standardized environmental monitoring.",
  },
  "AI電容焊接瑕疵辨識": {
    zh: "本專題結合YOLO深度學習與邊緣運算技術，開發CPU周圍電容缺漏焊自動檢測系統，可快速精準辨識缺陷，降低人工誤判並提升產線效率與品質穩定性。",
    en: "This project combines YOLO deep learning and edge computing to detect missing or defective capacitor soldering around CPUs, improving production-line accuracy and stability.",
  },
  "AI豬隻健康辨識系統": {
    zh: "本專題結合YOLO與影像處理，開發豬隻體重量測系統，可快速精準量測體重，降低豬隻緊張情緒並提升飼養效率與作業安全。",
    en: "This project combines YOLO and image processing to estimate pig body weight quickly and accurately, reducing animal stress while improving feeding efficiency and operational safety.",
  },
  "AI調料包缺陷辨識系統": {
    zh: "本專題為製麵工廠生產線設計的 AI 調味包辨識系統，整合攝影鏡頭與 AI 邊緣運算技術，可即時檢測輸送帶上調味包的種類與數量，透過自動化取代傳統人工檢驗，有效降低生產成本並大幅提升出廠產品的檢測準確率。",
    en: "This project designs an AI seasoning-packet inspection system for noodle production lines, combining cameras and edge AI to detect packet type and quantity in real time while improving inspection accuracy.",
  },
};

export function getMemberDirectory(language: Language) {
  return {
    assistants: assistants.map(({ title, duties, ...person }) => ({ ...person, title: title[language], duties: duties[language] })),
    allStudents: students.map(({ summary, ...person }): Student => summary
      ? { ...person, summary: summary[language] }
      : person),
    undergradProjectSummaries: Object.fromEntries(Object.entries(projectSummaries).map(([project, text]) => [project, text[language]])),
  };
}
