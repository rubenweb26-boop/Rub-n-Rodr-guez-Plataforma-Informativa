import type { Metadata } from "next";
import { AtSign, Camera, Mail, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Contacto" };

export default function ContactPage() {
  const channels = [
    { icon: MessageCircle, label: "WhatsApp", value: "+506 7015-0301", href: "https://wa.me/50670150301" },
    { icon: Mail, label: "Correo", value: "rr@rubenrodriguezoficial.com", href: "mailto:rr@rubenrodriguezoficial.com" },
    { icon: AtSign, label: "Facebook", value: "Perfil oficial", href: "https://www.facebook.com/share/1FGcVCAAKb/" },
    { icon: Camera, label: "Instagram", value: "@rubenrodriguezoficialdog", href: "https://www.instagram.com/rubenrodriguezoficialdog" },
  ];
  return <PageShell><main><section className="bg-[#142235] py-20 text-white"><div className="container-shell max-w-4xl text-center"><span className="eyebrow !text-[#ffb9ae]">Contacto</span><h1 className="headline-display mt-4 text-[clamp(2.8rem,7vw,5.6rem)] font-black leading-[.9] tracking-[-.065em]">Hablemos con claridad.</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-[#d3dce6]">Consultas generales, propuestas editoriales y oportunidades comerciales.</p></div></section><section className="container-shell py-14"><div className="grid gap-5 md:grid-cols-2">{channels.map(({icon:Icon,label,value,href})=><a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="surface flex items-center gap-5 bg-[#fffdf9] p-6 transition-transform hover:-translate-y-1"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#fff0e9] text-[#b74033]"><Icon size={24}/></span><div><p className="m-0 text-xs font-black uppercase tracking-widest text-[#6d788c]">{label}</p><p className="mb-0 mt-2 font-black">{value}</p></div></a>)}</div><div className="surface mt-8 bg-[#fffdf9] p-7"><h2 className="m-0 text-xl font-black">Emergencias y delitos</h2><p className="section-copy mb-0">Este sitio no es un servicio de emergencias. Ante peligro inmediato, llama al <a className="font-black text-[#a5342a]" href="tel:911">9-1-1</a> o contacta a la autoridad competente.</p></div></section></main></PageShell>;
}
