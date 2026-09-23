"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PICK_CATEGORIES,
  TOP_PICKS,
  type PickCategory,
  type PickItem,
} from "@/lib/data";
import { formatAgo, nextFeedDelayMs } from "@/lib/dummyFeed";
import { TradingChart } from "@/components/TradingChart";

function Sparkline({
  series,
  up,
  width = 88,
  height = 32,
}: {
  series: number[];
  up: boolean;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const pts = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * width;
      const y = height - ((v - min) / span) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = up ? "#3dd68c" : "#f87171";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}

// ─── Stream chat ──────────────────────────────────────────────────────────────

type Platform = "x" | "instagram" | "facebook";

type StreamMsg = {
  uid: string;
  handle: string;
  platform: Platform;
  text: string;
  createdAt: number;
};

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor" aria-hidden className="shrink-0 text-white/50">
      <path d="M15.75 2h-2.6L10 7.19 6.85 2H1.5l6.3 9.1L1.5 18h2.6l3.38-4.88L11.15 18h5.35l-6.47-9.34L15.75 2Z" />
    </svg>
  );
}

function IgIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className="shrink-0 text-white/50">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FbIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0 text-white/50">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.12 22 16.99 22 12Z" />
    </svg>
  );
}

function PlatformIcon({ p }: { p: Platform }) {
  if (p === "x") return <XIcon />;
  if (p === "instagram") return <IgIcon />;
  return <FbIcon />;
}

const HANDLES: { h: string; p: Platform }[] = [
  { h: "heinz_invest",       p: "x" },
  { h: "MarktAnalyse_DE",    p: "x" },
  { h: "FrankfurterBulle",   p: "x" },
  { h: "klaas.trades",       p: "instagram" },
  { h: "FinanzFuchs_HH",     p: "x" },
  { h: "DAX_Daily",          p: "x" },
  { h: "peter_r_invest",     p: "facebook" },
  { h: "EuroTrader88",       p: "x" },
  { h: "bernd.aktien",       p: "instagram" },
  { h: "SabineMarkets",      p: "x" },
  { h: "ThomW_FX",           p: "x" },
  { h: "MaxKapital",         p: "instagram" },
  { h: "JoergBoerse",        p: "facebook" },
  { h: "AnneF_Finance",      p: "x" },
  { h: "IanHarris_FX",       p: "x" },
  { h: "AlexMurray_Inv",     p: "x" },
  { h: "carlos.mercados",    p: "instagram" },
  { h: "MichaelRentner",     p: "facebook" },
  { h: "WolfgangB_Invest",   p: "facebook" },
  { h: "RudigerW_Charts",    p: "x" },
  { h: "ElkeM.Boerse",       p: "facebook" },
  { h: "UK_MarketsDesk",     p: "x" },
  { h: "BerlinTrader",       p: "instagram" },
  { h: "HamburgFX",          p: "x" },
  { h: "MunichMarkets",      p: "instagram" },
];

// Large pool: German, mixed DE/EN, English-only, emoji-only
const COMMENT_POOL: string[] = [
  // German – professional/middle-aged
  "Immer noch bullisch hier. Dips kaufen, nicht verkaufen.",
  "Charttechnisch sehr interessant gerade.",
  "Ich warte auf Bestätigung durch das Volumen.",
  "Mal sehen was die EZB morgen sagt.",
  "War günstiger, aber trotzdem noch okay bewertet.",
  "Typisches Konsolidierungsmuster vor dem nächsten Schub.",
  "Vorsicht ist angebracht, aber kein Grund zur Panik.",
  "Ich hab hier nachgekauft. Mal abwarten.",
  "Schönes Setup. Ich bleibe dabei.",
  "Wenn die 200er Linie hält, bin ich dabei.",
  "Strukturell solide. Keine Eile.",
  "Geduld zahlt sich aus. Ich warte auf einen sauberen Eintritt.",
  "Druck durch die Zinsen bleibt — trotzdem konstruktiv.",
  "Nicht in Panik verfallen. Die Lage ist beherrschbar.",
  "Volumen bestätigt die Richtung. Gut.",
  "Langsam aber sicher. Das ist Börse.",
  "Fundamentaldaten passen. Chart auch. Bleibe long.",
  "Kleine Position aufgebaut. Schauen wir mal.",
  "Interessant, aber ich warte noch auf den Wochenschluss.",
  "Die Unterstützung hält bislang gut.",
  // Mixed German / English
  "DAX sieht gut aus — staying long hier.",
  "Klassisches Breakout-Setup, nice.",
  "EZB play läuft durch. Watching closely.",
  "Technisch in Ordnung. Let's see.",
  "Starkes Signal. Not chasing though.",
  "Risk/reward passt hier. Bin dabei.",
  "Quiet tape, aber der Trend bleibt intakt.",
  "Nice setup heute. Schauen wir obs hält.",
  "Levels sind klar. Structure intact.",
  "Schöner Rücksetzer — good entry zone.",
  "Na dann, mal sehen 👀",
  "Gut! 📈 Hab schon länger darauf gewartet.",
  "Solide Sache 💪 weiter so.",
  "Augen auf heute Nachmittag — US open könnte bewegen.",
  "Volumen fehlt noch — volume needed to confirm.",
  // English – professional
  "Still constructive at these levels.",
  "Volume needs to confirm before adding more.",
  "Risk/reward looks decent here.",
  "Not chasing. Waiting for a cleaner entry.",
  "Watching the session low carefully.",
  "Quiet tape. No need to force a trade.",
  "Structure intact — keeping size light.",
  "Levels matter more than headlines here.",
  "Interesting setup. Not in yet.",
  "Prefer shallow dips over momentum entries.",
  "Orderly flow. Risk stays tight.",
  "Nothing to do here until volume steps in.",
  "Session low is the key level for me.",
  "Agree with the setup — execution is everything.",
  "Holding a small position. Will add on confirmation.",
  "Mid-session consolidation. Expected.",
  "Technically sound. Macro still a headwind.",
  // Emoji-only
  "📈🔥",
  "💪📊",
  "👀",
  "📊💯",
  "🐂",
  "⚡📈",
  "🤞",
  "👍",
  "📉 — patience",
  "🎯",
  "💎",
  "📈📈",
  "🔥🔥",
  "🤔 mal abwarten",
  "💪 dabei",
];

function randomHandle(avoid: Set<string>): { h: string; p: Platform } {
  const pool = HANDLES.filter((x) => !avoid.has(x.h));
  return (pool.length ? pool : HANDLES)[Math.floor(Math.random() * (pool.length || HANDLES.length))];
}

function makeStreamMsg(avoidHandles: string[]): StreamMsg {
  const { h, p } = randomHandle(new Set(avoidHandles));
  const now = Date.now();
  const text = COMMENT_POOL[Math.floor(Math.random() * COMMENT_POOL.length)];
  return {
    uid: `${h}-${now}-${Math.random().toString(36).slice(2, 6)}`,
    handle: h,
    platform: p,
    text,
    createdAt: now - Math.random() * 90_000,
  };
}

function LiveChatFeed({ pick }: { pick: PickItem }) {
  const [items, setItems] = useState<StreamMsg[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [draft, setDraft] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const seed: StreamMsg[] = [];
    for (let i = 0; i < 6; i++) seed.push(makeStreamMsg(seed.map((s) => s.handle)));
    setItems(seed.sort((a, b) => b.createdAt - a.createdAt));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick.id]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const schedule = () => {
      const delay = Math.min(nextFeedDelayMs() / 8, 40_000) + Math.random() * 20_000;
      timerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        setItems((prev) => {
          const t = Date.now();
          if (Math.random() < 0.2 && prev.length >= 3) {
            const i = Math.floor(Math.random() * prev.length);
            return prev
              .map((m, idx) => idx === i ? { ...m, createdAt: t - Math.random() * 15_000 } : m)
              .sort((a, b) => b.createdAt - a.createdAt);
          }
          const fresh = makeStreamMsg(prev.slice(0, 4).map((m) => m.handle));
          fresh.createdAt = t;
          return [fresh, ...prev].slice(0, 10);
        });
        setNow(Date.now());
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [pick]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setItems((prev) => [{
      uid: `you-${Date.now()}`,
      handle: "you",
      platform: "x" as Platform,
      text,
      createdAt: Date.now(),
    }, ...prev].slice(0, 11));
  };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[rgba(196,163,90,0.12)] bg-black/20">
      <div className="border-b border-[rgba(196,163,90,0.1)] px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4d0a0]/45">
          Live stream · {pick.symbol}
        </p>
      </div>

      <ul className="max-h-64 overflow-y-auto">
        {items.map((m) => (
          <li key={m.uid} className="flex items-baseline gap-2 border-b border-white/[0.06] px-4 py-2.5 last:border-0">
            <PlatformIcon p={m.platform} />
            <span className="shrink-0 text-[12px] font-semibold text-[#e4d0a0]/70">
              @{m.handle}
            </span>
            <span className="min-w-0 flex-1 text-[13px] leading-snug text-white/75">
              {m.text}
            </span>
            <span className="ml-auto shrink-0 text-[10px] tabular-nums text-white/25">
              {formatAgo(m.createdAt, now)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 border-t border-white/10 px-4 py-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder={`Comment on ${pick.symbol}…`}
          className="flex-1 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2.5 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-[rgba(196,163,90,0.4)]"
        />
        <button
          type="button"
          onClick={send}
          className="rounded-xl bg-[rgba(196,163,90,0.18)] px-4 py-2.5 text-[13px] font-semibold text-[#e4d0a0] transition hover:bg-[rgba(196,163,90,0.28)]"
        >
          Post
        </button>
      </div>
    </div>
  );
}

function PickDetail({
  pick,
  onBack,
}: {
  pick: PickItem;
  onBack: () => void;
}) {
  const up = pick.changePct >= 0;
  const [votes, setVotes] = useState(pick.votes);
  const total = votes.up + votes.down;
  const upPct = total ? Math.round((votes.up / total) * 100) : 0;
  const downPct = total ? 100 - upPct : 0;

  useEffect(() => {
    setVotes(pick.votes);
  }, [pick.id, pick.votes]);

  return (
    <div className="animate-rise">
      <button
        type="button"
        onClick={onBack}
        className="text-[13px] font-medium text-[#e4d0a0]/55 transition hover:text-[#e4d0a0]"
      >
        ← All charts
      </button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[1.45rem] tracking-[-0.03em] text-white">
              {pick.symbol}
            </h3>
            <span className="rounded-md bg-[rgba(196,163,90,0.12)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#e4d0a0]/70">
              {pick.kind}
            </span>
          </div>
          <p className="mt-0.5 text-[14px] text-white/45">{pick.name}</p>
        </div>
        <div className="text-right">
          <p className="text-[1.15rem] font-semibold text-white">{pick.price}</p>
          <p className={`text-[14px] font-semibold ${up ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
            {up ? "+" : ""}
            {pick.changePct.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-5">
        <TradingChart
          series={pick.series}
          price={pick.price}
          up={up}
          symbol={pick.symbol}
        />
      </div>

      <div className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4d0a0]/45">
          Why it matters
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-white/80">{pick.why}</p>
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl border border-[rgba(196,163,90,0.12)] bg-black/25 p-4">
        <Image
          src={pick.analyst.image}
          alt={pick.analyst.name}
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover ring-1 ring-[rgba(196,163,90,0.25)]"
        />
        <div>
          <p className="text-[14px] font-semibold text-white">{pick.analyst.name}</p>
          <p className="text-[12px] text-white/40">{pick.analyst.role}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-white/65">
            “{pick.analyst.note}”
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4d0a0]/45">
            Chart votes
          </p>
          <p className="text-[12px] text-white/40">
            {total.toLocaleString("de-DE")} votes
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setVotes((v) => ({ ...v, up: v.up + 1 }))}
            className="rounded-2xl border border-[#26a69a]/25 bg-[#26a69a]/10 px-4 py-3.5 text-left transition hover:border-[#26a69a]/45 hover:bg-[#26a69a]/16"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#26a69a]">
              Bullish
            </p>
            <p className="mt-1 text-[1.35rem] font-semibold tabular-nums text-white">
              {upPct}%
            </p>
            <p className="mt-0.5 text-[12px] text-white/45">
              {votes.up.toLocaleString("de-DE")} agree
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#26a69a] transition-all"
                style={{ width: `${upPct}%` }}
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setVotes((v) => ({ ...v, down: v.down + 1 }))}
            className="rounded-2xl border border-[#ef5350]/25 bg-[#ef5350]/10 px-4 py-3.5 text-left transition hover:border-[#ef5350]/45 hover:bg-[#ef5350]/16"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#ef5350]">
              Bearish
            </p>
            <p className="mt-1 text-[1.35rem] font-semibold tabular-nums text-white">
              {downPct}%
            </p>
            <p className="mt-0.5 text-[12px] text-white/45">
              {votes.down.toLocaleString("de-DE")} disagree
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#ef5350] transition-all"
                style={{ width: `${downPct}%` }}
              />
            </div>
          </button>
        </div>
      </div>

      <LiveChatFeed pick={pick} />
    </div>
  );
}

export function TopPicksPanel() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<PickCategory | "All">("All");
  const [selected, setSelected] = useState<PickItem | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const filtered = useMemo(
    () =>
      category === "All"
        ? TOP_PICKS
        : TOP_PICKS.filter((p) => p.kind === category),
    [category]
  );

  const preview = TOP_PICKS.slice(0, 4);

  return (
    <>
      <section className="panel animate-rise-delay-3 p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
              Charts
            </p>
            <h2 className="mt-2 font-display text-[1.35rem] tracking-[-0.03em] text-ink">
              Crypto, stocks, bonds &amp; more
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
            className="shrink-0 rounded-full border border-[var(--line)] bg-surface-elevated px-3.5 py-1.5 text-[13px] font-semibold text-ink transition hover:opacity-80"
          >
            View all
          </button>
        </div>

        <ul className="mt-5 divide-y divide-[var(--line)]">
          {preview.map((pick) => {
            const up = pick.changePct >= 0;
            return (
              <li key={pick.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(pick);
                    setOpen(true);
                  }}
                  className="flex w-full items-center gap-3 py-3.5 text-left transition first:pt-0 hover:opacity-90"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-ink">
                        {pick.symbol}
                      </span>
                      <span className="rounded-md bg-surface-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {pick.kind}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-body">
                      {pick.name}
                    </p>
                  </div>
                  <Sparkline series={pick.series} up={up} />
                  <div className="w-[72px] shrink-0 text-right">
                    <p className="text-[13px] font-semibold text-ink">{pick.price}</p>
                    <p
                      className={`text-[12px] font-semibold ${up ? "text-gain" : "text-loss"}`}
                    >
                      {up ? "+" : ""}
                      {pick.changePct.toFixed(1)}%
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#050b18]/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="charts-title"
          onClick={() => {
            setOpen(false);
            setSelected(null);
          }}
        >
          <div
            className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[22px] border border-[rgba(196,163,90,0.14)] text-white shadow-[0_28px_80px_rgba(0,0,0,0.65)] sm:rounded-[22px]"
            style={{
              background:
                "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(196,163,90,0.11), transparent 55%), radial-gradient(ellipse 70% 40% at 100% 80%, rgba(196,163,90,0.05), transparent 50%), #05070e",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[rgba(196,163,90,0.1)] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e4d0a0]/45">
                  Charts
                </p>
                <h2
                  id="charts-title"
                  className="mt-0.5 font-display text-[1.35rem] tracking-[-0.03em] text-white"
                >
                  {selected ? selected.symbol : "Charts"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSelected(null);
                }}
                className="rounded-full border border-[rgba(196,163,90,0.18)] px-3 py-1.5 text-[13px] font-medium text-white/60 transition hover:border-[rgba(196,163,90,0.35)] hover:text-[#e4d0a0]"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {selected ? (
                <PickDetail
                  pick={selected}
                  onBack={() => setSelected(null)}
                />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCategory("All")}
                      className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                        category === "All"
                          ? "bg-white text-[#0b1b3a]"
                          : "bg-white/10 text-white/70 hover:text-white"
                      }`}
                    >
                      All
                    </button>
                    {PICK_CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                          category === c
                            ? "bg-white text-[#0b1b3a]"
                            : "bg-white/10 text-white/70 hover:text-white"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  <ul className="mt-5 space-y-3.5 pb-1">
                    {filtered.map((pick) => {
                      const up = pick.changePct >= 0;
                      return (
                        <li key={pick.id} className="rounded-2xl">
                          <button
                            type="button"
                            onClick={() => setSelected(pick)}
                            className="flex w-full items-center gap-3 rounded-2xl border border-[rgba(196,163,90,0.12)] bg-[#0c121f] px-4 py-3.5 text-left shadow-[0_4px_6px_rgba(0,0,0,0.35),0_14px_36px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(196,163,90,0.08)] transition hover:-translate-y-0.5 hover:border-[rgba(196,163,90,0.28)] hover:bg-[#101828] hover:shadow-[0_6px_12px_rgba(0,0,0,0.4),0_20px_44px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(196,163,90,0.14)] active:translate-y-0 active:scale-[0.99]"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[15px] font-semibold text-white">
                                  {pick.symbol}
                                </span>
                                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
                                  {pick.kind}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-[13px] text-white/50">
                                {pick.name}
                              </p>
                            </div>
                            <Sparkline series={pick.series} up={up} width={96} height={36} />
                            <div className="w-[78px] shrink-0 text-right">
                              <p className="text-[14px] font-semibold text-white">
                                {pick.price}
                              </p>
                              <p
                                className={`text-[12px] font-semibold ${up ? "text-[#3dd68c]" : "text-[#f87171]"}`}
                              >
                                {up ? "+" : ""}
                                {pick.changePct.toFixed(1)}%
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
