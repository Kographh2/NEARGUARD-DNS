# NEAR ADGUARD v1.5 — merged work order for OpenCode

Save this file in the project root and start OpenCode with the one-line trigger at the bottom.
This work order EXTENDS `near-adguard-supabase-prompt.md` (Part 2) and OVERRIDES it where they differ. All LOCKED DECISIONS in DECISIONS.md still apply (Vercel Hobby, Supabase Free, no Redis, hot path never awaits Supabase, NXDOMAIN, free-only, rate-limit rules, circuit breaker).

# HOW TO WORK

- Do the workstreams in order: W0, W1, W2, W3, W4, W5. READ THE CODEBASE FIRST (AGENTS.md, DECISIONS.md, PROGRESS.md, git log, app/ tree, lib/, supabase/migrations, scripts/) and report what is really done before changing anything.
- One local commit per workstream. After each: typecheck, lint, tests, `next build`. Update PROGRESS.md and append the new decisions below to DECISIONS.md.
- STOP and wait for my reply only at: (a) the SQL approval gate in W1, (b) before any deploy. Never deploy, never run `vercel --prod`, never run destructive SQL, never print secrets.
- If something conflicts with the free-tier limits or the Hobby cap, say so plainly and propose the smallest change.

# W0 — Carry-over bugs (skip each one that is already fixed; check git log and tests)

1. `/nearguard.mobileconfig` must return the Apple DNS profile (Content-Type `application/x-apple-aspen-config`, attachment filename, payload `com.apple.dnsSettings.managed`, DNSProtocol HTTPS, ServerURL `https://dns.nearguard.biz.id/dns-query`, no OnDemandRules), not the `[username]` info page. `[username]` must 404 for reserved names and names containing a dot.
2. "Create account" / "Sign in" must link to the page routes `/register` and `/login`, never `/api/*`. API handlers return 405 with an Allow header for wrong methods. The reserved-username list must cover every top-level route, with a test that fails otherwise.

# W1 — Database: "profiles" table is missing in the Supabase Table Editor

Do NOT create a new Supabase project. Do NOT reset or wipe anything. Create the schema in the SAME project with a NEW idempotent migration that cannot conflict with earlier SQL.

1. Diagnose first (read-only). Using SUPABASE_DB_URL from .env.local (never print it), report: current database and schema, existing tables/columns/enums/functions/triggers/policies in "public", any migration history, and whether an old migration was partially applied. Compare only the project ref in SUPABASE_DB_URL with the one in NEXT_PUBLIC_SUPABASE_URL and tell me if they differ. Explain in at most 10 lines why the tables are missing (never applied, failed midway, wrong project, wrong schema, error swallowed by the apply script).
2. Write a NEW migration (next timestamp). Never edit a migration that may already be applied. Fully idempotent: `CREATE EXTENSION IF NOT EXISTS`, enums via DO blocks checking pg_type, `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS` then create, `DROP POLICY IF EXISTS` then create, RLS enabled on every table. If a table exists with different columns, only add missing columns/constraints and report conflicts. NEVER `DROP TABLE`, `TRUNCATE`, `DELETE`, `DROP SCHEMA`, and never touch auth.users rows.
3. Tables per the spec Phase 4: profiles, devices, device_ips, usage_daily, blocked_domains_daily, blocked_events, rate_limit_config, admin_security, ip_reveal_audit, app_settings, plus anything the code already queries (grep the codebase for table and RPC names and make sure each exists). New in v1.5:
   - `profiles.categories`: integer bitmask of enabled block categories, default = all safety categories on (gambling stays off by default).
   - `blocked_domains_daily` and `blocked_events` get a `category` smallint column.
   - `app_settings` holds the default category bitmask and the idle-device retention (default 30 days).
4. profiles: id references auth.users on delete cascade, name, username (unique, case-insensitive, format check, reserved check), role ('user'|'admin', default 'user'), status, log_blocked, categories, created_at. Trigger on auth.users creates the profile from sign-up metadata (name, username) and returns a clean error for a duplicate or invalid username. One-time backfill for existing auth users without a profile.
5. Security: trigger that blocks clients from changing role/status; SECURITY DEFINER functions with fixed search_path; REVOKE ALL on device_ips, admin_security, ip_reveal_audit and other server-only tables from anon and authenticated; users read/update only their own profile (never role/status) and read only their own usage, blocked aggregates, events and device labels, never IPs. Include the RPC for batched counter flushes (one upsert call).
6. APPROVAL GATE: show me the full SQL and wait for "approve". Then apply it in one transaction with a script that fails loudly (non-zero exit, clear error, nothing swallowed). Run it a second time to prove idempotency. Run the RLS tests and list pass/fail per assertion. Print the public tables, RLS status and policies from the live database, and tell me to refresh the Table Editor to confirm "profiles" appears.
7. Admin bootstrap: a script that promotes FIRST_ADMIN_EMAIL to role 'admin' with the service role after that user registers. Do not create the account yourself.

# W2 — What the DNS blocks (honest scope)

DNS can only refuse to resolve domain names. It cannot block phone calls or SMS, and it cannot protect traffic after the page has loaded. Build what DNS can really do:

1. Categories (bitmask stored per domain in the compiled artifact): ads, trackers, malware, phishing, scam (fake shops, fake support, investment/loan scams), crypto-scam (wallet drainers, fake airdrops, fake dApp sites), and optionally gambling (judi online) as an opt-in category that is OFF by default. Admin sets the defaults; each registered user can switch categories in their dashboard (stored in profiles.categories, cached with the username lookup, applied on the hot path with a bitmask AND). Free tier uses the admin defaults.
2. Sources: find and VERIFY (URL reachable, license allows use, last update recent) good free lists for each category. Candidates to evaluate: HaGeZi (Pro, Threat Intelligence Feeds), OISD, StevenBlack, URLhaus, Phishing Army, Phishing.Database, a maintained scam-domain list, a crypto phishing/drainer list (for example the MetaMask eth-phishing-detect blocklist or a ScamSniffer list), an Indonesian ad/scam list if a maintained one exists. Do not assume any URL exists; search, fetch, and report. Drop sources that are stale or unlicensed.
3. Also evaluate adding Cloudflare's free malware-blocking DoH endpoint as an extra layer (verify the current endpoint and terms) and tell me the trade-off in false positives; do not switch the upstream without asking me.
4. Rebuild the artifact with category bits. Measure again: domain count per category, artifact size, memory, cold start, p50/p95 latency. If the bundle or CPU no longer fits Vercel Hobby, drop lists by priority (phishing, malware, crypto-scam, scam first, then ads, then trackers) and report the numbers. Allowlist always wins. Never match a bare TLD.
5. Record the block category for registered users (blocked_events and blocked_domains_daily), so the dashboard can show "blocked by category". Free clients still get aggregate counters only.
6. Public Wi-Fi: write the real, limited protections into the docs and the site: DNS lookups are encrypted (the cafe network cannot read or rewrite them), known phishing/scam/crypto-scam domains are refused, DNS hijacking to fake sites is harder. Do NOT claim wallet safety, do NOT claim "secure", do NOT claim it replaces a VPN. Document that captive-portal Wi-Fi (login pages at cafes) can fail with a DNS profile and describe the workaround honestly.

# W3 — Version "v1.5" and update log

1. Single source of truth: `lib/version.ts` exports `APP_VERSION = "1.5"` (display "v1.5") and `RELEASE_DATE`. Use the real current date from the system, never an invented one.
2. Show "NEAR ADGUARD v1.5" in the header or footer of the landing page, in the dashboard and admin footers, and link it to `/changelog`.
3. `/changelog` is a statically generated page fed by one typed data file (`content/changelog.ts`), newest first. Each entry: version, date, and items tagged Baru / Perbaikan / Perubahan / Keamanan. Write the v1.5 entry from the REAL git history and the features that actually exist in the codebase after W0 to W2. Do not invent features, do not pad it.
4. Rule for the future (add it to AGENTS.md): every shipped change bumps the version (patch/minor) and adds a changelog entry in the same commit. Add a test that fails if APP_VERSION has no changelog entry or the entries are not sorted newest first.

# W4 — UI and copy: lightweight, no "AI slop"

Apply to the landing page, auth pages, dashboard, admin, changelog and privacy page. Rework existing pages to match; do not add features.

Language: write all UI copy in Indonesian, plain and neutral ("kamu" is fine, no slang). Keep technical terms (DoH, DNS, profile, resolver) in English. No i18n library.

Weight budget (measure with `next build` output and report it):
- Landing and changelog are fully static (SSG), no client JS except the copy buttons and the version/theme bits. Server Components by default; `"use client"` only where needed.
- First-load JS for the landing page under 100 kB, total page transfer under 150 kB including fonts.
- No UI kit, no animation library, no chart library, no icon library (inline SVG, a handful at most), no images except inline SVG, no external CDNs or trackers. System font stack or ONE self-hosted subsetted variable font under 40 kB.
- Charts are hand-written SVG or CSS bars only. Dashboard pages are data-first (tables, numbers), no decorative graphics.
- Cache headers on static pages; no extra function invocations for pages that can be static.

Design rules (reject these on sight):
- No gradient blobs, glow, glassmorphism, neon, animated backgrounds, parallax, or floating cards.
- No centered hero with a badge pill above the headline; no three-column icon-in-circle feature grid; no fake stats, testimonials, logos, "trusted by", or stock illustrations; no emoji; no decorative stars or sparkles.
- Left-aligned, text-first layout, max line length about 65ch, one column for prose. One background, one text color, one accent color, AA contrast, light and dark via prefers-color-scheme. Plain wordmark "NEAR ADGUARD" instead of a generic shield icon.
- Native elements, visible focus states, real tables, labels above inputs (placeholder is never the label), specific error messages. Motion only for state changes, 150 ms or less, honor prefers-reduced-motion.
- Do not use AdGuard's logo, colors, or wording. Footer states: not affiliated with AdGuard.

Copy rules:
- Write like the person who built it, in short concrete sentences: say what it does and what it does not do. Every claim must be backed by something the code does. Any number on the page comes from the build (for example the domain count from the blocklist artifact), never typed by hand.
- Banned: marketing filler ("seamless", "supercharge", "unlock", "empower", "elevate", "cutting-edge", "next-gen", "robust", "revolusioner", "canggih", "solusi terbaik", "tanpa batas", "lindungi dunia digitalmu"), exclamation marks, rhetorical-question headlines, "Welcome to", triplets of adjectives, and em dashes.
- Headings are plain labels. Landing structure, in this order: header (name, version, links) → what it is in two sentences, the DoH URL with a copy button and the install button → "Yang diblokir" (categories, with counts from the build) → "Cara kerja" (three plain steps) → "Pasang di iPhone" (Safari steps, the Unsigned note, the captive-portal note) → "Yang tidak dilindungi" → "Privasi" (exactly what is stored and for how long) → FAQ (short) → footer (version, changelog link, not affiliated with AdGuard, contact).
- "Yang tidak dilindungi" must say, in plain words: DNS cannot block phone calls or SMS (point to iOS settings such as Silence Unknown Callers and the junk-call reporting options instead); it does not encrypt page content, which depends on the site's HTTPS; it is not a VPN; it does not stop a wallet signature request or a transaction you approve yourself; new scam domains not yet on a list will not be blocked; use mobile data or a trusted network for transactions, and check addresses on your wallet device. Reference tone for such a sentence: "DNS ini memblokir domain yang sudah diketahui sebagai penipuan. Domain penipuan baru yang belum masuk daftar tidak akan terblokir."
- Avoid wording that looks like a login or account-verification lure on public pages (Safe Browsing heuristics). Login and register forms live only on /login and /register.
- Write a short `docs/COPY_RULES.md` containing these rules and reference it from AGENTS.md so future sessions follow them.

# W5 — Verify and report

- typecheck, lint, tests, `next build`; run locally and show the results.
- Tests: migration idempotency, RLS, category bitmask matching (per-user mask applied on the hot path), version/changelog consistency, reserved routes, profile route headers.
- Report the final first-load JS and page transfer sizes for the landing page, the artifact size and latency numbers from W2, and the list of what I must set or change before deploying (Vercel env vars, Supabase URL configuration, Turnstile hostnames).
- Update README.md, DECISIONS.md, PROGRESS.md and AGENTS.md. Finish with a short checklist of what is done, pending and risky.

# ONE-LINE TRIGGER

Paste into OpenCode:

```
Read ./near-adguard-v1.5-prompt.md completely, then AGENTS.md, DECISIONS.md and PROGRESS.md, and inspect the real repo state (git log, git status, app/ tree, migrations). Execute workstreams W0 to W5 in order with one local commit each. Stop only at the SQL approval gate in W1 and before any deploy. Never create a new Supabase project, never run destructive SQL, never print secrets, never deploy.
```
