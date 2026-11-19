import type { Metadata } from "next";
import Link from "next/link";

import { BRAND, DOMAIN, RETENTION_DEFAULTS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privasi",
  description:
    "Cara NEAR ADGUARD menangani data akun, penghitung DNS, event blokir, dan alamat IP terenkripsi.",
};

const sections = [
  {
    title: "1. Tentang layanan",
    body: [
      `${BRAND} adalah layanan penyaring DNS-over-HTTPS untuk iPhone, iPad, dan Mac di ${DOMAIN}. Layanan ini bukan VPN, tidak membaca isi halaman, dan tidak mendukung Android.`,
      "Kebijakan ini menjelaskan data yang diproses saat kamu memakai endpoint DoH gratis, membuat akun, memasang profil DNS, atau membuka dashboard.",
      "Versi 1.5 belum menyambungkan semua tabel ke resolver. Bagian yang masih berupa skema atau belum aktif ditandai di bawah.",
    ],
  },
  {
    title: "2. Data akun",
    body: [
      "Saat mendaftar, Supabase Auth memproses nama, username, email, kata sandi, dan waktu pembuatan akun. Aplikasi tidak menyimpan kata sandi mentah.",
      "Profil menyimpan nama, username, peran, status, preferensi log domain diblokir, kategori blokir, dan timestamp. Kolom kategori dan preferensi log sudah ada di skema, tetapi resolver belum memuatnya per akun.",
      "Supabase Auth mengirim email konfirmasi dan email autentikasi lain sesuai konfigurasi proyek.",
    ],
  },
  {
    title: "3. Data DNS",
    body: [
      "Nama domain yang diizinkan tidak disimpan. Hot path DNS hanya membuat event di memori untuk penghitung dan tidak menulis nama domain yang diizinkan ke database.",
      "Saat ini belum ada event sink yang tersambung, jadi resolver tidak menulis penghitung harian atau event blokir ke database. Skema untuk penghitung, event blokir, dan kategori sudah disiapkan untuk tahap berikutnya.",
      "Saat event sink aktif nanti, event blokir hanya disimpan untuk akun terdaftar yang mengaktifkan log domain diblokir. Event berisi domain yang diblokir, label perangkat, waktu, dan kategori.",
      "Kami tidak menyimpan URL lengkap, isi halaman, istilah pencarian, atau payload lalu lintas. DNS filtering tidak bisa melihat data itu.",
    ],
  },
  {
    title: "4. Alamat IP",
    body: [
      "Tabel alamat IP terenkripsi sudah ada di skema, tetapi resolver belum menulis ke tabel itu. Reveal IP admin juga belum dibuat di kode aplikasi.",
      "Jika fitur itu diaktifkan nanti, alamat IP akan disimpan sebagai ciphertext AES-256-GCM di tabel terpisah, dipakai untuk investigasi penyalahgunaan, dan hanya bisa dibuka admin setelah verifikasi PIN dengan audit.",
      "Vercel dan Supabase dapat memproses metadata request, log error, dan log infrastruktur sesuai kebijakan mereka. Log platform berada di luar kendali langsung aplikasi.",
    ],
  },
  {
    title: "5. Resolver upstream",
    body: [
      "Query yang diizinkan diteruskan ke resolver DoH Cloudflare, dengan resolver DoH Google sebagai fallback. Kedua penyedia menerima domain yang diminta dan metadata jaringan yang diperlukan untuk menjawab query. Kebijakan privasi mereka berlaku.",
      "Query yang diblokir dijawab secara lokal dan tidak diteruskan ke upstream.",
    ],
  },
  {
    title: "6. Retensi",
    body: [
      `Batas default di skema: event blokir ${RETENTION_DEFAULTS.blockedEventsDays} hari, agregat pemakaian harian ${RETENTION_DEFAULTS.usageDailyDays} hari, dan perangkat idle ${RETENTION_DEFAULTS.idleDevicesDays} hari.`,
      "Pembersihan otomatis belum dijadwalkan. Selama belum ada cron atau fungsi pembersihan, data yang sudah ditulis tidak dihapus otomatis.",
      "Data akun disimpan selama akun ada. Penghapusan akun lewat dashboard belum tersedia; permintaan penghapusan bisa dikirim ke alamat kontak di bawah.",
    ],
  },
  {
    title: "7. Pihak ketiga",
    body: [
      "Layanan ini memakai Vercel untuk hosting dan fungsi serverless, Supabase untuk autentikasi dan database, serta Cloudflare dan Google untuk resolver upstream.",
      "Data dapat diungkapkan jika diwajibkan hukum, untuk melindungi layanan atau penggunanya, atau dalam proses merger atau akuisisi. Data tidak dijual.",
    ],
  },
  {
    title: "8. Keamanan",
    body: [
      "Kata sandi ditangani Supabase Auth dan tidak disimpan mentah oleh aplikasi. Sesi dikelola lewat cookie yang dipasang oleh integrasi Supabase.",
      "Tabel server-only dicabut dari anon dan authenticated. Kunci service-role hanya dipakai di server. Tidak ada layanan yang sepenuhnya aman; pakai kata sandi unik dan jangan anggap username sebagai rahasia.",
    ],
  },
  {
    title: "9. Pilihan dan hak",
    body: [
      "Kamu bisa meminta akses, koreksi, salinan, atau penghapusan data akun dengan menghubungi alamat kontak di bawah. Fitur dashboard untuk mengubah profil dan menghapus riwayat belum tersedia di versi ini.",
      "Tergantung yurisdiksi, kamu mungkin punya hak untuk membatasi, menolak, atau memindahkan data, serta menarik persetujuan. Kamu juga bisa mengajukan keluhan ke otoritas perlindungan data setempat.",
      "Layanan ini ditujukan untuk orang dewasa dan tidak diarahkan kepada anak-anak.",
    ],
  },
  {
    title: "10. Cookie",
    body: [
      "Cookie dipakai untuk sesi autentikasi. Situs ini tidak memakai cookie iklan atau pelacak.",
    ],
  },
  {
    title: "11. Perubahan dan kontak",
    body: [
      "Kebijakan ini dapat berubah saat layanan berubah. Perubahan penting akan diumumkan di halaman ini.",
      "Kontak: privacy@nearguard.biz.id.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-[65ch]">
        <h1 className="section-title">Privasi</h1>
        <p className="section-copy">
          Penjelasan bahasa sederhana tentang data yang diproses {BRAND}, alasannya,
          dan berapa lama datanya disimpan. Terakhir diperbarui: 18 November 2026.
        </p>
        <p className="notice mt-5">
          Ini kebijakan proyek, bukan nasihat hukum. Mintakan tinjauan hukum
          sebelum peluncuran publik.
        </p>
      </header>

      <div className="mt-10 max-w-3xl space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <div className="mt-3 space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 max-w-3xl border-t border-[var(--line)] pt-6">
        <Link href="/" className="btn-secondary">
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
