export type HeadlineNews = {
  id: string;
  tag: string;
  title: string;
  summary: string;
  source: string;
  time: string;
};

export type LiveComment = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  text: string;
  ago: string;
  tone: "bull" | "bear" | "neutral";
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

/** Single featured chart — DAX-style session path (synthetic demo series). */
export const CHART_ANALYSIS = {
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
    name: "Lena Hoffmann",
    role: "Senior market strategist",
    badge: "HKCM Desk",
    initials: "LH",
    comment:
      "Buyers defended the morning pullback and reclaimed the session mid. As long as we hold above the early base, dips still look constructive into the US open — watch volume on the next push.",
  },
};

export const LIVE_COMMENTS: LiveComment[] = [
  {
    id: "c1",
    name: "Jonas R.",
    handle: "@jonasdesk",
    initials: "JR",
    ago: "2m",
    tone: "bull",
    text: "Exporters carrying the tape — SAP and Siemens bids look sticky.",
  },
  {
    id: "c2",
    name: "Amira T.",
    handle: "@amirarates",
    initials: "AT",
    ago: "5m",
    tone: "neutral",
    text: "Bunds quiet. No need to chase until the US data window clears.",
  },
  {
    id: "c3",
    name: "Felix W.",
    handle: "@felixflows",
    initials: "FW",
    ago: "9m",
    tone: "bull",
    text: "BTC correlating with risk-on in EU open. Funding still calm.",
  },
  {
    id: "c4",
    name: "Sofia L.",
    handle: "@sofiamacro",
    initials: "SL",
    ago: "14m",
    tone: "bear",
    text: "If DAX loses the open low, I’d step aside — not fight the first break.",
  },
  {
    id: "c5",
    name: "Kenji P.",
    handle: "@kenjixs",
    initials: "KP",
    ago: "18m",
    tone: "neutral",
    text: "EURUSD grinding lower helping exporters. Cross-asset still orderly.",
  },
];
