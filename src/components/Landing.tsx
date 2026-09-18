"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import {
  HEADLINE_NEWS,
  CHART_ANALYSIS,
  LIVE_COMMENTS,
  type LiveComment,
} from "@/lib/landingContent";

function AnalysisChart({ values }: { values: number[] }) {
  const { path, area, min, max } = useMemo(() => {
    const w = 640;
    const h = 220;
    const padX = 8;
    const padY = 16;
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const span = hi - lo || 1;
    const pts = values.map((v, i) => {
      const x = padX + (i / (values.length - 1)) * (w - padX * 2);
      const y = h - padY - ((v - lo) / span) * (h - padY * 2);
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const areaPath = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`;
    return { path: line, area: areaPath, min: lo, max: hi };
  }, [values]);

  return (
    <svg viewBox="0 0 640 220" className="h-auto w-full" role="img" aria-label="Market analysis chart">
      <defs>
        <linearGradient id="hkcmChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B6EF5" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3B6EF5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#hkcmChartFill)" />
      <path d={path} fill="none" stroke="#6B8FF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="16" y="24" fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="system-ui">
        {max.toFixed(0)}
      </text>
      <text x="16" y="208" fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="system-ui">
        {min.toFixed(0)}
      </text>
    </svg>
  );
}

function LiveCommentsFeed({ seed }: { seed: LiveComment[] }) {
  const [items, setItems] = useState(seed);

  useEffect(() => {
    let i = 0;
    const extras: LiveComment[] = [
      {
        id: `live-${Date.now()}-a`,
        name: "Nora K.",
        handle: "@nora_eu",
        initials: "NK",
        tone: "bull",
        text: "Breakout holds above the session VWAP — watching volume confirm.",
        ago: "just now",
      },
      {
        id: `live-${Date.now()}-b`,
        name: "Omar S.",
        handle: "@omarflows",
        initials: "OS",
        tone: "neutral",
        text: "ECB speakers later — keep size light into the headline risk.",
        ago: "just now",
      },
      {
        id: `live-${Date.now()}-c`,
        name: "Greta M.",
        handle: "@gretamacro",
        initials: "GM",
        tone: "bear",
        text: "Still fade strength into resistance until the 20d reclaim sticks.",
        ago: "just now",
      },
    ];

    const id = window.setInterval(() => {
      const next = extras[i % extras.length];
      i += 1;
      setItems((prev) => [
        {
          ...next,
          id: `${next.id}-${i}`,
          ago: "just now",
        },
        ...prev.map((c, idx) =>
          idx === 0 && c.ago === "just now" ? { ...c, ago: "1m" } : c
        ),
      ].slice(0, 8));
    }, 5200);

    return () => window.clearInterval(id);
  }, []);

  return (
    <ul className="space-y-3">
      {items.map((c, idx) => (
        <li
          key={c.id}
          className={`flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 ${
            idx === 0 ? "animate-rise" : ""
          }`}
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/25 text-[12px] font-bold text-white">
            {c.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[14px] font-semibold text-white">{c.name}</span>
              <span className="text-[12px] text-white/40">{c.handle}</span>
              <span className="text-[12px] text-white/30">· {c.ago}</span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-white/75">{c.text}</p>
          </div>
          <span
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
              c.tone === "bull"
                ? "bg-gain"
                : c.tone === "bear"
                  ? "bg-loss"
                  : "bg-white/35"
            }`}
          />
        </li>
      ))}
    </ul>
  );
}

export function Landing() {
  const { login } = useAuth();
  const chart = CHART_ANALYSIS;

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_8%,rgba(59,110,245,0.26),transparent_48%),linear-gradient(165deg,#07122b_0%,#0d1f45_42%,#102a5c_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-16 h-80 w-80 rounded-full bg-brand/20 blur-3xl motion-safe:animate-[pulseSoft_4s_ease-in-out_infinite]"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Image
          src="/logo-hkcm-light.png"
          alt="HKCM"
          width={140}
          height={36}
          className="h-8 w-auto"
          priority
        />
        <button
          type="button"
          onClick={() => void login()}
          className="rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-ink transition hover:bg-brand hover:text-white"
        >
          Connect wallet
        </button>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20 pt-4 sm:px-10">
        {/* Hero — brand only, no USDC copy */}
        <section className="animate-rise max-w-2xl pb-10 pt-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-soft">
            Markets desk
          </p>
          <h1 className="mt-3 font-display text-[2.6rem] leading-[0.95] tracking-[-0.045em] text-white sm:text-[3.6rem]">
            HKCM
          </h1>
          <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-white/65">
            Top finance headlines, one clear chart read, and a live desk feed —
            then connect when you’re ready.
          </p>
          <button
            type="button"
            onClick={() => void login()}
            className="mt-7 rounded-full bg-brand px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-brand-deep"
          >
            Connect wallet
          </button>
        </section>

        {/* Headline news */}
        <section className="animate-rise-delay-1 mb-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Headline news
              </p>
              <h2 className="mt-1 font-display text-[1.35rem] tracking-[-0.03em] text-white">
                Top finance stories
              </h2>
            </div>
          </div>
          <ul className="divide-y divide-white/10 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04]">
            {HEADLINE_NEWS.map((n) => (
              <li key={n.id} className="px-5 py-4 transition hover:bg-white/[0.05] sm:px-6">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                  <span className="rounded-md bg-brand/90 px-1.5 py-0.5 text-white">
                    {n.tag}
                  </span>
                  <span>{n.source}</span>
                  <span>·</span>
                  <span>{n.time}</span>
                </div>
                <p className="mt-2 text-[15px] font-semibold leading-snug text-white">
                  {n.title}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                  {n.summary}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Chart analysis */}
        <section className="animate-rise-delay-2 mb-8 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04]">
          <div className="border-b border-white/10 px-5 py-4 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Analysis
            </p>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[1.35rem] tracking-[-0.03em] text-white">
                {chart.title}
              </h2>
              <p className={`text-[14px] font-semibold ${chart.changePct >= 0 ? "text-gain" : "text-loss"}`}>
                {chart.changePct >= 0 ? "+" : ""}
                {chart.changePct.toFixed(2)}% · {chart.price}
              </p>
            </div>
            <p className="mt-1 text-[13px] text-white/50">{chart.subtitle}</p>
          </div>

          <div className="px-2 pt-2 sm:px-4">
            <AnalysisChart values={chart.values} />
          </div>

          {/* Profile badge + comment about the chart */}
          <div className="m-4 mt-1 flex gap-3 rounded-2xl border border-white/10 bg-[#0b1b3a]/45 px-4 py-3.5 sm:m-5">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-brand/30 ring-2 ring-brand/40">
              <div className="grid h-full w-full place-items-center text-[13px] font-bold text-white">
                {chart.analyst.initials}
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-semibold text-white">
                  {chart.analyst.name}
                </p>
                <span className="rounded-full bg-brand/20 px-2 py-0.5 text-[11px] font-medium text-brand-soft">
                  {chart.analyst.badge}
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-white/40">{chart.analyst.role}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/75">
                {chart.analyst.comment}
              </p>
            </div>
          </div>
        </section>

        {/* Live comments */}
        <section className="animate-rise-delay-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Live feed
              </p>
              <h2 className="mt-1 font-display text-[1.35rem] tracking-[-0.03em] text-white">
                Desk comments
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[12px] font-medium text-white/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain" />
              Live
            </span>
          </div>
          <LiveCommentsFeed seed={LIVE_COMMENTS} />
        </section>
      </main>
    </div>
  );
}
