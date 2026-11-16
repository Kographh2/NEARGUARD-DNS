import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const email = process.env.FIRST_ADMIN_EMAIL?.trim().toLowerCase();

  if (!url || !serviceRoleKey || !email) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and FIRST_ADMIN_EMAIL are required",
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const user = await findUserByEmail(supabase, email);
  if (!user) {
    throw new Error("No auth user matches FIRST_ADMIN_EMAIL; sign up first");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("Profile row is missing; apply the Phase 4 migration first");
  }

  console.log("Admin role granted.");
}

async function findUserByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<{ id: string } | null> {
  const perPage = 1000;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw error;
    }
    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email,
    );
    if (user) {
      return { id: user.id };
    }
    if (data.users.length < perPage) {
      return null;
    }
  }
  return null;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Admin bootstrap failed: ${message}`);
  process.exitCode = 1;
});
