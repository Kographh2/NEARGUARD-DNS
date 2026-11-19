export type ChangelogTag = "Baru" | "Perbaikan" | "Perubahan" | "Keamanan";

export interface ChangelogItem {
  tag: ChangelogTag;
  text: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  items: readonly ChangelogItem[];
}

export const CHANGELOG: readonly ChangelogEntry[] = [
  {
    version: "1.5.1",
    date: "2026-11-18",
    items: [
      {
        tag: "Perbaikan",
        text: "Dashboard memeriksa sesi Supabase, menampilkan akun yang masuk, dan menyediakan tombol keluar.",
      },
      {
        tag: "Perbaikan",
        text: "Halaman masuk mengalihkan pengguna yang sudah punya sesi ke dashboard.",
      },
    ],
  },
  {
    version: "1.5",
    date: "2026-11-18",
    items: [
      {
        tag: "Baru",
        text: "Skema kategori blokir per akun: iklan, pelacak, malware, phishing, penipuan, penipuan kripto, dan judi online. Judi online mati secara default; pengaturan kategori di dashboard belum aktif.",
      },
      {
        tag: "Baru",
        text: "Halaman changelog statis dan nomor versi di header serta footer.",
      },
      {
        tag: "Baru",
        text: "Skema database v1.5 dengan profil, perangkat, penghitung harian, event blokir, pengaturan, dan RPC flush_dns_counters.",
      },
      {
        tag: "Perbaikan",
        text: "Profil DNS gratis kini disajikan oleh /nearguard.mobileconfig, bukan halaman info username.",
      },
      {
        tag: "Perbaikan",
        text: "Form daftar dan masuk mengirim ke route API, bukan ke alamat /api sebagai halaman.",
      },
      {
        tag: "Perubahan",
        text: "Blocklist menyimpan bit kategori dan memakai sumber HaGeZi, OISD, StevenBlack, Phishing Army, The Block List Project, MetaMask, dan HaGeZi TIF Mini.",
      },
      {
        tag: "Perubahan",
        text: "Teks antarmuka ditulis dalam bahasa Indonesia dan tata letak dibuat ringan tanpa animasi atau pustaka UI.",
      },
      {
        tag: "Keamanan",
        text: "RLS membatasi profil, perangkat, pemakaian, dan event ke pemiliknya. Tabel server-only dicabut dari anon dan authenticated.",
      },
    ],
  },
];
