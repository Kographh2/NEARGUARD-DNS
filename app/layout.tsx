import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BRAND, DOMAIN } from "@/lib/constants";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${DOMAIN}`),
  title: {
    default: `${BRAND} — Private ad-blocking DNS for Apple devices`,
    template: `%s · ${BRAND}`,
  },
  description:
    "NEAR ADGUARD is a privacy-conscious DNS-over-HTTPS resolver with ad and tracker blocking for iPhone, iPad, and Mac. Free endpoint, optional account, no app required.",
  applicationName: BRAND,
  keywords: [
    "DNS-over-HTTPS",
    "DoH",
    "ad blocking DNS",
    "iPhone DNS profile",
    "privacy DNS",
    "NEAR ADGUARD",
  ],
  openGraph: {
    type: "website",
    url: `https://${DOMAIN}`,
    siteName: BRAND,
    title: `${BRAND} — Private ad-blocking DNS for Apple devices`,
    description:
      "Ad and tracker blocking at the DNS layer. DoH only. iOS and macOS profiles. No app, no Android.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND} — Private ad-blocking DNS for Apple devices`,
    description:
      "Ad and tracker blocking at the DNS layer. DoH only. iOS and macOS profiles. No app, no Android.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#05070a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-emerald-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
