import { NextRequest, NextResponse } from "next/server";

const CDN_ORIGIN = "https://vz-b655a975-a21.b-cdn.net";
const VIDEO_ID = "59b0353f-7982-468a-baa3-b581c04f6d22";
const ALLOWED_PREFIX = `${CDN_ORIGIN}/${VIDEO_ID}/`;

/** Bunny Stream is domain-locked to hkcm.com — proxy with that Referer so localhost works. */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path || path.includes("..") || path.startsWith("/") || path.includes("://")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const upstream = `${ALLOWED_PREFIX}${path}`;
  if (!upstream.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const range = req.headers.get("range");
  const upstreamRes = await fetch(upstream, {
    headers: {
      Referer: "https://hkcm.com/",
      Origin: "https://hkcm.com",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ...(range ? { Range: range } : {}),
    },
    cache: "no-store",
  });

  if (!upstreamRes.ok && upstreamRes.status !== 206) {
    return new NextResponse("Upstream error", { status: upstreamRes.status });
  }

  const contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";
  const isPlaylist = path.endsWith(".m3u8");

  if (isPlaylist) {
    const text = await upstreamRes.text();
    const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
    const rewritten = text
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          // Rewrite URI="..." inside tags
          return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
            const resolved = uri.startsWith("http")
              ? uri
              : `${ALLOWED_PREFIX}${dir}${uri}`;
            if (!resolved.startsWith(ALLOWED_PREFIX)) return `URI="${uri}"`;
            const rel = resolved.slice(ALLOWED_PREFIX.length);
            return `URI="/api/team-video?path=${encodeURIComponent(rel)}"`;
          });
        }
        if (trimmed.startsWith("http")) {
          if (!trimmed.startsWith(ALLOWED_PREFIX)) return line;
          const rel = trimmed.slice(ALLOWED_PREFIX.length);
          return `/api/team-video?path=${encodeURIComponent(rel)}`;
        }
        const rel = `${dir}${trimmed}`;
        return `/api/team-video?path=${encodeURIComponent(rel)}`;
      })
      .join("\n");

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "public, max-age=15",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "public, max-age=3600");
  headers.set("Access-Control-Allow-Origin", "*");
  const len = upstreamRes.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  const cr = upstreamRes.headers.get("content-range");
  if (cr) headers.set("Content-Range", cr);
  const acceptRanges = upstreamRes.headers.get("accept-ranges");
  if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers,
  });
}
