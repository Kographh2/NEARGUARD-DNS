import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/auth";
import { getRateLimitConfig } from "@/lib/env";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rate limit",
  description: "Konfigurasi rate limit NEAR ADGUARD.",
};

interface ConfigRow {
  tier: string;
  per_minute: number;
  per_day: number;
  updated_at: string;
}

interface OverrideRow {
  user_id: string;
  per_minute: number | null;
  per_day: number | null;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  username: string;
}

export default async function AdminRateLimitPage() {
  await requireAdmin();
  const service = createServiceClient();
  const effective = getRateLimitConfig();

  const [{ data: config, error }, { data: overrides }, { count }] =
    await Promise.all([
      service
        .from("rate_limit_config")
        .select("tier, per_minute, per_day, updated_at")
        .order("tier", { ascending: true }),
      service
        .from("rate_limit_overrides")
        .select("user_id, per_minute, per_day, updated_at")
        .order("updated_at", { ascending: false })
        .limit(100),
      service
        .from("rate_limit_overrides")
        .select("user_id", { count: "exact", head: true }),
    ]);

  const configRows = (config ?? []) as ConfigRow[];
  const overrideRows = (overrides ?? []) as OverrideRow[];
  const ids = [...new Set(overrideRows.map((row) => row.user_id))];

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
        <h1 className="section-title">Rate limit</h1>
        <p className="section-copy">
          Nilai efektif dibaca dari variabel lingkungan. Tabel database menjadi
          acuan konfigurasi dan override per akun. Halaman ini hanya membaca,
          tidak mengubah batas.
        </p>
      </header>

      {error ? (
        <p role="alert" className="notice notice-error mt-5">
          Konfigurasi database belum bisa dibaca. Periksa migrasi v1.5.
        </p>
      ) : null}

      <section className="admin-section">
        <h2>Nilai efektif</h2>
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Cakupan</th>
                <th>Per menit</th>
                <th>Per hari</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gratis per IP</td>
                <td>{formatNumber(effective.free.perMinute)}</td>
                <td>{formatNumber(effective.free.perDay)}</td>
              </tr>
              <tr>
                <td>Akun terdaftar</td>
                <td>{formatNumber(effective.registered.perMinute)}</td>
                <td>{formatNumber(effective.registered.perDay)}</td>
              </tr>
              <tr>
                <td>Per perangkat</td>
                <td>{formatNumber(effective.devicePerMinute)}</td>
                <td className="muted">-</td>
              </tr>
              <tr>
                <td>Per IP pada path akun</td>
                <td>{formatNumber(effective.registeredIpPerMinute)}</td>
                <td className="muted">-</td>
              </tr>
              <tr>
                <td>Username tidak dikenal</td>
                <td>{formatNumber(effective.unknownPerMinute)}</td>
                <td className="muted">-</td>
              </tr>
              <tr>
                <td>Perangkat baru</td>
                <td className="muted">-</td>
                <td>{formatNumber(effective.newDevicesPerHour)} per jam</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>Konfigurasi database</h2>
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Per menit</th>
                <th>Per hari</th>
                <th>Diperbarui</th>
              </tr>
            </thead>
            <tbody>
              {configRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    Belum ada baris konfigurasi.
                  </td>
                </tr>
              ) : (
                configRows.map((row) => (
                  <tr key={row.tier}>
                    <td>{row.tier}</td>
                    <td>{formatNumber(row.per_minute)}</td>
                    <td>{formatNumber(row.per_day)}</td>
                    <td className="muted">{formatDate(row.updated_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>Override akun</h2>
          <span className="small muted">
            {formatNumber(count)} override
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Akun</th>
                <th>Per menit</th>
                <th>Per hari</th>
                <th>Diperbarui</th>
              </tr>
            </thead>
            <tbody>
              {overrideRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    Belum ada override.
                  </td>
                </tr>
              ) : (
                overrideRows.map((row) => (
                  <tr key={row.user_id}>
                    <td className="font-mono">
                      {usernames.get(row.user_id) ?? row.user_id}
                    </td>
                    <td>
                      {row.per_minute === null
                        ? "Ikut akun"
                        : formatNumber(row.per_minute)}
                    </td>
                    <td>
                      {row.per_day === null
                        ? "Ikut akun"
                        : formatNumber(row.per_day)}
                    </td>
                    <td className="muted">{formatDate(row.updated_at)}</td>
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
