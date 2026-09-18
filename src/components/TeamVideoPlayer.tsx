"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const LOCAL_SRC = "/video/unser-team.mp4";
const POSTER = "/video/unser-team-poster.jpg";

export function TeamVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!started || !videoRef.current) return;
    void videoRef.current.play().catch(() => setMissing(true));
  }, [started]);

  return (
    <div className="overflow-hidden rounded-[22px] border border-[#d8e0ec] bg-[#0a1428] shadow-[0_24px_60px_rgba(5,12,28,0.28)]">
      <div className="relative aspect-video w-full bg-[#07101f]">
        {!started ? (
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="group absolute inset-0 w-full"
            aria-label="Play Unser Team video"
          >
            <Image
              src={POSTER}
              alt="HKCM Unser Team"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 960px"
              priority
            />
            <span className="absolute inset-0 bg-gradient-to-t from-[#050b18]/75 via-[#050b18]/25 to-transparent" />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-[#353cee] text-white shadow-[0_12px_40px_rgba(53,60,238,0.45)] transition group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="font-display text-[1.35rem] tracking-[0.04em] text-white sm:text-[1.6rem]">
                UNSER TEAM
              </span>
            </span>
          </button>
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full bg-black object-contain"
            controls
            playsInline
            poster={POSTER}
            src={LOCAL_SRC}
            onError={() => setMissing(true)}
          />
        )}
        {missing && (
          <div className="absolute inset-x-0 bottom-0 bg-black/75 px-4 py-3 text-center text-[13px] text-white">
            Local video missing — add <code className="font-mono">public/video/unser-team.mp4</code>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#0c1830] px-5 py-3.5">
        <p className="font-display text-[1.05rem] tracking-[-0.02em] text-white">Unser Team</p>
        <span className="text-[12px] text-white/45">Local playback</span>
      </div>
    </div>
  );
}
