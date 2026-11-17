import type { Metadata } from "next";
import Link from "next/link";

import { PasswordField } from "@/components/ui/password-field";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import { publicEnv } from "@/lib/public-env";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your NEAR ADGUARD account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
    registered?: string | string[];
    confirmed?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const registered =
    (Array.isArray(params.registered)
      ? params.registered[0]
      : params.registered) === "1";
  const confirmed =
    (Array.isArray(params.confirmed) ? params.confirmed[0] : params.confirmed) ===
    "1";

  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
        Welcome back
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
        Sign in to NEAR ADGUARD
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Access your personal DoH URL, blocked-domain dashboard, and device
        labels.
      </p>

      {registered ? (
        <p
          role="status"
          className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-200"
        >
          Account created. Check your email to confirm, then sign in.
        </p>
      ) : null}

      {confirmed ? (
        <p
          role="status"
          className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-200"
        >
          Email confirmed. Sign in to continue.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-200"
        >
          {error.slice(0, 240)}
        </p>
      ) : null}

      <form action="/api/auth/login" method="post" className="mt-7 space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <PasswordField
          name="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
        />

        <div className="flex items-center justify-between gap-4 text-sm">
          <Link
            href="/forgot-password"
            className="text-emerald-300 no-underline hover:text-emerald-200"
          >
            Forgot password?
          </Link>
        </div>

        <TurnstileWidget siteKey={publicEnv.turnstileSiteKey} action="login" />

        <button type="submit" className="btn-primary w-full">
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        New here?{" "}
        <Link
          href="/register"
          className="font-medium text-emerald-300 no-underline hover:text-emerald-200"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
