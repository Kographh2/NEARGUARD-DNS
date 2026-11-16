# Phase 0 — Pre-flight and feasibility

Date: 2026-11-16
Status: complete; decisions locked by the owner

## 1. Environment

| Item | Result |
|---|---|
| Node.js | `v24.15.0` |
| npm | `12.0.2` |
| git | `2.51.0` |
| Vercel CLI | `39.2.6` installed; `--version` hangs in this environment |
| Supabase CLI | `2.101.0` installed; `--version` hangs in this environment |
| Docker | not installed |
| `psql` | not installed |
| Project path | `D:\.01.production-web\DNS-ADGUARD` |

The CLI hangs and the missing Docker/`psql` tools are environment constraints, not product decisions. Remote Supabase migrations and RLS tests will use the Supabase project and `SUPABASE_DB_URL` once the owner provides credentials.

## 2. Plan limits verified

### Vercel Hobby

| Limit | Value | Consequence |
|---|---|---|
| Function invocations | 1,000,000 / month | Hard planning cap |
| Function CPU | 4 CPU-hours / month | Keep the DNS path lean |
| Provisioned memory | 360 GB-hours / month | Fine at this scale |
| CDN requests | 1,000,000 / month | Not a constraint |
| Fast Data Transfer | 100 GB / month | Not a constraint |
| Cron jobs | 100, once per day ±59 minutes | Enough for retention and keepalive |
| Function duration | 300 s max | Not a constraint |
| Commercial use | Not allowed on Hobby | Deployment is personal and non-commercial |
| WAF rate limiting | 1 rule, 1,000,000 allowed requests | Use one coarse per-IP rule plus the in-memory limiter |

### Supabase Free

| Limit | Value | Consequence |
|---|---|---|
| Database | 500 MB | Enough for capped events and aggregates |
| Egress | 5 GB / month | Keep dashboard queries bounded |
| MAU | 50,000 | Far above expected use |
| Active projects | 2 | One project is enough |
| Compute | Shared CPU / 500 MB RAM | Avoid heavy queries on the hot path |
| API requests | Unlimited | Not the limiting factor |
| Custom SMTP | Included | Resend can be used |
| Built-in auth email | 2 / hour | Use Resend for auth mail |
| Inactivity | Pauses after 7 days | Add a daily keepalive |
| Logs | 1 day | Do not rely on platform logs for audit |
| Backups | None on Free | Keep migrations in git; export before risky changes |

The exact Supabase Free connection cap is not published. Use the pooler and avoid opening a direct connection per request.

### Redis / Upstash

Not used. The owner chose a free-only deployment, and the expected scale does not justify another service. Rate limiting is an in-memory, per-instance approximation. This is documented as a limitation, not presented as a distributed guarantee.

## 3. Workload model

Final locked starting scale: **4 devices × 4,000 queries/day**.

| Metric | Calculation | Result |
|---|---|---|
| Daily invocations | 4 × 4,000 | 16,000 |
| Monthly invocations | 16,000 × 30–31 | 480,000–496,000 |
| Share of Hobby cap | 480k–496k ÷ 1M | 48–50% |
| With auth/dashboard overhead | +5–10% | ≈ 505,000–546,000 (≈ 51–55%) |
| CPU at 10 ms/query | 480k × 10 ms | ≈ 1.33 CPU-hours |
| CPU at 20 ms/query | 480k × 20 ms | ≈ 2.67 CPU-hours |
| Provisioned memory at 256 MB, 10 ms | 0.25 GB × 480k × 0.01 s ÷ 3600 | ≈ 0.33 GB-hours |
| Provisioned memory at 256 MB, 20 ms | 0.25 GB × 480k × 0.02 s ÷ 3600 | ≈ 0.67 GB-hours |

The earlier 580k/month figure was an overestimate; the arithmetic above is the planning number.

The 10 devices × 10k queries/day scenario (≈ 3.0M invocations/month, ≈ 8.3 CPU-hours at 10 ms/query) does **not** fit Hobby. It was rejected as a starting scale.

## 4. Fit assessment

| Resource | Expected use | Verdict |
|---|---|---|
| Vercel invocations | ≈ 0.51–0.55M / 1M | Fits with ~45–49% headroom |
| Vercel CPU | ≈ 1.3–2.7 / 4 CPU-hours | Fits |
| Vercel memory | ≈ 0.3–0.7 / 360 GB-hours | Fits |
| Vercel cron | 1–3 daily jobs / 100 | Fits |
| Supabase DB | capped events + aggregates, well under 500 MB | Fits |
| Supabase egress | bounded dashboard queries, under 5 GB | Fits |
| Supabase MAU | small | Fits |
| Redis | not used | No dependency |

## 5. Risks and mitigations

1. **Hobby invocation hard cap.** A circuit breaker estimates monthly usage from `usage_daily`, caches the estimate in memory, and refreshes it in the background. It never blocks the DNS path on a Supabase read. Thresholds are 60% / 75% / 90% / 95%.
2. **Free-tier abuse.** Per-IP free limits, a registered-path per-IP guard, unknown-username negative caching, and a new-device throttle.
3. **Shared NAT.** Multiple devices behind one IP share the free quota. This is intentional and documented.
4. **In-memory limits are approximate.** Serverless instances do not share memory. The limiter fails open and is documented as approximate.
5. **Supabase inactivity pause.** A daily keepalive cron will touch the project.
6. **Cold starts and blocklist size.** The runtime choice is deferred to Phase 3 after measuring Edge vs Node.js. The blocklist artifact must be compact.
7. **Username is not a secret.** Per-IP guards, anomaly flags, optional device labels, and clear documentation.
8. **No backups on Supabase Free.** Migrations live in git. Exports are required before destructive operations.
9. **Domain is currently NXDOMAIN.** DNS stays at the registrar; the exact CNAME is provided at deploy time.
10. **Commercial use is not allowed on Hobby.** The owner confirmed personal, non-commercial use.

## 6. Locked decisions

The full decision log is in `docs/decisions.md`. Key points:

- Free-only deployment; no Redis, no paid services.
- Vercel Hobby, personal and non-commercial; function region `sin1`.
- Supabase Free in Singapore; use the pooler.
- DoH only; iOS/iPadOS/macOS only; Android unsupported.
- Free DoH at `/dns-query`; registered at `/<username>`; optional `/<username>/<device>`.
- Bare-root `POST /` and `GET /?dns=...` count as free DNS traffic; a plain browser `GET /` shows the landing page.
- Final free limits: 120/min and 3,000/day per IP.
- Final registered limits: 200/min and 8,000/day per account.
- Soft per-device limit: 100/min.
- Registered-path per-IP guard: 300/min.
- Unknown-username attempts: 20/min per IP, negative-cached.
- New device records: 20/hour per IP; upsert, never insert blindly.
- No device cap.
- Circuit breaker: 60% free soft, 75% free hard, 90% registered, 95% all.
- Events are batched in memory and flushed with one RPC, non-blocking. The DNS hot path never awaits Supabase.
- Blocked responses use `NXDOMAIN` with a short TTL.
- Upstream: Cloudflare primary, Google fallback.
- Suspended users fall back to free-tier limits.
- No `OnDemandRules` in the iOS profile.
- IP vault: AES-256-GCM at rest, PIN-gated reveal, short-lived session, audit log, decoy IPs by default.
- Decoy IPs rotate every 10 minutes, match the real IP family, and come from a country different from the real country.
- Retention defaults: blocked events 14 days, daily aggregates 90 days, idle devices/encrypted IPs 30 days, configurable.
- Auth: Supabase email/password, email confirmation on, Resend SMTP, Turnstile at auth phase.
- Domain DNS stays at `indo.domains`; do not change nameservers.

## 7. Open external items

These do not block Phases 1–3:

- `FIRST_ADMIN_EMAIL` for bootstrap.
- Supabase project URL/ref/keys, added by the owner to `.env.local`.
- Resend sender address and API key.
- Turnstile site key and secret key.
- Exact CNAME at deploy time.
- Real iPhone validation.
- Legal/privacy review of the policy.

## 8. Sign-off

The locked scale fits the free plans with meaningful headroom. Proceed to Phase 1 with the decisions above.
