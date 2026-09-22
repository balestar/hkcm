"use client";

import { useMemo, useRef, useState, type MouseEvent } from "react";

type Candle = {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  t: number;
};

type Tf = "15m" | "1H" | "4H" | "1D";

const TF_BARS: Record<Tf, number> = {
  "15m": 64,
  "1H": 48,
  "4H": 40,
  "1D": 32,
};

const TF_STEP_MS: Record<Tf, number> = {
  "15m": 15 * 60_000,
  "1H": 60 * 60_000,
  "4H": 4 * 60 * 60_000,
  "1D": 24 * 60 * 60_000,
};

function parseDisplayPrice(price: string): number {
  const cleaned = price.replace(/[^\d.,-]/g, "");
  if (!cleaned) return 100;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      return Number(cleaned.replace(/\./g, "").replace(",", "."));
    }
    return Number(cleaned.replace(/,/g, ""));
  }

  if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts.length === 2 && parts[1].length === 3) {
      return Number(cleaned.replace(/,/g, ""));
    }
    return Number(cleaned.replace(",", "."));
  }

  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : 100;
}

function formatAxisPrice(n: number, sample: string): string {
  if (sample.includes("%")) return `${n.toFixed(2)}%`;
  if (n >= 10_000) {
    return n.toLocaleString("de-DE", { maximumFractionDigits: 0 });
  }
  if (n >= 100) {
    return n.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function formatAxisTime(ts: number, tf: Tf): string {
  const d = new Date(ts);
  if (tf === "1D") {
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  }
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** Upsample index closes into seeded OHLC + volume around the live display price. */
function buildCandles(
  series: number[],
  displayPrice: string,
  tf: Tf,
  upBias: boolean
): Candle[] {
  const bars = TF_BARS[tf];
  const lastPx = parseDisplayPrice(displayPrice);
  const lastIdx = series[series.length - 1] || 100;
  const firstIdx = series[0] || lastIdx;
  const scale = lastPx / lastIdx;

  // Dense close path via linear interpolation of the index series
  const dense: number[] = [];
  for (let i = 0; i < bars; i++) {
    const t = i / (bars - 1);
    const src = t * (series.length - 1);
    const a = Math.floor(src);
    const b = Math.min(series.length - 1, a + 1);
    const f = src - a;
    const idx = series[a] * (1 - f) + series[b] * f;
    // mild path noise so candles look lived-in
    const wobble =
      Math.sin(i * 1.7) * 0.35 + Math.sin(i * 0.37) * 0.55 + (upBias ? 0.08 : -0.08);
    dense.push((idx + wobble) * scale);
  }
  // Pin last close to displayed price
  dense[dense.length - 1] = lastPx;

  const now = Date.now();
  const step = TF_STEP_MS[tf];
  const candles: Candle[] = [];
  for (let i = 0; i < dense.length; i++) {
    const c = dense[i];
    const prev = i === 0 ? (firstIdx * scale) : dense[i - 1];
    const drift = c - prev;
    const body = Math.abs(drift);
    const wick = Math.max(body * 0.55, lastPx * 0.0012) * (0.7 + (i % 5) * 0.12);
    const o = prev;
    const h = Math.max(o, c) + wick * (0.35 + ((i * 3) % 7) * 0.08);
    const l = Math.min(o, c) - wick * (0.3 + ((i * 5) % 6) * 0.09);
    const v =
      40 +
      Math.abs(drift) * 18 +
      ((i * 17) % 29) * 2.2 +
      (body > lastPx * 0.004 ? 35 : 0);
    candles.push({
      o,
      h,
      l,
      c,
      v,
      t: now - (dense.length - 1 - i) * step,
    });
  }
  return candles;
}

function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

type TradingChartProps = {
  series: number[];
  price: string;
  up: boolean;
  symbol: string;
};

export function TradingChart({ series, price, up, symbol }: TradingChartProps) {
  const [tf, setTf] = useState<Tf>("1H");
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const candles = useMemo(
    () => buildCandles(series, price, tf, up),
    [series, price, tf, up]
  );

  const closes = candles.map((c) => c.c);
  const ma9 = useMemo(() => sma(closes, 9), [closes]);
  const ma21 = useMemo(() => sma(closes, 21), [closes]);

  const W = 720;
  const H = 420;
  const padL = 12;
  const padR = 64;
  const padT = 28;
  const volH = 72;
  const gap = 10;
  const chartBottom = H - 28;
  const priceBottom = chartBottom - volH - gap;
  const priceTop = padT;
  const volTop = priceBottom + gap;

  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  const minP = Math.min(...lows);
  const maxP = Math.max(...highs);
  const padP = (maxP - minP) * 0.08 || maxP * 0.01;
  const yMin = minP - padP;
  const yMax = maxP + padP;
  const maxV = Math.max(...candles.map((c) => c.v), 1);

  const plotW = W - padL - padR;
  const barGap = 0.28;
  const slot = plotW / candles.length;
  const bodyW = Math.max(2.5, slot * (1 - barGap));

  const xAt = (i: number) => padL + slot * i + slot / 2;
  const yAt = (p: number) =>
    priceTop + (1 - (p - yMin) / (yMax - yMin)) * (priceBottom - priceTop);
  const vyAt = (v: number) => volTop + (1 - v / maxV) * (chartBottom - volTop - 4);

  const priceTicks = 6;
  const gridYs = Array.from({ length: priceTicks }, (_, i) => {
    const p = yMin + ((yMax - yMin) * i) / (priceTicks - 1);
    return { p, y: yAt(p) };
  });

  const timeIdx = [0, Math.floor(candles.length / 3), Math.floor((candles.length * 2) / 3), candles.length - 1];

  const hi = hover ?? candles.length - 1;
  const active = candles[hi];
  const activeUp = active.c >= active.o;
  const chg = active.c - candles[0].o;
  const chgPct = (chg / candles[0].o) * 100;

  const ma9Path = ma9
    .map((v, i) => (v == null ? null : `${i === 0 || ma9[i - 1] == null ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`))
    .filter(Boolean)
    .join(" ");
  const ma21Path = ma21
    .map((v, i) => (v == null ? null : `${i === 0 || ma21[i - 1] == null ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`))
    .filter(Boolean)
    .join(" ");

  function onMove(e: MouseEvent<SVGSVGElement>) {
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.min(
      candles.length - 1,
      Math.max(0, Math.floor((x - padL) / slot))
    );
    setHover(i);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1528]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[13px] font-semibold tracking-wide text-white">
            {symbol}
          </span>
          <span className="font-mono text-[13px] text-white/90">
            {formatAxisPrice(active.c, price)}
          </span>
          <span
            className={`font-mono text-[12px] font-semibold ${
              chgPct >= 0 ? "text-[#3dd68c]" : "text-[#f87171]"
            }`}
          >
            {chgPct >= 0 ? "+" : ""}
            {chgPct.toFixed(2)}%
          </span>
          <span className="hidden text-[11px] text-white/40 sm:inline">
            O {formatAxisPrice(active.o, price)} · H{" "}
            {formatAxisPrice(active.h, price)} · L{" "}
            {formatAxisPrice(active.l, price)} · C{" "}
            {formatAxisPrice(active.c, price)}
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-0.5">
          {(Object.keys(TF_BARS) as Tf[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTf(t);
                setHover(null);
              }}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                tf === t
                  ? "bg-white/15 text-white"
                  : "text-white/45 hover:text-white/80"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="relative px-1 pb-1 pt-0 sm:px-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-pan-y"
          role="img"
          aria-label={`${symbol} price chart`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* Plot background */}
          <rect
            x={padL}
            y={priceTop}
            width={plotW}
            height={priceBottom - priceTop}
            fill="#0a1222"
          />

          {/* Horizontal grid + price labels */}
          {gridYs.map(({ p, y }) => (
            <g key={p}>
              <line
                x1={padL}
                x2={padL + plotW}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <text
                x={W - 8}
                y={y + 3.5}
                textAnchor="end"
                fill="rgba(255,255,255,0.42)"
                fontSize="10"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              >
                {formatAxisPrice(p, price)}
              </text>
            </g>
          ))}

          {/* Volume pane label */}
          <text
            x={padL + 4}
            y={volTop + 12}
            fill="rgba(255,255,255,0.28)"
            fontSize="9"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            Vol
          </text>

          {/* Volume bars */}
          {candles.map((c, i) => {
            const bull = c.c >= c.o;
            const x = xAt(i) - bodyW / 2;
            const y = vyAt(c.v);
            const h = chartBottom - 4 - y;
            return (
              <rect
                key={`v-${i}`}
                x={x}
                y={y}
                width={bodyW}
                height={Math.max(1, h)}
                fill={bull ? "rgba(61,214,140,0.28)" : "rgba(248,113,113,0.28)"}
              />
            );
          })}

          {/* MA lines */}
          <path d={ma21Path} fill="none" stroke="#f0b429" strokeWidth="1.25" opacity="0.9" />
          <path d={ma9Path} fill="none" stroke="#5b9cff" strokeWidth="1.35" opacity="0.95" />

          {/* Candles */}
          {candles.map((c, i) => {
            const bull = c.c >= c.o;
            const color = bull ? "#3dd68c" : "#f87171";
            const x = xAt(i);
            const yO = yAt(c.o);
            const yC = yAt(c.c);
            const top = Math.min(yO, yC);
            const bodyH = Math.max(1.2, Math.abs(yC - yO));
            return (
              <g key={`c-${i}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={yAt(c.h)}
                  y2={yAt(c.l)}
                  stroke={color}
                  strokeWidth="1.15"
                />
                <rect
                  x={x - bodyW / 2}
                  y={top}
                  width={bodyW}
                  height={bodyH}
                  fill={color}
                  rx={0.5}
                />
              </g>
            );
          })}

          {/* Last price dashed line */}
          <line
            x1={padL}
            x2={padL + plotW}
            y1={yAt(candles[candles.length - 1].c)}
            y2={yAt(candles[candles.length - 1].c)}
            stroke={up ? "rgba(61,214,140,0.55)" : "rgba(248,113,113,0.55)"}
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <rect
            x={W - padR + 2}
            y={yAt(candles[candles.length - 1].c) - 8}
            width={padR - 6}
            height={16}
            rx={3}
            fill={up ? "#3dd68c" : "#f87171"}
          />
          <text
            x={W - 8}
            y={yAt(candles[candles.length - 1].c) + 3.5}
            textAnchor="end"
            fill="#0a1222"
            fontSize="9.5"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {formatAxisPrice(candles[candles.length - 1].c, price)}
          </text>

          {/* Crosshair */}
          {hover != null && (
            <g>
              <line
                x1={xAt(hi)}
                x2={xAt(hi)}
                y1={priceTop}
                y2={chartBottom}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <line
                x1={padL}
                x2={padL + plotW}
                y1={yAt(active.c)}
                y2={yAt(active.c)}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={xAt(hi)}
                cy={yAt(active.c)}
                r={3.5}
                fill={activeUp ? "#3dd68c" : "#f87171"}
                stroke="#0d1528"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Time axis */}
          {timeIdx.map((i) => (
            <text
              key={`t-${i}`}
              x={xAt(i)}
              y={H - 8}
              textAnchor="middle"
              fill="rgba(255,255,255,0.38)"
              fontSize="10"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {formatAxisTime(candles[i].t, tf)}
            </text>
          ))}

          {/* Legend */}
          <g transform={`translate(${padL + 6}, ${padT + 2})`}>
            <line x1="0" y1="6" x2="14" y2="6" stroke="#5b9cff" strokeWidth="1.5" />
            <text x="18" y="9" fill="rgba(255,255,255,0.5)" fontSize="9">
              MA9
            </text>
            <line x1="48" y1="6" x2="62" y2="6" stroke="#f0b429" strokeWidth="1.5" />
            <text x="66" y="9" fill="rgba(255,255,255,0.5)" fontSize="9">
              MA21
            </text>
          </g>
        </svg>

        {/* Hover OHLC strip (mobile-friendly) */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-2 pb-2 pt-0 font-mono text-[10px] text-white/45 sm:hidden">
          <span>O {formatAxisPrice(active.o, price)}</span>
          <span>H {formatAxisPrice(active.h, price)}</span>
          <span>L {formatAxisPrice(active.l, price)}</span>
          <span>C {formatAxisPrice(active.c, price)}</span>
        </div>
      </div>
    </div>
  );
}
