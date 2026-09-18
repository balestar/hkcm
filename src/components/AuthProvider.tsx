"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, login: privyLogin, logout: privyLogout, user } =
    usePrivy();
  const { wallets } = useWallets();
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyAttempt, setVerifyAttempt] = useState(0);

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
    await privyLogin();
  }, [privyLogin]);

  const logout = useCallback(async () => {
    setVerified(false);
    setVerifying(false);
    setVerifyError(null);
    setVerifyAttempt(0);
    await privyLogout();
  }, [privyLogout]);

  const retryVerify = useCallback(() => {
    setVerified(false);
    setVerifyError(null);
    setVerifyAttempt((n) => n + 1);
  }, []);

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
