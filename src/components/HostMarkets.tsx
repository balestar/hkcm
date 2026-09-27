"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PickItem } from "@/lib/data";
import type { SavedDeskPick } from "@/lib/marketUniverse";
import { MARKET_CATEGORIES, defaultVotes, instrumentById } from "@/lib/marketUniverse";

type CatalogRow = { id: string; symbol: string; name: string; kind: string };
type Analyst = { id: string; name: string; role: string };
type BoardRow = { saved: SavedDeskPick; pick: PickItem };

type DeskState = {
  why: string;
  note: string;
  analystId: string;
  up: string;
  down: string;
};

function draftFrom(row: BoardRow): DeskState {
  return {
    why: row.saved.why || row.pick.why,
    note: row.saved.note || row.pick.analyst.note,
    analystId: row.saved.analystId || "",
    up: String(row.saved.votes?.up ?? row.pick.votes.up),
    down: String(row.saved.votes?.down ?? row.pick.votes.down),
  };
}

export function HostMarkets() {
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DeskState>>({});
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string>("All");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async (q = "") => {
    const res = await fetch(`/api/host/markets?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    if (!json.ok) return;
    setCatalog(json.catalog ?? []);
    setTrending(json.trending ?? []);
    setAnalysts(json.analysts ?? []);
    const items = (json.board?.items ?? []) as BoardRow[];
    setBoard(items);
    setDrafts((prev) => {
      const next = { ...prev };
      for (const row of items) {
        if (!next[row.pick.id]) next[row.pick.id] = draftFrom(row);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const featuredIds = useMemo(() => new Set(board.map((b) => b.pick.id)), [board]);

  const visible = useMemo(() => {
    return catalog.filter((c) => {
      if (featuredIds.has(c.id)) return false;
      if (kind !== "All" && c.kind !== kind) return false;
      return true;
    });
  }, [catalog, featuredIds, kind]);

  const add = (id: string) => {
    const inst = instrumentById(id);
    if (!inst || featuredIds.has(id)) return;
    const votes = defaultVotes(id);
    setBoard((prev) => [
      ...prev,
      {
        saved: { id },
        pick: {
          id,
          symbol: inst.symbol,
          name: inst.name,
          kind: inst.kind,
          price: inst.fallbackPrice,
          changePct: inst.fallbackChange,
          why: "",
          series: inst.fallbackSeries,
          votes,
          analyst: { name: "", role: "", image: "", note: "" },
        },
      },
    ]);
    setDrafts((prev) => ({
      ...prev,
      [id]: { why: "", note: "", analystId: "", up: String(votes.up), down: String(votes.down) },
    }));
  };

  const remove = (id: string) => {
    setBoard((prev) => prev.filter((b) => b.pick.id !== id));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const move = (id: string, dir: -1 | 1) => {
    setBoard((prev) => {
      const i = prev.findIndex((b) => b.pick.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      const [row] = copy.splice(i, 1);
      copy.splice(j, 0, row);
      return copy;
    });
  };

  const publish = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const items: SavedDeskPick[] = board.map((row) => {
        const d = drafts[row.pick.id] ?? draftFrom(row);
        return {
          id: row.pick.id,
          why: d.why.trim() || undefined,
          note: d.note.trim() || undefined,
          analystId: d.analystId || undefined,
          votes: {
            up: Math.max(0, Number(d.up) || 0),
            down: Math.max(0, Number(d.down) || 0),
          },
        };
      });
      const res = await fetch("/api/host/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!json.ok) {
        setStatus("Couldn’t publish the board. Try again.");
        return;
      }
      setStatus(`Published ${json.stored} desk charts.`);
      await load(query);
    } catch {
      setStatus("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/8 bg-[#0c1220] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Desk charts</h2>
          <p className="mt-1 max-w-xl text-[12px] text-white/40">
            Pick the instruments that go live for every client — chart, why it matters, team
            note, votes, and comments update together.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void publish()}
          disabled={saving || board.length === 0}
          className="rounded-xl bg-[#c4a35a] px-4 py-2 text-[13px] font-semibold text-[#1a1408] transition hover:brightness-110 disabled:opacity-40"
        >
          {saving ? "Publishing…" : "Publish board"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["All", ...MARKET_CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setKind(c)}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
              kind === c ? "bg-white text-[#0b1b3a]" : "bg-white/10 text-white/65"
            }`}
          >
            {c}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            void load(e.target.value);
          }}
          placeholder="Search BTC, SAP, DAX…"
          className="ml-auto w-full max-w-xs rounded-xl border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[13px] outline-none placeholder:text-white/30 focus:border-[#c4a35a]/40"
        />
      </div>

      {trending.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
            Trending
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {trending.map((id) => {
              const row = instrumentById(id);
              if (!row) return null;
              const on = featuredIds.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  disabled={on}
                  onClick={() => add(id)}
                  className="rounded-full border border-[#c4a35a]/30 bg-[#c4a35a]/10 px-3 py-1 text-[12px] font-semibold text-[#e4d0a0] disabled:opacity-35"
                >
                  {row.symbol}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
            Universe
          </p>
          <ul className="mt-2 max-h-[28rem] overflow-y-auto rounded-xl border border-white/8">
            {visible.map((c) => (
              <li key={c.id} className="border-b border-white/6 last:border-0">
                <button
                  type="button"
                  onClick={() => add(c.id)}
                  className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.03]"
                >
                  <span>
                    <span className="block text-[13px] font-semibold">{c.symbol}</span>
                    <span className="block text-[12px] text-white/40">
                      {c.name} · {c.kind}
                    </span>
                  </span>
                  <span className="text-[12px] font-semibold text-[#c4a35a]">Add</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
            Live for clients · {board.length}
          </p>
          <ul className="mt-2 space-y-3">
            {board.length === 0 && (
              <li className="rounded-xl border border-white/8 px-4 py-6 text-center text-[13px] text-white/40">
                Add BTC, ETH, a stock, bond, or index.
              </li>
            )}
            {board.map((row, i) => {
              const d = drafts[row.pick.id] ?? draftFrom(row);
              return (
                <li
                  key={row.pick.id}
                  className="rounded-xl border border-white/8 bg-black/20 p-3.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[14px] font-semibold">{row.pick.symbol}</span>
                    <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50">
                      {row.pick.kind}
                    </span>
                    <span className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() => move(row.pick.id, -1)}
                        disabled={i === 0}
                        className="rounded-md border border-white/12 px-2 py-0.5 text-[11px] disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(row.pick.id, 1)}
                        disabled={i === board.length - 1}
                        className="rounded-md border border-white/12 px-2 py-0.5 text-[11px] disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(row.pick.id)}
                        className="rounded-md border border-white/12 px-2 py-0.5 text-[11px] text-[#f87171]"
                      >
                        Remove
                      </button>
                    </span>
                  </div>
                  <textarea
                    value={d.why}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [row.pick.id]: { ...d, why: e.target.value } }))
                    }
                    placeholder="Why it matters"
                    rows={2}
                    className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[12px] outline-none focus:border-[#c4a35a]/40"
                  />
                  <textarea
                    value={d.note}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [row.pick.id]: { ...d, note: e.target.value } }))
                    }
                    placeholder="What the team says"
                    rows={2}
                    className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[12px] outline-none focus:border-[#c4a35a]/40"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <label className="text-[11px] text-white/40">
                      Agree
                      <input
                        type="number"
                        min={0}
                        value={d.up}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [row.pick.id]: { ...d, up: e.target.value } }))
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[13px] text-white outline-none"
                      />
                    </label>
                    <label className="text-[11px] text-white/40">
                      Disagree
                      <input
                        type="number"
                        min={0}
                        value={d.down}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.pick.id]: { ...d, down: e.target.value },
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[13px] text-white outline-none"
                      />
                    </label>
                    <label className="col-span-2 text-[11px] text-white/40">
                      Voice
                      <select
                        value={d.analystId}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.pick.id]: { ...d, analystId: e.target.value },
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c1220] px-2 py-1.5 text-[13px] text-white outline-none"
                      >
                        <option value="">Desk default</option>
                        {analysts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {status && <p className="mt-3 text-[13px] text-[#e4d0a0]/80">{status}</p>}
    </section>
  );
}
