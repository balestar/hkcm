"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PICK_CATEGORIES,
  TOP_PICKS,
  type PickCategory,
  type PickItem,
} from "@/lib/data";
import {
  DUMMY_PROFILES,
  formatAgo,
  nextFeedDelayMs,
} from "@/lib/dummyFeed";
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

type ChatUser = {
  id: string;
  name: string;
  avatar: string;
  /** Prestige badge tier — only some users have one. */
  badge: 2 | 3 | 4 | 5 | null;
};

type ChatMsg = {
  uid: string;
  user: ChatUser;
  text: string;
  createdAt: number;
};

const PROFILE_POOL = DUMMY_PROFILES.filter(
  (p) =>
    p.platform === "linkedin" &&
    p.avatar.startsWith("/profiles/li/") &&
    !p.name.includes(".eth")
);

function randomBadge(): 2 | 3 | 4 | 5 | null {
  const roll = Math.random();
  if (roll < 0.55) return null;
  if (roll < 0.7) return 2;
  if (roll < 0.84) return 3;
  if (roll < 0.94) return 4;
  return 5;
}

function pickUser(avoidIds: Set<string>): ChatUser {
  const pool = PROFILE_POOL.filter((p) => !avoidIds.has(p.id));
  const list = pool.length ? pool : PROFILE_POOL;
  const p = list[Math.floor(Math.random() * list.length)];
  return {
    id: p.id,
    name: p.name.split(" ")[0] || p.name,
    avatar: p.avatar,
    badge: randomBadge(),
  };
}

function commentForPick(pick: PickItem): string {
  const dir = pick.changePct >= 0 ? "bid" : "soft";
  const pct = `${pick.changePct >= 0 ? "+" : ""}${pick.changePct.toFixed(1)}%`;
  const templates: string[] = [
    `${pick.symbol} still constructive on the ${pick.kind.toLowerCase()} desk.`,
    `Watching ${pick.name} — ${pct} on the session, not chasing.`,
    `${pick.symbol}: prefer dips over FOMO into the US open.`,
    `Desk lean on ${pick.symbol} stays ${dir === "bid" ? "long-biased" : "cautious"}.`,
    `${pick.why.split(".")[0]}.`,
    `${pick.name} structure intact — size light until confirmation.`,
    `Anyone else seeing ${pick.symbol} reclaim the mid?`,
    `${pick.symbol} flow looks orderly. Keeping risk tight.`,
    `On ${pick.name}: ${pick.analyst.note.split(".")[0]}.`,
    `${pick.kind} sleeve — ${pick.symbol} is the cleaner name today.`,
    `Just marked ${pick.symbol} on my watchlist. Levels matter more than headlines.`,
    `${pick.symbol} ${pct} — if we lose the open low I step aside.`,
    `Quiet tape in ${pick.name}. No need to force it.`,
    `${pick.symbol}: volume needs to confirm the next push.`,
    `Agree with the desk note on ${pick.symbol} — shallow dips preferred.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function makeMsg(pick: PickItem, avoidIds: string[]): ChatMsg {
  const user = pickUser(new Set(avoidIds));
  const now = Date.now();
  const age = Math.random() * 90_000;
  return {
    uid: `${user.id}-${now}-${Math.random().toString(36).slice(2, 7)}`,
    user,
    text: commentForPick(pick),
    createdAt: now - age,
  };
}

function LiveChatFeed({ pick }: { pick: PickItem }) {
  const [items, setItems] = useState<ChatMsg[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [draft, setDraft] = useState("");
  const timerRef = useRef<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Reset feed when the selected pick changes
  useEffect(() => {
    const seed: ChatMsg[] = [];
    for (let i = 0; i < 5; i++) {
      seed.push(makeMsg(pick, seed.map((s) => s.user.id)));
    }
    setItems(seed.sort((a, b) => b.createdAt - a.createdAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset on pick identity
  }, [pick.id]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const schedule = () => {
      const delay = Math.min(nextFeedDelayMs() / 8, 45_000) + Math.random() * 25_000;
      timerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        setItems((prev) => {
          const t = Date.now();
          // ~25%: nudge an existing timestamp only (feels alive without spam)
          if (Math.random() < 0.25 && prev.length >= 3) {
            const i = Math.floor(Math.random() * prev.length);
            return prev
              .map((m, idx) =>
                idx === i ? { ...m, createdAt: t - Math.random() * 20_000 } : m
              )
              .sort((a, b) => b.createdAt - a.createdAt);
          }
          const fresh = makeMsg(
            pick,
            prev.slice(0, 4).map((m) => m.user.id)
          );
          fresh.createdAt = t;
          return [fresh, ...prev].slice(0, 8);
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
    setItems((prev) => [
      {
        uid: `you-${Date.now()}`,
        user: { id: "you", name: "You", avatar: "", badge: null },
        text,
        createdAt: Date.now(),
      },
      ...prev,
    ].slice(0, 10));
  };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[rgba(196,163,90,0.12)] bg-black/20">
      <div className="border-b border-[rgba(196,163,90,0.1)] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4d0a0]/45">
          Live chat
        </p>
        <p className="mt-0.5 text-[13px] text-white/55">
          Conversation on {pick.symbol}
        </p>
      </div>

      <ul ref={listRef} className="max-h-64 space-y-0 overflow-y-auto">
        {items.map((m) => (
          <li
            key={m.uid}
            className="flex gap-3 border-b border-white/8 px-4 py-3 last:border-0"
          >
            <div className="relative h-9 w-9 shrink-0">
              {m.user.avatar ? (
                <Image
                  src={m.user.avatar}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover ring-1 ring-white/15"
                />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand/80 text-[12px] font-semibold text-white">
                  Y
                </div>
              )}
              {m.user.badge != null && (
                <span className="absolute -bottom-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white ring-2 ring-[#0b1b3a]">
                  {m.user.badge}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[13px] font-semibold text-white">
                  {m.user.name}
                </span>
                <span className="text-[11px] text-white/35">
                  {formatAgo(m.createdAt, now)}
                </span>
              </div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-white/70">
                {m.text}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 border-t border-white/10 px-4 py-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder={`Comment on ${pick.symbol}…`}
          className="flex-1 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2.5 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-brand/50"
        />
        <button
          type="button"
          onClick={send}
          className="rounded-xl bg-brand px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-deep"
        >
          Send
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
