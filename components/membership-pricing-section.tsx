"use client";

import { useState } from "react";
import { Check, CreditCard, ShieldCheck, Sparkles, Building2, UserCheck } from "lucide-react";

export function MembershipPricingSection({
  initialPlan = "membership_citizen",
  isUserLoggedIn = false,
}: {
  initialPlan?: "membership_citizen" | "membership_commercial";
  isUserLoggedIn?: boolean;
}) {
  const [selectedPlan, setSelectedPlan] = useState<"membership_citizen" | "membership_commercial">(initialPlan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCitizen = selectedPlan === "membership_citizen";

  async function handleProceedToPayment() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/onvo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: selectedPlan }),
      });

      const data = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "No se pudo iniciar el proceso de pago.");
      }

      window.location.assign(data.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la solicitud.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Selector de Plan */}
      <div className="mb-10 flex justify-center">
        <div className="inline-flex rounded-2xl border border-[#ded8ce] bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setSelectedPlan("membership_citizen")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black transition cursor-pointer ${
              isCitizen
                ? "bg-[#d84d3d] text-white shadow-md"
                : "text-[#556377] hover:text-[#142235]"
            }`}
          >
            <UserCheck size={18} />
            <span>Plan Ciudadano</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlan("membership_commercial")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black transition cursor-pointer ${
              !isCitizen
                ? "bg-[#142235] text-white shadow-md"
                : "text-[#556377] hover:text-[#142235]"
            }`}
          >
            <Building2 size={18} />
            <span>Plan Comercial</span>
          </button>
        </div>
      </div>

      {/* Grid de 2 Tarjetas Comparativas Visuales */}
      <div className="grid gap-8 lg:grid-cols-2 items-stretch">
        {/* Tarjeta Plan Ciudadano */}
        <div
          onClick={() => setSelectedPlan("membership_citizen")}
          className={`flex flex-col rounded-3xl p-8 sm:p-10 transition-all cursor-pointer ${
            isCitizen
              ? "border-2 border-[#d84d3d] bg-[#fffdf9] shadow-2xl scale-[1.02]"
              : "border border-[#ded8ce] bg-white/70 opacity-80 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#ffebe8] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#b74033]">
              Para personas y defensores
            </span>
            {isCitizen && (
              <span className="flex items-center gap-1 text-xs font-black text-[#d84d3d]">
                <ShieldCheck size={16} /> Seleccionado
              </span>
            )}
          </div>

          <h3 className="headline-display mt-5 text-3xl font-black text-[#142235]">
            Plan Ciudadano
          </h3>
          <p className="mt-2 text-sm text-[#556377]">
            Apoyo directo a las investigaciones, operativos de rescate animal y seguimiento prioritario.
          </p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-[#142235]">₡3.500</span>
            <span className="text-sm font-bold text-[#556377]">/ mes</span>
          </div>

          <div className="my-7 h-px bg-[#ded8ce]" />

          <ul className="space-y-3 text-sm font-semibold text-[#374151]">
            {[
              "Acceso total a investigaciones y expedientes",
              "Videos documentales y operativos en terreno",
              "Formulario privado de denuncias garantizado",
              "Seguimiento confidencial de tus propios reportes",
              "Soporte directo vía canal verificado de WhatsApp",
            ].map((f, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check className="mt-0.5 text-[#d84d3d] shrink-0" size={17} strokeWidth={3} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tarjeta Plan Comercial */}
        <div
          onClick={() => setSelectedPlan("membership_commercial")}
          className={`flex flex-col rounded-3xl p-8 sm:p-10 transition-all cursor-pointer ${
            !isCitizen
              ? "border-2 border-[#142235] bg-[#fffdf9] shadow-2xl scale-[1.02]"
              : "border border-[#ded8ce] bg-white/70 opacity-80 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-slate-200 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#142235]">
              Para emprendimientos éticos
            </span>
            {!isCitizen && (
              <span className="flex items-center gap-1 text-xs font-black text-[#142235]">
                <ShieldCheck size={16} /> Seleccionado
              </span>
            )}
          </div>

          <h3 className="headline-display mt-5 text-3xl font-black text-[#142235]">
            Plan Comercial
          </h3>
          <p className="mt-2 text-sm text-[#556377]">
            Para negocios, veterinarias y servicios afines que desean visibilidad en la plataforma.
          </p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-[#142235]">₡3.500</span>
            <span className="text-sm font-bold text-[#556377]">/ mes</span>
          </div>

          <div className="my-7 h-px bg-[#ded8ce]" />

          <ul className="space-y-3 text-sm font-semibold text-[#374151]">
            {[
              "Publicación verificada de hasta 10 productos o servicios",
              "Presencia en la vitrina informativa de Rubén Rodríguez",
              "Enlace directo a tu WhatsApp y redes sociales",
              "Distintivo de comercio comprometido con el bienestar animal",
              "Soporte comercial para actualización de publicaciones",
            ].map((f, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check className="mt-0.5 text-[#142235] shrink-0" size={17} strokeWidth={3} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Botón de Confirmación y Continuar al Pago Directo */}
      <div className="mt-10 rounded-3xl border border-[#ded8ce] bg-white p-6 sm:p-8 text-center shadow-lg">
        {error && (
          <p className="mb-4 text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-[#556377]">
              Has seleccionado:
            </p>
            <p className="text-xl font-black text-[#142235]">
              {isCitizen ? "Plan Ciudadano" : "Plan Comercial"} · ₡3.500 / mes
            </p>
          </div>

          <button
            type="button"
            onClick={handleProceedToPayment}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#d84d3d] px-8 py-4 text-base font-black text-white shadow-xl hover:bg-[#b74033] transition disabled:opacity-50 cursor-pointer"
          >
            <CreditCard size={19} />
            <span>{busy ? "Conectando pasarela..." : "Continuar al Pago Seguro"}</span>
          </button>
        </div>

        <p className="mt-4 text-[11px] text-[#718096]">
          El cobro se procesará de forma segura en moneda local (₡3.500 CRC). Puedes cancelar en cualquier momento desde tu cuenta.
        </p>
      </div>
    </div>
  );
}

