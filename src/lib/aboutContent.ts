export type Expert = {
  id: string;
  name: string;
  role: string;
  image: string;
  cutout: string;
  linkedin: string;
  bio: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  image: string;
  linkedin: string;
  quote: string;
};

export const TEAM_VIDEO = {
  title: "Unser Team",
  /** Proxied via /api/team-video — Bunny locks direct CDN to hkcm.com referrers. */
  playlistPath: "playlist.m3u8",
  poster: "/video/unser-team-poster.jpg",
  source: "https://hkcm.com/ueber-uns",
};

export const PARTNERS = [
  {
    id: "sp",
    name: "S&P Global",
    logo: "/partners/sp-global.png",
  },
  {
    id: "reuters",
    name: "Thomson Reuters",
    logo: "/partners/reuters.png",
  },
];

export const EXPERTS: Expert[] = [
  {
    id: "philip-k",
    name: "Philip Klinkmüller",
    role: "Gründer & CEO",
    image: "/team/philip-klinkmueller.jpg",
    cutout: "/team/philip-klinkmueller-cut.png",
    linkedin: "https://www.linkedin.com/company/hkcm",
    bio: "Founder and managing partner. Leads HKCM analysis with 16+ years in technical analysis — Elliott Wave, indicators, and classical chart structure.",
  },
  {
    id: "philip-h",
    name: "Philip Hopf",
    role: "Gründer & Gesellschafter",
    image: "/team/philip-hopf-src.jpg",
    cutout: "/team/philip-hopf-src.jpg",
    linkedin: "https://www.linkedin.com/company/hkcm",
    bio: "Public markets communication and media positioning. Makes complex capital-market themes clear for private investors.",
  },
  {
    id: "emre",
    name: "Emre Şentürk",
    role: "Chief Operating Officer",
    image: "/team/emre-sentuerk.jpg",
    cutout: "/team/emre-sentuerk-cut.png",
    linkedin: "https://www.linkedin.com/company/hkcm",
    bio: "Owns operational excellence, leadership development, and scalable systems. Named COO of the Year (Europe): Fintech Growth & Operations.",
  },
  {
    id: "fredrik",
    name: "Fredrik Martens",
    role: "Chief Strategy Officer",
    image: "/team/fredrik-martens.jpg",
    cutout: "/team/fredrik-martens-cut.png",
    linkedin: "https://www.linkedin.com/company/hkcm",
    bio: "Long-term strategy for HKCM GLOBAL — product, growth markets, and scalable structures. Formerly BCG.",
  },
  {
    id: "dominik",
    name: "Dominik Kümmel",
    role: "Chief Marketing Officer",
    image: "/team/dominik-kuemmel.jpg",
    cutout: "/team/dominik-kuemmel-cut.png",
    linkedin: "https://www.linkedin.com/company/hkcm",
    bio: "Brand, growth, and education architecture — connecting research, product, and clear communication.",
  },
];

export const TEAM: TeamMember[] = [
  {
    id: "stefan",
    name: "Stefan Dölken",
    role: "IT-Teamleiter",
    image: "/team/stefan-doelken.png",
    linkedin: "https://www.linkedin.com/in/stefandoelken/",
    quote:
      "Bei der HKCM kann ich meine Begeisterung für die Finanzmärkte und moderne IT-Lösungen miteinander verbinden.",
  },
  {
    id: "julian",
    name: "Julian Marco Angele",
    role: "Teamleiter Marketing & Vertrieb",
    image: "/team/julian-angele.png",
    linkedin: "https://www.linkedin.com/in/julian-marco-angele-8a0742379/",
    quote:
      "Bei HKCM geht es nicht nur um Zahlen und Märkte, sondern vor allem um die Menschen, die gemeinsam daran arbeiten.",
  },
  {
    id: "murat",
    name: "Murat Örs, CFTe",
    role: "Technischer Analyst",
    image: "/team/murat-oers.png",
    linkedin: "https://www.linkedin.com/in/murat-oers/?locale=en",
    quote:
      "Analyse bedeutet für mich, aus Daten, Fakten und Marktbewegungen Klarheit zu schaffen und gemeinsam mit unserem Team echten Mehrwert zu bieten.",
  },
  {
    id: "amir",
    name: "Amir Soufi",
    role: "Creative Director",
    image: "/team/amir-soufi.png",
    linkedin: "https://www.linkedin.com/in/mramirsoufi/",
    quote:
      "HKCM gibt mir den kreativen Raum, aus Ideen Realität zu machen – gemeinsam mit einem großartigen Team.",
  },
  {
    id: "sebastian",
    name: "Sebastian Tölle",
    role: "Senior Infrastrukturentwickler / Teamleiter IT",
    image: "/team/sebastian-toelle.png",
    linkedin: "https://www.linkedin.com/company/hkcm",
    quote:
      "Ich entwickle bei HKCM sichere IT-Systeme und bringe meine Leidenschaft für Lösungen ein.",
  },
  {
    id: "verena",
    name: "Verena Möhring",
    role: "Senior Marketing Manager",
    image: "/team/verena-moehring.png",
    linkedin: "https://www.linkedin.com/in/verena-m%C3%B6hring-460359201/",
    quote:
      "Seit 20 Jahren faszinieren mich Finanzmärkte. Bei HKCM verbinde ich diese Leidenschaft mit Marketing und verständlicher Vermittlung.",
  },
  {
    id: "ramon",
    name: "Ramon Marquart",
    role: "Senior Social Media Manager",
    image: "/team/ramon-marquart.png",
    linkedin: "https://www.linkedin.com/in/ramonmarquart/",
    quote:
      "Bei HKCM verbinde ich Social Media, Content und Kampagnen, um Finanzthemen sichtbar und verständlich zu machen.",
  },
  {
    id: "manuel",
    name: "Manuel Horning",
    role: "Senior Backendentwickler",
    image: "/team/manuel-horning.png",
    linkedin: "https://www.linkedin.com/in/manuel-horning-298475289/",
    quote:
      "Mich motiviert es, bei der HKCM an herausstechenden, technischen Lösungen zu arbeiten.",
  },
];

export const ABOUT_STATS = [
  { value: "1.3M", label: "Community reach" },
  { value: "50k+", label: "Active clients" },
  { value: "89%", label: "Would recommend" },
  { value: "74%", label: "Hit rate" },
];

export const METHOD_PILLARS = [
  { title: "Charttechnik", text: "Structure, support, resistance, probabilities." },
  { title: "Makroökonomie", text: "Rates, inflation, policy, and growth." },
  { title: "Marktzyklen", text: "Historical patterns and recurring phases." },
  { title: "Sentiment", text: "Positioning and crowd mood." },
  { title: "Risikomanagement", text: "Clear scenarios — not blind forecasts." },
];
