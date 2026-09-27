import { NextRequest, NextResponse } from "next/server";
import { isAddress, getAddress } from "ethers";
import { supabaseAdmin } from "@/lib/supabase";
import { upsertPushSubscription } from "@/lib/hostInbox";

export const runtime = "nodejs";

type Body = {
  address?: string;
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(req: NextRequest) {
  const json = (await req.json().catch(() => null)) as Body | null;
  if (!json?.address || !isAddress(json.address)) {
    return NextResponse.json({ ok: false, error: "invalid_address" }, { status: 400 });
  }
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return NextResponse.json({ ok: false, error: "invalid_subscription" }, { status: 400 });
  }

  try {
    await upsertPushSubscription(supabaseAdmin(), {
      address: getAddress(json.address),
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notifications/subscribe]", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
