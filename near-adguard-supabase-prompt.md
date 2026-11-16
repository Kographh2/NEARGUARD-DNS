# NEAR ADGUARD — DoH on Vercel + Supabase (accounts, dashboards, per-user paths) — iOS only

Prompt pack for OpenCode. Two parts:

1. **OpenCode trigger prompts**
2. **Master prompt (`PROMPT.md`)** — save as `PROMPT.md` in an empty project folder.

Scope: **no VPS, Vercel + Supabase, DNS-over-HTTPS only, iOS/iPadOS/macOS clients (Apple DNS profile). Android is out of scope.**

---

## Part 1 — OpenCode Trigger Prompts

### Option A: One-line trigger

```
Read ./PROMPT.md completely before doing anything. Build NEAR ADGUARD (hostname dns.nearguard.biz.id): a Next.js 15 + TypeScript + Supabase project on Vercel, DoH only, iOS profile only, with user/admin roles, per-user DoH paths (/username), user and admin dashboards, and a PIN-protected admin IP view with decoy IPs. Work one phase at a time; after each phase show what you did plus verification output, and wait for my "continue". The DNS hot path must never wait on Supabase. Verify current Vercel/Supabase/Upstash limits before designing. Never skip security, privacy, or verification steps.
```

### Option B: Custom slash command (`/setup-nearguard`)

Create `.opencode/command/setup-nearguard.md`:

```markdown
---
description: Build NEAR ADGUARD (Vercel + Supabase, iOS only) from PROMPT.md
agent: build
---

Read @PROMPT.md fully. It is the single source of truth.

Fixed values:
- BRAND = NEAR ADGUARD
- DOMAIN = dns.nearguard.biz.id
- Platform = Vercel + Supabase (no VPS), DoH only, iOS/macOS profile only
- Free users: https://dns.nearguard.biz.id/dns-query
- Registered users: https://dns.nearguard.biz.id/<username>

User arguments (may be empty): $ARGUMENTS

Rules:
1. Ask for anything missing (Vercel plan, Supabase plan, region, upstream resolver, rate-limit numbers) before Phase 1.
2. Execute one phase at a time; run verification; wait for my confirmation.
3. The DNS hot path must never await a Supabase query. Use caches and buffered, non-blocking writes.
4. Never log allowed query names. Never commit secrets (.env.local is git-ignored).
5. Real IPs are encrypted at rest and returned to the browser only after server-side PIN verification.
6. At the end, produce README.md and a final checklist.
```

Run:

```
/setup-nearguard PLAN=hobby REGION=sin1
```

### Option C: `AGENTS.md`

```markdown
# AGENTS.md
- Project: NEAR ADGUARD — dns.nearguard.biz.id, DoH only, iOS/macOS clients
- Source of truth: ./PROMPT.md
- Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Supabase (Auth + Postgres), Vercel
- Free users -> /dns-query ; registered users -> /<username> ; roles: user, admin
- Hot path rule: parse -> cache lookup -> rate limit -> blocklist -> upstream; NEVER await Supabase here
- Never log allowed query names; real IPs only encrypted + PIN-gated; decoy IPs are display-only
- Work phase by phase; verify before moving on; never commit secrets
```

---

## Part 2 — Master Prompt (`PROMPT.md`)

# ROLE

You are a senior full-stack engineer with DNS, serverless, and security experience. Build **NEAR ADGUARD**: a privacy-conscious, ad-blocking **DNS-over-HTTPS (DoH)** resolver on **Vercel**, with **Supabase** for accounts and monitoring, reachable at `https://dns.nearguard.biz.id`. Include a branded landing site, user accounts, a user dashboard, an admin dashboard, and an iOS/macOS configuration profile generator.

# FIXED VALUES

| Name | Value |
|---|---|
| `BRAND` | NEAR ADGUARD |
| `DOMAIN` | `dns.nearguard.biz.id` |
| Free DoH URL (no account) | `https://dns.nearguard.biz.id/dns-query` |
| Registered DoH URL | `https://dns.nearguard.biz.id/<username>` |
| Optional per-device URL | `https://dns.nearguard.biz.id/<username>/<device-label>` |
| Landing | `https://dns.nearguard.biz.id/` |
| Hosting / DB | Vercel / Supabase (Auth + Postgres) |
| Clients | iOS / iPadOS / macOS only |
| Roles | `user`, `admin` |

Also accept DoH requests sent to the bare domain root (`POST /` with `application/dns-message`, or `GET /?dns=...`) as **free** traffic, so a client configured with just the domain works. Plain browser visits to `/` still show the landing page.

# SCOPE & HONEST LIMITATIONS

Put these in the README and on the landing page:

- DoH only (no DoT/DoQ/port 53). iOS/macOS via DNS profile; Android unsupported.
- Domain/suffix blocking only.
- **Every DNS query is a serverless request.** Estimate volume and compare against *current* limits of Vercel, Supabase, and any Redis service before building. Do not assume numbers; fetch them. Tell me plainly if the plan cannot support the expected usage. Vercel Hobby is non-commercial only.
- A `/<username>` path is an **identifier, not a secret**: anyone who knows a username could send queries through it, polluting that user's stats and consuming their quota. Mitigate with per-IP limits on registered paths, anomaly flags (many distinct IPs on one username), and an optional secret device label in the path. Explain this in the README.
- The "device" concept is approximate (DoH has no device ID). Use the optional per-device path for accurate per-device stats; otherwise group by a keyed hash of IP prefix + user-agent family.

# VARIABLES (ask me if missing)

| Variable | Notes |
|---|---|
| `PLAN` | Vercel Hobby or Pro |
| `REGION` | Function region; default Singapore (`sin1`) — verify availability |
| `UPSTREAM` | Upstream DoH (default Cloudflare, with fallback) |
| `BLOCK_MODE` | `NXDOMAIN` or `0.0.0.0`/`::` — recommend one |
| `RATE_FREE` / `RATE_USER` | Requests per minute/day for free vs registered; propose defaults from measured iOS behavior and make them admin-editable |
| `FIRST_ADMIN_EMAIL` | Bootstrap admin (never self-service) |
| `REDIS` | Upstash Redis via Vercel Marketplace for rate limiting/caching/queue — recommend only if justified after checking limits |

# ARCHITECTURE

```
iPhone (DNS profile, DoH)
   │ HTTPS
   ▼
Vercel
 ├─ /dns-query  or  /  (POST/GET dns)        → FREE tier handler
 ├─ /<username>[/<device>]  (POST/GET dns)   → REGISTERED handler
 │     Hot path (no Supabase await):
 │       parse → username/tier cache → rate limit → blocklist → upstream → respond
 │       └─ after(): enqueue event (non-blocking, batched)
 ├─ /login /register /dashboard (user) /admin (admin) /privacy
 └─ /api/* (server-only; service-role key never reaches the browser)

Event pipeline: buffered batches → Supabase (aggregates + capped recent blocked events)
Supabase: Auth, Postgres (RLS), pg cron / scheduled retention jobs
```

# PHASES

Execute strictly in order. After each: run verification, show output, wait for my "continue".

## Phase 0 — Pre-flight & feasibility
1. Confirm Node, package manager, Vercel CLI, Supabase CLI, `opencode` access.
2. Fetch current limits: Vercel (invocations, CPU, bundle size per runtime, bandwidth, cron frequency on my plan), Supabase (DB size, connections, egress, auth emails, pooler), Upstash/Redis (commands/month). Summarize.
3. Estimate monthly requests for N devices (ask N; default 5–20 devices × 5,000–20,000 queries/day) and event-write volume. State clearly if it fits.
4. Decide runtime (Edge vs Node.js) only after measuring in Phase 3.

## Phase 1 — Scaffold
Next.js 15 App Router, React 19, TypeScript strict, Tailwind. Suggested layout:
```
app/
 ├─ page.tsx                          # landing
 ├─ (auth)/login, register, forgot-password
 ├─ dashboard/                        # user area
 ├─ admin/                            # admin area (+ profile/security)
 ├─ privacy/page.tsx
 ├─ dns-query/route.ts                # free DoH
 ├─ [username]/route.ts               # registered DoH
 ├─ [username]/[device]/route.ts      # optional per-device DoH
 ├─ api/…                             # server-only endpoints
 └─ nearguard.mobileconfig/route.ts   # generic free profile
lib/ (dns-wire, blocklist, upstream, tiers, ratelimit, events, ipvault, decoy, auth, supabase-server)
scripts/ (build-blocklist, build-decoy-pool)
supabase/migrations/
test/
```
- Static routes take precedence over `[username]`, but you must also maintain a **reserved-username list** and a **test that fails** if any top-level route/segment is not reserved.
- Reserved examples: `admin, api, dashboard, login, register, logout, dns-query, privacy, nearguard, nearguard.mobileconfig, _next, static, assets, favicon.ico, robots.txt, sitemap.xml, support, help, root, system, null, undefined`.

## Phase 2 — DoH core (RFC 8484)
- `GET ?dns=<base64url>` and `POST application/dns-message` on every DoH route.
- Safe parser: validate lengths, labels, compression pointers (no loops), reject malformed/oversized packets.
- Forward allowed queries to `UPSTREAM` with short timeout + fallback; preserve RCODE/TTL.
- Blocked: correct wire-format response (copy ID/question; NXDOMAIN or `0.0.0.0`/`::`), short TTL.
- Rate-limited: return a valid DNS response (e.g. `REFUSED` or `SERVFAIL`) rather than a bare HTTP error where clients would otherwise retry aggressively.
- On `/<username>`: a browser GET without `dns` returns a small info page/redirect, not a DNS error.
- Unknown username: treat as free tier (do not leak whether a username exists), and apply a strict per-IP limit on unknown-username attempts. **Negative-cache** misses so random usernames cannot hammer Supabase.
- Pin region to `REGION`. Investigate safe edge caching of identical GET queries; implement only if measurably helpful.

## Phase 3 — Blocklist pipeline
- `scripts/build-blocklist.ts`: download and dedupe HaGeZi, OISD, StevenBlack, URLhaus, Phishing Army (verify URLs first). Output a compact artifact (sorted truncated hashes or Bloom filter) + allowlist.
- Measure domain count, artifact size, memory, cold start, p50/p95 latency on Edge vs Node.js; **choose runtime from these numbers** and justify.
- Matching: exact + parent-domain walk, never the bare TLD; allowlist overrides; tune false-positive rate if Bloom.
- Daily rebuild via GitHub Action/Cron → redeploy (check cron limits on my plan).

## Phase 4 — Supabase schema, RLS, migrations
Create migrations (idempotent, reversible) for at least:

- `profiles`: `id` (FK auth.users), `name`, `username` (unique, case-insensitive), `role` (`user`|`admin`, default `user`), `status` (`active`|`suspended`), `log_blocked` (bool, default true), `created_at`.
- `devices`: `id`, `user_id` (nullable for free clients), `tier` (`free`|`registered`), `label`, `client_hash` (keyed HMAC, never raw), `ua_family`, `country_code`, `first_seen`, `last_seen`.
- `device_ips` (**separate table, no client-readable policies**): `device_id`, `ip_enc` (AES-GCM ciphertext), `ip_hmac`, `ip_family`, `updated_at`.
- `usage_daily`: per (`user_id` or `device_id`, `day`): `requests`, `blocked`, `rate_limited`.
- `blocked_domains_daily`: (`user_id`, `day`, `domain`, `count`) — aggregates for registered users only.
- `blocked_events`: capped recent blocked events per registered user (`user_id`, `device_id`, `domain`, `qtype`, `at`); retention default 14 days; max N rows per user (trim).
- `rate_limit_config`: per tier (`free`, `user`, optional per-user override).
- `admin_security`: `admin_id`, `pin_hash` (argon2id/bcrypt), `pin_updated_at`, `failed_attempts`, `locked_until`.
- `ip_reveal_audit`: `admin_id`, `scope` (device/all page), `at`, `expires_at`, `ip_of_admin`.
- `app_settings`: retention days, decoy rotation seconds (default 600), etc.

RLS rules:
- Users can read/update only their own `profiles` (never `role`/`status`), and read only their own usage, blocked aggregates, events, and device labels (**never** IPs).
- Admin reads via a server-side check of `profiles.role = 'admin'`; admin-only tables have no policies for the `anon`/`authenticated` roles at all and are accessed only by server routes with the service-role key.
- A DB trigger blocks any client from changing `role`. Bootstrap the first admin from `FIRST_ADMIN_EMAIL` via a seed script run with the service role.
- Write RLS tests (pgTAP or script) proving user A cannot read user B's data and no client can read `device_ips`/`admin_security`.

## Phase 5 — Authentication & registration
- Supabase Auth (email + password) with `@supabase/ssr`; email confirmation **on**.
- **Register form fields (all required):** `name`, `username`, `email`, `password`, `confirm password`.
  - Password and confirm-password each have a **show/hide eye toggle** (accessible: `aria-label`, `aria-pressed`, keyboard operable).
  - Confirm must match; validate on client and server.
  - Username: 3–20 chars, `a-z 0-9 _ -`, lowercase-normalized, must start with a letter, not reserved, unique (check availability with debounce, but never rely on that alone — enforce with a unique index).
  - Password policy: minimum length and breach-check if available in Supabase; show strength hint.
- Bot protection on register/login (Cloudflare Turnstile or hCaptcha) and rate limiting on auth endpoints.
- Create the `profiles` row via DB trigger or server action in the same transaction as sign-up.
- Login, logout, forgot/reset password. Session cookies httpOnly/secure/sameSite.
- Route protection: `/dashboard` requires login; `/admin` requires `role = admin` (enforced **server-side** on every page and API, not just in the UI).

## Phase 6 — Identity, tiers & the non-blocking logging pipeline
- Tier resolution on the hot path: free vs registered via an in-memory TTL cache (and Redis if justified) of `username → {user_id, status, log_blocked, rate tier}`. **Never `await` a Supabase query inside the request path.** Cache misses refresh in the background; suspended users fall back to free-tier limits or `REFUSED` (ask me which).
- Device identity: keyed HMAC of (IP prefix + UA family) by default; use the `<device>` path segment when present.
- Country: take from Vercel's geo header at ingest (verify header name) and store in `devices.country_code`.
- Event capture via `after()`/`waitUntil` into a **batched buffer**; flush in batches (count/time thresholds) using one RPC upsert. Choose the transport after checking limits (in-memory batch, Redis list + drain job, or a queue). Handle loss gracefully (best-effort counters, no request failures).
- What is recorded:
  - **Free clients:** aggregate counters only (requests/blocked/rate-limited), last-seen, country. **No domain names.**
  - **Registered users with `log_blocked = true`:** blocked domains (aggregated daily + capped recent events). **Allowed query names are never stored.**
  - Registered users can turn logging off and delete their history from the dashboard.
- Retention jobs (scheduled) for events (default 14 days), daily aggregates (default 90 days), idle devices and encrypted IPs (default 30 days). Make configurable in `app_settings`.

## Phase 7 — Rate limiting
- Per-tier limits (free per IP, registered per user, plus a per-IP guard on registered paths) with sliding window, using Redis if justified or an alternative that fits limits.
- Expose current usage to the user dashboard (used / limit, reset time).
- Count rate-limited requests in stats. Fail **open** with a conservative in-memory limiter if the limiter backend is down.
- Admin can edit limits per tier and per user.

## Phase 8 — User dashboard (`/dashboard`)
For the logged-in `user` role:
- Overview cards: queries today, **blocked today**, block rate, **rate-limit usage** (progress bar + reset time).
- **What was blocked:** top blocked domains (today/7d/30d), recent blocked list (searchable, paginated), simple charts.
- My devices: label, last seen, requests/blocked (no IPs).
- Settings: toggle blocked-domain logging, delete my history, change password, edit name, download my iOS profile (points to `https://dns.nearguard.biz.id/<username>`), copy DoH URL, optional "add device label" to generate per-device profiles.
- Responsive, accessible, empty/loading/error states.

## Phase 9 — Admin dashboard (`/admin`)
For the `admin` role only:
- Overview: global requests, blocked %, active clients now, free vs registered split, estimated usage versus Vercel/Supabase plan limits, event-queue health.
- **Devices / clients table** (all connected devices, free and registered): tier, username (if any), UA family, country, last seen, requests/min, blocked %, rate-limited count, status, and the **IP column** (see Phase 10).
- Users table: role, status, usage, suspend/unsuspend, delete, change rate-limit tier/override, view a user's blocked aggregates. Admins cannot demote the last remaining admin.
- Rate-limit config, retention settings, blocklist version/last update, health checks.
- Audit log viewer (IP reveals, role changes, suspensions).
- Admin **Profile → Security** page (Phase 10).

## Phase 10 — IP vault, admin PIN & decoy IPs
**Real IP storage**
- Encrypt IPs with AES-256-GCM using a server-side key from environment (`IP_ENC_KEY`), store only in `device_ips`; also keep a keyed HMAC for grouping. Plaintext IPs are never stored in any other table, log, or analytics event.
- Real IPs reach the browser **only** via a server route that verifies a valid reveal session.

**PIN (Profile → Security)**
- Admin must re-enter their password, then clicks **Generate PIN**: a random 8-digit PIN is shown **once** (copy button); only a salted hash (argon2id/bcrypt) is stored. Regenerating invalidates the old PIN. Provide "Revoke PIN".
- Verification is server-side, constant-time, rate-limited: 5 failed attempts → 15-minute lockout, logged.
- A successful PIN creates a short-lived signed reveal session (default 5 minutes, httpOnly cookie bound to the admin session), with a visible countdown and a **Hide now** button. When it expires the table re-masks automatically.
- Every reveal is written to `ip_reveal_audit`.

**Decoy IP (default display)**
- Before PIN verification, the IP column shows a **decoy IP generated server-side**: HMAC-SHA256(`DECOY_SECRET`, `device_id` + `floor(now / DECOY_ROTATION_SECONDS)`) mapped into a pool of public IPs from **countries different from the client's real country** (and matching the real IP family, v4 or v6). It therefore changes every 10 minutes (default `600`, configurable) and is stable within a window.
- Build the pool with `scripts/build-decoy-pool.ts` from the official RIR delegation files (APNIC/ARIN/RIPE/LACNIC/AFRINIC), excluding private, reserved, bogon, and multicast ranges. Store as a compact per-country range table.
- Guardrails: decoys are **display-only** — never persisted, never included in exports/CSV (exports are blocked unless a reveal session is active), never used for blocking, reporting, or any automated action, and never sent to analytics. Real API responses to the browser contain either decoy or (after PIN) real values, never both.
- Show a subtle lock icon next to a masked value so the admin can tell masked from revealed.
- Add tests: decoy country ≠ real country; rotates across buckets; stable within a bucket; family matches; no endpoint returns a real IP without a valid reveal session; reveal expires.

## Phase 11 — iOS/macOS profile generator
- `GET /nearguard.mobileconfig` (free): `ServerURL = https://dns.nearguard.biz.id/dns-query`.
- `GET /api/profile` (logged in): `ServerURL = https://dns.nearguard.biz.id/<username>` (or `/<username>/<device-label>`), with stable UUIDs per user/device.
- `Content-Type: application/x-apple-aspen-config`; payload `com.apple.dnsSettings.managed` with `DNSProtocol = HTTPS`. Optional `OnDemandRules` — ask me first.
- README/landing: note the "Unsigned" warning and how to sign the profile; include the iOS install path (Safari → Allow → Settings → Profile Downloaded → Install; verify in VPN & Device Management → DNS).

## Phase 12 — Landing & privacy
- Landing: hero, what it blocks, free vs account comparison, Install-on-iPhone button, copyable URLs, iOS/macOS guide, "Test your block" button, FAQ, honest limitations.
- `/privacy` must truthfully state: what is stored (account data; for registered users blocked-domain history if enabled; device identifiers; **encrypted IP addresses visible to administrators only after PIN verification and audit-logged**), retention periods, that allowed query names are not stored, platform-level logs on Vercel/Supabase, user rights (delete history/account), and a contact address. Reflect applicable law (e.g. Indonesia's PDP Law) and ask me to review the text with a professional before launch.

## Phase 13 — Security hardening
- Security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors).
- CSRF protection for state-changing routes; input validation with a schema library; consistent generic error messages (no user enumeration on login/reset).
- Service-role key and all secrets only in Vercel env vars; `.env.local` git-ignored; never exposed to client bundles (add a check/test).
- Dependency pinning and audit; `npm audit` in CI.
- Rate-limit all auth, PIN, and reveal endpoints.
- Logs: no passwords, PINs, tokens, real IPs, or allowed query names in application logs.

## Phase 14 — Deploy & domain
1. `vercel link`; set env vars (Supabase URL/keys, `IP_ENC_KEY`, `DECOY_SECRET`, `FIRST_ADMIN_EMAIL`, Redis, Turnstile).
2. Apply Supabase migrations to production; run the admin bootstrap script.
3. Add `dns.nearguard.biz.id` in Vercel; tell me the exact DNS record (typically CNAME) to create at my registrar; wait for confirmation; verify TLS and `dig +short`.

## Phase 15 — Final validation
1. DoH works on `/dns-query`, `/`, `/<username>`, `/<username>/<device>` (GET and POST); ad domain blocked; allowlisted domain resolves; unknown username → free tier without leaking existence.
2. Register flow: all five fields required, show/hide toggles work, mismatch rejected, reserved/duplicate usernames rejected, email confirmation required.
3. RLS tests pass; a normal user cannot reach `/admin` or any admin API; role cannot be self-escalated.
4. Rate limiting: limits enforced per tier; dashboard shows usage; clients get valid DNS responses when limited.
5. Hot-path latency from Indonesia (p50/p95) with logging on; confirm no Supabase calls block responses (trace).
6. Admin devices table: IPs are decoys before PIN, rotate after 10 minutes (use a time-travel test), real after PIN, re-mask on expiry; audit log entries exist; 5 wrong PINs lock out.
7. Verify no endpoint, log, export, or client bundle ever exposes a real IP or secret without a valid reveal session.
8. Install the profile on a real iPhone for both a free setup and a registered `/<username>` setup; confirm blocking and that the user dashboard shows the blocked domains and rate-limit status.
9. Load test lightly and report consumption against Vercel/Supabase/Redis limits; recommend a plan if needed.

# DELIVERABLES

- Working Next.js project with migrations, seeds, scripts, and tests (DNS parser, blocklist matcher, username validation, RLS, decoy/PIN logic).
- `.env.example` with every variable explained.
- `README.md`: architecture, limits and cost estimate, security model, deploy steps, admin bootstrap, iOS guide, retention, rollback.
- Final checklist: done / pending / known limitations.

# RULES

- Pin dependency versions; TypeScript strict; comment non-obvious code.
- Never hard-code or print secrets; never log allowed query names, PINs, passwords, or real IPs.
- **The DNS hot path never awaits Supabase.** Keep it lean.
- Admin and role checks are always enforced server-side.
- If something is ambiguous, risky, or might exceed plan limits, ask me before acting.
- If a step fails, find the root cause, fix it, and re-verify.
- Reply to me in the language I use; keep files, code, and comments in English.

# OPTIONAL EXTENSIONS (ask before implementing)

- [ ] Secret device tokens in paths (`/<username>/<random>`) for stronger per-device identity.
- [ ] Per-user custom allow/block lists managed from the user dashboard.
- [ ] Signed `.mobileconfig`.
- [ ] Anonymous public stats on the landing page.
- [ ] Email alerts on abnormal usage or PIN lockouts.
- [ ] Move the DoH hot path to Cloudflare Workers if Vercel limits prove too tight.

# START

Begin with **Phase 0**. Ask me for any missing variables first.
