import Script from "next/script";

export function TurnstileWidget({
  siteKey,
  action,
}: {
  siteKey: string;
  action: "register" | "login";
}) {
  if (!siteKey) {
    return (
      <div role="status" className="notice small">
        Verifikasi bot belum dikonfigurasi. Set{" "}
        <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> untuk mengaktifkan daftar
        dan masuk.
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-action={action}
        data-theme="auto"
      />
    </>
  );
}
