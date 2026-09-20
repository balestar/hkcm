export type HeadlineNews = {
  id: string;
  tag: string;
  title: string;
  summary: string;
  source: string;
  time: string;
};

export type CommentPlatform = "linkedin" | "twitter" | "reddit" | "hkcm";

export type DeskComment = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  avatar: string;
  text: string;
  platform: CommentPlatform;
  linkedin?: string;
  tone: "bull" | "bear" | "neutral";
};

export type ChartAnalysis = {
  id: string;
  asset: string;
  kind: "Index" | "Equity" | "Crypto" | "FX";
  title: string;
  subtitle: string;
  price: string;
  changePct: number;
  /** Session interval between prints, in minutes */
  intervalMin: number;
  /** Base series — runtime randomizes around this path */
  values: number[];
  /** Optional volume series (same length as values) */
  volumes?: number[];
  analyst: {
    name: string;
    role: string;
    badge: string;
    initials: string;
    avatar: string;
    linkedin: string;
    comment: string;
  };
};

/** Build session timestamps ending at "now", spaced by intervalMin. */
export function buildSessionTimes(count: number, intervalMin: number, end = new Date()): Date[] {
  const out: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(new Date(end.getTime() - i * intervalMin * 60_000));
  }
  return out;
}

export function formatClock(d: Date, withSeconds = false): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (!withSeconds) return `${hh}:${mm}`;
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function formatPrice(v: number, kind: ChartAnalysis["kind"]): string {
  if (kind === "FX") return v.toFixed(4);
  if (kind === "Equity") return v.toFixed(2);
  if (kind === "Crypto") return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export const HEADLINE_NEWS: HeadlineNews[] = [
  {
    id: "h1",
    tag: "Markets",
    title: "European equities firm as exporters lead the open",
    summary:
      "DAX and Stoxx 600 lift on a softer euro and resilient factory orders out of Germany.",
    source: "Frankfurt Desk",
    time: "08:14",
  },
  {
    id: "h2",
    tag: "Rates",
    title: "ECB on hold — markets price a longer pause",
    summary:
      "Front-end rates steady as policymakers keep optionality into year-end inflation prints.",
    source: "Eurozone Macro",
    time: "09:02",
  },
  {
    id: "h3",
    tag: "Policy",
    title: "Brussels advances capital-markets package",
    summary:
      "Draft rules aim to deepen retail participation and simplify cross-border listings.",
    source: "EU Policy Brief",
    time: "09:48",
  },
  {
    id: "h4",
    tag: "Crypto",
    title: "Spot BTC flows stay constructive into the US session",
    summary:
      "Net ETF creations remain positive; desk watches funding and weekend liquidity.",
    source: "Digital Assets",
    time: "10:21",
  },
];

/** Randomize a chart series around a base path for live feel. */
export function randomizeSeries(base: number[], jitterPct = 0.0045): number[] {
  let v = base[0];
  return base.map((target, i) => {
    const noise = 1 + (Math.random() * 2 - 1) * jitterPct;
    const pull = 0.35;
    v = v * (1 - pull) + target * pull * noise;
    if (i === 0) v = target;
    return Math.round(v * (v > 100 ? 1 : 10000)) / (v > 100 ? 1 : 10000);
  });
}

export const CHART_ANALYSES: ChartAnalysis[] = [
  {
    id: "dax",
    asset: "DAX",
    kind: "Index",
    title: "DAX · Xetra",
    subtitle: "Intraday · 5m candles",
    price: "18,642",
    changePct: 0.84,
    intervalMin: 5,
    values: [
      18410, 18422, 18405, 18438, 18455, 18448, 18472, 18490, 18478, 18505, 18522,
      18510, 18540, 18555, 18548, 18570, 18588, 18575, 18600, 18618, 18605, 18628,
      18640, 18622, 18635, 18650, 18642, 18655, 18670, 18658, 18672, 18680, 18665,
      18678, 18690, 18682, 18695, 18705, 18692, 18685, 18670, 18655, 18648, 18660,
      18672, 18655, 18642, 18642,
    ],
    volumes: [
      820, 640, 910, 720, 680, 590, 880, 760, 540, 990, 870, 610, 940, 710, 580,
      860, 920, 640, 780, 850, 590, 770, 900, 620, 700, 830, 560, 740, 880, 610,
      790, 920, 650, 710, 860, 580, 740, 690, 810, 770, 620, 540, 680, 730, 850,
      610, 720, 780,
    ],
    analyst: {
      name: "Philip Hopf",
      role: "Gründer & Gesellschafter",
      badge: "HKCM",
      initials: "PH",
      avatar: "/team/philip-hopf-src.jpg",
      linkedin: "https://www.linkedin.com/company/hkcm",
      comment:
        "Buyers defended the morning pullback and reclaimed the session mid. As long as we hold above the early base, dips still look constructive into the US open — watch volume on the next push.",
    },
  },
  {
    id: "btc",
    asset: "BTC",
    kind: "Crypto",
    title: "Bitcoin · USD",
    subtitle: "Spot · 30m candles",
    price: "97,420",
    changePct: 1.62,
    intervalMin: 30,
    values: [
      95820, 95940, 95810, 96120, 96350, 96280, 96540, 96780, 96620, 96910, 97140,
      97020, 97280, 97450, 97310, 97580, 97820, 97640, 97910, 98140, 97980, 98220,
      98450, 98280, 98110, 97940, 97780, 97960, 98180, 98040, 97820, 97650, 97890,
      98120, 98340, 98210, 98050, 97880, 97620, 97480, 97320, 97540, 97780, 97610,
      97440, 97280, 97420, 97420,
    ],
    volumes: [
      120, 98, 140, 110, 105, 90, 155, 130, 88, 160, 145, 95, 150, 125, 100,
      140, 165, 110, 135, 150, 92, 140, 170, 115, 100, 125, 85, 130, 155, 105,
      120, 95, 135, 145, 160, 110, 100, 90, 115, 105, 88, 125, 140, 100, 95,
      110, 120, 130,
    ],
    analyst: {
      name: "Philip Klinkmüller",
      role: "Gründer & CEO",
      badge: "HKCM Charts",
      initials: "PK",
      avatar: "/team/philip-klinkmueller.jpg",
      linkedin: "https://www.linkedin.com/company/hkcm",
      comment:
        "ETF creations keep the bid under the tape. The 24h higher-low structure is intact — prefer buying shallow dips over chasing the spike into New York.",
    },
  },
  {
    id: "sap",
    asset: "SAP",
    kind: "Equity",
    title: "SAP · Frankfurt",
    subtitle: "Xetra · 5m candles",
    price: "248.60",
    changePct: 1.18,
    intervalMin: 5,
    values: [
      244.2, 244.5, 244.1, 244.8, 245.2, 245.0, 245.6, 246.1, 245.8, 246.4, 246.9,
      246.5, 247.1, 247.6, 247.3, 247.8, 248.2, 247.9, 248.4, 248.9, 248.5, 248.1,
      247.7, 248.0, 248.4, 248.8, 248.5, 248.9, 249.2, 248.8, 248.4, 248.1, 248.5,
      248.9, 249.3, 249.0, 248.6, 248.3, 247.9, 248.2, 248.6, 248.9, 248.5, 248.2,
      248.4, 248.7, 248.6, 248.6,
    ],
    volumes: [
      42, 35, 48, 38, 36, 30, 52, 44, 28, 55, 49, 32, 50, 41, 29, 46, 53, 34, 40,
      47, 31, 43, 51, 33, 37, 45, 28, 39, 48, 32, 41, 50, 35, 38, 46, 30, 40, 36,
      44, 41, 33, 27, 35, 39, 45, 32, 38, 42,
    ],
    analyst: {
      name: "Fredrik Martens",
      role: "Chief Strategy Officer",
      badge: "HKCM Strategy",
      initials: "FM",
      avatar: "/team/fredrik-martens.jpg",
      linkedin: "https://www.linkedin.com/company/hkcm",
      comment:
        "Software leadership is carrying the DAX. SAP held the open gap and buyers stepped in on every shallow fade — momentum looks healthy while Europe stays risk-on.",
    },
  },
  {
    id: "eurusd",
    asset: "EURUSD",
    kind: "FX",
    title: "EUR / USD · spot",
    subtitle: "FX · 5m candles",
    price: "1.0842",
    changePct: -0.31,
    intervalMin: 5,
    values: [
      1.0884, 1.0881, 1.0879, 1.0876, 1.0872, 1.0874, 1.0870, 1.0866, 1.0868, 1.0864,
      1.0860, 1.0862, 1.0858, 1.0854, 1.0856, 1.0852, 1.0848, 1.0850, 1.0846, 1.0843,
      1.0845, 1.0841, 1.0838, 1.0840, 1.0844, 1.0847, 1.0844, 1.0841, 1.0838, 1.0840,
      1.0843, 1.0846, 1.0843, 1.0840, 1.0837, 1.0839, 1.0842, 1.0845, 1.0842, 1.0839,
      1.0836, 1.0838, 1.0841, 1.0843, 1.0840, 1.0838, 1.0842, 1.0842,
    ],
    volumes: [
      210, 180, 240, 195, 185, 160, 250, 220, 150, 260, 235, 170, 245, 205, 155,
      230, 255, 175, 215, 240, 165, 225, 250, 180, 190, 220, 145, 210, 245, 170,
      215, 250, 180, 195, 230, 160, 205, 185, 220, 210, 170, 140, 185, 200, 230,
      175, 195, 210,
    ],
    analyst: {
      name: "Emre Şentürk",
      role: "Chief Operating Officer",
      badge: "HKCM Desk",
      initials: "ES",
      avatar: "/team/emre-sentuerk.jpg",
      linkedin: "https://www.linkedin.com/company/hkcm",
      comment:
        "Euro softens on the open — a quiet tailwind for exporters. Until US data clears, treat bounces as sells; the range still favors a grind lower.",
    },
  },
];

export const CHART_ANALYSIS = CHART_ANALYSES[0];

/** Real HKCM team voices for the desk feed — LinkedIn where available. */
export const DESK_COMMENT_POOL: DeskComment[] = [
  {
    id: "t1",
    name: "Philip Hopf",
    handle: "Gründer & Gesellschafter",
    initials: "PH",
    avatar: "/team/philip-hopf-src.jpg",
    platform: "linkedin",
    linkedin: "https://www.linkedin.com/company/hkcm",
    tone: "bull",
    text: "DAX structure is clean. Holding the morning base keeps a constructive bias into the US open.",
  },
  {
    id: "t2",
    name: "Philip Klinkmüller",
    handle: "Gründer & CEO",
    initials: "PK",
    avatar: "/team/philip-klinkmueller.jpg",
    platform: "linkedin",
    linkedin: "https://www.linkedin.com/company/hkcm",
    tone: "bull",
    text: "Charttechnik first: reclaim of the session mid matters more than the headline noise.",
  },
  {
    id: "t3",
    name: "Murat Örs, CFTe",
    handle: "Technischer Analyst",
    initials: "MÖ",
    avatar: "/team/murat-oers.png",
    platform: "linkedin",
    linkedin: "https://www.linkedin.com/in/murat-oers/?locale=en",
    tone: "neutral",
    text: "Analyse means clarity from structure — not chasing every tick into resistance.",
  },
  {
    id: "t4",
    name: "Stefan Dölken",
    handle: "IT-Teamleiter",
    initials: "SD",
    avatar: "/team/stefan-doelken.png",
    platform: "linkedin",
    linkedin: "https://www.linkedin.com/in/stefandoelken/",
    tone: "neutral",
    text: "Systems and markets both reward discipline — keep risk defined into the data window.",
  },
  {
    id: "t5",
    name: "Verena Möhring",
    handle: "Senior Marketing Manager",
    initials: "VM",
    avatar: "/team/verena-moehring.png",
    platform: "linkedin",
    linkedin: "https://www.linkedin.com/in/verena-m%C3%B6hring-460359201/",
    tone: "bull",
    text: "Clear communication beats noise — exporters leading the open is the story to explain.",
  },
  {
    id: "t6",
    name: "Ramon Marquart",
    handle: "Senior Social Media Manager",
    initials: "RM",
    avatar: "/team/ramon-marquart.png",
    platform: "twitter",
    linkedin: "https://www.linkedin.com/in/ramonmarquart/",
    tone: "bull",
    text: "EU open risk-on showing up across feeds — SAP and Siemens still sticky on the tape.",
  },
  {
    id: "t7",
    name: "Amir Soufi",
    handle: "Creative Director",
    initials: "AS",
    avatar: "/team/amir-soufi.png",
    platform: "linkedin",
    linkedin: "https://www.linkedin.com/in/mramirsoufi/",
    tone: "neutral",
    text: "Markets move fast — good analysis still has to be readable in one glance.",
  },
  {
    id: "t8",
    name: "Julian Marco Angele",
    handle: "Teamleiter Marketing & Vertrieb",
    initials: "JA",
    avatar: "/team/julian-angele.png",
    platform: "linkedin",
    linkedin: "https://www.linkedin.com/in/julian-marco-angele-8a0742379/",
    tone: "bull",
    text: "Desk stays constructive while cyclicals hold — people and process over noise.",
  },
  {
    id: "t9",
    name: "Manuel Horning",
    handle: "Senior Backendentwickler",
    initials: "MH",
    avatar: "/team/manuel-horning.png",
    platform: "hkcm",
    linkedin: "https://www.linkedin.com/in/manuel-horning-298475289/",
    tone: "neutral",
    text: "Stable infra, stable process — same standard we apply to research delivery.",
  },
  {
    id: "t10",
    name: "Sebastian Tölle",
    handle: "Senior Infrastrukturentwickler",
    initials: "ST",
    avatar: "/team/sebastian-toelle.png",
    platform: "hkcm",
    linkedin: "https://www.linkedin.com/company/hkcm",
    tone: "bear",
    text: "If DAX loses the open low, step aside — infrastructure and trading both hate blind risk.",
  },
  {
    id: "t11",
    name: "Emre Şentürk",
    handle: "Chief Operating Officer",
    initials: "ES",
    avatar: "/team/emre-sentuerk.jpg",
    platform: "linkedin",
    linkedin: "https://www.linkedin.com/company/hkcm",
    tone: "neutral",
    text: "EURUSD softer on the open — operational focus stays on process, not prediction.",
  },
  {
    id: "t12",
    name: "Fredrik Martens",
    handle: "Chief Strategy Officer",
    initials: "FM",
    avatar: "/team/fredrik-martens.jpg",
    platform: "linkedin",
    linkedin: "https://www.linkedin.com/company/hkcm",
    tone: "bull",
    text: "Software leadership carrying Frankfurt — strategy stays long-term while the tape cooperates.",
  },
];

/** @deprecated */
export const LIVE_COMMENTS = DESK_COMMENT_POOL.map((c, i) => ({
  ...c,
  ago: `${(i + 1) * 2}m`,
}));
