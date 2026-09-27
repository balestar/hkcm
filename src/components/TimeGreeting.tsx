"use client";

import { useEffect, useState } from "react";
import { formatDisplayName } from "@/lib/data";
import { greetingForLocale } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";

function firstNameFrom(fullName?: string) {
  const trimmed = fullName?.trim();
  if (!trimmed) return null;
  const first = trimmed.split(/\s+/)[0] ?? trimmed;
  return formatDisplayName(first);
}

export function TimeGreeting({
  className = "",
  name,
}: {
  className?: string;
  /** Profile full name from create-profile; greeting uses the first name. */
  name?: string;
}) {
  const { locale, t } = useLanguage();
  const firstName = firstNameFrom(name);
  const [text, setText] = useState(t.greeting.welcome);

  useEffect(() => {
    const update = () => {
      if (!firstName) {
        setText(t.greeting.welcome);
        return;
      }
      setText(greetingForLocale(new Date().getHours(), firstName, locale));
    };
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [firstName, locale, t]);

  return (
    <h1
      className={`font-display text-[2rem] leading-tight tracking-[-0.03em] text-[#152848] sm:text-[2.4rem] ${className}`}
    >
      {text}
    </h1>
  );
}
