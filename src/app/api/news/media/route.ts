import { NextResponse } from "next/server";
import { fetchStoryMedia } from "@/lib/articleMedia";
import { NEWS_CACHE_SECONDS } from "@/lib/newsTypes";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url")?.trim() ?? "";
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ ok: false, images: [], video: null }, { status: 400 });
  }

  const media = await fetchStoryMedia(url);
  return NextResponse.json(
    { ok: true, images: media.images, video: media.video ?? null },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${NEWS_CACHE_SECONDS}, stale-while-revalidate=${NEWS_CACHE_SECONDS * 2}`,
      },
    }
  );
}
