import { Loader2, Video } from "lucide-react";

import type { ProximaClase } from "@/paginas/docente/resumenDocente";

interface TarjetaProximaClaseProps {
  clase: ProximaClase | null;
  cargando: boolean;
}

// Proxima clase agendada del docente, tomada de la tabla reuniones.
export function TarjetaProximaClase({ clase, cargando }: TarjetaProximaClaseProps) {
  return (
    <section className="rounded-2xl bg-[#E3F3F0] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F6E75]">Tu próxima clase</p>
        <Video className="h-5 w-5 text-[#14848D]" />
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 py-8 text-sm text-[#0F6E75]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Buscando tu próxima clase...
        </div>
      ) : clase ? (
        <>
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
          {clase.nota && <p className="mt-3 text-xs text-[#0F6E75]">{clase.nota}</p>}
        </>
      ) : (
        <>
          <h3 className="mt-3 text-lg font-bold text-slate-800">No tienes clases agendadas</h3>
          <p className="mt-1 text-sm text-slate-600">
            Cuando un estudiante reserve uno de tus horarios, aparecerá aquí.
          </p>
        </>
      )}
    </section>
  );
}
