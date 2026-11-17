import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="container-page py-16 sm:py-20">
      <div className="max-w-[65ch]">
        <p className="font-mono small muted">404</p>
        <h1 className="section-title mt-2">Halaman tidak ditemukan</h1>
        <p className="section-copy">
          Path yang kamu buka tidak ada. Jika ini URL DoH pribadi, periksa
          username di dashboard.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary">
            Kembali ke beranda
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
