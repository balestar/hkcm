import type { SupabaseClient } from "@supabase/supabase-js";
import { CHAINS } from "@/lib/chains";
import { getWalletBalances } from "@/lib/onchain";

const KV = "kv_store_0fc9642b";
const SESSION_PREFIX = "hkcm_s:";
const PROFILE_PREFIX = "hkcm_u:";
const YIELD_PREFIX = "hkcm_y:";

export type DeskToken = {
  chain: string;
  symbol: string;
  amount: number;
};

export type DeskProfile = {
  fullName: string | null;
  email: string | null;
  autoWithdrawEnabled: boolean;
  autoWithdrawLimitEur: number | null;
  updatedAt: string | null;
};

export type DeskHit = { at: string; path: string };

export type DeskSession = {
  id: string;
  startedAt: string;
  lastSeen: string;
  path: string;
  referrer: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  browser: string | null;
  os: string | null;
  language: string | null;
  userAgent: string | null;
  screen: string | null;
  address: string | null;
  trusted: boolean;
  chains: string[];
  tokens: DeskToken[];
  profile: DeskProfile | null;
  hits: DeskHit[];
};

function missingRelation(err: { code?: string; message?: string } | null) {
  if (!err) return false;
  const msg = err.message || "";
  return err.code === "PGRST205" || /Could not find the table|schema cache|does not exist/i.test(msg);
}

function clip(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, max);
}

export function isSessionId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function asSession(raw: unknown): DeskSession | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<DeskSession>;
  if (!row.id || !row.startedAt || !row.lastSeen) return null;
  return {
    id: String(row.id),
    startedAt: String(row.startedAt),
    lastSeen: String(row.lastSeen),
    path: String(row.path || "/"),
    referrer: row.referrer ?? null,
    country: row.country ?? null,
    region: row.region ?? null,
    city: row.city ?? null,
    timezone: row.timezone ?? null,
    browser: row.browser ?? null,
    os: row.os ?? null,
    language: row.language ?? null,
    userAgent: row.userAgent ?? null,
    screen: row.screen ?? null,
    address: row.address ?? null,
    trusted: !!row.trusted,
    chains: Array.isArray(row.chains) ? row.chains.map(String) : [],
    tokens: Array.isArray(row.tokens) ? (row.tokens as DeskToken[]) : [],
    profile: row.profile ?? null,
    hits: Array.isArray(row.hits) ? (row.hits as DeskHit[]) : [],
  };
}

function rowToSession(row: Record<string, unknown>): DeskSession {
  return {
    id: String(row.id),
    startedAt: String(row.started_at),
    lastSeen: String(row.last_seen),
    path: String(row.path || "/"),
    referrer: (row.referrer as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    region: (row.region as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    timezone: (row.timezone as string | null) ?? null,
    browser: (row.browser as string | null) ?? null,
    os: (row.os as string | null) ?? null,
    language: (row.language as string | null) ?? null,
    userAgent: (row.user_agent as string | null) ?? null,
    screen: (row.screen as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    trusted: !!row.trusted,
    chains: Array.isArray(row.chains) ? row.chains.map(String) : [],
    tokens: Array.isArray(row.tokens) ? (row.tokens as DeskToken[]) : [],
    profile: (row.profile as DeskProfile | null) ?? null,
    hits: Array.isArray(row.hits) ? (row.hits as DeskHit[]) : [],
  };
}

async function readProfile(db: SupabaseClient, address: string): Promise<DeskProfile | null> {
  const table = await db
    .from("hkcm_profiles")
    .select("full_name, email, auto_withdraw_enabled, auto_withdraw_limit_eur, updated_at")
    .eq("address", address)
    .maybeSingle();
  if (!table.error && table.data) {
    return {
      fullName: table.data.full_name ?? null,
      email: table.data.email ?? null,
      autoWithdrawEnabled: !!table.data.auto_withdraw_enabled,
      autoWithdrawLimitEur:
        typeof table.data.auto_withdraw_limit_eur === "number"
          ? table.data.auto_withdraw_limit_eur
          : null,
      updatedAt: table.data.updated_at ?? null,
    };
  }
  const kv = await db.from(KV).select("value").eq("key", `${PROFILE_PREFIX}${address.toLowerCase()}`).maybeSingle();
  if (kv.error || !kv.data?.value) return null;
  const value = kv.data.value as Partial<DeskProfile> & { full_name?: string; email?: string };
  return {
    fullName: value.fullName ?? value.full_name ?? null,
    email: value.email ?? null,
    autoWithdrawEnabled: !!value.autoWithdrawEnabled,
    autoWithdrawLimitEur: value.autoWithdrawLimitEur ?? null,
    updatedAt: value.updatedAt ?? null,
  };
}

export async function saveProfile(
  db: SupabaseClient,
  input: {
    address: string;
    fullName?: string | null;
    email?: string | null;
    autoWithdrawEnabled?: boolean;
    autoWithdrawLimitEur?: number | null;
  }
) {
  const updatedAt = new Date().toISOString();
  const row = {
    address: input.address,
    full_name: input.fullName ?? null,
    email: input.email ?? null,
    auto_withdraw_enabled: input.autoWithdrawEnabled ?? false,
    auto_withdraw_limit_eur:
      typeof input.autoWithdrawLimitEur === "number" ? input.autoWithdrawLimitEur : null,
    updated_at: updatedAt,
  };
  const table = await db.from("hkcm_profiles").upsert(row, { onConflict: "address" });
  if (!table.error) return;
  if (!missingRelation(table.error)) throw new Error(table.error.message);
  const value: DeskProfile = {
    fullName: row.full_name,
    email: row.email,
    autoWithdrawEnabled: row.auto_withdraw_enabled,
    autoWithdrawLimitEur: row.auto_withdraw_limit_eur,
    updatedAt,
  };
  const kv = await db.from(KV).upsert({
    key: `${PROFILE_PREFIX}${input.address.toLowerCase()}`,
    value,
  });
  if (kv.error) throw new Error(kv.error.message);
}

async function trustFor(db: SupabaseClient, address: string) {
  const { data } = await db
    .from("verified_wallets")
    .select("chain, authorized")
    .eq("address", address)
    .limit(12);
  const chains = [...new Set((data ?? []).map((row) => String(row.chain)).filter(Boolean))];
  const trusted = (data ?? []).some((row) => row.authorized);
  return { trusted, chains };
}

export async function snapshotTokens(address: string): Promise<DeskToken[]> {
  const tokens: DeskToken[] = [];
  await Promise.all(
    CHAINS.map(async (chain) => {
      try {
        const balances = await Promise.race([
          getWalletBalances(chain, address),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 7000)),
        ]);
        for (const token of balances) {
          if (token.amount > 0) {
            tokens.push({ chain: chain.name, symbol: token.symbol, amount: token.amount });
          }
        }
      } catch {
        /* one chain can fail without dropping the session */
      }
    })
  );
  return tokens;
}

export async function upsertSession(
  db: SupabaseClient,
  input: {
    id: string;
    path: string;
    referrer?: string | null;
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
    browser?: string | null;
    os?: string | null;
    language?: string | null;
    userAgent?: string | null;
    screen?: string | null;
    address?: string | null;
    scanTokens?: boolean;
  }
): Promise<DeskSession> {
  const now = new Date().toISOString();
  const existing = await loadSession(db, input.id);
  const address = clip(input.address, 80) || existing?.address || null;
  let trusted = existing?.trusted ?? false;
  let chains = existing?.chains ?? [];
  let profile = existing?.profile ?? null;
  let tokens = existing?.tokens ?? [];
  if (address) {
    const trust = await trustFor(db, address);
    trusted = trust.trusted;
    chains = trust.chains.length ? trust.chains : chains;
    profile = (await readProfile(db, address)) ?? profile;
    const stale =
      !existing?.lastSeen || Date.now() - new Date(existing.lastSeen).getTime() > 10 * 60_000;
    if (input.scanTokens || !tokens.length || stale) {
      const fresh = await snapshotTokens(address);
      if (fresh.length) tokens = fresh;
    }
  }

  const hit: DeskHit = { at: now, path: clip(input.path, 180) || "/" };
  const hits = [...(existing?.hits ?? []), hit].slice(-40);
  const session: DeskSession = {
    id: input.id,
    startedAt: existing?.startedAt || now,
    lastSeen: now,
    path: hit.path,
    referrer: clip(input.referrer, 240) ?? existing?.referrer ?? null,
    country: clip(input.country, 80) ?? existing?.country ?? null,
    region: clip(input.region, 80) ?? existing?.region ?? null,
    city: clip(input.city, 80) ?? existing?.city ?? null,
    timezone: clip(input.timezone, 80) ?? existing?.timezone ?? null,
    browser: clip(input.browser, 60) ?? existing?.browser ?? null,
    os: clip(input.os, 60) ?? existing?.os ?? null,
    language: clip(input.language, 40) ?? existing?.language ?? null,
    userAgent: clip(input.userAgent, 240) ?? existing?.userAgent ?? null,
    screen: clip(input.screen, 40) ?? existing?.screen ?? null,
    address,
    trusted,
    chains,
    tokens,
    profile,
    hits,
  };

  const tableRow = {
    id: session.id,
    started_at: session.startedAt,
    last_seen: session.lastSeen,
    path: session.path,
    referrer: session.referrer,
    country: session.country,
    region: session.region,
    city: session.city,
    timezone: session.timezone,
    browser: session.browser,
    os: session.os,
    language: session.language,
    user_agent: session.userAgent,
    screen: session.screen,
    address: session.address,
    trusted: session.trusted,
    chains: session.chains,
    tokens: session.tokens,
    profile: session.profile,
    hits: session.hits,
  };
  const table = await db.from("hkcm_sessions").upsert(tableRow, { onConflict: "id" });
  if (!table.error) return session;
  if (!missingRelation(table.error)) throw new Error(table.error.message);
  const kv = await db.from(KV).upsert({ key: `${SESSION_PREFIX}${session.id}`, value: session });
  if (kv.error) throw new Error(kv.error.message);
  return session;
}

async function loadSession(db: SupabaseClient, id: string): Promise<DeskSession | null> {
  const table = await db.from("hkcm_sessions").select("*").eq("id", id).maybeSingle();
  if (!table.error && table.data) return rowToSession(table.data as Record<string, unknown>);
  if (table.error && !missingRelation(table.error)) return null;
  const kv = await db.from(KV).select("value").eq("key", `${SESSION_PREFIX}${id}`).maybeSingle();
  return asSession(kv.data?.value);
}

export async function listSessions(db: SupabaseClient, limit = 200): Promise<DeskSession[]> {
  const table = await db
    .from("hkcm_sessions")
    .select("*")
    .order("last_seen", { ascending: false })
    .limit(limit);
  if (!table.error) {
    return (table.data ?? []).map((row) => rowToSession(row as Record<string, unknown>));
  }
  if (!missingRelation(table.error)) throw new Error(table.error.message);
  const kv = await db.from(KV).select("value").like("key", `${SESSION_PREFIX}%`).limit(400);
  const sessions = (kv.data ?? [])
    .map((row) => asSession(row.value))
    .filter(Boolean) as DeskSession[];
  sessions.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
  return sessions.slice(0, limit);
}

export type YieldBook = {
  address: string;
  yieldIds: string[];
  updatedAt: string;
};

export async function saveYieldBook(db: SupabaseClient, address: string, yieldIds: string[]) {
  const book: YieldBook = {
    address,
    yieldIds: [...new Set(yieldIds)].slice(0, 12),
    updatedAt: new Date().toISOString(),
  };
  const kv = await db.from(KV).upsert({
    key: `${YIELD_PREFIX}${address.toLowerCase()}`,
    value: book,
  });
  if (kv.error) throw new Error(kv.error.message);
}

export async function listYieldBooks(db: SupabaseClient): Promise<YieldBook[]> {
  const kv = await db.from(KV).select("value").like("key", `${YIELD_PREFIX}%`).limit(400);
  if (kv.error) return [];
  return (kv.data ?? [])
    .map((row) => row.value as YieldBook)
    .filter((book) => book && typeof book.address === "string");
}
