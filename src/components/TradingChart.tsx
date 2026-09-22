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
  "15m": 72,
  "1H": 56,
  "4H": 48,
  "1D": 40,
};

const TF_STEP_MS: Record<Tf, number> = {
  "15m": 15 * 60_000,
  "1H": 60 * 60_000,
  "4H": 4 * 60 * 60_000,
  "1D": 24 * 60 * 60_000,
};

const BULL = "#26a69a";
const BEAR = "#ef5350";
const GOLD = "#c4a35a";

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

  const dense: number[] = [];
  for (let i = 0; i < bars; i++) {
    const t = i / (bars - 1);
    const src = t * (series.length - 1);
    const a = Math.floor(src);
    const b = Math.min(series.length - 1, a + 1);
    const f = src - a;
    const idx = series[a] * (1 - f) + series[b] * f;
    const wobble =
      Math.sin(i * 1.7) * 0.32 +
      Math.sin(i * 0.37) * 0.5 +
      Math.cos(i * 0.91) * 0.18 +
      (upBias ? 0.06 : -0.06);
    dense.push((idx + wobble) * scale);
  }
  dense[dense.length - 1] = lastPx;

  const now = Date.now();
  const step = TF_STEP_MS[tf];
  const candles: Candle[] = [];
  for (let i = 0; i < dense.length; i++) {
    const c = dense[i];
    const prev = i === 0 ? firstIdx * scale : dense[i - 1];
    const drift = c - prev;
    const body = Math.abs(drift);
    const wick =
      Math.max(body * 0.6, lastPx * 0.001) * (0.65 + (i % 5) * 0.11);
    const o = prev;
    const h = Math.max(o, c) + wick * (0.3 + ((i * 3) % 7) * 0.07);
    const l = Math.min(o, c) - wick * (0.28 + ((i * 5) % 6) * 0.08);
    const v =
      38 +
      Math.abs(drift) * 20 +
      ((i * 17) % 31) * 2.4 +
      (body > lastPx * 0.0035 ? 42 : 0);
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

  const W = 760;
  const H = 460;
  const padL = 8;
  const padR = 58;
  const padT = 8;
  const volH = 78;
  const gap = 8;
  const chartBottom = H - 24;
  const priceBottom = chartBottom - volH - gap;
  const priceTop = padT + 22;
  const volTop = priceBottom + gap;

  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  const minP = Math.min(...lows);
  const maxP = Math.max(...highs);
  const padP = (maxP - minP) * 0.07 || maxP * 0.01;
  const yMin = minP - padP;
  const yMax = maxP + padP;
  const maxV = Math.max(...candles.map((c) => c.v), 1);

  const plotW = W - padL - padR;
  const slot = plotW / candles.length;
  const bodyW = Math.max(2.2, slot * 0.68);

  const xAt = (i: number) => padL + slot * i + slot / 2;
  const yAt = (p: number) =>
    priceTop + (1 - (p - yMin) / (yMax - yMin)) * (priceBottom - priceTop);
  const vyAt = (v: number) =>
    volTop + (1 - v / maxV) * (chartBottom - volTop - 2);

  const priceTicks = 7;
  const gridYs = Array.from({ length: priceTicks }, (_, i) => {
    const p = yMin + ((yMax - yMin) * i) / (priceTicks - 1);
    return { p, y: yAt(p) };
  });

  const timeIdx = [
    0,
    Math.floor(candles.length / 3),
    Math.floor((candles.length * 2) / 3),
    candles.length - 1,
  ];

  const hi = hover ?? candles.length - 1;
  const active = candles[hi];
  const activeUp = active.c >= active.o;
  const chg = active.c - candles[0].o;
  const chgPct = (chg / candles[0].o) * 100;
  const last = candles[candles.length - 1];

  const ma9Path = ma9
    .map((v, i) =>
      v == null
        ? null
        : `${i === 0 || ma9[i - 1] == null ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`
    )
    .filter(Boolean)
    .join(" ");
  const ma21Path = ma21
    .map((v, i) =>
      v == null
        ? null
        : `${i === 0 || ma21[i - 1] == null ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`
    )
    .filter(Boolean)
    .join(" ");

  // Soft area under close path
  const closeLine = closes
    .map((c, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(c).toFixed(1)}`)
    .join(" ");
  const closeArea = `${closeLine} L${xAt(closes.length - 1).toFixed(1)},${priceBottom} L${xAt(0).toFixed(1)},${priceBottom} Z`;

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
    <div className="-mx-5 sm:-mx-6">
      <div className="flex flex-wrap items-end justify-between gap-3 px-5 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-[1.35rem] font-semibold tracking-tight text-white">
              {formatAxisPrice(active.c, price)}
            </span>
            <span
              className={`font-mono text-[13px] font-semibold ${
                chgPct >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"
              }`}
            >
              {chgPct >= 0 ? "+" : ""}
              {formatAxisPrice(Math.abs(chg), price)} ({chgPct >= 0 ? "+" : ""}
              {chgPct.toFixed(2)}%)
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] tracking-wide text-white/40">
            <span className="text-white/55">O</span>{" "}
            {formatAxisPrice(active.o, price)}{" "}
            <span className="text-white/55">H</span>{" "}
            {formatAxisPrice(active.h, price)}{" "}
            <span className="text-white/55">L</span>{" "}
            {formatAxisPrice(active.l, price)}{" "}
            <span className="text-white/55">C</span>{" "}
            {formatAxisPrice(active.c, price)}
            <span className="mx-2 text-white/20">·</span>
            {symbol} · {tf}
          </p>
        </div>

        <div className="flex items-center gap-0.5">
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
                  ? "bg-[rgba(196,163,90,0.18)] text-[#e4d0a0]"
                  : "text-white/40 hover:text-white/75"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 h-auto w-full touch-pan-y"
        role="img"
        aria-label={`${symbol} live market chart`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={up ? BULL : BEAR}
              stopOpacity="0.14"
            />
            <stop offset="100%" stopColor={up ? BULL : BEAR} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="volFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.08" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Subtle gold wash — no hard plot frame */}
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          fill="url(#volFade)"
          opacity="0.55"
        />

        {gridYs.map(({ p, y }) => (
          <g key={p}>
            <line
              x1={padL}
              x2={padL + plotW}
              y1={y}
              y2={y}
              stroke="rgba(196,163,90,0.07)"
              strokeWidth={1}
            />
            <text
              x={W - 6}
              y={y + 3.5}
              textAnchor="end"
              fill="rgba(228,208,160,0.38)"
              fontSize="10"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {formatAxisPrice(p, price)}
            </text>
          </g>
        ))}

        {/* Volume separator */}
        <line
          x1={padL}
          x2={padL + plotW}
          y1={volTop - 2}
          y2={volTop - 2}
          stroke="rgba(196,163,90,0.1)"
          strokeWidth={1}
        />

        <text
          x={padL + 2}
          y={volTop + 11}
          fill="rgba(228,208,160,0.28)"
          fontSize="9"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          Vol
        </text>

        {candles.map((c, i) => {
          const bull = c.c >= c.o;
          const x = xAt(i) - bodyW / 2;
          const y = vyAt(c.v);
          const h = chartBottom - 2 - y;
          return (
            <rect
              key={`v-${i}`}
              x={x}
              y={y}
              width={bodyW}
              height={Math.max(1, h)}
              fill={bull ? "rgba(38,166,154,0.32)" : "rgba(239,83,80,0.32)"}
            />
          );
        })}

        <path d={closeArea} fill="url(#chartFade)" />

        <path
          d={ma21Path}
          fill="none"
          stroke={GOLD}
          strokeWidth="1.15"
          opacity="0.75"
        />
        <path
          d={ma9Path}
          fill="none"
          stroke="#7eb6ff"
          strokeWidth="1.2"
          opacity="0.85"
        />

        {candles.map((c, i) => {
          const bull = c.c >= c.o;
          const color = bull ? BULL : BEAR;
          const x = xAt(i);
          const yO = yAt(c.o);
          const yC = yAt(c.c);
          const top = Math.min(yO, yC);
          const bodyH = Math.max(1.15, Math.abs(yC - yO));
          return (
            <g key={`c-${i}`}>
              <line
                x1={x}
                x2={x}
                y1={yAt(c.h)}
                y2={yAt(c.l)}
                stroke={color}
                strokeWidth="1.05"
              />
              <rect
                x={x - bodyW / 2}
                y={top}
                width={bodyW}
                height={bodyH}
                fill={color}
              />
            </g>
          );
        })}

        {/* Last price */}
        <line
          x1={padL}
          x2={padL + plotW}
          y1={yAt(last.c)}
          y2={yAt(last.c)}
          stroke={up ? "rgba(38,166,154,0.55)" : "rgba(239,83,80,0.55)"}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <rect
          x={W - padR + 1}
          y={yAt(last.c) - 8}
          width={padR - 4}
          height={16}
          rx={2}
          fill={up ? BULL : BEAR}
        />
        <text
          x={W - 5}
          y={yAt(last.c) + 3.5}
          textAnchor="end"
          fill="#061018"
          fontSize="9.5"
          fontWeight="700"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {formatAxisPrice(last.c, price)}
        </text>

        {hover != null && (
          <g>
            <line
              x1={xAt(hi)}
              x2={xAt(hi)}
              y1={priceTop}
              y2={chartBottom}
              stroke="rgba(228,208,160,0.28)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <line
              x1={padL}
              x2={padL + plotW}
              y1={yAt(active.c)}
              y2={yAt(active.c)}
              stroke="rgba(228,208,160,0.28)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <circle
              cx={xAt(hi)}
              cy={yAt(active.c)}
              r={3.2}
              fill={activeUp ? BULL : BEAR}
              stroke="rgba(6,16,24,0.9)"
              strokeWidth="1.5"
            />
          </g>
        )}

        {timeIdx.map((i) => (
          <text
            key={`t-${i}`}
            x={xAt(i)}
            y={H - 6}
            textAnchor="middle"
            fill="rgba(228,208,160,0.32)"
            fontSize="10"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {formatAxisTime(candles[i].t, tf)}
          </text>
        ))}

        <g transform={`translate(${padL + 2}, ${padT + 2})`}>
          <line x1="0" y1="6" x2="12" y2="6" stroke="#7eb6ff" strokeWidth="1.4" />
          <text x="16" y="9" fill="rgba(255,255,255,0.38)" fontSize="9">
            MA9
          </text>
          <line x1="46" y1="6" x2="58" y2="6" stroke={GOLD} strokeWidth="1.4" />
          <text x="62" y="9" fill="rgba(255,255,255,0.38)" fontSize="9">
            MA21
          </text>
        </g>
      </svg>
    </div>
  );
}
