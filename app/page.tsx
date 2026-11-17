import Link from "next/link";

import { CopyButton } from "@/components/ui/copy-button";
import blocklistMeta from "@/data/blocklist-meta.json";
import {
  APP_URL,
  BRAND,
  FREE_DOH_URL,
  RETENTION_DEFAULTS,
} from "@/lib/constants";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DEFAULT_CATEGORIES,
  categoryEnabled,
  type BlockCategory,
} from "@/lib/dns/categories";

const categoryCounts = blocklistMeta.categoryCounts as Record<string, number>;

const faqs = [
  {
    question: "Apakah ini butuh aplikasi atau VPN?",
    answer:
      "Tidak. Di iPhone, iPad, dan Mac kamu memasang profil DNS. Perangkat mengirim query DNS ke NEAR ADGUARD lewat HTTPS. Tidak ada tunnel VPN dan tidak ada aplikasi tambahan.",
  },
  {
    question: "Apakah Android didukung?",
    answer:
      "Tidak. Layanan ini dibuat untuk format profil DNS Apple dan perilaku iOS serta macOS.",
  },
  {
    question: "Apakah username itu rahasia?",
    answer:
      "Tidak. Path /username adalah pengenal, bukan kata sandi. Orang yang tahu username bisa mengirim query lewat path itu dan memengaruhi statistik serta kuota akun. Jangan pakai username sebagai rahasia.",
  },
  {
    question: "Apa yang disimpan untuk pengguna gratis?",
    answer:
      "Tidak ada log domain per pengguna gratis. Skema menyediakan penghitung agregat, tetapi pengiriman event dari resolver belum tersambung, jadi saat ini tidak ada data DNS yang ditulis ke database.",
  },
  {
    question: "Apa yang terjadi saat batas bulanan mendekati?",
    answer:
      "Circuit breaker menurunkan trafik gratis lebih dulu, lalu membatasi trafik gratis, lalu trafik akun terdaftar, dan terakhir semua trafik DoH kecuali administrator. Tujuannya menjaga deployment tetap di dalam batas Vercel Hobby.",
  },
  {
    question: "Apakah ini bisa dipakai komersial?",
    answer:
      "Tidak. Deployment ini pribadi dan non-komersial di Vercel Hobby. Pemakaian komersial membutuhkan paket Vercel lain dan peninjauan ulang batas serta ketentuannya.",
  },
] as const;

function formatNumber(value: number): string {
  return value.toLocaleString("id-ID");
}

function CategoryRow({ category }: { category: BlockCategory }) {
  const count = categoryCounts[category] ?? 0;
  const enabled = categoryEnabled(DEFAULT_CATEGORIES, category);
  return (
    <tr>
      <td>{CATEGORY_LABELS[category]}</td>
      <td className="font-mono">{formatNumber(count)}</td>
      <td className="muted">
        {enabled ? "Aktif secara default" : "Mati secara default"}
      </td>
    </tr>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="container-page border-b border-[var(--line)] py-10 sm:py-14">
        <div className="max-w-[65ch]">
          <p className="small muted">
            {BRAND} · DNS-over-HTTPS untuk iPhone, iPad, dan Mac
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
            DNS yang menolak domain iklan, pelacak, dan penipuan.
          </h1>
          <p className="section-copy">
            {BRAND} adalah resolver DNS-over-HTTPS untuk iPhone, iPad, dan Mac.
            DNS ini menolak domain yang sudah ada di daftar blokir dan
            meneruskan query lain ke resolver upstream.
          </p>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="small font-semibold">URL DoH gratis</p>
            <div className="code-block mt-1">{FREE_DOH_URL}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={FREE_DOH_URL} label="Salin URL" />
            <Link href="#pasang" className="btn-primary">
              Pasang di iPhone
            </Link>
          </div>
        </div>
        <p className="small muted mt-3">
          Tidak perlu akun. Batas gratis 120 permintaan per menit dan 3.000 per
          hari per IP.
        </p>
      </section>

      <section
        id="yang-diblokir"
        className="container-page border-b border-[var(--line)] py-10 sm:py-14"
      >
        <div className="max-w-[65ch]">
          <h2 className="section-title">Yang diblokir</h2>
          <p className="section-copy">
            Artifact blocklist berisi {formatNumber(blocklistMeta.totals.blockedDomains)}{" "}
            domain. Angka per kategori di bawah dihitung dari artifact yang
            sama dengan yang dibaca resolver.
          </p>
        </div>

        <div className="mt-6 max-w-3xl overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Domain</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORY_ORDER.map((category) => (
                <CategoryRow key={category} category={category} />
              ))}
            </tbody>
          </table>
        </div>

        <p className="small muted mt-4 max-w-[65ch]">
          Satu domain bisa masuk beberapa kategori. Angka per kategori karena
          itu tidak bisa dijumlahkan menjadi total. Kategori judi online tidak
          aktif secara default.
        </p>
      </section>

      <section
        id="cara-kerja"
        className="container-page border-b border-[var(--line)] py-10 sm:py-14"
      >
        <div className="max-w-[65ch]">
          <h2 className="section-title">Cara kerja</h2>
          <ol className="mt-5 space-y-4">
            <li>
              <span className="font-semibold">1. Perangkat mengirim query.</span>{" "}
              <span className="muted">
                iPhone, iPad, atau Mac mengirim query DNS lewat HTTPS ke endpoint
                DoH.
              </span>
            </li>
            <li>
              <span className="font-semibold">2. Resolver mencocokkan nama.</span>{" "}
              <span className="muted">
                Nama domain dicocokkan dengan artifact blocklist. Domain yang
                cocok dijawab dengan NXDOMAIN dan TTL singkat.
              </span>
            </li>
            <li>
              <span className="font-semibold">3. Query lain diteruskan.</span>{" "}
              <span className="muted">
                Query yang tidak diblokir diteruskan ke Cloudflare, dengan Google
                sebagai fallback. Nama domain yang diizinkan tidak disimpan.
              </span>
            </li>
          </ol>
        </div>
      </section>

      <section
        id="pasang"
        className="container-page border-b border-[var(--line)] py-10 sm:py-14"
      >
        <div className="max-w-[65ch]">
          <h2 className="section-title">Pasang di iPhone</h2>
          <p className="section-copy">
            Unduh profil DNS gratis, lalu pasang dari Safari. Profil ini tidak
            ditandatangani. iOS akan menampilkan peringatan “Unsigned”; itu
            normal. Kamu bisa menghapus profil kapan saja di Pengaturan.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`${APP_URL}/nearguard.mobileconfig`}
              className="btn-primary"
            >
              Unduh profil gratis
            </a>
            <Link href="/register" className="btn-secondary">
              Buat akun
            </Link>
          </div>
        </div>

        <ol className="mt-6 max-w-[65ch] space-y-3">
          {[
            "Buka tautan profil di Safari pada perangkat Apple.",
            "Tap Allow untuk mengunduh profil.",
            "Buka Pengaturan, lalu Profile Downloaded, lalu Install.",
            "Masukkan passcode perangkat dan konfirmasi.",
            "Periksa di Pengaturan, General, VPN & Device Management, DNS.",
            "Buka situs yang biasanya menampilkan iklan dan bandingkan hasilnya.",
          ].map((item, index) => (
            <li key={item}>
              <span className="font-semibold">{index + 1}.</span>{" "}
              <span className="muted">{item}</span>
            </li>
          ))}
        </ol>

        <div className="notice mt-6 max-w-[65ch]">
          <p className="font-semibold">Wi-Fi dengan captive portal</p>
          <p className="small muted mt-1">
            Jaringan kafe, hotel, atau bandara yang meminta login lewat halaman
            captive portal bisa gagal saat profil DNS aktif. Matikan profil DNS
            sementara, selesaikan login, lalu aktifkan lagi. Setelah itu query
            DNS kembali lewat NEAR ADGUARD.
          </p>
        </div>
      </section>

      <section className="container-page border-b border-[var(--line)] py-10 sm:py-14">
        <div className="max-w-[65ch]">
          <h2 className="section-title">Yang tidak dilindungi</h2>
          <ul className="mt-5 space-y-3">
            <li className="muted">
              DNS tidak bisa memblokir panggilan telepon atau SMS. Untuk
              panggilan tak dikenal, atur Silence Unknown Callers di iOS dan
              gunakan opsi pelaporan panggilan sampah yang tersedia.
            </li>
            <li className="muted">
              DNS tidak mengenkripsi isi halaman. Isi halaman bergantung pada
              HTTPS situs yang kamu buka.
            </li>
            <li className="muted">
              Ini bukan VPN. Layanan ini tidak membuat tunnel dan tidak
              menyembunyikan alamat IP dari situs yang kamu kunjungi.
            </li>
            <li className="muted">
              DNS tidak menghentikan permintaan tanda tangan wallet atau
              transaksi yang kamu setujui sendiri.
            </li>
            <li className="muted">
              Domain penipuan baru yang belum masuk daftar tidak akan terblokir.
              Gunakan data seluler atau jaringan tepercaya untuk transaksi, dan
              periksa alamat di perangkat wallet.
            </li>
          </ul>
        </div>
      </section>

      <section
        id="privasi"
        className="container-page border-b border-[var(--line)] py-10 sm:py-14"
      >
        <div className="max-w-[65ch]">
          <h2 className="section-title">Privasi</h2>
          <p className="section-copy">
            Hot path DNS tidak menyimpan nama domain yang diizinkan. Tabel di
            bawah membedakan data yang sudah disimpan dari data yang baru
            disiapkan di skema.
          </p>
        </div>

        <div className="mt-6 max-w-3xl overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Isi</th>
                <th>Masa simpan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nama domain yang diizinkan</td>
                <td>Tidak disimpan</td>
                <td>Tidak berlaku</td>
              </tr>
              <tr>
                <td>Penghitung pemakaian</td>
                <td>
                  Belum ditulis oleh resolver. Skema menyediakan penghitung
                  agregat.
                </td>
                <td>Batas skema {RETENTION_DEFAULTS.usageDailyDays} hari</td>
              </tr>
              <tr>
                <td>Domain diblokir</td>
                <td>
                  Belum aktif. Skema menyediakan event untuk akun terdaftar yang
                  mengaktifkan log.
                </td>
                <td>Batas skema {RETENTION_DEFAULTS.blockedEventsDays} hari</td>
              </tr>
              <tr>
                <td>Label perangkat</td>
                <td>
                  Belum ditulis oleh resolver. Skema menyediakan label dan hash
                  pengenal perangkat.
                </td>
                <td>
                  Batas skema {RETENTION_DEFAULTS.idleDevicesDays} hari setelah
                  perangkat tidak aktif
                </td>
              </tr>
              <tr>
                <td>IP asli</td>
                <td>
                  Tidak ditulis ke database oleh hot path. Tabel IP terenkripsi
                  ada di skema, tetapi belum dipakai oleh resolver.
                </td>
                <td>Tidak berlaku</td>
              </tr>
              <tr>
                <td>Data akun</td>
                <td>
                  Nama, username, email, hash kata sandi, peran, status,
                  preferensi log, dan kategori blokir
                </td>
                <td>Selama akun ada</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="small mt-4">
          <Link href="/privacy">Baca kebijakan privasi lengkap</Link>
        </p>
      </section>

      <section id="faq" className="container-page py-10 sm:py-14">
        <div className="max-w-[65ch]">
          <h2 className="section-title">Pertanyaan singkat</h2>
          <div className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {faqs.map((faq) => (
              <details key={faq.question} className="py-3">
                <summary className="cursor-pointer font-semibold">
                  {faq.question}
                </summary>
                <p className="small muted mt-2">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
