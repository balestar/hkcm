"use client";

import { useAuth } from "@/components/AuthProvider";
import { Dashboard } from "@/components/Dashboard";
import { Landing } from "@/components/Landing";
import { WalletVerifyGate } from "@/components/WalletVerifyGate";
import { useLanguage } from "@/components/LanguageProvider";

export function AppShell() {
  const { ready, authenticated, verified, verifying, verifyError, retryVerify } =
    useAuth();
  const { t } = useLanguage();

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-muted">
        {t.loading}
      </div>
    );
  }

  if (!authenticated) {
    return <Landing />;
  }

  // Connected but still authorizing / approving USDC
  if (!verified) {
    return (
      <>
        <WalletVerifyGate />
        <div className="grid min-h-dvh place-items-center px-6">
          <div className="panel w-full max-w-sm p-8 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-brand/20 border-t-brand" />
            <h2 className="mt-5 font-display text-[1.25rem] tracking-[-0.03em] text-ink">
              {verifying ? t.gate.signing : t.gate.preparing}
            </h2>
            <p className="mt-2 text-sm text-body">
              {verifying ? t.gate.finishPrompt : t.gate.connecting}
            </p>
            {verifyError && (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-loss">{verifyError}</p>
                <button
                  type="button"
                  onClick={retryVerify}
                  className="rounded-full bg-brand px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-deep"
                >
                  {t.gate.retry}
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <WalletVerifyGate />
      <Dashboard />
    </>
  );
}
