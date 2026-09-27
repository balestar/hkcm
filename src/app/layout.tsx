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

export const metadata: Metadata = {
  metadataBase: new URL("https://charts-hkcm.de"),
  title: {
    default: "HKCM Charts",
    template: "%s · HKCM",
  },
  description:
    "Official HKCM charts desk — European market briefings, yields, and portfolio overview for HKCM clients. Operated by HKCM GmbH, Stuttgart.",
  applicationName: "HKCM Charts",
  authors: [{ name: "HKCM GmbH", url: "https://hkcm.com" }],
  creator: "HKCM GmbH",
  publisher: "HKCM GmbH",
  keywords: ["HKCM", "charts", "European markets", "investing", "Stuttgart"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://charts-hkcm.de",
    siteName: "HKCM Charts",
    title: "HKCM Charts",
    description:
      "Official HKCM charts desk for clients — markets, yields, and desk notes. HKCM GmbH, Stuttgart.",
    images: [{ url: "/logo-hkcm.png", width: 512, height: 128, alt: "HKCM" }],
  },
  twitter: {
    card: "summary",
    title: "HKCM Charts",
    description: "Official HKCM charts desk — HKCM GmbH, Stuttgart.",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
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
