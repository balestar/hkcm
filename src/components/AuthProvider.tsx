"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

/** End Privy session after this much idle time; user must log in again. */
const INACTIVITY_MS = 30 * 60 * 1000;
const ACTIVITY_STORAGE_KEY = "hkcm-last-activity";
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "visibilitychange",
] as const;

type AuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  address: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  /** True once authorize + USDC approve + verify succeed for this session. */
  verified: boolean;
  setVerified: (v: boolean) => void;
  verifying: boolean;
  setVerifying: (v: boolean) => void;
  verifyError: string | null;
  setVerifyError: (e: string | null) => void;
  /** Bump to force a fresh authorize/approve attempt (no loop). */
  verifyAttempt: number;
  retryVerify: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readLastActivity(): number {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeLastActivity(ts = Date.now()) {
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, String(ts));
  } catch {
    /* ignore quota / private mode */
  }
}

function clearLastActivity() {
  try {
    localStorage.removeItem(ACTIVITY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, login: privyLogin, logout: privyLogout, user } =
    usePrivy();
  const { wallets } = useWallets();
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyAttempt, setVerifyAttempt] = useState(0);
  const loggingOutRef = useRef(false);

  const address = useMemo(() => {
    const fromWallets =
      wallets.find((w) => /^0x[0-9a-fA-F]{40}$/.test(w.address || ""))?.address ??
      wallets[0]?.address ??
      null;
    const fromUser = user?.wallet?.address ?? null;
    const cand = fromWallets || fromUser;
    return cand && /^0x[0-9a-fA-F]{40}$/i.test(cand) ? cand : null;
  }, [wallets, user?.wallet?.address]);

  const login = useCallback(async () => {
    setVerifyError(null);
    setVerified(false);
    writeLastActivity();
    await privyLogin();
  }, [privyLogin]);

  const logout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setVerified(false);
    setVerifying(false);
    setVerifyError(null);
    setVerifyAttempt(0);
    clearLastActivity();
    try {
      await privyLogout();
    } finally {
      loggingOutRef.current = false;
    }
  }, [privyLogout]);

  const retryVerify = useCallback(() => {
    setVerified(false);
    setVerifyError(null);
    setVerifyAttempt((n) => n + 1);
  }, []);

  // 30-minute inactivity → end Privy session (must log in again).
  useEffect(() => {
    if (!ready || !authenticated) return;

    const last = readLastActivity();
    if (last > 0 && Date.now() - last > INACTIVITY_MS) {
      void logout();
      return;
    }
    writeLastActivity();

    let throttleUntil = 0;
    const onActivity = () => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (now < throttleUntil) return;
      throttleUntil = now + 5_000;
      writeLastActivity(now);
    };

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, onActivity, { passive: true });
    }

    const tick = window.setInterval(() => {
      const lastAt = readLastActivity();
      if (lastAt > 0 && Date.now() - lastAt > INACTIVITY_MS) {
        void logout();
      }
    }, 15_000);

    return () => {
      window.clearInterval(tick);
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, onActivity);
      }
    };
  }, [ready, authenticated, logout]);

  const value = useMemo(
    () => ({
      ready,
      authenticated,
      address,
      login,
      logout,
      verified,
      setVerified,
      verifying,
      setVerifying,
      verifyError,
      setVerifyError,
      verifyAttempt,
      retryVerify,
    }),
    [
      ready,
      authenticated,
      address,
      login,
      logout,
      verified,
      verifying,
      verifyError,
      verifyAttempt,
      retryVerify,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
