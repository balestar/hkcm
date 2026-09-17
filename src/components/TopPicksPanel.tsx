import { TOP_PICKS } from "@/lib/data";

export function TopPicksPanel() {
  return (
    <section className="panel animate-rise-delay-4 p-5 sm:p-6">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
        Top picks
      </p>
      <h2 className="mt-2 font-display text-[1.35rem] tracking-[-0.03em] text-ink">
        Trending crypto &amp; stocks
      </h2>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {TOP_PICKS.map((pick) => {
          const up = pick.changePct >= 0;
          return (
            <li
              key={pick.id}
              className="rounded-2xl border border-[var(--line)] bg-surface-elevated px-4 py-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-ink">
                      {pick.symbol}
                    </span>
                    <span className="rounded-md bg-surface-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {pick.kind}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-body">{pick.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-semibold text-ink">{pick.price}</p>
                  <p className={`text-[13px] font-semibold ${up ? "text-gain" : "text-loss"}`}>
                    {up ? "+" : ""}
                    {pick.changePct.toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[12px] text-muted">{pick.why}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
