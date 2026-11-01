import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink, FileSearch, Globe2, Users } from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Sobre Rubén" };

export default function AboutPage() {
  return <PageShell><main>
    <section className="bg-[#fffdf9] py-16"><div className="container-shell grid items-center gap-10 lg:grid-cols-[.85fr_1.15fr]"><div><span className="eyebrow"><FileSearch size={16}/> Rubén Rodríguez</span><h1 className="headline-display mt-4 text-[clamp(2.7rem,7vw,5.8rem)] font-black leading-[.9] tracking-[-0.07em]">Información que impulsa conversación pública.</h1><p className="section-copy text-lg">RubénWeb reúne investigaciones, contenido audiovisual y un espacio de participación ciudadana responsable.</p><a className="btn-primary mt-4" href="https://rubenrodriguezoficial.com/" target="_blank" rel="noreferrer">Visitar sitio oficial <ExternalLink size={17}/></a></div><div className="relative aspect-[3/4] overflow-hidden rounded-[2px] shadow-[0_24px_70px_rgba(21,59,121,.18)]"><Image src="/media/ruben-retrato-principal.png" alt="Retrato de Rubén Rodríguez" fill sizes="(max-width: 1024px) 94vw, 650px" className="object-cover object-top"/></div></div></section>
    <section className="container-shell py-16"><div className="grid gap-5 md:grid-cols-3">{[[FileSearch,"Investigación","Historias desarrolladas con fuentes, contexto, revisión y una clara distinción entre información confirmada y material en proceso."],[Globe2,"Interés público","Cobertura de asuntos que afectan a comunidades, instituciones y la vida cotidiana en Costa Rica."],[Users,"Participación","Canales responsables para aportar información, hacer seguimiento privado y mantener una conversación informada."]].map(([Icon,title,copy])=>{const I=Icon as typeof Users;return <div key={title as string} className="surface bg-[#fffdf9] p-7"><I className="text-[#d84d3d]" size={27}/><h2 className="mt-5 text-xl font-black">{title as string}</h2><p className="section-copy text-sm">{copy as string}</p></div>})}</div></section>
  </main></PageShell>;
}
