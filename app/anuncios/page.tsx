import type { Metadata } from "next";
import { ArrowRight, BadgeDollarSign, Building2, CheckCircle2, Megaphone, ShieldCheck, Store } from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Anuncios y servicios" };

const spaces = [
  { icon: Store, category: "Productos", title: "Vitrina comercial", copy: "Tarjeta con fotografía, descripción, ubicación y enlace oficial del anunciante." },
  { icon: Building2, category: "Servicios", title: "Directorio profesional", copy: "Perfil comercial revisado, contacto por WhatsApp y estadísticas de clics." },
  { icon: Megaphone, category: "Campañas", title: "Espacio destacado", copy: "Promoción temporal identificada siempre como publicidad." },
];

export default function AdsPage() {
  return (
    <PageShell><main>
      <section className="border-b border-[#dce5f1] bg-white py-16"><div className="container-shell grid gap-7 lg:grid-cols-[1fr_.55fr]"><div><span className="eyebrow"><Megaphone size={16} /> Catálogo comercial</span><h1 className="mt-4 text-[clamp(2.6rem,7vw,5.5rem)] font-black leading-[.94] tracking-[-0.065em]">Publicidad clara. Comercio local visible.</h1><p className="section-copy max-w-2xl text-lg">El catálogo está preparado para anunciantes verificados. Todavía no contiene negocios publicados para evitar inventar ofertas, precios o testimonios.</p></div><div className="surface self-end p-6"><span className="status-pill"><ShieldCheck size={14} /> Revisión obligatoria</span><p className="mb-0 mt-4 text-sm leading-6 text-[#5f6b7f]">Cada anuncio requerirá aprobación administrativa, fecha de vencimiento y una etiqueta visible de publicidad.</p></div></div></section>
      <section className="container-shell py-14"><div className="mb-8 flex items-end justify-between gap-4"><div><span className="eyebrow">Espacios disponibles</span><h2 className="section-title mt-3">El catálogo inicia vacío y verificable.</h2></div><a className="btn-primary hidden sm:inline-flex" href="mailto:rr@rubenrodriguezoficial.com?subject=Interés%20en%20publicidad%20en%20RubénWeb">Solicitar información <ArrowRight size={17} /></a></div><div className="grid gap-5 md:grid-cols-3">{spaces.map(({icon:Icon,category,title,copy}) => <article key={title} className="surface overflow-hidden"><div className="grid min-h-[180px] place-items-center bg-[linear-gradient(145deg,#eaf2ff,#f8fbff)]"><span className="grid size-20 place-items-center rounded-[24px] bg-white text-[#0759e6] shadow-lg"><Icon size={34} /></span></div><div className="p-6"><p className="m-0 text-xs font-black uppercase tracking-[.12em] text-[#0759e6]">Publicidad · {category}</p><h2 className="mt-3 text-xl font-black">{title}</h2><p className="section-copy text-sm">{copy}</p><a href="mailto:rr@rubenrodriguezoficial.com?subject=Interés%20en%20publicidad%20en%20RubénWeb" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#0759e6]">Consultar disponibilidad <ArrowRight size={16} /></a></div></article>)}</div></section>
      <section className="container-shell pb-10"><div className="surface grid gap-8 p-7 md:grid-cols-3 md:p-9"><div><BadgeDollarSign className="text-[#0759e6]"/><h3 className="mb-1 mt-4 font-black">Modelo configurable</h3><p className="m-0 text-sm leading-6 text-[#657187]">Pago fijo o plan mensual. No se calcularán comisiones por ventas externas no verificables.</p></div><div><CheckCircle2 className="text-[#0759e6]"/><h3 className="mb-1 mt-4 font-black">Aprobación previa</h3><p className="m-0 text-sm leading-6 text-[#657187]">Revisión de identidad, contenido, destino y vigencia antes de publicar.</p></div><div><ShieldCheck className="text-[#0759e6]"/><h3 className="mb-1 mt-4 font-black">Separación editorial</h3><p className="m-0 text-sm leading-6 text-[#657187]">La publicidad se distingue visualmente del trabajo periodístico en todo momento.</p></div></div></section>
    </main></PageShell>
  );
}
