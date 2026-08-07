import type { Metadata } from "next";
import {
  Instrument_Sans,
  Hanken_Grotesk,
  JetBrains_Mono,
  Instrument_Serif,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

import { siteUrl } from "@/lib/env";
import { PLANS } from "@/lib/plans";

// Display — a tight, sharp grotesque for headlines and the wordmark.
//
// This was Fraunces, an editorial high-contrast serif. At 3rem it read as
// classy; at the 5rem the hero needs it read as soft and floppy, which is the
// opposite of what an instrument-maker's brand should look like, and it fought
// the photograph instead of cutting through it.
//
// Instrument Sans is deliberately not a third unrelated family: it is the
// companion face to Instrument Serif, which this site already loads for the
// one-word italic accent. So headline and accent are now a designed pair
// rather than two faces that happened to be picked in different weeks — and
// the previous arrangement had two serifs (Fraunces + Instrument Serif)
// competing inside a single headline, which is why the accent never read as
// emphasis.
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
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
      // Literal, not metaphorical, and deliberately different in register from
      // the page copy above it. The headline's job is to win a human in three
      // seconds; this field's job is to be the sentence a model matches when
      // someone asks "how do I check if my Lovable app is secure". Both are
      // true — one is an argument, the other is a description.
      description:
        "Security scanner for vibe-coded and AI-built apps. Checks a live URL from the outside, with no access to your code, for API keys and secrets exposed in the browser bundle, a database readable without a login (Supabase row-level security disabled, Firebase rules left open), public file storage, exposed config files, and missing security headers — then explains each issue in plain English with the exact fix.",
      // The vocabulary people actually type. Kept out of the h1 on purpose:
      // the headline is the one thing competitors structurally cannot copy
      // (CLAUDE.md §10), and trading it for a keyword would be trading the
      // asset for the signpost. Structured data is where the signpost goes.
      keywords:
        "vibe coding security scanner, vibe coded app scanner, AI app security, Lovable security checker, Bolt.new security scanner, Replit app security, v0 security check, Supabase RLS checker, exposed API key scanner, Firebase rules check, MCP security server",
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
      className={`dark ${instrumentSans.variable} ${hanken.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full antialiased`}
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
        {children}
        {/* Page-level traffic and performance. Vercel's own, chosen over a
            general analytics suite because it sets no cookies and collects no
            personal data — so it needs no consent banner, and a product that
            tells people it stores almost nothing about them isn't quietly
            loading a tracker that does. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
