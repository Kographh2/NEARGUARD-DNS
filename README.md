# NEAR ADGUARD

Privacy-conscious, ad-blocking **DNS-over-HTTPS** for iPhone, iPad, and Mac.
No app. No VPN. No Android. Built on Next.js 15, Vercel, and Supabase.

- Free DoH endpoint: `https://dns.nearguard.biz.id/dns-query`
- Registered DoH path: `https://dns.nearguard.biz.id/<username>`
- Optional per-device path: `https://dns.nearguard.biz.id/<username>/<device-label>`
- Landing page: `https://dns.nearguard.biz.id/`

> **Project status:** Phases 1–3 are complete. Phase 4 (Supabase schema and
> RLS) is next. The README will be updated as each phase lands. See the
> checklist at the end for what is done, pending, or deliberately out of scope.

## What it does

NEAR ADGUARD resolves DNS over HTTPS, blocks known ad/tracker/malware/phishing
domains with `NXDOMAIN`, and forwards allowed queries to Cloudflare with a
Google fallback. It does not inspect page content, terminate TLS, or act as a
VPN.

- **DoH only.** No DoT, DoQ, or plaintext port 53.
- **Apple only.** iOS, iPadOS, and macOS through a DNS configuration profile.
- **Domain/suffix blocking only.** No URL paths, page content, or search terms.
- **No allowed-query logging.** The hot path records counters, not the names of
  allowed domains.
- **Free tier and optional account.** The free endpoint works without an
  account. Registered users get a personal path, device labels, and a dashboard.

## Honest limitations

- **Every DNS query is a serverless invocation.** The locked starting scale is
  4 devices × 4,000 queries/day ≈ 0.48–0.50M invocations/month before
  auth/dashboard overhead. That is roughly half of the Vercel Hobby 1M/month
  cap. The 10 devices × 10k/day scenario does not fit Hobby.
- **Hobby is non-commercial.** This deployment is personal and non-commercial.
- **A username is an identifier, not a secret.** Anyone who knows a username
  could send queries through it, polluting stats and consuming quota. Per-IP
  guards, unknown-username limits, anomaly flags, and optional device labels
  reduce abuse. Do not reuse your username as a password.
- **In-memory rate limits are approximate.** Serverless instances do not share
  memory. The limiter fails open if its backend breaks.
- **No Redis.** Free-only deployment; the limiter and caches are per-instance.
- **The free plan can pause.** Supabase Free pauses after 7 days of inactivity;
  a daily keepalive cron is planned.
- **No backups on Supabase Free.** Migrations live in git. Export before risky
  operations.
- **Free clients get aggregate counters only.** No per-domain history.
- **The generic iOS profile is unsigned.** iOS shows an “Unsigned” warning.
  Review the profile before installing; remove it in Settings at any time.
- **No `OnDemandRules`.** The profile applies the DNS setting without
  conditional activation rules.

## Architecture

```
iPhone / iPad / Mac (DNS profile, DoH)
   │ HTTPS
   ▼
Vercel Function (region sin1)
 ├─ /dns-query  or  /  (POST/GET dns)        → free tier
 ├─ /<username>[/<device>]  (POST/GET dns)   → registered tier
 │     parse → tier cache → rate limit → blocklist → upstream → respond
 │     └─ after(): buffer counters (non-blocking)
 ├─ /login /register /dashboard /admin /privacy
 └─ /api/* (server-only; service-role key never reaches the browser)

Supabase: Auth, Postgres with RLS, aggregated usage, capped blocked events
Vercel Cron: retention, keepalive, circuit-breaker reconciliation
```

### DoH endpoints

| Path | Behavior |
|---|---|
| `POST /dns-query` | Free DoH, body `application/dns-message` |
| `GET /dns-query?dns=...` | Free DoH, base64url query |
| `POST /` | Free DoH through middleware rewrite |
| `GET /?dns=...` | Free DoH through middleware rewrite |
| `POST /<username>` | Registered DoH, or free if the username is unknown |
| `GET /<username>?dns=...` | Registered DoH, or free if the username is unknown |
| `POST /<username>/<device>` | Registered DoH with a device label |
| `GET /<username>/<device>?dns=...` | Registered DoH with a device label |

A browser `GET` without `dns` returns a small info page instead of a DNS error.
Blocked names return `NXDOMAIN` with a 60-second SOA TTL. Rate-limited requests
return a valid DNS `REFUSED` response. Unknown usernames are treated as free
traffic and are subject to the strict unknown-username limit.

**Hot-path rule:** the DNS request path never awaits Supabase. Tier lookups use
an in-memory cache; misses refresh in the background. Counters are buffered and
flushed after the response with one RPC.

### Blocklist pipeline

The runtime blocklist is a compact binary artifact, not a list of domain
strings:

- `data/blocklist.bin` — sorted 8-byte SHA-256 truncated hashes, one per blocked
  domain, searched with binary search.
- `data/blocklist-allowlist.json` — exact and parent-suffix allowlist entries.
- `data/blocklist-meta.json` — source status, counts, collision count, artifact
  size, and SHA-256 of the generated binary.

`lib/dns/blocklist.ts` loads the binary artifact first and falls back to
`data/blocklist.json` or an empty blocklist. The matcher checks the exact name
and each parent suffix, so blocking `example.com` also blocks
`sub.example.com`; a bare TLD is never blocked. The allowlist overrides both
exact and parent matches.

Sources are fetched by `npm run blocklist:build`:

| Source | Format | URL |
|---|---|---|
| HaGeZi Multi NORMAL | wildcard domains | `https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/wildcard/multi.txt` |
| OISD Big | domains | `https://cdn.jsdelivr.net/gh/sjhgvr/oisd@main/domainswild2_big.txt` |
| StevenBlack Unified | hosts | `https://cdn.jsdelivr.net/gh/StevenBlack/hosts@master/hosts` |
| Phishing Army Extended | domains | `https://phishing.army/download/phishing_army_blocklist_extended.txt` |
| URLhaus | hosts | Optional; requires `URLHAUS_API_KEY` |

URLhaus retired its keyless hostfile download on 21 October 2026 and now
returns `410 Gone`. The builder skips it unless `URLHAUS_API_KEY` is set. The
daily GitHub Action rebuilds the artifact and commits it; required source
failures fail the build unless a cached download exists in `data/raw/`.

The 64-bit truncated hashes are not reversible domain storage. At ~480k entries
the chance of a false positive from a collision is negligible, but it is still a
probabilistic filter; the build reports collisions in the metadata. See
[`docs/phase-3-blocklist.md`](docs/phase-3-blocklist.md) for source verification,
current counts, and benchmark results.

## Locked limits and defaults

| Setting | Value |
|---|---|
| Free tier | 120 req/min and 3,000/day per IP, shared by all devices behind that IP |
| Registered tier | 200 req/min and 8,000/day per account, shared across its devices |
| Soft per-device | 100 req/min |
| Registered-path per-IP guard | 300 req/min |
| Unknown-username attempts | 20 req/min per IP, negative-cached |
| New device records | 20/hour per IP; upsert, never insert blindly |
| Device cap | none |
| Circuit breaker | 60% free soft, 75% free hard, 90% registered, 95% all |
| Blocked response | `NXDOMAIN`, 60s TTL |
| Upstream | Cloudflare primary, Google fallback, 2.5s timeout |
| Blocked-event retention | 14 days |
| Daily aggregate retention | 90 days |
| Idle devices / encrypted IPs | 30 days |
| Decoy rotation | 600 seconds |
| PIN | 8 digits, 5 failed attempts, 15-minute lockout, 5-minute reveal session |
| Function region | `sin1` |
| Supabase region | Singapore |

Free tier is per IP, not per device. Multiple devices behind one NAT share the
quota. Registered limits are per account, not per device; the per-device limit
only stops one runaway device from starving the others.

## Security and privacy model

- Passwords are hashed with bcrypt. Sessions use HTTP-only, secure,
  same-site cookies.
- Roles and account status are enforced server-side on every page and API.
  Database triggers prevent client-side role escalation.
- Real IPs are encrypted with AES-256-GCM in a separate `device_ips` table.
  Plaintext IPs are never stored in other tables, logs, or analytics events.
- Admin IP view is masked by default with rotating decoy IPs. Revealing a real
  IP requires the admin PIN, a short-lived reveal session, and an audit entry.
- Decoys are display-only, match the real IP family, come from a different
  country, and never appear in exports or automated actions.
- Allowed query names are never stored. Free clients get aggregate counters.
  Registered users may opt into blocked-domain history and delete it.
- Service-role keys and all secrets stay in server-side environment variables.
  `.env.local` is gitignored.

See [`app/privacy/page.tsx`](app/privacy/page.tsx) for the current policy text.
It needs a professional review before public launch.

## Local development

Requirements: Node.js 20+ (tested on 24), npm, and a Supabase project for
auth/database work. Docker and `psql` are optional; RLS tests can use a remote
project through `SUPABASE_DB_URL`.

```bash
npm install
cp .env.example .env.local
# fill .env.local with your own values; never commit it
npm run dev
```

Open `http://localhost:3000`.

If a dev server is already holding `.next`, build to a separate directory with
`NEXT_DIST_DIR=.next-build npm run build`.

### Environment variables

See [`.env.example`](.env.example) for the full list and comments. Highlights:

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | public | Canonical app URL |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Server-side admin operations |
| `SUPABASE_DB_URL` | server only | Migrations/RLS tests |
| `FIRST_ADMIN_EMAIL` | server only | One-time admin bootstrap |
| `IP_ENC_KEY` | server only | AES-256-GCM key for real IPs |
| `IP_HMAC_KEY` | server only | Keyed IP grouping |
| `DEVICE_HMAC_KEY` | server only | Approximate device identity |
| `DECOY_SECRET` | server only | Stable decoy IP generation |
| `ADMIN_PIN_PEPPER` | server only | Extra pepper for PIN hashes |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | public | Turnstile widget |
| `TURNSTILE_SECRET_KEY` | server only | Turnstile verification |
| `RESEND_API_KEY` | server only | Auth email delivery |
| `EMAIL_FROM` | server only | Sender identity |
| `CRON_SECRET` | server only | Cron endpoint protection |
| `URLHAUS_API_KEY` | server only | Optional URLhaus export key; skipped when absent |
| `VERCEL_TOKEN` | server only | Optional usage reconciliation |
| `UPSTREAM_DOH_URL` / `UPSTREAM_FALLBACK_DOH_URL` | server only | Resolvers |
| `BLOCK_MODE` | server only | `NXDOMAIN` |
| `RATE_*` / `CIRCUIT_BREAKER_*` | server only | Initial limits |
| `RETENTION_*` / `DECOY_ROTATION_SECONDS` | server only | Retention/display |

Generate 32-byte keys with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Do not print the generated values into logs or commit them.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict check |
| `npm test` | Unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run blocklist:build` | Download sources and rebuild the binary artifact |
| `npm run decoy:build` | Build the decoy IP pool (Phase 10) |
| `npm run admin:bootstrap` | Promote `FIRST_ADMIN_EMAIL` (Phase 4/5) |
| `npm run benchmark:runtime` | Compare Node.js vs Edge/Web Crypto lookups |
| `npm run test:rls` | RLS tests against `SUPABASE_DB_URL` (Phase 4) |

## iOS / macOS install

1. Open the profile link in Safari on the Apple device.
2. Tap **Allow** to download the profile.
3. Open **Settings → Profile Downloaded → Install**.
4. Enter the device passcode and confirm.
5. Verify in **Settings → General → VPN & Device Management → DNS**.
6. Open a site that normally shows ads and compare the result.

The free profile points at `/dns-query`. A registered profile points at
`/<username>` or `/<username>/<device-label>`. The profile is unsigned; iOS
shows an “Unsigned” warning. Remove it in Settings at any time.

## Deploy outline

1. Link the project to Vercel and set the function region to `sin1`.
2. Add every server-side variable in Vercel; never expose the service-role key
   to the browser.
3. Apply Supabase migrations; run the admin bootstrap script.
4. Add `dns.nearguard.biz.id` in Vercel and create the exact CNAME at
   `indo.domains`. Do not change nameservers.
5. Verify TLS, `dig +short`, `/api/health`, and DoH GET/POST.
6. Keep the circuit breaker enabled; monitor usage against the Hobby cap.
7. Configure Supabase Auth SMTP with Resend and verify the domain records at
   the registrar.
8. Add Turnstile keys and enable bot protection on auth endpoints.
9. Add the daily keepalive and retention crons.

Do not run `vercel --prod` without explicit confirmation. Do not run destructive
Supabase commands against a project without backups.

## Testing strategy

- DNS parser/builder: malformed packets, compression loops, oversized input,
  GET base64url and POST wire format.
- Blocklist matcher: exact match, parent-domain walk, allowlist override,
  no bare-TLD blocking, binary artifact loading, parser formats, and corrupt
  artifact rejection.
- Username validation and reserved-route test.
- Rate limiter and circuit breaker: tier limits, fail-open behavior, valid DNS
  `REFUSED` responses.
- RLS: user A cannot read user B; no client can read `device_ips` or
  `admin_security`; role escalation is blocked.
- PIN: lockout after 5 failures, 15-minute window, audit entry.
- Decoy IPs: country differs, family matches, stable within a bucket, rotates
  across buckets, no real IP without a valid reveal session.

## Rollback

- Application: revert the last git commit and redeploy the previous build.
- Database: apply the down migration for the affected migration; do not drop
  tables that contain account data without an export.
- Blocklist: keep the previous generated artifact and redeploy it.
- Domain: keep the Vercel DNS record until the new deployment is verified.

## Final checklist

### Done

- [x] Phase 0 limits and feasibility verified.
- [x] Final decisions locked and documented.
- [x] Next.js 15 scaffold and pinned dependencies.
- [x] Strict TypeScript, Tailwind 4 theme, base layout, landing page.
- [x] Validation schemas, constants, env helpers.
- [x] Initial auth/dashboard/admin/privacy placeholder pages.
- [x] Health route and not-found page.
- [x] Initial unit tests for validation, reserved routes, limits, and breaker.
- [x] `.env.example` and `.gitignore`.
- [x] Phase 2: RFC 8484 DoH core, root-path middleware, safe parser/builder,
  upstream fallback, in-memory limits, circuit breaker, event buffer, and tests.
- [x] Phase 3: blocklist sources, compact hashed artifact, allowlist, daily
  rebuild workflow, parser/matcher tests, and Node.js vs Edge benchmark.

### Pending

- [ ] Phase 4: Supabase schema, RLS, migrations, RLS tests.
- [ ] Phase 5: auth, Turnstile, Resend, route protection.
- [ ] Phase 6: tier cache, device identity, non-blocking event pipeline.
- [ ] Phase 7: rate limiting and dashboard usage.
- [ ] Phase 8: user dashboard.
- [ ] Phase 9: admin dashboard.
- [ ] Phase 10: IP vault, PIN, decoy IPs.
- [ ] Phase 11: iOS/macOS profile generator.
- [ ] Phase 12: landing “Test your block”, final privacy copy.
- [ ] Phase 13: security hardening and audit.
- [ ] Phase 14: deploy and domain CNAME.
- [ ] Phase 15: final validation on a real iPhone.

### Known limitations

- Hobby 1M/month hard cap; the circuit breaker protects the deployment but does
  not create capacity.
- In-memory limits are approximate and per-instance.
- No Redis, no paid queue, no distributed lock.
- Supabase Free has no backups and pauses after 7 days of inactivity.
- Username paths are identifiers, not secrets.
- The blocklist uses 64-bit truncated hashes; collisions are reported and
  negligible at the expected ~480k-entry scale, but the filter is probabilistic.
- URLhaus now requires an abuse.ch Auth-Key; without `URLHAUS_API_KEY` that
  source is skipped.
- No Android, DoT, DoQ, or plaintext DNS.
- The generic profile is unsigned.
- Real-device and legal review remain owner actions.
