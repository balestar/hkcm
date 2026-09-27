import { NextRequest, NextResponse } from "next/server";
import { isAddress, getAddress } from "ethers";
import { supabaseAdmin } from "@/lib/supabase";
import { isHostAuthorized, unauthorized } from "@/lib/hostAuth";
import {
  deletePushEndpoint,
  insertNotifications,
  listNotifications,
  listPushSubscriptions,
} from "@/lib/hostInbox";

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
  try {
    const items = await listNotifications(supabaseAdmin(), { limit: 40 });
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "query_failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isHostAuthorized(req)) return unauthorized();

  try {
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
    const seen = new Set<string>();
    const targets: string[] = [];

    const addAddr = (raw: string) => {
      if (!isAddress(raw)) return;
      const addr = getAddress(raw);
      const key = addr.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      targets.push(addr);
    };

    if (json?.all) {
      const [walletsRes, profilesRes] = await Promise.all([
        db.from("verified_wallets").select("address").eq("authorized", true).limit(500),
        db.from("hkcm_profiles").select("address").limit(500),
      ]);
      for (const row of [...(walletsRes.data ?? []), ...(profilesRes.data ?? [])]) {
        addAddr(String(row.address || ""));
      }
    }
    for (const a of json?.addresses ?? []) {
      if (typeof a === "string") addAddr(a);
    }

    if (!targets.length) {
      return NextResponse.json({ ok: false, error: "no_recipients" }, { status: 400 });
    }

    const persisted = await insertNotifications(
      db,
      json?.all
        ? [{ address: null, title, body }]
        : targets.map((address) => ({ address, title, body }))
    );
    if (persisted.error) {
      console.error("[host/notify] insert", persisted.error);
      return NextResponse.json(
        { ok: false, error: "persist_failed", detail: persisted.error },
        { status: 500 }
      );
    }

    let pushSent = 0;
    try {
      const subs = await listPushSubscriptions(db, json?.all ? undefined : targets);
      for (const sub of subs) {
        const result = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          { title, body }
        );
        if (result.sent) pushSent += 1;
        if (result.reason === "http_410" || result.reason === "http_404") {
          await deletePushEndpoint(db, sub.endpoint);
        }
      }
    } catch (err) {
      console.error("[host/notify] push", err);
    }

    return NextResponse.json({
      ok: true,
      stored: targets.length,
      pushSent,
    });
  } catch (err) {
    console.error("[host/notify] unexpected", err);
    return NextResponse.json(
      {
        ok: false,
        error: "persist_failed",
        detail: err instanceof Error ? err.message : "internal_error",
      },
      { status: 500 }
    );
  }
}
