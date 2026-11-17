import { readFileSync } from "node:fs";

import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local", quiet: true });

const DEFAULT_FILE = "supabase/migrations/202611170001_v15_schema.sql";

async function main(): Promise<void> {
  const file = process.argv[2] ?? DEFAULT_FILE;
  const dbUrl = process.env.SUPABASE_DB_URL?.trim();

  if (!dbUrl) {
    throw new Error("SUPABASE_DB_URL is required");
  }

  const sql = readFileSync(file, "utf8");
  if (sql.trim().length === 0) {
    throw new Error(`Migration file is empty: ${file}`);
  }

  const useSsl =
    !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1");
  const client = new Client({
    connectionString: dbUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    application_name: "nearguard-migration",
  });

  await client.connect();
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
    console.log(`Applied ${file} in one transaction.`);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((error: unknown) => {
  const raw = error instanceof Error ? error.message : String(error);
  const message = raw
    .replace(/postgres(?:ql)?:\/\/[^\s]+/giu, "[redacted-db-url]")
    .replace(/password=[^\s&]+/giu, "password=[redacted]");
  console.error(`Migration failed: ${message}`);
  process.exitCode = 1;
});
