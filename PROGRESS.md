# NEAR ADGUARD progress

Updated: 2026-11-17

## Workstreams

| Workstream | Status | Evidence |
|---|---|---|
| W0 | Complete | `2008107` and `7cfd9d0`; 110 tests; typecheck and lint pass; production build produced `.next/BUILD_ID` |
| W1 | In progress, waiting at SQL gate | Read-only diagnosis connected to the live project. `public` has 0 base tables, no migration history, and 1 auth user. The old migration was never applied. New SQL is being prepared and has not been applied. |
| W2 | Pending | Category-aware blocklist, sources, measurements, and documentation |
| W3 | Pending | Version, changelog, and version tests |
| W4 | Pending | UI and copy rework |
| W5 | Pending | Final verification and report |

## Current verification

- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm test`: 12 files, 110 tests pass.
- `npm run build`: completed; `.next/BUILD_ID` was written at 2026-11-17 11:46:35.
- Live database: project refs in `SUPABASE_DB_URL` and
  `NEXT_PUBLIC_SUPABASE_URL` match. No secret values were printed.

## Open blockers

- W1 SQL approval is required before any database change.
- The live database has no `public` tables, so the Table Editor cannot show
  `profiles` until the approved migration is applied.
- Real end-to-end auth still needs the owner to confirm the Supabase and
  Turnstile values are production values, not placeholders.
- No deployment has been performed.

## Next action

Show the complete W1 migration and wait for `approve`.
