import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/auth";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Perangkat",
  description: "Daftar perangkat NEAR ADGUARD.",
};

interface DeviceRow {
  id: string;
  user_id: string | null;
  tier: string;
  label: string | null;
  ua_family: string | null;
  country_code: string | null;
  first_seen: string;
  last_seen: string;
}

interface ProfileRow {
  id: string;
  username: string;
}

export default async function AdminDevicesPage() {
  await requireAdmin();
  const service = createServiceClient();

  const [{ count, error }, { data }] = await Promise.all([
    service.from("devices").select("id", { count: "exact", head: true }),
    service
      .from("devices")
      .select(
        "id, user_id, tier, label, ua_family, country_code, first_seen, last_seen",
      )
      .order("last_seen", { ascending: false })
      .limit(100),
  ]);

  const devices = (data ?? []) as DeviceRow[];
  const userIds = [
    ...new Set(
      devices
        .map((device) => device.user_id)
        .filter((value): value is string => typeof value === "string"),
    ),
  ];

  let usernames = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await service
      .from("profiles")
      .select("id, username")
      .in("id", userIds);

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
        <h1 className="section-title">Perangkat</h1>
        <p className="section-copy">
          {formatNumber(count)} perangkat tercatat. Tabel menampilkan 100
          perangkat yang terakhir terlihat. Alamat IP tidak ditampilkan di
          halaman ini.
        </p>
      </header>

      {error ? (
        <p role="alert" className="notice notice-error mt-5">
          Data perangkat belum bisa dibaca. Periksa migrasi dan kunci
          service-role.
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Akun</th>
              <th>Tier</th>
              <th>UA</th>
              <th>Negara</th>
              <th>Pertama</th>
              <th>Terakhir</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  Belum ada perangkat. Hot path belum menulis perangkat ke
                  database.
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr key={device.id}>
                  <td>{device.label ?? "Tanpa label"}</td>
                  <td className="font-mono">
                    {device.user_id
                      ? usernames.get(device.user_id) ?? "Tidak ditemukan"
                      : "Gratis"}
                  </td>
                  <td>{device.tier}</td>
                  <td className="muted">{device.ua_family ?? "-"}</td>
                  <td className="muted">{device.country_code ?? "-"}</td>
                  <td className="muted">{formatDate(device.first_seen)}</td>
                  <td className="muted">{formatDate(device.last_seen)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
