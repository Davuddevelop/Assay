import type { Metadata } from "next";
import {
  Fraunces,
  Hanken_Grotesk,
  JetBrains_Mono,
  Instrument_Serif,
} from "next/font/google";
import "./globals.css";

import { siteUrl } from "@/lib/env";
import { PLANS } from "@/lib/plans";

// Display — an editorial high-contrast serif for headlines and the wordmark.
// Optical sizing (engaged in globals.css) sharpens its contrast at large sizes.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// Body / UI — a clean, warm grotesque for running text and controls.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

const description =
  "A security checkpoint for apps built with Lovable, Bolt, Replit, and v0. Assay finds exposed keys, an open database, and missing protections — then hands you the exact fix and the hallmark.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Assay — Is your app safe to publish?",
  description,
  openGraph: {
    siteName: "Assay",
    title: "Assay — Is your app safe to publish?",
    description,
    url: siteUrl(),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Assay — Is your app safe to publish?",
    description,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Assay",
      url: siteUrl(),
      description,
    },
    {
      "@type": "SoftwareApplication",
      name: "Assay",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web",
      url: siteUrl(),
      description:
        "Security scanner for apps built with Lovable, Bolt, Replit, and v0.",
      offers: [
        {
          "@type": "Offer",
          name: PLANS.free.name,
          price: String(PLANS.free.priceMonthly),
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: PLANS.pro.name,
          price: String(PLANS.pro.priceMonthly),
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: PLANS.team.name,
          price: String(PLANS.team.priceMonthly),
          priceCurrency: "USD",
        },
      ],
    },
    {
      "@type": "WebSite",
      name: "Assay",
      url: siteUrl(),
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${fraunces.variable} ${hanken.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-onyx text-ivory">
        {/* Structured data for search engines — kept in sync with the
            metadata above and lib/plans.ts (no fabricated facts). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Shared metallic-gold gradient for hallmark strokes (referenced by url()). */}
        <svg width="0" height="0" aria-hidden className="absolute">
          <defs>
            <linearGradient
              id="assay-iris"
              gradientUnits="userSpaceOnUse"
              x1="3"
              y1="4"
              x2="21"
              y2="20"
            >
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="50%" stopColor="#8b8bf0" />
              <stop offset="100%" stopColor="#5b7cf0" />
            </linearGradient>
            <linearGradient id="assay-gold-metallic" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="50%" stopColor="#8b8bf0" />
              <stop offset="100%" stopColor="#5b7cf0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="atmosphere" aria-hidden />
        {children}
      </body>
    </html>
  );
}
