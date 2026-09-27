"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { YIELDS, type YieldItem } from "@/lib/data";
import { instrumentById } from "@/lib/marketUniverse";
import { TradingChart } from "@/components/TradingChart";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";

type MeHolding = {
  tokens: { symbol: string; amount: number }[];
};

type ChartSnap = { price: string; changePct: number; series: number[] };

function storageKey(address: string) {
  return `hkcm-yields:${address.toLowerCase()}`;
}

function readActive(address: string | null): Set<string> {
  if (!address) return new Set();
  try {
    const raw = localStorage.getItem(storageKey(address));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeActive(address: string, ids: Set<string>) {
  localStorage.setItem(storageKey(address), JSON.stringify([...ids]));
}

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

function fmtAmount(n: number) {
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: n >= 1 ? 2 : 4,
  }).format(n);
}

function apyNumber(apy: string) {
  return Number.parseFloat(apy.replace(",", ".")) || 0;
}

export function YieldsPanel() {
  const { t } = useLanguage();
  const { address } = useAuth();
  const [open, setOpen] = useState<YieldItem | null>(null);
  const [desk, setDesk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [active, setActive] = useState<Set<string>>(new Set());
  const [balance, setBalance] = useState(0);
  const [chart, setChart] = useState<ChartSnap | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(0);
  const dragFrom = useRef(0);
  const leaveTimer = useRef<number | null>(null);

  useEffect(() => {
    setActive(readActive(address));
  }, [address]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    setMessage(null);
    setOk(false);
    setBusy(false);
    if (open && active.has(open.id)) {
      setDesk(true);
    } else {
      setDesk(false);
    }
  }, [open?.id, active]);

  useEffect(() => {
    if (!open || !desk) return;
    let cancelled = false;
    (async () => {
      const inst = instrumentById(open.chartId);
      setChart(
        inst
          ? { price: inst.fallbackPrice, changePct: inst.fallbackChange, series: inst.fallbackSeries }
          : null
      );
      try {
        const res = await fetch("/api/markets");
        const json = (await res.json()) as { ok?: boolean; items?: Array<ChartSnap & { id: string }> };
        const live = json.items?.find((p) => p.id === open.chartId);
        if (!cancelled && live?.series?.length) {
          setChart({ price: live.price, changePct: live.changePct, series: live.series });
        }
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, desk]);

  const higher = useMemo(
    () => (open?.higherId ? YIELDS.find((y) => y.id === open.higherId) ?? null : null),
    [open]
  );

  const daily = balance * (apyNumber(open?.apy ?? "0") / 100) / 365;

  const closeAll = () => {
    setOpen(null);
    setDesk(false);
    setMessage(null);
    setLeaving(false);
    setDragY(0);
    setDragging(false);
  };

  const dismiss = () => {
    if (leaving) return;
    setDragging(false);
    setLeaving(true);
    setDragY(0);
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(closeAll, 340);
  };

  useEffect(() => {
    if (!desk) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [desk]);

  const onHandleDown = (e: PointerEvent<HTMLDivElement>) => {
    if (leaving) return;
    dragStart.current = e.clientY;
    dragFrom.current = dragY;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onHandleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dy = Math.max(0, e.clientY - dragStart.current + dragFrom.current);
    setDragY(dy);
  };

  const onHandleUp = () => {
    if (!dragging) return;
    setDragging(false);
    const threshold = Math.min(160, window.innerHeight * 0.18);
    if (dragY > threshold) dismiss();
    else setDragY(0);
  };

  const persist = (next: Set<string>) => {
    setActive(next);
    if (address) writeActive(address, next);
  };

  const loadBalance = async (item: YieldItem) => {
    if (!address) return 0;
    const res = await fetch(`/api/me?address=${encodeURIComponent(address)}`);
    const json = (await res.json()) as { ok?: boolean; holdings?: MeHolding[] };
    if (!json.ok) throw new Error("check");
    const bal = tokenBalance(json.holdings ?? [], item.asset);
    setBalance(bal);
    return bal;
  };

  const activate = async (item: YieldItem) => {
    setBusy(true);
    setMessage(null);
    setOk(false);
    try {
      if (!address) {
        setMessage(t.yields.topUp);
        return;
      }
      const bal = await loadBalance(item);
      if (bal <= 0) {
        setMessage(t.yields.topUp);
        return;
      }
      const next = new Set(active);
      next.add(item.id);
      persist(next);
      setOk(true);
      setDesk(true);
    } catch {
      setMessage(t.yields.checkFailed);
    } finally {
      setBusy(false);
    }
  };

  const moveHigher = async () => {
    if (!open || !higher) return;
    setBusy(true);
    setMessage(null);
    try {
      const bal = await loadBalance(higher);
      if (bal <= 0) {
        setMessage(t.yields.topUp);
        return;
      }
      const next = new Set(active);
      next.delete(open.id);
      next.add(higher.id);
      persist(next);
      setOpen(higher);
      setDesk(true);
    } catch {
      setMessage(t.yields.checkFailed);
    } finally {
      setBusy(false);
    }
  };

  const liquidate = () => {
    if (!open) return;
    const next = new Set(active);
    next.delete(open.id);
    persist(next);
    setDesk(false);
    setOk(false);
    setMessage(t.yields.liquidated);
    window.setTimeout(dismiss, 700);
  };

  useEffect(() => {
    if (!open || !desk || !address) return;
    void loadBalance(open).catch(() => setBalance(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id, desk, address]);

  return (
    <section className="panel animate-rise-delay-2 p-5 sm:p-6">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
          {t.yields.eyebrow}
        </p>
        <h2 className="mt-2 font-display text-[1.35rem] tracking-[-0.03em] text-ink">
          {t.yields.title}
        </h2>
      </div>

      <ul className="mt-5 divide-y divide-[var(--line)]">
        {YIELDS.map((y) => {
          const on = active.has(y.id);
          return (
            <li key={y.id}>
              <button
                type="button"
                onClick={() => setOpen(y)}
                className="flex w-full items-center gap-3 py-4 text-left transition hover:opacity-85"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-ink">{y.name}</span>
                    {on && (
                      <span className="rounded-md bg-[#3b6ef5]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2a54d4]">
                        {t.yields.active}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-body">{y.lock}</span>
                </span>
                <span className="text-[15px] font-semibold tabular-nums text-gain">{y.apy}</span>
                <span className="text-[16px] text-muted/70" aria-hidden>
                  ›
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {open && !desk && (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-[#050b18]/40 p-0 sm:place-items-center sm:p-6"
          onClick={closeAll}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="yield-intro-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[22px] border border-[var(--line)] bg-white px-5 pb-6 pt-4 shadow-[0_18px_48px_rgba(11,27,58,0.16)] sm:rounded-[22px] sm:p-6"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--line)] sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {t.yields.eyebrow}
                </p>
                <h3 id="yield-intro-title" className="mt-1 font-display text-[1.25rem] text-ink">
                  {open.name}
                </h3>
                <p className="mt-1 text-[13px] text-body">{open.lock}</p>
              </div>
              <p className="text-[1.15rem] font-semibold tabular-nums text-gain">{open.apy}</p>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-body">
              {t.yields.notes[open.noteKey]}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void activate(open)}
              className="mt-5 w-full rounded-xl bg-[#3b6ef5] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#2a54d4] disabled:opacity-45"
            >
              {busy ? t.yields.checking : t.yields.activate}
            </button>
            {message && <p className="mt-3 text-[13px] text-[#c2410c]">{message}</p>}
          </div>
        </div>
      )}

      {open && desk && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-50">
          <button
            type="button"
            aria-label={t.yields.close}
            onClick={dismiss}
            className="absolute inset-0 bg-[#050b18]/35"
            style={{
              animation: leaving ? undefined : "sheetDim 0.32s ease both",
              opacity: leaving ? 0 : Math.max(0.08, 1 - dragY / 420),
              transition: dragging ? "none" : "opacity 0.28s ease",
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="yield-desk-title"
            className="absolute inset-x-0 bottom-0 top-0 flex flex-col overflow-hidden rounded-t-[22px] border border-[var(--line)] bg-white shadow-[0_-18px_48px_rgba(11,27,58,0.16)]"
            style={{
              transform: leaving
                ? "translate3d(0, 104%, 0)"
                : `translate3d(0, ${dragY}px, 0)`,
              transition: dragging ? "none" : "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)",
              animation: leaving || dragging || dragY ? undefined : "sheetUp 0.44s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div
              className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              onPointerCancel={onHandleUp}
            >
              <div className="flex justify-center pt-2.5 pb-1">
                <span className="h-1.5 w-11 rounded-full bg-[var(--line)]" />
              </div>
              <div className="flex items-center justify-between border-b border-[var(--line)] px-5 pb-3.5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {t.yields.active}
                  </p>
                  <h3 id="yield-desk-title" className="font-display text-[1.2rem] text-ink">
                    {open.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-[13px] text-body"
                >
                  {t.yields.close}
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-soft/80 px-3.5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                    {t.yields.balance}
                  </p>
                  <p className="mt-1 text-[1.15rem] font-semibold tabular-nums text-ink">
                    {fmtAmount(balance)} {open.asset}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-soft/80 px-3.5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                    {t.yields.currentYield}
                  </p>
                  <p className="mt-1 text-[1.15rem] font-semibold tabular-nums text-gain">
                    {open.apy}
                  </p>
                  <p className="mt-0.5 text-[12px] text-body">
                    {t.yields.daily} {fmtAmount(daily)} {open.asset}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                {t.yields.market}
              </p>
              <div className="mt-2 overflow-hidden rounded-2xl bg-[#070b14]">
                {chart && (
                  <TradingChart
                    series={chart.series}
                    price={chart.price}
                    up={chart.changePct >= 0}
                    symbol={open.asset}
                  />
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 pb-2">
                <button
                  type="button"
                  disabled={busy || !higher}
                  onClick={() => void moveHigher()}
                  className="rounded-2xl border border-[#3b6ef5]/25 bg-[#3b6ef5]/8 px-3.5 py-3 text-left transition hover:bg-[#3b6ef5]/14 disabled:opacity-40"
                >
                  <p className="text-[12px] font-semibold text-[#2a54d4]">{t.yields.higher}</p>
                  <p className="mt-1 text-[12px] leading-snug text-body">
                    {higher ? t.yields.higherHint(higher.name, higher.apy) : t.yields.highest}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={liquidate}
                  className="rounded-2xl border border-[#c2410c]/20 bg-[#c2410c]/6 px-3.5 py-3 text-left transition hover:bg-[#c2410c]/10"
                >
                  <p className="text-[12px] font-semibold text-[#c2410c]">{t.yields.liquidate}</p>
                  <p className="mt-1 text-[12px] leading-snug text-body">{t.yields.liquidateHint}</p>
                </button>
              </div>
              {message && (
                <p className={`pb-2 text-[13px] ${ok ? "text-gain" : "text-[#c2410c]"}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
