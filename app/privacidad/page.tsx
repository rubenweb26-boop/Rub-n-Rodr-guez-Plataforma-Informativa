import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Privacidad" };
export default function PrivacyPage(){return <LegalPage title="Aviso de privacidad" sections={[
  ["Borrador para revisión","Este texto describe la intención técnica del MVP y no sustituye una política legal aprobada para producción."],
  ["Datos de cuenta","El MVP recibe de Sites un identificador estable y correo del usuario autenticado. El identificador se usa para limitar el acceso a registros propios."],
  ["Denuncias y evidencias","Son privadas por defecto. No se publican automáticamente. Los archivos se almacenan en un contenedor privado y el acceso requiere autorización del servidor."],
  ["Pagos","No se almacenan números completos de tarjeta ni CVV. La membresía solo podrá activarse después de verificar un evento confirmado por la pasarela."],
  ["Retención y derechos","Los plazos de conservación, rectificación, apelación y eliminación deben ser definidos por el cliente con asesoría legal costarricense antes de recibir datos reales."],
]}/>}

function LegalPage({title,sections}:{title:string;sections:string[][]}){return <PageShell><main><section className="bg-white py-16"><div className="container-shell max-w-4xl"><span className="eyebrow"><ShieldAlert size={16}/> Documento legal</span><h1 className="section-title mt-4 !text-[clamp(2.6rem,6vw,5rem)]">{title}</h1><p className="mt-5 rounded-2xl border border-[#f0d99e] bg-[#fff9e9] p-4 text-sm leading-6 text-[#6d5313]"><strong>Estado:</strong> borrador técnico, pendiente de revisión jurídica y autorización del cliente.</p><div className="mt-10 grid gap-8">{sections.map(([heading,copy])=><section key={heading}><h2 className="text-xl font-black">{heading}</h2><p className="section-copy">{copy}</p></section>)}</div></div></section></main></PageShell>}
