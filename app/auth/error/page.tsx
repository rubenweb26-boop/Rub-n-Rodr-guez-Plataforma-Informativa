import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { AuthButtons } from "@/components/auth-buttons";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Acceso no disponible" };

const messages: Record<string, string> = {
  not_configured:
    "El acceso está preparado, pero todavía falta conectar el proyecto de Supabase y las credenciales OAuth.",
  oauth_start_failed:
    "No se pudo iniciar el acceso. Inténtalo nuevamente más tarde o usa otro proveedor.",
  unsupported_provider:
    "Ese proveedor de acceso no está habilitado en este sitio.",
  provider_denied:
    "Cancelaste el acceso o el proveedor no autorizó la solicitud. Puedes intentarlo con otro método.",
  invalid_callback: "La respuesta de acceso no es válida o está incompleta.",
  exchange_failed:
    "No fue posible validar la sesión. Vuelve a iniciar el proceso de acceso.",
  rate_limited:
    "Se realizaron demasiados intentos de acceso. Espera unos minutos antes de volver a intentarlo.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  return (
    <PageShell>
      <main className="container-shell py-16">
        <section className="surface mx-auto max-w-2xl p-8 text-center">
          <AlertTriangle className="mx-auto text-[#9a6700]" size={35} />
          <h1 className="mt-5 text-2xl font-black">Acceso no disponible</h1>
          <p className="section-copy">
            {messages[code ?? ""] ?? "No fue posible completar el inicio de sesión."}
          </p>
          <AuthButtons returnTo="/mi-cuenta" className="mx-auto mt-6 max-w-md text-left" />
          <Link href="/" className="btn-secondary mt-5">
            Volver al inicio
          </Link>
        </section>
      </main>
    </PageShell>
  );
}
