import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Legal notice for HKCM Charts — HKCM GmbH, Stuttgart.",
};

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:px-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
        Legal
      </p>
      <h1 className="mt-2 font-display text-[2rem] tracking-[-0.03em] text-ink">
        Impressum
      </h1>
      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-body">
        <p>
          HKCM GmbH
          <br />
          Hasenbergsteige 5
          <br />
          70178 Stuttgart
          <br />
          Deutschland
        </p>
        <p>
          This charts desk is operated for HKCM clients at{" "}
          <strong className="text-ink">charts-hkcm.de</strong>. Company legal
          pages live on the main site:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <a className="text-brand" href="https://hkcm.com/impressum">
              hkcm.com/impressum
            </a>
          </li>
          <li>
            <a className="text-brand" href="https://hkcm.com/datenschutz">
              Datenschutz
            </a>
          </li>
          <li>
            <a className="text-brand" href="https://hkcm.com/agb">
              AGB
            </a>
          </li>
        </ul>
      </div>
      <Link href="/" className="mt-10 inline-block text-[14px] font-semibold text-brand">
        ← Back to charts
      </Link>
    </main>
  );
}
