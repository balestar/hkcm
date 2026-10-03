import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "ethers";
import { supabaseAdmin } from "@/lib/supabase";
import { isHostAuthorized, unauthorized } from "@/lib/hostAuth";
import { listSessions, listYieldBooks, snapshotTokens, upsertSession } from "@/lib/deskSessions";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isHostAuthorized(req)) return unauthorized();
  try {
    const db = supabaseAdmin();
    const [sessions, yields] = await Promise.all([
      listSessions(db, 250),
      listYieldBooks(db),
    ]);
    const liveCutoff = Date.now() - 3 * 60_000;
    return NextResponse.json({
      ok: true,
      sessions,
      yields,
      live: sessions.filter((session) => new Date(session.lastSeen).getTime() >= liveCutoff).length,
    });
  } catch (err) {
    console.error("[host/sessions]", err);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isHostAuthorized(req)) return unauthorized();
  const body = (await req.json().catch(() => null)) as { address?: string } | null;
  if (!body?.address || !isAddress(body.address)) {
    return NextResponse.json({ ok: false, error: "invalid_address" }, { status: 400 });
  }
  try {
    const db = supabaseAdmin();
    const tokens = await snapshotTokens(body.address);
    const sessions = await listSessions(db, 250);
    const latest = sessions.find(
      (session) => session.address?.toLowerCase() === body.address!.toLowerCase()
    );
    const id = latest?.id ?? crypto.randomUUID();
    const session = await upsertSession(db, {
      id,
      path: latest?.path || "/host-snapshot",
      address: body.address,
      scanTokens: true,
      country: latest?.country,
      region: latest?.region,
      city: latest?.city,
      timezone: latest?.timezone,
      browser: latest?.browser,
      os: latest?.os,
      language: latest?.language,
      screen: latest?.screen,
      referrer: latest?.referrer,
    });
    if (!session.tokens.length && tokens.length) session.tokens = tokens;
    return NextResponse.json({ ok: true, session });
  } catch (err) {
    console.error("[host/sessions] snapshot", err);
    return NextResponse.json({ ok: false, error: "snapshot_failed" }, { status: 500 });
  }
}
