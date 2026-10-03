"use client";

import { useEffect, useState } from "react";
import { HostDesk } from "@/components/HostDesk";

export function HostPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/host/login");
      const json = await res.json();
      setAuthed(!!json.ok);
    })();
  }, []);

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
    } catch {
      setLoginError("Couldn't reach the desk.");
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await fetch("/api/host/login", { method: "DELETE" });
    setAuthed(false);
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
          onSubmit={(event) => {
            event.preventDefault();
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
            Sign in to the host desk.
          </p>
          <label className="mt-6 block text-[12px] font-medium text-white/55">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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

  return <HostDesk onLogout={() => void logout()} />;
}
