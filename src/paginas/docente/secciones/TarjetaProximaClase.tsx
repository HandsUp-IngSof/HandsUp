import { Video } from "lucide-react";

import { proximaClaseEjemplo } from "@/paginas/docente/datosEjemplo";

// Proxima clase agendada. Datos de ejemplo hasta implementar su requisito.
export function TarjetaProximaClase() {
  const clase = proximaClaseEjemplo;

  return (
    <section className="rounded-2xl bg-[#E3F3F0] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F6E75]">Tu próxima clase</p>
        <Video className="h-5 w-5 text-[#14848D]" />
      </div>
      <h3 className="mt-3 text-xl font-bold text-slate-800">{clase.titulo}</h3>
      <p className="mt-2 text-sm text-slate-600">{clase.fecha}</p>
      <p className="text-sm text-slate-600">{clase.horario}</p>
      <button
        type="button"
        title="Próximamente"
        className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-[#14848D] shadow-sm hover:bg-slate-50"
      >
        Ver preparación de clase
      </button>
      <p className="mt-3 text-xs text-[#0F6E75]">{clase.nota}</p>
    </section>
  );
}
