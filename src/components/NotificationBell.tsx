"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import type { DeskNotification } from "@/lib/notifications";

const SEEN_KEY = "hkcm-notif-seen";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function readSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSeen(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-80)));
  } catch {
    /* ignore */
  }
}

export function NotificationBell() {
  const { address, verified } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<DeskNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission>(
    typeof Notification === "undefined" ? "denied" : Notification.permission
  );
  const seenRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    seenRef.current = readSeen();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!address || !verified) return;
    let cancelled = false;

    const pull = async () => {
      try {
        const res = await fetch(`/api/notifications?address=${encodeURIComponent(address)}`);
        const json = (await res.json()) as { ok?: boolean; items?: DeskNotification[] };
        if (!json.ok || !json.items || cancelled) return;
        if (!primedRef.current) {
          for (const n of json.items) seenRef.current.add(n.id);
          writeSeen(seenRef.current);
          primedRef.current = true;
          setItems(json.items);
          return;
        }
        const fresh = json.items.filter((n) => !seenRef.current.has(n.id));
        setItems(json.items);
        if (fresh.length && typeof Notification !== "undefined" && Notification.permission === "granted") {
          for (const n of fresh.slice(0, 3)) {
            try {
              new Notification(n.title, {
                body: n.body,
                icon: "/favicon-32.png",
                tag: n.id,
              });
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        /* keep last */
      }
    };

    void pull();
    const tick = window.setInterval(() => void pull(), 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(tick);
    };
  }, [address, verified]);

  const enablePush = async () => {
    if (!address || typeof Notification === "undefined") return;
    const next = await Notification.requestPermission();
    setPerm(next);
    if (next !== "granted") return;

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (key && "pushManager" in reg) {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
        const json = sub.toJSON();
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            endpoint: json.endpoint,
            keys: json.keys,
          }),
        });
      }
    } catch {
      /* in-app + OS notification still work while the tab is open */
    }
  };

  const unread = items.filter((n) => !seenRef.current.has(n.id)).length;

  const markAll = () => {
    for (const n of items) seenRef.current.add(n.id);
    writeSeen(seenRef.current);
    setItems((prev) => [...prev]);
  };

  if (!address || !verified) return null;

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAll();
        }}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-white text-ink transition hover:bg-surface-soft"
        aria-label={t.notif.label}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M10 18a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[20rem] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_18px_48px_rgba(5,12,28,0.16)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
            <p className="text-[13px] font-semibold text-ink">{t.notif.label}</p>
            {perm !== "granted" && (
              <button
                type="button"
                onClick={() => void enablePush()}
                className="text-[12px] font-semibold text-brand"
              >
                {t.notif.enable}
              </button>
            )}
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-6 text-[13px] text-muted">{t.notif.empty}</li>
            )}
            {items.map((n) => (
              <li key={n.id} className="border-b border-[var(--line)] px-4 py-3 last:border-0">
                <p className="text-[13px] font-semibold text-ink">{n.title}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-body">{n.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
