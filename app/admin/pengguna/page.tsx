import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/auth";
import { formatDate, formatNumber } from "@/lib/format";
import {
  CATEGORY_LABELS,
  categoriesFromMask,
} from "@/lib/dns/categories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengguna",
  description: "Daftar pengguna NEAR ADGUARD.",
};

interface ProfileRow {
  id: string;
  name: string;
  username: string;
  role: string;
  status: string;
  log_blocked: boolean;
  categories: number;
  created_at: string;
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const service = createServiceClient();

  const [{ count, error }, { data }] = await Promise.all([
    service.from("profiles").select("id", { count: "exact", head: true }),
    service
      .from("profiles")
      .select(
        "id, name, username, role, status, log_blocked, categories, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const profiles = (data ?? []) as ProfileRow[];

  return (
    <div>
      <header className="max-w-[70ch]">
        <h1 className="section-title">Pengguna</h1>
        <p className="section-copy">
          {formatNumber(count)} akun terdaftar. Tabel menampilkan 100 akun
          terbaru. Username adalah path DoH publik, bukan rahasia.
        </p>
      </header>

      {error ? (
        <p role="alert" className="notice notice-error mt-5">
          Daftar pengguna belum bisa dibaca. Periksa migrasi dan kunci
          service-role.
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Nama</th>
              <th>Peran</th>
              <th>Status</th>
              <th>Log blokir</th>
              <th>Kategori</th>
              <th>Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  Belum ada akun.
                </td>
              </tr>
            ) : (
              profiles.map((profile) => {
                const categories = categoriesFromMask(
                  Number(profile.categories ?? 0),
                );
                return (
                  <tr key={profile.id}>
                    <td className="font-mono">{profile.username}</td>
                    <td>{profile.name}</td>
                    <td>
                      {profile.role === "admin" ? "Admin" : "Pengguna"}
                    </td>
                    <td>{profile.status}</td>
                    <td>{profile.log_blocked ? "Aktif" : "Mati"}</td>
                    <td className="small muted">
                      {categories.length === 0
                        ? "Tidak ada"
                        : categories
                            .map((category) => CATEGORY_LABELS[category])
                            .join(", ")}
                    </td>
                    <td className="muted">{formatDate(profile.created_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
