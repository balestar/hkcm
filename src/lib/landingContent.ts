export type HeadlineNews = {
  id: string;
  tag: string;
  title: string;
  summary: string;
  source: string;
  time: string;
};

export type CommentPlatform = "reddit" | "twitter" | "hkcm" | "lh";

export type LiveComment = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  text: string;
  ago: string;
  tone: "bull" | "bear" | "neutral";
  platform: CommentPlatform;
};

export type ChartAnalysis = {
  id: string;
  asset: string;
  kind: "Index" | "Equity" | "Crypto" | "FX";
  title: string;
  subtitle: string;
  price: string;
  changePct: number;
  values: number[];
  analyst: {
    name: string;
    role: string;
    badge: string;
    initials: string;
    comment: string;
  };
};

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

export const CHART_ANALYSES: ChartAnalysis[] = [
  {
    id: "dax",
    asset: "DAX",
    kind: "Index",
    title: "DAX · session",
    subtitle: "Intraday · last 48 prints",
    price: "18,642",
    changePct: 0.84,
    values: [
      18410, 18422, 18405, 18438, 18455, 18448, 18472, 18490, 18478, 18505, 18522,
      18510, 18540, 18555, 18548, 18570, 18588, 18575, 18600, 18618, 18605, 18628,
      18640, 18622, 18635, 18650, 18642, 18655, 18670, 18658, 18672, 18680, 18665,
      18678, 18690, 18682, 18695, 18705, 18692, 18685, 18670, 18655, 18648, 18660,
      18672, 18655, 18642, 18642,
    ],
    analyst: {
      name: "Philip Hopf",
      role: "Senior market strategist",
      badge: "HKCM",
      initials: "PH",
      comment:
        "Buyers defended the morning pullback and reclaimed the session mid. As long as we hold above the early base, dips still look constructive into the US open — watch volume on the next push.",
    },
  },
  {
    id: "btc",
    asset: "BTC",
    kind: "Crypto",
    title: "Bitcoin · 24h",
    subtitle: "Spot · hourly path",
    price: "97,420",
    changePct: 1.62,
    values: [
      95820, 95940, 95810, 96120, 96350, 96280, 96540, 96780, 96620, 96910, 97140,
      97020, 97280, 97450, 97310, 97580, 97820, 97640, 97910, 98140, 97980, 98220,
      98450, 98280, 98110, 97940, 97780, 97960, 98180, 98040, 97820, 97650, 97890,
      98120, 98340, 98210, 98050, 97880, 97620, 97480, 97320, 97540, 97780, 97610,
      97440, 97280, 97420, 97420,
    ],
    analyst: {
      name: "Maya Chen",
      role: "Digital assets analyst",
      badge: "HKCM Crypto",
      initials: "MC",
      comment:
        "ETF creations keep the bid under the tape. Funding is calm and the 24h higher-low structure is intact — I’d rather buy shallow dips than chase the spike into New York.",
    },
  },
  {
    id: "sap",
    asset: "SAP",
    kind: "Equity",
    title: "SAP · Frankfurt",
    subtitle: "Session · last 48 prints",
    price: "248.60",
    changePct: 1.18,
    values: [
      244.2, 244.5, 244.1, 244.8, 245.2, 245.0, 245.6, 246.1, 245.8, 246.4, 246.9,
      246.5, 247.1, 247.6, 247.3, 247.8, 248.2, 247.9, 248.4, 248.9, 248.5, 248.1,
      247.7, 248.0, 248.4, 248.8, 248.5, 248.9, 249.2, 248.8, 248.4, 248.1, 248.5,
      248.9, 249.3, 249.0, 248.6, 248.3, 247.9, 248.2, 248.6, 248.9, 248.5, 248.2,
      248.4, 248.7, 248.6, 248.6,
    ],
    analyst: {
      name: "Tobias Keller",
      role: "Equity research",
      badge: "HKCM Stocks",
      initials: "TK",
      comment:
        "Software leadership is carrying the DAX. SAP held the open gap and buyers stepped in on every shallow fade — momentum looks healthy while Europe stays risk-on.",
    },
  },
  {
    id: "eurusd",
    asset: "EURUSD",
    kind: "FX",
    title: "EUR / USD · spot",
    subtitle: "Intraday · last 48 prints",
    price: "1.0842",
    changePct: -0.31,
    values: [
      1.0884, 1.0881, 1.0879, 1.0876, 1.0872, 1.0874, 1.0870, 1.0866, 1.0868, 1.0864,
      1.0860, 1.0862, 1.0858, 1.0854, 1.0856, 1.0852, 1.0848, 1.0850, 1.0846, 1.0843,
      1.0845, 1.0841, 1.0838, 1.0840, 1.0844, 1.0847, 1.0844, 1.0841, 1.0838, 1.0840,
      1.0843, 1.0846, 1.0843, 1.0840, 1.0837, 1.0839, 1.0842, 1.0845, 1.0842, 1.0839,
      1.0836, 1.0838, 1.0841, 1.0843, 1.0840, 1.0838, 1.0842, 1.0842,
    ],
    analyst: {
      name: "Elena Vargas",
      role: "FX strategist",
      badge: "HKCM FX",
      initials: "EV",
      comment:
        "Euro softens on the open, which is a quiet tailwind for exporters. Until US data clears, I treat bounces as sells — range still favors a grind lower.",
    },
  },
];

/** @deprecated use CHART_ANALYSES[0] */
export const CHART_ANALYSIS = CHART_ANALYSES[0];

export const LIVE_COMMENTS: LiveComment[] = [
  {
    id: "c1",
    name: "Lena Hoffmann",
    handle: "@lena_hkcm",
    initials: "LH",
    ago: "1m",
    tone: "bull",
    platform: "lh",
    text: "Agree with Philip — DAX structure is clean. Holding the morning base keeps me long bias into the US open.",
  },
  {
    id: "c2",
    name: "u/EuroTape",
    handle: "r/EuroInvesting",
    initials: "ET",
    ago: "3m",
    tone: "bull",
    platform: "reddit",
    text: "Exporters carrying the tape — SAP and Siemens bids look sticky on the Frankfurt open.",
  },
  {
    id: "c3",
    name: "Jonas R.",
    handle: "@jonasdesk",
    initials: "JR",
    ago: "5m",
    tone: "neutral",
    platform: "twitter",
    text: "Bunds quiet. No need to chase until the US data window clears.",
  },
  {
    id: "c4",
    name: "Amira T.",
    handle: "@amira",
    initials: "AT",
    ago: "8m",
    tone: "bull",
    platform: "hkcm",
    text: "Desk flow still constructive in EU cyclicals. Watching Stoxx 600 for confirmation.",
  },
  {
    id: "c5",
    name: "u/MacroNode",
    handle: "r/MarketAnalysis",
    initials: "MN",
    ago: "12m",
    tone: "bear",
    platform: "reddit",
    text: "If DAX loses the open low, I’d step aside — not fighting the first break.",
  },
  {
    id: "c6",
    name: "Felix W.",
    handle: "@felixflows",
    initials: "FW",
    ago: "16m",
    tone: "bull",
    platform: "twitter",
    text: "BTC correlating with risk-on in the EU open. Funding still calm.",
  },
  {
    id: "c7",
    name: "Sofia L.",
    handle: "@sofia",
    initials: "SL",
    ago: "21m",
    tone: "neutral",
    platform: "hkcm",
    text: "EURUSD grinding lower helping exporters. Cross-asset still orderly.",
  },
];
