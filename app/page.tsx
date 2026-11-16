import Link from "next/link";

import { CopyButton } from "@/components/ui/copy-button";
import { APP_URL, BRAND, FREE_DOH_URL } from "@/lib/constants";

const features = [
  {
    title: "Network-level blocking",
    copy: "Ads, trackers, malware, and phishing domains are stopped before a connection is made. Domain and suffix blocking only — no content inspection.",
    icon: "shield",
  },
  {
    title: "Built for Apple devices",
    copy: "Install a signed-by-you DNS profile in Safari. Works with iPhone, iPad, and Mac through the native DNS settings. Android is not supported.",
    icon: "apple",
  },
  {
    title: "DoH only",
    copy: "Every request is encrypted HTTPS on port 443. No plaintext port 53, no DoT, no DoQ, and no traffic interception.",
    icon: "lock",
  },
  {
    title: "Private by design",
    copy: "Allowed query names are never stored. Free clients get aggregate counters only. Registered users choose whether blocked domains are logged.",
    icon: "eye",
  },
  {
    title: "Per-account paths",
    copy: "A registered account gets a personal DoH URL, optional per-device labels, and a dashboard with blocked-domain and rate-limit visibility.",
    icon: "user",
  },
  {
    title: "Honest limits",
    copy: "Free infrastructure has real limits. The service documents them, applies request-rate limits, and uses a circuit breaker to stay inside the monthly cap.",
    icon: "gauge",
  },
] as const;

const faqs = [
  {
    question: "Does this require an app or VPN?",
    answer:
      "No. On iOS, iPadOS, and macOS you install a DNS configuration profile. The system sends DNS queries to NEAR ADGUARD over HTTPS. No VPN tunnel is created and no app is required.",
  },
  {
    question: "Is Android supported?",
    answer:
      "No. Android is out of scope. The service is designed around Apple's DNS profile format and iOS/macOS behavior.",
  },
  {
    question: "Is a username a secret?",
    answer:
      "No. A /username path is an identifier, not a secret. Anyone who knows it could send queries through it and affect that account's stats and quota. Per-IP limits, anomaly flags, and optional device labels reduce abuse. Do not treat the username as a password.",
  },
  {
    question: "What does the free tier store?",
    answer:
      "Free clients produce aggregate counters only: requests, blocked, rate-limited, country, and last-seen. Free clients do not get per-domain logs.",
  },
  {
    question: "What happens when the monthly cap is near?",
    answer:
      "A circuit breaker throttles free-tier traffic first, then hard-throttles free traffic, then registered traffic, and finally all DoH traffic except administrators. The goal is to keep the deployment inside the Vercel Hobby invocation cap instead of being paused.",
  },
  {
    question: "Can I use this commercially?",
    answer:
      "No. This deployment is personal and non-commercial on Vercel Hobby. Commercial use requires a different Vercel plan and a fresh review of limits and terms.",
  },
  {
    question: "Why is every DNS query a serverless request?",
    answer:
      "The resolver runs as a Vercel Function. Each DoH query is one invocation. At the documented starting scale of four devices at 4,000 queries/day, the service stays within the Hobby invocation and CPU allowances with headroom.",
  },
] as const;

function FeatureIcon({ name }: { name: (typeof features)[number]["icon"] }) {
  const paths: Record<string, string> = {
    shield: "M12 3 19 6v5c0 4.4-2.8 7.7-7 9-4.2-1.3-7-4.6-7-9V6l7-3Z",
    apple: "M15.5 7.2c.8-1 1.4-2.3 1.2-3.6-1.2.1-2.6.8-3.4 1.8-.7.9-1.4 2.2-1.2 3.5 1.3.1 2.6-.7 3.4-1.7ZM18.8 17c-.6 1.4-1.4 2.8-2.5 3.9-.9.9-2 1.6-3.2 1.6-1.2 0-1.7-.7-3.1-.7-1.5 0-2 .7-3.2.7-1.2 0-2.4-.8-3.3-1.8-2.3-2.4-3.6-6.7-2.3-9.7.9-2.1 2.8-3.5 4.9-3.6 1.3 0 2.5.8 3.2.8.7 0 2.2-.9 3.7-.8 1.2.1 2.4.6 3.2 1.5-3 1.7-2.5 5.8.4 7.1Z",
    lock: "M7 10V8a5 5 0 0 1 10 0v2m-9 0h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z",
    eye: "M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Zm9 2.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    gauge: "M5 19a9 9 0 1 1 14 0M12 12l4-4",
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name] ?? paths.shield} />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="container-page grid gap-14 pb-20 pt-16 sm:pt-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <span className="badge">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Private DNS for Apple devices
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl sm:leading-[1.02]">
              A quieter internet,
              <span className="block text-emerald-300">one DNS query at a time.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              {BRAND} blocks ads and trackers at the DNS layer for iPhone, iPad,
              and Mac. No app. No VPN. Just an encrypted DNS-over-HTTPS profile
              and a resolver that never stores allowed query names.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/#install" className="btn-primary no-underline">
                Install on iPhone
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14m-5-5 5 5-5 5" />
                </svg>
              </Link>
              <Link href="/register" className="btn-secondary no-underline">
                Create a free account
              </Link>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Protocol
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">DoH / HTTPS</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Clients
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">iOS / macOS</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Blocking
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">NXDOMAIN</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-emerald-400/10 blur-3xl" />
            <div className="card relative overflow-hidden">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Free DoH endpoint
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-200">
                    No account required
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Live target
                </span>
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <code className="block break-all font-mono text-xs leading-6 text-emerald-200 sm:text-sm">
                  {FREE_DOH_URL}
                </code>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <CopyButton value={FREE_DOH_URL} label="Copy URL" />
                <Link href="/#install" className="btn-ghost no-underline">
                  How to install
                </Link>
              </div>

              <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
                {[
                  "Encrypted DNS over HTTPS",
                  "Ads, trackers, malware, phishing",
                  "No allowed-query logging",
                  "Free tier: 120 req/min, 3,000/day per IP",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 16 16"
                        className="h-2.5 w-2.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m3 8 3 3 7-7" />
                      </svg>
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4 text-xs leading-5 text-amber-100/70">
                A username path is an identifier, not a secret. Use a unique
                username and keep per-device labels private if you care about
                accurate stats.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container-page py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            What it does
          </p>
          <h2 className="section-title mt-3">
            Blocking that stays out of your way.
          </h2>
          <p className="section-copy">
            NEAR ADGUARD resolves allowed domains through Cloudflare with a
            Google fallback, and returns NXDOMAIN for blocked domains. It never
            inspects page content and never stores allowed query names.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <FeatureIcon name={feature.icon} />
              </div>
              <h3 className="mt-5 text-base font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {feature.copy}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Free
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  No account
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Shared endpoint
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Use the public endpoint at <code className="text-slate-200">/dns-query</code>.
              You get the same blocklist, encrypted transport, and NXDOMAIN
              responses. Free traffic is rate-limited per IP and receives
              aggregate counters only.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {[
                "120 requests/min and 3,000/day per IP",
                "Shared by every device behind that IP",
                "No per-domain logs",
                "No dashboard history",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/#install" className="btn-secondary no-underline">
                Use the free endpoint
              </Link>
            </div>
          </article>

          <article className="card border-emerald-400/20 bg-emerald-400/[0.04]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">
                  Registered
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Personal path
                </h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                Free account
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              A registered account gets a personal DoH URL at{" "}
              <code className="text-slate-200">/{`{username}`}</code>, optional
              device labels, and a dashboard. Blocked-domain logging is opt-in
              and can be deleted at any time.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {[
                "200 requests/min and 8,000/day per account",
                "Shared across all of your devices",
                "Optional per-device labels and profiles",
                "Top blocked domains, recent events, rate-limit usage",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      className="h-2.5 w-2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m3 8 3 3 7-7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/register" className="btn-primary no-underline">
                Create a free account
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section id="how-it-works" className="container-page py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            How it works
          </p>
          <h2 className="section-title mt-3">Three steps. No tunnel.</h2>
          <p className="section-copy">
            Your device sends an encrypted DNS query to Vercel. The resolver
            checks an in-memory blocklist, applies rate limits, forwards allowed
            queries upstream, and returns a DNS response. Event counters are
            flushed after the response, never before it.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 lg:grid-cols-3">
          {[
            {
              step: "01",
              title: "Install the profile",
              copy: "Open the profile in Safari, allow the download, then install it in Settings. The profile points your device at the DoH endpoint.",
            },
            {
              step: "02",
              title: "Queries are filtered",
              copy: "Known ad, tracker, malware, and phishing domains return NXDOMAIN with a short TTL. Everything else is forwarded to Cloudflare, with Google as fallback.",
            },
            {
              step: "03",
              title: "See what was blocked",
              copy: "Registered users can see blocked-domain aggregates and recent events. Free clients only produce aggregate counters.",
            },
          ].map((item) => (
            <li key={item.step} className="card">
              <p className="font-mono text-xs text-emerald-300">{item.step}</p>
              <h3 className="mt-4 text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {item.copy}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section id="install" className="container-page py-16 sm:py-24">
        <div className="card overflow-hidden border-emerald-400/15 bg-gradient-to-br from-emerald-400/[0.08] to-transparent">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                iPhone / iPad / Mac
              </p>
              <h2 className="section-title mt-3">
                Install the DNS profile.
              </h2>
              <p className="section-copy">
                The profile is unsigned. iOS will show an “Unsigned” warning;
                that is expected. Review the profile before installing and
                remove it at any time in Settings.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={`${APP_URL}/nearguard.mobileconfig`} className="btn-primary no-underline">
                  Download free profile
                </a>
                <Link href="/register" className="btn-secondary no-underline">
                  Get a personal profile
                </Link>
              </div>
            </div>
            <ol className="space-y-4 text-sm text-slate-300">
              {[
                "Open the profile link in Safari on your Apple device.",
                "Tap Allow to download the profile.",
                "Open Settings → Profile Downloaded → Install.",
                "Enter your device passcode and confirm.",
                "Verify in Settings → General → VPN & Device Management → DNS.",
                "Open a site that normally shows ads and compare the result.",
              ].map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="leading-6">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Privacy
            </p>
            <h2 className="section-title mt-3">
              The query name is not the product.
            </h2>
            <p className="section-copy">
              Allowed query names are never stored. Free clients get aggregate
              counters only. Registered users can opt into blocked-domain
              history and delete it at any time. Real IP addresses are encrypted
              at rest and visible to administrators only after PIN verification,
              with an audit log.
            </p>
            <Link href="/privacy" className="btn-secondary mt-6 no-underline">
              Read the privacy policy
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Encrypted IP vault",
                copy: "AES-256-GCM ciphertext, separate table, no client-readable policies.",
              },
              {
                title: "PIN-gated admin view",
                copy: "Decoy IPs by default. Real IPs only after a short-lived, audited reveal session.",
              },
              {
                title: "No allowed-query logs",
                copy: "The hot path records counters, not the names of allowed domains.",
              },
              {
                title: "Retention controls",
                copy: "Blocked events, daily aggregates, idle devices, and encrypted IPs are purged on schedule.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="container-page py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            FAQ
          </p>
          <h2 className="section-title mt-3">The honest answers.</h2>
        </div>
        <div className="mt-8 divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/[0.02]">
          {faqs.map((faq) => (
            <details key={faq.question} className="group p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-200 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span className="text-slate-500 transition group-open:rotate-45">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="container-page pb-20 pt-8 sm:pb-28">
        <div className="card border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.1] to-transparent text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            A calmer network starts with one profile.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Use the free endpoint or create an account for a personal path and
            a dashboard. Either way, allowed query names stay out of the logs.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-primary no-underline">
              Create a free account
            </Link>
            <a href={`${APP_URL}/nearguard.mobileconfig`} className="btn-secondary no-underline">
              Download profile
            </a>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-xs leading-5 text-slate-500">
            {BRAND} is a personal, non-commercial project. Every DNS query is a
            serverless request. Free infrastructure has hard limits, and the
            circuit breaker protects the deployment before those limits are
            reached.
          </p>
        </div>
      </section>
    </>
  );
}
