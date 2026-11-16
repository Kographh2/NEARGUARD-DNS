import type { Metadata } from "next";
import Link from "next/link";

import { APP_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your NEAR ADGUARD account dashboard.",
};

export default function DashboardPage() {
  return (
    <div className="container-page py-14 sm:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Account
          </p>
          <h1 className="section-title mt-3">Dashboard</h1>
          <p className="section-copy">
            Your personal DoH URL, blocked-domain activity, and device labels
            appear here after sign-in.
          </p>
        </div>
        <Link href="/login" className="btn-secondary no-underline">
          Sign in
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Requests today", value: "—" },
          { label: "Blocked today", value: "—" },
          { label: "Block rate", value: "—" },
          { label: "Active devices", value: "—" },
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

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Personal DoH URL
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                This path is an identifier, not a secret.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
              Example
            </span>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <code className="block break-all font-mono text-xs leading-6 text-emerald-200">
              {APP_URL}/your-username
            </code>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="font-medium text-slate-200">Per-device path</p>
              <p className="mt-1 text-xs leading-5">
                {APP_URL}/your-username/iphone
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="font-medium text-slate-200">iOS profile</p>
              <p className="mt-1 text-xs leading-5">
                Generate a signed-by-you profile from the dashboard.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold text-white">
            Recent blocked domains
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Only available when blocked-domain logging is enabled.
          </p>
          <div className="mt-5 space-y-3">
            {["—", "—", "—", "—"].map((value, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm"
              >
                <span className="text-slate-500">No data yet</span>
                <span className="font-mono text-xs text-slate-600">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {[
          {
            title: "Devices",
            copy: "Add labels for iPhone, iPad, and Mac. Device labels are visible only to you and administrators.",
          },
          {
            title: "Rate-limit usage",
            copy: "See your per-minute and per-day usage against the registered limits.",
          },
          {
            title: "Privacy controls",
            copy: "Toggle blocked-domain logging and delete your history at any time.",
          },
        ].map((item) => (
          <div key={item.title} className="card">
            <h2 className="text-base font-semibold text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.copy}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
