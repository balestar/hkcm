"use client";

import { ACCOUNT, formatEur } from "@/lib/data";

export function AccountSummary() {
  const positive = ACCOUNT.dayPnl >= 0;

  return (
    <section className="panel animate-rise-delay-1 overflow-hidden p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            Account summary
          </p>
          <p className="mt-3 font-display text-[2.1rem] tracking-[-0.04em] text-ink sm:text-[2.35rem]">
            {formatEur(ACCOUNT.equity)}
          </p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-[13px] font-semibold ${
            positive ? "bg-[var(--halo)] text-gain" : "bg-red-50 text-loss"
          }`}
        >
          {positive ? "+" : ""}
          {formatEur(ACCOUNT.dayPnl)} · {positive ? "+" : ""}
          {ACCOUNT.dayPnlPct.toFixed(2)}%
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-soft/80 px-4 py-3">
          <p className="text-[12px] text-muted">Invested</p>
          <p className="mt-1 text-[15px] font-semibold text-ink">
            {formatEur(ACCOUNT.equity - ACCOUNT.cash)}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-soft/80 px-4 py-3">
          <p className="text-[12px] text-muted">Cash</p>
          <p className="mt-1 text-[15px] font-semibold text-ink">
            {formatEur(ACCOUNT.cash)}
          </p>
        </div>
      </div>
    </section>
  );
}
