import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDashed, ExternalLink, LockKeyhole, ServerCog } from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Estado del proyecto" };

const ready = ["Portal responsive y navegación", "Contenido oficial inicial", "Autenticación administrada por Sites", "Modelo de datos D1 y migraciones", "Canal privado con autorización server-side", "Carga privada preparada en R2", "Registro idempotente de webhooks", "Documentación de despliegue y seguridad"];
const pending = ["Identidad pública con correo y contraseña", "Credenciales sandbox de ONVO Pay", "Proveedor privado de streaming", "WhatsApp Business Cloud API", "Correo transaccional y dominio verificado", "Antimalware para evidencias", "Catálogo oficial versionado de divisiones territoriales", "Textos legales aprobados por profesional"];
const decisions = ["Nombre, dominio y marca definitiva", "Moneda y precio final de membresía", "Proveedor de identidad pública", "Política de gracia, cancelación y reembolsos", "Roles administrativos y MFA", "Retención, publicación y apelación de denuncias"];

export default function ProjectStatusPage() {
  return <PageShell><main>
    <section className="border-b border-[#dce5f1] bg-white py-16"><div className="container-shell"><span className="eyebrow"><ServerCog size={16}/> Estado verificable</span><h1 className="mt-4 max-w-4xl text-[clamp(2.6rem,7vw,5.5rem)] font-black leading-[.94] tracking-[-0.065em]">Qué funciona, qué falta y qué no vamos a fingir.</h1><p className="section-copy max-w-3xl text-lg">Este MVP es una base privada para validar experiencia, arquitectura y controles. No acepta cobros reales ni información sensible de producción.</p></div></section>
    <section className="container-shell py-14"><div className="grid gap-6 lg:grid-cols-3"><StatusColumn icon={CheckCircle2} title="Implementado" tone="green" items={ready}/><StatusColumn icon={CircleDashed} title="Integración pendiente" tone="blue" items={pending}/><StatusColumn icon={AlertTriangle} title="Decisión del cliente" tone="amber" items={decisions}/></div></section>
    <section className="container-shell pb-14"><div className="surface grid gap-8 p-7 md:grid-cols-[1fr_.7fr] md:p-10"><div><span className="eyebrow"><LockKeyhole size={16}/> Pagos</span><h2 className="section-title mt-4">ONVO Pay es el candidato principal.</h2><p className="section-copy">La documentación pública describe llaves separadas de prueba y producción, suscripciones recurrentes y webhooks con secreto. El backend ya está preparado para registrar eventos idempotentes, pero nunca concede acceso premium desde una página de “éxito”.</p><a className="btn-secondary mt-3" href="https://docs.onvopay.com/webhooks" target="_blank" rel="noreferrer">Documentación oficial <ExternalLink size={16}/></a></div><div className="rounded-2xl bg-[#eef4ff] p-6"><h3 className="m-0 text-lg font-black">Antes de activar</h3><ol className="mb-0 mt-4 grid gap-3 pl-5 text-sm leading-6 text-[#58667b]"><li>Cuenta comercial aprobada.</li><li>Llaves de prueba y secreto webhook.</li><li>Importe y moneda definitivos.</li><li>Pruebas de duplicado, falsificación y eventos fuera de orden.</li><li>Conciliación y política de contracargos.</li></ol></div></div></section>
    <section className="container-shell pb-10"><div className="rounded-2xl bg-[#071a3c] p-7 text-white sm:flex sm:items-center sm:justify-between"><div><h2 className="m-0 text-xl font-black">Documentación técnica incluida</h2><p className="mb-0 mt-2 text-sm text-[#c7d5e9]">Arquitectura, seguridad, administración, despliegue, respaldos y pruebas.</p></div><Link href="/docs" className="btn-primary mt-5 !bg-white !text-[#0759e6] sm:mt-0">Abrir resumen</Link></div></section>
  </main></PageShell>;
}

function StatusColumn({icon:Icon,title,tone,items}:{icon:typeof CheckCircle2;title:string;tone:"green"|"blue"|"amber";items:string[]}) {
  const tones={green:"bg-[#e8f7f1] text-[#087f5b]",blue:"bg-[#eaf2ff] text-[#0759e6]",amber:"bg-[#fff4d8] text-[#8a6200]"};
  return <section className="surface p-6"><span className={`grid size-12 place-items-center rounded-xl ${tones[tone]}`}><Icon size={23}/></span><h2 className="mt-5 text-xl font-black">{title}</h2><ul className="mb-0 mt-5 grid gap-3 p-0">{items.map(item=><li key={item} className="flex gap-3 text-sm leading-5 text-[#5d697d]"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${tone==='green'?'bg-[#0b9469]':tone==='blue'?'bg-[#0759e6]':'bg-[#b8860b]'}`}/>{item}</li>)}</ul></section>
}
