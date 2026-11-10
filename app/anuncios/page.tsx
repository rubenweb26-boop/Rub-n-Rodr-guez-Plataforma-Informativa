import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import { CommercialShowcase } from "@/components/commercial-showcase";
import { PageShell } from "@/components/page-shell";
import {
  getApprovedAdvertisers,
  getApprovedProducts,
} from "@/lib/data/advertisers";

export const metadata: Metadata = {
  title: "Vitrina Comercial y Anunciantes | Rubén Rodríguez",
  description:
    "Directorio comercial, productos y servicios éticos recomendados en Costa Rica.",
};

export default function AdsPage() {
  const advertisers = getApprovedAdvertisers();
  const products = getApprovedProducts();

  return (
    <PageShell>
      <main>
        {/* Hero Section */}
        <section className="bg-[#142235] py-16 text-white sm:py-20">
          <div className="container-shell grid gap-8 lg:grid-cols-[1fr_.65fr]">
            <div>
              <span className="eyebrow flex items-center gap-2 !text-[#ffb9ae]">
                <Megaphone size={16} /> Vitrina Comercial para Emprendimientos
              </span>
              <h1 className="headline-display mt-5 text-[clamp(2.8rem,6vw,5.5rem)] font-black leading-[.9] tracking-[-.07em]">
                Comercios y servicios éticos, identificados con claridad.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-7 text-[#d3dce6]">
                Un espacio comercial separado del contenido editorial que conecta a miles de ciudadanos con veterinarias, alimentos naturales, educación canina y servicios profesionales en Costa Rica.
              </p>
            </div>

            <div className="self-end rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
              <span className="text-xs font-black uppercase tracking-wider text-[#ffb9ae]">
                Membresía Comercial
              </span>
              <p className="mb-0 mt-2 text-5xl font-black text-white">
                ₡3.500 <span className="text-base font-bold text-[#d3dce6]">/ mes</span>
              </p>
              <p className="mt-2 text-xs leading-5 text-[#c5d3e0]">
                Incluye perfil comercial verificado, publicación de hasta 10 productos o servicios y aparición en el carrusel publicitario.
              </p>
              <Link
                href="/membresia"
                className="btn-primary mt-4 flex w-full items-center justify-center gap-2 !border-[#d84d3d] !bg-[#d84d3d]"
              >
                Activar Membresía Comercial <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits & How It Works */}
        <section className="border-b border-[#ded8ce] bg-[#fffdf9] py-16">
          <div className="container-shell grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <span className="eyebrow">Plan para anunciantes</span>
              <h2 className="headline-display mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                Una vitrina directa, sin comisiones sobre tus ventas.
              </h2>
              <ul className="my-8 grid gap-4 p-0 text-sm font-bold sm:grid-cols-2">
                {[
                  "Perfil de negocio con logotipo y reseña",
                  "Enlace directo a WhatsApp comercial",
                  "Hasta 10 productos o servicios publicados",
                  "Fotografías, descripciones y precios en colones",
                  "Aparición en el carrusel de la página de inicio",
                  "Revisión y sello de comercio aprobado",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check className="mt-0.5 shrink-0 text-[#b74033]" size={17} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link href="/membresia" className="btn-primary">
                  Registrar mi negocio (₡3.500 / mes) <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <article className="surface bg-[#f8f5ef] p-8">
              <ShieldCheck className="text-[#d84d3d]" size={30} />
              <h2 className="mt-4 text-2xl font-black text-[#142235]">
                Reglas claras de publicación
              </h2>
              <ol className="mt-5 grid gap-4 pl-5 text-sm leading-6 text-[#5d6875]">
                <li>
                  <strong>Revisión administrativa:</strong> Cada comercio pasa por una verificación de legitimidad para garantizar confianza a la comunidad.
                </li>
                <li>
                  <strong>Límite de catálogo:</strong> Máximo 10 productos o servicios por anunciante para asegurar calidad e impacto equitativo.
                </li>
                <li>
                  <strong>Contacto directo:</strong> Toda consulta se dirige de forma transparente a tu WhatsApp o sitio web mediante el botón <em>&ldquo;Infórmate directamente con el proveedor&rdquo;</em>.
                </li>
                <li>
                  <strong>Separación editorial:</strong> La vitrina comercial nunca influye ni condiciona las denuncias ni las investigaciones de Rubén Rodríguez.
                </li>
              </ol>
            </article>
          </div>
        </section>

        {/* Commercial Showcase Section */}
        <section className="container-shell py-16">
          <CommercialShowcase advertisers={advertisers} products={products} />
        </section>
      </main>
    </PageShell>
  );
}
