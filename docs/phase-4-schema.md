# Phase 4: Supabase schema and RLS

Status: implemented; remote verification pending real Supabase credentials.

## Migration

- Up: `supabase/migrations/202611160001_initial_schema.sql`
- Down: `supabase/rollback/202611160001_initial_schema.down.sql`

Apply with the Supabase CLI or the dashboard SQL editor. Review the SQL first;
the project has no backups on the Free plan.

## Tables

| Table | Purpose | Client access |
|---|---|---|
| `profiles` | User name, username, role, status, blocked-logging flag | Select/update own row; protected columns blocked by trigger |
| `devices` | Registered and free device rows, tier, label, coarse UA/country | Select own rows |
| `device_ips` | Encrypted real IP, HMAC grouping, IP family | No client access; service role only |
| `usage_daily` | Aggregated request/blocked/rate-limited counters | Select own rows |
| `blocked_domains_daily` | Aggregated blocked-domain counts for opted-in users | Select own rows |
| `blocked_events` | Capped blocked-domain history for opted-in users | Select own rows |
| `rate_limit_config` | Default limits | No client access |
| `rate_limit_overrides` | Per-user/device overrides | No client access |
| `admin_security` | PIN hash and lockout state | No client access |
| `ip_reveal_audit` | Encrypted admin IP, device, timestamp, result | No client access |
| `app_settings` | Retention, decoy, circuit-breaker, block mode | No client access |

`usage_daily.device_id` has no foreign key on purpose: purging an idle device
must not delete its daily aggregate. `blocked_events.device_id` uses
`on delete set null` for the same reason.

## Functions and triggers

- `set_updated_at()` updates `updated_at` on mutable tables.
- `handle_new_user()` inserts a profile after `auth.users` insert. It uses
  metadata `name`/`username`, falls back to the email local part or
  `user-<uuid8>`, and raises on an invalid username.
- `protect_profile_fields()` raises `42501` if a client changes `id`,
  `username`, `role`, or `status`.
- `trim_blocked_events()` deletes the oldest rows beyond
  `blocked_events_per_user_max` (default 500).

## RLS rules

- Authenticated users can select only their own profile, devices, usage,
  blocked-domain aggregates, and blocked events.
- Users can update only `name` and `log_blocked` on their own profile.
- `device_ips`, `admin_security`, `ip_reveal_audit`, `rate_limit_config`,
  `rate_limit_overrides`, and `app_settings` have no client policies and are
  revoked from `anon` and `authenticated`.
- The service role bypasses RLS for server-side admin operations.
- Admin JWTs do not get a global read policy; the server uses the service role.

## Seed settings

| Key | Value |
|---|---|
| `blocked_events_retention_days` | 14 |
| `usage_daily_retention_days` | 90 |
| `idle_device_retention_days` | 30 |
| `decoy_rotation_seconds` | 600 |
| `blocked_events_per_user_max` | 500 |
| `admin_pin_max_failures` | 5 |
| `admin_pin_lockout_minutes` | 15 |
| `admin_reveal_session_seconds` | 300 |
| `new_devices_per_hour` | 20 |
| `unknown_username_per_minute` | 20 |
| `registered_path_per_ip_per_minute` | 300 |
| `soft_device_per_minute` | 100 |
| `hobby_monthly_invocations` | 1000000 |
| `circuit_free_soft` | 0.60 |
| `circuit_free_hard` | 0.75 |
| `circuit_registered` | 0.90 |
| `circuit_all` | 0.95 |
| `block_mode` | `NXDOMAIN` |

## RLS test plan

`scripts/test-rls.ts` connects with `SUPABASE_DB_URL`, starts a transaction, and
rolls back. It seeds three auth users (A, B, admin), three devices (A, B, free),
usage rows, blocked aggregates/events, encrypted IPs, and admin security. It
then switches to `authenticated`, `anon`, and `service_role` with
`request.jwt.claim.sub` set.

Assertions:

- A sees only A's profile, device, usage, blocked aggregates, and blocked events.
- B cannot see A's rows.
- A can update own `name` and `log_blocked`.
- A cannot update `role`, `status`, or `username` (trigger returns `42501`).
- A cannot select `device_ips`, `admin_security`, `ip_reveal_audit`,
  `app_settings`, or `rate_limit_config`.
- A cannot delete or insert profiles.
- Admin JWT still sees only its own profile.
- `anon` cannot read profiles or devices.
- `service_role` can read `device_ips` and `admin_security`.

Run:

```bash
npm run test:rls
```

## Bootstrap

`scripts/bootstrap-admin.ts` reads `FIRST_ADMIN_EMAIL`,
`NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. The user must sign
up first; the script finds the auth user and promotes the matching profile to
`admin`. It does not create accounts or print email addresses.

## Pending

- Real `SUPABASE_DB_URL` and project keys.
- Apply the migration and run the RLS tests.
- Set `FIRST_ADMIN_EMAIL` and run the bootstrap after the first signup.
