import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, ShieldCheck, Settings, CheckCircle2, Info, Lock } from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "Información transparente sobre el uso de cookies, almacenamiento local y tecnologías de seguimiento en la plataforma digital RubénWeb.",
};

export default function CookiesPage() {
  const lastUpdated = "Noviembre 2026";

  return (
    <PageShell>
      <main className="bg-[#fcfaf7] py-16 sm:py-20">
        <div className="container-shell max-w-4xl">
          {/* Header */}
          <div className="border-b border-[#ded8ce] pb-10">
            <span className="eyebrow flex items-center gap-2">
              <Cookie size={16} className="text-[#d84d3d]" />
              Transparencia Digital · Tecnologías de Navegación
            </span>
            <h1 className="headline-display mt-4 text-[clamp(2.5rem,5.5vw,4.2rem)] font-black leading-[1.02] tracking-[-0.05em] text-[#142235]">
              Política de Cookies y Almacenamiento Local
            </h1>
            <p className="mt-4 text-sm font-bold text-[#5d6875]">
              Última actualización: <span className="text-[#142235]">{lastUpdated}</span> · Ámbito territorial: República de Costa Rica
            </p>
            <div className="mt-6 rounded-2xl border border-[#ded8ce] bg-[#fffdf9] p-5 text-sm leading-relaxed text-[#404c5a] shadow-sm">
              En <strong>RubénWeb</strong> respetamos su privacidad y nos comprometemos a ser absolutamente transparentes sobre las tecnologías que utilizamos en nuestro sitio web. Esta Política de Cookies le explica qué son las cookies, cómo y por qué las usamos, y cómo puede usted gestionarlas o deshabilitarlas en cualquier momento.
            </div>
          </div>

          <div className="mt-12 space-y-12 text-[#24303e]">
            {/* 1. Qué son */}
            <section>
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                1. ¿Qué son las Cookies y el Almacenamiento Local?
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                Las <strong>cookies</strong> son pequeños archivos de texto que los sitios web almacenan en su navegador o dispositivo al visitarlos. Permiten que la plataforma recuerde sus acciones y preferencias (como inicio de sesión, idioma, moneda o consentimiento previo) durante un período determinado, evitando que deba volver a introducirlos cada vez que regresa al sitio o navega de una página a otra.
              </p>
              <p className="section-copy text-base leading-7 mt-3">
                De manera similar, utilizamos el <strong>Almacenamiento Local (Local Storage)</strong> del navegador, una tecnología web estándar que permite guardar información de manera segura directamente en su dispositivo para mejorar el rendimiento técnico y la fluidez de la interfaz sin enviar datos innecesarios a servidores remotos.
              </p>
            </section>

            {/* 2. Tipos de cookies */}
            <section>
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                2. Categorías de Cookies que Empleamos
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                En esta Plataforma agrupamos las cookies en las siguientes categorías funcionales:
              </p>

              <div className="mt-6 space-y-4">
                {/* Esenciales */}
                <div className="rounded-xl border border-[#ded8ce] bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Lock size={20} className="text-[#d84d3d]" />
                    <h3 className="font-black text-lg text-[#142235]">A. Cookies Técnicas y Estrictamente Necesarias (Incondicionales)</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#5d6875]">
                    Son aquellas imprescindibles para el funcionamiento correcto y seguro de la Plataforma. Sin ellas, los servicios básicos como autenticación de usuarios, envío protegido de denuncias o procesamiento seguro de pagos no pueden prestarse.
                  </p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#24303e]">
                      <thead className="border-b border-[#ded8ce] font-bold text-[#142235]">
                        <tr>
                          <th className="py-2 pr-4">Identificador</th>
                          <th className="py-2 pr-4">Proveedor</th>
                          <th className="py-2 pr-4">Finalidad</th>
                          <th className="py-2">Duración</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eee7dc]">
                        <tr>
                          <td className="py-2 pr-4 font-mono">sb-auth-token / session</td>
                          <td className="py-2 pr-4">RubénWeb (Propia)</td>
                          <td className="py-2 pr-4">Mantener la sesión autenticada segura del usuario ciudadano o administrador.</td>
                          <td className="py-2">Sesión / 30 días</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono">cf_clearance / __cf_bm</td>
                          <td className="py-2 pr-4">Cloudflare / Turnstile</td>
                          <td className="py-2 pr-4">Protección contra bots maliciosos, denegación de servicio (DDoS) y ataques de fuerza bruta.</td>
                          <td className="py-2">1 año / Variable</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono">rubenweb_cookie_consent</td>
                          <td className="py-2 pr-4">RubénWeb (LocalStorage)</td>
                          <td className="py-2 pr-4">Almacena su preferencia de aceptación o rechazo del banner de cookies.</td>
                          <td className="py-2">12 meses</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Funcionales y Preferencias */}
                <div className="rounded-xl border border-[#ded8ce] bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Settings size={20} className="text-[#d84d3d]" />
                    <h3 className="font-black text-lg text-[#142235]">B. Cookies de Preferencias y Funcionalidad</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#5d6875]">
                    Permiten recordar elecciones que usted ha realizado en la navegación, como la selección de moneda (₡ Colones / $ USD) en las opciones de membresía o el estado de filtros territoriales cantonales al navegar.
                  </p>
                </div>

                {/* Pasarelas de Pago */}
                <div className="rounded-xl border border-[#ded8ce] bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className="text-[#d84d3d]" />
                    <h3 className="font-black text-lg text-[#142235]">C. Cookies de Pasarelas de Pago y Prevención de Fraude</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#5d6875]">
                    Al iniciar una suscripción voluntaria de membresía, pasarelas bancarias autorizadas (ONVO Pay, Tilopay) pueden establecer identificadores cifrados temporales con el exclusivo fin de verificar la autenticidad de la transacción bancaria y prevenir transacciones fraudulentas con tarjetas robadas.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. No vendemos datos */}
            <section className="rounded-2xl border-l-4 border-[#087f5b] bg-[#f0fbf6] p-6 text-sm leading-6 text-[#085a41]">
              <strong className="block text-base font-black mb-1">Garantía de no comercialización publicitaria:</strong>
              RubénWeb <strong>NO utiliza cookies de redes publicitarias invasivas ni vende datos de su historial de navegación a terceros anunciantes</strong>. La información recopilada se utiliza con el único propósito de garantizar la operatividad técnica, la seguridad de las denuncias y la sostenibilidad del proyecto ciudadano.
            </section>

            {/* 4. Cómo gestionar cookies en el navegador */}
            <section>
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                3. ¿Cómo puede Configurar o Deshabilitar las Cookies?
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                Usted puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones de su navegador de Internet. En caso de que no permita la instalación de cookies estrictamente necesarias en su navegador, es posible que no pueda acceder a algunas de las secciones de la Plataforma (por ejemplo, el portal de denuncias o el inicio de sesión).
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-[#142235]">
                <div className="rounded-lg border border-[#ded8ce] bg-white p-4">
                  <strong>Google Chrome:</strong> Configuración &rarr; Privacidad y seguridad &rarr; Cookies y otros datos de sitios.
                </div>
                <div className="rounded-lg border border-[#ded8ce] bg-white p-4">
                  <strong>Mozilla Firefox:</strong> Opciones &rarr; Privacidad &amp; Seguridad &rarr; Cookies y datos del sitio.
                </div>
                <div className="rounded-lg border border-[#ded8ce] bg-white p-4">
                  <strong>Apple Safari:</strong> Preferencias &rarr; Privacidad &rarr; Bloquear todas las cookies.
                </div>
                <div className="rounded-lg border border-[#ded8ce] bg-white p-4">
                  <strong>Microsoft Edge:</strong> Configuración &rarr; Cookies y permisos del sitio &rarr; Cookies y datos almacenados.
                </div>
              </div>
            </section>

            {/* 5. Contacto */}
            <section className="rounded-2xl border border-[#ded8ce] bg-[#142235] p-8 text-white">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-white">
                4. Dudas sobre nuestra Política de Cookies
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#bdcbe1]">
                Si tiene cualquier duda sobre el funcionamiento de las cookies o el almacenamiento local en RubénWeb, escríbanos a{" "}
                <a href="mailto:rr@rubenrodriguezoficial.com" className="text-[#ff9d8e] underline font-bold">
                  rr@rubenrodriguezoficial.com
                </a>.
              </p>
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-4 text-xs text-[#a9b9d1]">
                <Link href="/privacidad" className="hover:text-white underline">
                  Política de Privacidad
                </Link>
                <span>·</span>
                <Link href="/terminos" className="hover:text-white underline">
                  Términos de Uso
                </Link>
                <span>·</span>
                <Link href="/" className="hover:text-white underline">
                  Volver al inicio
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

