import type { Metadata } from "next";
import Link from "next/link";

import { PasswordField } from "@/components/ui/password-field";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import { publicEnv } from "@/lib/public-env";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun NEAR ADGUARD.",
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
    <div className="panel">
      <h1 className="section-title">Masuk</h1>
      <p className="section-copy">
        Masuk untuk membuka URL DoH pribadi dan dashboard.
      </p>

      {registered ? (
        <p role="status" className="notice notice-success mt-4">
          Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.
        </p>
      ) : null}

      {confirmed ? (
        <p role="status" className="notice notice-success mt-4">
          Email sudah dikonfirmasi. Masuk untuk melanjutkan.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="notice notice-error mt-4">
          {error.slice(0, 240)}
        </p>
      ) : null}

      <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
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
            placeholder="nama@contoh.com"
          />
        </div>

        <PasswordField
          name="password"
          label="Kata sandi"
          autoComplete="current-password"
          placeholder="Kata sandi kamu"
        />

        <p className="small">
          <Link href="/forgot-password">Lupa kata sandi?</Link>
        </p>

        <TurnstileWidget siteKey={publicEnv.turnstileSiteKey} action="login" />

        <button type="submit" className="btn-primary w-full">
          Masuk
        </button>
      </form>

      <p className="small mt-5">
        Belum punya akun? <Link href="/register">Buat akun</Link>.
      </p>
    </div>
  );
}
