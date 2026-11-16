import type { Metadata } from "next";
import Link from "next/link";

import { PasswordField } from "@/components/ui/password-field";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free NEAR ADGUARD account.",
};

export default function RegisterPage() {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
        Free account
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
        Create your NEAR ADGUARD account
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Your username becomes your personal DoH path. Choose carefully: a
        username is an identifier, not a secret.
      </p>

      <form action="/api/auth/register" method="post" className="mt-7 space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            className="input"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="username" className="label">
            Username
          </label>
          <div className="flex items-center rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-emerald-400/60 focus-within:ring-2 focus-within:ring-emerald-400/20">
            <span className="pl-4 text-sm text-slate-500">/</span>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-z][a-z0-9_-]{2,19}"
              className="w-full bg-transparent px-2 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              placeholder="yourname"
              aria-describedby="username-hint"
            />
          </div>
          <p id="username-hint" className="mt-1.5 text-xs leading-5 text-slate-500">
            3–20 lowercase letters, numbers, underscores, or hyphens. Must start
            with a letter. Reserved names are rejected.
          </p>
        </div>

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
            maxLength={254}
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <PasswordField
          name="password"
          label="Password"
          autoComplete="new-password"
          placeholder="At least 12 characters"
          minLength={12}
          hint="At least 12 characters, including a letter and a number."
        />

        <PasswordField
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          minLength={12}
        />

        <button type="submit" className="btn-primary w-full">
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-300 no-underline hover:text-emerald-200"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
