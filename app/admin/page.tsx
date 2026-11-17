import type { Metadata } from "next";
import Link from "next/link";

import { APP_VERSION_DISPLAY } from "@/lib/version";

export const metadata: Metadata = {
  title: "Admin",
  description: "Konsol administrasi NEAR ADGUARD.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-[65ch]">
        <h1 className="section-title">Konsol admin</h1>
        <p className="section-copy">
          Halaman ini belum tersambung ke data pengguna, perangkat, rate limit,
          atau blocklist. Akses admin dan reveal IP belum aktif di versi ini.
        </p>
        <p className="mt-4">
          <Link href="/login" className="btn-secondary">
            Masuk sebagai admin
          </Link>
        </p>
      </header>

      <section className="mt-8 max-w-3xl">
        <h2 className="text-lg font-semibold">Status</h2>
        <table className="data-table mt-3">
          <thead>
            <tr>
              <th>Bagian</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Pengguna dan role", "Belum tersambung"],
              ["Perangkat", "Belum tersambung"],
              ["Rate limit", "Belum tersambung"],
              ["Blocklist", "Dibaca dari artifact build"],
              ["IP vault", "Skema ada, reveal belum aktif"],
            ].map(([label, value]) => (
              <tr key={label}>
                <td>{label}</td>
                <td className="muted">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8 max-w-[65ch]">
        <h2 className="text-lg font-semibold">Catatan keamanan</h2>
        <p className="small muted mt-2">
          Tabel server-only dicabut dari anon dan authenticated. Reveal IP asli
          membutuhkan PIN, sesi singkat, dan audit. Fitur itu belum dibuat di
          kode aplikasi.
        </p>
      </section>

      <p className="small muted mt-10">
        NEAR ADGUARD {APP_VERSION_DISPLAY} ·{" "}
        <Link href="/changelog">Changelog</Link>
      </p>
    </div>
  );
}
