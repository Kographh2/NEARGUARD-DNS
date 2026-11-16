import type { Metadata } from "next";
import Link from "next/link";

import { BRAND, DOMAIN, RETENTION_DEFAULTS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How NEAR ADGUARD handles account data, DNS counters, blocked-domain events, and encrypted IP addresses.",
};

const sections = [
  {
    title: "1. Who we are",
    body: [
      `${BRAND} is a personal, non-commercial DNS-over-HTTPS filtering service at ${DOMAIN}. It is built for iPhone, iPad, and Mac. It is not a VPN, it does not inspect page content, and it does not support Android.`,
      "This policy describes the data the service processes when you use the free DoH endpoint, create an account, install a DNS profile, or use the dashboard.",
    ],
  },
  {
    title: "2. Data we process",
    body: [
      "Account data: name, username, email address, password hash, role, account status, blocked-domain logging preference, and timestamps.",
      "Device metadata: device label, a keyed hash of the device identifier, user-agent family, country, first-seen and last-seen times, and request counters. Free clients are represented by aggregate counters, not per-device labels.",
      "Usage counters: daily requests, blocked requests, rate-limited requests, bytes, and country. These are aggregated and do not contain allowed query names.",
      "Blocked-domain events: only for registered users who enable blocked-domain logging. Events contain the blocked domain, device label, timestamp, and decision reason. They are capped and purged automatically.",
      "Encrypted IP addresses: stored as AES-256-GCM ciphertext in a separate table. They are used for abuse investigation and are visible to administrators only after PIN verification, with an audit log.",
      "Authentication data: session cookies, password-reset tokens (hashed), and security audit entries.",
      "Platform logs: Vercel and Supabase may process request metadata, error logs, and infrastructure logs under their own policies. These logs are outside the application's direct control and have short retention on the free plans.",
    ],
  },
  {
    title: "3. What we do not store",
    body: [
      "We do not store the names of allowed DNS queries. The DNS hot path records counters, not query names.",
      "We do not store full URLs, page content, search terms, or traffic payloads. DNS filtering cannot see them.",
      "We do not sell data, run advertising, or use third-party analytics on this site.",
    ],
  },
  {
    title: "4. Upstream resolvers",
    body: [
      "Allowed queries are forwarded to Cloudflare's DoH resolver, with Google's DoH resolver as a fallback. Those providers receive the domain being resolved and the network metadata needed to answer the query. Their own privacy policies apply.",
      "Blocked queries are answered locally and are not forwarded upstream.",
    ],
  },
  {
    title: "5. Why we process data",
    body: [
      "To resolve DNS queries, apply blocklists, enforce rate limits, protect the service from abuse, operate accounts and dashboards, send authentication and security emails, and comply with legal obligations.",
      "Where applicable, we rely on performance of a contract for account features, legitimate interests for security and service operation, and consent for optional blocked-domain logging.",
    ],
  },
  {
    title: "6. Retention",
    body: [
      `Blocked-domain events: ${RETENTION_DEFAULTS.blockedEventsDays} days by default, configurable by an administrator.`,
      `Daily usage aggregates: ${RETENTION_DEFAULTS.usageDailyDays} days by default.`,
      `Idle device records: ${RETENTION_DEFAULTS.idleDevicesDays} days by default. Purging device records does not delete accounts, device labels, or daily aggregates.`,
      "Encrypted IP records are purged on the same schedule as idle device records unless needed for an active abuse investigation.",
      "Account data is kept while the account exists. Deleting an account removes the account and its dependent data, subject to legal and security retention needs.",
    ],
  },
  {
    title: "7. Sharing",
    body: [
      "We use Vercel for hosting and serverless functions, Supabase for authentication and database services, and Resend for transactional email. These providers process data on our behalf under their terms.",
      "We may disclose data if required by law, to protect the service or its users, or during a merger or acquisition. We do not sell personal data.",
    ],
  },
  {
    title: "8. Security",
    body: [
      "Passwords are hashed with bcrypt. Sessions use HTTP-only cookies. IP addresses are encrypted at rest with a key stored only in the server environment. The IP vault is protected by row-level security, a PIN, lockout, a short-lived reveal session, and audit logging.",
      "No service is perfectly secure. Use a unique password and do not reuse your username as a secret.",
    ],
  },
  {
    title: "9. Your choices and rights",
    body: [
      "You can access and update your account data, delete blocked-domain history, disable blocked-domain logging, delete your account, and request a copy of your data from the dashboard or by contacting us.",
      "Depending on your jurisdiction, you may have rights to access, correct, delete, restrict, object, or port your data, and to withdraw consent. You may also lodge a complaint with your local data-protection authority.",
      "The service is intended for adults. It is not directed to children, and we do not knowingly collect data from children.",
    ],
  },
  {
    title: "10. Cookies",
    body: [
      "We use a session cookie for authentication and a short-lived cookie for the admin IP-reveal session. We do not use advertising or tracking cookies.",
    ],
  },
  {
    title: "11. International transfers",
    body: [
      "The service is hosted on Vercel and Supabase infrastructure that may process data outside your country. We choose regions and providers that are appropriate for a small personal deployment, but we cannot guarantee local data residency.",
    ],
  },
  {
    title: "12. Changes and contact",
    body: [
      "We may update this policy as the service changes. Material changes will be announced on this page.",
      "Contact: privacy@nearguard.biz.id. Replace this address with a monitored mailbox before public launch.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="container-page py-14 sm:py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
          Trust
        </p>
        <h1 className="section-title mt-3">Privacy policy</h1>
        <p className="section-copy">
          A plain-language description of what {BRAND} processes, why, and for
          how long. Last updated: November 16, 2026.
        </p>
        <div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100/70">
          This is a project policy, not legal advice. Have it reviewed against
          the laws that apply to you before public launch.
        </div>
      </div>

      <div className="mt-10 max-w-3xl space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-white">{section.title}</h2>
            <div className="mt-3 space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-slate-400">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 max-w-3xl border-t border-white/10 pt-6">
        <Link href="/" className="btn-secondary no-underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
