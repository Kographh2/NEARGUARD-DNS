import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CopyButton } from "@/components/ui/copy-button";
import { createRouteSupabaseClient } from "@/lib/auth";
import { APP_URL } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";
import { PROFILE_SIGNER_NAME } from "@/lib/mobileconfig";
import { APP_VERSION_DISPLAY } from "@/lib/version";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard akun NEAR ADGUARD.",
};

export const dynamic = "force-dynamic";

interface UsageRow {
  day: string;
  requests: number | null;
  blocked: number | null;
  rate_limited: number | null;
}

interface DeviceRow {
  id: string;
  label: string | null;
  tier: string;
  last_seen: string;
}

const devices = [
  {
    label: "iPhone",
    slug: "iphone",
    description: "Profil untuk iPhone dengan path perangkat iphone.",
  },
  {
    label: "iPad",
    slug: "ipad",
    description: "Profil untuk iPad dengan path perangkat ipad.",
  },
  {
    label: "Mac",
    slug: "mac",
    description: "Profil untuk Mac dengan path perangkat mac.",
  },
] as const;

export default async function DashboardPage() {
  const { supabase } = await createRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ data: profile }, { data: usageRows }, { data: deviceRows }, blocked] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, name, role, status")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("usage_daily")
        .select("day, requests, blocked, rate_limited")
        .eq("user_id", user.id)
        .gte("day", since.toISOString().slice(0, 10))
        .order("day", { ascending: false })
        .limit(30),
      supabase
        .from("devices")
        .select("id, label, tier, last_seen")
        .eq("user_id", user.id)
        .order("last_seen", { ascending: false })
        .limit(10),
      supabase
        .from("blocked_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("at", startOfDay.toISOString()),
    ]);

  const username =
    typeof profile?.username === "string" ? profile.username : null;
  const role = profile?.role === "admin" ? "Admin" : "Pengguna";
  const status = typeof profile?.status === "string" ? profile.status : null;
  const dohPath = username ? `${APP_URL}/${username}` : `${APP_URL}/username`;
  const usage = (usageRows ?? []) as UsageRow[];
  const userDevices = (deviceRows ?? []) as DeviceRow[];
  const totals = usage.reduce(
    (total, row) => ({
      requests: total.requests + Number(row.requests ?? 0),
      blocked: total.blocked + Number(row.blocked ?? 0),
      rateLimited: total.rateLimited + Number(row.rate_limited ?? 0),
    }),
    { requests: 0, blocked: 0, rateLimited: 0 },
  );

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[65ch]">
          <h1 className="section-title">Dashboard</h1>
          <p className="section-copy">
            Akun {user.email}. Username dan path DoH di bawah sudah aktif untuk
            akun ini.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {role === "Admin" ? (
            <Link href="/admin" className="btn-secondary">
              Konsol admin
            </Link>
          ) : null}
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="btn-secondary">
              Keluar
            </button>
          </form>
        </div>
      </header>

      <section aria-label="Ringkasan pemakaian" className="stat-grid">
        {[
          { label: "Permintaan 7 hari", value: formatNumber(totals.requests) },
          { label: "Diblokir 7 hari", value: formatNumber(totals.blocked) },
          {
            label: "Rate limited 7 hari",
            value: formatNumber(totals.rateLimited),
          },
          {
            label: "Diblokir hari ini",
            value: formatNumber(blocked.count),
          },
        ].map((stat) => (
          <div key={stat.label} className="stat">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="admin-section">
        <h2>URL DoH pribadi</h2>
        <p className="small muted mt-1">
          URL ini memakai username akun kamu. Path ini pengenal, bukan rahasia.
        </p>
        <div className="code-block mt-3">{dohPath}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton value={dohPath} label="Salin URL" />
          <Link href="#pasang-profil" className="btn-secondary">
            Pasang profil
          </Link>
        </div>
        <p className="small muted mt-2">
          Path per perangkat memakai bentuk {dohPath}/iphone.
        </p>
      </section>

      <section id="pasang-profil" className="admin-section">
        <h2>Pasang profil</h2>
        <p className="section-copy">
          Unduh profil dari perangkat Apple yang ingin dipakai. Profil berisi
          ServerURL pribadi {dohPath}/&lt;perangkat&gt; dan langsung aktif
          setelah dipasang. Profil ditandatangani dengan nama{" "}
          {PROFILE_SIGNER_NAME}. Sertifikat ini bukan sertifikat Apple, jadi iOS
          bisa menampilkan peringatan verifikasi.
        </p>

        {username ? (
          <div className="install-grid">
            {devices.map((device) => (
              <div key={device.slug} className="install-card">
                <h3>{device.label}</h3>
                <p className="small muted">{device.description}</p>
                <p className="small muted font-mono mt-2">
                  {dohPath}/{device.slug}
                </p>
                <a
                  href={`/dashboard/install/${device.slug}`}
                  className="btn-primary mt-3"
                >
                  Unduh profil {device.label}
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p role="alert" className="notice notice-error mt-4">
            Username akun belum tersedia. Profil belum bisa dibuat.
          </p>
        )}

        <ol className="mt-5 max-w-[65ch] space-y-2">
          {[
            "Buka dashboard ini di Safari pada perangkat Apple.",
            "Tap tombol unduh untuk perangkat yang dipakai.",
            "Buka Pengaturan, lalu Profile Downloaded, lalu Install.",
            "Masukkan passcode perangkat dan konfirmasi.",
            "Periksa Pengaturan, Umum, VPN & Manajemen Perangkat.",
          ].map((step, index) => (
            <li key={step}>
              <span className="font-semibold">{index + 1}.</span>{" "}
              <span className="muted">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="admin-section">
        <h2>Perangkat</h2>
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Label</th>
                <th>Tier</th>
                <th>Terakhir terlihat</th>
              </tr>
            </thead>
            <tbody>
              {userDevices.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">
                    Belum ada perangkat yang tercatat untuk akun ini.
                  </td>
                </tr>
              ) : (
                userDevices.map((device) => (
                  <tr key={device.id}>
                    <td>{device.label ?? "Tanpa label"}</td>
                    <td>{device.tier}</td>
                    <td className="muted">{formatDate(device.last_seen)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>Akun</h2>
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
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
        </div>
      </section>

      <p className="small muted mt-10">
        NEAR ADGUARD {APP_VERSION_DISPLAY} ·{" "}
        <Link href="/changelog">Changelog</Link>
      </p>
    </div>
  );
}
