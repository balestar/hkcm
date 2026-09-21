"use client";

import { useEffect, useState } from "react";
import { greetingForHour } from "@/lib/data";

function firstNameFrom(fullName?: string) {
  const trimmed = fullName?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function TimeGreeting({
  className = "",
  name,
}: {
  className?: string;
  /** Profile full name from create-profile; greeting uses the first name. */
  name?: string;
}) {
  const firstName = firstNameFrom(name);
  const [text, setText] = useState(
    firstName ? greetingForHour(new Date().getHours(), firstName) : "Welcome"
  );

  useEffect(() => {
    const update = () => {
      if (!firstName) {
        setText("Welcome");
        return;
      }
      setText(greetingForHour(new Date().getHours(), firstName));
    };
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [firstName]);

  return (
    <h1
      className={`font-display text-[2rem] leading-tight tracking-[-0.03em] text-ink sm:text-[2.4rem] ${className}`}
    >
      {text}
    </h1>
  );
}
