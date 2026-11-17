import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Atur ulang kata sandi",
  description: "Informasi atur ulang kata sandi NEAR ADGUARD.",
};

export default function ResetPasswordPage() {
  return (
    <div className="panel">
      <h1 className="section-title">Atur ulang kata sandi</h1>
      <p className="section-copy">
        Fitur atur ulang kata sandi belum tersedia di versi ini. Route API untuk
        memproses token reset belum dibuat.
      </p>
      <p className="small mt-4">
        Kembali ke <Link href="/login">halaman masuk</Link>.
      </p>
    </div>
  );
}
