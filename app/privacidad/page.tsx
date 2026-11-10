import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  FileText,
  Server,
  UserCheck,
  AlertTriangle,
  Mail,
  Cpu,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Política de Privacidad y Protección de Datos",
  description:
    "Política de Privacidad y Tratamiento de Datos Personales de la plataforma digital RubénWeb y las iniciativas de Rubén Rodríguez en Costa Rica conforme a la Ley N° 8968.",
};

export default function PrivacyPage() {
  const lastUpdated = "Noviembre 2026";

  return (
    <PageShell>
      <main className="bg-[#fcfaf7] py-16 sm:py-20">
        <div className="container-shell max-w-4xl">
          {/* Header */}
          <div className="border-b border-[#ded8ce] pb-10">
            <span className="eyebrow flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#d84d3d]" />
              Marco Legal y Protección Ciudadana · Ley N° 8968
            </span>
            <h1 className="headline-display mt-4 text-[clamp(2.5rem,5.5vw,4.2rem)] font-black leading-[1.02] tracking-[-0.05em] text-[#142235]">
              Política de Privacidad y Tratamiento de Datos Personales
            </h1>
            <p className="mt-4 text-sm font-bold text-[#5d6875]">
              Última actualización: <span className="text-[#142235]">{lastUpdated}</span> · Ámbito territorial: República de Costa Rica
            </p>
            <div className="mt-6 rounded-2xl border border-[#ded8ce] bg-[#fffdf9] p-5 text-sm leading-relaxed text-[#404c5a] shadow-sm">
              <strong className="text-[#142235]">Aviso fundamental:</strong> Esta Política de Privacidad rige el tratamiento de la información recopilada a través del sitio web oficial de <strong>Rubén Rodríguez</strong> (en adelante, la &ldquo;Plataforma&rdquo; o &ldquo;RubénWeb&rdquo;). La plataforma procesa datos para la gestión ciudadana, periodismo de investigación independiente y canalización de denuncias en estricto apego a la <strong>Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales (Ley N° 8968 de Costa Rica)</strong> y su Reglamento.
            </div>
          </div>

          {/* Table of Contents Quick Links */}
          <nav className="my-8 rounded-xl border border-[#ded8ce] bg-white p-5 text-sm">
            <p className="m-0 font-extrabold uppercase tracking-wider text-[#b74033] text-xs">Índice del documento</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 text-[#142235]">
              <a href="#responsable" className="hover:text-[#d84d3d] hover:underline">1. Responsable del tratamiento</a>
              <a href="#datos-recabados" className="hover:text-[#d84d3d] hover:underline">2. Datos que recabamos</a>
              <a href="#finalidad" className="hover:text-[#d84d3d] hover:underline">3. Finalidad del tratamiento</a>
              <a href="#consentimiento" className="hover:text-[#d84d3d] hover:underline">4. Consentimiento informado</a>
              <a href="#denuncias" className="hover:text-[#d84d3d] hover:underline">5. Denuncias y confidencialidad</a>
              <a href="#ia" className="hover:text-[#d84d3d] hover:underline">6. Procesamiento automatizado e IA</a>
              <a href="#pagos" className="hover:text-[#d84d3d] hover:underline">7. Pagos y datos financieros</a>
              <a href="#derechos-arco" className="hover:text-[#d84d3d] hover:underline">8. Derechos ARCO</a>
              <a href="#seguridad" className="hover:text-[#d84d3d] hover:underline">9. Seguridad y retención</a>
              <a href="#contacto" className="hover:text-[#d84d3d] hover:underline">10. Contacto y canal oficial</a>
            </div>
          </nav>

          {/* Content Sections */}
          <div className="space-y-12 text-[#24303e]">
            {/* 1. Responsable */}
            <section id="responsable" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                1. Responsable del Tratamiento y Base de Datos
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                El responsable de las bases de datos personales generadas por esta Plataforma es la administración del proyecto independiente de <strong>Rubén Rodríguez</strong>, con domicilio de operaciones en San José, República de Costa Rica.
              </p>
              <p className="section-copy text-base leading-7 mt-3">
                Para cualquier gestión vinculada a la protección de datos personales, puede comunicarse de forma directa al correo oficial:{" "}
                <a href="mailto:rr@rubenrodriguezoficial.com" className="font-bold text-[#d84d3d] underline">
                  rr@rubenrodriguezoficial.com
                </a>.
              </p>
            </section>

            {/* 2. Datos recabados */}
            <section id="datos-recabados" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                2. Datos Personales que Recabamos
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                Dependiendo de las funciones que usted utilice en la Plataforma, podremos recopilar las siguientes categorías de datos:
              </p>
              <ul className="mt-4 space-y-3 pl-5 text-sm leading-6">
                <li className="list-disc">
                  <strong>Datos de identificación y contacto:</strong> Nombre, apellidos, número de teléfono (WhatsApp), dirección de correo electrónico y credenciales seguras de acceso a su cuenta ciudadana.
                </li>
                <li className="list-disc">
                  <strong>Datos territoriales y de localización voluntaria:</strong> Provincia, Cantón y Distrito que usted selecciona voluntariamente al radicar una denuncia ciudadana o consulta pública.
                </li>
                <li className="list-disc">
                  <strong>Contenido de denuncias y material probatorio:</strong> Descripción detallada de hechos presuntamente ilícitos o de interés público, así como archivos adjuntos (fotografías, videos, audios y documentos) que el usuario decide cargar bajo su libre arbitrio.
                </li>
                <li className="list-disc">
                  <strong>Datos técnicos y de navegación:</strong> Dirección IP anonimizada, identificadores de sesión, tipo de navegador, sistema operativo y registros de auditoría necesarios para prevenir fraudes, ataques de denegación de servicio (DDoS) o usos maliciosos.
                </li>
              </ul>
            </section>

            {/* 3. Finalidad */}
            <section id="finalidad" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                3. Finalidad y Legitimación del Tratamiento
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                Sus datos son tratados exclusivamente para los siguientes fines legítimos:
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="surface bg-white p-5 border border-[#ded8ce] rounded-xl">
                  <h3 className="font-bold text-[#142235] text-base">Recepción y trámite de denuncias</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#5d6875]">
                    Clasificar, analizar y coordinar técnicamente las denuncias ciudadanas ante autoridades competentes (SENASA, OIJ, Ministerio Público, Fuerza Pública o Concejos Municipales) cuando los indicios lo ameriten.
                  </p>
                </div>
                <div className="surface bg-white p-5 border border-[#ded8ce] rounded-xl">
                  <h3 className="font-bold text-[#142235] text-base">Seguimiento confidencial</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#5d6875]">
                    Permitir al usuario consultar el estado de avance de su caso mediante un código único de seguimiento en la web o a través de mensajería automatizada autorizada.
                  </p>
                </div>
                <div className="surface bg-white p-5 border border-[#ded8ce] rounded-xl">
                  <h3 className="font-bold text-[#142235] text-base">Gestión de membresías</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#5d6875]">
                    Administrar las suscripciones de apoyo voluntario (₡3.500/mes) para el financiamiento de operativos de campo, logística e investigaciones periodísticas.
                  </p>
                </div>
                <div className="surface bg-white p-5 border border-[#ded8ce] rounded-xl">
                  <h3 className="font-bold text-[#142235] text-base">Seguridad y prevención legal</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#5d6875]">
                    Prevenir delitos informáticos, proteger la integridad de los servidores y cumplir con mandatos judiciales vinculantes de las autoridades de la República de Costa Rica.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Consentimiento informado */}
            <section id="consentimiento" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                4. Consentimiento Informado (Artículo 5 de la Ley N° 8968)
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                Al registrarse, iniciar sesión, remitir un formulario de denuncia o activar una membresía en RubénWeb, <strong>usted manifiesta de forma expresa, previa, inequívoca y voluntaria que autoriza el tratamiento de sus datos personales</strong> conforme a las finalidades descritas en esta política.
              </p>
              <div className="mt-4 rounded-xl border-l-4 border-[#b74033] bg-[#fff9f8] p-4 text-sm leading-6 text-[#5a2420]">
                Usted no está legalmente obligado a brindar información personal facultativa; no obstante, la omisión de ciertos datos mínimos de contacto o evidencias indispensables puede imposibilitar el análisis, la validación o el seguimiento de la denuncia formulada.
              </div>
            </section>

            {/* 5. Denuncias y confidencialidad */}
            <section id="denuncias" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235] flex items-center gap-2">
                <Lock size={20} className="text-[#d84d3d]" />
                5. Privacidad por Defecto y Tratamiento de Evidencias
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                RubénWeb implementa el principio de <strong>Privacidad por Defecto</strong>:
              </p>
              <ul className="mt-3 space-y-2 pl-5 text-sm leading-6">
                <li className="list-disc">
                  <strong>No publicación automática:</strong> Ninguna denuncia, testimonio o material fotográfico/videográfico aportado se publica de manera automática en la plataforma ni en redes sociales.
                </li>
                <li className="list-disc">
                  <strong>Cuarentena y control de acceso:</strong> Todos los archivos probatorios se alojan en repositorios privados con acceso estrictamente restringido al equipo de investigación y auditoría.
                </li>
                <li className="list-disc">
                  <strong>Protección del denunciante:</strong> En caso de que un caso deba ser elevado a instancias judiciales o policiales formales, se tomarán las medidas técnicas a nuestro alcance para resguardar la identidad de la persona denunciante, salvo que medie orden judicial imperativa o consentimiento expreso por escrito.
                </li>
              </ul>
            </section>

            {/* 6. IA y Automatización */}
            <section id="ia" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235] flex items-center gap-2">
                <Cpu size={20} className="text-[#d84d3d]" />
                6. Tratamiento Mediante Inteligencia Artificial (IA) y Automatización
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                En cumplimiento de las mejores prácticas de transparencia digital y protección al usuario:
              </p>
              <div className="mt-4 space-y-3 rounded-2xl border border-[#ded8ce] bg-white p-6 text-sm leading-relaxed">
                <p>
                  <strong>Uso de herramientas de Inteligencia Artificial:</strong> Esta plataforma digital utiliza herramientas de Inteligencia Artificial (incluyendo modelos de lenguaje a gran escala, algoritmos de procesamiento de texto e interfaces de asistencia automatizada como chatbots y analizadores de texto) para tareas auxiliares de:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#5d6875]">
                  <li>Clasificación y categorización preliminar de temáticas (ej. ambiental, maltrato animal, irregularidad administrativa).</li>
                  <li>Generación de borradores de resúmenes editoriales y redacción preliminar.</li>
                  <li>Atención automatizada inicial de consultas frecuentes vía web y mensajería.</li>
                </ul>
                <p>
                  <strong>Supervisión Humana y Deslinde:</strong> Ninguna decisión que afecte los derechos sustantivos de las personas se toma de manera exclusivamente automatizada. Todo proceso de investigación en el terreno, coordinación institucional o publicación editorial es revisado, contrastado y avalado por criterio humano responsable.
                </p>
                <p>
                  <strong>No utilización de datos para entrenamiento no autorizado:</strong> Los datos personales y documentos confidenciales aportados por los usuarios en denuncias privadas <strong>no se transfieren a terceros para entrenamiento público de modelos de inteligencia artificial comercial</strong> sin su autorización.
                </p>
              </div>
            </section>

            {/* 7. Pagos */}
            <section id="pagos" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                7. Pagos, Pasarelas y Datos Financieros
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                La plataforma <strong>NO recopila, procesa ni almacena números completos de tarjetas de crédito o débito, códigos de seguridad (CVV/CVC) ni fechas de vencimiento</strong> en sus servidores.
              </p>
              <p className="section-copy text-base leading-7 mt-3">
                Los cobros de suscripciones y membresías se procesan de forma cifrada a través de pasarelas de pago autorizadas y certificadas bajo estándares <strong>PCI-DSS</strong> (tales como ONVO Pay y Tilopay). RubénWeb únicamente recibe identificadores de transacción (tokens) y estados de pago emitidos por la pasarela para activar o renovar el estatus de membresía.
              </p>
            </section>

            {/* 8. Derechos ARCO */}
            <section id="derechos-arco" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                8. Ejercicio de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                De conformidad con la Ley N° 8968 de Costa Rica, todo titular de datos personales tiene derecho a:
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                <div className="rounded-lg border border-[#ded8ce] bg-white p-4">
                  <span className="font-extrabold text-[#d84d3d]">Acceso:</span> Conocer qué datos personales suyos constan en nuestros registros y cómo se han obtenido.
                </div>
                <div className="rounded-lg border border-[#ded8ce] bg-white p-4">
                  <span className="font-extrabold text-[#d84d3d]">Rectificación:</span> Solicitar la corrección o actualización de datos incompletos o erróneos.
                </div>
                <div className="rounded-lg border border-[#ded8ce] bg-white p-4">
                  <span className="font-extrabold text-[#d84d3d]">Cancelación (Supresión):</span> Solicitar la eliminación de sus datos personales cuando hayan dejado de ser necesarios o cuando haya revocado su consentimiento.
                </div>
                <div className="rounded-lg border border-[#ded8ce] bg-white p-4">
                  <span className="font-extrabold text-[#d84d3d]">Oposición:</span> Oponerse al tratamiento de sus datos para fines específicos por motivos legítimos y fundados.
                </div>
              </div>
              <p className="section-copy text-base leading-7 mt-4">
                Para ejercer cualquiera de estos derechos, basta con enviar una solicitud formal por escrito con copia de su documento de identidad a{" "}
                <a href="mailto:rr@rubenrodriguezoficial.com" className="font-bold text-[#d84d3d] underline">
                  rr@rubenrodriguezoficial.com
                </a>. Atenderemos su solicitud dentro de los plazos legales establecidos por la normativa costarricense.
              </p>
            </section>

            {/* 9. Seguridad */}
            <section id="seguridad" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                9. Medidas de Seguridad y Retención de Datos
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                Aplicamos medidas de seguridad técnicas, organizativas y administrativas proporcionales al riesgo, tales como cifrado HTTPS/TLS en tránsito, control de accesos basados en roles, almacenamiento seguro en la nube y mecanismos de auditoría para mitigar accesos no autorizados, pérdidas o adulteraciones de información.
              </p>
              <p className="section-copy text-base leading-7 mt-3">
                Los datos se conservarán únicamente durante el tiempo estrictamente necesario para cumplir las finalidades descritas, durante el plazo de vigencia de la membresía activa o por los períodos exigidos por la legislación civil y penal costarricense en materia de prescripción de responsabilidades legales.
              </p>
            </section>

            {/* 10. Contacto */}
            <section id="contacto" className="scroll-mt-10 rounded-2xl border border-[#ded8ce] bg-[#142235] p-8 text-white">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-white flex items-center gap-2">
                <Mail size={22} className="text-[#ff9d8e]" />
                10. Contacto y Canal de Consultas de Privacidad
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#bdcbe1]">
                Si tiene cualquier inquietud, solicitud o reclamo respecto al manejo de su privacidad y sus datos personales, puede comunicarse formalmente a través de nuestros canales oficiales:
              </p>
              <div className="mt-5 space-y-2 text-sm text-[#e6eefc]">
                <p>
                  <strong>Correo electrónico oficial:</strong>{" "}
                  <a href="mailto:rr@rubenrodriguezoficial.com" className="text-[#ff9d8e] underline">
                    rr@rubenrodriguezoficial.com
                  </a>
                </p>
                <p>
                  <strong>Canal de WhatsApp Oficial:</strong>{" "}
                  <a href="https://wa.me/50670150301" target="_blank" rel="noreferrer" className="text-[#ff9d8e] underline">
                    +506 7015-0301
                  </a>
                </p>
                <p>
                  <strong>Jurisdicción:</strong> San José, República de Costa Rica.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-4 text-xs text-[#a9b9d1]">
                <Link href="/terminos" className="hover:text-white underline">
                  Ver Términos y Condiciones de Uso
                </Link>
                <span>·</span>
                <Link href="/cookies" className="hover:text-white underline">
                  Ver Política de Cookies
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
