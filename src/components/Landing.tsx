"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { TeamPopup } from "@/components/TeamPopup";

export function Landing() {
  const { login } = useAuth();
  const [teamOpen, setTeamOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("hkcm.teamPopupShown") === "1") return;
      sessionStorage.setItem("hkcm.teamPopupShown", "1");
    } catch {
      /* ignore */
    }
    setTeamOpen(true);
  }, []);

  const openTeam = useCallback(() => setTeamOpen(true), []);
  const closeTeam = useCallback(() => setTeamOpen(false), []);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_15%,rgba(59,110,245,0.28),transparent_52%),linear-gradient(160deg,#07122b_0%,#0d1f45_48%,#102a5c_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-brand/25 blur-3xl motion-safe:animate-[pulseSoft_4s_ease-in-out_infinite]"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <button
          type="button"
          onClick={openTeam}
          className="flex items-center gap-3 text-left"
          aria-label="Open team slides"
        >
          <Image
            src="/logo-hkcm-light.png"
            alt="HKCM"
            width={140}
            height={36}
            className="h-8 w-auto"
            priority
          />
        </button>
        <button
          type="button"
          onClick={login}
          className="rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-ink transition hover:bg-brand hover:text-white"
        >
          Log in
        </button>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-16 pt-8 sm:px-10">
        <p className="animate-rise text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-soft">
          Investing, clarified
        </p>
        <h1 className="animate-rise-delay-1 mt-4 max-w-2xl font-display text-[3.1rem] leading-[0.95] tracking-[-0.045em] text-white sm:text-[4.4rem]">
          HKCM
        </h1>
        <p className="animate-rise-delay-2 mt-5 max-w-md text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
          A calm home for your portfolio — yields, European market context, and
          trending picks in one place.
        </p>
        <div className="animate-rise-delay-3 mt-9 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={login}
            className="rounded-full bg-brand px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-brand-deep"
          >
            Log in to continue
          </button>
          <button
            type="button"
            onClick={openTeam}
            className="rounded-full border border-white/25 bg-white/5 px-5 py-3.5 text-[14px] font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Meet the team
          </button>
        </div>
      </main>

      <TeamPopup open={teamOpen} onClose={closeTeam} />
    </div>
  );
}
