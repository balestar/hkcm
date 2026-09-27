import { EXPERTS } from "@/lib/aboutContent";
import type { PickCategory, PickItem } from "@/lib/data";

export type QuoteKind = "crypto" | "stock" | "yield" | "index";

export type UniverseInstrument = {
  id: string;
  symbol: string;
  name: string;
  kind: PickCategory;
  quoteKind: QuoteKind;
  /** Finnhub symbol */
  finnhub: string;
  fallbackPrice: string;
  fallbackChange: number;
  fallbackSeries: number[];
};

export type SavedDeskPick = {
  id: string;
  why?: string;
  note?: string;
  analystId?: string;
  votes?: { up: number; down: number };
};

export type DeskMarketsBoard = {
  items: SavedDeskPick[];
  updatedAt: string;
};

const S = (n: number[]) => n;

export const MARKET_UNIVERSE: UniverseInstrument[] = [
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    kind: "Crypto",
    quoteKind: "crypto",
    finnhub: "BINANCE:BTCUSDT",
    fallbackPrice: "€94,280",
    fallbackChange: 2.4,
    fallbackSeries: S([88, 90, 89, 91, 93, 92, 94, 95, 94, 96, 97, 98, 97, 99, 100]),
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    kind: "Crypto",
    quoteKind: "crypto",
    finnhub: "BINANCE:ETHUSDT",
    fallbackPrice: "€3,420",
    fallbackChange: 1.8,
    fallbackSeries: S([70, 72, 71, 73, 74, 76, 75, 77, 78, 80, 79, 81, 82, 83, 84]),
  },
  {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    kind: "Crypto",
    quoteKind: "crypto",
    finnhub: "BINANCE:USDCUSDT",
    fallbackPrice: "€0.92",
    fallbackChange: 0.1,
    fallbackSeries: S([50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]),
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    kind: "Crypto",
    quoteKind: "crypto",
    finnhub: "BINANCE:SOLUSDT",
    fallbackPrice: "€168",
    fallbackChange: 3.1,
    fallbackSeries: S([40, 42, 41, 44, 46, 45, 48, 50, 49, 52, 54, 53, 56, 58, 60]),
  },
  {
    id: "xrp",
    symbol: "XRP",
    name: "XRP",
    kind: "Crypto",
    quoteKind: "crypto",
    finnhub: "BINANCE:XRPUSDT",
    fallbackPrice: "€2.18",
    fallbackChange: 1.2,
    fallbackSeries: S([45, 46, 44, 47, 48, 49, 48, 50, 51, 52, 51, 53, 54, 55, 56]),
  },
  {
    id: "bnb",
    symbol: "BNB",
    name: "BNB",
    kind: "Crypto",
    quoteKind: "crypto",
    finnhub: "BINANCE:BNBUSDT",
    fallbackPrice: "€582",
    fallbackChange: 0.9,
    fallbackSeries: S([55, 56, 55, 57, 58, 59, 58, 60, 61, 60, 62, 63, 64, 65, 66]),
  },
  {
    id: "sap",
    symbol: "SAP",
    name: "SAP SE",
    kind: "Stocks",
    quoteKind: "stock",
    finnhub: "SAP.DE",
    fallbackPrice: "€248.60",
    fallbackChange: 1.1,
    fallbackSeries: S([60, 61, 62, 61, 63, 64, 65, 66, 65, 67, 68, 69, 70, 71, 72]),
  },
  {
    id: "sie",
    symbol: "SIE",
    name: "Siemens",
    kind: "Stocks",
    quoteKind: "stock",
    finnhub: "SIE.DE",
    fallbackPrice: "€186.90",
    fallbackChange: 0.9,
    fallbackSeries: S([55, 56, 55, 57, 58, 59, 58, 60, 61, 62, 61, 63, 64, 65, 66]),
  },
  {
    id: "alv",
    symbol: "ALV",
    name: "Allianz",
    kind: "Stocks",
    quoteKind: "stock",
    finnhub: "ALV.DE",
    fallbackPrice: "€278.20",
    fallbackChange: 0.6,
    fallbackSeries: S([65, 66, 65, 67, 68, 69, 68, 70, 71, 70, 72, 73, 74, 75, 76]),
  },
  {
    id: "vow",
    symbol: "VOW3",
    name: "Volkswagen Pref",
    kind: "Stocks",
    quoteKind: "stock",
    finnhub: "VOW3.DE",
    fallbackPrice: "€98.40",
    fallbackChange: 1.4,
    fallbackSeries: S([40, 41, 42, 41, 43, 44, 45, 44, 46, 47, 48, 47, 49, 50, 51]),
  },
  {
    id: "air",
    symbol: "AIR",
    name: "Airbus",
    kind: "Stocks",
    quoteKind: "stock",
    finnhub: "AIR.PA",
    fallbackPrice: "€164.20",
    fallbackChange: 0.8,
    fallbackSeries: S([58, 59, 58, 60, 61, 62, 61, 63, 64, 65, 64, 66, 67, 68, 69]),
  },
  {
    id: "mc",
    symbol: "MC",
    name: "LVMH",
    kind: "Stocks",
    quoteKind: "stock",
    finnhub: "MC.PA",
    fallbackPrice: "€628.40",
    fallbackChange: -0.4,
    fallbackSeries: S([80, 79, 78, 79, 77, 76, 75, 76, 74, 73, 74, 72, 71, 70, 69]),
  },
  {
    id: "aapl",
    symbol: "AAPL",
    name: "Apple",
    kind: "Stocks",
    quoteKind: "stock",
    finnhub: "AAPL",
    fallbackPrice: "€198.40",
    fallbackChange: 0.7,
    fallbackSeries: S([62, 63, 62, 64, 65, 66, 65, 67, 68, 69, 68, 70, 71, 72, 73]),
  },
  {
    id: "msft",
    symbol: "MSFT",
    name: "Microsoft",
    kind: "Stocks",
    quoteKind: "stock",
    finnhub: "MSFT",
    fallbackPrice: "€412.80",
    fallbackChange: 0.5,
    fallbackSeries: S([70, 71, 70, 72, 73, 74, 73, 75, 76, 77, 76, 78, 79, 80, 81]),
  },
  {
    id: "nvda",
    symbol: "NVDA",
    name: "NVIDIA",
    kind: "Stocks",
    quoteKind: "stock",
    finnhub: "NVDA",
    fallbackPrice: "€118.60",
    fallbackChange: 2.2,
    fallbackSeries: S([48, 50, 49, 52, 54, 53, 56, 58, 57, 60, 62, 61, 64, 66, 68]),
  },
  {
    id: "bund",
    symbol: "BUND",
    name: "German Bund 10Y",
    kind: "Bonds",
    quoteKind: "yield",
    finnhub: "DE10Y",
    fallbackPrice: "2.18%",
    fallbackChange: -0.3,
    fallbackSeries: S([80, 79, 78, 77, 76, 75, 74, 73, 74, 72, 71, 70, 69, 68, 67]),
  },
  {
    id: "us10y",
    symbol: "US10Y",
    name: "US Treasury 10Y",
    kind: "Bonds",
    quoteKind: "yield",
    finnhub: "TNX",
    fallbackPrice: "4.12%",
    fallbackChange: 0.2,
    fallbackSeries: S([60, 61, 60, 62, 63, 64, 63, 65, 66, 65, 67, 68, 69, 70, 71]),
  },
  {
    id: "uk10y",
    symbol: "UK10Y",
    name: "UK Gilt 10Y",
    kind: "Bonds",
    quoteKind: "yield",
    finnhub: "GB10Y",
    fallbackPrice: "4.01%",
    fallbackChange: -0.1,
    fallbackSeries: S([64, 63, 64, 62, 61, 62, 60, 59, 60, 58, 57, 58, 56, 55, 54]),
  },
  {
    id: "eugb",
    symbol: "EUGB",
    name: "EU Green Bond",
    kind: "Bonds",
    quoteKind: "yield",
    finnhub: "DE10Y",
    fallbackPrice: "2.41%",
    fallbackChange: 0.2,
    fallbackSeries: S([50, 51, 50, 52, 53, 52, 54, 55, 54, 56, 57, 56, 58, 59, 60]),
  },
  {
    id: "dax",
    symbol: "DAX",
    name: "DAX 40",
    kind: "Indices",
    quoteKind: "index",
    finnhub: "^GDAXI",
    fallbackPrice: "18,642",
    fallbackChange: 1.3,
    fallbackSeries: S([75, 76, 77, 76, 78, 79, 80, 81, 80, 82, 83, 84, 85, 86, 87]),
  },
  {
    id: "stoxx",
    symbol: "STOXX",
    name: "Euro Stoxx 50",
    kind: "Indices",
    quoteKind: "index",
    finnhub: "^STOXX50E",
    fallbackPrice: "5,248",
    fallbackChange: 0.8,
    fallbackSeries: S([68, 69, 68, 70, 71, 72, 71, 73, 74, 75, 74, 76, 77, 78, 79]),
  },
  {
    id: "spx",
    symbol: "SPX",
    name: "S&P 500",
    kind: "Indices",
    quoteKind: "index",
    finnhub: "^GSPC",
    fallbackPrice: "5,742",
    fallbackChange: 0.6,
    fallbackSeries: S([72, 73, 72, 74, 75, 76, 75, 77, 78, 79, 78, 80, 81, 82, 83]),
  },
  {
    id: "ndx",
    symbol: "NDX",
    name: "Nasdaq 100",
    kind: "Indices",
    quoteKind: "index",
    finnhub: "^NDX",
    fallbackPrice: "20,184",
    fallbackChange: 1.0,
    fallbackSeries: S([66, 68, 67, 69, 71, 70, 72, 74, 73, 75, 77, 76, 78, 80, 81]),
  },
  {
    id: "ftse",
    symbol: "FTSE",
    name: "FTSE 100",
    kind: "Indices",
    quoteKind: "index",
    finnhub: "^FTSE",
    fallbackPrice: "8,312",
    fallbackChange: 0.4,
    fallbackSeries: S([70, 70, 71, 70, 72, 73, 72, 74, 74, 75, 74, 76, 77, 77, 78]),
  },
];

export const DEFAULT_FEATURED_IDS = ["btc", "eth", "usdc", "sap", "bund", "dax"];

export const MARKET_CATEGORIES: UniverseInstrument["kind"][] = [
  "Crypto",
  "Stocks",
  "Bonds",
  "Indices",
];

export function instrumentById(id: string) {
  return MARKET_UNIVERSE.find((i) => i.id === id);
}

export function searchUniverse(q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return MARKET_UNIVERSE;
  return MARKET_UNIVERSE.filter(
    (i) =>
      i.symbol.toLowerCase().includes(s) ||
      i.name.toLowerCase().includes(s) ||
      i.kind.toLowerCase().includes(s)
  );
}

export function defaultVotes(id: string) {
  let h = 0;
  for (const c of id) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return { up: 42 + (h % 88), down: 7 + (h % 22) };
}

export function defaultWhy(inst: UniverseInstrument) {
  if (inst.kind === "Crypto") {
    return `${inst.name} stays on the desk watchlist — European session flow still sets the tone, and structure matters more than the headline print.`;
  }
  if (inst.kind === "Stocks") {
    return `${inst.name} remains a quality European / global compounder in our set — add on soft opens, not on rips.`;
  }
  if (inst.kind === "Bonds") {
    return `${inst.name} is ballast, not a hero trade — duration stays useful while policy is data-dependent.`;
  }
  return `${inst.name} breadth and leadership still decide the session. Dips look orderly while the mid holds.`;
}

export function defaultNote(inst: UniverseInstrument) {
  if (inst.kind === "Crypto") {
    return `I stay constructive in ${inst.symbol} while the session mid holds. Prefer shallow dips over chasing.`;
  }
  if (inst.kind === "Stocks") {
    return `${inst.symbol} is an accumulate-on-weakness name on our desk — size for quality, not momentum.`;
  }
  if (inst.kind === "Bonds") {
    return `Use ${inst.symbol} for balance. Keep duration moderate and ignore the yield chase.`;
  }
  return `Hold ${inst.symbol} above the session mid — dips still look constructive while breadth holds.`;
}

export function analystFor(id: string, analystId?: string) {
  const named = analystId ? EXPERTS.find((e) => e.id === analystId) : null;
  if (named) {
    return { name: named.name, role: named.role, image: named.image };
  }
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const e = EXPERTS[h % EXPERTS.length];
  return { name: e.name, role: e.role, image: e.image };
}

export function toPickItem(
  inst: UniverseInstrument,
  saved?: SavedDeskPick,
  live?: { price: string; changePct: number; series: number[] }
): PickItem {
  const analyst = analystFor(inst.id, saved?.analystId);
  return {
    id: inst.id,
    symbol: inst.symbol,
    name: inst.name,
    kind: inst.kind,
    price: live?.price ?? inst.fallbackPrice,
    changePct: live?.changePct ?? inst.fallbackChange,
    why: saved?.why?.trim() || defaultWhy(inst),
    series: live?.series?.length ? live.series : inst.fallbackSeries,
    votes: saved?.votes ?? defaultVotes(inst.id),
    analyst: {
      ...analyst,
      note: saved?.note?.trim() || defaultNote(inst),
    },
  };
}
