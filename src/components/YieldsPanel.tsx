"use client";

import { useEffect, useRef, useState } from "react";
import { YIELDS, type YieldItem } from "@/lib/data";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";

type MeHolding = {
  tokens: { symbol: string; amount: number }[];
};

function tokenBalance(holdings: MeHolding[], symbol: string) {
  const aliases = symbol === "ETH" ? new Set(["ETH", "WETH"]) : new Set([symbol.toUpperCase()]);
  return holdings.reduce((sum, h) => {
    return (
      sum +
      h.tokens
        .filter((t) => aliases.has(t.symbol.toUpperCase()))
        .reduce((acc, t) => acc + (t.amount || 0), 0)
    );
  }, 0);
}

export function YieldsPanel() {
  const { t } = useLanguage();
  const { address } = useAuth();
  const [open, setOpen] = useState<YieldItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setMessage(null);
    setOk(false);
    setBusy(false);
  }, [open?.id]);

  const activate = async (item: YieldItem) => {
    setBusy(true);
    setMessage(null);
    setOk(false);
    try {
      if (!address) {
        setMessage(t.yields.topUp);
        return;
      }
      const res = await fetch(`/api/me?address=${encodeURIComponent(address)}`);
      const json = (await res.json()) as { ok?: boolean; holdings?: MeHolding[] };
      if (!json.ok) {
        setMessage(t.yields.checkFailed);
        return;
      }
      const bal = tokenBalance(json.holdings ?? [], item.asset);
      if (bal <= 0) {
        setMessage(t.yields.topUp);
        return;
      }
      setOk(true);
      setMessage(t.yields.activated);
    } catch {
      setMessage(t.yields.checkFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel animate-rise-delay-2 p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            {t.yields.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-[1.35rem] tracking-[-0.03em] text-ink">
            {t.yields.title}
          </h2>
        </div>
      </div>

      <ul className="mt-5 divide-y divide-[var(--line)]">
        {YIELDS.map((y) => (
          <li key={y.id}>
            <button
              type="button"
              onClick={() => setOpen(y)}
              className="flex w-full items-center justify-between gap-4 py-3.5 text-left first:pt-0 last:pb-0 transition hover:opacity-80"
            >
              <div>
                <p className="text-[15px] font-semibold text-ink">{y.name}</p>
                <p className="mt-0.5 text-[13px] text-body">
                  {t.yields.risk(y.risk)} · {y.lock}
                </p>
              </div>
              <p className="text-[15px] font-semibold text-gain">{y.apy}</p>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#050b18]/35 p-4 backdrop-blur-[2px]">
          <div
            ref={boxRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="yield-pop-title"
            className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_18px_48px_rgba(11,27,58,0.18)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {t.yields.eyebrow}
                </p>
                <h3 id="yield-pop-title" className="mt-1 text-[17px] font-semibold text-ink">
                  {open.name}
                </h3>
              </div>
              <p className="text-[15px] font-semibold text-gain">{open.apy}</p>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-body">
              {t.yields.notes[open.noteKey]}
            </p>
            <button
              type="button"
              disabled={busy || ok}
              onClick={() => void activate(open)}
              className="mt-4 w-full rounded-xl bg-[#3b6ef5] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#2a54d4] disabled:opacity-45"
            >
              {busy ? t.yields.checking : t.yields.activate}
            </button>
            {message && (
              <p className={`mt-3 text-[13px] ${ok ? "text-gain" : "text-[#c2410c]"}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
