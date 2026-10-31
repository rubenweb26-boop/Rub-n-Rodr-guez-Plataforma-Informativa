import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import Link from "next/link";
import { AlertTriangle, ArrowRight, FileCheck2, LockKeyhole, Siren } from "lucide-react";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { PageShell } from "@/components/page-shell";
import { ComplaintForm } from "./complaint-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Canal privado de información" };

export default async function ComplaintsPage() {
  const user = await getChatGPTUser();
  const enabled = env.COMPLAINT_INTAKE_ENABLED === "true";
  return <PageShell><main>
    <section className="bg-[#071a3c] py-16 text-white"><div className="container-shell grid gap-8 lg:grid-cols-[1fr_.55fr]"><div><span className="eyebrow !text-[#8eb6ff]"><LockKeyhole size={16}/> Canal privado</span><h1 className="mt-4 text-[clamp(2.5rem,7vw,5.3rem)] font-black leading-[.94] tracking-[-0.065em]">Comparte información con cuidado.</h1><p className="mt-6 max-w-2xl text-lg leading-7 text-[#c6d4e9]">Un formulario estructurado para aportar información de interés público, con privacidad por defecto, revisión humana y seguimiento.</p></div><div className="self-end rounded-2xl border border-white/15 bg-white/[.06] p-5"><Siren className="text-[#ffcf69]"/><h2 className="mb-1 mt-4 text-lg font-black">¿Hay peligro inmediato?</h2><p className="m-0 text-sm leading-6 text-[#c9d7eb]">No uses este formulario. Llama al <a href="tel:911" className="font-black text-white underline">9-1-1</a> o contacta a la autoridad competente.</p></div></div></section>
    <section className="container-shell grid items-start gap-8 py-12 lg:grid-cols-[.68fr_1.32fr]"><aside className="grid gap-5 lg:sticky lg:top-28"><div className="surface p-6"><FileCheck2 className="text-[#0759e6]"/><h2 className="mt-4 text-xl font-black">Antes de empezar</h2><ul className="grid gap-3 pl-5 text-sm leading-6 text-[#5f6c80]"><li>Describe hechos verificables.</li><li>Evita datos sensibles innecesarios.</li><li>No publiques acusaciones en redes.</li><li>Conserva los archivos originales.</li></ul></div><div className="surface p-6"><AlertTriangle className="text-[#9a6700]"/><h2 className="mt-4 text-lg font-black">No es publicación automática</h2><p className="m-0 text-sm leading-6 text-[#5f6c80]">Enviar información no garantiza que se publique ni que inicie una investigación. El equipo puede solicitar contexto adicional o rechazar el caso justificadamente.</p></div>{user && <Link href="/mi-cuenta" className="btn-secondary">Consultar mis casos <ArrowRight size={17}/></Link>}</aside><div>{user ? <ComplaintForm enabled={enabled}/> : <div className="surface grid min-h-[390px] place-items-center p-8 text-center"><div><LockKeyhole className="mx-auto text-[#0759e6]" size={34}/><h2 className="mt-4 text-2xl font-black">Inicia sesión para continuar</h2><p className="section-copy max-w-md">La identidad de cuenta permite que solo tú consultes el seguimiento de la información enviada.</p><a className="btn-primary mt-3" href={chatGPTSignInPath("/denuncias")} target="_top">Iniciar sesión</a></div></div>}</div></section>
  </main></PageShell>;
}
