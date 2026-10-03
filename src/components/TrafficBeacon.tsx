"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";

const SESSION_KEY = "hkcm-session";

function sessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function browserName() {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  return "Browser";
}

function osName() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Mac OS/.test(ua)) return "macOS";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
}

export function TrafficBeacon() {
  const { address } = useAuth();
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    idRef.current = sessionId();
    let stopped = false;
    const send = () => {
      if (stopped || !idRef.current) return;
      const payload = {
        id: idRef.current,
        path: window.location.pathname,
        referrer: document.referrer || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        browser: browserName(),
        os: osName(),
        language: navigator.languages?.join(", ") || navigator.language,
        screen: `${window.screen.width}×${window.screen.height}`,
        browserDetail: [
          navigator.platform,
          navigator.userAgent,
          "cores" in navigator ? `${navigator.hardwareConcurrency} cores` : "",
        ]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 240),
        address: address || null,
      };
      void fetch("/api/traffic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => undefined);
    };
    send();
    const timer = window.setInterval(send, 60_000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [address]);

  return null;
}
