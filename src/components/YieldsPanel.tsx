"use client";

import { YIELDS } from "@/lib/data";
import { useLanguage } from "@/components/LanguageProvider";

export function YieldsPanel() {
  const { t } = useLanguage();
  return (
    <section className="panel animate-rise-delay-2 p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            {t.yields.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-[1.35rem] tracking-[-0.03em] text-ink">
            {t.yields.title}
          </h2>
        </div>
      </div>

      <ul className="mt-5 divide-y divide-[var(--line)]">
        {YIELDS.map((y) => (
          <li key={y.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
            <div>
              <p className="text-[15px] font-semibold text-ink">{y.name}</p>
              <p className="mt-0.5 text-[13px] text-body">
                {t.yields.risk(y.risk)} · {y.lock}
              </p>
            </div>
            <p className="text-[15px] font-semibold text-gain">{y.apy}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
