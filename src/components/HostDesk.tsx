"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HostMarkets } from "@/components/HostMarkets";
import type { DeskProfile, DeskSession, YieldBook } from "@/lib/deskSessions";
import { YIELDS } from "@/lib/data";
import type { DeskNotification, HostWallet } from "@/lib/notifications";

type WidgetId = "users" | "directory" | "charts" | "live" | "push";

function shortAddr(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function place(session: DeskSession) {
  return [session.city, session.region, session.country].filter(Boolean).join(", ") || "Location unavailable";
}

export function HostDesk({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState<WidgetId | null>(null);
  const [wallets, setWallets] = useState<HostWallet[]>([]);
  const [stats, setStats] = useState({ wallets: 0, pushReady: 0, chains: 0 });
  const [history, setHistory] = useState<DeskNotification[]>([]);
  const [sessions, setSessions] = useState<DeskSession[]>([]);
  const [yields, setYields] = useState<YieldBook[]>([]);
  const [profiles, setProfiles] = useState<Array<DeskProfile & { address: string }>>([]);
  const [pickedUser, setPickedUser] = useState<string | null>(null);
  const [live, setLive] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [wallet, setWallet] = useState<string | null>(null);
  const [session, setSession] = useState<DeskSession | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetAll, setTargetAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [walletRes, noteRes, sessionRes] = await Promise.all([
      fetch("/api/host/wallets").then((res) => res.json()),
      fetch("/api/host/notify").then((res) => res.json()),
      fetch("/api/host/sessions").then((res) => res.json()),
    ]);
    if (walletRes.ok) {
      setWallets(walletRes.wallets ?? []);
      setStats(walletRes.stats ?? { wallets: 0, pushReady: 0, chains: 0 });
    }
    if (noteRes.ok) setHistory(noteRes.items ?? []);
    if (sessionRes.ok) {
      setSessions(sessionRes.sessions ?? []);
      setYields(sessionRes.yields ?? []);
      setProfiles(sessionRes.profiles ?? []);
      setLive(sessionRes.live ?? 0);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const people = useMemo(() => {
    const map = new Map(wallets.map((item) => [item.address.toLowerCase(), item]));
    for (const item of sessions) {
      if (!item.address) continue;
      const key = item.address.toLowerCase();
      if (map.has(key)) continue;
      map.set(key, {
        address: item.address,
        name: item.profile?.fullName ?? null,
        email: item.profile?.email ?? null,
        chains: item.chains,
        lastSeen: item.lastSeen,
        pushEnabled: false,
      });
    }
    for (const item of profiles) {
      const key = item.address.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.name = existing.name || item.fullName;
        existing.email = existing.email || item.email;
        continue;
      }
      map.set(key, {
        address: item.address,
        name: item.fullName,
        email: item.email,
        chains: [],
        lastSeen: item.updatedAt,
        pushEnabled: false,
      });
    }
    return [...map.values()].sort((a, b) => (b.lastSeen || "").localeCompare(a.lastSeen || ""));
  }, [profiles, sessions, wallets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (item) =>
        item.address.toLowerCase().includes(q) ||
        (item.name || "").toLowerCase().includes(q) ||
        (item.email || "").toLowerCase().includes(q)
    );
  }, [people, query]);

  const walletSessions = useMemo(
    () =>
      sessions.filter(
        (item) => wallet && item.address?.toLowerCase() === wallet.toLowerCase()
      ),
    [sessions, wallet]
  );

  const liveSessions = useMemo(() => {
    const cutoff = Date.now() - 3 * 60_000;
    return sessions.filter((item) => new Date(item.lastSeen).getTime() >= cutoff);
  }, [sessions]);

  const directory = useMemo(() => {
    const cutoff = Date.now() - 3 * 60_000;
    return people.map((person) => {
      const mine = sessions.filter(
        (item) => item.address?.toLowerCase() === person.address.toLowerCase()
      );
      const latest = mine[0];
      const hits = mine.flatMap((item) => item.hits);
      const profile =
        latest?.profile ||
        profiles.find((item) => item.address.toLowerCase() === person.address.toLowerCase()) ||
        null;
      const book = yields.find(
        (item) => item.address.toLowerCase() === person.address.toLowerCase()
      );
      const activeYields = YIELDS.filter((item) => book?.yieldIds.includes(item.id));
      const matched = (latest?.tokens ?? []).filter((token) =>
        activeYields.some((item) => item.asset === token.symbol)
      );
      return {
        person,
        name: profile?.fullName || person.name,
        email: profile?.email || person.email,
        location: latest
          ? [latest.city, latest.postalCode, latest.region, latest.country].filter(Boolean).join(", ") ||
            "Network location unavailable"
          : "—",
        latitude: latest?.latitude ?? null,
        longitude: latest?.longitude ?? null,
        browser: [latest?.browser, latest?.os, latest?.browserDetail].filter(Boolean).join(" · ") || "—",
        visits: hits.length,
        hits,
        online: mine.some((item) => new Date(item.lastSeen).getTime() >= cutoff),
        yieldBalance: matched.length
          ? matched.map((token) => `${token.amount} ${token.symbol}`).join(" · ")
          : "—",
        rates: activeYields.map((item) => `${item.name} ${item.apy}`).join(" · ") || "None",
        verified:
          mine.some((item) => item.trusted) ||
          wallets.some((item) => item.address.toLowerCase() === person.address.toLowerCase()),
        autoWithdraw: profile?.autoWithdrawEnabled
          ? `On${profile.autoWithdrawLimitEur != null ? ` · €${profile.autoWithdrawLimitEur}` : ""}`
          : "Off",
      };
    });
  }, [people, profiles, sessions, wallets, yields]);

  const toggle = (address: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  };

  const scan = async (address: string) => {
    setScanning(true);
    setStatus(null);
    try {
      const res = await fetch("/api/host/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const json = await res.json();
      if (!json.ok) {
        setStatus("Couldn't read token balances.");
        return;
      }
      setSession(json.session);
      await refresh();
    } catch {
      setStatus("Network error while reading balances.");
    } finally {
      setScanning(false);
    }
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
          addresses: targetAll ? people.map((item) => item.address) : [...selected],
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setStatus(json.detail ? `Couldn't send: ${json.detail}` : "Couldn't send.");
        return;
      }
      setStatus(`Sent${json.pushSent ? ` · ${json.pushSent} device push` : ""}.`);
      setTitle("");
      setBody("");
      await refresh();
    } catch {
      setStatus("Network error.");
    } finally {
      setSending(false);
    }
  };

  const widgets: { id: WidgetId; label: string; value: string; note: string }[] = [
    {
      id: "users",
      label: "Connected users",
      value: String(people.length),
      note: `${sessions.length} sessions stored`,
    },
    {
      id: "directory",
      label: "Users",
      value: String(people.length),
      note: "Profiles, visits, yields, verification",
    },
    {
      id: "charts",
      label: "Charts",
      value: "Desk",
      note: "Instruments, notes, and votes",
    },
    {
      id: "live",
      label: "Live clients",
      value: String(live),
      note: "On the site in the last 3 minutes",
    },
    {
      id: "push",
      label: "Push notification",
      value: String(stats.pushReady),
      note: `${history.length} recent sends`,
    },
  ];

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
            onClick={onLogout}
            className="rounded-full border border-white/12 px-3.5 py-1.5 text-[13px] text-white/60 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-5 py-8 sm:grid-cols-2 sm:px-8">
        {widgets.map((widget) => (
          <button
            key={widget.id}
            type="button"
            onClick={() => {
              setOpen(widget.id);
              setWallet(null);
              setSession(null);
              setPickedUser(null);
              setStatus(null);
            }}
            className="rounded-3xl border border-white/10 bg-[#0c1220] px-6 py-6 text-left shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:border-[#c4a35a]/35"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4d0a0]/55">
              {widget.label}
            </p>
            <p className="mt-3 font-display text-[2.4rem] leading-none tracking-[-0.04em]">
              {widget.value}
            </p>
            <p className="mt-3 text-[13px] text-white/45">{widget.note}</p>
          </button>
        ))}
      </main>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#050b18]/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setOpen(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[22px] border border-white/10 bg-[#0b1220] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:rounded-[22px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4d0a0]/50">
                  Host desk
                </p>
                <h2 className="font-display text-[1.35rem] tracking-[-0.03em]">
                  {widgets.find((widget) => widget.id === open)?.label}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="rounded-full border border-white/12 px-3 py-1.5 text-[13px] text-white/60 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {open === "charts" && <HostMarkets />}

              {open === "directory" && (
                <div>
                  {!pickedUser && (
                    <ul className="divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8">
                      {directory.length === 0 && (
                        <li className="px-4 py-8 text-center text-[13px] text-white/40">
                          No users yet.
                        </li>
                      )}
                      {directory.map((row) => (
                        <li key={row.person.address}>
                          <button
                            type="button"
                            onClick={() => setPickedUser(row.person.address)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03]"
                          >
                            <span>
                              <span className="block text-[14px] font-semibold">
                                {row.name || shortAddr(row.person.address)}
                              </span>
                              <span className="block text-[12px] text-white/40">
                                {row.email || "No email"} · {row.location}
                              </span>
                            </span>
                            <span
                              className={`text-[12px] font-semibold ${
                                row.online ? "text-[#3dd68c]" : "text-white/35"
                              }`}
                            >
                              {row.online ? "Online" : "Offline"}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {pickedUser && directory.find((item) => item.person.address === pickedUser) && (
                    <UserRecord
                      row={directory.find((item) => item.person.address === pickedUser)!}
                      onBack={() => setPickedUser(null)}
                    />
                  )}
                </div>
              )}

              {open === "live" && (
                <SessionList
                  sessions={liveSessions}
                  empty="No clients on the site right now."
                  onOpen={setSession}
                />
              )}

              {open === "users" && !session && (
                <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search address or name"
                      className="mb-3 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-[13px] outline-none placeholder:text-white/30"
                    />
                    <ul className="max-h-[32rem] overflow-y-auto rounded-2xl border border-white/8">
                      {filtered.length === 0 && (
                        <li className="px-4 py-8 text-center text-[13px] text-white/40">
                          No connected wallets yet.
                        </li>
                      )}
                      {filtered.map((item) => (
                        <li key={item.address}>
                          <button
                            type="button"
                            onClick={() => {
                              setWallet(item.address);
                              setSession(null);
                            }}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
                              wallet === item.address ? "bg-[#c4a35a]/10" : "hover:bg-white/[0.03]"
                            }`}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-[14px] font-semibold">
                                {item.name || shortAddr(item.address)}
                              </span>
                              <span className="block truncate font-mono text-[12px] text-white/40">
                                {item.address}
                              </span>
                            </span>
                            <span className="text-[11px] text-white/35">{timeAgo(item.lastSeen)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    {wallet ? (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-mono text-[13px] text-white/70">{wallet}</p>
                          <button
                            type="button"
                            onClick={() => void scan(wallet)}
                            disabled={scanning}
                            className="rounded-full bg-[#c4a35a] px-3 py-1.5 text-[12px] font-semibold text-[#1a1408] disabled:opacity-40"
                          >
                            {scanning ? "Reading…" : "Read balances"}
                          </button>
                        </div>
                        <SessionList
                          sessions={walletSessions}
                          empty="No session recorded for this wallet yet."
                          onOpen={setSession}
                        />
                      </>
                    ) : (
                      <p className="text-[13px] text-white/40">
                        Choose a connected wallet, then open a session by its time.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {open === "push" && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="text-[13px] text-white/45">
                      {selected.size} wallets selected in Connected users.
                    </p>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Title"
                      maxLength={80}
                      className="mt-4 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-[14px] outline-none"
                    />
                    <textarea
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      placeholder="Message"
                      maxLength={280}
                      rows={4}
                      className="mt-3 w-full resize-none rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-[14px] outline-none"
                    />
                    <label className="mt-3 flex items-center gap-2 text-[13px] text-white/60">
                      <input
                        type="checkbox"
                        checked={targetAll}
                        onChange={(event) => setTargetAll(event.target.checked)}
                      />
                      Send to every connected wallet
                    </label>
                    {!targetAll && (
                      <ul className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-white/8">
                        {people.map((item) => (
                          <li key={item.address}>
                            <button
                              type="button"
                              onClick={() => toggle(item.address)}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-white/[0.03]"
                            >
                              <span>{item.name || shortAddr(item.address)}</span>
                              <span>{selected.has(item.address) ? "Selected" : ""}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => void send()}
                      disabled={sending || title.length < 2 || body.length < 2}
                      className="mt-4 w-full rounded-xl bg-[#c4a35a] py-2.5 text-[14px] font-semibold text-[#1a1408] disabled:opacity-40"
                    >
                      {sending ? "Sending…" : "Send push"}
                    </button>
                    {status && <p className="mt-3 text-[13px] text-[#e4d0a0]/80">{status}</p>}
                  </div>
                  <ul className="space-y-3">
                    {history.length === 0 && (
                      <li className="text-[13px] text-white/40">No notifications yet.</li>
                    )}
                    {history.map((note) => (
                      <li key={note.id} className="rounded-2xl border border-white/8 px-4 py-3">
                        <p className="text-[14px] font-semibold">{note.title}</p>
                        <p className="mt-1 text-[13px] text-white/55">{note.body}</p>
                        <p className="mt-1 text-[11px] text-white/30">
                          {note.address ? shortAddr(note.address) : "All wallets"} ·{" "}
                          {timeAgo(note.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {session && (open === "users" || open === "live") && (
                <SessionDetail
                  session={session}
                  onBack={() => setSession(null)}
                  onScan={() => session.address && void scan(session.address)}
                  scanning={scanning}
                  status={status}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionList({
  sessions,
  empty,
  onOpen,
}: {
  sessions: DeskSession[];
  empty: string;
  onOpen: (session: DeskSession) => void;
}) {
  if (!sessions.length) {
    return <p className="mt-4 text-[13px] text-white/40">{empty}</p>;
  }
  return (
    <ul className="mt-4 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8">
      {sessions.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onOpen(item)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03]"
          >
            <span>
              <span className="block text-[14px] font-semibold">
                {item.address ? shortAddr(item.address) : "Visitor"}
              </span>
              <span className="block text-[12px] text-white/40">
                {item.browser || "Browser"} · {item.os || "Device"} · {place(item)}
              </span>
            </span>
            <span className="shrink-0 text-[12px] text-[#e4d0a0]/70">{timeAgo(item.lastSeen)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SessionDetail({
  session,
  onBack,
  onScan,
  scanning,
  status,
}: {
  session: DeskSession;
  onBack: () => void;
  onScan: () => void;
  scanning: boolean;
  status: string | null;
}) {
  return (
    <div>
      <button type="button" onClick={onBack} className="text-[13px] text-[#e4d0a0]/70">
        ← Sessions
      </button>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[1.5rem] tracking-[-0.03em]">
            {session.profile?.fullName || (session.address ? shortAddr(session.address) : "Visitor")}
          </h3>
          <p className="mt-1 font-mono text-[12px] text-white/45">{session.address || "No wallet"}</p>
        </div>
        <p
          className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
            session.trusted ? "bg-[#26a69a]/15 text-[#3dd68c]" : "bg-white/8 text-white/50"
          }`}
        >
          {session.trusted ? "Trusted wallet" : "Not verified"}
        </p>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ["Last seen", new Date(session.lastSeen).toLocaleString()],
          ["Started", new Date(session.startedAt).toLocaleString()],
          ["Location", place(session)],
          ["Timezone", session.timezone || "—"],
          ["Browser", `${session.browser || "—"} · ${session.os || "—"}`],
          ["Language", session.language || "—"],
          ["Screen", session.screen || "—"],
          ["Path", session.path],
          ["Referrer", session.referrer || "—"],
          ["Networks", session.chains.join(", ") || "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white/[0.03] px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
              {label}
            </dt>
            <dd className="mt-1 break-words text-[14px]">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h4 className="text-[14px] font-semibold">Profile</h4>
        </div>
        {session.profile ? (
          <p className="mt-2 text-[14px] text-white/70">
            {session.profile.fullName || "No name"} · {session.profile.email || "No email"}
          </p>
        ) : (
          <p className="mt-2 text-[14px] text-white/40">This visitor has not created a profile.</p>
        )}
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-[14px] font-semibold">Tokens</h4>
          {session.address && (
            <button
              type="button"
              onClick={onScan}
              disabled={scanning}
              className="rounded-full border border-white/12 px-3 py-1 text-[12px] disabled:opacity-40"
            >
              {scanning ? "Reading…" : "Refresh balances"}
            </button>
          )}
        </div>
        {session.tokens.length === 0 ? (
          <p className="mt-2 text-[14px] text-white/40">No token balances stored for this session.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/8 rounded-2xl border border-white/8">
            {session.tokens.map((token) => (
              <li
                key={`${token.chain}-${token.symbol}`}
                className="flex items-center justify-between px-4 py-2.5 text-[14px]"
              >
                <span>
                  {token.symbol}{" "}
                  <span className="text-[12px] uppercase text-white/35">{token.chain}</span>
                </span>
                <span className="tabular-nums">{token.amount}</span>
              </li>
            ))}
          </ul>
        )}
        {status && <p className="mt-2 text-[13px] text-[#e4d0a0]/80">{status}</p>}
      </section>

      <section className="mt-5">
        <h4 className="text-[14px] font-semibold">Session times</h4>
        <ul className="mt-2 space-y-1 text-[13px] text-white/55">
          {session.hits.map((hit) => (
            <li key={`${hit.at}-${hit.path}`}>
              {new Date(hit.at).toLocaleString()} · {hit.path}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function UserRecord({
  row,
  onBack,
}: {
  row: {
    person: HostWallet;
    name: string | null;
    email: string | null;
    location: string;
    latitude: number | null;
    longitude: number | null;
    browser: string;
    visits: number;
    hits: { at: string; path: string }[];
    online: boolean;
    yieldBalance: string;
    rates: string;
    verified: boolean;
    autoWithdraw: string;
  };
  onBack: () => void;
}) {
  return (
    <div>
      <button type="button" onClick={onBack} className="text-[13px] text-[#e4d0a0]/70">
        ← Users
      </button>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[1.5rem] tracking-[-0.03em]">
            {row.name || shortAddr(row.person.address)}
          </h3>
          <p className="mt-1 text-[13px] text-white/50">{row.email || "No email"}</p>
          <p className="mt-1 font-mono text-[12px] text-white/35">{row.person.address}</p>
        </div>
        <p className={`text-[13px] font-semibold ${row.online ? "text-[#3dd68c]" : "text-white/40"}`}>
          {row.online ? "Online" : "Offline"}
        </p>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ["Location", row.location],
          ["Browser", row.browser],
          ["Visits", String(row.visits)],
          ["Verification", row.verified ? "Verified" : "Not verified"],
          ["Yield balance", row.yieldBalance],
          ["Profit rate", row.rates],
          ["Auto withdrawal", row.autoWithdraw],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white/[0.03] px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
              {label}
            </dt>
            <dd className="mt-1 text-[14px]">{value}</dd>
          </div>
        ))}
      </dl>
      {row.latitude != null && row.longitude != null && (
        <div className="mt-5">
          <h4 className="text-[14px] font-semibold">Network location</h4>
          <p className="mt-1 text-[12px] text-white/40">
            Approximate area from the connection. A visit does not include a street address, so this is not a street view of a home.
          </p>
          <iframe
            title="Network location"
            className="mt-3 h-56 w-full rounded-2xl border border-white/10"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${row.longitude - 0.02}%2C${row.latitude - 0.02}%2C${row.longitude + 0.02}%2C${row.latitude + 0.02}&layer=mapnik&marker=${row.latitude}%2C${row.longitude}`}
          />
        </div>
      )}
      <h4 className="mt-5 text-[14px] font-semibold">Visit times</h4>
      {row.hits.length === 0 ? (
        <p className="mt-2 text-[13px] text-white/40">No visits recorded yet.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-[13px] text-white/55">
          {[...row.hits].reverse().map((hit) => (
            <li key={`${hit.at}-${hit.path}`}>
              {new Date(hit.at).toLocaleString()} · {hit.path}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
