/** Live market news — Finnhub primary, professional RSS fallback. */

import {
  FALLBACK_NEWS,
  NEWS_CACHE_SECONDS,
  type LiveNewsItem,
  type NewsFeedResponse,
} from "@/lib/newsTypes";

export { FALLBACK_NEWS, NEWS_CACHE_SECONDS };
export type { LiveNewsItem, NewsFeedResponse };

const FALLBACK_COVERS = [
  "/news/dax-floor.jpg",
  "/news/berlin-grid.jpg",
  "/news/ecb-policy.jpg",
  "/news/brussels-markets.jpg",
];

const EU_HINT =
  /\b(eu|europe|euro|ecb|eurozone|brussels|frankfurt|paris|berlin|amsterdam|madrid|milan|stoxx|dax|bund|lagarde|commission|parliament|nato|ukraine|germany|france|italy|spain|netherlands|austria|belgium|ireland|portugal|poland|nordic)\b/i;

type FinnhubArticle = {
  category?: string;
  datetime?: number;
  headline?: string;
  id?: number;
  image?: string;
  source?: string;
  summary?: string;
  url?: string;
};

function isHttpUrl(u?: string | null): u is string {
  return !!u && /^https?:\/\//i.test(u);
}

function coverFor(i: number, image?: string | null): string {
  if (isHttpUrl(image)) return image;
  return FALLBACK_COVERS[i % FALLBACK_COVERS.length];
}

function uniqueMedia(urls: Array<string | undefined | null>, fallback: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    if (!raw) continue;
    const u = raw.trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length >= 3) break;
  }
  if (!out.length) out.push(fallback);
  return out;
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

function categorize(text: string): LiveNewsItem["category"] {
  const t = text.toLowerCase();
  if (/\b(bitcoin|crypto| eth\b|btc|ethereum|token)\b/.test(t)) return "Crypto";
  if (/\b(rate|yield|bond|ecb|fed|inflation|cpi|interest)\b/.test(t)) return "Rates";
  if (
    /\b(parliament|commission|election|minister|coalition|sanction|policy|regulation)\b/.test(
      t
    )
  )
    return "Politics";
  if (/\b(policy|regulation|directive|oversight)\b/.test(t)) return "Policy";
  return "Markets";
}

function bulletsFrom(summary: string): string[] {
  const parts = summary
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 28)
    .slice(0, 3);
  if (parts.length) return parts;
  return [summary.slice(0, 140)];
}

function mapArticle(
  raw: {
    id: string;
    title: string;
    summary: string;
    source: string;
    datetime: number;
    image?: string;
    images?: string[];
    video?: string;
    url?: string;
  },
  index: number
): LiveNewsItem {
  const summary = raw.summary?.trim() || raw.title.trim();
  const category = categorize(`${raw.title} ${summary}`);
  const cover = coverFor(index, raw.image ?? raw.images?.[0]);
  return {
    id: raw.id,
    category,
    title: raw.title.trim(),
    summary: summary.slice(0, 220),
    source: raw.source.trim() || "Markets wire",
    time: formatTime(raw.datetime),
    cover,
    slides: uniqueMedia([raw.image, ...(raw.images ?? [])], cover),
    video: raw.video,
    detail: summary,
    bullets: bulletsFrom(summary),
    url: raw.url,
    publishedAt: raw.datetime,
  };
}

const TITLE_STOP = new Set([
  "the", "and", "for", "with", "from", "that", "this", "into", "over", "after",
  "says", "said", "will", "have", "has", "are", "was", "its", "new", "as",
]);

function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !TITLE_STOP.has(w))
  );
}

/** Extra wire photos from other items covering the same story. */
function attachRelatedSlides(items: LiveNewsItem[]): LiveNewsItem[] {
  const tokens = items.map((it) => titleTokens(it.title));
  return items.map((item, i) => {
    const mine = tokens[i];
    const extras: string[] = [];
    items.forEach((other, j) => {
      if (i === j) return;
      let shared = 0;
      for (const t of mine) if (tokens[j].has(t)) shared += 1;
      if (shared < 2) return;
      if (isHttpUrl(other.cover) && other.cover !== item.cover) extras.push(other.cover);
    });
    const slides = uniqueMedia([...item.slides, ...extras], item.cover);
    return { ...item, slides };
  });
}

function preferEuFirst(items: LiveNewsItem[]): LiveNewsItem[] {
  const eu: LiveNewsItem[] = [];
  const rest: LiveNewsItem[] = [];
  for (const item of items) {
    if (EU_HINT.test(`${item.title} ${item.summary} ${item.source}`)) eu.push(item);
    else rest.push(item);
  }
  return [...eu, ...rest];
}

async function fetchFinnhub(token: string): Promise<LiveNewsItem[] | null> {
  const categories = ["general", "forex", "crypto"] as const;
  const collected: FinnhubArticle[] = [];

  await Promise.all(
    categories.map(async (category) => {
      const res = await fetch(
        `https://finnhub.io/api/v1/news?category=${category}&token=${encodeURIComponent(token)}`,
        { next: { revalidate: NEWS_CACHE_SECONDS } }
      );
      if (!res.ok) return;
      const data = (await res.json()) as FinnhubArticle[];
      if (Array.isArray(data)) collected.push(...data);
    })
  );

  if (!collected.length) return null;

  const seen = new Set<string>();
  const mapped: LiveNewsItem[] = [];
  for (const a of collected) {
    const title = a.headline?.trim();
    if (!title || !a.datetime) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    mapped.push(
      mapArticle(
        {
          id: `fh-${a.id ?? mapped.length}`,
          title,
          summary: a.summary?.trim() || title,
          source: a.source || "Finnhub",
          datetime: a.datetime,
          image: a.image,
          url: a.url,
        },
        mapped.length
      )
    );
  }

  return attachRelatedSlides(preferEuFirst(mapped).slice(0, 12));
}

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function tag(xml: string, name: string): string {
  const re = new RegExp(
    `<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${name}>|<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`,
    "i"
  );
  const m = xml.match(re);
  return decodeXml((m?.[1] ?? m?.[2] ?? "").trim());
}

function parseRssItems(xml: string, sourceFallback: string): LiveNewsItem[] {
  const chunks = xml.split(/<item[\s>]/i).slice(1);
  const out: LiveNewsItem[] = [];
  for (const chunk of chunks) {
    const block = chunk.split(/<\/item>/i)[0] ?? "";
    const title = tag(block, "title");
    if (!title) continue;
    const link = tag(block, "link") || tag(block, "guid");
    const description = tag(block, "description").replace(/<[^>]+>/g, "").trim();
    const pub = tag(block, "pubDate");
    const datetime = pub
      ? Math.floor(new Date(pub).getTime() / 1000)
      : Math.floor(Date.now() / 1000);
    const images = [
      ...Array.from(block.matchAll(/url="(https?:\/\/[^"]+\.(?:jpe?g|png|webp)[^"]*)"/gi)).map(
        (m) => m[1]
      ),
      ...Array.from(block.matchAll(/<media:(?:content|thumbnail)[^>]+url="([^"]+)"/gi)).map(
        (m) => m[1]
      ),
    ];
    const video =
      block.match(
        /<enclosure[^>]+type="video\/[^"]+"[^>]+url="([^"]+)"/i
      )?.[1] ||
      block.match(
        /<enclosure[^>]+url="([^"]+\.(?:mp4|webm)[^"]*)"/i
      )?.[1];
    const media = images[0] || block.match(/url="(https?:\/\/[^"]+)"/i)?.[1];
    out.push(
      mapArticle(
        {
          id: `rss-${out.length}-${title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "")
            .slice(0, 24)}`,
          title,
          summary: description || title,
          source: sourceFallback,
          datetime: Number.isFinite(datetime)
            ? datetime
            : Math.floor(Date.now() / 1000),
          image: media,
          images,
          video,
          url: link || undefined,
        },
        out.length
      )
    );
  }
  return out;
}

async function fetchRss(): Promise<LiveNewsItem[] | null> {
  const feeds: { url: string; source: string }[] = [
    {
      url: "https://feeds.bbci.co.uk/news/business/rss.xml",
      source: "BBC Business",
    },
    {
      url: "https://www.ecb.europa.eu/rss/press.html",
      source: "European Central Bank",
    },
    {
      url: "https://news.google.com/rss/search?q=European+Union+OR+ECB+OR+eurozone+finance+when:2d&hl=en&gl=DE&ceid=DE:en",
      source: "EU Finance Wire",
    },
  ];

  const batches = await Promise.all(
    feeds.map(async (f) => {
      try {
        const res = await fetch(f.url, {
          headers: {
            "User-Agent": "HKCM-Charts/1.0 (+https://charts-hkcm.de)",
          },
          next: { revalidate: NEWS_CACHE_SECONDS },
        });
        if (!res.ok) return [] as LiveNewsItem[];
        const xml = await res.text();
        return parseRssItems(xml, f.source);
      } catch {
        return [] as LiveNewsItem[];
      }
    })
  );

  const merged = preferEuFirst(batches.flat());
  const seen = new Set<string>();
  const unique: LiveNewsItem[] = [];
  for (const item of merged) {
    const key = item.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique.length ? attachRelatedSlides(unique.slice(0, 12)) : null;
}

export async function getMarketNews(): Promise<NewsFeedResponse> {
  const token = process.env.FINNHUB_API_KEY?.trim();

  if (token) {
    try {
      const items = await fetchFinnhub(token);
      if (items?.length) {
        return {
          ok: true,
          provider: "finnhub",
          ttlSeconds: NEWS_CACHE_SECONDS,
          refreshedAt: new Date().toISOString(),
          items,
        };
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const items = await fetchRss();
    if (items?.length) {
      return {
        ok: true,
        provider: "rss",
        ttlSeconds: NEWS_CACHE_SECONDS,
        refreshedAt: new Date().toISOString(),
        items,
      };
    }
  } catch {
    /* fall through */
  }

  return {
    ok: true,
    provider: "fallback",
    ttlSeconds: NEWS_CACHE_SECONDS,
    refreshedAt: new Date().toISOString(),
    items: FALLBACK_NEWS,
  };
}
