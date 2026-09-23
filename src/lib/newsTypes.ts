/** Shared live-news shapes — safe for client + server imports. */

export type LiveNewsItem = {
  id: string;
  category: "Markets" | "Rates" | "Macro" | "Crypto" | "Movers" | "Commodities";
  title: string;
  summary: string;
  source: string;
  time: string;
  cover: string;
  /** Up to 3 real story images for the expand slider. */
  slides: string[];
  /** Optional muted story video when the wire or article provides one. */
  video?: string;
  detail: string;
  bullets: string[];
  url?: string;
  publishedAt: number;
};

export type NewsFeedResponse = {
  ok: boolean;
  provider: "finnhub" | "rss" | "fallback";
  ttlSeconds: number;
  refreshedAt: string;
  items: LiveNewsItem[];
};

export const NEWS_CACHE_SECONDS = 15 * 60;

/** Static last-resort copy if every live source fails. */
export const FALLBACK_NEWS: LiveNewsItem[] = [
  {
    id: "n1",
    category: "Markets",
    title: "European equities firm as exporters catch a bid",
    summary:
      "Stoxx and DAX lift on a softer euro and better-than-feared industrial prints across the bloc.",
    source: "Europe Markets Desk",
    time: "08:12",
    cover: "/news/dax-floor.jpg",
    slides: [],
    detail:
      "Cash equities across the euro area opened with a constructive tone as exporters led the advance.",
    bullets: [
      "Exporters lead the early session across major EU venues.",
      "EUR softness supports FX-sensitive earnings narratives.",
      "Watch Bund futures and EURUSD for risk appetite.",
    ],
    publishedAt: 0,
  },
  {
    id: "n2",
    category: "Movers",
    title: "EU utilities rally as grid investment fast-track advances",
    summary:
      "Member-state alignment on streamlined permitting lifts energy infrastructure names across the bloc.",
    source: "EU Energy Watch",
    time: "09:40",
    cover: "/news/berlin-grid.jpg",
    slides: [],
    detail:
      "Capitals are aligning on a faster permitting track for high-voltage grid corridors, lifting utilities and grid operators.",
    bullets: [
      "Streamlined permitting removes a key capex uncertainty for EU utilities.",
      "Grid equipment suppliers see order-book upgrades.",
      "Regulatory timeline will drive re-rating of affected names.",
    ],
    publishedAt: 0,
  },
  {
    id: "n3",
    category: "Rates",
    title: "ECB holds; markets price a longer pause",
    summary:
      "Front-end rates steady as policymakers keep optionality into year-end.",
    source: "Eurozone Macro",
    time: "10:05",
    cover: "/news/ecb-policy.jpg",
    slides: [],
    video: "/news/ecb-brief.mp4",
    detail:
      "The ECB left key rates unchanged and kept the door open on both sides of the reaction function.",
    bullets: [
      "Deposit rate on hold into the next meetings.",
      "Curve still sensitive to wage prints.",
      "EUR crosses quiet ahead of data.",
    ],
    publishedAt: 0,
  },
  {
    id: "n4",
    category: "Movers",
    title: "Brussels advances capital-markets package",
    summary:
      "Draft rules aim to deepen retail participation across member states.",
    source: "EU Policy Brief",
    time: "11:22",
    cover: "/news/brussels-markets.jpg",
    slides: [],
    detail:
      "The Commission’s capital-markets package advances disclosure simplification and cross-border distribution rules.",
    bullets: [
      "Retail participation remains the political priority.",
      "Fund passporting is the commercial lever.",
      "Implementation still multi-quarter.",
    ],
    publishedAt: 0,
  },
];
