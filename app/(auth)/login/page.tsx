import type { Metadata } from "next";
import Link from "next/link";

import { PasswordField } from "@/components/ui/password-field";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your NEAR ADGUARD account.",
};

export default function LoginPage() {
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
