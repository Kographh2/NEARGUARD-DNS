import type { Metadata } from "next";
import Link from "next/link";

import { CHANGELOG } from "@/content/changelog";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Changelog",
  description: `Perubahan versi ${BRAND}.`,
};

export default function ChangelogPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-[65ch]">
        <h1 className="section-title">Changelog</h1>
        <p className="section-copy">
          Catatan perubahan yang benar-benar ada di kode. Versi terbaru muncul
          lebih dulu.
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {CHANGELOG.map((entry) => (
          <section key={entry.version}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] pb-2">
              <h2 className="text-xl font-semibold">v{entry.version}</h2>
              <time dateTime={entry.date} className="small muted">
                {entry.date}
              </time>
            </div>
            <ul className="mt-4 space-y-3">
              {entry.items.map((item) => (
                <li key={`${entry.version}-${item.tag}-${item.text}`}>
                  <span className="small font-semibold">{item.tag}</span>
                  <span className="small muted">: {item.text}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm">
        <Link href="/">Kembali ke beranda</Link>
      </p>
    </div>
  );
}
