import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Link2, Loader2, Plus } from "lucide-react";

import { usePerfil } from "@/componentes/RutaProtegida";
import { cn } from "@/lib/utils";
import {
  claveHora,
  lunesDeLaSemana,
  obtenerHorariosSemana,
  type HorarioSemana,
} from "@/paginas/docente/consultas";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie"];
// Horas que siempre se muestran; si el docente tiene horarios en otras horas, se agregan.
const HORAS_BASE = ["9:00", "10:00", "16:00"];
const formatoMes = new Intl.DateTimeFormat("es-CO", { month: "long" });

type EstadoBloque = "vacio" | "disponible" | "reservado";
interface Bloque {
  estado: EstadoBloque;
  estudiante?: string;
}

// Ej: "23–27 de noviembre, 2026" o "30 de noviembre – 4 de diciembre, 2026".
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

// "9:00" antes que "10:00" antes que "16:00".
function ordenarHoras(horas: string[]): string[] {
  const minutos = (h: string) => {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm;
  };
  return [...horas].sort((a, b) => minutos(a) - minutos(b));
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
      {bloque.estado === "reservado" && (bloque.estudiante ? `Clase · ${bloque.estudiante}` : "Reservado")}
    </div>
  );
}

// Disponibilidad semanal del docente con los horarios reales de Supabase (SCRUM-41).
// "Añadir horario" y "Guardar enlace" (SCRUM-43) se implementan en sus requisitos.
export function TarjetaDisponibilidad() {
  const perfil = usePerfil();
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [horarios, setHorarios] = useState<HorarioSemana[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enlace, setEnlace] = useState("");

  const lunes = lunesDeLaSemana(desplazamiento);
  const dias = DIAS.map((nombre, i) => ({
    nombre,
    fecha: new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i),
  }));

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
    obtenerHorariosSemana(perfil.id, lunesDeLaSemana(desplazamiento))
      .then((datos) => {
        if (!activo) return;
        setHorarios(datos);
        setCargando(false);
      })
      .catch((err: Error) => {
        if (!activo) return;
        setError(err.message);
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [perfil.id, desplazamiento]);

  const horas = ordenarHoras([...new Set([...HORAS_BASE, ...horarios.map((h) => claveHora(h.inicio))])]);

  const bloque = (fecha: Date, hora: string): Bloque => {
    const horario = horarios.find(
      (h) => h.inicio.toDateString() === fecha.toDateString() && claveHora(h.inicio) === hora,
    );
    if (!horario) return { estado: "vacio" };
    if (horario.estudiante) return { estado: "reservado", estudiante: horario.estudiante };
    return { estado: horario.disponible ? "disponible" : "reservado" };
  };

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
          {cargando && <Loader2 className="h-4 w-4 animate-spin text-[#14848D]" aria-label="Cargando horarios" />}
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

      {error ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : (
        <div className={cn("mt-4 overflow-x-auto transition-opacity", cargando && "opacity-50")}>
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

            {horas.map((hora) => (
              <div key={hora} className="contents">
                <div className="flex h-10 items-center text-xs text-slate-500">{hora}</div>
                {dias.map(({ nombre, fecha }) => (
                  <Celda key={nombre} bloque={bloque(fecha, hora)} />
                ))}
              </div>
            ))}
          </div>
          {!cargando && horarios.length === 0 && (
            <p className="mt-3 text-center text-xs text-slate-500">No tienes horarios registrados esta semana.</p>
          )}
        </div>
      )}

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
