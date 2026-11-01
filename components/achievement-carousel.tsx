"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

type Highlight = { title: string; copy: string; source: string; href: string; label: string };

const highlights: Highlight[] = [
  { title: "Convenio con las Aldeas Infantiles SOS", copy: "Publicación incluida en la galería oficial de Rubén Rodríguez.", source: "Sitio oficial", href: "https://rubenrodriguezoficial.com/", label: "Ver fuente" },
  { title: "Participación en el Festival de la Luz", copy: "Momento documentado en la galería pública de su sitio oficial.", source: "Sitio oficial", href: "https://rubenrodriguezoficial.com/", label: "Ver fuente" },
  { title: "Contenido audiovisual", copy: "Su sitio oficial reúne una sección dedicada a videos musicales de Rubén Rodríguez.", source: "Sitio oficial", href: "https://rubenrodriguezoficial.com/", label: "Ver fuente" },
  { title: "Canal oficial en Instagram", copy: "Perfil oficial verificado para conocer publicaciones y material compartido directamente por Rubén.", source: "Instagram", href: "https://www.instagram.com/rubenrodriguezoficialdog/", label: "Abrir Instagram" },
];

export function AchievementCarousel() {
  const entries = highlights.slice(0, 10);
  const [current, setCurrent] = useState(0);
  const item = entries[current];
  const previous = () => setCurrent((value) => (value - 1 + entries.length) % entries.length);
  const next = () => setCurrent((value) => (value + 1) % entries.length);

  return <section className="border-y border-[#ded8ce] bg-[#fffdf9] py-20"><div className="container-shell grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><div><span className="eyebrow">Trayectoria pública</span><h2 className="headline-display mt-4 text-[clamp(2.7rem,5vw,4.7rem)] font-black leading-[.9] tracking-[-.06em]">Momentos y proyectos destacados.</h2><p className="section-copy mt-5 max-w-md">Una selección de publicaciones y apariciones que se encuentran en sus canales oficiales.</p></div><article className="surface relative overflow-hidden bg-[#142235] p-8 text-white sm:p-10"><p className="m-0 text-xs font-black uppercase tracking-[.15em] text-[#ffb9ae]">{item.source}</p><p className="mt-8 text-sm font-black text-[#ffb9ae]">{String(current + 1).padStart(2, "0")} / {String(entries.length).padStart(2, "0")}</p><h3 className="headline-display mt-3 max-w-2xl text-4xl font-black tracking-[-.055em]">{item.title}</h3><p className="mt-5 max-w-xl text-base leading-7 text-[#d3dce6]">{item.copy}</p><a href={item.href} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 text-sm font-black text-[#ffb9ae]">{item.label} <ExternalLink size={16}/></a><div className="mt-9 flex items-center justify-between border-t border-white/15 pt-5"><div className="flex gap-2" aria-label="Progreso del carrusel">{entries.map((entry, index)=><button key={entry.title} onClick={() => setCurrent(index)} className={`h-2 rounded-full transition-all ${index === current ? "w-8 bg-[#ff9d8e]" : "w-2 bg-white/35"}`} aria-label={`Ver ${entry.title}`} aria-current={index === current}/>)}</div><div className="flex gap-2"><button type="button" onClick={previous} className="grid size-11 place-items-center rounded-full border border-white/25 hover:bg-white/10" aria-label="Publicación anterior"><ArrowLeft size={18}/></button><button type="button" onClick={next} className="grid size-11 place-items-center rounded-full bg-[#d84d3d] hover:bg-[#c34233]" aria-label="Publicación siguiente"><ArrowRight size={18}/></button></div></div></article></div></section>;
}
