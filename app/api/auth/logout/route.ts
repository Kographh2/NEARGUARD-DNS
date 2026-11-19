import { createRouteSupabaseClient } from "@/lib/auth";
import { methodNotAllowed, redirectTo } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return methodNotAllowed("POST");
}

export async function POST(request: Request): Promise<Response> {
  const { supabase, applyTo } = await createRouteSupabaseClient();
  await supabase.auth.signOut();
  return applyTo(redirectTo(request, "/"));
}
