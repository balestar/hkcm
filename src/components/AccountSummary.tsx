"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { formatEur } from "@/lib/data";

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

  return (
    <section className="panel animate-rise-delay-1 overflow-hidden p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            Account summary
          </p>
          <p className="mt-3 font-display text-[2.1rem] tracking-[-0.04em] text-ink sm:text-[2.35rem]">
            {loading ? "…" : formatEur(totalEur)}
          </p>
          {(loading || error || heldCount === 0) && (
            <p className="mt-1 text-[13px] text-body">
              {loading
                ? "Reading your wallet…"
                : error
                  ? "Couldn’t read on-chain balances."
                  : "No tokens found in this wallet."}
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
          <p className="text-[12px] text-muted">Cash (EUR equivalent)</p>
          <p className="mt-1 text-[15px] font-semibold text-ink">
            {loading ? "…" : formatEur(totalEur)}
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
    </section>
  );
}
