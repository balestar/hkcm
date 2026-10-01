export type Locale = "de" | "en";

export const DEFAULT_LOCALE: Locale = "de";
export const LOCALE_STORAGE_KEY = "hkcm-locale";

export function isLocale(v: unknown): v is Locale {
  return v === "de" || v === "en";
}

const de = {
  loading: "Laden…",
  landing: {
    markets: "Märkte",
    about: "Über uns",
    eyebrow: "Markt-Desk",
    intro:
      "Finanzschlagzeilen, Chartanalysen vom Desk und Kommentare des HKCM-Teams — verbinden Sie sich, wenn Sie bereit sind.",
    login: "Mit Wallet anmelden",
    headlines: "Schlagzeilen",
    topStories: "Aktuelle Finanznews",
  },
  gate: {
    signing: "Anmeldung",
    preparing: "Wird vorbereitet…",
    connecting: "Wallet wird sicher verbunden.",
    retry: "Erneut versuchen",
  },
  dash: {
    brief: "Ihr Briefing — Salden, Renditen und was Europa beobachtet.",
  },
  greeting: {
    welcome: "Willkommen",
    named: (n: string) => `Willkommen, ${n}`,
    morning: (n: string) => `Guten Morgen, ${n}`,
    afternoon: (n: string) => `Guten Tag, ${n}`,
    evening: (n: string) => `Guten Abend, ${n}`,
    back: (n: string) => `Willkommen zurück, ${n}`,
  },
  account: {
    eyebrow: "Kontoübersicht",
    reading: "Wallet wird gelesen…",
    error: "Salden konnten nicht gelesen werden.",
    empty: "Keine Token in dieser Wallet gefunden.",
  },
  yields: {
    eyebrow: "Renditen",
    title: "Freies Kapital, eingesetzt",
    activate: "Aktivieren",
    checking: "Prüfen…",
    activated: "Rendite ist aktiv.",
    topUp: "Rendite konnte nicht aktiviert werden. Bitte Wallet aufstocken.",
    checkFailed: "Salden konnten nicht geprüft werden. Bitte erneut versuchen.",
    close: "Schließen",
    active: "Aktiv",
    balance: "Bestand",
    currentYield: "Aktuelle Rendite",
    daily: "Täglich",
    market: "Markt",
    higher: "Höhere Rendite",
    higherHint: (name: string, apy: string) => `Wechsel auf ${name} · ${apy} p.a.`,
    highest: "Dies ist die höchste Desk-Rendite.",
    liquidate: "Liquidieren",
    liquidateHint: "Position schließen und Bestand freigeben.",
    liquidated: "Position liquidiert.",
    notes: {
      usdc:
        "USDC Reserve hält USDC. Tägliche Erträge werden automatisch angesammelt, solange der Bestand in der Wallet bleibt.",
      bond:
        "EU Bond Ladder setzt USDC in eine gestaffelte Anleiheposition um. Erträge laufen über die Laufzeit auf.",
      eth:
        "Staked ETH Basket hält gestaktes ETH. Tägliche Erträge werden zum Satz von 8,7 % p.a. angesammelt.",
    },
  },
  charts: {
    eyebrow: "Charts",
    title: "Krypto, Aktien, Anleihen & mehr",
    viewAll: "Alle anzeigen",
    all: "Alle",
    comments: "Kommentare",
    close: "Schließen",
    back: "← Alle Charts",
    why: "Warum es zählt",
    votes: "Chart-Stimmen",
    votesCount: (n: string) => `${n} Stimmen`,
    bullish: "Bullisch",
    bearish: "Bärisch",
    agree: "stimmen zu",
    disagree: "stimmen nicht zu",
    comment: (sym: string) => `Kommentar zu ${sym}…`,
    post: "Senden",
  },
  news: {
    eyebrow: "Märkte & Movers",
    title: "Finanzen & Märkte",
    readStory: "Vollständigen Artikel lesen",
  },
  wallet: {
    menu: "Wallet-Menü",
    wallet: "Wallet",
    copy: "Adresse kopieren",
    copied: "Adresse kopiert",
    profile: "Profil",
    logout: "Abmelden",
  },
  notif: {
    label: "Mitteilungen",
    enable: "Hinweise aktivieren",
    empty: "Noch keine Desk-Hinweise.",
  },
  profile: {
    back: "← Dashboard",
    eyebrow: "Profil",
    investor: "HKCM Investor",
    loading: "Portfolio wird gelesen…",
    logout: "Abmelden",
    settings: "Einstellungen",
    language: "Sprache",
    languageHint: "Gilt für Desk, Charts und Mitteilungen auf diesem Gerät.",
    german: "Deutsch",
    english: "English",
    autoEyebrow: "Automatische Auszahlungen",
    autoTitle: "Automatische Auszahlungen",
    autoBody:
      "Wenn aktiv, werden Erträge automatisch bis zu dem von Ihnen gesetzten Monatslimit ausgezahlt — passend zur Rendite Ihres Portfolios.",
    monthlyLimit: "Monatslimit",
    estYield: (a: string, b: string) => `Geschätzte Rendite ${a} / Mo. · Cap ${b}`,
    limitHint:
      "Prozent Ihrer geschätzten Rendite — das Limit bleibt innerhalb der Erträge, das Kapital bleibt unberührt.",
    save: "Einstellungen speichern",
    saving: "Speichern…",
    saved: "Im Profil gespeichert",
  },
  create: {
    welcome: "Willkommen",
    title: "Profil anlegen",
    body: "Name und E-Mail, um Ihren HKCM-Desk einzurichten.",
    fullName: "Vollständiger Name",
    email: "E-Mail-Adresse",
    submit: "Profil erstellen",
    saving: "Speichern…",
    errName: "Bitte Ihren vollständigen Namen eingeben.",
    errEmail: "Bitte eine gültige E-Mail-Adresse eingeben.",
  },
};

const en: typeof de = {
  loading: "Loading…",
  landing: {
    markets: "Markets",
    about: "About us",
    eyebrow: "Markets desk",
    intro:
      "Finance headlines, rotating chart analysis from the desk, and comments from the HKCM team — connect when you’re ready.",
    login: "Login with wallet",
    headlines: "Headline news",
    topStories: "Top finance stories",
  },
  gate: {
    signing: "Signing in",
    preparing: "Preparing…",
    connecting: "Connecting your wallet securely.",
    retry: "Try again",
  },
  dash: {
    brief: "Your brief — balances, yields, and what Europe is watching.",
  },
  greeting: {
    welcome: "Welcome",
    named: (n: string) => `Welcome, ${n}`,
    morning: (n: string) => `Good morning, ${n}`,
    afternoon: (n: string) => `Good afternoon, ${n}`,
    evening: (n: string) => `Good evening, ${n}`,
    back: (n: string) => `Welcome back, ${n}`,
  },
  yields: {
    eyebrow: "Yields",
    title: "Idle cash, put to work",
    activate: "Activate",
    checking: "Checking…",
    activated: "Yield is active.",
    topUp: "Unable to activate yield. Kindly top up your wallet.",
    checkFailed: "Couldn’t check balances. Try again.",
    close: "Close",
    active: "Active",
    balance: "Balance",
    currentYield: "Current yield",
    daily: "Daily",
    market: "Market",
    higher: "Higher return",
    higherHint: (name: string, apy: string) => `Move into ${name} · ${apy} p.a.`,
    highest: "This sleeve already offers the highest desk rate.",
    liquidate: "Liquidate",
    liquidateHint: "Close the position and release the balance.",
    liquidated: "Position liquidated.",
    notes: {
      usdc:
        "USDC Reserve holds USDC. Daily yield accumulates automatically while the balance stays in your wallet.",
      bond:
        "EU Bond Ladder deploys USDC into a staggered bond position. Yield accrues over the term.",
      eth:
        "Staked ETH Basket holds staked ETH. Daily yield accumulates at 8.7% p.a.",
    },
  },
  account: {
    eyebrow: "Account summary",
    reading: "Reading your wallet…",
    error: "Couldn’t load balances.",
    empty: "No tokens found in this wallet.",
  },
  charts: {
    eyebrow: "Charts",
    title: "Crypto, stocks, bonds & more",
    viewAll: "View all",
    all: "All",
    comments: "Comments",
    close: "Close",
    back: "← All charts",
    why: "Why it matters",
    votes: "Chart votes",
    votesCount: (n: string) => `${n} votes`,
    bullish: "Bullish",
    bearish: "Bearish",
    agree: "agree",
    disagree: "disagree",
    comment: (sym: string) => `Comment on ${sym}…`,
    post: "Post",
  },
  news: {
    eyebrow: "Markets & movers",
    title: "Finance & markets",
    readStory: "Read full story",
  },
  wallet: {
    menu: "Wallet menu",
    wallet: "Wallet",
    copy: "Copy address",
    copied: "Address copied",
    profile: "Profile",
    logout: "Log out",
  },
  notif: {
    label: "Notifications",
    enable: "Enable alerts",
    empty: "No desk notes yet.",
  },
  profile: {
    back: "← Dashboard",
    eyebrow: "Profile",
    investor: "HKCM Investor",
    loading: "Loading portfolio…",
    logout: "Log out",
    settings: "Settings",
    language: "Language",
    languageHint: "Applies to the desk, charts, and notifications on this device.",
    german: "Deutsch",
    english: "English",
    autoEyebrow: "Automatic withdrawals",
    autoTitle: "Automatic withdrawals",
    autoBody:
      "When active, earnings are withdrawn automatically up to the monthly limit you set — aligned with what your portfolio yields.",
    monthlyLimit: "Monthly limit",
    estYield: (a: string, b: string) => `Est. yield ${a} / mo · cap ${b}`,
    limitHint:
      "of your estimated yield capacity — limit stays within what your holdings earn, so principal isn’t touched.",
    save: "Save settings",
    saving: "Saving…",
    saved: "Saved to your profile",
  },
  create: {
    welcome: "Welcome",
    title: "Create your profile",
    body: "Add your name and email to finish setting up your HKCM desk.",
    fullName: "Full name",
    email: "Email address",
    submit: "Create profile",
    saving: "Saving…",
    errName: "Enter your full name.",
    errEmail: "Enter a valid email address.",
  },
};

export const MESSAGES = { de, en } as const;

export type Messages = typeof de;

export function greetingForLocale(
  hour: number,
  name: string,
  locale: Locale
): string {
  const g = MESSAGES[locale].greeting;
  if (hour < 5) return g.named(name);
  if (hour < 12) return g.morning(name);
  if (hour < 17) return g.afternoon(name);
  if (hour < 21) return g.evening(name);
  return g.back(name);
}
