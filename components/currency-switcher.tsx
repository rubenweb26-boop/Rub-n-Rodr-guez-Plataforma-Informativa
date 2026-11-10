import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/user";
import { getTurnstileSiteKey } from "@/lib/security/turnstile";
import { AuthButtons } from "./auth-buttons";
import { SubscriptionCheckout } from "./subscription-checkout";

export async function CurrencySwitcher() {
  const user = await getCurrentUser();
  const siteKey = getTurnstileSiteKey();

  return (
    <div className="surface mx-auto max-w-[490px] overflow-hidden bg-[#fffdf9] p-7 sm:p-9 shadow-xl">
      <div className="flex items-center justify-between">
        <span className="eyebrow flex items-center gap-1.5 !text-[#b74033]">
          <Sparkles size={14} /> Membresía Oficial
        </span>
        <span className="rounded bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-black text-[#166534]">
          Cobro en Colones (CRC)
        </span>
      </div>

      <p className="mb-0 mt-4 text-5xl font-black tracking-[-.06em] text-[#142235]">
        ₡3.500
        <span className="ml-2 text-base font-bold text-[#5d6875]">/ mes</span>
      </p>

      <p className="mt-3 text-sm leading-6 text-[#5d6875]">
        Acceso completo a investigaciones sin censura, videos documentales, formulario confidencial de denuncias y vitrina para anunciantes.
      </p>

      <div className="my-6 h-px bg-[#ded8ce]" />

      {!user ? (
        <div>
          <p className="mb-3 text-xs font-bold text-[#142235]">
            Inicia sesión o regístrate para activar tu suscripción:
          </p>
          <AuthButtons returnTo="/membresia" />
        </div>
      ) : (
        <SubscriptionCheckout siteKey={siteKey} />
      )}

      <div className="mt-6 border-t border-[#ded8ce] pt-4 text-center">
        <Link
          href="/contacto"
          className="text-xs font-bold text-[#a5342a] hover:underline"
        >
          ¿Dudas sobre el método de pago o facturación? Contáctanos
        </Link>
      </div>
    </div>
  );
}
