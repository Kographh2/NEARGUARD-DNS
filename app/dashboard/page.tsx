import type { Metadata } from "next";
import Link from "next/link";

import { APP_URL } from "@/lib/constants";
import { APP_VERSION_DISPLAY } from "@/lib/version";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard akun NEAR ADGUARD.",
};

export default function DashboardPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-[65ch]">
        <h1 className="section-title">Dashboard</h1>
        <p className="section-copy">
          Halaman ini belum tersambung ke data akun. Setelah sesi dan query
          dashboard aktif, URL DoH pribadi, pemakaian, dan event blokir akan
          tampil di sini.
        </p>
        <p className="mt-4">
          <Link href="/login" className="btn-secondary">
            Masuk
          </Link>
        </p>
      </header>

      <section className="mt-8 max-w-3xl">
        <h2 className="text-lg font-semibold">Ringkasan</h2>
        <table className="data-table mt-3">
          <thead>
            <tr>
              <th>Data</th>
              <th>Nilai</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Permintaan hari ini", "Belum tersedia"],
              ["Diblokir hari ini", "Belum tersedia"],
              ["Rasio blokir", "Belum tersedia"],
              ["Perangkat aktif", "Belum tersedia"],
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
        <h2 className="text-lg font-semibold">URL DoH pribadi</h2>
        <p className="small muted mt-2">
          Format path akun terdaftar ada di bawah. Ganti bagian username dengan
          username kamu. Path ini pengenal, bukan rahasia.
        </p>
        <div className="code-block mt-2">{APP_URL}/username</div>
        <p className="small muted mt-2">
          Path per perangkat memakai bentuk {APP_URL}/username/iphone.
        </p>
      </section>

      <section className="mt-8 max-w-[65ch]">
        <h2 className="text-lg font-semibold">Aktivitas terbaru</h2>
        <p className="small muted mt-2">
          Belum ada data. Event log domain belum aktif. Setelah tersambung,
          log hanya tersedia untuk akun terdaftar yang mengaktifkan opsi log
          domain diblokir.
        </p>
      </section>

      <p className="small muted mt-10">
        NEAR ADGUARD {APP_VERSION_DISPLAY} ·{" "}
        <Link href="/changelog">Changelog</Link>
      </p>
    </div>
  );
}
