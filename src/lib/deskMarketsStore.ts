import { supabaseAdmin } from "@/lib/supabase";
import {
  DEFAULT_FEATURED_IDS,
  type DeskMarketsBoard,
  type SavedDeskPick,
} from "@/lib/marketUniverse";

const KV = "kv_store_0fc9642b";
const KEY = "hkcm_markets";
const BUCKET = "hkcm-inbox";
const FILE = "markets.json";

function rest() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  return {
    url,
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  };
}

function parseBoard(raw: unknown): DeskMarketsBoard | null {
  if (!raw || typeof raw !== "object") return null;
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items)) return null;
  const clean: SavedDeskPick[] = [];
  const seen = new Set<string>();
  for (const row of items) {
    if (!row || typeof row !== "object") continue;
    const id = String((row as SavedDeskPick).id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const votes = (row as SavedDeskPick).votes;
    clean.push({
      id,
      why: typeof (row as SavedDeskPick).why === "string" ? (row as SavedDeskPick).why : undefined,
      note: typeof (row as SavedDeskPick).note === "string" ? (row as SavedDeskPick).note : undefined,
      analystId:
        typeof (row as SavedDeskPick).analystId === "string"
          ? (row as SavedDeskPick).analystId
          : undefined,
      votes:
        votes && Number.isFinite(votes.up) && Number.isFinite(votes.down)
          ? {
              up: Math.max(0, Math.round(votes.up)),
              down: Math.max(0, Math.round(votes.down)),
            }
          : undefined,
    });
    if (clean.length >= 16) break;
  }
  return {
    items: clean,
    updatedAt: String((raw as DeskMarketsBoard).updatedAt || new Date().toISOString()),
  };
}

export function defaultBoard(): DeskMarketsBoard {
  return {
    items: DEFAULT_FEATURED_IDS.map((id) => ({ id })),
    updatedAt: new Date().toISOString(),
  };
}

export async function loadMarketsBoard(): Promise<DeskMarketsBoard> {
  const db = supabaseAdmin();
  const kv = await db.from(KV).select("value").eq("key", KEY).maybeSingle();
  const fromKv = parseBoard(kv.data?.value);
  if (fromKv?.items.length) return fromKv;

  try {
    const { url, headers } = rest();
    const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${FILE}`, { headers });
    if (res.ok) {
      const fromFile = parseBoard(await res.json());
      if (fromFile?.items.length) return fromFile;
    }
  } catch {
    /* ignore */
  }
  return defaultBoard();
}

export async function saveMarketsBoard(items: SavedDeskPick[]): Promise<DeskMarketsBoard> {
  const parsed = parseBoard({ items, updatedAt: new Date().toISOString() });
  const board = parsed?.items.length ? parsed : defaultBoard();
  const db = supabaseAdmin();
  const kv = await db.from(KV).upsert({ key: KEY, value: board });
  if (!kv.error) return board;

  const { url, headers } = rest();
  await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false, file_size_limit: 500_000 }),
  });
  const put = await fetch(`${url}/storage/v1/object/${BUCKET}/${FILE}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", "x-upsert": "true" },
    body: JSON.stringify(board),
  });
  if (!put.ok && put.status !== 409) {
    throw new Error((await put.text()).slice(0, 200) || "save_failed");
  }
  return board;
}
