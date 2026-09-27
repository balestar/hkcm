import { NextRequest, NextResponse } from "next/server";
import { isAddress, getAddress } from "ethers";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("address");
  if (!raw || !isAddress(raw)) {
    return NextResponse.json({ ok: false, error: "invalid_address" }, { status: 400 });
  }
  const address = getAddress(raw);

  try {
    const db = supabaseAdmin();
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await db
      .from("hkcm_notifications")
      .select("id, address, title, body, created_at")
      .or(`address.is.null,address.eq.${address}`)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      items: (data ?? []).map((n) => ({
        id: n.id,
        address: n.address,
        title: n.title,
        body: n.body,
        createdAt: n.created_at,
      })),
    });
  } catch (err) {
    console.error("[notifications GET]", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
