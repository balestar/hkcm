"use client";

import Image from "next/image";

const POSTER = "/video/unser-team-poster.jpg";
const WATCH_URL = "https://hkcm.com/ueber-uns";

/**
 * Bunny Stream is domain-locked to hkcm.com (403 on localhost / other hosts).
 * We show the official poster and open the real film on hkcm.com.
 */
export function TeamVideoPlayer() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#d8e0ec] bg-[#0a1428] shadow-[0_24px_60px_rgba(5,12,28,0.28)]">
      <a
        href={WATCH_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block aspect-video w-full bg-[#07101f]"
        aria-label="Watch Unser Team on hkcm.com"
      >
        <Image
          src={POSTER}
          alt="HKCM Unser Team"
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 1024px) 100vw, 960px"
          priority
        />
        <span className="absolute inset-0 bg-gradient-to-t from-[#050b18]/80 via-[#050b18]/30 to-transparent" />
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-[#353cee] text-white shadow-[0_12px_40px_rgba(53,60,238,0.45)] transition group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="font-display text-[1.35rem] tracking-[0.04em] text-white sm:text-[1.6rem]">
            UNSER TEAM
          </span>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[12px] font-medium text-white/90 backdrop-blur-sm">
            Watch on hkcm.com
          </span>
        </span>
      </a>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#0c1830] px-5 py-3.5">
        <p className="font-display text-[1.05rem] tracking-[-0.02em] text-white">Unser Team</p>
        <span className="text-[12px] text-white/45">Official team film</span>
      </div>
    </div>
  );
}
