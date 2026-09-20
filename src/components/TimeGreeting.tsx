"use client";

import { useEffect, useState } from "react";
import { ACCOUNT, greetingForHour } from "@/lib/data";

export function TimeGreeting({
  className = "",
  name,
}: {
  className?: string;
  name?: string;
}) {
  const displayName = name?.trim() || ACCOUNT.name;
  const [text, setText] = useState(`Welcome, ${displayName}`);

  useEffect(() => {
    const update = () => {
      setText(greetingForHour(new Date().getHours(), displayName));
    };
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [displayName]);

  return (
    <h1
      className={`font-display text-[2rem] leading-tight tracking-[-0.03em] text-ink sm:text-[2.4rem] ${className}`}
    >
      {text}
    </h1>
  );
}
