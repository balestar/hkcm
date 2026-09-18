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

type DummyData = {
  commentBank: string[];
  profiles: DummyProfile[];
};

const { commentBank, profiles } = data as DummyData;

export const DUMMY_PROFILES = profiles;
export const DUMMY_COMMENT_BANK = commentBank;

/** Pick a random profile + one of its 350 comments. */
export function randomDeskComment(seed?: number) {
  const i =
    typeof seed === "number"
      ? Math.abs(seed) % profiles.length
      : Math.floor(Math.random() * profiles.length);
  const profile = profiles[i];
  const cIdx =
    typeof seed === "number"
      ? profile.commentIds[Math.abs(seed * 17) % profile.commentIds.length]
      : profile.commentIds[Math.floor(Math.random() * profile.commentIds.length)];
  return {
    ...profile,
    text: commentBank[cIdx] ?? commentBank[0],
  };
}
