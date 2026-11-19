import Link from "next/link";

import { SiteAccountNav } from "@/components/site-account";
import { BRAND } from "@/lib/constants";
import { APP_VERSION_DISPLAY } from "@/lib/version";

const navItems = [
  { href: "/#yang-diblokir", label: "Yang diblokir" },
  { href: "/#cara-kerja", label: "Cara kerja" },
  { href: "/#pasang", label: "Pasang" },
  { href: "/privacy", label: "Privasi" },
  { href: "/changelog", label: "Changelog" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container-page site-header-inner">
        <Link href="/" className="wordmark" aria-label={`${BRAND} beranda`}>
          {BRAND}
        </Link>

        <nav aria-label="Navigasi utama" className="site-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-nav">
          <Link href="/changelog" aria-label={`Versi ${APP_VERSION_DISPLAY}`}>
            {APP_VERSION_DISPLAY}
          </Link>
          <SiteAccountNav />
        </div>
      </div>
    </header>
  );
}
