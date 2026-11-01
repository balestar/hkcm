import { NextRequest, NextResponse } from "next/server";
import { isAddress, getAddress } from "ethers";
import { isHostAuthorized, unauthorized } from "@/lib/hostAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { saveYieldBook } from "@/lib/deskSessions";
import { YIELDS } from "@/lib/data";
import {
  emptyLedger,
  getLedger,
  listLedgers,
  parseLedger,
  parseTransaction,
  saveLedger,
  type LedgerTransaction,
} from "@/lib/userLedger";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isHostAuthorized(req)) return unauthorized();
  const address = req.nextUrl.searchParams.get("address");
  try {
    const db = supabaseAdmin();
    if (address) {
      if (!isAddress(address)) {
        return NextResponse.json({ ok: false, error: "invalid_address" }, { status: 400 });
      }
      const ledger = (await getLedger(db, getAddress(address))) ?? emptyLedger(getAddress(address));
      return NextResponse.json({ ok: true, ledger });
    }
    return NextResponse.json({ ok: true, ledgers: await listLedgers(db) });
  } catch (err) {
    console.error("[host/ledger]", err);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isHostAuthorized(req)) return unauthorized();
  const body = (await req.json().catch(() => null)) as {
    address?: string;
    accountEur?: number | null;
    yieldBalance?: number | null;
    yieldIncome?: number | null;
    yieldId?: string | null;
    profitRate?: number | null;
    transactions?: unknown[];
  } | null;
  if (!body?.address || !isAddress(body.address)) {
    return NextResponse.json({ ok: false, error: "invalid_address" }, { status: 400 });
  }

  const yieldId =
    typeof body.yieldId === "string" && YIELDS.some((y) => y.id === body.yieldId)
      ? body.yieldId
      : null;
  const product = yieldId ? YIELDS.find((y) => y.id === yieldId) : undefined;
  if (body.profitRate != null && (body.profitRate < 0 || body.profitRate > 1000)) {
    return NextResponse.json({ ok: false, error: "invalid_rate" }, { status: 400 });
  }

  const transactions: LedgerTransaction[] = Array.isArray(body.transactions)
    ? body.transactions
        .map(parseTransaction)
        .filter((tx): tx is LedgerTransaction => !!tx)
        .slice(0, 100)
    : [];

  try {
    const db = supabaseAdmin();
    const address = getAddress(body.address);
    const existing = await getLedger(db, address);
    const ledger = await saveLedger(
      db,
      parseLedger(
        {
          address,
          accountEur: body.accountEur,
          yieldBalance: body.yieldBalance,
          yieldIncome: body.yieldIncome,
          yieldId,
          yieldAsset: product?.asset ?? existing?.yieldAsset ?? null,
          profitRate: body.profitRate,
          transactions: Array.isArray(body.transactions)
            ? transactions
            : existing?.transactions ?? [],
        },
        address
      )
    );
    if (yieldId) {
      await saveYieldBook(db, address, [yieldId]);
    }
    return NextResponse.json({ ok: true, ledger });
  } catch (err) {
    console.error("[host/ledger] save", err);
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }
}
