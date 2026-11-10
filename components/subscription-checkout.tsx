"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";
import { TurnstileWidget } from "@/components/turnstile-widget";

declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

export function SubscriptionCheckout({
  siteKey,
  initialPlan = "membership_citizen",
}: {
  siteKey?: string | null;
  initialPlan?: "membership_citizen" | "membership_commercial";
}) {
  const [selectedPlan, setSelectedPlan] = useState<"membership_citizen" | "membership_commercial">(initialPlan);
  const [paymentGateway, setPaymentGateway] = useState<"onvo" | "tilopay">("onvo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const turnstileToken = String(formData.get("cf-turnstile-response") || "");

    try {
      if (paymentGateway === "onvo") {
        // ONVO Pay Checkout
        const response = await fetch("/api/payments/onvo/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planKey: selectedPlan }),
        });

        const data = (await response.json()) as { checkoutUrl?: string; error?: string };
        if (!response.ok || !data.checkoutUrl) {
          throw new Error(data.error || "No fue posible iniciar ONVO Pay Checkout.");
        }

        window.location.assign(data.checkoutUrl);
      } else {
        // Tilopay Checkout
        const response = await fetch("/api/payments/tilopay/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planCode: selectedPlan === "membership_commercial" ? "comercial-mensual" : "contenido-mensual",
            turnstileToken,
          }),
        });

        const payload = (await response.json()) as { subscriptionUrl?: string; error?: string };
        if (!response.ok || !payload.subscriptionUrl) {
          throw new Error(payload.error || "No fue posible conectar con Tilopay.");
        }

        const target = new URL(payload.subscriptionUrl);
        const host = target.hostname.toLowerCase();
        if (
          target.protocol !== "https:" ||
          (host !== "tilopay.com" && !host.endsWith(".tilopay.com") && host !== "tp.cr" && !host.endsWith(".tp.cr"))
        ) {
          throw new Error("Dirección devuelta por la pasarela no válida.");
        }

        window.location.assign(target.toString());
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error procesando el pago.");
      window.turnstile?.reset();
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleCheckout} className="mt-6 grid gap-5">
      {/* Plan Selector */}
      <div>
        <label className="text-xs font-black uppercase tracking-wider text-[#5d6875]">
          Selecciona tu modalidad
        </label>
        <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSelectedPlan("membership_citizen")}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
              selectedPlan === "membership_citizen"
                ? "border-[#d84d3d] bg-[#fff5f3] shadow-sm"
                : "border-[#ded8ce] bg-white hover:border-[#142235]"
            }`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-black text-[#142235]">
                <User size={14} className="text-[#d84d3d]" /> Ciudadana
              </span>
              {selectedPlan === "membership_citizen" && (
                <CheckCircle2 size={16} className="text-[#d84d3d]" />
              )}
            </div>
            <p className="mt-2 text-2xl font-black text-[#142235]">₡3.500 <span className="text-xs font-normal text-[#5d6875]">/ mes</span></p>
            <p className="mt-1 text-[11px] leading-4 text-[#5d6875]">
              Denuncias, investigaciones completas y videos premium.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlan("membership_commercial")}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
              selectedPlan === "membership_commercial"
                ? "border-[#d84d3d] bg-[#fff5f3] shadow-sm"
                : "border-[#ded8ce] bg-white hover:border-[#142235]"
            }`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-black text-[#142235]">
                <Building2 size={14} className="text-[#d84d3d]" /> Comercial
              </span>
              {selectedPlan === "membership_commercial" && (
                <CheckCircle2 size={16} className="text-[#d84d3d]" />
              )}
            </div>
            <p className="mt-2 text-2xl font-black text-[#142235]">₡3.500 <span className="text-xs font-normal text-[#5d6875]">/ mes</span></p>
            <p className="mt-1 text-[11px] leading-4 text-[#5d6875]">
              Perfil de negocio, vitrina de hasta 10 productos y carrusel.
            </p>
          </button>
        </div>
      </div>

      {/* Payment Gateway Toggle */}
      <div>
        <label className="text-xs font-black uppercase tracking-wider text-[#5d6875]">
          Pasarela de pago
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentGateway("onvo")}
            className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-black transition ${
              paymentGateway === "onvo"
                ? "border-[#142235] bg-[#142235] text-white"
                : "border-[#ded8ce] bg-white text-[#142235] hover:bg-[#f8f5ef]"
            }`}
          >
            <CreditCard size={15} /> ONVO Pay (Tarjetas / SINPE)
          </button>
          <button
            type="button"
            onClick={() => setPaymentGateway("tilopay")}
            className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-black transition ${
              paymentGateway === "tilopay"
                ? "border-[#142235] bg-[#142235] text-white"
                : "border-[#ded8ce] bg-white text-[#142235] hover:bg-[#f8f5ef]"
            }`}
          >
            <Wallet size={15} /> Tilopay CR / Apple Pay
          </button>
        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-start gap-2.5 rounded-xl bg-[#f2ede4] p-3 text-xs leading-5 text-[#5d6875]">
        <ShieldCheck className="mt-0.5 shrink-0 text-[#087f5b]" size={16} />
        <span>
          Renovación automática mensual con ONVO Pay. Cifrado TLS de extremo a extremo sin almacenar números de tarjeta en el servidor.
        </span>
      </div>

      {siteKey && <TurnstileWidget siteKey={siteKey} action="subscribe_checkout" />}

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-[#fff0ef] p-3 text-xs text-[#a2342a]">
          <AlertTriangle className="mt-0.5 shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      <button
        disabled={busy}
        type="submit"
        className="btn-primary !w-full justify-center !py-3.5 text-sm"
      >
        {busy ? (
          <>
            <LoaderCircle className="animate-spin" size={17} /> Conectando con {paymentGateway === "onvo" ? "ONVO Pay" : "Tilopay"}…
          </>
        ) : (
          `Suscribirme por ₡3.500 / mes con ${paymentGateway === "onvo" ? "ONVO Pay" : "Tilopay"}`
        )}
      </button>
    </form>
  );
}
