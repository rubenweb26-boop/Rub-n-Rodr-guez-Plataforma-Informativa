import type { Metadata } from "next";
import Link from "next/link";
import {
  Scale,
  AlertOctagon,
  Bot,
  ShieldAlert,
  FileCheck2,
  DollarSign,
  Gavel,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Uso",
  description:
    "Términos y condiciones contractuales y de uso de la plataforma RubénWeb de Rubén Rodríguez en Costa Rica. Incluye cláusulas sobre Inteligencia Artificial, denuncias ciudadanas y deslinde de responsabilidad.",
};

export default function TermsPage() {
  const lastUpdated = "Noviembre 2026";

  return (
    <PageShell>
      <main className="bg-[#fcfaf7] py-16 sm:py-20">
        <div className="container-shell max-w-4xl">
          {/* Header */}
          <div className="border-b border-[#ded8ce] pb-10">
            <span className="eyebrow flex items-center gap-2">
              <Scale size={16} className="text-[#d84d3d]" />
              Contrato de Uso y Condiciones Vinculantes
            </span>
            <h1 className="headline-display mt-4 text-[clamp(2.5rem,5.5vw,4.2rem)] font-black leading-[1.02] tracking-[-0.05em] text-[#142235]">
              Términos y Condiciones de Uso
            </h1>
            <p className="mt-4 text-sm font-bold text-[#5d6875]">
              Última actualización: <span className="text-[#142235]">{lastUpdated}</span> · Legislación aplicable: República de Costa Rica
            </p>
            <div className="mt-6 rounded-2xl border-l-4 border-[#d84d3d] bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertOctagon size={24} className="mt-0.5 shrink-0 text-[#d84d3d]" />
                <div className="text-sm leading-relaxed text-[#24303e]">
                  <strong className="text-[#b74033] uppercase tracking-wide">Aviso legal imperativo:</strong> El acceso, navegación, registro, envío de denuncias o adquisición de membresías en este sitio web (en adelante, la &ldquo;Plataforma&rdquo; o &ldquo;RubénWeb&rdquo;) constituye la aceptación plena, libre, expresa y sin reservas de todos y cada uno de los presentes Términos y Condiciones. Si usted no está de acuerdo con estas disposiciones, debe abstenerse de utilizar la Plataforma de manera inmediata.
                </div>
              </div>
            </div>
          </div>

          {/* Quick nav */}
          <nav className="my-8 rounded-xl border border-[#ded8ce] bg-white p-5 text-sm">
            <p className="m-0 font-extrabold uppercase tracking-wider text-[#b74033] text-xs">Cláusulas del contrato</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 text-[#142235]">
              <a href="#objeto" className="hover:text-[#d84d3d] hover:underline">1. Objeto y naturaleza del servicio</a>
              <a href="#no-emergencias" className="hover:text-[#d84d3d] hover:underline">2. Deslinde categórico de emergencias (9-1-1)</a>
              <a href="#ia-disclaimer" className="hover:text-[#d84d3d] hover:underline">3. Cláusula de Inteligencia Artificial (IA)</a>
              <a href="#veracidad-denuncias" className="hover:text-[#d84d3d] hover:underline">4. Veracidad y responsabilidad penal</a>
              <a href="#indemnidad" className="hover:text-[#d84d3d] hover:underline">5. Exoneración e indemnidad total</a>
              <a href="#membresias" className="hover:text-[#d84d3d] hover:underline">6. Régimen de membresías y pagos</a>
              <a href="#anunciantes" className="hover:text-[#d84d3d] hover:underline">7. Vitrina comercial y terceros</a>
              <a href="#propiedad-intelectual" className="hover:text-[#d84d3d] hover:underline">8. Propiedad intelectual</a>
              <a href="#jurisdiccion" className="hover:text-[#d84d3d] hover:underline">9. Ley aplicable y tribunales</a>
            </div>
          </nav>

          {/* Main Content */}
          <div className="space-y-12 text-[#24303e]">
            {/* 1. Objeto */}
            <section id="objeto" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                1. Objeto y Naturaleza de la Plataforma
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                RubénWeb es una iniciativa civil y de comunicación digital independiente liderada por <strong>Rubén Rodríguez</strong> en Costa Rica. Su objetivo es fomentar la participación ciudadana, la visibilización de problemáticas de interés público (tales como bienestar animal, fiscalización comunitaria y situaciones de vulnerabilidad) y el periodismo de investigación social.
              </p>
              <p className="section-copy text-base leading-7 mt-3">
                La Plataforma opera como canal informativo y de articulación cívica, reservándose el derecho exclusivo de decidir, según criterios técnicos, de factibilidad y de relevancia periodística, cuáles denuncias o casos pueden ser objeto de investigación de campo, divulgación o coordinación ante las entidades estatales pertinentes.
              </p>
            </section>

            {/* 2. No emergencias */}
            <section id="no-emergencias" className="scroll-mt-10 rounded-2xl border-2 border-[#d84d3d]/30 bg-[#fff9f8] p-7">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#b74033] flex items-center gap-2">
                <ShieldAlert size={24} className="text-[#d84d3d]" />
                2. Deslinde Categórico de Servicios de Emergencia (NO sustituye al 9-1-1)
              </h2>
              <div className="editorial-rule my-3" />
              <p className="text-base font-bold text-[#142235] leading-relaxed">
                ESTA PLATAFORMA NO ES UN SERVICIO DE EMERGENCIAS, POLICIAL, JUDICIAL, NI UN AUXILIO DE SALUD PÚBLICA INMEDIATA.
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[#5a2420]">
                <li className="list-disc">
                  En casos de riesgo inminente a la vida, flagrancia de delitos graves, accidentes o emergencias que requieran atención inmediata, <strong>la persona usuaria tiene el deber ciudadano de acudir de forma directa a la línea 9-1-1</strong>, a la Fuerza Pública o al Organismo de Investigación Judicial (OIJ).
                </li>
                <li className="list-disc">
                  Rubén Rodríguez y su equipo <strong>no garantizan tiempos de respuesta instantáneos</strong>, no poseen potestades coercitivas del Estado ni ejercen funciones de policía judicial o administrativa.
                </li>
              </ul>
            </section>

            {/* 3. Cláusula de IA */}
            <section id="ia-disclaimer" className="scroll-mt-10 rounded-2xl border border-[#ded8ce] bg-white p-7 shadow-sm">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235] flex items-center gap-2">
                <Bot size={24} className="text-[#d84d3d]" />
                3. Cláusula Expresa sobre Inteligencia Artificial (IA) y Procesos Automatizados
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                En cumplimiento de las normativas de transparencia y lealtad con el usuario consumidor, se hace constar expresamente que:
              </p>
              <div className="mt-4 space-y-4 text-sm leading-6">
                <div className="rounded-xl border border-[#ded8ce] bg-[#fcfaf7] p-4">
                  <strong className="text-[#142235] block text-base mb-1">
                    A. Uso de IA Generativa y Algoritmos Auxiliares
                  </strong>
                  La Plataforma está construida, opera y se asiste mediante sistemas tecnológicos avanzados que incorporan <strong>Inteligencia Artificial (IA), modelos de lenguaje de gran escala (LLMs), agentes conversacionales automatizados (chatbots) y clasificadores semánticos</strong>. Estas herramientas se emplean para la clasificación preliminar de denuncias, categorización territorial, asistencia interactiva y apoyo en la redacción o análisis contextual.
                </div>

                <div className="rounded-xl border border-[#ded8ce] bg-[#fcfaf7] p-4">
                  <strong className="text-[#142235] block text-base mb-1">
                    B. Ausencia de Asesoría Legal o Dictamen Vinculante
                  </strong>
                  Ninguna respuesta, resumen, interacción o sugerencia generada por la Inteligencia Artificial o por los asistentes automatizados de la Plataforma constituye asesoramiento legal, jurídico, veterinario, médico o pericial formal. La información generada es meramente orientativa y de carácter auxiliar.
                </div>

                <div className="rounded-xl border border-[#ded8ce] bg-[#fcfaf7] p-4">
                  <strong className="text-[#142235] block text-base mb-1">
                    C. Limitación de Responsabilidad por Salidas de IA
                  </strong>
                  La persona usuaria reconoce y acepta que los modelos de Inteligencia Artificial pueden experimentar fallos técnicos involuntarios, imprecisiones contextuales o las denominadas &ldquo;alucinaciones algorítmicas&rdquo;. <strong>Rubén Rodríguez, la Plataforma y sus desarrolladores quedan exentos de cualquier tipo de responsabilidad civil, administrativa o penal</strong> derivada de errores, omisiones o interpretaciones de la información elaborada por sistemas automatizados.
                </div>
              </div>
            </section>

            {/* 4. Veracidad y responsabilidad penal */}
            <section id="veracidad-denuncias" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                4. Obligación de Veracidad, Buena Fe y Responsabilidad Penal del Denunciante
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                Al remitir cualquier reporte, denuncia o prueba documental a través de RubénWeb, la persona usuaria <strong>declara bajo la fe de juramento que los hechos expuestos son verídicos, exactos y fundamentados en su leal saber y entender</strong>.
              </p>
              <div className="mt-4 rounded-xl border border-[#ded8ce] bg-[#fffdf9] p-5 text-sm leading-6">
                <p className="font-bold text-[#b74033] mb-2">Advertencia Legal sobre Delitos contra el Honor:</p>
                <p className="text-[#404c5a]">
                  El suministro deliberado de información falsa, inventada, calumniosa o difamatoria constituye una conducta sancionable conforme a los artículos 145 y siguientes del <strong>Código Penal de la República de Costa Rica</strong> (delitos de difamación, injurias y calumnias), así como generadora de responsabilidad civil por daños y perjuicios.
                </p>
                <p className="mt-3 text-[#404c5a]">
                  La Plataforma colaborará plenamente con las autoridades judiciales y policiales de Costa Rica cuando sea formalmente requerida mediante orden judicial para la identificación y persecución de personas que hagan un uso ilícito o malintencionado del canal de denuncias.
                </p>
              </div>
            </section>

            {/* 5. Exoneración total e indemnidad */}
            <section id="indemnidad" className="scroll-mt-10 rounded-2xl border border-[#ded8ce] bg-white p-7">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235] flex items-center gap-2">
                <Gavel size={24} className="text-[#d84d3d]" />
                5. Exoneración Total de Responsabilidad y Cláusula de Indemnidad
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                <strong>Cláusula de Indemnidad:</strong> La persona usuaria se compromete formalmente a mantener indemne, defender y eximir de toda responsabilidad a <strong>Rubén Rodríguez</strong>, a la Plataforma RubénWeb, a sus desarrolladores técnicos, colaboradores, operadores y entidades aliadas frente a cualquier reclamo, demanda, denuncia, juicio, sanción administrativa, daño, pérdida, costo o gasto (incluyendo honorarios razonables de abogados) que surja como consecuencia de:
              </p>
              <ul className="mt-3 space-y-2 pl-5 text-sm leading-6 text-[#5d6875]">
                <li className="list-disc">El uso ilícito, abusivo o antirreglamentario de la Plataforma.</li>
                <li className="list-disc">La aportación de denuncias, testimonios o evidencias falsas, manipuladas o violatorias de derechos de autor o privacidad de terceros.</li>
                <li className="list-disc">Conflictos o disputas entre particulares derivados de las informaciones comunicadas.</li>
                <li className="list-disc">Interrupciones de servicio, ciberataques, caídas de red o fallas de proveedores en la nube ajenos a nuestro control razonable.</li>
              </ul>
            </section>

            {/* 6. Membresías y pagos */}
            <section id="membresias" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                6. Régimen de Membresías Ciudadanas y Pagos
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                La membresía voluntaria de <strong>₡3.500 al mes</strong> (o su equivalente autorizado) es una contribución ciudadana destinada al sostenimiento operativo, logístico y de producción de investigaciones independientes.
              </p>
              <ul className="mt-3 space-y-2 pl-5 text-sm leading-6">
                <li className="list-disc">
                  <strong>Renovación y cancelación:</strong> Las suscripciones se renuevan de forma automática mensualmente a través de las pasarelas oficiales autorizadas (ONVO Pay, Tilopay). La persona suscriptora puede cancelar la renovación automática en cualquier momento desde su panel de control o contactando a soporte, sin penalizaciones ni cláusulas de permanencia forzosa.
                </li>
                <li className="list-disc">
                  <strong>Política de no reembolsos:</strong> Los cobros efectivamente efectuados correspondientes al ciclo mensual ya devengado o en curso no son reembolsables, en virtud de que los recursos se destinan inmediatamente a las labores operativas descritas.
                </li>
                <li className="list-disc">
                  <strong>Seguridad de transacciones:</strong> Los pagos son procesados externamente bajo pasarelas con certificación bancaria PCI-DSS. RubénWeb nunca tiene acceso ni custodia números de tarjeta de crédito ni claves bancarias.
                </li>
              </ul>
            </section>

            {/* 7. Anunciantes */}
            <section id="anunciantes" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                7. Vitrina Comercial, Enlaces y Servicios de Terceros
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                La sección de vitrina comercial y anuncios permite a negocios locales y emprendimientos éticos dar a conocer sus productos. La Plataforma actúa únicamente como medio de difusión publicitaria. <strong>Rubén Rodríguez no comercializa directamente los productos de los anunciantes, no es intermediario en la compraventa ni asume responsabilidad por garantías, defectos, entregas o calidad</strong> de los bienes o servicios ofrecidos por dichos terceros, rigiéndose dichas relaciones bajo la Ley N° 7472 (Ley de Protección al Consumidor de Costa Rica) exclusivamente entre el comprador y el comercio anunciante.
              </p>
            </section>

            {/* 8. Propiedad intelectual */}
            <section id="propiedad-intelectual" className="scroll-mt-10">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-[#142235]">
                8. Propiedad Intelectual y Derechos Reservados
              </h2>
              <div className="editorial-rule my-3" />
              <p className="section-copy text-base leading-7">
                Todos los contenidos, reportajes, marcas comerciales, logotipos, piezas gráficas, arquitectura de software, videos documentales y código fuente de esta Plataforma son propiedad exclusiva de <strong>Rubén Rodríguez</strong> o de sus legítimos licenciantes, protegidos por la Ley de Derechos de Autor y Conexos de Costa Rica (Ley N° 6683) y convenios internacionales. Se prohíbe su reproducción comercial no autorizada.
              </p>
            </section>

            {/* 9. Ley aplicable */}
            <section id="jurisdiccion" className="scroll-mt-10 rounded-2xl border border-[#ded8ce] bg-[#142235] p-8 text-white">
              <h2 className="headline-display text-2xl font-black tracking-[-0.03em] text-white">
                9. Legislación Aplicable y Jurisdicción Competente
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#bdcbe1]">
                Los presentes Términos y Condiciones se regirán e interpretarán de conformidad con las leyes vigentes de la <strong>República de Costa Rica</strong>. Cualquier controversia, diferendo o reclamo que surja en relación con la validez, ejecución o rescisión de estos términos se someterá de manera privativa a la jurisdicción de los <strong>Tribunales Ordinarios de Justicia del Primer Circuito Judicial de San José, Costa Rica</strong>, renunciando las partes a cualquier otro fuero que pudiere corresponderles por razón de sus domicilios presentes o futuros.
              </p>
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-4 text-xs text-[#a9b9d1]">
                <Link href="/privacidad" className="hover:text-white underline">
                  Ver Política de Privacidad
                </Link>
                <span>·</span>
                <Link href="/cookies" className="hover:text-white underline">
                  Ver Política de Cookies
                </Link>
                <span>·</span>
                <Link href="/contacto" className="hover:text-white underline">
                  Canal de Contacto
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
