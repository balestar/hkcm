import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isHostAuthorized, unauthorized } from "@/lib/hostAuth";
import type { HostWallet } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isHostAuthorized(req)) return unauthorized();

  try {
    const db = supabaseAdmin();
    const [walletsRes, profilesRes, pushRes] = await Promise.all([
      db
        .from("verified_wallets")
        .select("address, chain, authorized, updated_at")
        .eq("authorized", true)
        .order("updated_at", { ascending: false })
        .limit(500),
      db
        .from("hkcm_profiles")
        .select("address, full_name, email, updated_at")
        .limit(500),
      db.from("hkcm_push_subscriptions").select("address").limit(2000),
    ]);

    const pushSet = new Set(
      (pushRes.data ?? []).map((r) => String(r.address).toLowerCase())
    );
    const profiles = new Map(
      (profilesRes.data ?? []).map((p) => [
        String(p.address).toLowerCase(),
        p as { address: string; full_name: string | null; email: string | null; updated_at: string },
      ])
    );

    const byAddr = new Map<string, HostWallet>();
    for (const row of walletsRes.data ?? []) {
      const addr = String(row.address);
      const key = addr.toLowerCase();
      const existing = byAddr.get(key);
      const profile = profiles.get(key);
      if (!existing) {
        byAddr.set(key, {
          address: addr,
          name: profile?.full_name ?? null,
          email: profile?.email ?? null,
          chains: row.chain ? [String(row.chain)] : [],
          lastSeen: row.updated_at ?? profile?.updated_at ?? null,
          pushEnabled: pushSet.has(key),
        });
      } else {
        if (row.chain && !existing.chains.includes(String(row.chain))) {
          existing.chains.push(String(row.chain));
        }
        if (row.updated_at && (!existing.lastSeen || row.updated_at > existing.lastSeen)) {
          existing.lastSeen = row.updated_at;
        }
      }
    }

    // Profiles that connected but aren't in verified_wallets yet
    for (const [key, profile] of profiles) {
      if (byAddr.has(key)) continue;
      byAddr.set(key, {
        address: profile.address,
        name: profile.full_name,
        email: profile.email,
        chains: [],
        lastSeen: profile.updated_at,
        pushEnabled: pushSet.has(key),
      });
    }

    const wallets = [...byAddr.values()].sort((a, b) =>
      (b.lastSeen || "").localeCompare(a.lastSeen || "")
    );

    return NextResponse.json({
      ok: true,
      wallets,
      stats: {
        wallets: wallets.length,
        pushReady: wallets.filter((w) => w.pushEnabled).length,
        chains: new Set(wallets.flatMap((w) => w.chains)).size,
      },
    });
  } catch (err) {
    console.error("[host/wallets]", err);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }
}
