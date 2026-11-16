# NEAR ADGUARD decision log

This file records decisions that override or clarify the master prompt. The
latest decision wins.

| ID | Decision | Rationale |
|---|---|---|
| D-001 | Use Vercel Hobby, personal and non-commercial, region `sin1` | Owner confirmed non-commercial use; Singapore is closest to the expected users |
| D-002 | Use Supabase Free in Singapore and the pooler | Free-only deployment; exact connection cap is not published |
| D-003 | No Redis or Upstash | Free-only; expected scale does not justify another service |
| D-004 | Start at 4 devices × 4,000 queries/day | Fits Hobby at ≈ 0.48–0.50M invocations/month before overhead |
| D-005 | DoH only; iOS/iPadOS/macOS only; Android unsupported | Matches the product scope and Apple profile support |
| D-006 | Free DoH at `/dns-query`; registered at `/<username>`; optional `/<username>/<device>` | Matches the prompt and the account model |
| D-007 | Bare-root `POST /` and `GET /?dns=...` count as free DNS | A client configured with only the hostname must work; plain browser `GET /` still shows the landing page |
| D-008 | Free limits: 120 requests/min and 3,000/day per IP | Final owner decision; shared by all devices behind the IP |
| D-009 | Registered limits: 200 requests/min and 8,000/day per account | Final owner decision; shared across the account’s devices |
| D-010 | Soft per-device limit: 100 requests/min | Stops one runaway device without replacing account/IP limits |
| D-011 | Registered-path per-IP guard: 300 requests/min | Reduces abuse of known usernames |
| D-012 | Unknown-username attempts: 20/min per IP, negative-cached | Prevents random usernames from hammering Supabase and avoids existence leaks |
| D-013 | New device records: 20/hour per IP; upsert, never insert blindly | Stops table growth from random device labels |
| D-014 | No device cap | Owner decision; protect the database with throttles and retention instead |
| D-015 | Circuit breaker thresholds: 60% / 75% / 90% / 95% | Final owner decision; protects the Hobby invocation cap |
| D-016 | Circuit breaker estimates from `usage_daily`, cached in memory and refreshed in the background | The DNS path must not await Supabase |
| D-017 | Rate-limited requests return a valid DNS `REFUSED` response | Clients otherwise retry aggressively on HTTP errors |
| D-018 | Limiter fails open if its backend breaks | Availability over strict enforcement; documented as approximate |
| D-019 | Blocked responses use `NXDOMAIN` with a 60-second TTL | Chosen block mode; small and cache-friendly |
| D-020 | Upstream: Cloudflare primary, Google fallback, 2.5s timeout | Reliability without a paid resolver |
| D-021 | Suspended users fall back to free-tier limits | Owner decision; keeps the resolver usable without account privileges |
| D-022 | Free clients produce aggregate counters only; no domain names | Privacy and storage limits |
| D-023 | Registered users may enable blocked-domain logging; allowed query names are never stored | Privacy boundary; the hot path records counters, not allowed names |
| D-024 | Batch events in memory and flush with one RPC via `after()`/`waitUntil` | Non-blocking writes and fewer database round trips |
| D-025 | The DNS hot path never awaits Supabase | Latency and resilience requirement |
| D-026 | Retention defaults: blocked events 14 days, daily aggregates 90 days, idle devices/encrypted IPs 30 days | Owner-approved defaults; configurable in `app_settings` |
| D-027 | Purging device records never deletes accounts, user device labels, or daily aggregates | Preserves account history and billing/usage data |
| D-028 | IP vault uses AES-256-GCM; plaintext IPs are never stored elsewhere | Security requirement |
| D-029 | Admin IP view is PIN-gated: 8 digits, 5 failed attempts, 15-minute lockout, 5-minute reveal session | Security requirement |
| D-030 | Decoy IPs are display-only, rotate every 10 minutes, match IP family, and use a country different from the real country | Prevents accidental exposure and satisfies the prompt |
| D-031 | No `OnDemandRules` in the iOS profile | Owner decision; keeps the profile simple |
| D-032 | Supabase Auth email/password with email confirmation on; Resend SMTP | Built-in email is limited to 2/hour; Resend is free-tier compatible |
| D-033 | Cloudflare Turnstile on auth endpoints, configured in Phase 5 | Bot protection without a paid service |
| D-034 | Domain DNS stays at `indo.domains`; nameservers are not changed | Owner controls the registrar; Vercel needs a CNAME only |
| D-035 | Run typecheck, lint, tests, and `next build` after every phase; commit locally; never push/deploy without permission | Verification and safety workflow |
| D-036 | Stop only at checkpoints: external action, after Supabase schema + RLS, and after IP vault/PIN/decoy | Owner’s requested review points |
| D-037 | Never run destructive Supabase commands; show SQL before applying migrations | Prevents data loss on a free project without backups |
| D-038 | Never print secrets, keys, PINs, passwords, real IPs, or allowed query names | Privacy and security rule |
| D-039 | If a requirement conflicts with free limits, state it plainly and propose the smallest change | Avoid silent scope or plan changes |
| D-040 | Use a reserved-username list plus a test that fails when a top-level route is not reserved | Prevents route shadowing by `[username]` |
| D-041 | Use `NXDOMAIN` for blocked names; do not use `0.0.0.0`/`::` | Chosen mode; simpler wire response |
| D-042 | Keep the generic free profile at `/nearguard.mobileconfig`; personal profiles at `/api/profile` | Matches the prompt and separates free vs authenticated generation |
| D-043 | Add a daily keepalive cron to prevent Supabase Free inactivity pause | Free-plan behavior |
| D-044 | Use one Vercel WAF rate-limit rule as a coarse per-IP guard; keep tier logic in the app | Hobby allows one rule and 1M allowed requests |
| D-045 | Document in-memory rate limiting as approximate in the README | Avoid claiming a distributed guarantee that does not exist |
| D-046 | The username is an identifier, not a secret; say so on the landing page, dashboard, and README | Prevents a false security expectation |
| D-047 | Validate all writes with zod and enforce roles server-side on every page/API | Security baseline |
| D-048 | Use a baseline CSP in Phase 1 and tighten it with a nonce in Phase 13 | Avoid blocking Next.js during development while keeping a security target |
| D-049 | Final README must include architecture, limits, security model, deploy steps, bootstrap, iOS guide, retention, and rollback | Prompt deliverable |
| D-050 | Final checklist must list done / pending / known limitations | Prompt deliverable |
