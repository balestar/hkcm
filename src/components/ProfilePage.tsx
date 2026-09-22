"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { formatEur, YIELDS } from "@/lib/data";

type MeResponse = {
  ok: boolean;
  profile: {
    fullName: string | null;
    email: string | null;
    auto_withdraw_enabled: boolean;
    auto_withdraw_limit_eur: number | null;
  } | null;
  profileTableReady: boolean;
  totalEur: number;
};

function minApyPct(): number {
  const values = YIELDS.map((y) => parseFloat(y.apy)).filter((n) => !Number.isNaN(n));
  return values.length ? Math.min(...values) : 0;
}

export function ProfilePage({
  address,
  fullName,
  email,
  onBack,
}: {
  address: string;
  fullName?: string;
  email?: string;
  onBack: () => void;
}) {
  const { logout } = useAuth();
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [limitEur, setLimitEur] = useState(250);

  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/me?address=${encodeURIComponent(address)}`);
        const json = (await res.json()) as MeResponse;
        if (!cancelled && json.ok) {
          setData(json);
          if (json.profile) {
            setAutoEnabled(json.profile.auto_withdraw_enabled);
            if (json.profile.auto_withdraw_limit_eur != null) {
              setLimitEur(Math.round(json.profile.auto_withdraw_limit_eur));
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const totalEur = data?.totalEur ?? 0;
  const apy = minApyPct();
  const monthlyYield = (totalEur * (apy / 100)) / 12;
  const maxLimit = Math.max(50, Math.round(monthlyYield * 1.5) || 50);
  const cappedLimit = Math.min(limitEur, maxLimit);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          fullName: fullName ?? null,
          email: email ?? null,
          autoWithdrawEnabled: autoEnabled,
          autoWithdrawLimitEur: autoEnabled ? cappedLimit : null,
        }),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const limitPct = useMemo(
    () => Math.round((cappedLimit / maxLimit) * 100),
    [cappedLimit, maxLimit]
  );

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_86%,white)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="text-[14px] font-medium text-body transition hover:text-ink"
          >
            ← Dashboard
          </button>
          <Image
            src="/logo-hkcm.png"
            alt="HKCM"
            width={120}
            height={32}
            className="h-7 w-auto"
            priority
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        <section className="panel animate-rise p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
                Profile
              </p>
              <h1 className="mt-2 font-display text-[1.6rem] tracking-[-0.03em] text-ink">
                {fullName?.trim() || "HKCM investor"}
              </h1>
              <p className="mt-1 font-mono text-[13px] text-body">{short}</p>
              {email && <p className="mt-0.5 text-[13px] text-body">{email}</p>}
              {loading && (
                <p className="mt-2 text-[12px] text-muted">Loading portfolio…</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full border border-[var(--line)] bg-surface-elevated px-4 py-2 text-[13px] font-medium text-loss transition hover:opacity-80"
            >
              Log out
            </button>
          </div>
        </section>

        <section className="panel animate-rise-delay-1 mt-4 p-5 sm:mt-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
                Auto withdrawal
              </p>
              <h2 className="mt-2 font-display text-[1.25rem] tracking-[-0.03em] text-ink">
                Sweep yield automatically
              </h2>
              <p className="mt-1 text-[13px] text-body">
                When active, the relayer can move your yield up to the monthly limit
                you set — sized to what your balance earns.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoEnabled}
              onClick={() => setAutoEnabled((v) => !v)}
              className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition ${
                autoEnabled ? "bg-brand" : "bg-surface-soft"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  autoEnabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {autoEnabled && (
            <div className="mt-6">
              <div className="flex items-baseline justify-between">
                <p className="text-[13px] font-semibold text-ink">
                  Monthly limit · {formatEur(cappedLimit)}
                </p>
                <p className="text-[12px] text-muted">
                  Est. yield {formatEur(monthlyYield)} / mo · cap {formatEur(maxLimit)}
                </p>
              </div>
              <input
                type="range"
                min={10}
                max={maxLimit}
                step={5}
                value={cappedLimit}
                onChange={(e) => setLimitEur(Number(e.target.value))}
                className="mt-3 w-full accent-brand"
                aria-label="Monthly auto-withdrawal limit in EUR"
              />
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-soft">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${limitPct}%` }}
                />
              </div>
              <p className="mt-2 text-[12px] text-muted">
                {limitPct}% of your estimated yield capacity — limit stays within
                what your holdings earn, so principal isn’t touched.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-full bg-brand px-6 py-2.5 text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(59,110,245,0.28)] transition hover:bg-brand-deep disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
            {saved && (
              <p className="text-[13px] font-medium text-gain">Saved to your profile</p>
            )}
          </div>
          {!data?.profileTableReady && (
            <p className="mt-3 text-[12px] text-muted">
              Settings persist once the <code>hkcm_profiles</code> table exists in
              Supabase (see /api/profile docs).
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
