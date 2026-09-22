"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  PICK_CATEGORIES,
  TOP_PICKS,
  type PickCategory,
  type PickItem,
} from "@/lib/data";

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
  const stroke = up ? "var(--gain, #1a9d6c)" : "var(--loss, #d14343)";

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

function FullChart({ series, up }: { series: number[]; up: boolean }) {
  const W = 640;
  const H = 220;
  const pad = 16;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const pts = series.map((v, i) => {
    const x = pad + (i / (series.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (v - min) / span) * (H - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]} ${H - pad} L${pts[0][0]} ${H - pad} Z`;
  const stroke = up ? "#1a9d6c" : "#d14343";
  const fill = up ? "rgba(26,157,108,0.12)" : "rgba(209,67,67,0.10)";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Price chart"
    >
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.25" strokeLinejoin="round" />
    </svg>
  );
}

const CHAT_LOADERS = [
  "Loading BTC · 4H structure…",
  "Loading DAX · session mid…",
  "Loading Bund · duration map…",
  "Loading SAP · cloud backlog…",
  "Loading Stoxx · breadth scan…",
];

function LiveChatPanel({
  pick,
  onClose,
}: {
  pick: PickItem;
  onClose: () => void;
}) {
  const [msgs, setMsgs] = useState<
    { id: string; from: "desk" | "you"; text: string }[]
  >([
    {
      id: "1",
      from: "desk",
      text: `HKCM desk online — ask about ${pick.symbol} or request another chart.`,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [loadingCharts, setLoadingCharts] = useState(CHAT_LOADERS.slice(0, 2));

  useEffect(() => {
    let i = 2;
    const id = window.setInterval(() => {
      setLoadingCharts((prev) => {
        const next = CHAT_LOADERS[i % CHAT_LOADERS.length];
        i += 1;
        return [...prev.slice(-2), next];
      });
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMsgs((m) => [
      ...m,
      { id: String(Date.now()), from: "you", text },
      {
        id: String(Date.now() + 1),
        from: "desk",
        text: `Noted on ${pick.symbol}. Pulling related charts — other markets are loading…`,
      },
    ]);
  };

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-surface-soft/60">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
            Live chat
          </p>
          <p className="text-[13px] text-body">Desk · {pick.symbol}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[13px] font-medium text-body transition hover:text-ink"
        >
          Close
        </button>
      </div>

      <div className="max-h-48 space-y-2 overflow-y-auto px-4 py-3">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
              m.from === "you"
                ? "ml-auto bg-brand text-white"
                : "bg-surface-elevated text-ink"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--line)] px-4 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Other charts loading…
        </p>
        <ul className="mb-3 space-y-1">
          {loadingCharts.map((line) => (
            <li
              key={line}
              className="flex items-center gap-2 text-[12px] text-body"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              {line}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Ask the desk…"
            className="flex-1 rounded-xl border border-[var(--line)] bg-surface px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
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
  const [chatOpen, setChatOpen] = useState(false);
  const total = votes.up + votes.down;
  const upPct = total ? Math.round((votes.up / total) * 100) : 0;

  return (
    <div className="animate-rise">
      <button
        type="button"
        onClick={onBack}
        className="text-[13px] font-medium text-body transition hover:text-ink"
      >
        ← All picks
      </button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[1.45rem] tracking-[-0.03em] text-ink">
              {pick.symbol}
            </h3>
            <span className="rounded-md bg-surface-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {pick.kind}
            </span>
          </div>
          <p className="mt-0.5 text-[14px] text-body">{pick.name}</p>
        </div>
        <div className="text-right">
          <p className="text-[1.15rem] font-semibold text-ink">{pick.price}</p>
          <p className={`text-[14px] font-semibold ${up ? "text-gain" : "text-loss"}`}>
            {up ? "+" : ""}
            {pick.changePct.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-surface-soft/40 p-3 sm:p-4">
        <FullChart series={pick.series} up={up} />
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Why we picked it
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">{pick.why}</p>
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl border border-[var(--line)] bg-surface-elevated p-4">
        <Image
          src={pick.analyst.image}
          alt={pick.analyst.name}
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover"
        />
        <div>
          <p className="text-[14px] font-semibold text-ink">{pick.analyst.name}</p>
          <p className="text-[12px] text-muted">{pick.analyst.role}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-body">
            “{pick.analyst.note}”
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Desk votes
          </p>
          <p className="text-[13px] text-body">
            {votes.up} up · {votes.down} down · {upPct}% constructive
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-soft">
          <div
            className="h-full rounded-full bg-gain transition-all"
            style={{ width: `${upPct}%` }}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setVotes((v) => ({ ...v, up: v.up + 1 }))}
            className="rounded-full border border-[var(--line)] bg-surface-elevated px-4 py-2 text-[13px] font-semibold text-gain transition hover:bg-surface-soft"
          >
            ▲ Agree
          </button>
          <button
            type="button"
            onClick={() => setVotes((v) => ({ ...v, down: v.down + 1 }))}
            className="rounded-full border border-[var(--line)] bg-surface-elevated px-4 py-2 text-[13px] font-semibold text-loss transition hover:bg-surface-soft"
          >
            ▼ Disagree
          </button>
        </div>
      </div>

      {!chatOpen ? (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="mt-6 w-full rounded-full bg-brand px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(59,110,245,0.28)] transition hover:bg-brand-deep"
        >
          Live chat with the desk
        </button>
      ) : (
        <LiveChatPanel pick={pick} onClose={() => setChatOpen(false)} />
      )}
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
      <section className="panel animate-rise-delay-4 p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
              Top picks
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#050b18]/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="top-picks-title"
          onClick={() => {
            setOpen(false);
            setSelected(null);
          }}
        >
          <div
            className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[22px] border border-[var(--line)] bg-surface-elevated shadow-[0_28px_80px_rgba(5,12,28,0.35)] sm:rounded-[22px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  HKCM desk
                </p>
                <h2
                  id="top-picks-title"
                  className="mt-0.5 font-display text-[1.35rem] tracking-[-0.03em] text-ink"
                >
                  {selected ? selected.symbol : "Top picks"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSelected(null);
                }}
                className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[13px] font-medium text-body transition hover:text-ink"
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
                          ? "bg-ink text-white"
                          : "bg-surface-soft text-body hover:text-ink"
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
                            ? "bg-ink text-white"
                            : "bg-surface-soft text-body hover:text-ink"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  <ul className="mt-5 divide-y divide-[var(--line)]">
                    {filtered.map((pick) => {
                      const up = pick.changePct >= 0;
                      return (
                        <li key={pick.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(pick)}
                            className="flex w-full items-center gap-3 py-3.5 text-left transition hover:opacity-90"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
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
                            <Sparkline series={pick.series} up={up} width={96} height={36} />
                            <div className="w-[78px] shrink-0 text-right">
                              <p className="text-[14px] font-semibold text-ink">
                                {pick.price}
                              </p>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
