import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin",
  description: "NEAR ADGUARD administration console.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="container-page py-14 sm:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
            Restricted
          </p>
          <h1 className="section-title mt-3">Admin console</h1>
          <p className="section-copy">
            User, device, rate-limit, blocklist, and security administration.
            Every IP reveal is PIN-gated and audited.
          </p>
        </div>
        <Link href="/login" className="btn-secondary no-underline">
          Admin sign in
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Users", value: "—" },
          { label: "Devices", value: "—" },
          { label: "Requests today", value: "—" },
          { label: "Blocked today", value: "—" },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-base font-semibold text-white">Users and roles</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Promote or demote administrators, suspend accounts, and inspect
            per-user device counts and rate-limit usage.
          </p>
        </section>
        <section className="card border-amber-300/15 bg-amber-300/[0.03]">
          <h2 className="text-base font-semibold text-white">IP vault</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Real IPs are encrypted at rest. The default view shows rotating
            decoy IPs. Revealing a real IP requires the admin PIN, a short-lived
            session, and an audit entry.
          </p>
        </section>
        <section className="card">
          <h2 className="text-base font-semibold text-white">Rate limits</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Edit free, registered, per-device, per-IP guard, unknown-username,
            and new-device thresholds. Changes are validated and audited.
          </p>
        </section>
        <section className="card">
          <h2 className="text-base font-semibold text-white">Blocklist</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Inspect source counts, add allowlist overrides, and review the
            latest rebuild. The DNS hot path reads only the generated artifact.
          </p>
        </section>
      </div>
    </div>
  );
}
