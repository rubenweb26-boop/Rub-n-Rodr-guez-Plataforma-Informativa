import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Términos de uso" };
export default function TermsPage(){const sections=[
  ["Alcance del servicio","RubénWeb es una plataforma editorial en desarrollo. El canal de información no es un servicio de emergencias, una autoridad pública ni una garantía de publicación o investigación."],
  ["Información enviada","La persona usuaria debe aportar información de buena fe, evitar acusaciones deliberadamente falsas y respetar derechos de terceros. Todo material queda sujeto a revisión humana."],
  ["Contenido y membresía","Las funciones premium, precios, renovación, gracia, cancelación y reembolsos se definirán antes de activar pagos reales."],
  ["Publicidad","Los anuncios deben aprobarse y se identificarán como publicidad. La plataforma no certifica ventas externas que no pueda verificar."],
  ["Moderación y apelación","El cliente debe aprobar reglas de rechazo, rectificación, apelación y retiro de contenido antes del lanzamiento público."],
];return <PageShell><main><section className="bg-white py-16"><div className="container-shell max-w-4xl"><span className="eyebrow"><Scale size={16}/> Documento legal</span><h1 className="section-title mt-4 !text-[clamp(2.6rem,6vw,5rem)]">Términos de uso</h1><p className="mt-5 rounded-2xl border border-[#f0d99e] bg-[#fff9e9] p-4 text-sm leading-6 text-[#6d5313]"><strong>Estado:</strong> borrador técnico, no habilita todavía la recepción pública de datos sensibles ni cobros.</p><div className="mt-10 grid gap-8">{sections.map(([heading,copy])=><section key={heading}><h2 className="text-xl font-black">{heading}</h2><p className="section-copy">{copy}</p></section>)}</div></div></section></main></PageShell>}
