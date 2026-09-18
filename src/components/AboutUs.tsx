"use client";

import Image from "next/image";
import {
  ABOUT_STATS,
  EXPERTS,
  METHOD_PILLARS,
  PARTNERS,
  TEAM,
  TEAM_VIDEO,
} from "@/lib/aboutContent";
import { TeamVideoPlayer } from "@/components/TeamVideoPlayer";

function LinkedInBadge({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-7 w-7 items-center justify-center rounded-md transition hover:opacity-90"
      aria-label="LinkedIn"
    >
      <Image src="/partners/linkedin.png" alt="" width={28} height={28} className="h-7 w-7" />
    </a>
  );
}

export function AboutUs({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 12% -5%, rgba(99, 140, 255, 0.32), transparent 55%),
            radial-gradient(ellipse 70% 50% at 92% 8%, rgba(56, 189, 248, 0.12), transparent 50%),
            linear-gradient(165deg, #050b18 0%, #0a162e 32%, #0f2148 58%, #06101f 100%)
          `,
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <button
          type="button"
          onClick={onBack}
          className="text-[14px] font-medium text-white/70 transition hover:text-white"
        >
          ← Markets
        </button>
        <Image
          src="/logo-hkcm-light.png"
          alt="HKCM"
          width={140}
          height={36}
          className="h-8 w-auto"
          priority
        />
        <span className="w-16" />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24 pt-2 sm:px-10">
        <section className="animate-rise max-w-3xl pb-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-soft">
            Über uns
          </p>
          <h1 className="mt-3 font-display text-[2.2rem] leading-[1.05] tracking-[-0.04em] text-white sm:text-[3rem]">
            We analyse markets so investors decide with clarity.
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-white/65">
            Founded by analysts who invest themselves. Our methodology was built
            at the markets — not in a textbook. Details from{" "}
            <a
              href={TEAM_VIDEO.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-soft underline-offset-2 hover:underline"
            >
              hkcm.com/ueber-uns
            </a>
            .
          </p>
        </section>

        <section className="animate-rise-delay-1 mb-12">
          <TeamVideoPlayer />
        </section>

        {/* Stats */}
        <section className="animate-rise-delay-2 mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ABOUT_STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-5 text-center backdrop-blur-sm"
            >
              <p className="font-display text-[1.6rem] tracking-[-0.03em] text-white">
                {s.value}
              </p>
              <p className="mt-1 text-[12px] text-white/50">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Method */}
        <section className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Our approach
          </p>
          <h2 className="mt-1 font-display text-[1.45rem] tracking-[-0.03em] text-white">
            No gut feel. Clear analysis.
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {METHOD_PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4"
              >
                <p className="text-[14px] font-semibold text-white">{p.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/55">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Experts */}
        <section className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Unsere Experten
          </p>
          <h2 className="mt-1 font-display text-[1.45rem] tracking-[-0.03em] text-white">
            Experience across market desks
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {EXPERTS.map((e) => (
              <article
                key={e.id}
                className="overflow-hidden rounded-[20px] border border-[#d8e0ec] bg-[#f4f6fa] shadow-[0_16px_40px_rgba(5,12,28,0.2)]"
              >
                <div className="relative aspect-[4/5] bg-gradient-to-b from-[#1a2d52] to-[#0c1833]">
                  <Image
                    src={e.cutout}
                    alt={e.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="relative px-4 py-4">
                  <div className="absolute right-3 top-3">
                    <LinkedInBadge href={e.linkedin} />
                  </div>
                  <h3 className="pr-10 text-[15px] font-bold text-ink">{e.name}</h3>
                  <p className="mt-0.5 text-[12px] text-[#6b7c96]">{e.role}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#3d4f6a]">{e.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Team cards */}
        <section className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Das Team hinter HKCM
          </p>
          <h2 className="mt-1 font-display text-[1.45rem] tracking-[-0.03em] text-white">
            Research, product, and markets — together
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {TEAM.map((m) => (
              <article
                key={m.id}
                className="relative rounded-[18px] border border-[#e2e8f0] bg-[#f7f8fb] p-4 shadow-[0_10px_28px_rgba(5,12,28,0.14)]"
              >
                <div className="absolute right-3 top-3">
                  <LinkedInBadge href={m.linkedin} />
                </div>
                <div className="flex items-start gap-3 pr-8">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
                    <Image
                      src={m.image}
                      alt={m.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-ink">{m.name}</h3>
                    <p className="text-[12px] text-[#6b7c96]">{m.role}</p>
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-[#3d4f6a]">
                  {m.quote}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Partners */}
        <section className="rounded-[22px] border border-white/10 bg-[#0a1630]/80 px-6 py-8 text-center">
          <p className="text-[13px] font-medium text-white/50">
            In Zusammenarbeit mit
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-10">
            {PARTNERS.map((p) => (
              <Image
                key={p.id}
                src={p.logo}
                alt={p.name}
                width={180}
                height={40}
                className="h-8 w-auto opacity-90 brightness-0 invert sm:h-9"
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
