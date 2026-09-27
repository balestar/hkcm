import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const HOST_COOKIE = "hkcm_host";
const MAX_AGE = 60 * 60 * 12; // 12h

function secret(): string {
  const s = process.env.HOST_ADMIN_SECRET?.trim();
  if (!s) throw new Error("HOST_ADMIN_SECRET missing");
  return s;
}

export function hostToken(): string {
  return createHmac("sha256", secret()).update("hkcm-host-session").digest("hex");
}

export function isHostAuthorized(req: NextRequest): boolean {
  try {
    const cookie = req.cookies.get(HOST_COOKIE)?.value;
    const header = req.headers.get("authorization");
    const bearer = header?.toLowerCase().startsWith("bearer ")
      ? header.slice(7).trim()
      : "";
    const expected = hostToken();
    const candidates = [cookie, bearer].filter(Boolean) as string[];
    return candidates.some((got) => {
      const a = Buffer.from(got);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    });
  } catch {
    return false;
  }
}

export function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export function setHostCookie(res: NextResponse) {
  res.cookies.set(HOST_COOKIE, hostToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearHostCookie(res: NextResponse) {
  res.cookies.set(HOST_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function checkHostPassword(password: string): boolean {
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(secret());
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
