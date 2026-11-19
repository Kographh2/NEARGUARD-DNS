import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/auth";
import { formatDate, formatNumber } from "@/lib/format";
import {
  PIN_LOCKOUT_MINUTES,
  PIN_MAX_FAILED_ATTEMPTS,
  REVEAL_SESSION_SECONDS,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Keamanan",
  description: "Status keamanan admin NEAR ADGUARD.",
};

interface SecurityRow {
  admin_id: string;
  pin_updated_at: string;
  failed_attempts: number;
  locked_until: string | null;
}

interface AuditRow {
  id: number;
  admin_id: string;
  scope: string;
  at: string;
  expires_at: string;
}

interface ProfileRow {
  id: string;
  username: string;
}

export default async function AdminSecurityPage() {
  await requireAdmin();
  const service = createServiceClient();

  const [
    { data: security, error },
    { data: audits },
    { count: auditCount },
  ] = await Promise.all([
    service
      .from("admin_security")
      .select("admin_id, pin_updated_at, failed_attempts, locked_until"),
    service
      .from("ip_reveal_audit")
      .select("id, admin_id, scope, at, expires_at")
      .order("at", { ascending: false })
      .limit(20),
    service
      .from("ip_reveal_audit")
      .select("id", { count: "exact", head: true }),
  ]);

  const securityRows = (security ?? []) as SecurityRow[];
  const auditRows = (audits ?? []) as AuditRow[];
  const ids = [
    ...new Set([
      ...securityRows.map((row) => row.admin_id),
      ...auditRows.map((row) => row.admin_id),
    ]),
  ];

  let usernames = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profiles } = await service
      .from("profiles")
      .select("id, username")
      .in("id", ids);
    usernames = new Map(
      ((profiles ?? []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile.username,
      ]),
    );
  }

  return (
    <div>
      <header className="max-w-[70ch]">
        <h1 className="section-title">Keamanan</h1>
        <p className="section-copy">
          Status tabel keamanan admin. PIN, hash PIN, dan alamat IP tidak pernah
          ditampilkan di halaman ini.
        </p>
      </header>

      {error ? (
        <p role="alert" className="notice notice-error mt-5">
          Tabel keamanan belum bisa dibaca. Terapkan migrasi v1.5 terlebih
          dahulu.
        </p>
      ) : null}

      <section className="admin-section">
        <h2>Aturan yang aktif</h2>
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
            <tbody>
              <tr>
                <td>Percobaan PIN gagal</td>
                <td>{PIN_MAX_FAILED_ATTEMPTS} kali</td>
              </tr>
              <tr>
                <td>Kunci setelah gagal</td>
                <td>{PIN_LOCKOUT_MINUTES} menit</td>
              </tr>
              <tr>
                <td>Sesi reveal IP</td>
                <td>{REVEAL_SESSION_SECONDS} detik</td>
              </tr>
              <tr>
                <td>Reveal IP di aplikasi</td>
                <td className="muted">
                  Belum dibuat. Skema dan audit tersedia, tombol reveal belum
                  aktif.
                </td>
              </tr>
              <tr>
                <td>Akses tabel server-only</td>
                <td className="muted">
                  Dicabut dari anon dan authenticated. Hanya service-role yang
                  bisa membaca.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>Kunci admin</h2>
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Admin</th>
                <th>PIN diperbarui</th>
                <th>Gagal</th>
                <th>Terkunci sampai</th>
              </tr>
            </thead>
            <tbody>
              {securityRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    Belum ada PIN admin. Jalankan skrip bootstrap admin.
                  </td>
                </tr>
              ) : (
                securityRows.map((row) => (
                  <tr key={row.admin_id}>
                    <td className="font-mono">
                      {usernames.get(row.admin_id) ?? row.admin_id}
                    </td>
                    <td className="muted">{formatDate(row.pin_updated_at)}</td>
                    <td>{formatNumber(row.failed_attempts)}</td>
                    <td className="muted">
                      {row.locked_until ? formatDate(row.locked_until) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>Audit reveal terbaru</h2>
          <span className="small muted">{formatNumber(auditCount)} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Cakupan</th>
                <th>Waktu</th>
                <th>Kedaluwarsa</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    Belum ada audit reveal.
                  </td>
                </tr>
              ) : (
                auditRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono">
                      {usernames.get(row.admin_id) ?? row.admin_id}
                    </td>
                    <td>{row.scope}</td>
                    <td className="muted">{formatDate(row.at)}</td>
                    <td className="muted">{formatDate(row.expires_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
