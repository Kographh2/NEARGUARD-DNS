import Link from "next/link";

import { BRAND, DOMAIN } from "@/lib/constants";
import { APP_VERSION_DISPLAY } from "@/lib/version";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container-page site-footer-inner">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-semibold text-[var(--fg)]">
            {BRAND} {APP_VERSION_DISPLAY}
          </p>
          <p>
            <Link href="/changelog">Changelog</Link>
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy">Kebijakan privasi</Link>
          <a href={`https://${DOMAIN}/dns-query`}>Endpoint DoH gratis</a>
          <Link href="/register">Buat akun</Link>
          <Link href="/login">Masuk</Link>
        </div>

        <p className="max-w-[65ch]">
          {BRAND} adalah proyek pribadi non-komersial di Vercel Hobby dan
          Supabase Free. DNS ini hanya memblokir nama domain. Tidak berafiliasi
          dengan AdGuard. Kontak:{" "}
          <a href="mailto:privacy@nearguard.biz.id">
            privacy@nearguard.biz.id
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
