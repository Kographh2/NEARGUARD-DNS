import type { Metadata } from "next";
import Link from "next/link";

import blocklistMeta from "@/data/blocklist-meta.json";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/auth";
import { APP_URL, FREE_DOH_URL } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ringkasan",
  description: "Ringkasan konsol administrasi NEAR ADGUARD.",
};

interface UsageRow {
  requests: number | null;
  blocked: number | null;
  rate_limited: number | null;
}

interface RecentProfile {
  id: string;
  name: string;
  username: string;
  role: string;
  status: string;
  created_at: string;
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const service = createServiceClient();

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const activeSince = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    profiles,
    admins,
    suspended,
    devices,
    activeDevices,
    usage,
    blockedEvents,
    recentProfiles,
    overrides,
  ] = await Promise.all([
    service.from("profiles").select("id", { count: "exact", head: true }),
    service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin"),
    service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "suspended"),
    service.from("devices").select("id", { count: "exact", head: true }),
    service
      .from("devices")
      .select("id", { count: "exact", head: true })
      .gte("last_seen", activeSince.toISOString()),
    service
      .from("usage_daily")
      .select("requests, blocked, rate_limited")
      .eq("day", day),
    service
      .from("blocked_events")
      .select("id", { count: "exact", head: true })
      .gte("at", startOfDay.toISOString()),
    service
      .from("profiles")
      .select("id, name, username, role, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    service
      .from("rate_limit_overrides")
      .select("user_id", { count: "exact", head: true }),
  ]);

  const usageRows = (usage.data ?? []) as UsageRow[];
  const usageTotals = usageRows.reduce(
    (total, row) => ({
      requests: total.requests + Number(row.requests ?? 0),
      blocked: total.blocked + Number(row.blocked ?? 0),
      rateLimited: total.rateLimited + Number(row.rate_limited ?? 0),
    }),
    { requests: 0, blocked: 0, rateLimited: 0 },
  );
  const profilesList = (recentProfiles.data ?? []) as RecentProfile[];
  const hasReadError = [
    profiles,
    admins,
    suspended,
    devices,
    activeDevices,
    usage,
    blockedEvents,
    recentProfiles,
    overrides,
  ].some((result) => Boolean(result.error));
  const blocklist = blocklistMeta.totals;

  return (
    <div>
      <header className="max-w-[70ch]">
        <h1 className="section-title">Ringkasan</h1>
        <p className="section-copy">
          Data akun, perangkat, dan pemakaian yang tersimpan di Supabase. Tabel
          ini hanya bisa dibuka akun dengan peran admin.
        </p>
      </header>

      {hasReadError ? (
        <p role="alert" className="notice notice-error mt-5">
          Sebagian data belum bisa dibaca. Pastikan migrasi v1.5 sudah
          diterapkan dan kunci service-role valid.
        </p>
      ) : null}

      <section aria-label="Statistik utama" className="admin-stats">
        {[
          { label: "Pengguna", value: formatNumber(profiles.count) },
          { label: "Admin", value: formatNumber(admins.count) },
          { label: "Ditangguhkan", value: formatNumber(suspended.count) },
          { label: "Perangkat", value: formatNumber(devices.count) },
          {
            label: "Perangkat aktif 24 jam",
            value: formatNumber(activeDevices.count),
          },
          {
            label: "Permintaan hari ini",
            value: formatNumber(usageTotals.requests),
          },
          {
            label: "Diblokir hari ini",
            value: formatNumber(blockedEvents.count),
          },
          {
            label: "Rate limited hari ini",
            value: formatNumber(usageTotals.rateLimited),
          },
        ].map((stat) => (
          <div key={stat.label} className="stat">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>Pengguna terbaru</h2>
          <Link href="/admin/pengguna">Lihat semua</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Nama</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {profilesList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Belum ada data pengguna.
                  </td>
                </tr>
              ) : (
                profilesList.map((profile) => (
                  <tr key={profile.id}>
                    <td className="font-mono">{profile.username}</td>
                    <td>{profile.name}</td>
                    <td>{profile.role === "admin" ? "Admin" : "Pengguna"}</td>
                    <td>{profile.status}</td>
                    <td className="muted">{formatDate(profile.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>Status layanan</h2>
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
            <tbody>
              <tr>
                <td>Endpoint DoH gratis</td>
                <td className="font-mono small">{FREE_DOH_URL}</td>
              </tr>
              <tr>
                <td>Endpoint DoH akun</td>
                <td className="font-mono small">{APP_URL}/&lt;username&gt;</td>
              </tr>
              <tr>
                <td>Domain diblokir</td>
                <td>{formatNumber(blocklist.blockedDomains)}</td>
              </tr>
              <tr>
                <td>Blocklist dibangun</td>
                <td className="muted">
                  {formatDate(blocklistMeta.generatedAt)}
                </td>
              </tr>
              <tr>
                <td>Ukuran artifact</td>
                <td>
                  {(blocklist.binBytes / 1024 / 1024).toLocaleString("id-ID", {
                    maximumFractionDigits: 2,
                  })}{" "}
                  MB
                </td>
              </tr>
              <tr>
                <td>Tabrakan hash</td>
                <td>{formatNumber(blocklist.collisions)}</td>
              </tr>
              <tr>
                <td>Override rate limit</td>
                <td>{formatNumber(overrides.count)}</td>
              </tr>
              <tr>
                <td>Event sink DNS</td>
                <td className="muted">
                  Belum tersambung, event masih ditampung di memori.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
