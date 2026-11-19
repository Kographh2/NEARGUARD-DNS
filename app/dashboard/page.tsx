import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createRouteSupabaseClient } from "@/lib/auth";
import { APP_URL } from "@/lib/constants";
import { APP_VERSION_DISPLAY } from "@/lib/version";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard akun NEAR ADGUARD.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase } = await createRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  const username =
    typeof profile?.username === "string" ? profile.username : null;
  const role = profile?.role === "admin" ? "Admin" : "Pengguna";
  const status = typeof profile?.status === "string" ? profile.status : null;
  const dohPath = username ? `${APP_URL}/${username}` : `${APP_URL}/username`;

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-[65ch]">
        <h1 className="section-title">Dashboard</h1>
        <p className="section-copy">
          Sesi akun aktif. Data pemakaian dan event blokir belum tersambung ke
          dashboard.
        </p>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <button type="submit" className="btn-secondary">
            Keluar
          </button>
        </form>
      </header>

      <section className="mt-8 max-w-3xl">
        <h2 className="text-lg font-semibold">Akun</h2>
        <table className="data-table mt-3">
          <thead>
            <tr>
              <th>Data</th>
              <th>Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Username</td>
              <td>{username ?? "Belum tersedia"}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>{user.email ?? "Belum tersedia"}</td>
            </tr>
            <tr>
              <td>Peran</td>
              <td>{role}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>{status ?? "Belum tersedia"}</td>
            </tr>
          </tbody>
        </table>
      </section>

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
          Ganti bagian username dengan username kamu. Path ini pengenal, bukan
          rahasia.
        </p>
        <div className="code-block mt-2">{dohPath}</div>
        <p className="small muted mt-2">
          Path per perangkat memakai bentuk {dohPath}/iphone.
        </p>
      </section>

      <section className="mt-8 max-w-[65ch]">
        <h2 className="text-lg font-semibold">Aktivitas terbaru</h2>
        <p className="small muted mt-2">
          Belum ada data. Event log domain belum aktif. Setelah tersambung, log
          hanya tersedia untuk akun terdaftar yang mengaktifkan opsi log domain
          diblokir.
        </p>
      </section>

      <p className="small muted mt-10">
        NEAR ADGUARD {APP_VERSION_DISPLAY} ·{" "}
        <Link href="/changelog">Changelog</Link>
      </p>
    </div>
  );
}
