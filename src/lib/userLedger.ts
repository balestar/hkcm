import type { SupabaseClient } from "@supabase/supabase-js";
import { YIELDS, type YieldAsset } from "@/lib/data";

const KV = "kv_store_0fc9642b";
export const LEDGER_PREFIX = "hkcm_l:";

export type LedgerTxKind = "deposit" | "withdraw" | "yield" | "transfer";

export type LedgerTransaction = {
  id: string;
  at: string;
  kind: LedgerTxKind;
  label: string;
  amountEur: number;
  asset: string | null;
};

export type UserLedger = {
  address: string;
  accountEur: number | null;
  yieldBalance: number | null;
  yieldIncome: number | null;
  yieldAsset: YieldAsset | null;
  yieldId: string | null;
  profitRate: number | null;
  transactions: LedgerTransaction[];
  updatedAt: string;
};

const TX_KINDS = new Set<LedgerTxKind>(["deposit", "withdraw", "yield", "transfer"]);

export function emptyLedger(address: string): UserLedger {
  return {
    address,
    accountEur: null,
    yieldBalance: null,
    yieldIncome: null,
    yieldAsset: null,
    yieldId: null,
    profitRate: null,
    transactions: [],
    updatedAt: new Date().toISOString(),
  };
}

function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function signedNum(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function parseTransaction(value: unknown): LedgerTransaction | null {
  const raw = (value ?? {}) as Partial<LedgerTransaction>;
  const kind = typeof raw.kind === "string" && TX_KINDS.has(raw.kind as LedgerTxKind)
    ? (raw.kind as LedgerTxKind)
    : null;
  const amountEur = signedNum(raw.amountEur);
  const at = typeof raw.at === "string" && raw.at ? raw.at : null;
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  if (!kind || amountEur == null || !at || !label) return null;
  return {
    id:
      typeof raw.id === "string" && raw.id
        ? raw.id
        : `tx_${Math.random().toString(36).slice(2, 10)}`,
    at,
    kind,
    label: label.slice(0, 120),
    amountEur,
    asset: typeof raw.asset === "string" && raw.asset ? raw.asset.slice(0, 16) : null,
  };
}

export function parseLedger(value: unknown, fallbackAddress: string): UserLedger {
  const raw = (value ?? {}) as Partial<UserLedger>;
  const address =
    typeof raw.address === "string" && raw.address ? raw.address : fallbackAddress;
  const yieldId =
    typeof raw.yieldId === "string" && YIELDS.some((y) => y.id === raw.yieldId)
      ? raw.yieldId
      : null;
  const fromProduct = yieldId ? YIELDS.find((y) => y.id === yieldId) : null;
  const yieldAsset =
    raw.yieldAsset === "USDC" || raw.yieldAsset === "ETH"
      ? raw.yieldAsset
      : fromProduct?.asset ?? null;
  const transactions = Array.isArray(raw.transactions)
    ? raw.transactions
        .map(parseTransaction)
        .filter((tx): tx is LedgerTransaction => !!tx)
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 100)
    : [];
  return {
    address,
    accountEur: numOrNull(raw.accountEur),
    yieldBalance: numOrNull(raw.yieldBalance),
    yieldIncome: numOrNull(raw.yieldIncome),
    yieldAsset,
    yieldId,
    profitRate: numOrNull(raw.profitRate),
    transactions,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

export function ledgerHasOverride(ledger: UserLedger | null | undefined): boolean {
  if (!ledger) return false;
  return (
    ledger.accountEur != null ||
    ledger.yieldBalance != null ||
    ledger.yieldIncome != null ||
    ledger.profitRate != null ||
    ledger.transactions.length > 0
  );
}

export function profitRateFor(ledger: UserLedger | null | undefined, yieldId: string): number | null {
  if (!ledger || ledger.profitRate == null) return null;
  if (ledger.yieldId && ledger.yieldId !== yieldId) return null;
  return ledger.profitRate;
}

export function formatApy(rate: number): string {
  const rounded = Number.isInteger(rate) ? String(rate) : rate.toFixed(2).replace(/\.?0+$/, "");
  return `${rounded}%`;
}

export async function getLedger(db: SupabaseClient, address: string): Promise<UserLedger | null> {
  const key = `${LEDGER_PREFIX}${address.toLowerCase()}`;
  const kv = await db.from(KV).select("value").eq("key", key).maybeSingle();
  if (kv.error || !kv.data?.value) return null;
  return parseLedger(kv.data.value, address);
}

export async function listLedgers(db: SupabaseClient): Promise<UserLedger[]> {
  const kv = await db.from(KV).select("key, value").like("key", `${LEDGER_PREFIX}%`).limit(400);
  if (kv.error) return [];
  return (kv.data ?? [])
    .map((row) => {
      const address = String(row.key).slice(LEDGER_PREFIX.length);
      return parseLedger(row.value, address);
    })
    .filter((book) => book.address);
}

export async function saveLedger(db: SupabaseClient, input: UserLedger): Promise<UserLedger> {
  const ledger = parseLedger({ ...input, updatedAt: new Date().toISOString() }, input.address);
  const kv = await db.from(KV).upsert({
    key: `${LEDGER_PREFIX}${ledger.address.toLowerCase()}`,
    value: ledger,
  });
  if (kv.error) throw new Error(kv.error.message);
  return ledger;
}
