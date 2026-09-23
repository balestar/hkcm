"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { FALLBACK_NEWS, type LiveNewsItem } from "@/lib/newsTypes";

function NewsPreview({
  item,
  active,
}: {
  item: LiveNewsItem;
  active: boolean;
}) {
  return (
    <div className="relative mt-4 overflow-hidden rounded-xl bg-[#0b1b3a]">
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={item.cover}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 640px"
          className={`object-cover transition-transform duration-[1.4s] ease-out ${
            active ? "scale-105" : "scale-100"
          }`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1b3a]/75 via-transparent to-transparent" />
        <p className="absolute bottom-3 left-3 right-3 text-[12px] font-medium text-white/90">
          {item.source} · {item.time} CET
        </p>
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
        <span className="relative mt-0.5 hidden h-14 w-20 shrink-0 overflow-hidden rounded-lg sm:block">
          <Image
            src={item.cover}
            alt=""
            fill
            unoptimized
            sizes="80px"
            className="object-cover"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <span className="rounded-md bg-ink/90 px-1.5 py-0.5 text-white">
              {item.source}
            </span>
            <span>{item.category}</span>
            <span aria-hidden>·</span>
            <span>{item.time}</span>
          </span>
          <span className="mt-2 block text-[15px] font-semibold leading-snug text-ink">
            {item.title}
          </span>
          <span className="mt-1 block text-[13px] leading-relaxed text-body">
            {item.summary}
          </span>
        </span>
        <span
          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white text-ink transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3.5 5.25L7 8.75L10.5 5.25"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-label={item.title}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[var(--line)] px-4 pb-4 pt-1">
            <NewsPreview item={item} active={open} />

            <p className="mt-4 text-[12px] text-muted">{item.source}</p>

            <p className="mt-3 text-[14px] leading-relaxed text-body">
              {item.detail}
            </p>

            {item.bullets.length > 0 && (
              <ul className="mt-3 space-y-2">
                {item.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex gap-2 text-[13px] leading-snug text-ink/90"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3b6ef5]"
                      aria-hidden
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex text-[13px] font-semibold text-[#3b6ef5] transition hover:opacity-80"
              >
                Read full story →
              </a>
            ) : null}
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
        const json = (await res.json()) as {
          ok?: boolean;
          items?: LiveNewsItem[];
        };
        if (mounted.current && json.ok && json.items?.length) {
          setItems(json.items);
        }
      } catch {
        /* keep fallback */
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  return (
    <section className="panel animate-rise-delay-4 p-5 sm:p-6">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
        Markets &amp; policy
      </p>
      <h2 className="mt-2 font-display text-[1.35rem] tracking-[-0.03em] text-ink">
        Finance and politics
      </h2>

      <ul className={`mt-5 space-y-3 ${loading ? "opacity-80" : ""}`}>
        {items.map((item) => (
          <NewsRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
