import Link from "next/link";
import { ArrowRight, Check, FileText, LockKeyhole, ShieldCheck } from "lucide-react";

const records = [
  ["01", "Reporte protegido", "Registro inicial con identificador único", "RECIBIDO"],
  ["02", "Revisión preliminar", "Acceso restringido para el equipo asignado", "ACTIVO"],
  ["03", "Seguimiento privado", "Consulta del avance desde tu espacio seguro", "CONTINÚA"],
] as const;

export function ConfidentialityArchive() {
  return (
    <section className="relative overflow-hidden bg-[#142235] py-16 text-[#f5f1eb] sm:py-20">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_84%_14%,#2e4d69_0,transparent_24%),radial-gradient(circle_at_8%_100%,#203d5d_0,transparent_30%)]" />
      <div className="container-shell relative grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
        <div className="max-w-[590px]">
          <span className="inline-flex items-center gap-2 border border-[#ffb9ae]/25 bg-white/5 px-3 py-1.5 text-xs font-black uppercase tracking-[.16em] text-[#ffb9ae]">
            <LockKeyhole size={14} /> Confidencialidad por diseño
          </span>
          <h2 className="headline-display mt-5 text-[clamp(3rem,5.4vw,5.3rem)] font-black leading-[.88] tracking-[-.065em] text-[#f5f1eb]">
            Cada denuncia merece una ruta visible.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#d8e0e8]">
            Desde el registro hasta el seguimiento, cada reporte se organiza en un proceso claro, privado y pensado para proteger a quien decide alzar la voz.
          </p>
          <div className="mt-7 flex items-center gap-3 text-sm font-bold text-[#e8e4de]">
            <span className="grid size-7 place-items-center rounded-full border border-white/20 bg-white/5 text-[#ffb9ae]">
              <Check size={15} strokeWidth={3} />
            </span>
            Sin publicación automática ni exposición innecesaria.
          </div>
          <Link href="/denuncias" className="btn-primary mt-8 inline-flex items-center gap-2 !border-[#d84d3d] !bg-[#d84d3d] !px-6">
            Presentar una denuncia <ArrowRight size={18} />
          </Link>
        </div>

        <div className="mx-auto w-full max-w-[600px]">
          <div className="mb-4 flex items-center gap-3 text-xs font-black uppercase tracking-[.16em] text-[#c9d2dc]">
            <span className="h-px w-16 bg-white/30" /> Trazabilidad privada
          </div>
          <div className="overflow-hidden rounded-[4px] border border-white/25 bg-[#f5f1eb] p-5 text-[#142235] shadow-[0_28px_60px_rgba(0,0,0,.34)] sm:p-8">
            <div className="flex flex-col gap-4 border-b border-[#d9d2c8] pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="m-0 text-xs font-black uppercase tracking-[.16em] text-[#6d6b66]">Expediente de seguimiento</p>
                <h3 className="headline-display mt-2 text-3xl font-black tracking-[-.045em]">Proceso confidencial</h3>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eab7ad] bg-[#f7dfda] px-3 py-1.5 text-[10px] font-black tracking-[.13em] text-[#a33b30]">
                <ShieldCheck size={13} /> EN REVISIÓN
              </span>
            </div>

            <div className="mt-2">
              {records.map(([number, title, description, status]) => (
                <div key={number} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[#e2ddd5] py-4 sm:gap-4">
                  <span className="grid size-8 place-items-center rounded-[3px] bg-[#142235] font-mono text-xs font-black text-[#f5f1eb]">
                    {number}
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 flex items-center gap-2 text-sm font-black text-[#202d3d] sm:text-base">
                      <FileText size={15} className="shrink-0 text-[#d84d3d]" /> {title}
                    </p>
                    <p className="mt-1 truncate font-mono text-[10px] font-medium uppercase tracking-[.06em] text-[#77716a] sm:text-[11px]">
                      {description}
                    </p>
                  </div>
                  <span className="hidden font-mono text-[10px] font-black tracking-[.08em] text-[#47624f] sm:block">
                    {status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 text-sm font-bold text-[#5d625d]">
              <span className="h-1 w-20 rounded-full bg-[#d84d3d]" />
              Una ruta clara para quien denuncia.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
