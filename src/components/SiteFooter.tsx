import Image from "next/image";

const SOCIALS = [
  { label: "YouTube", href: "https://www.youtube.com/@hkcm" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/hkcm" },
  { label: "Instagram", href: "https://www.instagram.com/hkc_management/" },
  { label: "X", href: "https://x.com/HKCM1" },
  { label: "TikTok", href: "https://www.tiktok.com/@hkcmanagement" },
  { label: "Facebook", href: "https://www.facebook.com/p/HKCM-100065608264874/" },
] as const;

const LEGAL = [
  { label: "Impressum", href: "https://hkcm.com/impressum" },
  { label: "Datenschutz", href: "https://hkcm.com/datenschutz" },
  { label: "AGB", href: "https://hkcm.com/agb" },
  { label: "Barrierefreiheitserklärung", href: "https://hkcm.com/barrierefreiheit" },
] as const;

type SiteFooterProps = {
  /** Match landing dark theme vs light dashboard. */
  variant?: "dark" | "light";
};

export function SiteFooter({ variant = "dark" }: SiteFooterProps) {
  const dark = variant === "dark";

  return (
    <footer
      className={
        dark
          ? "border-t border-white/10 bg-[#07090d] text-white"
          : "border-t border-[var(--line)] bg-surface-elevated text-ink"
      }
    >
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-12">
          <div>
            <Image
              src={dark ? "/logo-hkcm-light.png" : "/logo-hkcm.png"}
              alt="HKCM"
              width={140}
              height={36}
              className="h-8 w-auto"
            />
            <address
              className={`mt-5 not-italic text-[14px] leading-relaxed ${
                dark ? "text-white/55" : "text-body"
              }`}
            >
              Hasenbergsteige 5
              <br />
              70178 Stuttgart
              <br />
              Deutschland
            </address>
            <a
              href="tel:+497112200810"
              className={`mt-3 inline-block text-[14px] font-medium transition ${
                dark
                  ? "text-white/80 hover:text-white"
                  : "text-ink hover:opacity-70"
              }`}
            >
              +49 711 2200 81 0
            </a>
          </div>

          <div>
            <p
              className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${
                dark ? "text-white/45" : "text-body"
              }`}
            >
              Folge uns auf
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {SOCIALS.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-[14px] transition ${
                      dark
                        ? "text-white/75 hover:text-white"
                        : "text-ink hover:opacity-70"
                    }`}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className={`mt-10 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between ${
            dark ? "border-white/10" : "border-[var(--line)]"
          }`}
        >
          <p className={`text-[13px] ${dark ? "text-white/40" : "text-body"}`}>
            © 2026 HKCM - Alle Rechte vorbehalten
          </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[13px] transition ${
                  dark
                    ? "text-white/55 hover:text-white"
                    : "text-body hover:text-ink"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
