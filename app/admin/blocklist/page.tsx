import type { Metadata } from "next";

import blocklistMeta from "@/data/blocklist-meta.json";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatNumber } from "@/lib/format";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type BlockCategory,
} from "@/lib/dns/categories";

export const metadata: Metadata = {
  title: "Blocklist",
  description: "Status artifact blocklist NEAR ADGUARD.",
};

interface SourceRow {
  name: string;
  url: string;
  status: string;
  entries?: number;
  bytes?: number;
  categories?: string[];
  license?: string;
}

const categoryCounts = blocklistMeta.categoryCounts as Record<string, number>;
const sources = blocklistMeta.sources as SourceRow[];
const totals = blocklistMeta.totals;

export default async function AdminBlocklistPage() {
  await requireAdmin();

  return (
    <div>
      <header className="max-w-[70ch]">
        <h1 className="section-title">Blocklist</h1>
        <p className="section-copy">
          Artifact yang dibaca resolver. Angka diambil dari laporan build
          terakhir, bukan dihitung ulang saat halaman dibuka.
        </p>
      </header>

      <section className="admin-stats">
        {[
          { label: "Domain diblokir", value: formatNumber(totals.blockedDomains) },
          { label: "Domain unik", value: formatNumber(totals.uniqueDomains) },
          { label: "Entri terbaca", value: formatNumber(totals.parsedEntries) },
          { label: "Dibuang allowlist", value: formatNumber(totals.allowlisted) },
          { label: "Tabrakan hash", value: formatNumber(totals.collisions) },
          {
            label: "Ukuran artifact",
            value: `${(totals.binBytes / 1024 / 1024).toLocaleString("id-ID", {
              maximumFractionDigits: 2,
            })} MB`,
          },
        ].map((stat) => (
          <div key={stat.label} className="stat">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="admin-section">
        <h2>Jumlah per kategori</h2>
        <p className="small muted mt-1">
          Dibangun {formatDate(blocklistMeta.generatedAt)}. Satu domain bisa
          masuk beberapa kategori.
        </p>
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Domain</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORY_ORDER.map((category: BlockCategory) => (
                <tr key={category}>
                  <td>{CATEGORY_LABELS[category]}</td>
                  <td>{formatNumber(categoryCounts[category] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>Sumber</h2>
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Status</th>
                <th>Entri</th>
                <th>Ukuran</th>
                <th>Kategori</th>
                <th>Lisensi</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.name}>
                  <td>
                    <span className="font-semibold">{source.name}</span>
                    <br />
                    <span className="small muted font-mono">{source.url}</span>
                  </td>
                  <td>{source.status}</td>
                  <td>{formatNumber(source.entries)}</td>
                  <td>
                    {source.bytes
                      ? `${(source.bytes / 1024 / 1024).toLocaleString("id-ID", {
                          maximumFractionDigits: 2,
                        })} MB`
                      : "-"}
                  </td>
                  <td className="small muted">
                    {(source.categories ?? []).join(", ") || "-"}
                  </td>
                  <td className="small muted">{source.license ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
