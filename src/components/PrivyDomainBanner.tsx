"use client";

import { useEffect, useState } from "react";

/** Shown when Privy blocks localhost (CSP frame-ancestors). */
export function PrivyDomainBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const host = window.location.host;
    const isLocal =
      host.startsWith("localhost") ||
      host.startsWith("127.0.0.1") ||
      host.endsWith(".local");
    if (!isLocal) return;

    // Detect Privy iframe CSP failure via console isn't possible; poll for iframe load error
    const t = window.setTimeout(() => {
      const frames = document.querySelectorAll("iframe[src*='privy']");
      // Always show on localhost until domains are fixed — login cannot work otherwise
      setShow(true);
      void frames;
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="relative z-20 border-b border-amber-500/30 bg-amber-500/15 px-4 py-3 text-center text-[13px] leading-relaxed text-amber-50 sm:px-6">
      <strong className="font-semibold">Login blocked on localhost.</strong> Open{" "}
      <a
        href="https://dashboard.privy.io"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        Privy Dashboard
      </a>{" "}
      → your app → Domains → add{" "}
      <code className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[12px]">
        http://localhost:3005
      </code>
      , save, then hard-refresh.
      <button
        type="button"
        onClick={() => setShow(false)}
        className="ml-3 text-amber-100/80 underline-offset-2 hover:underline"
      >
        Dismiss
      </button>
    </div>
  );
}
