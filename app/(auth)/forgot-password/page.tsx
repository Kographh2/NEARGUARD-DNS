import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a NEAR ADGUARD password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
        Account recovery
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
        Reset your password
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Enter the email address on your account. If it exists, we will send a
        short-lived reset link.
      </p>

      <form action="/api/auth/forgot-password" method="post" className="mt-7 space-y-4">
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

        <button type="submit" className="btn-primary w-full">
          Send reset link
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-300 no-underline hover:text-emerald-200"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
