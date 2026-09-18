"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { TEAM_SLIDES } from "@/lib/data";

type TeamPopupProps = {
  open: boolean;
  onClose: () => void;
};

export function TeamPopup({ open, onClose }: TeamPopupProps) {
  const [index, setIndex] = useState(0);
  const slide = TEAM_SLIDES[index];

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % TEAM_SLIDES.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + TEAM_SLIDES.length) % TEAM_SLIDES.length);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1b3a]/72 px-4 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Meet the HKCM team"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[720px] animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-2 -top-2 z-20 grid h-11 w-11 place-items-center rounded-full bg-brand text-white shadow-lg transition hover:bg-brand-deep sm:-right-3 sm:-top-3"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M3.5 3.5l9 9M12.5 3.5l-9 9"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="overflow-hidden rounded-[22px] border border-white/20 bg-gradient-to-br from-[#0f2348] via-[#132a56] to-[#1a3a7a] shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <div className="grid gap-0 md:grid-cols-[1.05fr_1fr]">
            <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(59,110,245,0.4),transparent_62%)] p-5 md:min-h-[360px] md:p-7">
              <div className="relative aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/15 bg-[#0b1b3a]/35 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                <Image
                  src={slide.image}
                  alt={slide.name}
                  fill
                  className="object-cover object-top"
                  sizes="280px"
                  priority
                />
              </div>
            </div>

            <div className="flex flex-col justify-between px-6 py-7 sm:px-8 sm:py-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-soft">
                  Meet the team · {index + 1}/{TEAM_SLIDES.length}
                </p>
                <h2 className="mt-3 font-display text-[1.65rem] tracking-[-0.03em] text-white">
                  {slide.name}
                </h2>
                <p className="mt-1 text-[14px] font-medium text-white/65">{slide.role}</p>
                <p className="mt-5 text-[14px] leading-relaxed text-white/80">
                  {slide.writeup}
                </p>
                <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white/75">
                  Focus · {slide.focus}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <div className="flex gap-1.5">
                  {TEAM_SLIDES.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={`Go to slide ${i + 1}`}
                      onClick={() => setIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === index ? "w-6 bg-brand" : "w-1.5 bg-white/30 hover:bg-white/50"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setIndex((i) => (i - 1 + TEAM_SLIDES.length) % TEAM_SLIDES.length)
                    }
                    className="rounded-full border border-white/20 bg-white/5 px-3.5 py-2 text-[13px] font-medium text-white/85 hover:bg-white/10"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndex((i) => (i + 1) % TEAM_SLIDES.length)}
                    className="rounded-full bg-brand px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-deep"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
