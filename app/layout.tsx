import type { Metadata, Viewport } from "next";

import { BRAND, DOMAIN } from "@/lib/constants";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${DOMAIN}`),
  title: {
    default: `${BRAND} · DNS penyaring untuk iPhone dan Mac`,
    template: `%s · ${BRAND}`,
  },
  description:
    "NEAR ADGUARD adalah resolver DNS-over-HTTPS untuk iPhone, iPad, dan Mac. Memblokir iklan, pelacak, dan domain berbahaya. Endpoint gratis, akun opsional, tanpa aplikasi.",
  applicationName: BRAND,
  keywords: [
    "DNS-over-HTTPS",
    "DoH",
    "DNS blokir iklan",
    "profil DNS iPhone",
    "DNS privasi",
    "NEAR ADGUARD",
  ],
  openGraph: {
    type: "website",
    url: `https://${DOMAIN}`,
    siteName: BRAND,
    title: `${BRAND} · DNS penyaring untuk iPhone dan Mac`,
    description:
      "Blokir iklan dan pelacak di lapisan DNS. DoH saja. Profil iOS dan macOS. Tanpa aplikasi, tanpa Android.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND} · DNS penyaring untuk iPhone dan Mac`,
    description:
      "Blokir iklan dan pelacak di lapisan DNS. DoH saja. Profil iOS dan macOS. Tanpa aplikasi, tanpa Android.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#101211" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
