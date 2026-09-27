import { NextRequest, NextResponse } from "next/server";
import { isAddress, getAddress } from "ethers";
import { supabaseAdmin } from "@/lib/supabase";
import { listNotifications } from "@/lib/hostInbox";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("address");
  if (!raw || !isAddress(raw)) {
    return NextResponse.json({ ok: false, error: "invalid_address" }, { status: 400 });
  }

  try {
    const items = await listNotifications(supabaseAdmin(), {
      address: getAddress(raw),
      limit: 40,
    });
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("[notifications GET]", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
