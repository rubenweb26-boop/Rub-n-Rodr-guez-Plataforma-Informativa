"use client";

import { useState } from "react";
import { Check, CircleDollarSign, ShieldAlert } from "lucide-react";

export function CurrencySwitcher() {
  const [currency, setCurrency] = useState<"USD" | "CRC">("USD");
  const price = currency === "USD" ? "$7" : "₡3.500";

  return (
    <div className="surface mx-auto max-w-[430px] overflow-hidden p-7 sm:p-9">
      <div className="flex items-center justify-between gap-4">
        <span className="status-pill"><CircleDollarSign size={14} /> Propuesta inicial</span>
        <div className="flex rounded-xl bg-[#eef3fa] p-1" aria-label="Seleccionar moneda">
          {(["USD", "CRC"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setCurrency(item)} aria-pressed={currency === item} className={`rounded-lg px-3 py-2 text-xs font-black ${currency === item ? "bg-white text-[#0759e6] shadow-sm" : "text-[#69758a]"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-0 mt-7 text-6xl font-black tracking-[-0.07em]">{price}<span className="ml-2 text-base font-bold text-[#6b7688]">/ mes</span></p>
      <p className="mt-3 text-sm leading-6 text-[#667287]">El precio se seleccionará por moneda en el panel administrativo. No se aplica conversión automática entre USD y CRC.</p>
      <ul className="my-7 grid gap-3 p-0 text-sm font-bold">
        {["Videos completos", "Seguimiento de aportes enviados", "Archivo premium", "Notificaciones editoriales"].map((item) => <li key={item} className="flex items-center gap-2"><Check size={17} className="text-[#0759e6]" /> {item}</li>)}
      </ul>
      <button disabled type="button" className="btn-primary w-full">Checkout en configuración</button>
      <p className="mt-4 flex gap-2 rounded-xl bg-[#fff7e8] p-3 text-xs leading-5 text-[#795500]"><ShieldAlert className="mt-0.5 shrink-0" size={16} /> No se solicitarán datos de tarjeta hasta validar ONVO en ambiente de pruebas y configurar webhooks.</p>
    </div>
  );
}
