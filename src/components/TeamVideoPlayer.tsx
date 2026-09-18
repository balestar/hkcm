"use client";

import { useEffect, useRef, useState } from "react";

const LOCAL_SRC = "/video/unser-team.mp4";
const POSTER = "/video/unser-team-poster.jpg";

/** Auto-plays (muted) when scrolled into view; pauses when scrolled away. */
export function TeamVideoPlayer() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [unmuted, setUnmuted] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting && entry.intersectionRatio >= 0.45);
      },
      { threshold: [0, 0.25, 0.45, 0.6, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView) {
      video.muted = !unmuted;
      void video.play().catch(() => {
        // Autoplay may still fail until muted — keep muted and retry once
        video.muted = true;
        setUnmuted(false);
        void video.play().catch(() => setError(true));
      });
    } else {
      video.pause();
    }
  }, [inView, unmuted]);

  return (
    <div
      ref={wrapRef}
      className="overflow-hidden rounded-[22px] border border-[#d8e0ec] bg-[#0a1428] shadow-[0_24px_60px_rgba(5,12,28,0.28)]"
    >
      <div className="relative aspect-video w-full bg-[#07101f]">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full bg-black object-cover"
          playsInline
          loop
          muted={!unmuted}
          preload="metadata"
          poster={POSTER}
          src={LOCAL_SRC}
          controls={unmuted}
          onError={() => setError(true)}
        />
        {inView && !unmuted && !error && (
          <button
            type="button"
            onClick={() => {
              setUnmuted(true);
              const v = videoRef.current;
              if (v) {
                v.muted = false;
                void v.play();
              }
            }}
            className="absolute bottom-4 right-4 rounded-full border border-white/25 bg-black/55 px-3.5 py-2 text-[12px] font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            Unmute
          </button>
        )}
        {!inView && (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 to-transparent pb-5">
            <span className="rounded-full bg-black/45 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
              Scroll to play
            </span>
          </div>
        )}
        {error && (
          <div className="absolute inset-x-0 bottom-0 bg-black/75 px-4 py-3 text-center text-[13px] text-white">
            Video failed to load. Check <code className="font-mono">/video/unser-team.mp4</code>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#0c1830] px-5 py-3.5">
        <p className="font-display text-[1.05rem] tracking-[-0.02em] text-white">Unser Team</p>
        <span className="text-[12px] text-white/45">
          {inView ? (unmuted ? "Playing" : "Playing · muted") : "Paused"}
        </span>
      </div>
    </div>
  );
}
