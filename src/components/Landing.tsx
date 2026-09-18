"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { AboutUs } from "@/components/AboutUs";
import { PrivyDomainBanner } from "@/components/PrivyDomainBanner";
import {
  HEADLINE_NEWS,
  CHART_ANALYSES,
  randomizeSeries,
  type ChartAnalysis,
} from "@/lib/landingContent";
import { randomDeskComment, type DummyPlatform } from "@/lib/dummyFeed";
import {
  TeamMemberModal,
  type ModalPerson,
} from "@/components/TeamMemberModal";

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
          <stop offset="0%" stopColor="#3B6EF5" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3B6EF5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${fillId})`} />
      <path
        d={path}
        fill="none"
        stroke="#3B6EF5"
        strokeWidth="2.4"
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

function PlatformBadge({
  platform,
  linkedin,
}: {
  platform: DummyPlatform;
  linkedin?: string;
}) {
  if (platform === "linkedin") {
    const href = linkedin || "https://www.linkedin.com/company/hkcm";
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-[4px]"
        title="LinkedIn"
        aria-label="LinkedIn"
      >
        <Image src="/partners/linkedin.png" alt="" width={20} height={20} className="h-5 w-5" />
      </a>
    );
  }
  if (platform === "nft") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-[8px] font-black text-white"
        title="NFT profile"
        aria-label="NFT"
      >
        NFT
      </span>
    );
  }
  if (platform === "twitter") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0f1419] text-white"
        title="X"
        aria-label="X"
      >
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.727-8.828L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </span>
    );
  }
  if (platform === "reddit") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FF4500] text-[11px] font-black italic leading-none text-white"
        title="Reddit"
      >
        r
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[8px] font-bold text-white">
      H
    </span>
  );
}

function DeskCommentsFeed() {
  const [items, setItems] = useState(() =>
    Array.from({ length: 7 }, (_, i) => {
      const c = randomDeskComment(i * 97 + 3);
      return { ...c, uid: `s-${i}`, ago: `${i + 1}m` };
    })
  );
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = randomDeskComment();
      setItems((prev) =>
        [
          { ...next, uid: `${next.id}-${Date.now()}`, ago: "just now" },
          ...prev.map((c, idx) =>
            idx === 0 && c.ago === "just now" ? { ...c, ago: "1m" } : c
          ),
        ].slice(0, 8)
      );
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  const modalPeople: ModalPerson[] = items.map((c) => ({
    id: c.uid,
    name: c.name,
    role: c.handle,
    image: c.avatar,
    linkedin: c.linkedin || "https://www.linkedin.com/company/hkcm",
    quote: c.text,
  }));

  return (
    <>
      <ul className="space-y-3">
        {items.map((c, idx) => (
          <li key={c.uid}>
            <button
              type="button"
              onClick={() => setModalIndex(idx)}
              className={`flex w-full gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5 text-left shadow-[0_8px_24px_rgba(5,12,28,0.18)] backdrop-blur-sm transition hover:bg-white/[0.09] ${
                idx === 0 ? "animate-rise" : ""
              }`}
            >
              <div className="relative shrink-0">
                <div className="relative h-11 w-11 overflow-hidden rounded-full ring-1 ring-white/15">
                  <Image
                    src={c.avatar}
                    alt=""
                    fill
                    className="object-cover object-top"
                    sizes="44px"
                  />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5">
                  <PlatformBadge platform={c.platform} linkedin={c.linkedin} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-[14px] font-semibold text-white">{c.name}</span>
                  <span className="text-[12px] text-white/40">{c.handle}</span>
                  <span className="text-[12px] text-white/30">· {c.ago}</span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/72">{c.text}</p>
              </div>
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  c.tone === "bull" ? "bg-gain" : c.tone === "bear" ? "bg-loss" : "bg-white/35"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>

      {modalIndex != null && (
        <TeamMemberModal
          people={modalPeople}
          index={modalIndex}
          onClose={() => setModalIndex(null)}
          onChange={setModalIndex}
          variant="avatar"
        />
      )}
    </>
  );
}

function AnalysisCarousel({ slides }: { slides: ChartAnalysis[] }) {
  const [index, setIndex] = useState(0);
  const [series, setSeries] = useState(() => randomizeSeries(slides[0].values));

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % slides.length;
        setSeries(randomizeSeries(slides[next].values));
        return next;
      });
    }, 7000);
    return () => window.clearInterval(id);
  }, [slides]);

  // Subtle live tick on current chart
  useEffect(() => {
    const id = window.setInterval(() => {
      setSeries((prev) => randomizeSeries(prev, 0.0018));
    }, 2200);
    return () => window.clearInterval(id);
  }, [index]);

  const chart = slides[index];
  const last = series[series.length - 1];
  const first = series[0];
  const liveChange = ((last - first) / first) * 100;

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
              liveChange >= 0 ? "text-gain" : "text-loss"
            }`}
          >
            {liveChange >= 0 ? "+" : ""}
            {liveChange.toFixed(2)}% · {chart.price}
          </p>
        </div>
        <p className="mt-1 text-[13px] text-[#6b7c96]">
          {chart.subtitle} · {chart.kind}
        </p>
      </div>

      <div key={`${chart.id}-${index}`} className="animate-rise">
        <div className="px-2 pt-2 sm:px-4">
          <AnalysisChart values={series} chartId={`${chart.id}-${index}`} />
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
          </div>
        </div>
      </div>    </section>
  );
}

export function Landing() {
  const { login } = useAuth();
  const [tab, setTab] = useState<"markets" | "about">("markets");

  if (tab === "about") {
    return <AboutUs onBack={() => setTab("markets")} />;
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <PrivyDomainBanner />
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

      <header className="relative z-10 flex items-center justify-between gap-3 px-5 py-5 sm:px-10">
        <Image
          src="/logo-hkcm-light.png"
          alt="HKCM"
          width={140}
          height={36}
          className="h-8 w-auto"
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
        <button
          type="button"
          onClick={() => void login()}
          className="rounded-full bg-white/95 px-4 py-2.5 text-[13px] font-semibold text-ink shadow-sm transition hover:bg-brand hover:text-white sm:px-5 sm:text-[14px]"
        >
          Connect wallet
        </button>
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
              Connect wallet
            </button>
            <button
              type="button"
              onClick={() => setTab("about")}
              className="rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-white/10"
            >
              About us
            </button>
          </div>
        </section>

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
            {HEADLINE_NEWS.map((n) => (
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

        <AnalysisCarousel slides={CHART_ANALYSES} />

        <section className="animate-rise-delay-3">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Desk comments
            </p>
            <h2 className="mt-1 font-display text-[1.35rem] tracking-[-0.03em] text-white">
              Market conversation
            </h2>
          </div>
          <DeskCommentsFeed />
        </section>
      </main>
    </div>
  );
}
