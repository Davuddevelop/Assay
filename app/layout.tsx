import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
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

export const metadata: Metadata = {
  title: "Assay — Certified, not assumed.",
  description:
    "An independent checkpoint for AI-written code. Assay runs your tests, a security scan, and a review against your own rules — then strikes the hallmark.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geist.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-onyx text-ivory">
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
