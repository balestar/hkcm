import { NextRequest, NextResponse } from "next/server";
import { isHostAuthorized, unauthorized } from "@/lib/hostAuth";
import { loadMarketsBoard, saveMarketsBoard } from "@/lib/deskMarketsStore";
import {
  MARKET_CATEGORIES,
  MARKET_UNIVERSE,
  instrumentById,
  searchUniverse,
  toPickItem,
  type SavedDeskPick,
} from "@/lib/marketUniverse";
import { eurUsdRate, liveFor, trendingSymbols } from "@/lib/marketQuotes";
import { EXPERTS } from "@/lib/aboutContent";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isHostAuthorized(req)) return unauthorized();
  try {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const [board, fx, trending] = await Promise.all([
      loadMarketsBoard(),
      eurUsdRate(),
      trendingSymbols(),
    ]);

    const catalog = searchUniverse(q);
    const boardItems = await Promise.all(
      board.items.map(async (saved) => {
        const inst = instrumentById(saved.id);
        if (!inst) return null;
        return {
          saved,
          pick: toPickItem(inst, saved, await liveFor(inst, fx)),
        };
      })
    );

    const trendIds = trending
      .map((sym) => MARKET_UNIVERSE.find((i) => i.symbol === sym)?.id)
      .filter((id): id is string => !!id);

    return NextResponse.json({
      ok: true,
      categories: MARKET_CATEGORIES,
      analysts: EXPERTS.map((e) => ({ id: e.id, name: e.name, role: e.role })),
      trending: trendIds,
      board: {
        updatedAt: board.updatedAt,
        items: boardItems.filter(Boolean),
      },
      catalog: catalog.map((inst) => ({
        id: inst.id,
        symbol: inst.symbol,
        name: inst.name,
        kind: inst.kind,
      })),
    });
  } catch (err) {
    console.error("[host/markets GET]", err);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isHostAuthorized(req)) return unauthorized();
  try {
    const json = (await req.json().catch(() => null)) as { items?: SavedDeskPick[] } | null;
    const incoming = Array.isArray(json?.items) ? json.items : [];
    const items = incoming.filter((row) => row && instrumentById(String(row.id || "")));
    if (!items.length) {
      return NextResponse.json({ ok: false, error: "empty_board" }, { status: 400 });
    }
    const board = await saveMarketsBoard(items);
    return NextResponse.json({ ok: true, updatedAt: board.updatedAt, stored: board.items.length });
  } catch (err) {
    console.error("[host/markets POST]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "save_failed" },
      { status: 500 }
    );
  }
}
