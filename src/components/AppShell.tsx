"use client";

import { useAuth } from "@/components/AuthProvider";
import { Dashboard } from "@/components/Dashboard";
import { Landing } from "@/components/Landing";

export function AppShell() {
  const { isLoggedIn, ready } = useAuth();

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  return isLoggedIn ? <Dashboard /> : <Landing />;
}
