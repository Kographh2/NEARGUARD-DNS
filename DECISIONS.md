# NEAR ADGUARD decisions for v1.5

D-001 to D-056 remain in `docs/decisions.md`. New decisions are appended here
and the latest decision wins.

| ID | Decision | Rationale |
|---|---|---|
| D-057 | The v1.5 work order extends and overrides `near-adguard-supabase-prompt.md` where they differ | The owner supplied a newer merged work order |
| D-058 | W0 carry-over bugs are already fixed by `2008107` and `7cfd9d0`; W0 is verification only | The profile route, reserved-name guard, auth pages, API routes, and tests already exist |
| D-059 | W1 uses a new idempotent migration and never edits a migration that may have been applied | The live `public` schema is empty and the old migration is not recorded as applied; the new migration must be safe to run twice |
| D-060 | W1 must show the full SQL and wait for explicit approval before applying it | The Free plan has no backups and the owner requested a SQL gate |
