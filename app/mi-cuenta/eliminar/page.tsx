import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth/user";

export const dynamic = "force-dynamic";

export default async function DeleteAccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("/mi-cuenta/eliminar");
  const { error } = await searchParams;
  const deletionEnabled = process.env.ACCOUNT_DELETION_ENABLED === "true";
  return <PageShell><main className="container-shell max-w-2xl py-16"><div className="surface p-8">
    <h1 className="text-3xl font-black">Eliminar cuenta</h1>
    <p className="mt-4 text-sm leading-6">Esta acción elimina tu acceso y los datos de una cuenta sin expedientes ni pagos registrados. Si existen denuncias, pagos o suscripciones, la eliminación requiere revisión para respetar las obligaciones de conservación y cancelar cualquier cobro pendiente.</p>
    {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-800">{error === "records" ? "Esta cuenta tiene registros o pagos. Solicita la revisión de eliminación desde Contacto." : "No se pudo completar la eliminación. Inténtalo de nuevo o escribe por Contacto."}</p>}
    {!deletionEnabled && <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">La eliminación automática estará disponible cuando se complete la configuración de la base de datos. Solicita la revisión de tu cuenta desde Contacto.</p>}
    {deletionEnabled && <form action="/auth/delete-account" method="post" className="mt-8 space-y-5">
      <label className="field-label">Escribe tu correo para confirmar: {user.email}<input className="field-control" name="email" type="email" required autoComplete="off" /></label>
      <label className="flex items-start gap-3 text-sm"><input name="confirm" type="checkbox" value="yes" required className="mt-1" />Entiendo que esta acción no se puede deshacer.</label>
      <button type="submit" className="rounded-xl bg-rose-700 px-6 py-3 font-bold text-white">Eliminar mi cuenta</button>
    </form>}
    <a href="/contacto" className="mt-5 inline-block text-sm underline">Solicitar revisión de datos</a>
  </div></main></PageShell>;
}
