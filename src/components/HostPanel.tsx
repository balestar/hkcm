"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DeskNotification, HostWallet } from "@/lib/notifications";

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function HostPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [wallets, setWallets] = useState<HostWallet[]>([]);
  const [stats, setStats] = useState({ wallets: 0, pushReady: 0, chains: 0 });
  const [history, setHistory] = useState<DeskNotification[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetAll, setTargetAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [w, n] = await Promise.all([
      fetch("/api/host/wallets").then((r) => r.json()),
      fetch("/api/host/notify").then((r) => r.json()),
    ]);
    if (w.ok) {
      setWallets(w.wallets ?? []);
      setStats(w.stats ?? { wallets: 0, pushReady: 0, chains: 0 });
    }
    if (n.ok) setHistory(n.items ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/host/login");
      const json = await res.json();
      setAuthed(!!json.ok);
      if (json.ok) void refresh();
    })();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wallets;
    return wallets.filter(
      (w) =>
        w.address.toLowerCase().includes(q) ||
        (w.name || "").toLowerCase().includes(q) ||
        (w.email || "").toLowerCase().includes(q) ||
        w.chains.join(" ").toLowerCase().includes(q)
    );
  }, [wallets, query]);

  const login = async () => {
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/host/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setLoginError("Incorrect password.");
        return;
      }
      setPassword("");
      setAuthed(true);
      await refresh();
    } catch {
      setLoginError("Couldn't reach the desk.");
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await fetch("/api/host/login", { method: "DELETE" });
    setAuthed(false);
    setWallets([]);
    setSelected(new Set());
  };

  const toggle = (addr: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(addr)) next.delete(addr);
      else next.add(addr);
      return next;
    });
  };

  const send = async () => {
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/host/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          all: targetAll,
          addresses: targetAll ? wallets.map((w) => w.address) : [...selected],
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        const why =
          json.error === "no_recipients"
            ? "No connected wallets to send to."
            : json.error === "invalid_title"
              ? "Title needs 2–80 characters."
              : json.error === "invalid_body"
                ? "Message needs 2–280 characters."
                : json.error === "persist_failed"
                  ? `Couldn’t save the notification${json.detail ? `: ${json.detail}` : "."}`
                  : json.error === "unauthorized"
                    ? "Session expired — sign in again."
                    : `Couldn't send${json.detail ? `: ${json.detail}` : "."}`;
        setStatus(why);
        return;
      }
      const count = targetAll
        ? Math.max(wallets.length, typeof json.stored === "number" ? json.stored : 0)
        : typeof json.stored === "number"
          ? json.stored
          : selected.size;
      setStatus(
        `Sent to ${count} wallet${count === 1 ? "" : "s"}${
          json.pushSent ? ` · ${json.pushSent} device push` : ""
        }.`
      );
      setTitle("");
      setBody("");
      await refresh();
    } catch {
      setStatus("Network error.");
    } finally {
      setSending(false);
    }
  };

  if (authed === null) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#070b14] text-sm text-white/50">
        Loading desk…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#070b14] px-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void login();
          }}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0c1220] p-7 shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e4d0a0]/60">
            HKCM Host
          </p>
          <h1 className="mt-2 font-display text-[1.6rem] tracking-[-0.03em] text-white">
            Desk access
          </h1>
          <p className="mt-2 text-[13px] text-white/45">
            Sign in to message connected wallets.
          </p>
          <label className="mt-6 block text-[12px] font-medium text-white/55">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-white outline-none focus:border-[#c4a35a]/50"
            />
          </label>
          {loginError && <p className="mt-3 text-[13px] text-[#f87171]">{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn || password.length < 4}
            className="mt-5 w-full rounded-xl bg-[#c4a35a] py-2.5 text-[14px] font-semibold text-[#1a1408] transition hover:brightness-110 disabled:opacity-40"
          >
            {loggingIn ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#070b14] text-white">
      <header className="border-b border-white/8 bg-[#0a1020]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e4d0a0]/50">
              HKCM
            </p>
            <h1 className="font-display text-[1.35rem] tracking-[-0.03em]">Host desk</h1>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-full border border-white/12 px-3.5 py-1.5 text-[13px] text-white/60 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Connected wallets", stats.wallets],
            ["Push enabled", stats.pushReady],
            ["Chains seen", stats.chains],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-white/8 bg-[#0c1220] px-5 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
                {label}
              </p>
              <p className="mt-1 text-[1.75rem] font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-white/8 bg-[#0c1220]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold">Connected wallets</h2>
                <p className="text-[12px] text-white/40">
                  {selected.size} selected
                </p>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search address, name…"
                className="w-full max-w-xs rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-[13px] outline-none placeholder:text-white/30 focus:border-[#c4a35a]/40 sm:w-56"
              />
            </div>
            <ul className="max-h-[28rem] overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-5 py-8 text-center text-[13px] text-white/40">
                  No connected wallets yet.
                </li>
              )}
              {filtered.map((w) => {
                const on = selected.has(w.address);
                return (
                  <li key={w.address}>
                    <button
                      type="button"
                      onClick={() => toggle(w.address)}
                      className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition ${
                        on ? "bg-[#c4a35a]/10" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <span
                        className={`grid h-4 w-4 place-items-center rounded border ${
                          on
                            ? "border-[#c4a35a] bg-[#c4a35a] text-[#1a1408]"
                            : "border-white/25"
                        }`}
                      >
                        {on ? "✓" : ""}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-[13px] font-semibold">
                          {shortAddr(w.address)}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-white/40">
                          {w.name || w.email || w.address}
                          {w.chains.length ? ` · ${w.chains.join(", ")}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span
                          className={`block text-[10px] font-semibold uppercase tracking-[0.08em] ${
                            w.pushEnabled ? "text-[#3dd68c]" : "text-white/30"
                          }`}
                        >
                          {w.pushEnabled ? "Push on" : "In-app"}
                        </span>
                        <span className="text-[11px] text-white/30">{timeAgo(w.lastSeen)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-white/8 bg-[#0c1220] p-5">
              <h2 className="text-[15px] font-semibold">Send notification</h2>
              <p className="mt-1 text-[12px] text-white/40">
                Lands as a wallet-style system notification on devices that allowed push, and in
                the dashboard inbox.
              </p>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title — e.g. Desk note"
                maxLength={80}
                className="mt-4 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-[14px] outline-none placeholder:text-white/30 focus:border-[#c4a35a]/40"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Message to the wallet…"
                maxLength={280}
                rows={4}
                className="mt-3 w-full resize-none rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-[14px] outline-none placeholder:text-white/30 focus:border-[#c4a35a]/40"
              />
              <label className="mt-3 flex items-center gap-2 text-[13px] text-white/60">
                <input
                  type="checkbox"
                  checked={targetAll}
                  onChange={(e) => setTargetAll(e.target.checked)}
                />
                Send to every connected wallet
              </label>
              <button
                type="button"
                onClick={() => void send()}
                disabled={sending || title.length < 2 || body.length < 2}
                className="mt-4 w-full rounded-xl bg-[#c4a35a] py-2.5 text-[14px] font-semibold text-[#1a1408] transition hover:brightness-110 disabled:opacity-40"
              >
                {sending
                  ? "Sending…"
                  : targetAll
                    ? "Push to all wallets"
                    : `Push to ${selected.size || 0} selected`}
              </button>
              {status && <p className="mt-3 text-[13px] text-[#e4d0a0]/80">{status}</p>}
            </section>

            <section className="rounded-2xl border border-white/8 bg-[#0c1220] p-5">
              <h2 className="text-[15px] font-semibold">Recent sends</h2>
              <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto">
                {history.length === 0 && (
                  <li className="text-[13px] text-white/40">No notifications yet.</li>
                )}
                {history.map((n) => (
                  <li key={n.id} className="border-b border-white/6 pb-3 last:border-0">
                    <p className="text-[13px] font-semibold">{n.title}</p>
                    <p className="mt-0.5 text-[12px] text-white/55">{n.body}</p>
                    <p className="mt-1 text-[11px] text-white/30">
                      {n.address ? shortAddr(n.address) : "All wallets"} · {timeAgo(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
