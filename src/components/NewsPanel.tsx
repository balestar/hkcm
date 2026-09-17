import { NEWS } from "@/lib/data";

export function NewsPanel() {
  return (
    <section className="panel animate-rise-delay-3 p-5 sm:p-6">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
        Markets &amp; policy
      </p>
      <h2 className="mt-2 font-display text-[1.35rem] tracking-[-0.03em] text-ink">
        Germany trading · EU finance &amp; politics
      </h2>

      <ul className="mt-5 space-y-3">
        {NEWS.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-[var(--line)] bg-surface-soft/50 px-4 py-3.5 transition hover:bg-surface-soft"
          >
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              <span className="rounded-md bg-ink/90 px-1.5 py-0.5 text-white">
                {item.region}
              </span>
              <span>{item.category}</span>
              <span>·</span>
              <span>{item.time}</span>
            </div>
            <p className="mt-2 text-[15px] font-semibold leading-snug text-ink">
              {item.title}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-body">
              {item.summary}
            </p>
            <p className="mt-2 text-[12px] text-muted">{item.source}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
