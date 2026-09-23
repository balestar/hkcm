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
  /\b(eu|europe|euro|ecb|eurozone|brussels|frankfurt|paris|berlin|amsterdam|madrid|milan|stoxx|dax|bund|lagarde|germany|france|italy|spain|netherlands|austria|belgium|ireland|portugal|poland|nordic)\b/i;

/** Must contain at least one market/finance signal to be included. */
const FINANCE_REQUIRED =
  /\b(market|stock|share|equit|index|indices|fund|bond|yield|rate|bund|treasury|gilt|spread|swap|euribor|fx|forex|dollar|euro(?:zone)?|eur|usd|gbp|jpy|sterling|franc|krone|currency|inflation|deflat|cpi|ppi|pce|gdp|growth|recession|ecb|fed(?:eral reserve)?|central bank|rate cut|rate hike|basis point|\bbps\b|oil|crude|brent|wti|natural gas|commodity|commodities|gold|silver|metal|mining|ipo|earn|profit|revenue|ebitda|guidance|outlook|quarter|fiscal|dividend|buyback|m&a|merger|acquisition|takeover|private equity|hedge fund|\betf\b|derivative|option|futures|trade balance|current account|debt|deficit|surplus|liquidity|credit|lending|deposit|mortgage|repo|eurostoxx|stoxx|dax|cac|ftse|s&p|nasdaq|dow|nikkei|hang seng|crypto|bitcoin|btc|ethereum|eth|stablecoin|cbdc|defi|blockchain asset)\b/i;

/** Hard noise — exclude even if finance keywords are present (pure non-market politics). */
const NOISE_BLOCK =
  /\b(military strike|troops deployed|airstrike|combat|battlefield|frontline|asylum seeker|migrant boat|refugee camp|flood damage|earthquake casualty|wildfire evacuat|hurricane landfall|terror attack|drug bust|murder trial|verdict sentenc|election result|coalition talks|party leadership|protest march|union strike|picket line)\b/i;

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

/** Only real HTTP URLs — never local fallback paths in the slides array. */
function uniqueHttpMedia(urls: Array<string | undefined | null>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    if (!isHttpUrl(raw)) continue;
    const u = raw.trim();
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length >= 3) break;
  }
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
  if (/\b(bitcoin|crypto|\beth\b|btc|ethereum|stablecoin|defi|cbdc)\b/.test(t)) return "Crypto";
  if (/\b(rate|yield|bond|bund|ecb|fed|inflation|deflat|cpi|ppi|interest|monetary|hawkish|dovish|basis point|spread|euribor|repo)\b/.test(t)) return "Rates";
  if (/\b(gdp|growth|recession|unemployment|pmi|ism|trade balance|current account|output|industrial|manufacture|retail sales|consumer confidence|macro)\b/.test(t)) return "Macro";
  if (/\b(ipo|merger|acquisition|takeover|m&a|buyback|dividend|earn|revenue|ebitda|guidance|profit|quarter|fiscal)\b/.test(t)) return "Movers";
  if (/\b(oil|crude|brent|wti|gas|gold|silver|metal|commodity|commodities|copper|wheat|corn|soybean)\b/.test(t)) return "Commodities";
  return "Markets";
}

/** Return true only if the article is genuinely market / finance focused. */
function isFinanceArticle(title: string, summary: string): boolean {
  const text = `${title} ${summary}`;
  return FINANCE_REQUIRED.test(text) && !NOISE_BLOCK.test(text);
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
  // slides = only genuine HTTP URLs from the wire; cover may be a local fallback
  const slides = uniqueHttpMedia([raw.image, ...(raw.images ?? [])]);
  return {
    id: raw.id,
    category,
    title: raw.title.trim(),
    summary: summary.slice(0, 220),
    source: raw.source.trim() || "Markets wire",
    time: formatTime(raw.datetime),
    cover,
    slides,
    video: raw.video,
    detail: summary,
    bullets: bulletsFrom(summary),
    url: raw.url,
    publishedAt: raw.datetime,
  };
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
  const categories = ["general", "forex", "crypto", "merger"] as const;
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
    const summary = a.summary?.trim() || title;
    // Strict finance gate — skip non-market articles
    if (!isFinanceArticle(title, summary)) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    mapped.push(
      mapArticle(
        {
          id: `fh-${a.id ?? mapped.length}`,
          title,
          summary,
          source: a.source || "Markets Wire",
          datetime: a.datetime,
          image: a.image,
          url: a.url,
        },
        mapped.length
      )
    );
  }

  return preferEuFirst(mapped).slice(0, 12);
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
      // Reuters Markets & Finance feed
      url: "https://feeds.reuters.com/reuters/businessNews",
      source: "Reuters Markets",
    },
    {
      // FT markets (public RSS)
      url: "https://www.ft.com/markets?format=rss",
      source: "Financial Times",
    },
    {
      url: "https://news.google.com/rss/search?q=eurozone+OR+ECB+OR+DAX+OR+eurostoxx+markets+finance+when:1d&hl=en&gl=DE&ceid=DE:en",
      source: "EU Markets Wire",
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
    // Only keep genuine market / finance stories
    if (!isFinanceArticle(item.title, item.summary)) continue;
    const key = item.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique.length ? unique.slice(0, 12) : null;
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
