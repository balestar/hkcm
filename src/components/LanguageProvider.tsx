"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  MESSAGES,
  isLocale,
  type Locale,
  type Messages,
} from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(stored)) setLocaleState(stored);
    } catch {
      /* keep default */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t: MESSAGES[locale] }),
    [locale, setLocale]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function LanguageSwitch({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { locale, setLocale, t } = useLanguage();
  const dark = variant === "dark";
  return (
    <div
      className={`inline-flex rounded-full p-0.5 ${
        dark ? "border border-white/15 bg-white/8" : "border border-[var(--line)] bg-surface-soft"
      }`}
      role="group"
      aria-label={t.profile.language}
    >
      {(["de", "en"] as const).map((code) => {
        const on = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold transition ${
              on
                ? dark
                  ? "bg-white text-[#0b1b3a]"
                  : "bg-white text-ink shadow-sm"
                : dark
                  ? "text-white/60 hover:text-white"
                  : "text-muted hover:text-ink"
            }`}
          >
            {code === "de" ? t.profile.german : t.profile.english}
          </button>
        );
      })}
    </div>
  );
}
