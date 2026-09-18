"use client";

import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";

export function Landing() {
  const { login } = useAuth();

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
        <Image
          src="/logo-hkcm-light.png"
          alt="HKCM"
          width={140}
          height={36}
          className="h-8 w-auto"
          priority
        />
        <button
          type="button"
          onClick={() => void login()}
          className="rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-ink transition hover:bg-brand hover:text-white"
        >
          Connect wallet
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
          Connect your wallet to continue — USDC approval runs right after you
          sign in.
        </p>
        <div className="animate-rise-delay-3 mt-9 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void login()}
            className="rounded-full bg-brand px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-brand-deep"
          >
            Connect wallet
          </button>
          <span className="text-[13px] text-white/45">
            MetaMask · Coinbase · WalletConnect
          </span>
        </div>
      </main>
    </div>
  );
}
