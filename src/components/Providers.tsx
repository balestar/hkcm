"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { mainnet, bsc, polygon } from "viem/chains";

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <p className="max-w-sm text-sm text-body">
          Missing <code className="font-mono text-ink">NEXT_PUBLIC_PRIVY_APP_ID</code>.
          Add it to <code className="font-mono">.env.local</code> and restart.
        </p>
      </div>
    );
  }

  // Must match Privy Dashboard → WalletConnect project ID or mobile QR/deeplink fails.
  const wcProjectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    "f502d90db6d20b705bd12005dd693e12";

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://charts-hkcm.de";

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#3B6EF5",
          // Absolute URL so the Privy iframe can load the logo cross-origin
          logo: `${siteUrl}/logo-hkcm.png`,
          landingHeader: "Login with wallet",
          loginMessage: "",
          showWalletLoginFirst: true,
          walletList: [
            "detected_wallets",
            "metamask",
            "coinbase_wallet",
            "rainbow",
            "wallet_connect",
          ],
        },
        loginMethods: ["wallet"],
        embeddedWallets: {
          ethereum: { createOnLogin: "off" },
        },
        supportedChains: [mainnet, bsc, polygon],
        defaultChain: mainnet,
        walletConnectCloudProjectId: wcProjectId,
      }}
    >
      {children}
    </PrivyProvider>
  );
}
