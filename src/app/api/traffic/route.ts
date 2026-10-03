import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "ethers";
import { supabaseAdmin } from "@/lib/supabase";
import { isSessionId, upsertSession } from "@/lib/deskSessions";

export const runtime = "nodejs";

function header(req: NextRequest, name: string) {
  return req.headers.get(name)?.trim() || null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    path?: string;
    referrer?: string;
    timezone?: string;
    browser?: string;
    os?: string;
    language?: string;
    screen?: string;
    address?: string;
  } | null;
  if (!body?.id || !isSessionId(body.id)) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 400 });
  }
  const address = body.address && isAddress(body.address) ? body.address : null;
  try {
    const db = supabaseAdmin();
    await upsertSession(db, {
      id: body.id,
      path: body.path || "/",
      referrer: body.referrer,
      country: header(req, "cf-ipcountry"),
      region: header(req, "cf-region") || header(req, "cf-region-code"),
      city: header(req, "cf-ipcity"),
      timezone: body.timezone || header(req, "cf-timezone"),
      browser: body.browser,
      os: body.os,
      language: body.language,
      userAgent: header(req, "user-agent"),
      screen: body.screen,
      address,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[traffic]", err);
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }
}
