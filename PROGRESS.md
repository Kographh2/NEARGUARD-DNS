# NEAR ADGUARD progress

Updated: 2026-11-19 (v1.5.2 session navbar, admin console, signed profiles)

## Workstreams

| Workstream | Status | Evidence |
|---|---|---|
| W0 | Complete | `2008107` and `7cfd9d0`; typecheck, lint, tests, and production build pass |
| W1 | SQL accepted by owner; live application not rechecked | New idempotent migration dry-run passed after the `v_role` fix. The owner said the SQL is fine. `npm run test:rls` still requires the migration to be applied. |
| W2 | Complete locally | Category bits, 9-byte artifact, category-aware sources, meta v2, handler mask, and tests. Build: 667,311 blocked domains, 6,005,799 bytes, 0 collisions. |
| W3 | Complete | `lib/version.ts`, `content/changelog.ts`, static `/changelog`, header/footer version, and version/changelog tests |
| W4 | Complete | Indonesian landing, auth, dashboard, admin, privacy, 404, changelog; plain light/dark CSS; semantic classes; no old card/neon classes |
| W5 | Complete locally | Final checks pass. No deployment was performed. |
| v1.5.1 | Complete locally | Dashboard checks the Supabase session, shows the signed-in account, and has a logout route. Login redirects signed-in users to the dashboard. |
| v1.5.2 | Complete locally | Header and footer follow the auth cookie. Public pages moved under the `(site)` layout. Admin has its own sidebar shell with six read-only pages and a role guard. Dashboard downloads signed profiles for `/<username>/<device>`. Free and account profiles use the FizzxDevv - Kograph Team signer name. |

## Current verification

- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm test`: 13 files, 124 tests pass.
- `npm run build`: pass. 24 routes generated. The public layout stays static for `/`, `/changelog`, and `/privacy`; admin, dashboard, auth forms, profile downloads, and DNS routes are dynamic.
- Landing first-load JS: 107 kB. Shared JS is 103 kB. This is slightly above the v1.5 W4 target of 100 kB because the session-aware header and footer add a small client component.
- Production smoke test: `/` 200; `/admin` and `/dashboard` redirect to `/login` without a session; `/nearguard.mobileconfig` returns 200 with `application/x-apple-aspen-config`, and the CMS certificate CN is `FizzxDevv - Kograph Team`.
- Blocklist build: 1,049,163 parsed entries, 673,093 unique domains, 5,782 removed by the allowlist, 667,311 blocked domains, 0 collisions, 6,005,799 bytes.
- Category counts: ads 377,267; trackers 377,267; malware 182,363; phishing 262,608; scam 190,508; cryptoScam 376,371; gambling 6,744.

## Notes on v1.5.2

- The navbar does not make every page dynamic. It reads the Supabase auth cookie on the client and refreshes on focus, visibility, storage, a custom auth event, and a 60-second timer.
- `/admin` is outside the `(site)` route group, so it does not render the public header or footer. The layout checks `profiles.role = 'admin'` and every page repeats the guard before service-role reads.
- The account profile route checks the session, reads the username, and builds the ServerURL from the configured app URL. It never accepts a username from the query string.
- The signing certificate is self-issued in the server process. iOS can show the signer name but may also mark the profile unverified because the certificate is not issued by Apple.
- Admin pages are read-only. Rate-limit changes, role/status changes, and IP reveal are not implemented.

## Open blockers

- Per-account categories and `logBlocked` are stored in the schema but are not loaded into the production tier cache. All runtime users currently get `DEFAULT_CATEGORIES`.
- `lib/events.ts` has no event sink wired, so counters and blocked events are buffered in memory and dropped. The schema and `flush_dns_counters` RPC exist.
- Forgot-password and reset-password API routes do not exist; the pages say the feature is unavailable.
- Admin pages can read data but cannot update roles, status, rate limits, or device labels. IP reveal is still not implemented.
- RLS tests have not run against the live database because the migration application is not confirmed in this session.
- No deployment has been performed.
- `npm audit` reports 9 vulnerabilities (7 moderate, 2 high).
- Source licenses for OISD, Phishing Army, MetaMask, and URLhaus are recorded as “See source” and still need owner verification.
- Domain CNAME/nameserver confirmation, real iPhone testing (including the signer display), and legal review remain open.

## Next action

Owner review, commit, and deploy, then test register, login, refresh, logout, admin access, and both profile downloads against the live deployment. Re-download an installed profile to see the new signer name. Do not commit or deploy automatically.
