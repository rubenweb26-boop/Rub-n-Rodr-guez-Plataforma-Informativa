"use client";

import Script from "next/script";

export function TurnstileWidget({
  siteKey,
  action,
}: {
  siteKey: string;
  action: string;
}) {
  return (
    <div
      className="min-h-[65px] overflow-hidden rounded-xl"
      aria-label="Verificación contra robots"
    >
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-action={action}
        data-theme="light"
        data-response-field-name="cf-turnstile-response"
      />
    </div>
  );
}
