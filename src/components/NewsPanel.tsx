"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { FALLBACK_NEWS, type LiveNewsItem } from "@/lib/newsTypes";

const CATEGORY_STYLES: Record<string, string> = {
  Markets:     "bg-[#1a3a6b] text-[#7eb8ff]",
  Rates:       "bg-[#1a2f1a] text-[#66cc66]",
  Macro:       "bg-[#2a1f3a] text-[#b07ff5]",
  Crypto:      "bg-[#2a1f00] text-[#f5a623]",
  Movers:      "bg-[#0e2a28] text-[#26cba8]",
  Commodities: "bg-[#2a1a0e] text-[#e08040]",
};

function CategoryPill({ category }: { category: string }) {
  const cls = CATEGORY_STYLES[category] ?? "bg-ink/20 text-muted";
  return (
    <span className={`rounded-md px-1.5 py-0.5 font-semibold ${cls}`}>
      {category}
    </span>
  );
}

type Slide =
  | { kind: "video"; src: string }
  | { kind: "image"; src: string };

/** Build a clean, non-repeating slide list from the wire data only. */
function buildSlides(item: LiveNewsItem): Slide[] {
  const slides: Slide[] = [];

  // Video first if available
  if (item.video) slides.push({ kind: "video", src: item.video });

  // Real HTTP images from the wire (slides array is already deduplicated HTTP-only)
  const realImages = item.slides.filter((s) => /^https?:\/\//i.test(s));
  for (const src of realImages) {
    if (slides.length >= 3) break;
    slides.push({ kind: "image", src });
  }

  // If no real images at all, show cover (may be local stock photo — but only once)
  if (!slides.length) {
    slides.push({ kind: "image", src: item.cover });
  }

  return slides;
}

function NewsMedia({ item, active }: { item: LiveNewsItem; active: boolean }) {
  const slides = buildSlides(item);
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset when item changes
  useEffect(() => {
    setIndex(0);
  }, [item.id]);

  // Play/pause video
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active && slides[index]?.kind === "video") {
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [active, index, slides]);

  const go = (dir: number) =>
    setIndex((i) => (i + dir + slides.length) % slides.length);

  const multi = slides.length > 1;
  const current = slides[index];

  return (
    <div className="relative mt-4 overflow-hidden rounded-xl bg-[#060e1c]">
      {/* Slide track */}
      <div
        className="flex aspect-[16/9] touch-pan-y overflow-hidden"
        onPointerDown={(e) => { startX.current = e.clientX; }}
        onPointerUp={(e) => {
          if (startX.current == null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 36) go(dx < 0 ? 1 : -1);
        }}
      >
        <div
          className="flex h-full w-full flex-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${index * 100}%)`, width: `${slides.length * 100}%` }}
        >
          {slides.map((s, i) => (
            <div key={i} className="relative h-full" style={{ width: `${100 / slides.length}%` }}>
              {s.kind === "video" ? (
                <video
                  ref={i === index ? videoRef : undefined}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={s.src}
                  poster={item.cover}
                  muted
                  playsInline
                  loop
                  preload="metadata"
                />
              ) : (
                <Image
                  src={s.src}
                  alt={item.title}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 640px"
                  className={`object-cover transition-transform duration-[1.8s] ease-out ${active && i === index ? "scale-[1.04]" : "scale-100"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Prev / Next arrows — only when multi */}
      {multi && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className="absolute left-2.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-[18px] leading-none text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className="absolute right-2.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-[18px] leading-none text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-3 px-3 pb-3 pt-6">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/80">
          {current.kind === "video" && (
            <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-red-600">
              <span className="block h-0 w-0 border-b-4 border-l-[7px] border-t-4 border-b-transparent border-l-white border-t-transparent" />
            </span>
          )}
          {item.source} · {item.time} CET
        </span>
        {multi && (
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewsRow({ item }: { item: LiveNewsItem }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <li className="overflow-hidden rounded-2xl border border-[var(--line)] bg-surface-soft/50 transition hover:bg-surface-soft">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        {/* Thumb — always shows the cover photo */}
        <span className="relative mt-0.5 hidden h-14 w-20 shrink-0 overflow-hidden rounded-lg sm:block">
          <Image src={item.cover} alt="" fill unoptimized sizes="80px" className="object-cover" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <span className="rounded-md bg-ink/90 px-1.5 py-0.5 text-white">{item.source}</span>
            <CategoryPill category={item.category} />
            <span aria-hidden>·</span>
            <span>{item.time}</span>
            {item.video && (
              <span className="rounded-md bg-[#0b1b3a] px-1.5 py-0.5 text-white">Video</span>
            )}
          </span>
          <span className="mt-2 block text-[15px] font-semibold leading-snug text-ink">
            {item.title}
          </span>
          <span className="mt-1 block text-[13px] leading-relaxed text-body">
            {item.summary}
          </span>
        </span>

        <span
          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white text-ink transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* Accordion body */}
      <div
        id={panelId}
        role="region"
        aria-label={item.title}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[var(--line)] px-4 pb-5 pt-1">
            <NewsMedia item={item} active={open} />

            <p className="mt-4 text-[14px] leading-relaxed text-body">{item.detail}</p>

            {item.bullets.length > 0 && (
              <ul className="mt-3 space-y-2">
                {item.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-[13px] leading-snug text-ink/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3b6ef5]" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#3b6ef5] transition hover:opacity-75"
              >
                Read full story
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export function NewsPanel() {
  const [items, setItems] = useState<LiveNewsItem[]>(FALLBACK_NEWS.slice(0, 6));
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const res = await fetch("/api/news?limit=6");
        const json = (await res.json()) as { ok?: boolean; items?: LiveNewsItem[] };
        if (mounted.current && json.ok && json.items?.length) {
          setItems(json.items);
        }
      } catch { /* keep fallback */ }
      finally { if (mounted.current) setLoading(false); }
    })();
    return () => { mounted.current = false; };
  }, []);

  return (
    <section className="panel animate-rise-delay-4 p-5 sm:p-6">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
        Markets &amp; movers
      </p>
      <h2 className="mt-2 font-display text-[1.35rem] tracking-[-0.03em] text-ink">
        Finance &amp; markets
      </h2>
      <ul className={`mt-5 space-y-3 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
        {items.map((item) => (
          <NewsRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
