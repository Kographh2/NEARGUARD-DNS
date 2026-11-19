import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import {
  getAppUrl,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  getTurnstileSecretKey,
  getTurnstileSiteKey,
} from "@/lib/env";
import { getClientIp } from "@/lib/ratelimit";

export interface AuthConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  turnstileSecretKey: string;
  turnstileSiteKey: string;
  appUrl: string;
}

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigError";
  }
}

export function getAuthConfig(): AuthConfig {
  try {
    return {
      url: getSupabaseUrl(),
      anonKey: getSupabaseAnonKey(),
      serviceRoleKey: getSupabaseServiceRoleKey(),
      turnstileSecretKey: getTurnstileSecretKey(),
      turnstileSiteKey: getTurnstileSiteKey(),
      appUrl: getAppUrl(),
    };
  } catch (error) {
    throw new AuthConfigError(
      error instanceof Error
        ? error.message
        : "Missing authentication configuration",
    );
  }
}

export function createServiceClient(
  config: AuthConfig = getAuthConfig(),
): SupabaseClient {
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function createRouteSupabaseClient(
  config: Pick<AuthConfig, "url" | "anonKey"> = {
    url: getSupabaseUrl(),
    anonKey: getSupabaseAnonKey(),
  },
): Promise<{
  supabase: SupabaseClient;
  applyTo: (response: NextResponse) => NextResponse;
}> {
  const cookieStore = await cookies();
  const pendingCookies: {
    name: string;
    value: string;
    options: CookieOptions;
  }[] = [];
  const pendingHeaders = new Headers();

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet, headers) => {
        pendingCookies.push(...cookiesToSet);
        for (const [key, value] of Object.entries(headers)) {
          pendingHeaders.set(key, value);
        }
      },
    },
  });

  return {
    supabase,
    applyTo(response) {
      for (const { name, value, options } of pendingCookies) {
        response.cookies.set(name, value, options);
      }
      pendingHeaders.forEach((value, key) => {
        response.headers.set(key, value);
      });
      return response;
    },
  };
}

export async function verifyTurnstile(
  request: Request,
  token: string,
  config: AuthConfig = getAuthConfig(),
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const body = new URLSearchParams({
    secret: config.turnstileSecretKey,
    response: token,
  });
  const ip = getClientIp(request);
  if (ip !== "unknown") {
    body.set("remoteip", ip);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) {
      return false;
    }
    const result = (await response.json()) as { success?: unknown };
    return result.success === true;
  } catch {
    return false;
  }
}
