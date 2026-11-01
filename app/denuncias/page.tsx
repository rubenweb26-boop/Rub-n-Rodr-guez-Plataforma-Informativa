import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import Link from "next/link";
import { AlertTriangle, ArrowRight, FileCheck2, LockKeyhole } from "lucide-react";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { PageShell } from "@/components/page-shell";
import { ComplaintForm } from "./complaint-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Presentar una denuncia" };

export default async function ComplaintsPage() {
  const user = await getChatGPTUser();
  const enabled = env.COMPLAINT_INTAKE_ENABLED === "true";
  return <PageShell><main>
    <section className="bg-[#142235] py-16 text-white"><div className="container-shell grid gap-8 lg:grid-cols-[1fr_.55fr]"><div><span className="eyebrow !text-[#ffb9ae]"><LockKeyhole size={16}/> Denuncias</span><h1 className="headline-display mt-4 text-[clamp(2.8rem,7vw,5.6rem)] font-black leading-[.9] tracking-[-.065em]">Envía tu denuncia.</h1><p className="mt-6 max-w-2xl text-lg leading-7 text-[#d3dce6]">Comparte información sobre situaciones de interés público en tu comunidad. Tu caso queda vinculado a tu cuenta para que puedas darle seguimiento.</p></div><div className="self-end border-l border-white/20 pl-6"><p className="m-0 text-sm leading-6 text-[#d3dce6]">Ante peligro inmediato, contacta al 9-1-1 o a la autoridad competente. Este formulario no es un canal de emergencia.</p></div></div></section>
    <section className="container-shell grid items-start gap-8 py-12 lg:grid-cols-[.68fr_1.32fr]"><aside className="grid gap-5 lg:sticky lg:top-28"><div className="surface bg-[#fffdf9] p-6"><FileCheck2 className="text-[#d84d3d]"/><h2 className="mt-4 text-xl font-black">Antes de empezar</h2><ul className="grid gap-3 pl-5 text-sm leading-6 text-[#5f6c80]"><li>Describe hechos verificables.</li><li>Evita datos sensibles innecesarios.</li><li>Conserva los archivos originales.</li></ul></div><div className="surface bg-[#fffdf9] p-6"><AlertTriangle className="text-[#9a6700]"/><h2 className="mt-4 text-lg font-black">Qué sucede después</h2><p className="m-0 text-sm leading-6 text-[#5f6c80]">La información no se publica automáticamente. El equipo puede pedir contexto adicional o cerrar el caso.</p></div>{user && <Link href="/mi-cuenta" className="btn-secondary">Consultar mis casos <ArrowRight size={17}/></Link>}</aside><div>{user ? <ComplaintForm enabled={enabled}/> : <div className="surface grid min-h-[390px] place-items-center bg-[#fffdf9] p-8 text-center"><div><LockKeyhole className="mx-auto text-[#d84d3d]" size={34}/><h2 className="mt-4 text-2xl font-black">Inicia sesión para continuar</h2><p className="section-copy max-w-md">La cuenta permite que solo tú consultes el seguimiento de la información enviada.</p><a className="btn-primary mt-3" href={chatGPTSignInPath("/denuncias")} target="_top">Iniciar sesión</a></div></div>}</div></section>
  </main></PageShell>;
}
