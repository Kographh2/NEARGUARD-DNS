import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lupa kata sandi",
  description: "Informasi pemulihan akun NEAR ADGUARD.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="panel">
      <h1 className="section-title">Lupa kata sandi</h1>
      <p className="section-copy">
        Fitur reset kata sandi lewat email belum tersedia di versi ini. Route
        API untuk mengirim tautan reset belum dibuat.
      </p>
      <p className="small mt-4">
        Kembali ke <Link href="/login">halaman masuk</Link>.
      </p>
    </div>
  );
}
