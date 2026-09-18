"use client";

import Image from "next/image";
import { AccountSummary } from "@/components/AccountSummary";
import { useAuth } from "@/components/AuthProvider";
import { NewsPanel } from "@/components/NewsPanel";
import { TimeGreeting } from "@/components/TimeGreeting";
import { TopPicksPanel } from "@/components/TopPicksPanel";
import { YieldsPanel } from "@/components/YieldsPanel";

export function Dashboard() {
  const { logout } = useAuth();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_86%,white)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-hkcm.png"
              alt="HKCM"
              width={120}
              height={32}
              className="h-7 w-auto"
              priority
            />
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-[var(--line)] bg-surface-elevated px-3.5 py-1.5 text-[13px] font-medium text-body transition hover:text-ink"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        <div className="animate-rise mb-6">
          <TimeGreeting />
          <p className="mt-2 text-[15px] text-body">
            Your brief — balances, yields, and what Europe is watching.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:gap-5">
          <AccountSummary />
          <YieldsPanel />
          <NewsPanel />
          <TopPicksPanel />
        </div>
      </main>
    </div>
  );
}
