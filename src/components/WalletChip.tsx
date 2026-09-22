"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

/** Wallet pill in the header — shows short address, opens profile menu. */
export function WalletChip({ onOpenProfile }: { onOpenProfile: () => void }) {
  const { address, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
  const last4 = address ? address.slice(-4) : "";

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!address) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-surface-elevated px-3.5 py-1.5 text-[13px] font-medium text-ink transition hover:opacity-80"
      >
        <span className="h-2 w-2 rounded-full bg-gain" aria-hidden />
        <span className="font-mono">•• {last4}</span>
        <svg
          className={`h-3 w-3 text-muted transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-[var(--line)] bg-surface-elevated shadow-[0_16px_40px_rgba(5,12,28,0.16)]">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Wallet</p>
            <p className="mt-0.5 font-mono text-[13px] text-ink">{short}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpenProfile();
            }}
            className="w-full px-4 py-2.5 text-left text-[14px] text-ink transition hover:bg-surface-soft"
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full px-4 py-2.5 text-left text-[14px] text-loss transition hover:bg-surface-soft"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
