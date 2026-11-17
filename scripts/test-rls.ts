import { Client } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const DB_URL = process.env.SUPABASE_DB_URL?.trim();
const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const USER_ADMIN = "33333333-3333-4333-8333-333333333333";
const DEVICE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DEVICE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const DEVICE_FREE = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

let assertions = 0;

async function main(): Promise<void> {
  if (!DB_URL || DB_URL.includes("your-project-ref")) {
    throw new Error(
      "SUPABASE_DB_URL is not configured. Set a real Supabase connection string before running RLS tests.",
    );
  }

  const useSsl = !DB_URL.includes("localhost") && !DB_URL.includes("127.0.0.1");
  const client = new Client({
    connectionString: DB_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();
  try {
    await client.query("begin");
    await seed(client);
    await client.query(
      "grant update (role, status, username) on public.profiles to authenticated",
    );

    await withRole(client, "authenticated", USER_A, async () => {
      await expectOwnProfile(client, USER_A);
      await expectNoForeignRows(client, "profiles", USER_B);
      await expectNoForeignRows(client, "devices", DEVICE_B);
      await expectNoForeignRows(client, "usage_daily", USER_B);
      await expectNoForeignRows(client, "blocked_domains_daily", USER_B);
      await expectNoForeignRows(client, "blocked_events", USER_B);

      await client.query(
        "update public.profiles set name = 'RLS A Updated' where id = $1",
        [USER_A],
      );
      await client.query(
        "update public.profiles set log_blocked = false where id = $1",
        [USER_A],
      );
      await client.query(
        "update public.profiles set categories = 1 where id = $1",
        [USER_A],
      );
      const updated = await client.query<{
        name: string;
        log_blocked: boolean;
        categories: number;
      }>(
        "select name, log_blocked, categories from public.profiles where id = $1",
        [USER_A],
      );
      assert(
        updated.rows[0]?.name === "RLS A Updated" &&
          updated.rows[0]?.log_blocked === false,
        "user can update own name and log_blocked",
      );
      assert(
        updated.rows[0]?.categories === 1,
        "user can update own categories",
      );

      await expectPermissionDenied(client, "select * from public.device_ips");
      await expectPermissionDenied(client, "select * from public.admin_security");
      await expectPermissionDenied(client, "select * from public.ip_reveal_audit");
      await expectPermissionDenied(client, "select * from public.app_settings");
      await expectPermissionDenied(client, "select * from public.rate_limit_config");
      await expectPermissionDenied(client, "delete from public.profiles where id = $1", [USER_A]);
      await expectPermissionDenied(
        client,
        "insert into public.profiles (id, name, username) values ($1, 'X', 'x-user')",
        [USER_B],
      );

      await expectProtectedUpdate(client, USER_A, "role = 'admin'");
      await expectProtectedUpdate(client, USER_A, "status = 'suspended'");
      await expectProtectedUpdate(client, USER_A, "username = 'rls-a2'");
    });

    await withRole(client, "authenticated", USER_B, async () => {
      await expectOwnProfile(client, USER_B);
      await expectNoForeignRows(client, "profiles", USER_A);
      await expectNoForeignRows(client, "devices", DEVICE_A);
      await expectNoForeignRows(client, "usage_daily", USER_A);
      await expectNoForeignRows(client, "blocked_domains_daily", USER_A);
      await expectNoForeignRows(client, "blocked_events", USER_A);
    });

    await withRole(client, "authenticated", USER_ADMIN, async () => {
      await expectOwnProfile(client, USER_ADMIN);
      const profiles = await client.query<{ id: string }>(
        "select id from public.profiles",
      );
      assert(
        profiles.rows.length === 1 && profiles.rows[0]?.id === USER_ADMIN,
        "admin JWT still sees only its own profile without service role",
      );
      await expectPermissionDenied(client, "select * from public.device_ips");
      await expectPermissionDenied(client, "select * from public.admin_security");
    });

    await withRole(client, "anon", "", async () => {
      await expectPermissionDenied(client, "select * from public.profiles");
      await expectPermissionDenied(client, "select * from public.devices");
    });

    await withRole(client, "service_role", "", async () => {
      const deviceIps = await client.query("select * from public.device_ips");
      assert(deviceIps.rows.length === 3, "service role can read device_ips");
      const adminSecurity = await client.query(
        "select * from public.admin_security",
      );
      assert(
        adminSecurity.rows.length === 1,
        "service role can read admin_security",
      );

      await client.query(
        "select public.flush_dns_counters($1::jsonb, $2::jsonb, $3::jsonb)",
        [
          JSON.stringify([
            {
              user_id: USER_A,
              device_id: DEVICE_A,
              requests: 2,
              blocked: 1,
              rate_limited: 0,
            },
          ]),
          JSON.stringify([
            {
              user_id: USER_A,
              domain: "ads-a.example",
              category: 16,
              count: 1,
            },
          ]),
          JSON.stringify([
            {
              user_id: USER_A,
              device_id: DEVICE_A,
              domain: "ads-a.example",
              qtype: 1,
              category: 16,
            },
          ]),
        ],
      );

      const usage = await client.query<{
        requests: string;
        blocked: string;
      }>(
        `select requests, blocked
           from public.usage_daily
          where user_id = $1
            and device_id = $2
            and day = current_date`,
        [USER_A, DEVICE_A],
      );
      assert(
        usage.rows[0]?.requests === "12" && usage.rows[0]?.blocked === "3",
        "flush_dns_counters upserts usage counters",
      );

      const blockedDomains = await client.query<{
        count: string;
        category: number;
      }>(
        `select count, category
           from public.blocked_domains_daily
          where user_id = $1
            and day = current_date
            and domain = 'ads-a.example'`,
        [USER_A],
      );
      assert(
        blockedDomains.rows[0]?.count === "3" &&
          blockedDomains.rows[0]?.category === 16,
        "flush_dns_counters upserts blocked-domain aggregates with category",
      );

      const blockedEvents = await client.query<{ count: string }>(
        `select count(*)::text as count
           from public.blocked_events
          where user_id = $1
            and category = 16`,
        [USER_A],
      );
      assert(
        blockedEvents.rows[0]?.count === "2",
        "flush_dns_counters inserts blocked events with category",
      );
    });

    await client.query("rollback");
    console.log(`RLS tests passed (${assertions} assertions).`);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function seed(client: Client): Promise<void> {
  await client.query("set local session_replication_role = replica");
  try {
    for (const [id, name, username] of [
      [USER_A, "RLS A", "rls-a"],
      [USER_B, "RLS B", "rls-b"],
      [USER_ADMIN, "RLS Admin", "rls-admin"],
    ] as const) {
      await client.query(
        `insert into public.profiles (id, name, username)
         values ($1, $2, $3)`,
        [id, name, username],
      );
    }

    await client.query(
      "update public.profiles set role = 'admin' where id = $1",
      [USER_ADMIN],
    );

    await client.query(
      `insert into public.devices
         (id, user_id, tier, label, client_hash, ua_family, country_code)
       values
         ($1, $4, 'registered', 'laptop', 'rls-device-a-hash', 'Safari', 'ID'),
         ($2, $5, 'registered', 'phone', 'rls-device-b-hash', 'Safari', 'SG'),
         ($3, null, 'free', null, 'rls-device-free-hash', 'Safari', 'US')`,
      [DEVICE_A, DEVICE_B, DEVICE_FREE, USER_A, USER_B],
    );

    await client.query(
      `insert into public.device_ips (device_id, ip_enc, ip_hmac, ip_family)
       values
         ($1, 'enc-a', 'hmac-a', 4),
         ($2, 'enc-b', 'hmac-b', 6),
         ($3, 'enc-free', 'hmac-free', 4)`,
      [DEVICE_A, DEVICE_B, DEVICE_FREE],
    );

    await client.query(
      `insert into public.usage_daily
         (user_id, device_id, day, requests, blocked, rate_limited)
       values
         ($1, $2, current_date, 10, 2, 1),
         ($1, null, current_date - 1, 5, 1, 0),
         ($3, $4, current_date, 7, 3, 0),
         (null, $5, current_date, 4, 1, 0)`,
      [USER_A, DEVICE_A, USER_B, DEVICE_B, DEVICE_FREE],
    );

    await client.query(
      `insert into public.blocked_domains_daily
         (user_id, day, domain, count, category)
       values
         ($1, current_date, 'ads-a.example', 2, 8),
         ($2, current_date, 'ads-b.example', 3, 16)`,
      [USER_A, USER_B],
    );

    await client.query(
      `insert into public.blocked_events
         (user_id, device_id, domain, qtype, category)
       values
         ($1, $3, 'ads-a.example', 1, 8),
         ($2, $4, 'ads-b.example', 28, 16)`,
      [USER_A, USER_B, DEVICE_A, DEVICE_B],
    );

    await client.query(
      `insert into public.admin_security (admin_id, pin_hash)
       values ($1, 'test-pin-hash')`,
      [USER_ADMIN],
    );
  } finally {
    await client.query("set local session_replication_role = origin");
  }
}

async function withRole(
  client: Client,
  role: "authenticated" | "anon" | "service_role",
  sub: string,
  fn: () => Promise<void>,
): Promise<void> {
  await client.query("savepoint role_block");
  try {
    await client.query(`set local role ${role}`);
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [
      sub,
    ]);
    await client.query("select set_config('request.jwt.claim.role', $1, true)", [
      role,
    ]);
    await fn();
    await client.query("reset role");
    await client.query("select set_config('request.jwt.claim.sub', '', true)");
    await client.query("select set_config('request.jwt.claim.role', '', true)");
    await client.query("release savepoint role_block");
  } catch (error) {
    await client.query("rollback to savepoint role_block");
    await client.query("release savepoint role_block");
    throw error;
  }
}

async function expectOwnProfile(client: Client, id: string): Promise<void> {
  const result = await client.query<{ id: string }>(
    "select id from public.profiles",
  );
  assert(
    result.rows.length === 1 && result.rows[0]?.id === id,
    "user sees only its own profile",
  );
}

async function expectNoForeignRows(
  client: Client,
  table: string,
  foreignId: string,
): Promise<void> {
  const result = await client.query(
    `select 1 from public.${table} where ${
      table === "profiles"
        ? "id"
        : table === "devices"
          ? "id"
          : table === "usage_daily"
            ? "user_id"
            : table === "blocked_domains_daily" || table === "blocked_events"
              ? "user_id"
              : "id"
    } = $1`,
    [foreignId],
  );
  assert(result.rows.length === 0, `user cannot see foreign ${table} row`);
}

async function expectProtectedUpdate(
  client: Client,
  userId: string,
  assignment: string,
): Promise<void> {
  await expectPermissionDenied(
    client,
    `update public.profiles set ${assignment} where id = $1`,
    [userId],
  );
}

async function expectPermissionDenied(
  client: Client,
  sql: string,
  params: unknown[] = [],
): Promise<void> {
  await client.query("savepoint expected_error");
  try {
    await client.query(sql, params);
    await client.query("release savepoint expected_error");
    throw new Error(`Expected permission denial for: ${sql}`);
  } catch (error) {
    await client.query("rollback to savepoint expected_error");
    await client.query("release savepoint expected_error");
    if (!isPgError(error) || error.code !== "42501") {
      throw error;
    }
    assertions += 1;
  }
}

function isPgError(error: unknown): error is Error & { code?: string } {
  return error instanceof Error;
}

function assert(condition: boolean, message: string): void {
  assertions += 1;
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`RLS tests failed: ${message}`);
  process.exitCode = 1;
});
