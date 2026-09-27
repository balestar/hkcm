import { NextRequest, NextResponse } from "next/server";
import {
  checkHostPassword,
  clearHostCookie,
  isHostAuthorized,
  setHostCookie,
} from "@/lib/hostAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: isHostAuthorized(req) });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  try {
    if (!body?.password || !checkHostPassword(body.password)) {
      return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "host_not_configured" }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true });
  setHostCookie(res);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearHostCookie(res);
  return res;
}
