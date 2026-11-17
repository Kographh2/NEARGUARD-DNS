import { NextResponse } from "next/server";

import {
  AuthConfigError,
  createRouteSupabaseClient,
  getAuthConfig,
  verifyTurnstile,
} from "@/lib/auth";
import {
  methodNotAllowed,
  redirectTo,
  redirectWithError,
} from "@/lib/http";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return methodNotAllowed("POST");
}

export async function POST(request: Request): Promise<Response> {
  let config;
  try {
    config = getAuthConfig();
  } catch (error) {
    if (error instanceof AuthConfigError) {
      console.error(`Login configuration error: ${error.message}`);
      return NextResponse.json(
        {
          error:
            "Authentication is not configured on this deployment. Check the server environment variables.",
        },
        { status: 500 },
      );
    }
    throw error;
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirectWithError(
      request,
      "/login",
      "Submit the sign-in form from this site and try again.",
    );
  }

  const parsed = loginSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });

  if (!parsed.success) {
    return redirectWithError(
      request,
      "/login",
      "Enter a valid email address and password.",
    );
  }

  const turnstileToken = String(form.get("cf-turnstile-response") ?? "");
  if (!(await verifyTurnstile(request, turnstileToken, config))) {
    return redirectWithError(
      request,
      "/login",
      "Complete the bot verification and try again.",
    );
  }

  const { supabase, applyTo } = await createRouteSupabaseClient(config);
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const message = error.message.toLowerCase().includes("email not confirmed")
      ? "Confirm your email before signing in."
      : "Invalid email or password.";
    return redirectWithError(request, "/login", message);
  }

  return applyTo(redirectTo(request, "/dashboard"));
}
