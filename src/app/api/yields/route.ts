import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "ethers";
import { getYieldBook, saveYieldBook } from "@/lib/deskSessions";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  try {
    const book = await getYieldBook(supabaseAdmin(), address);
    return NextResponse.json({ ok: true, yieldIds: book?.yieldIds ?? [] });
  } catch (err) {
    console.error("[yields] get", err);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    address?: string;
    yieldIds?: string[];
  } | null;
  if (!body?.address || !isAddress(body.address) || !Array.isArray(body.yieldIds)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  try {
    await saveYieldBook(
      supabaseAdmin(),
      body.address,
      body.yieldIds.filter((id) => typeof id === "string")
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[yields]", err);
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }
}
