import { NextResponse } from "next/server";
import { loadMarketsBoard } from "@/lib/deskMarketsStore";
import { instrumentById, toPickItem } from "@/lib/marketUniverse";
import { eurUsdRate, liveFor } from "@/lib/marketQuotes";

export const runtime = "nodejs";

export async function GET() {
  try {
    const board = await loadMarketsBoard();
    const fx = await eurUsdRate();
    const items = await Promise.all(
      board.items.map(async (saved) => {
        const inst = instrumentById(saved.id);
        if (!inst) return null;
        const live = await liveFor(inst, fx);
        return toPickItem(inst, saved, live);
      })
    );

    return NextResponse.json(
      {
        ok: true,
        updatedAt: board.updatedAt,
        items: items.filter(Boolean),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=90",
        },
      }
    );
  } catch (err) {
    console.error("[markets GET]", err);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }
}
