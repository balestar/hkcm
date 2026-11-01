"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatEur } from "@/lib/data";
import type { UserLedger } from "@/lib/userLedger";

type MeHolding = {
  chain: string;
  label: string;
  tokens: { symbol: string; amount: number; eur: number | null }[];
  totalEur: number;
};

type MeResponse = {
  ok: boolean;
  holdings: MeHolding[];
  totalEur: number;
  ledger?: UserLedger | null;
};

function fmtAmount(n: number) {
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 4,
  }).format(n);
}

export function AccountSummary() {
  const { address } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/me?address=${encodeURIComponent(address)}`);
        const json = (await res.json()) as MeResponse;
        if (!cancelled && json.ok) setData(json);
        else if (!cancelled) setError(true);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const holdings = data?.holdings ?? [];
  const heldTokens = holdings.flatMap((h) =>
    h.tokens.filter((t) => t.amount > 0)
  );
  const heldCount = heldTokens.length;
  const totalEur = data?.totalEur ?? 0;
  const ledger = data?.ledger ?? null;
  const hasAccount = totalEur > 0 || ledger?.accountEur != null;
  const transactions = ledger?.transactions ?? [];

  return (
    <section className="panel animate-rise-delay-1 overflow-hidden p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            {t.account.eyebrow}
          </p>
          <p className="mt-3 font-display text-[2.1rem] tracking-[-0.04em] text-ink sm:text-[2.35rem]">
            {loading ? "…" : formatEur(totalEur)}
          </p>
          {(loading || error || !hasAccount) && (
            <p className="mt-1 text-[13px] text-body">
              {loading
                ? t.account.reading
                : error
                  ? t.account.error
                  : t.account.empty}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-soft/80 px-4 py-3">
          <p className="text-[12px] text-muted">Tokens held</p>
          <p className="mt-1 text-[15px] font-semibold text-ink">
            {loading ? "…" : heldCount > 0 ? `${heldCount}` : "0"}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-soft/80 px-4 py-3">
          <p className="text-[12px] text-muted">
            {ledger?.yieldIncome != null ? "Yield income" : "Cash (EUR equivalent)"}
          </p>
          <p className="mt-1 text-[15px] font-semibold text-ink">
            {loading
              ? "…"
              : ledger?.yieldIncome != null
                ? formatEur(ledger.yieldIncome)
                : formatEur(totalEur)}
          </p>
        </div>
      </div>

      {!loading && heldCount > 0 && (
        <ul className="mt-5 divide-y divide-[var(--line)]">
          {holdings
            .filter((h) => h.tokens.some((t) => t.amount > 0))
            .map((h) => (
              <li key={h.chain} className="py-3 first:pt-0 last:pb-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {h.label}
                </p>
                <div className="mt-2 space-y-1.5">
                  {h.tokens
                    .filter((t) => t.amount > 0)
                    .map((t) => (
                      <div
                        key={`${h.chain}-${t.symbol}`}
                        className="flex items-center justify-between"
                      >
                        <p className="text-[14px] font-medium text-ink">
                          {fmtAmount(t.amount)} {t.symbol}
                        </p>
                        <p className="text-[13px] text-body">
                          {t.eur != null ? formatEur(t.eur) : "—"}
                        </p>
                      </div>
                    ))}
                </div>
              </li>
            ))}
        </ul>
      )}

      {!loading && transactions.length > 0 && (
        <div className="mt-5 border-t border-[var(--line)] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Transaction history
          </p>
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-ink">{tx.label}</p>
                  <p className="text-[12px] text-muted">
                    {new Date(tx.at).toLocaleDateString("de-DE")}
                    {tx.asset ? ` · ${tx.asset}` : ""}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-[14px] font-semibold tabular-nums ${
                    tx.amountEur >= 0 ? "text-gain" : "text-loss"
                  }`}
                >
                  {tx.amountEur >= 0 ? "+" : "−"}
                  {formatEur(Math.abs(tx.amountEur))}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
