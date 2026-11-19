# NEAR ADGUARD progress

Updated: 2026-11-18 (v1.5.1 login fix)

## Workstreams

| Workstream | Status | Evidence |
|---|---|---|
| W0 | Complete | `2008107` and `7cfd9d0`; typecheck, lint, tests, and production build pass |
| W1 | SQL accepted by owner; live application not rechecked | New idempotent migration dry-run passed after the `v_role` fix. The owner said the SQL is fine. `npm run test:rls` still requires the migration to be applied. |
| W2 | Complete locally | Category bits, 9-byte artifact, category-aware sources, meta v2, handler mask, and tests. Build: 667,311 blocked domains, 6,005,799 bytes, 0 collisions. |
| W3 | Complete | `lib/version.ts`, `content/changelog.ts`, static `/changelog`, header/footer version, and version/changelog tests |
| W4 | Complete | Indonesian landing, auth, dashboard, admin, privacy, 404, changelog; plain light/dark CSS; semantic classes; no old card/neon classes |
| W5 | Complete locally | Final checks pass. No commit and no deployment were performed. |
| v1.5.1 | Complete locally | Dashboard checks the Supabase session, shows the signed-in account, and has a logout route. Login redirects signed-in users to the dashboard. |

## Current verification

- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm test`: 13 files, 119 tests pass.
- `npm run build`: pass. 18 routes generated, including `/`, `/changelog`, `/privacy`, dynamic `/dashboard`, `/admin`, auth pages, and `/api/auth/logout`.
- Blocklist build: 1,049,163 parsed entries, 673,093 unique domains, 5,782 removed by the allowlist, 667,311 blocked domains, 0 collisions, 6,005,799 bytes.
- Category counts: ads 377,267; trackers 377,267; malware 182,363; phishing 262,608; scam 190,508; cryptoScam 376,371; gambling 6,744.

## Root cause of the unchanged site

Commit `987a0aa UPDATE FITUR, UI & TYPOGRAPH` changed only `package.json`,
`scripts/apply-migration.ts`, `scripts/test-rls.ts`, and
`supabase/migrations/202611170001_v15_schema.sql`. Commit `6054b96 UPDATE`
changed one migration line. Neither commit touched `app/`, `components/`, or the
UI in `lib/`. Vercel correctly served the same UI; this was not a deployment
bug.

## Open blockers

- Per-account categories and `logBlocked` are stored in the schema but are not
  loaded into the production tier cache. All runtime users currently get
  `DEFAULT_CATEGORIES`.
- `lib/events.ts` has no event sink wired, so counters and blocked events are
  buffered in memory and dropped. The schema and `flush_dns_counters` RPC exist.
- Forgot-password and reset-password API routes do not exist; the pages say the
  feature is unavailable.
- Dashboard is session-aware, but its usage, category, device, and event data
  are still placeholders. Admin remains a static placeholder. No profile
  editor, device management, rate-limit console, or IP reveal exists.
- RLS tests have not run against the live database because the migration
  application is not confirmed in this session.
- No deployment has been performed. The working tree contains uncommitted
  changes.
- `npm audit` still reports 8 vulnerabilities (7 moderate, 1 high).
- Source licenses for OISD, Phishing Army, MetaMask, and URLhaus are recorded as
  “See source” and still need owner verification.
- Domain CNAME/nameserver confirmation, real iPhone testing, and legal review
  remain open.

## Next action

Owner review, commit, and deploy, then test register, login, refresh, and logout
against the live deployment. Do not commit or deploy automatically.
