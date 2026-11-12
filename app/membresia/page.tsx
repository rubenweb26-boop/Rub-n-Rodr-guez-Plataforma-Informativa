import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { getCurrentUser } from "@/lib/auth/user";
import { MembershipPricingSection } from "@/components/membership-pricing-section";

export const metadata: Metadata = {
  title: "Membresías | Rubén Rodríguez – Plataforma Informativa",
  description: "Planes de membresía ciudadana y comercial para apoyar la defensa animal y fiscalización ciudadana.",
};

export default async function MembershipPage() {
  const user = await getCurrentUser();

  return (
    <PageShell>
      <main className="bg-[#f8f5ef] pb-24">
        {/* Encabezado */}
        <section className="border-b border-[#1f2d3d] bg-[#0c1624] py-16 text-white text-center">
          <div className="container-shell max-w-4xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d84d3d]/30 bg-[#d84d3d]/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-[#ff9d8e]">
              Suscripción y Respaldo
            </span>
            <h1 className="headline-display mt-4 text-[clamp(2.8rem,6vw,5rem)] font-black leading-tight tracking-tight">
              Membresías Oficiales
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#c3d1e4]">
              Selecciona el plan que mejor se adapte a ti: como ciudadano comprometido o como negocio ético que desea sumarse a nuestra vitrina.
            </p>
          </div>
        </section>

        {/* Sección interactiva con Plan Ciudadano y Plan Comercial */}
        <section className="container-shell pt-14">
          <MembershipPricingSection isUserLoggedIn={Boolean(user)} />
        </section>
      </main>
    </PageShell>
  );
}
