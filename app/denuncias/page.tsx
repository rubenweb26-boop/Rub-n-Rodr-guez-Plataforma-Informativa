import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import Link from "next/link";
import { ArrowRight, FileCheck2, FolderOpen, LockKeyhole } from "lucide-react";
import { AuthButtons } from "@/components/auth-buttons";
import { getAvailableAuthProviders } from "@/lib/auth/available-providers";
import { PageShell } from "@/components/page-shell";
import { getCurrentUser } from "@/lib/auth/user";
import { getTurnstileSiteKey, isTurnstileConfigured } from "@/lib/security/turnstile";
import { ComplaintForm } from "./complaint-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Presentar Denuncia Ciudadana | Rubén Rodríguez – Plataforma Informativa",
  description: "Formulario oficial y confidencial para reportar situaciones de maltrato animal e interés público en Costa Rica.",
};

export default async function ComplaintsPage() {
  const user = await getCurrentUser();
  const availableProviders = await getAvailableAuthProviders();
  const enabled = env.COMPLAINT_INTAKE_ENABLED === "true" && isTurnstileConfigured();
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <PageShell>
      <main className="bg-[#f8f5ef]">
        {/* Encabezado elegante */}
        <section className="border-b border-[#1f2d3d] bg-[#0c1624] py-16 text-white">
          <div className="container-shell max-w-4xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d84d3d]/30 bg-[#d84d3d]/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-[#ff9d8e]">
              Canal de Atención Ciudadana
            </span>
            <h1 className="headline-display mt-4 text-[clamp(2.6rem,6vw,4.8rem)] font-black leading-[0.95] tracking-tight">
              Presenta tu denuncia.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#c3d1e4]">
              Registra información verificable sobre maltrato animal, criaderos ilegales o asuntos comunales. Tu reporte genera un código único para que le des seguimiento en todo momento.
            </p>
          </div>
        </section>

        {/* Contenedor del Formulario */}
        <section className="container-shell py-12 lg:py-16">
          <div className="mx-auto max-w-3xl">
            {user ? (
              <ComplaintForm enabled={enabled} turnstileSiteKey={turnstileSiteKey} />
            ) : (
              <div className="rounded-3xl border border-[#ded8ce] bg-[#fffdf9] p-8 text-center shadow-xl sm:p-12">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#d84d3d]/10 text-[#d84d3d]">
                  <LockKeyhole size={32} />
                </div>
                <h2 className="headline-display mt-5 text-3xl font-black text-[#142235]">
                  Inicia sesión para registrar tu denuncia
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#556377]">
                  Para garantizar la trazabilidad y que solo tú puedas consultar las pruebas y el avance de tu caso, ingresa con tu cuenta.
                </p>
                <div className="mx-auto mt-6 max-w-xs text-left">
                  <AuthButtons returnTo="/denuncias" providers={availableProviders} />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
