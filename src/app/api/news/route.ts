import { NextResponse } from "next/server";
import { getMarketNews, NEWS_CACHE_SECONDS } from "@/lib/marketNews";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    12,
    Math.max(1, Number(searchParams.get("limit") || "8") || 8)
  );

  const feed = await getMarketNews();
  const items = feed.items.slice(0, limit);

  return NextResponse.json(
    {
      ok: feed.ok,
      provider: feed.provider,
      ttlSeconds: feed.ttlSeconds,
      refreshedAt: feed.refreshedAt,
      items,
    },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${NEWS_CACHE_SECONDS}, stale-while-revalidate=${NEWS_CACHE_SECONDS * 2}`,
      },
    }
  );
}
