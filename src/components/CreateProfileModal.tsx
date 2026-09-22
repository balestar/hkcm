"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatDisplayName } from "@/lib/data";

const STORAGE_PREFIX = "hkcm-profile:";

export type UserProfile = {
  fullName: string;
  email: string;
  createdAt: string;
};

export function profileStorageKey(address: string) {
  return `${STORAGE_PREFIX}${address.toLowerCase()}`;
}

export function loadProfile(address: string | null): UserProfile | null {
  if (!address || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(profileStorageKey(address));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed?.fullName || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(address: string, profile: UserProfile) {
  localStorage.setItem(profileStorageKey(address), JSON.stringify(profile));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Blocks the dashboard until the user creates a name + email profile. */
export function CreateProfileModal({
  address,
  onCreated,
}: {
  address: string;
  onCreated: (profile: UserProfile) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const name = fullName.trim();
    const mail = email.trim();
    if (name.length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!isValidEmail(mail)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setSaving(true);
    const profile: UserProfile = {
      fullName: formatDisplayName(name),
      email: mail,
      createdAt: new Date().toISOString(),
    };
    saveProfile(address, profile);
    onCreated(profile);
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b18]/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-profile-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-[22px] border border-[var(--line)] bg-surface-elevated shadow-[0_28px_80px_rgba(5,12,28,0.35)]">
        <div className="border-b border-[var(--line)] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Welcome
          </p>
          <h2
            id="create-profile-title"
            className="mt-1 font-display text-[1.45rem] tracking-[-0.03em] text-ink"
          >
            Create your profile
          </h2>
          <p className="mt-1.5 text-[14px] text-body">
            Add your name and email to finish setting up your HKCM desk.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="text-[12px] font-semibold text-ink-soft">Full name</span>
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Schmidt"
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-semibold text-ink-soft">Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@email.com"
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          {error && <p className="text-[13px] text-loss">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-1 w-full rounded-full bg-brand px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(59,110,245,0.28)] transition hover:bg-brand-deep disabled:opacity-60"
          >
            {saving ? "Saving…" : "Create profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
