import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Link2, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { disponibilidadEjemplo, HORAS_EJEMPLO, type Bloque } from "@/paginas/docente/datosEjemplo";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie"];
const formatoMes = new Intl.DateTimeFormat("es-CO", { month: "long" });

// Lunes de la semana actual, movido "desplazamiento" semanas hacia adelante o atras.
function lunesDeLaSemana(desplazamiento: number): Date {
  const hoy = new Date();
  const diaSemana = (hoy.getDay() + 6) % 7; // 0 = lunes ... 6 = domingo
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diaSemana + desplazamiento * 7);
  return lunes;
}

// Ej: "19–23 de octubre, 2026" o "30 de noviembre – 4 de diciembre, 2026".
function rangoSemana(lunes: Date): string {
  const viernes = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 4);
  const mesLunes = formatoMes.format(lunes);
  const mesViernes = formatoMes.format(viernes);
  if (mesLunes === mesViernes) {
    return `${lunes.getDate()}–${viernes.getDate()} de ${mesViernes}, ${viernes.getFullYear()}`;
  }
  return `${lunes.getDate()} de ${mesLunes} – ${viernes.getDate()} de ${mesViernes}, ${viernes.getFullYear()}`;
}

function esHoy(fecha: Date): boolean {
  return fecha.toDateString() === new Date().toDateString();
}

function Celda({ bloque }: { bloque: Bloque }) {
  return (
    <div
      className={cn(
        "flex h-10 items-center justify-center rounded-lg px-1 text-center text-[11px] font-semibold",
        bloque.estado === "vacio" && "bg-slate-100 text-slate-400",
        bloque.estado === "disponible" && "bg-[#E3F3F0] text-[#14848D]",
        bloque.estado === "reservado" && "bg-[#FCE4EF] text-[#B5246E]",
      )}
    >
      {bloque.estado === "vacio" && "—"}
      {bloque.estado === "disponible" && "Disponible"}
      {bloque.estado === "reservado" && `Clase · ${bloque.estudiante}`}
    </div>
  );
}

// Disponibilidad semanal del docente y enlace de la clase virtual.
// Datos de ejemplo hasta implementar SCRUM-41 (horarios) y SCRUM-43 (enlace).
export function TarjetaDisponibilidad() {
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [enlace, setEnlace] = useState("");

  const lunes = lunesDeLaSemana(desplazamiento);
  const dias = DIAS.map((nombre, i) => {
    const fecha = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i);
    return { nombre, fecha };
  });

  // El ejemplo solo se muestra en la semana actual; las demas aparecen vacias.
  const bloques = (fila: number, columna: number): Bloque =>
    desplazamiento === 0 ? disponibilidadEjemplo[fila][columna] : { estado: "vacio" };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Tu disponibilidad</h2>
          <p className="text-xs text-slate-500">Hora de Colombia · GMT-5</p>
        </div>
        <button
          type="button"
          title="Próximamente"
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          Añadir horario
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDesplazamiento((d) => d - 1)}
            className="rounded-lg p-1 text-slate-600 hover:bg-slate-100"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-slate-700">{rangoSemana(lunes)}</span>
          <button
            type="button"
            onClick={() => setDesplazamiento((d) => d + 1)}
            className="rounded-lg p-1 text-slate-600 hover:bg-slate-100"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#14848D]" /> Disponible
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#B5246E]" /> Reservado
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="grid min-w-[520px] grid-cols-[48px_repeat(5,minmax(0,1fr))] gap-2">
          <div />
          {dias.map(({ nombre, fecha }) => (
            <div
              key={nombre}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-xs font-bold",
                esHoy(fecha) ? "bg-[#14848D] text-white" : "bg-slate-100 text-slate-600",
              )}
            >
              {nombre} {fecha.getDate()}
            </div>
          ))}

          {HORAS_EJEMPLO.map((hora, fila) => (
            <div key={hora} className="contents">
              <div className="flex h-10 items-center text-xs text-slate-500">{hora}</div>
              {dias.map((_, columna) => (
                <Celda key={columna} bloque={bloques(fila, columna)} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <label htmlFor="enlace-clase" className="text-sm font-bold text-slate-700">
          Enlace de clase
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14848D]" />
            <input
              id="enlace-clase"
              type="url"
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              placeholder="meet.google.com/tu-clase-lsc"
              className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#14848D]"
            />
          </div>
          <button
            type="button"
            title="Próximamente"
            className="h-11 rounded-xl bg-[#14848D] px-5 text-sm font-bold text-white hover:bg-[#0F6E75]"
          >
            Guardar enlace
          </button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#14848D]" />
          Tus estudiantes verán este enlace en sus clases reservadas.
        </p>
      </div>
    </section>
  );
}
