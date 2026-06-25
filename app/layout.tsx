import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
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
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-onyx text-ivory">
        {/* Shared metallic-gold gradient for hallmark strokes (referenced by url()). */}
        <svg width="0" height="0" aria-hidden className="absolute">
          <defs>
            <linearGradient id="assay-gold-metallic" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e8ce8f" />
              <stop offset="52%" stopColor="#c9a24b" />
              <stop offset="100%" stopColor="#8a6a2e" />
            </linearGradient>
          </defs>
        </svg>
        <div className="atmosphere" aria-hidden />
        {children}
      </body>
    </html>
  );
}
