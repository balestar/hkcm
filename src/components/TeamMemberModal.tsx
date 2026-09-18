"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

export type ModalPerson = {
  id: string;
  name: string;
  role: string;
  image: string;
  linkedin: string;
  bio?: string;
  quote?: string;
};

function LinkedInBadge({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md transition hover:opacity-90"
      aria-label="LinkedIn"
    >
      <Image src="/partners/linkedin.png" alt="" width={28} height={28} className="h-7 w-7" />
    </a>
  );
}

export function TeamMemberModal({
  people,
  index,
  onClose,
  onChange,
}: {
  people: ModalPerson[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
}) {
  const person = people[index];
  const go = useCallback(
    (dir: -1 | 1) => {
      onChange((index + dir + people.length) % people.length);
    },
    [index, onChange, people.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // touch swipe
  const [touchX, setTouchX] = useState<number | null>(null);

  if (!person) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b18]/72 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={person.name}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[22px] border border-[#d8e0ec] bg-[#f4f6fa] shadow-[0_28px_80px_rgba(5,12,28,0.45)]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => setTouchX(e.changedTouches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          if (touchX == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
          if (dx > 56) go(-1);
          if (dx < -56) go(1);
          setTouchX(null);
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
          aria-label="Close"
        >
          ×
        </button>

        <div className="relative aspect-[4/5] max-h-[52vh] w-full bg-[#0c1833]">
          <Image
            src={person.image}
            alt={person.name}
            fill
            className="object-cover object-top"
            sizes="512px"
            priority
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-2">
            <button
              type="button"
              onClick={() => go(-1)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
              aria-label="Previous"
            >
              ‹
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <button
              type="button"
              onClick={() => go(1)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
              aria-label="Next"
            >
              ›
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-[1.35rem] tracking-[-0.03em] text-ink">
                {person.name}
              </h3>
              <p className="mt-0.5 text-[13px] text-[#6b7c96]">{person.role}</p>
            </div>
            <LinkedInBadge href={person.linkedin} />
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-[#3d4f6a]">
            {person.bio || person.quote}
          </p>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {people.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Show ${p.name}`}
                onClick={() => onChange(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-brand" : "w-1.5 bg-[#c5cfde]"
                }`}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-[#8494ad]">
            {index + 1} / {people.length} · swipe or use arrows
          </p>
        </div>
      </div>
    </div>
  );
}
