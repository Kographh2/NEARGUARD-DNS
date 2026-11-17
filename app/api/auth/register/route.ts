import { NextResponse } from "next/server";

import {
  AuthConfigError,
  createRouteSupabaseClient,
  createServiceClient,
  getAuthConfig,
  verifyTurnstile,
} from "@/lib/auth";
import {
  methodNotAllowed,
  redirectTo,
  redirectWithError,
} from "@/lib/http";
import { firstValidationMessage, registerSchema } from "@/lib/validation";

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
      console.error(`Register configuration error: ${error.message}`);
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
      "/register",
      "Submit the registration form from this site and try again.",
    );
  }

  const parsed = registerSchema.safeParse({
    name: form.get("name"),
    username: form.get("username"),
    email: form.get("email"),
    password: form.get("password"),
    confirmPassword: form.get("confirmPassword"),
  });

  if (!parsed.success) {
    return redirectWithError(
      request,
      "/register",
      firstValidationMessage(parsed.error),
    );
  }

  const turnstileToken = String(form.get("cf-turnstile-response") ?? "");
  if (!(await verifyTurnstile(request, turnstileToken, config))) {
    return redirectWithError(
      request,
      "/register",
      "Complete the bot verification and try again.",
    );
  }

  const service = createServiceClient(config);
  const { data: existing, error: existingError } = await service
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (existingError) {
    console.error(
      `Register username check failed: ${existingError.code ?? "unknown"}`,
    );
    return NextResponse.json(
      { error: "Registration is temporarily unavailable. Try again later." },
      { status: 500 },
    );
  }

  if (existing) {
    return redirectWithError(
      request,
      "/register",
      "That username is already taken.",
    );
  }

  const { supabase, applyTo } = await createRouteSupabaseClient(config);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
        username: parsed.data.username,
      },
      emailRedirectTo: `${config.appUrl}/login?confirmed=1`,
    },
  });

  if (error) {
    return redirectWithError(
      request,
      "/register",
      "Could not create the account. If you already have one, sign in instead.",
    );
  }

  if (!data.user) {
    return redirectWithError(
      request,
      "/register",
      "Could not create the account. Try again.",
    );
  }

  if (data.user.identities?.length === 0) {
    return redirectWithError(
      request,
      "/login",
      "An account with this email already exists. Sign in instead.",
    );
  }

  const { error: profileError } = await service.from("profiles").upsert(
    {
      id: data.user.id,
      name: parsed.data.name,
      username: parsed.data.username,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error(
      `Register profile setup failed: ${profileError.code ?? "unknown"}`,
    );
    return NextResponse.json(
      {
        error:
          "The account was created, but the profile could not be set up. Contact support.",
      },
      { status: 500 },
    );
  }

  const response = redirectTo(
    request,
    data.session ? "/dashboard" : "/login?registered=1",
  );
  return applyTo(response);
}
