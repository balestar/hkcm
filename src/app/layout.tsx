import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import Providers from "@/components/Providers";
import { AuthProvider } from "@/components/AuthProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-hkcm",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const SHARE_TITLE = "HKCM · Struktur schlägt Stimmung";
const SHARE_DESCRIPTION =
  "Lies den Chart, nicht die Schlagzeile. Markt-Desk von Philip Hopf — HKCM GmbH, Stuttgart.";

export const metadata: Metadata = {
  metadataBase: new URL("https://charts-hkcm.de"),
  title: {
    default: SHARE_TITLE,
    template: "%s · HKCM",
  },
  description: SHARE_DESCRIPTION,
  applicationName: "HKCM Charts",
  authors: [{ name: "HKCM GmbH", url: "https://hkcm.com" }],
  creator: "HKCM GmbH",
  publisher: "HKCM GmbH",
  keywords: [
    "HKCM",
    "Charts",
    "Finanzmärkte",
    "Philip Hopf",
    "Investieren",
    "Stuttgart",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://charts-hkcm.de",
    siteName: "HKCM Charts",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  alternates: { canonical: "https://charts-hkcm.de" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${manrope.variable} ${syne.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "HKCM GmbH",
              url: "https://hkcm.com",
              logo: "https://charts-hkcm.de/logo-hkcm.png",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Hasenbergsteige 5",
                postalCode: "70178",
                addressLocality: "Stuttgart",
                addressCountry: "DE",
              },
              sameAs: ["https://hkcm.com", "https://www.linkedin.com/company/hkcm"],
            }),
          }}
        />
      </head>
      <body className="min-h-full font-sans antialiased">
        <Providers>
          <LanguageProvider>
            <AuthProvider>{children}</AuthProvider>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
