import type { Metadata } from "next";
import Image from "next/image";
import { AtSign, Mail, MessageCircle, Phone, MapPin, ShieldAlert } from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Contacto Directo | Rubén Rodríguez",
  description: "Canales oficiales de comunicación para consultas ciudadanas, prensa y coordinación.",
};

export default function ContactPage() {
  const contactCards = [
    {
      title: "WhatsApp Oficial",
      subtitle: "Atención rápida y consultas sobre casos",
      value: "+506 7015-0301",
      href: "https://wa.me/50670150301",
      iconImg: "/media/social-whatsapp.png",
      actionText: "Enviar mensaje de WhatsApp",
      badge: "Recomendado",
    },
    {
      title: "Correo Electrónico",
      subtitle: "Consultas institucionales y asuntos formales",
      value: "rr@rubenrodriguezoficial.com",
      href: "mailto:rr@rubenrodriguezoficial.com",
      iconImg: "/media/social-gmail.png",
      actionText: "Escribir correo",
    },
    {
      title: "Facebook Oficial",
      subtitle: "Publicaciones comunitarias y transmisiones en vivo",
      value: "Rubén Rodríguez",
      href: "https://www.facebook.com/share/1FGcVCAAKb/",
      iconImg: "/media/social-facebook.png",
      actionText: "Visitar página oficial",
    },
    {
      title: "Instagram",
      subtitle: "Actualizaciones diarias de rescates y operativos",
      value: "@rubenrodriguezoficialdog",
      href: "https://www.instagram.com/rubenrodriguezoficialdog",
      iconImg: "/media/social-instagram.png",
      actionText: "Seguir en Instagram",
    },
  ];

  return (
    <PageShell>
      <main className="bg-[#f8f5ef] pb-24">
        {/* Hero Section */}
        <section className="border-b border-[#1f2d3d] bg-[#0c1624] py-16 text-white text-center">
          <div className="container-shell max-w-4xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d84d3d]/30 bg-[#d84d3d]/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-[#ff9d8e]">
              Canales Verificados
            </span>
            <h1 className="headline-display mt-4 text-[clamp(2.8rem,6vw,5rem)] font-black leading-tight tracking-tight">
              Contacto y Atención
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#c3d1e4]">
              Comunícate directamente a través de nuestras vías oficiales para consultas, propuestas o seguimiento de denuncias.
            </p>
          </div>
        </section>

        {/* Tarjetas Modernas */}
        <section className="container-shell py-14">
          <div className="grid gap-6 md:grid-cols-2">
            {contactCards.map((c) => (
              <a
                key={c.title}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noreferrer" : undefined}
                className="group relative flex flex-col justify-between rounded-3xl border border-[#ded8ce] bg-[#fffdf9] p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#d84d3d]/50 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white p-2.5 shadow-md border border-slate-100">
                      <Image
                        src={c.iconImg}
                        alt={c.title}
                        width={36}
                        height={36}
                        className="object-contain"
                      />
                    </div>
                    {c.badge && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-800">
                        {c.badge}
                      </span>
                    )}
                  </div>

                  <h2 className="headline-display mt-6 text-2xl font-black text-[#142235]">
                    {c.title}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-[#556377]">
                    {c.subtitle}
                  </p>

                  <p className="mt-4 font-mono text-base font-black text-[#d84d3d]">
                    {c.value}
                  </p>
                </div>

                <div className="mt-8 border-t border-[#ded8ce] pt-4">
                  <span className="text-xs font-black text-[#142235] group-hover:text-[#d84d3d] transition flex items-center gap-1.5">
                    {c.actionText} →
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Aviso sobre emergencias */}
          <div className="mt-10 flex items-start gap-4 rounded-3xl border border-amber-200 bg-amber-50/80 p-6 sm:p-8 text-amber-950">
            <ShieldAlert className="mt-1 text-amber-700 shrink-0" size={28} />
            <div>
              <h3 className="text-lg font-black text-amber-900">
                Aviso importante sobre emergencias
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                Esta plataforma es un canal de investigación civil y tutela comunitaria. Si te encuentras ante una situación de peligro inminente para la vida o un delito en flagrancia, debes comunicarte de inmediato al sistema nacional de emergencias <strong>9-1-1</strong> o a la delegación de la Fuerza Pública más cercana.
              </p>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
