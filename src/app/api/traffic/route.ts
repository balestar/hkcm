import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "ethers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { supabaseAdmin } from "@/lib/supabase";
import { isSessionId, upsertSession } from "@/lib/deskSessions";

export const runtime = "nodejs";

function header(req: NextRequest, name: string) {
  return req.headers.get(name)?.trim() || null;
}

function text(value: unknown, max = 80) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function num(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
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
    browserDetail?: string;
    address?: string;
  } | null;
  if (!body?.id || !isSessionId(body.id)) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 400 });
  }
  const address = body.address && isAddress(body.address) ? body.address : null;
  type CfGeo = {
    country?: unknown;
    region?: unknown;
    city?: unknown;
    postalCode?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    timezone?: unknown;
  };
  let cf: CfGeo | undefined;
  try {
    cf = getCloudflareContext().cf as CfGeo | undefined;
  } catch {
    cf = undefined;
  }
  try {
    const db = supabaseAdmin();
    await upsertSession(db, {
      id: body.id,
      path: body.path || "/",
      referrer: body.referrer,
      country: text(cf?.country) || header(req, "cf-ipcountry"),
      region: text(cf?.region) || header(req, "cf-region"),
      city: text(cf?.city) || header(req, "cf-ipcity"),
      postalCode: text(cf?.postalCode, 20),
      latitude: num(cf?.latitude),
      longitude: num(cf?.longitude),
      timezone: body.timezone || text(cf?.timezone) || header(req, "cf-timezone"),
      browser: body.browser,
      os: body.os,
      language: body.language,
      userAgent: header(req, "user-agent"),
      screen: body.screen,
      browserDetail: body.browserDetail,
      address,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[traffic]", err);
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }
}
