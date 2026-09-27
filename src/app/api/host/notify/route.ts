import { NextRequest, NextResponse } from "next/server";
import { isAddress, getAddress } from "ethers";
import { supabaseAdmin } from "@/lib/supabase";
import { isHostAuthorized, unauthorized } from "@/lib/hostAuth";

export const runtime = "nodejs";

type Body = {
  title?: string;
  body?: string;
  addresses?: string[];
  all?: boolean;
};

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string }
) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return { sent: false, reason: "no_vapid" };
  try {
    const webpush = await import("web-push");
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:host@charts-hkcm.de",
      publicKey,
      privateKey
    );
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return { sent: true };
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    return { sent: false, reason: status ? `http_${status}` : "push_failed" };
  }
}

export async function GET(req: NextRequest) {
  if (!isHostAuthorized(req)) return unauthorized();
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("hkcm_notifications")
    .select("id, address, title, body, created_at")
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
}

export async function POST(req: NextRequest) {
  if (!isHostAuthorized(req)) return unauthorized();

  const json = (await req.json().catch(() => null)) as Body | null;
  const title = json?.title?.trim() ?? "";
  const body = json?.body?.trim() ?? "";
  if (title.length < 2 || title.length > 80) {
    return NextResponse.json({ ok: false, error: "invalid_title" }, { status: 400 });
  }
  if (body.length < 2 || body.length > 280) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const db = supabaseAdmin();
  let targets: Array<string | null> = [];

  if (json?.all) {
    targets = [null];
  } else {
    const addrs = (json?.addresses ?? [])
      .filter((a) => typeof a === "string" && isAddress(a))
      .map((a) => getAddress(a));
    if (!addrs.length) {
      return NextResponse.json({ ok: false, error: "no_recipients" }, { status: 400 });
    }
    targets = addrs;
  }

  const rows = targets.map((address) => ({ address, title, body }));
  const { data: inserted, error } = await db
    .from("hkcm_notifications")
    .insert(rows)
    .select("id");

  if (error) {
    console.error("[host/notify] insert", error);
    return NextResponse.json(
      { ok: false, error: "persist_failed", detail: error.message },
      { status: 500 }
    );
  }

  let pushSent = 0;
  try {
    let q = db.from("hkcm_push_subscriptions").select("address, endpoint, p256dh, auth");
    if (!json?.all) {
      q = q.in("address", targets as string[]);
    }
    const { data: subs } = await q.limit(2000);
    for (const sub of subs ?? []) {
      const result = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        { title, body }
      );
      if (result.sent) pushSent += 1;
      if (result.reason === "http_410" || result.reason === "http_404") {
        await db.from("hkcm_push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  } catch (err) {
    console.error("[host/notify] push", err);
  }

  return NextResponse.json({
    ok: true,
    stored: inserted?.length ?? rows.length,
    pushSent,
  });
}
