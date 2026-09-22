import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "ethers";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

interface ProfileBody {
  address: string;
  fullName?: string;
  email?: string;
  autoWithdrawEnabled?: boolean;
  autoWithdrawLimitEur?: number | null;
}

/**
 * Per-user HKCM profile + auto-withdrawal settings.
 * Table: hkcm_profiles (create once in Supabase):
 *
 *   create table if not exists public.hkcm_profiles (
 *     address text primary key,
 *     full_name text,
 *     email text,
 *     auto_withdraw_enabled boolean not null default false,
 *     auto_withdraw_limit_eur numeric,
 *     updated_at timestamptz not null default now()
 *   );
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as ProfileBody | null;
    if (!body || !body.address || !isAddress(body.address)) {
      return NextResponse.json({ ok: false, error: "invalid_address" }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { error } = await db.from("hkcm_profiles").upsert(
      {
        address: body.address,
        full_name: body.fullName ?? null,
        email: body.email ?? null,
        auto_withdraw_enabled: body.autoWithdrawEnabled ?? false,
        auto_withdraw_limit_eur:
          typeof body.autoWithdrawLimitEur === "number"
            ? body.autoWithdrawLimitEur
            : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "address" }
    );

    if (error) {
      console.error("[hkcm/profile] upsert failed:", error);
      return NextResponse.json(
        { ok: false, error: "persist_failed", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[hkcm/profile] unexpected:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
