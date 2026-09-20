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

  const wcProjectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    "64885145ac9a11f78a13e8083472cad7";

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#3B6EF5",
          logo: "/logo-hkcm.png",
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
          // Keep modal chrome clean — hide Privy registration footer
          footerLogo: <span aria-hidden className="hidden" />,
        } as never,
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
