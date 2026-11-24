import { ExternalLink, Link2, Loader2, Video } from "lucide-react";

import { usePerfil } from "@/componentes/RutaProtegida";
import type { ProximaClase } from "@/paginas/docente/resumenDocente";

interface TarjetaProximaClaseProps {
  clase: ProximaClase | null;
  cargando: boolean;
}

// Lleva al campo "Enlace de clase" de la tarjeta de disponibilidad.
function irAlCampoEnlace() {
  const campo = document.getElementById("enlace-clase");
  if (!campo) return;
  campo.scrollIntoView({ behavior: "smooth", block: "center" });
  campo.focus({ preventScroll: true });
}

// Proxima clase agendada del docente, tomada de la tabla reuniones.
// Con el enlace guardado (SCRUM-43) muestra el boton para entrar a la videollamada.
export function TarjetaProximaClase({ clase, cargando }: TarjetaProximaClaseProps) {
  const { enlace_clase: enlace } = usePerfil();

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

          {enlace && (
            <a
              href={enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#14848D] py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0F6E75]"
            >
              <Video className="h-4 w-4" />
              Entrar a la clase
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            title="Próximamente"
            className="mt-2 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-[#14848D] shadow-sm hover:bg-slate-50"
          >
            Ver preparación de clase
          </button>
          {enlace === null && (
            <button
              type="button"
              onClick={irAlCampoEnlace}
              className="mt-3 flex items-center gap-1.5 text-left text-xs font-semibold text-[#B5246E] hover:underline"
            >
              <Link2 className="h-3.5 w-3.5 shrink-0" />
              Agrega tu enlace de clase para que tus estudiantes puedan entrar.
            </button>
          )}
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
