import type { UniverseInstrument } from "@/lib/marketUniverse";

type Quote = { price: number; changePct: number; series: number[] };

const cache = new Map<string, { at: number; quote: Quote }>();
const TTL = 45_000;

function token() {
  return process.env.FINNHUB_API_KEY?.trim() || "";
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 45 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function fmtPrice(n: number, inst: UniverseInstrument, eurPerUsd: number) {
  if (inst.quoteKind === "yield") return `${n.toFixed(2)}%`;
  const listedInUsd =
    inst.quoteKind === "crypto" || (!inst.finnhub.includes(".") && inst.quoteKind === "stock");
  const eur = listedInUsd ? n / (eurPerUsd || 1) : n;
  if (inst.quoteKind === "index") {
    return eur.toLocaleString("de-DE", { maximumFractionDigits: 0 });
  }
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: eur >= 100 ? 2 : 4,
  }).format(eur);
}

function seriesFromCloses(closes: number[]) {
  if (closes.length < 4) return [];
  const slice = closes.slice(-15);
  const min = Math.min(...slice);
  const max = Math.max(...slice);
  const span = max - min || 1;
  return slice.map((v) => 40 + ((v - min) / span) * 60);
}

async function finnhubQuote(symbol: string) {
  const key = token();
  if (!key) return null;
  const first = await getJson<{ c?: number; dp?: number }>(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`
  );
  if (first && Number(first.c) > 0) return first;
  if (symbol.startsWith("^")) {
    return getJson<{ c?: number; dp?: number }>(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol.slice(1))}&token=${key}`
    );
  }
  return first;
}

async function finnhubCandles(inst: UniverseInstrument) {
  const key = token();
  if (!key) return [];
  const to = Math.floor(Date.now() / 1000);
  const from = to - 20 * 24 * 60 * 60;
  const path = inst.quoteKind === "crypto" ? "crypto/candle" : "stock/candle";
  const data = await getJson<{ s?: string; c?: number[] }>(
    `https://finnhub.io/api/v1/${path}?symbol=${encodeURIComponent(inst.finnhub)}&resolution=D&from=${from}&to=${to}&token=${key}`
  );
  if (data?.s !== "ok" || !data.c?.length) return [];
  return seriesFromCloses(data.c);
}

export async function quoteInstrument(inst: UniverseInstrument, eurPerUsd: number): Promise<Quote> {
  const hit = cache.get(inst.id);
  if (hit && Date.now() - hit.at < TTL) return hit.quote;

  const [q, series] = await Promise.all([finnhubQuote(inst.finnhub), finnhubCandles(inst)]);
  const price = Number(q?.c);
  const changePct = Number(q?.dp);
  const quote: Quote = {
    price: Number.isFinite(price) && price > 0 ? price : 0,
    changePct: Number.isFinite(changePct) ? changePct : inst.fallbackChange,
    series,
  };
  cache.set(inst.id, { at: Date.now(), quote });
  return quote;
}

export async function eurUsdRate() {
  const q = await finnhubQuote("EURUSD");
  const n = Number(q?.c);
  return Number.isFinite(n) && n > 0.5 ? n : 1.08;
}

export async function liveFor(inst: UniverseInstrument, eurPerUsd: number) {
  const q = await quoteInstrument(inst, eurPerUsd);
  if (!q.price) {
    return {
      price: inst.fallbackPrice,
      changePct: inst.fallbackChange,
      series: inst.fallbackSeries,
    };
  }
  return {
    price: fmtPrice(q.price, inst, eurPerUsd),
    changePct: q.changePct,
    series: q.series.length ? q.series : inst.fallbackSeries,
  };
}

type CoinGeckoCoin = { item?: { symbol?: string; name?: string; market_cap_rank?: number } };

export async function trendingSymbols(): Promise<string[]> {
  const data = await getJson<{ coins?: CoinGeckoCoin[] }>(
    "https://api.coingecko.com/api/v3/search/trending"
  );
  const coins = (data?.coins ?? [])
    .map((c) => String(c.item?.symbol || "").toUpperCase())
    .filter(Boolean);
  return coins.slice(0, 8);
}
