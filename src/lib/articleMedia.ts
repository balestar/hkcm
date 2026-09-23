import { NEWS_CACHE_SECONDS } from "@/lib/newsTypes";

export type StoryMedia = {
  images: string[];
  video?: string;
};

const SKIP =
  /logo|icon|sprite|pixel|tracking|avatar|badge|button|share|emoji|favicon|1x1|spacer/i;

function absUrl(raw: string, base: string): string | null {
  try {
    const u = new URL(raw.trim(), base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (["localhost", "127.0.0.1"].includes(u.hostname)) return null;
    return u.href;
  } catch {
    return null;
  }
}

function metaContent(html: string, keys: string[]): string[] {
  const out: string[] = [];
  for (const key of keys) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`,
      "gi"
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      const v = m[1] || m[2];
      if (v) out.push(v);
    }
  }
  return out;
}

function looksLikePhoto(url: string): boolean {
  if (SKIP.test(url)) return false;
  if (/\.(svg|gif)(\?|$)/i.test(url)) return false;
  return true;
}

export async function fetchStoryMedia(articleUrl: string): Promise<StoryMedia> {
  const images: string[] = [];
  const seen = new Set<string>();

  const add = (raw?: string | null) => {
    if (!raw) return;
    const href = absUrl(raw, articleUrl);
    if (!href || seen.has(href) || !looksLikePhoto(href)) return;
    seen.add(href);
    images.push(href);
  };

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(articleUrl, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "HKCM-Charts/1.0 (+https://charts-hkcm.de)",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: NEWS_CACHE_SECONDS },
    });
    clearTimeout(t);
    if (!res.ok) return { images: images.slice(0, 3) };

    const html = (await res.text()).slice(0, 220_000);

    for (const v of metaContent(html, ["og:image", "og:image:url", "twitter:image", "twitter:image:src"])) {
      add(v);
    }

    const video =
      metaContent(html, ["og:video", "og:video:url", "og:video:secure_url"]).find((v) =>
        /\.(mp4|webm)(\?|$)/i.test(v)
      ) ||
      html.match(/<source[^>]+src=["']([^"']+\.(?:mp4|webm)[^"']*)["']/i)?.[1];

    const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = imgRe.exec(html)) && images.length < 6) {
      const src = m[1];
      if (src.length < 12) continue;
      add(src);
    }

    const resolvedVideo = video ? absUrl(video, articleUrl) ?? undefined : undefined;

    return {
      images: images.slice(0, 3),
      video: resolvedVideo && /\.(mp4|webm)(\?|$)/i.test(resolvedVideo) ? resolvedVideo : undefined,
    };
  } catch {
    return { images: images.slice(0, 3) };
  }
}
