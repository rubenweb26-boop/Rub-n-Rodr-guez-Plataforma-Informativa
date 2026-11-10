"use client";

import Link from "next/link";
import { useState } from "react";
import { signInPath } from "@/lib/auth/paths";
import { authProvider, authProviders, type AuthProviderId } from "@/lib/auth/providers";

/**
 * Inline marks instead of an icon dependency: the official sign-in button
 * guidelines require the provider mark to sit beside the label on a neutral
 * surface, and these SVGs carry no third-party runtime.
 */
function ProviderMark({ provider }: { provider: AuthProviderId }) {
  if (provider === "google") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.3.1c2.2-2.1 3.7-5.1 3.7-8.6Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 5.9-1.1 7.8-2.9l-3.7-2.9c-1 .7-2.3 1.2-4.1 1.2a7.1 7.1 0 0 1-6.7-4.9l-.1.1-3.6 2.8-.1.1A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.3 14.5a7.4 7.4 0 0 1 0-4.8l-.1-.1L1.6 6.8l-.1.1a12 12 0 0 0 0 10.2l3.8-2.6Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.7c2.3 0 3.9 1 4.8 1.9l3.4-3.3A12 12 0 0 0 1.5 6.9l3.8 2.9A7.1 7.1 0 0 1 12 4.7Z"
        />
      </svg>
    );
  }

  if (provider === "apple") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
        <path
          fill="currentColor"
          d="M17.05 12.66c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.94.94-.81 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.82 3.15-.47 7.81 1.3 10.37.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.38.81 1.4-.02 2.28-1.27 3.13-2.53.99-1.45 1.39-2.86 1.41-2.93-.03-.01-2.7-1.04-2.73-4.12ZM14.5 4.9c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-3 1.54-.66.76-1.24 1.98-1.08 3.15 1.14.09 2.31-.58 3.02-1.44Z"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"
      />
    </svg>
  );
}

const tone: Record<AuthProviderId, string> = {
  google: "border-[#d9d0c5] bg-white text-[#20293a] hover:bg-[#f7f3ee]",
  apple: "border-black bg-black text-white hover:bg-[#1c1c1e]",
  facebook: "border-[#1877F2] bg-[#1877F2] text-white hover:bg-[#1466d6]",
};

export function AuthButtons({
  returnTo = "/mi-cuenta",
  providers = authProviders,
  className = "",
}: {
  returnTo?: string;
  providers?: readonly AuthProviderId[];
  className?: string;
}) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div className={`grid gap-3 ${className}`}>
      {providers.length === 0 && <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">El inicio de sesión estará disponible cuando se configuren los proveedores de acceso.</p>}
      {providers.map((provider) => {
        const definition = authProvider(provider);
        return (
          <Link
            key={provider}
            href={signInPath(provider, returnTo)}
            onClick={event => { if (!agreed) event.preventDefault(); }}
            aria-disabled={!agreed}
            className={`inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border px-5 text-sm font-black transition-colors ${tone[provider]} ${!agreed ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <ProviderMark provider={provider} />
            {definition.label}
          </Link>
        );
      })}
      <label className="mt-2 flex items-start gap-2 text-left text-xs leading-5 text-[#6b7688]"><input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} className="mt-1" />
        <span>He leído y acepto los{" "}
        <Link href="/terminos" className="font-black text-[#a5342a]">
          términos
        </Link>{" "}
        y la{" "}
        <Link href="/privacidad" className="font-black text-[#a5342a]">
          política de privacidad
        </Link>
        .</span>
      </label>
    </div>
  );
}
