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
      <div
        role="status"
        className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/70"
      >
        Bot verification is not configured. Set{" "}
        <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> to enable sign-up and
        sign-in.
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
        data-theme="dark"
      />
    </>
  );
}
