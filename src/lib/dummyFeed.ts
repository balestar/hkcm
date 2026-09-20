import data from "@/lib/dummyProfiles.json";

export type DummyPlatform = "linkedin" | "twitter" | "reddit" | "hkcm" | "nft";

export type DummyProfile = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  avatar: string;
  platform: DummyPlatform;
  tone: "bull" | "bear" | "neutral";
  linkedin?: string;
  commentIds: number[];
};

export type DeskComment = DummyProfile & { text: string };

type DummyData = {
  commentBank: string[];
  profiles: DummyProfile[];
};

const { commentBank, profiles } = data as DummyData;

export const DUMMY_PROFILES = profiles;
export const DUMMY_COMMENT_BANK = commentBank;

/** Only LinkedIn voices that have a unique 1:1 portrait — no reuse, no NFT/reddit. */
const REALISTIC_POOL = profiles.filter(
  (p) =>
    p.platform === "linkedin" &&
    p.avatar.startsWith("/profiles/li/") &&
    !p.name.includes(".eth") &&
    !p.name.startsWith("u/")
);

const recentAuthorIds: string[] = [];
const RECENT_WINDOW = Math.min(14, Math.max(8, REALISTIC_POOL.length - 5));

function pickProfile(avoidIds: Set<string>): DummyProfile {
  const pool = REALISTIC_POOL.filter(
    (p) => !avoidIds.has(p.id) && !recentAuthorIds.includes(p.id)
  );
  const source =
    pool.length > 0
      ? pool
      : REALISTIC_POOL.filter((p) => !avoidIds.has(p.id));
  const list = source.length > 0 ? source : REALISTIC_POOL;
  return list[Math.floor(Math.random() * list.length)];
}

function pickCommentText(profile: DummyProfile, usedTexts: Set<string>): string {
  const ids = profile.commentIds;
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  for (const id of shuffled) {
    const text = (commentBank[id] ?? commentBank[0]).replace(/\s*#\d+\s*$/g, "").trim();
    if (!usedTexts.has(text)) return text;
  }
  const fallback = commentBank[ids[Math.floor(Math.random() * ids.length)]] ?? commentBank[0];
  return fallback.replace(/\s*#\d+\s*$/g, "").trim();
}

/** Irregular delay between feed events: mostly 3–8 min, rare shorter/longer. */
export function nextFeedDelayMs(): number {
  const roll = Math.random();
  // ~8% quicker (~2–3.5 min) so it never feels metronomic
  if (roll < 0.08) return 120_000 + Math.random() * 90_000;
  // ~10% slower (~9–14 min)
  if (roll > 0.9) return 540_000 + Math.random() * 300_000;
  // Common path: ~3–8 min with mild averaging
  const a = 180_000 + Math.random() * 300_000;
  const b = 180_000 + Math.random() * 300_000;
  return (a + b) / 2;
}

/** How long a comment stays on the roll: 4–10 minutes. */
export function commentTtlMs(): number {
  return 240_000 + Math.random() * 360_000;
}

export function formatAgo(createdAt: number, now = Date.now()): string {
  const sec = Math.max(0, Math.floor((now - createdAt) / 1000));
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 1) return "1m";
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h`;
}

export function randomDeskComment(opts?: {
  avoidIds?: string[];
  usedTexts?: string[];
}): DeskComment {
  const avoid = new Set(opts?.avoidIds ?? []);
  const usedTexts = new Set(opts?.usedTexts ?? []);
  const profile = pickProfile(avoid);
  recentAuthorIds.push(profile.id);
  if (recentAuthorIds.length > RECENT_WINDOW) recentAuthorIds.shift();

  return {
    ...profile,
    text: pickCommentText(profile, usedTexts),
    linkedin: profile.linkedin || "https://www.linkedin.com/company/hkcm",
  };
}
