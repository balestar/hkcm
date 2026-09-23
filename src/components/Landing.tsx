"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { AboutUs } from "@/components/AboutUs";
import { SiteFooter } from "@/components/SiteFooter";
import {
  CHART_ANALYSES,
  buildSessionTimes,
  formatClock,
  formatPrice,
  type ChartAnalysis,
  type HeadlineNews,
} from "@/lib/landingContent";
import { FALLBACK_NEWS } from "@/lib/newsTypes";

function AnalysisChart({
  values,
  volumes,
  times,
  kind,
  chartId,
}: {
  values: number[];
  volumes?: number[];
  times: Date[];
  kind: ChartAnalysis["kind"];
  chartId: string;
}) {
  const chart = useMemo(() => {
    const W = 720;
    const H = 280;
    const padL = 58;
    const padR = 72;
    const padT = 18;
    const padB = 36;
    const volH = 44;
    const plotH = H - padT - padB - volH - 8;
    const plotW = W - padL - padR;

    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const span = hi - lo || 1;
    const pad = span * 0.06;
    const yMin = lo - pad;
    const yMax = hi + pad;
    const ySpan = yMax - yMin;

    const xAt = (i: number) => padL + (i / (values.length - 1)) * plotW;
    const yAt = (v: number) => padT + (1 - (v - yMin) / ySpan) * plotH;

    const pts = values.map((v, i) => [xAt(i), yAt(v)] as const);
    const line = pts
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${(padT + plotH).toFixed(1)} L${pts[0][0].toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

    const gridN = 4;
    const grid = Array.from({ length: gridN + 1 }, (_, i) => {
      const v = yMin + (ySpan * i) / gridN;
      const y = yAt(v);
      return { v, y };
    });

    const timeIdx = [0, Math.floor((values.length - 1) / 3), Math.floor(((values.length - 1) * 2) / 3), values.length - 1];
    const timeLabels = timeIdx.map((i) => ({
      x: xAt(i),
      label: times[i] ? formatClock(times[i]) : "",
    }));

    const last = values[values.length - 1];
    const lastX = xAt(values.length - 1);
    const lastY = yAt(last);

    const maxVol = Math.max(...(volumes ?? [1]), 1);
    const volBars =
      volumes?.map((vol, i) => {
        const bw = Math.max(2, plotW / values.length - 1.2);
        const h = (vol / maxVol) * (volH - 4);
        const x = xAt(i) - bw / 2;
        const y = H - padB - h;
        const up = i === 0 || values[i] >= values[i - 1];
        return { x, y, w: bw, h, up };
      }) ?? [];

    return {
      W,
      H,
      padL,
      padT,
      plotH,
      line,
      area,
      grid,
      timeLabels,
      last,
      lastX,
      lastY,
      volBars,
      yMin,
      yMax,
    };
  }, [values, volumes, times, kind]);

  const fillId = `hkcmChartFill-${chartId}`;
  const up = values[values.length - 1] >= values[0];

  return (
    <svg
      viewBox={`0 0 ${chart.W} ${chart.H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Intraday market chart"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? "#3B6EF5" : "#e11d48"} stopOpacity="0.22" />
          <stop offset="100%" stopColor={up ? "#3B6EF5" : "#e11d48"} stopOpacity="0" />
        </linearGradient>
      </defs>

      {chart.grid.map((g) => (
        <g key={g.y}>
          <line
            x1={chart.padL}
            x2={chart.W - 72}
            y1={g.y}
            y2={g.y}
            stroke="#d5dde9"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <text
            x={chart.padL - 8}
            y={g.y + 3}
            textAnchor="end"
            fill="#8494ad"
            fontSize="10"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {formatPrice(g.v, kind)}
          </text>
        </g>
      ))}

      <path d={chart.area} fill={`url(#${fillId})`} />
      <path
        d={chart.line}
        fill="none"
        stroke={up ? "#3B6EF5" : "#e11d48"}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* last price marker */}
      <line
        x1={chart.padL}
        x2={chart.W - 72}
        y1={chart.lastY}
        y2={chart.lastY}
        stroke={up ? "#3B6EF5" : "#e11d48"}
        strokeWidth="1"
        strokeDasharray="2 3"
        opacity="0.55"
      />
      <circle cx={chart.lastX} cy={chart.lastY} r="4" fill={up ? "#3B6EF5" : "#e11d48"} />
      <rect
        x={chart.W - 68}
        y={chart.lastY - 9}
        width="60"
        height="18"
        rx="4"
        fill={up ? "#3B6EF5" : "#e11d48"}
      />
      <text
        x={chart.W - 38}
        y={chart.lastY + 3.5}
        textAnchor="middle"
        fill="#fff"
        fontSize="10"
        fontWeight="600"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {formatPrice(chart.last, kind)}
      </text>

      {chart.volBars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill={b.up ? "#3B6EF5" : "#e11d48"}
          opacity="0.28"
        />
      ))}

      {chart.timeLabels.map((t) => (
        <text
          key={t.x}
          x={t.x}
          y={chart.H - 10}
          textAnchor="middle"
          fill="#8494ad"
          fontSize="10"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {t.label}
        </text>
      ))}
    </svg>
  );
}

function AnalysisCarousel({ slides }: { slides: ChartAnalysis[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [slides]);

  const chart = slides[index];
  const series = chart.values;
  const times = useMemo(
    () => buildSessionTimes(series.length, chart.intervalMin),
    [series.length, chart.intervalMin]
  );
  const last = series[series.length - 1];
  const first = series[0];
  const high = Math.max(...series);
  const low = Math.min(...series);
  const sessionChange = ((last - first) / first) * 100;
  const sessionStart = times[0];
  const sessionEnd = times[times.length - 1];

  return (
    <section className="animate-rise-delay-2 mb-8 overflow-hidden rounded-[22px] border border-[#d8e0ec] bg-[#f4f6fa] shadow-[0_20px_50px_rgba(5,12,28,0.22)]">
      <div className="border-b border-[#dde3ee] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8494ad]">
            Analysis
          </p>
          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <span
                key={s.id}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === index ? "w-5 bg-brand" : "w-1.5 bg-[#c5cfde]"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-[1.4rem] tracking-[-0.03em] text-ink">
            {chart.title}
          </h2>
          <p
            className={`text-[14px] font-semibold tabular-nums ${
              sessionChange >= 0 ? "text-gain" : "text-loss"
            }`}
          >
            {sessionChange >= 0 ? "+" : ""}
            {sessionChange.toFixed(2)}% · {formatPrice(last, chart.kind)}
          </p>
        </div>
        <p className="mt-1 text-[13px] text-[#6b7c96]">
          {chart.subtitle} · {chart.kind} · {formatClock(sessionStart)}–
          {formatClock(sessionEnd)}
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl border border-[#dde3ee] bg-white/70 px-3 py-2.5 text-[11px] tabular-nums sm:text-[12px]">
          <div>
            <p className="text-[#8494ad]">Open</p>
            <p className="mt-0.5 font-semibold text-ink">{formatPrice(first, chart.kind)}</p>
          </div>
          <div>
            <p className="text-[#8494ad]">High</p>
            <p className="mt-0.5 font-semibold text-gain">{formatPrice(high, chart.kind)}</p>
          </div>
          <div>
            <p className="text-[#8494ad]">Low</p>
            <p className="mt-0.5 font-semibold text-loss">{formatPrice(low, chart.kind)}</p>
          </div>
          <div>
            <p className="text-[#8494ad]">Last</p>
            <p className="mt-0.5 font-semibold text-ink">{formatPrice(last, chart.kind)}</p>
          </div>
        </div>
      </div>

      <div key={`${chart.id}-${index}`} className="animate-rise">
        <div className="px-2 pt-2 sm:px-4">
          <AnalysisChart
            values={series}
            volumes={chart.volumes}
            times={times}
            kind={chart.kind}
            chartId={`${chart.id}-${index}`}
          />
        </div>

        <div className="m-4 mt-1 flex gap-3.5 rounded-2xl border border-[#dce3ef] bg-white/80 px-4 py-4 sm:m-5">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-brand/15 shadow-sm">
            <Image
              src={chart.analyst.avatar}
              alt={chart.analyst.name}
              fill
              className="object-cover object-top"
              sizes="56px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold text-ink">{chart.analyst.name}</p>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-deep">
                {chart.analyst.badge}
              </span>
              <a
                href={chart.analyst.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-5 w-5 items-center overflow-hidden rounded-[4px]"
                aria-label={`${chart.analyst.name} on LinkedIn`}
              >
                <Image src="/partners/linkedin.png" alt="" width={20} height={20} />
              </a>
            </div>
            <p className="mt-0.5 text-[12px] text-[#8494ad]">{chart.analyst.role}</p>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#3d4f6a]">
              {chart.analyst.comment}
            </p>
            <p className="mt-2 text-[11px] text-[#8494ad]">
              Desk note · session {formatClock(sessionStart)}–{formatClock(sessionEnd)} CET
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Landing() {
  const { login } = useAuth();
  const [tab, setTab] = useState<"markets" | "about">("markets");
  const [headlines, setHeadlines] = useState<HeadlineNews[]>(() =>
    FALLBACK_NEWS.slice(0, 4).map((n) => ({
      id: n.id,
      tag: n.category,
      title: n.title,
      summary: n.summary,
      source: n.source,
      time: n.time,
    }))
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/news?limit=4");
        const json = (await res.json()) as {
          ok?: boolean;
          items?: {
            id: string;
            category: string;
            title: string;
            summary: string;
            source: string;
            time: string;
            url?: string;
          }[];
        };
        if (cancelled || !json.ok || !json.items?.length) return;
        setHeadlines(
          json.items.map((n) => ({
            id: n.id,
            tag: n.category,
            title: n.title,
            summary: n.summary,
            source: n.source,
            time: n.time,
          }))
        );
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (tab === "about") {
    return <AboutUs onBack={() => setTab("markets")} />;
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
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
        className="pointer-events-none absolute -right-24 top-10 h-96 w-96 rounded-full bg-brand/25 blur-3xl motion-safe:animate-[pulseSoft_4s_ease-in-out_infinite]"
      />

      <header className="relative z-10 flex items-center justify-center px-5 py-5 sm:px-10">
        <Image
          src="/logo-hkcm-light.png"
          alt="HKCM"
          width={140}
          height={36}
          className="absolute left-5 h-8 w-auto sm:left-10"
          priority
        />
        <nav className="flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.06] p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setTab("markets")}
            className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink"
          >
            Markets
          </button>
          <button
            type="button"
            onClick={() => setTab("about")}
            className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-white/75 transition hover:text-white"
          >
            About us
          </button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-20 pt-4 sm:px-10">
        <section className="animate-rise max-w-2xl pb-10 pt-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-soft">
            Markets desk
          </p>
          <h1 className="mt-3 font-display text-[2.6rem] leading-[0.95] tracking-[-0.045em] text-white sm:text-[3.6rem]">
            HKCM
          </h1>
          <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-white/65">
            Finance headlines, rotating chart analysis from the desk, and comments from the
            HKCM team — connect when you’re ready.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void login()}
              className="rounded-full bg-brand px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_rgba(59,110,245,0.35)] transition hover:bg-brand-deep"
            >
              Login with wallet
            </button>
          </div>
        </section>

        <AnalysisCarousel slides={CHART_ANALYSES} />

        <section className="animate-rise-delay-1 mb-8">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Headline news
            </p>
            <h2 className="mt-1 font-display text-[1.35rem] tracking-[-0.03em] text-white">
              Top finance stories
            </h2>
          </div>
          <ul className="divide-y divide-white/10 overflow-hidden rounded-[22px] border border-white/12 bg-white/[0.06] shadow-[0_16px_40px_rgba(5,12,28,0.25)] backdrop-blur-md">
            {headlines.map((n) => (
              <li key={n.id} className="px-5 py-4 transition hover:bg-white/[0.05] sm:px-6">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                  <span className="rounded-md bg-brand/90 px-1.5 py-0.5 text-white">{n.tag}</span>
                  <span>{n.source}</span>
                  <span>·</span>
                  <span>{n.time}</span>
                </div>
                <p className="mt-2 text-[15px] font-semibold leading-snug text-white">{n.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/55">{n.summary}</p>
              </li>
            ))}
          </ul>
        </section>

      </main>

      <div className="relative z-10">
        <SiteFooter variant="dark" />
      </div>
    </div>
  );
}
