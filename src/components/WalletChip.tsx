"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function identiconColors(address: string): string[] {
  const hex = address.replace(/^0x/i, "").padEnd(8, "0");
  const colors: string[] = [];
  for (let i = 0; i < 5; i++) {
    const h = parseInt(hex.slice((i * 3) % 8, (i * 3) % 8 + 2) || "3b", 16);
    const s = 42 + (parseInt(hex.slice(i, i + 2) || "6e", 16) % 28);
    const l = 38 + ((h + i * 17) % 22);
    colors.push(`hsl(${h % 360} ${s}% ${l}%)`);
  }
  return colors;
}

function AddressIdenticon({ address }: { address: string }) {
  const cells = useMemo(() => {
    const hex = address.replace(/^0x/i, "").toLowerCase().padEnd(16, "0");
    const palette = identiconColors(address);
    const grid: string[] = [];
    for (let y = 0; y < 5; y++) {
      const row: string[] = [];
      for (let x = 0; x < 3; x++) {
        const n = parseInt(hex[(y * 3 + x) % hex.length] || "0", 16);
        row.push(n % 4 === 0 ? "#e8eef8" : palette[n % palette.length]);
      }
      grid.push(...row, row[1], row[0]);
    }
    return grid;
  }, [address]);

  return (
    <span
      className="grid h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-black/5"
      style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
      aria-hidden
    >
      {cells.map((c, i) => (
        <span key={i} style={{ background: c }} />
      ))}
    </span>
  );
}

export function WalletChip({ onOpenProfile }: { onOpenProfile: () => void }) {
  const { address, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!address) return null;

  const label = shortAddress(address);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-white py-1 pl-1 pr-3 shadow-[0_6px_18px_rgba(11,27,58,0.1)] transition hover:border-[#0b1b3a]/20 hover:shadow-[0_8px_22px_rgba(11,27,58,0.14)]"
      >
        <AddressIdenticon address={address} />
        <span className="text-left leading-tight">
          <span className="block font-mono text-[13px] font-semibold tracking-tight text-ink">
            {label}
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-gain">
            Connected
          </span>
        </span>
        <svg
          className={`ml-0.5 h-3.5 w-3.5 text-muted transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-[17.5rem] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_18px_48px_rgba(5,12,28,0.16)]"
        >
          <div className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-3.5">
            <AddressIdenticon address={address} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Wallet
              </p>
              <p className="mt-0.5 break-all font-mono text-[12px] leading-snug text-ink">
                {address}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => void copy()}
            className="w-full px-4 py-2.5 text-left text-[14px] font-medium text-ink transition hover:bg-surface-soft"
          >
            {copied ? "Address copied" : "Copy address"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenProfile();
            }}
            className="w-full px-4 py-2.5 text-left text-[14px] font-medium text-ink transition hover:bg-surface-soft"
          >
            Profile
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void logout()}
            className="w-full border-t border-[var(--line)] px-4 py-2.5 text-left text-[14px] font-medium text-loss transition hover:bg-surface-soft"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
