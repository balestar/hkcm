"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import {
  HEADLINE_NEWS,
  CHART_ANALYSES,
  LIVE_COMMENTS,
  type ChartAnalysis,
  type CommentPlatform,
  type LiveComment,
} from "@/lib/landingContent";

function AnalysisChart({
  values,
  chartId,
}: {
  values: number[];
  chartId: string;
}) {
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
    const line = pts
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
    const areaPath = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`;
    return { path: line, area: areaPath, min: lo, max: hi };
  }, [values]);

  const fillId = `hkcmChartFill-${chartId}`;

  return (
    <svg viewBox="0 0 640 220" className="h-auto w-full" role="img" aria-label="Market analysis chart">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B6EF5" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3B6EF5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${fillId})`} />
      <path
        d={path}
        fill="none"
        stroke="#3B6EF5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="16" y="24" fill="#8494ad" fontSize="11" fontFamily="system-ui">
        {max > 100 ? max.toFixed(0) : max.toFixed(4)}
      </text>
      <text x="16" y="208" fill="#8494ad" fontSize="11" fontFamily="system-ui">
        {min > 100 ? min.toFixed(0) : min.toFixed(4)}
      </text>
    </svg>
  );
}

function PlatformIcon({ platform }: { platform: CommentPlatform }) {
  if (platform === "reddit") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FF4500] text-[11px] font-black italic leading-none text-white"
        title="Reddit"
        aria-label="Reddit"
      >
        r
      </span>
    );
  }
  if (platform === "twitter") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0f1419] text-white"
        title="X / Twitter"
        aria-label="X"
      >
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.727-8.828L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </span>
    );
  }
  if (platform === "lh") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[9px] font-bold tracking-tight text-white"
        title="Lena Hoffmann"
        aria-label="Lena Hoffmann"
      >
        LH
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[8px] font-bold tracking-tight text-white"
      title="HKCM"
      aria-label="HKCM"
    >
      H
    </span>
  );
}

function LiveCommentsFeed({ seed }: { seed: LiveComment[] }) {
  const [items, setItems] = useState(seed);

  useEffect(() => {
    let i = 0;
    const extras: LiveComment[] = [
      {
        id: `live-a`,
        name: "u/TapeWatcher",
        handle: "r/Daytrading",
        initials: "TW",
        tone: "bull",
        platform: "reddit",
        text: "Breakout holds above the session VWAP — watching volume confirm.",
        ago: "just now",
      },
      {
        id: `live-b`,
        name: "Omar S.",
        handle: "@omarflows",
        initials: "OS",
        tone: "neutral",
        platform: "twitter",
        text: "ECB speakers later — keep size light into the headline risk.",
        ago: "just now",
      },
      {
        id: `live-c`,
        name: "Greta M.",
        handle: "@greta",
        initials: "GM",
        tone: "bear",
        platform: "hkcm",
        text: "Still fade strength into resistance until the 20d reclaim sticks.",
        ago: "just now",
      },
      {
        id: `live-d`,
        name: "Lena Hoffmann",
        handle: "@lena_hkcm",
        initials: "LH",
        tone: "bull",
        platform: "lh",
        text: "Philip’s DAX read aligns with desk flow — exporters still bid.",
        ago: "just now",
      },
    ];

    const id = window.setInterval(() => {
      const next = extras[i % extras.length];
      i += 1;
      setItems((prev) =>
        [
          {
            ...next,
            id: `${next.id}-${i}`,
            ago: "just now",
          },
          ...prev.map((c, idx) =>
            idx === 0 && c.ago === "just now" ? { ...c, ago: "1m" } : c
          ),
        ].slice(0, 8)
      );
    }, 5200);

    return () => window.clearInterval(id);
  }, []);

  return (
    <ul className="space-y-3">
      {items.map((c, idx) => (
        <li
          key={c.id}
          className={`flex gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 shadow-[0_8px_24px_rgba(5,12,28,0.18)] backdrop-blur-sm ${
            idx === 0 ? "animate-rise" : ""
          }`}
        >
          <div className="relative shrink-0">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand/40 to-ink/80 text-[12px] font-bold text-white ring-1 ring-white/15">
              {c.initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5">
              <PlatformIcon platform={c.platform} />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[14px] font-semibold text-white">{c.name}</span>
              <span className="text-[12px] text-white/40">{c.handle}</span>
              <span className="text-[12px] text-white/30">· {c.ago}</span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-white/72">{c.text}</p>
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

function AnalysisCarousel({ slides }: { slides: ChartAnalysis[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  const chart = slides[index];

  return (
    <section
      className="animate-rise-delay-2 mb-8 overflow-hidden rounded-[22px] border border-[#d8e0ec] bg-[#f4f6fa] shadow-[0_20px_50px_rgba(5,12,28,0.22)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#dde3ee] px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8494ad]">
            Analysis
          </p>
          <p className="mt-0.5 text-[12px] text-[#6b7c96]">
            {index + 1} / {slides.length} · {chart.kind}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous analysis"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="grid h-8 w-8 place-items-center rounded-full border border-[#d0d8e6] bg-white/80 text-ink transition hover:border-brand hover:text-brand"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4L6 10l6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next analysis"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="grid h-8 w-8 place-items-center rounded-full border border-[#d0d8e6] bg-white/80 text-ink transition hover:border-brand hover:text-brand"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div key={chart.id} className="animate-rise">
        <div className="px-5 pt-4 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-[1.35rem] tracking-[-0.03em] text-ink">
              {chart.title}
            </h2>
            <p
              className={`text-[14px] font-semibold ${
                chart.changePct >= 0 ? "text-gain" : "text-loss"
              }`}
            >
              {chart.changePct >= 0 ? "+" : ""}
              {chart.changePct.toFixed(2)}% · {chart.price}
            </p>
          </div>
          <p className="mt-1 text-[13px] text-[#6b7c96]">{chart.subtitle}</p>
        </div>

        <div className="px-2 pt-2 sm:px-4">
          <AnalysisChart values={chart.values} chartId={chart.id} />
        </div>

        <div className="m-4 mt-1 flex gap-3 rounded-2xl border border-[#dce3ef] bg-white/70 px-4 py-3.5 sm:m-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-brand-deep text-[13px] font-bold text-white ring-2 ring-brand/20">
            {chart.analyst.initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[14px] font-semibold text-ink">{chart.analyst.name}</p>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-deep">
                {chart.analyst.badge}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-[#8494ad]">{chart.analyst.role}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#3d4f6a]">
              {chart.analyst.comment}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pb-4">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Show ${s.asset} analysis`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-brand" : "w-1.5 bg-[#c5cfde] hover:bg-brand/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

export function Landing() {
  const { login } = useAuth();

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Layered professional atmosphere — not flat blue */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 12% -5%, rgba(99, 140, 255, 0.38), transparent 55%),
            radial-gradient(ellipse 70% 50% at 92% 8%, rgba(56, 189, 248, 0.14), transparent 50%),
            radial-gradient(ellipse 60% 45% at 70% 85%, rgba(37, 99, 235, 0.22), transparent 55%),
            linear-gradient(165deg, #050b18 0%, #0a162e 28%, #0f2148 55%, #0c1a38 78%, #06101f 100%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl motion-safe:animate-[pulseSoft_5s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 h-96 w-96 rounded-full bg-brand/25 blur-3xl motion-safe:animate-[pulseSoft_4s_ease-in-out_infinite]"
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
          className="rounded-full bg-white/95 px-5 py-2.5 text-[14px] font-semibold text-ink shadow-sm transition hover:bg-brand hover:text-white"
        >
          Connect wallet
        </button>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20 pt-4 sm:px-10">
        <section className="animate-rise max-w-2xl pb-10 pt-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-soft">
            Markets desk
          </p>
          <h1 className="mt-3 font-display text-[2.6rem] leading-[0.95] tracking-[-0.045em] text-white sm:text-[3.6rem]">
            HKCM
          </h1>
          <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-white/65">
            Top finance headlines, sliding chart analysis, and a live multi-platform
            feed — then connect when you’re ready.
          </p>
          <button
            type="button"
            onClick={() => void login()}
            className="mt-7 rounded-full bg-brand px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_rgba(59,110,245,0.35)] transition hover:bg-brand-deep"
          >
            Connect wallet
          </button>
        </section>

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
          <ul className="divide-y divide-white/10 overflow-hidden rounded-[22px] border border-white/12 bg-white/[0.06] shadow-[0_16px_40px_rgba(5,12,28,0.25)] backdrop-blur-md">
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

        <AnalysisCarousel slides={CHART_ANALYSES} />

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
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[12px] font-medium text-white/70 backdrop-blur-sm">
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
