import { afterEach, describe, expect, it, vi } from "vitest";

import { GET as registerGet, POST as registerPost } from "@/app/api/auth/register/route";
import { GET as loginGet } from "@/app/api/auth/login/route";

const AUTH_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TURNSTILE_SECRET_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("auth API routes", () => {
  it("rejects GET with 405 and Allow: POST", () => {
    for (const response of [registerGet(), loginGet()]) {
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("POST");
    }
  });

  it("returns a clear 500 instead of a 404 when auth env is missing", async () => {
    for (const key of AUTH_ENV_KEYS) {
      vi.stubEnv(key, "");
    }

    const response = await registerPost(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: new FormData(),
      }),
    );

    expect(response.status).toBe(500);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain("not configured");
  });

  it("redirects malformed form posts instead of crashing", async () => {
    for (const key of AUTH_ENV_KEYS) {
      vi.stubEnv(key, "test-value");
    }

    const response = await registerPost(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: "not-a-form",
        headers: { "content-type": "text/plain" },
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/register?error=");
  });
});
