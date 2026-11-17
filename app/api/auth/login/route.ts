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
            "Autentikasi belum dikonfigurasi di deployment ini. Periksa variabel lingkungan server.",
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
      "Kirim formulir masuk dari situs ini lalu coba lagi.",
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
      "Masukkan alamat email dan kata sandi yang valid.",
    );
  }

  const turnstileToken = String(form.get("cf-turnstile-response") ?? "");
  if (!(await verifyTurnstile(request, turnstileToken, config))) {
    return redirectWithError(
      request,
      "/login",
      "Selesaikan verifikasi bot lalu coba lagi.",
    );
  }

  const { supabase, applyTo } = await createRouteSupabaseClient(config);
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const message = error.message.toLowerCase().includes("email not confirmed")
      ? "Konfirmasi email sebelum masuk."
      : "Email atau kata sandi salah.";
    return redirectWithError(request, "/login", message);
  }

  return applyTo(redirectTo(request, "/dashboard"));
}
