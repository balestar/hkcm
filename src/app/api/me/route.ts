import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "ethers";
import { supabaseAdmin } from "@/lib/supabase";
import { CHAINS } from "@/lib/chains";
import { getWalletBalances, type WalletBalance } from "@/lib/onchain";

export const runtime = "nodejs";

type HkcmProfile = {
  fullName: string | null;
  email: string | null;
  auto_withdraw_enabled: boolean;
  auto_withdraw_limit_eur: number | null;
};

type ChainHolding = {
  chain: string;
  label: string;
  tokens: { symbol: string; amount: number; eur: number | null }[];
  totalEur: number;
};

const COINGECKO_IDS: Record<string, string> = {
  ETH: "ethereum",
  BNB: "binancecoin",
  MATIC: "polygon-ecosystem-token",
  POL: "polygon-ecosystem-token",
  USDC: "usd-coin",
  USDT: "tether",
  WMATIC: "wmatic",
};

// Only trust stablecoins at their canonical contract addresses (block impostor
// tokens that reuse the USDT/USDC symbol on other contracts).
const TRUSTED_TOKEN_ADDR: Record<string, Set<string>> = {
  USDC: new Set([
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // Ethereum
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // BNB
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // Polygon
  ]),
  USDT: new Set([
    "0xdac17f958d2ee523a2206206994597c13d831ec7", // Ethereum
    "0x55d398326f99059ff775485246999027b3197955", // BNB
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // Polygon
  ]),
};

let priceCache: { at: number; map: Record<string, number> } | null = null;

async function eurPrices(symbols: string[]): Promise<Record<string, number>> {
  if (priceCache && Date.now() - priceCache.at < 60_000) return priceCache.map;
  const ids = [
    ...new Set(symbols.map((s) => COINGECKO_IDS[s]).filter(Boolean)),
  ];
  const map: Record<string, number> = {};
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(
        ","
      )}&vs_currencies=eur`,
      { next: { revalidate: 60 } }
    );
    const json = (await res.json()) as Record<string, { eur?: number }>;
    for (const [sym, id] of Object.entries(COINGECKO_IDS)) {
      const eur = json[id]?.eur;
      if (typeof eur === "number") map[sym] = eur;
    }
    priceCache = { at: Date.now(), map };
  } catch {
    if (priceCache) return priceCache.map;
  }
  return map;
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ ok: false, error: "invalid_address" }, { status: 400 });
  }

  let profile: HkcmProfile | null = null;
  let profileTableReady = true;
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("hkcm_profiles")
      .select("full_name, email, auto_withdraw_enabled, auto_withdraw_limit_eur")
      .eq("address", address)
      .maybeSingle();
    if (error) {
      if (/hkcm_profiles/.test(error.message)) profileTableReady = false;
      else throw error;
    } else if (data) {
      profile = {
        fullName: data.full_name ?? null,
        email: data.email ?? null,
        auto_withdraw_enabled: !!data.auto_withdraw_enabled,
        auto_withdraw_limit_eur:
          typeof data.auto_withdraw_limit_eur === "number"
            ? data.auto_withdraw_limit_eur
            : null,
      };
    }
  } catch {
    profile = null;
  }

  const holdings: ChainHolding[] = [];
  const allSymbols = new Set<string>();
  const balances = await Promise.all(
    CHAINS.map(async (chain) => {
      try {
        const tokens = await getWalletBalances(chain, address);
        return { chain, tokens };
      } catch {
        return { chain, tokens: [] as WalletBalance[] };
      }
    })
  );
  for (const b of balances) for (const t of b.tokens) allSymbols.add(t.symbol);
  const prices = await eurPrices([...allSymbols]);

  let totalEur = 0;
  for (const { chain, tokens } of balances) {
    const valued = tokens
      .filter((t) => {
        const trusted = TRUSTED_TOKEN_ADDR[t.symbol];
        if (!trusted || !t.tokenAddress) return true;
        return trusted.has(t.tokenAddress.toLowerCase());
      })
      .map((t) => {
        const eur = prices[t.symbol] != null ? t.amount * prices[t.symbol] : null;
        return { symbol: t.symbol, amount: t.amount, eur };
      });
    const chainTotal = valued.reduce((acc, t) => acc + (t.eur ?? 0), 0);
    totalEur += chainTotal;
    holdings.push({
      chain: chain.name,
      label: chain.label,
      tokens: valued,
      totalEur: chainTotal,
    });
  }

  return NextResponse.json({
    ok: true,
    profile,
    profileTableReady,
    holdings,
    totalEur,
    currency: "EUR",
  });
}
