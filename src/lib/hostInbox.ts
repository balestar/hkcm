import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeskNotification } from "@/lib/notifications";

const KV = "kv_store_0fc9642b";
const NOTICE_PREFIX = "hkcm_n:";
const PUSH_PREFIX = "hkcm_p:";
const BUCKET = "hkcm-inbox";

function supabaseRest() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  return {
    url,
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
  };
}

async function ensureInboxBucket() {
  const { url, headers } = supabaseRest();
  await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: false,
      file_size_limit: 1_000_000,
    }),
  });
}

async function storagePut(path: string, value: unknown) {
  await ensureInboxBucket();
  const { url, headers } = supabaseRest();
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "x-upsert": "true",
    },
    body: JSON.stringify(value),
  });
  if (!res.ok && res.status !== 409) {
    const detail = await res.text();
    throw new Error(detail.slice(0, 240) || `storage_${res.status}`);
  }
}

async function storageList(prefix: string): Promise<unknown[]> {
  const { url, headers } = supabaseRest();
  const res = await fetch(`${url}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      prefix,
      limit: 120,
      sortBy: { column: "name", order: "desc" },
    }),
  });
  if (!res.ok) return [];
  const files = (await res.json()) as Array<{ name?: string }>;
  const out: unknown[] = [];
  for (const file of files) {
    if (!file.name) continue;
    const get = await fetch(`${url}/storage/v1/object/${BUCKET}/${prefix}${file.name}`, {
      headers,
    });
    if (!get.ok) continue;
    out.push(await get.json());
  }
  return out;
}

type NoticeRow = {
  id: string;
  address: string | null;
  title: string;
  body: string;
  created_at: string;
};

type PushRow = {
  address: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function missingRelation(err: { code?: string; message?: string } | null) {
  if (!err) return false;
  const msg = err.message || "";
  return (
    err.code === "PGRST205" ||
    /Could not find the table|schema cache|does not exist/i.test(msg)
  );
}

function asNotice(raw: unknown): DeskNotification | null {
  if (!raw || typeof raw !== "object") return null;
  const n = raw as Partial<NoticeRow>;
  if (!n.id || !n.title || !n.body || !n.created_at) return null;
  return {
    id: String(n.id),
    address: n.address ?? null,
    title: String(n.title),
    body: String(n.body),
    createdAt: String(n.created_at),
  };
}

function asPush(raw: unknown): PushRow | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<PushRow>;
  if (!p.address || !p.endpoint || !p.p256dh || !p.auth) return null;
  return {
    address: String(p.address),
    endpoint: String(p.endpoint),
    p256dh: String(p.p256dh),
    auth: String(p.auth),
  };
}

export async function insertNotifications(
  db: SupabaseClient,
  rows: Array<{ address: string | null; title: string; body: string }>
): Promise<{ stored: number; error?: string }> {
  const table = await db.from("hkcm_notifications").insert(rows).select("id");
  if (!table.error) {
    return { stored: table.data?.length ?? rows.length };
  }
  if (!missingRelation(table.error)) {
    return { stored: 0, error: table.error.message };
  }

  const now = new Date().toISOString();
  const kvRows = rows.map((row) => {
    const id = crypto.randomUUID();
    return {
      key: `${NOTICE_PREFIX}${now}:${id}`,
      value: {
        id,
        address: row.address,
        title: row.title,
        body: row.body,
        created_at: now,
      },
    };
  });
  const kv = await db.from(KV).upsert(kvRows);
  if (!kv.error) return { stored: kvRows.length };

  try {
    for (const row of kvRows) {
      await storagePut(`n/${row.key.slice(NOTICE_PREFIX.length)}.json`, row.value);
    }
    return { stored: kvRows.length };
  } catch (err) {
    return {
      stored: 0,
      error: `${table.error.message}; kv: ${kv.error.message}; storage: ${
        err instanceof Error ? err.message : "failed"
      }`,
    };
  }
}

export async function listNotifications(
  db: SupabaseClient,
  opts?: { address?: string; limit?: number }
): Promise<DeskNotification[]> {
  const limit = opts?.limit ?? 40;
  const table = await db
    .from("hkcm_notifications")
    .select("id, address, title, body, created_at")
    .order("created_at", { ascending: false })
    .limit(120);

  let items: DeskNotification[] = [];
  if (!table.error) {
    items = (table.data ?? []).map((n) => ({
      id: n.id,
      address: n.address,
      title: n.title,
      body: n.body,
      createdAt: n.created_at,
    }));
  } else if (missingRelation(table.error)) {
    const kv = await db
      .from(KV)
      .select("key, value")
      .like("key", `${NOTICE_PREFIX}%`)
      .order("key", { ascending: false })
      .limit(120);
    items = (kv.data ?? []).map((row) => asNotice(row.value)).filter(Boolean) as DeskNotification[];
    if (!items.length) {
      items = (await storageList("n/")).map(asNotice).filter(Boolean) as DeskNotification[];
    }
  } else {
    throw new Error(table.error.message);
  }

  if (opts?.address) {
    const want = opts.address.toLowerCase();
    items = items.filter((n) => !n.address || n.address.toLowerCase() === want);
  }
  return items.slice(0, limit);
}

export async function upsertPushSubscription(db: SupabaseClient, sub: PushRow) {
  const table = await db.from("hkcm_push_subscriptions").upsert(
    { ...sub, updated_at: new Date().toISOString() },
    { onConflict: "endpoint" }
  );
  if (!table.error) return;
  if (!missingRelation(table.error)) {
    throw new Error(table.error.message);
  }
  const key = `${PUSH_PREFIX}${Buffer.from(sub.endpoint).toString("base64url").slice(0, 80)}`;
  const kv = await db.from(KV).upsert({ key, value: sub });
  if (!kv.error) return;
  await storagePut(`p/${key.slice(PUSH_PREFIX.length)}.json`, sub);
}

export async function listPushSubscriptions(
  db: SupabaseClient,
  addresses?: string[]
): Promise<PushRow[]> {
  const table = await db
    .from("hkcm_push_subscriptions")
    .select("address, endpoint, p256dh, auth")
    .limit(2000);
  let rows: PushRow[] = [];
  if (!table.error) {
    rows = (table.data ?? []) as PushRow[];
  } else if (missingRelation(table.error)) {
    const kv = await db.from(KV).select("value").like("key", `${PUSH_PREFIX}%`).limit(2000);
    rows = (kv.data ?? []).map((row) => asPush(row.value)).filter(Boolean) as PushRow[];
    if (!rows.length) {
      rows = (await storageList("p/")).map(asPush).filter(Boolean) as PushRow[];
    }
  }
  if (addresses?.length) {
    const want = new Set(addresses.map((a) => a.toLowerCase()));
    rows = rows.filter((r) => want.has(r.address.toLowerCase()));
  }
  return rows;
}

export async function deletePushEndpoint(db: SupabaseClient, endpoint: string) {
  await db.from("hkcm_push_subscriptions").delete().eq("endpoint", endpoint);
  const key = `${PUSH_PREFIX}${Buffer.from(endpoint).toString("base64url").slice(0, 80)}`;
  await db.from(KV).delete().eq("key", key);
}
