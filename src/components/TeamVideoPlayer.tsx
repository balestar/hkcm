"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/api/team-video?path=play_720p.mp4";
const POSTER = "/video/unser-team-poster.jpg";

/** Auto-plays (muted) when scrolled into view; pauses when scrolled away.
 *  Video is proxied from Bunny Stream (not bundled — CF Workers 25 MiB asset limit). */
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
        video.muted = true;
        setUnmuted(false);
        void video.play().catch(() => setError(true));
      });
    } else {
      video.pause();
    }
  }, [inView, unmuted]);

  return (
    <div ref={wrapRef} className="overflow-hidden rounded-[22px] bg-black">
      <div className="relative aspect-video w-full">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          loop
          muted={!unmuted}
          preload="metadata"
          poster={POSTER}
          src={VIDEO_SRC}
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
            className="absolute bottom-4 right-4 rounded-full border border-white/20 bg-black/50 px-3.5 py-2 text-[12px] font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            Unmute
          </button>
        )}
        {error && (
          <div className="absolute inset-x-0 bottom-0 bg-black/75 px-4 py-3 text-center text-[13px] text-white">
            Video failed to load
          </div>
        )}
      </div>
    </div>
  );
}
