# AGENTS.md

This repository is NEAR ADGUARD, a Next.js 15 DNS-over-HTTPS service for
Apple devices. Read this file before changing code.

## Sources of truth

1. The active work order in the repository root.
2. `DECISIONS.md` for new decisions and `docs/decisions.md` for D-001 to D-056.
3. `PROGRESS.md` for current state.
4. The code and tests.

If a requirement conflicts with the Vercel Hobby or Supabase Free limits, say so
plainly and propose the smallest change. Do not silently expand scope.

## Required checks

Run these after each workstream, in this order:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run `npm test` by itself. Running it at the same time as typecheck can exhaust
memory on this machine. If `.next` is held by a server, stop the server or build
to a separate directory. If the disk is low, remove generated `.next` output
before rebuilding.

## Workflow and safety

- Work in the order defined by the active work order. Do not skip a gate.
- One local commit per workstream. Do not push, deploy, or run `vercel --prod`
  without explicit permission.
- Stop at the SQL approval gate and show the full SQL before applying it.
- Never create a new Supabase project. Never reset or wipe the existing project.
- Never run destructive SQL, including `DROP TABLE`, `TRUNCATE`, `DELETE`,
  `DROP SCHEMA`, or changes to `auth.users` rows.
- Never print secrets, keys, PINs, passwords, real IPs, or `.env.local` values.
- Keep the service-role key and all server secrets out of client bundles.
- The DNS hot path must never await Supabase.
- Blocked responses use `NXDOMAIN`; rate-limited responses use `REFUSED`.
- Update `PROGRESS.md` after each workstream and append decisions to
  `DECISIONS.md` in the same commit.

## Versioning and changelog

Every shipped change bumps the version and adds a changelog entry in the same
commit. `lib/version.ts` is the single source of truth. A test must fail when
`APP_VERSION` has no changelog entry or the entries are not newest first.

## UI copy

Follow `docs/COPY_RULES.md` for all public and authenticated UI. Write in plain
Indonesian. Do not add marketing filler or claims the code cannot support.

## References

- `near-adguard-v1.5-prompt.md`: active v1.5 work order.
- `near-adguard-supabase-prompt.md`: original Part 2 specification.
- `README.md`: architecture, limits, deployment outline, and checklist.
- `docs/decisions.md`: historical decision log.
- `docs/COPY_RULES.md`: UI copy rules.
