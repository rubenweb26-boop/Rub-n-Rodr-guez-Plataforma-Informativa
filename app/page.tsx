import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, BellRing, BookOpenCheck, Check, CirclePlay,
  FileSearch, LockKeyhole, MapPinned, MessageSquareText,
  SearchCheck, ShieldCheck, Store, Users,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";

const platformPillars = [
  { icon: SearchCheck, title: "Información verificada", copy: "Fuentes, contexto y revisión editorial antes de publicar." },
  { icon: LockKeyhole, title: "Privacidad por defecto", copy: "Las denuncias no se publican automáticamente." },
  { icon: Users, title: "Participación responsable", copy: "Un espacio para aportar información con trazabilidad." },
  { icon: BadgeCheck, title: "Acceso transparente", copy: "Funciones gratuitas y premium claramente diferenciadas." },
];

const process = [
  ["01", "Comparte la información", "Completa un formulario estructurado y adjunta respaldo cuando corresponda."],
  ["02", "Revisión humana", "El equipo evalúa contexto, privacidad, riesgos y necesidad de ampliar datos."],
  ["03", "Seguimiento privado", "Consulta el estado con tu cuenta y recibe solicitudes de información adicional."],
] as const;

export default function Home() {
  return (
    <PageShell>
      <main>
        <section className="relative overflow-hidden bg-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,#dceaff_0,transparent_36%),linear-gradient(90deg,#fff_0%,#fff_55%,#f1f6ff_100%)]" />
          <div className="container-shell relative grid min-h-[610px] items-center gap-10 py-12 lg:grid-cols-[.94fr_1.06fr] lg:py-16">
            <div className="max-w-[610px]">
              <span className="eyebrow"><span className="size-2 rounded-full bg-[#0759e6]" /> Información con propósito</span>
              <h1 className="mt-5 text-[clamp(2.65rem,6vw,5.5rem)] font-black leading-[.92] tracking-[-0.07em] text-[#081733]">
                Una voz para <span className="text-[#0759e6]">informar</span>, investigar y actuar.
              </h1>
              <p className="mt-6 max-w-[570px] text-[1.06rem] leading-7 text-[#4f5e73]">
                La nueva plataforma de Rubén Rodríguez reúne contenido editorial, investigaciones y un canal privado para aportar información de interés público en Costa Rica.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/contenido" className="btn-primary"><BookOpenCheck size={18} /> Explorar contenido</Link>
                <Link href="/denuncias" className="btn-secondary"><MessageSquareText size={18} /> Enviar información</Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-[#5b6679]">
                <span className="flex items-center gap-2"><Check className="text-[#0759e6]" size={15} /> Seguimiento privado</span>
                <span className="flex items-center gap-2"><Check className="text-[#0759e6]" size={15} /> Revisión humana</span>
                <span className="flex items-center gap-2"><Check className="text-[#0759e6]" size={15} /> Diseño accesible</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[660px]">
              <div className="absolute -left-7 top-12 z-10 hidden rounded-2xl border border-white/70 bg-white/95 p-4 shadow-2xl sm:block">
                <FileSearch className="mb-3 text-[#0759e6]" size={26} />
                <p className="m-0 text-xs font-black uppercase tracking-widest text-[#798397]">Enfoque</p>
                <p className="mt-1 text-sm font-bold">Investigación con contexto</p>
              </div>
              <div className="overflow-hidden rounded-[32px] border-[8px] border-white bg-[#dfe9f7] shadow-[0_30px_80px_rgba(16,47,102,.22)]">
                <Image src="/media/investigacion-hero-hd.png" alt="Mesa editorial para investigación de interés público" width={1792} height={1024} priority className="aspect-[4/3] w-full object-cover" />
              </div>
              <div className="absolute -bottom-6 right-3 max-w-[310px] rounded-2xl bg-[#071a3c] p-5 text-white shadow-2xl sm:right-6">
                <p className="m-0 text-xs font-black uppercase tracking-[.14em] text-[#9dbcf3]">Plataforma en validación</p>
                <p className="mb-0 mt-2 text-sm leading-5 text-[#e2ebfa]">El acceso a pagos y evidencias sensibles seguirá desactivado hasta completar pruebas y configuración legal.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#dce5f1] bg-[#f2f6fc] py-7">
          <div className="container-shell grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {platformPillars.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#0759e6] shadow-sm"><Icon size={21} /></span>
                <div><h2 className="m-0 text-sm font-black">{title}</h2><p className="mb-0 mt-1 text-xs leading-5 text-[#657187]">{copy}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="container-shell py-20" id="destacados">
          <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow"><FileSearch size={15} /> Contenido destacado</span>
              <h2 className="section-title mt-3">Historias que merecen contexto.</h2>
            </div>
            <Link href="/contenido" className="btn-secondary">Ver todo <ArrowRight size={17} /></Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
            <article className="surface overflow-hidden">
              <div className="grid h-full md:grid-cols-[1.05fr_.95fr]">
                <Image src="/media/investigacion-card-hd.png" alt="Equipo editorial y documentos para una investigación" width={1792} height={1024} className="h-full min-h-[300px] w-full object-cover" />
                <div className="flex flex-col p-7">
                  <span className="status-pill">Mesa editorial · En preparación</span>
                  <h3 className="mt-5 text-2xl font-black leading-tight tracking-[-0.035em]">Investigaciones con fuentes, contexto y trazabilidad.</h3>
                  <p className="section-copy text-sm">Las publicaciones nuevas aparecerán solo después de revisión editorial. No se presentan borradores ni información sensible como contenido confirmado.</p>
                  <Link href="/contenido" className="mt-auto flex items-center gap-2 pt-5 text-sm font-black text-[#0759e6]">Explorar el centro de contenido <ArrowRight size={16} /></Link>
                </div>
              </div>
            </article>
            <div className="grid gap-5">
              <article className="surface flex min-h-[190px] flex-col justify-between bg-[#071a3c] p-7 text-white">
                <div><span className="text-xs font-black uppercase tracking-[.14em] text-[#9dbcf3]">Próxima colección</span><h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">Videos y entrevistas</h3><p className="text-sm leading-6 text-[#c8d7ef]">Avances públicos y contenido completo para miembros, con autorización server-side.</p></div>
                <Link href="/contenido?tipo=video" className="mt-4 flex items-center gap-2 text-sm font-black"><CirclePlay size={17} /> Explorar formato</Link>
              </article>
              <article className="surface flex min-h-[170px] items-center gap-5 p-7">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#e7f0ff] text-[#0759e6]"><BellRing size={25} /></span>
                <div><p className="m-0 text-xs font-black uppercase tracking-[.12em] text-[#0759e6]">Alertas editoriales</p><h3 className="mb-1 mt-2 text-lg font-black">Recibe nuevas publicaciones</h3><p className="m-0 text-sm leading-5 text-[#657187]">Disponible cuando se configure el servicio de correo transaccional.</p></div>
              </article>
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-[#071a3c] py-20 text-white">
          <div className="container-shell grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <span className="eyebrow !text-[#8eb6ff]"><ShieldCheck size={16} /> Canal privado</span>
              <h2 className="mt-4 text-[clamp(2.2rem,5vw,4.5rem)] font-black leading-[.96] tracking-[-0.06em]">Tu información merece cuidado, no exposición.</h2>
              <p className="mt-6 max-w-xl leading-7 text-[#c5d3e8]">Las denuncias serán privadas por defecto, con revisión humana, código de seguimiento y controles de acceso. Este canal periodístico no sustituye una denuncia ante autoridades ni servicios de emergencia.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/denuncias" className="btn-primary !bg-white !text-[#0759e6]">Conocer el proceso <ArrowRight size={17} /></Link>
                <a href="tel:911" className="btn-secondary !border-white/30 !bg-transparent !text-white">Emergencia: 9-1-1</a>
              </div>
            </div>
            <div className="grid gap-4">
              {process.map(([number, title, copy]) => (
                <div key={number} className="grid grid-cols-[54px_1fr] gap-4 rounded-2xl border border-white/12 bg-white/[.06] p-5 backdrop-blur-sm">
                  <span className="grid size-12 place-items-center rounded-xl bg-[#1266f1] text-sm font-black">{number}</span>
                  <div><h3 className="m-0 text-lg font-black">{title}</h3><p className="mb-0 mt-1 text-sm leading-6 text-[#c6d5eb]">{copy}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-shell py-20">
          <div className="surface overflow-hidden">
            <div className="grid lg:grid-cols-[1.05fr_.95fr]">
              <div className="p-7 sm:p-10 lg:p-14">
                <span className="eyebrow"><Users size={16} /> Membresía fundadora</span>
                <h2 className="section-title mt-4">Apoya una plataforma independiente.</h2>
                <p className="section-copy max-w-xl">La propuesta inicial contempla acceso a videos completos, seguimiento de información enviada y notificaciones editoriales. Los cobros permanecen desactivados hasta concluir la integración en ambiente de pruebas.</p>
                <ul className="my-7 grid gap-3 p-0 text-sm font-bold sm:grid-cols-2">
                  {["Videos completos", "Seguimiento privado", "Archivo editorial", "Notificaciones de contenido"].map((item) => <li key={item} className="flex items-center gap-2"><Check className="text-[#0759e6]" size={17} /> {item}</li>)}
                </ul>
                <Link href="/membresia" className="btn-primary">Ver propuesta y condiciones <ArrowRight size={17} /></Link>
              </div>
              <div className="relative grid min-h-[390px] place-items-center bg-[linear-gradient(145deg,#dce9ff,#f4f8ff)] p-8">
                <div className="w-full max-w-[360px] rounded-[24px] border border-white bg-white p-7 shadow-[0_28px_70px_rgba(39,81,150,.18)]">
                  <div className="flex items-start justify-between"><div><p className="m-0 text-xs font-black uppercase tracking-widest text-[#0759e6]">Plan mensual propuesto</p><p className="mb-0 mt-3 text-5xl font-black tracking-[-0.06em]">$7 <span className="text-sm font-bold text-[#68758a]">USD</span></p></div><span className="rounded-full bg-[#eaf2ff] px-3 py-1 text-xs font-black text-[#0759e6]">Configurable</span></div>
                  <div className="my-6 h-px bg-[#e0e7f1]" />
                  <p className="text-sm leading-6 text-[#59667b]">Alternativa propuesta: ₡3.500 CRC. Los dos importes son opciones independientes; el administrador elegirá moneda y precio final.</p>
                  <button type="button" disabled className="btn-primary mt-3 w-full">Pagos aún no habilitados</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container-shell pb-10">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="surface p-7"><MapPinned className="text-[#0759e6]" size={28} /><h2 className="mt-5 text-xl font-black">Cobertura nacional</h2><p className="section-copy text-sm">Catálogos dependientes de provincia, cantón y distrito, pendientes de cargar desde una fuente oficial versionada.</p><Link href="/denuncias" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#0759e6]">Ver formulario <ArrowRight size={16} /></Link></div>
            <div className="surface p-7"><Store className="text-[#0759e6]" size={28} /><h2 className="mt-5 text-xl font-black">Anuncios identificados</h2><p className="section-copy text-sm">Productos y servicios con revisión administrativa y una distinción visible entre publicidad y contenido editorial.</p><Link href="/anuncios" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#0759e6]">Ver catálogo <ArrowRight size={16} /></Link></div>
            <div className="surface p-7"><SearchCheck className="text-[#0759e6]" size={28} /><h2 className="mt-5 text-xl font-black">Proyecto verificable</h2><p className="section-copy text-sm">Consulta qué módulos están listos, qué integraciones siguen desactivadas y qué decisiones requiere el cliente.</p><Link href="/estado-del-proyecto" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#0759e6]">Revisar estado <ArrowRight size={16} /></Link></div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
