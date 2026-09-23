export type PickCategory =
  | "Crypto"
  | "Stocks"
  | "Bonds"
  | "Shares"
  | "Indices";

export type PickItem = {
  id: string;
  symbol: string;
  name: string;
  kind: PickCategory;
  price: string;
  changePct: number;
  why: string;
  /** Sparkline / full chart series (oldest → newest). */
  series: number[];
  votes: { up: number; down: number };
  analyst: {
    name: string;
    role: string;
    image: string;
    note: string;
  };
};

export type YieldItem = {
  id: string;
  name: string;
  apy: string;
  risk: "Low" | "Medium";
  lock: string;
};

export const ACCOUNT = {
  name: "Alex",
  currency: "EUR",
  equity: 24860.42,
  cash: 3120.15,
  dayPnl: 186.4,
  dayPnlPct: 0.76,
};

export const YIELDS: YieldItem[] = [
  {
    id: "y1",
    name: "EUR Cash Reserve",
    apy: "3.25%",
    risk: "Low",
    lock: "Flexible",
  },
  {
    id: "y2",
    name: "EU Bond Ladder",
    apy: "3.90%",
    risk: "Low",
    lock: "6–18 mo",
  },
  {
    id: "y3",
    name: "Staked ETH Basket",
    apy: "3.10%",
    risk: "Medium",
    lock: "Flexible",
  },
];

export const TOP_PICKS: PickItem[] = [
  {
    id: "p1",
    symbol: "BTC",
    name: "Bitcoin",
    kind: "Crypto",
    price: "€94,280",
    changePct: 2.4,
    why: "Spot ETF creations stay constructive into the US session; desk prefers dips over chasing.",
    series: [88, 90, 89, 91, 93, 92, 94, 95, 94, 96, 97, 98, 97, 99, 100],
    votes: { up: 128, down: 14 },
    analyst: {
      name: "Philip Klinkmüller",
      role: "Gründer & CEO",
      image: "/team/philip-klinkmueller.jpg",
      note: "Structure is intact above the weekly mid. I stay constructive while ETF flow holds.",
    },
  },
  {
    id: "p2",
    symbol: "ETH",
    name: "Ethereum",
    kind: "Crypto",
    price: "€3,420",
    changePct: 1.8,
    why: "Staking yield and L2 activity keep the bid under ETH on European opens.",
    series: [70, 72, 71, 73, 74, 76, 75, 77, 78, 80, 79, 81, 82, 83, 84],
    votes: { up: 96, down: 22 },
    analyst: {
      name: "Philip Hopf",
      role: "Gründer & Gesellschafter",
      note: "ETH still tracks risk-on better than most alts — shallow dips look buyable.",
      image: "/team/philip-hopf-src.jpg",
    },
  },
  {
    id: "p3",
    symbol: "SAP",
    name: "SAP SE",
    kind: "Stocks",
    price: "€248.60",
    changePct: 1.1,
    why: "Cloud backlog and European software leadership continue to attract institutional flow.",
    series: [60, 61, 62, 61, 63, 64, 65, 66, 65, 67, 68, 69, 70, 71, 72],
    votes: { up: 84, down: 11 },
    analyst: {
      name: "Fredrik Martens",
      role: "Chief Strategy Officer",
      image: "/team/fredrik-martens.jpg",
      note: "SAP remains our core EU quality compounder — add on soft opens, not rips.",
    },
  },
  {
    id: "p4",
    symbol: "SIE",
    name: "Siemens",
    kind: "Stocks",
    price: "€186.90",
    changePct: 0.9,
    why: "Electrification and automation themes keep Siemens in the DAX leadership set.",
    series: [55, 56, 55, 57, 58, 59, 58, 60, 61, 62, 61, 63, 64, 65, 66],
    votes: { up: 71, down: 18 },
    analyst: {
      name: "Dominik Kümmel",
      role: "Chief Marketing Officer",
      image: "/team/dominik-kuemmel.jpg",
      note: "Industrial recovery narrative is intact — prefer Siemens over cyclicals with weaker balance sheets.",
    },
  },
  {
    id: "p5",
    symbol: "BUND",
    name: "German Bund 10Y",
    kind: "Bonds",
    price: "2.18%",
    changePct: -0.3,
    why: "Duration bid returns as ECB pause expectations firm; quality sovereign ballast for desks.",
    series: [80, 79, 78, 77, 76, 75, 74, 73, 74, 72, 71, 70, 69, 68, 67],
    votes: { up: 58, down: 9 },
    analyst: {
      name: "Emre Şentürk",
      role: "Chief Operating Officer",
      image: "/team/emre-sentuerk.jpg",
      note: "Use Bunds as ballast, not a hero trade — size for balance, not yield chase.",
    },
  },
  {
    id: "p6",
    symbol: "EUGB",
    name: "EU Green Bond",
    kind: "Bonds",
    price: "2.41%",
    changePct: 0.2,
    why: "Green-sovereign demand stays firm with ESG mandates across European institutions.",
    series: [50, 51, 50, 52, 53, 52, 54, 55, 54, 56, 57, 56, 58, 59, 60],
    votes: { up: 44, down: 7 },
    analyst: {
      name: "Philip Klinkmüller",
      role: "Gründer & CEO",
      image: "/team/philip-klinkmueller.jpg",
      note: "Steady allocation sleeve — not a timing instrument. Keep duration moderate.",
    },
  },
  {
    id: "p7",
    symbol: "VW",
    name: "Volkswagen Pref",
    kind: "Shares",
    price: "€98.40",
    changePct: 1.4,
    why: "Preferred share liquidity and EV transition narrative keep VW in active EU portfolios.",
    series: [40, 41, 42, 41, 43, 44, 45, 44, 46, 47, 48, 47, 49, 50, 51],
    votes: { up: 62, down: 25 },
    analyst: {
      name: "Philip Hopf",
      role: "Gründer & Gesellschafter",
      image: "/team/philip-hopf-src.jpg",
      note: "Prefer prefs for yield + liquidity; watch China headlines for risk-off spikes.",
    },
  },
  {
    id: "p8",
    symbol: "ALV",
    name: "Allianz",
    kind: "Shares",
    price: "€278.20",
    changePct: 0.6,
    why: "Insurance quality and capital return story remain a European income staple.",
    series: [65, 66, 65, 67, 68, 69, 68, 70, 71, 70, 72, 73, 74, 75, 76],
    votes: { up: 79, down: 8 },
    analyst: {
      name: "Fredrik Martens",
      role: "Chief Strategy Officer",
      image: "/team/fredrik-martens.jpg",
      note: "Allianz is the safety-with-yield name on our desk — accumulate, don’t chase.",
    },
  },
  {
    id: "p9",
    symbol: "DAX",
    name: "DAX 40",
    kind: "Indices",
    price: "18,642",
    changePct: 1.3,
    why: "Exporters lead on softer euro; breadth improving into the US open.",
    series: [75, 76, 77, 76, 78, 79, 80, 81, 80, 82, 83, 84, 85, 86, 87],
    votes: { up: 112, down: 16 },
    analyst: {
      name: "Philip Klinkmüller",
      role: "Gründer & CEO",
      image: "/team/philip-klinkmueller.jpg",
      note: "Hold above session mid — dips still look constructive while breadth holds.",
    },
  },
  {
    id: "p10",
    symbol: "STOXX",
    name: "Euro Stoxx 50",
    kind: "Indices",
    price: "5,248",
    changePct: 0.8,
    why: "Europe risk-on correlating across banks and industrials; quieter rates help.",
    series: [68, 69, 68, 70, 71, 72, 71, 73, 74, 75, 74, 76, 77, 78, 79],
    votes: { up: 91, down: 13 },
    analyst: {
      name: "Dominik Kümmel",
      role: "Chief Marketing Officer",
      image: "/team/dominik-kuemmel.jpg",
      note: "Stoxx following DAX higher — prefer index exposure over single-name chase.",
    },
  },
];

export const PICK_CATEGORIES: PickCategory[] = [
  "Crypto",
  "Stocks",
  "Bonds",
  "Shares",
  "Indices",
];

/** Capitalize each word: "jane schmidt" → "Jane Schmidt" */
export function formatDisplayName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) =>
      part
        .split("-")
        .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p))
        .join("-")
    )
    .join(" ");
}

export function greetingForHour(hour: number, name: string): string {
  const n = formatDisplayName(name);
  if (hour < 5) return `Welcome, ${n}`;
  if (hour < 12) return `Good morning, ${n}`;
  if (hour < 17) return `Good afternoon, ${n}`;
  if (hour < 21) return `Good evening, ${n}`;
  return `Welcome back, ${n}`;
}

export function formatEur(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}
