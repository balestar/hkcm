"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AccountSummary } from "@/components/AccountSummary";
import { useAuth } from "@/components/AuthProvider";
import {
  CreateProfileModal,
  loadProfile,
  type UserProfile,
} from "@/components/CreateProfileModal";
import { NewsPanel } from "@/components/NewsPanel";
import { ProfilePage } from "@/components/ProfilePage";
import { SiteFooter } from "@/components/SiteFooter";
import { TimeGreeting } from "@/components/TimeGreeting";
import { TopPicksPanel } from "@/components/TopPicksPanel";
import { WalletChip } from "@/components/WalletChip";
import { YieldsPanel } from "@/components/YieldsPanel";

export function Dashboard() {
  const { address } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    setProfile(loadProfile(address));
    setProfileReady(true);
  }, [address]);

  const needsProfile = profileReady && !!address && !profile;

  if (showProfile && address) {
    return (
      <>
        {needsProfile && (
          <CreateProfileModal address={address} onCreated={setProfile} />
        )}
        <ProfilePage
          address={address}
          fullName={profile?.fullName}
          email={profile?.email}
          onBack={() => setShowProfile(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-dvh">
      {needsProfile && address && (
        <CreateProfileModal address={address} onCreated={setProfile} />
      )}

      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_86%,white)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-hkcm.png"
              alt="HKCM"
              width={120}
              height={32}
              className="h-7 w-auto"
              priority
            />
          </div>
          <WalletChip onOpenProfile={() => setShowProfile(true)} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        <div className="animate-rise mb-6">
          <TimeGreeting name={profile?.fullName} />
          <p className="mt-2 text-[15px] text-body">
            Your brief — balances, yields, and what Europe is watching.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:gap-5">
          <AccountSummary />
          <YieldsPanel />
          <TopPicksPanel />
          <NewsPanel />
        </div>
      </main>

      <SiteFooter variant="light" />
    </div>
  );
}
