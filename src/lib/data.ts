export type NewsItem = {
  id: string;
  region: "DE" | "EU";
  category: "Markets" | "Politics" | "Policy";
  title: string;
  summary: string;
  source: string;
  time: string;
};

export type PickItem = {
  id: string;
  symbol: string;
  name: string;
  kind: "Crypto" | "Stock";
  price: string;
  changePct: number;
  why: string;
};

export type YieldItem = {
  id: string;
  name: string;
  apy: string;
  risk: "Low" | "Medium";
  lock: string;
};

export type TeamSlide = {
  id: string;
  name: string;
  role: string;
  image: string;
  writeup: string;
  focus: string;
};

export const ACCOUNT = {
  name: "Alex",
  currency: "EUR",
  equity: 24860.42,
  cash: 3120.15,
  dayPnl: 186.4,
  dayPnlPct: 0.76,
};

export const TEAM_SLIDES: TeamSlide[] = [
  {
    id: "t1",
    name: "Founding Partner",
    role: "Leadership & strategy",
    image: "/team-slide-1.jpg",
    focus: "Client outcomes",
    writeup:
      "Sets the investment philosophy and keeps portfolios aligned with long-horizon European opportunities — clear mandates, disciplined risk, no noise.",
  },
  {
    id: "t2",
    name: "Managing Partner",
    role: "Portfolio oversight",
    image: "/team-slide-2.jpg",
    focus: "Capital allocation",
    writeup:
      "Guides day-to-day allocation across equities, cash yields, and selective crypto — with an emphasis on liquidity, transparency, and neat execution.",
  },
  {
    id: "t3",
    name: "Markets Partner",
    role: "Macro & special situations",
    image: "/team-slide-3.jpg",
    focus: "Market structure",
    writeup:
      "Tracks German trading flows and EU policy shifts so positioning stays ahead of regime changes — from ECB pauses to capital-markets reform.",
  },
];

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

export const NEWS: NewsItem[] = [
  {
    id: "n1",
    region: "DE",
    category: "Markets",
    title: "DAX opens firmer as exporters catch a bid",
    summary:
      "German equities lift on softer euro and better-than-feared factory orders.",
    source: "Frankfurt Desk",
    time: "08:12",
  },
  {
    id: "n2",
    region: "DE",
    category: "Politics",
    title: "Berlin signals faster grid investment path",
    summary:
      "Coalition talks point to streamlined permitting for energy infrastructure.",
    source: "Bundestag Watch",
    time: "09:40",
  },
  {
    id: "n3",
    region: "EU",
    category: "Policy",
    title: "ECB holds; markets price a longer pause",
    summary:
      "Front-end rates steady as policymakers keep optionality into year-end.",
    source: "Eurozone Macro",
    time: "10:05",
  },
  {
    id: "n4",
    region: "EU",
    category: "Politics",
    title: "Brussels advances capital-markets package",
    summary:
      "Draft rules aim to deepen retail participation across member states.",
    source: "EU Policy Brief",
    time: "11:22",
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
    why: "Spot flows + ETF bid",
  },
  {
    id: "p2",
    symbol: "ETH",
    name: "Ethereum",
    kind: "Crypto",
    price: "€3,420",
    changePct: 1.8,
    why: "Staking yield support",
  },
  {
    id: "p3",
    symbol: "SAP",
    name: "SAP SE",
    kind: "Stock",
    price: "€248.60",
    changePct: 1.1,
    why: "Cloud backlog strength",
  },
  {
    id: "p4",
    symbol: "SIE",
    name: "Siemens",
    kind: "Stock",
    price: "€186.90",
    changePct: 0.9,
    why: "Electrification theme",
  },
  {
    id: "p5",
    symbol: "ASML",
    name: "ASML",
    kind: "Stock",
    price: "€812.40",
    changePct: -0.4,
    why: "EU semis leader",
  },
  {
    id: "p6",
    symbol: "SOL",
    name: "Solana",
    kind: "Crypto",
    price: "€168.20",
    changePct: 3.6,
    why: "Network activity up",
  },
];

export function greetingForHour(hour: number, name: string): string {
  if (hour < 5) return `Still early, ${name}`;
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  if (hour < 21) return `Good evening, ${name}`;
  return `Good night, ${name}`;
}

export function formatEur(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}
