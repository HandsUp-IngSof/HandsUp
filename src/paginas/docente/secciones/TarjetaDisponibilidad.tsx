import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";

import { usePerfil } from "@/componentes/RutaProtegida";
import { Ventana } from "@/componentes/UI/Ventana";
import { cn } from "@/lib/utils";
import {
  claveHora,
  crearHorario,
  eliminarHorario,
  lunesDeLaSemana,
  obtenerHorariosSemana,
  type HorarioSemana,
} from "@/paginas/docente/consultas";
import { SeccionEnlaceClase } from "@/paginas/docente/secciones/SeccionEnlaceClase";
import { VentanaNuevoHorario } from "@/paginas/docente/secciones/VentanaNuevoHorario";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie"];
// Horas que siempre se muestran; si el docente tiene horarios en otras horas, se agregan.
const HORAS_BASE = ["9:00", "10:00", "16:00"];
const MS_SEMANA = 7 * 86_400_000;

const formatoMes = new Intl.DateTimeFormat("es-CO", { month: "long" });
const formatoFechaHora = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});

type EstadoBloque = "vacio" | "disponible" | "reservado";
interface Bloque {
  estado: EstadoBloque;
  inicio: Date; // fecha y hora de la celda
  horarioId?: string;
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

// Fecha del dia con la hora de la fila ("16:00").
function conHora(fecha: Date, hora: string): Date {
  const [hh, mm] = hora.split(":").map(Number);
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), hh, mm);
}

// Cuantas semanas hay entre la semana actual y la semana de "fecha".
function semanasDesdeHoy(fecha: Date): number {
  const dia = (fecha.getDay() + 6) % 7;
  const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - dia);
  return Math.round((lunes.getTime() - lunesDeLaSemana(0).getTime()) / MS_SEMANA);
}

interface CeldaProps {
  bloque: Bloque;
  onAgregar: (inicio: Date) => void;
  onEliminar: (bloque: Bloque) => void;
}

function Celda({ bloque, onAgregar, onEliminar }: CeldaProps) {
  const futuro = bloque.inicio.getTime() > Date.now();

  if (bloque.estado === "reservado") {
    return (
      <div
        title={bloque.estudiante ? `Clase con ${bloque.estudiante}` : "Horario reservado"}
        className="flex h-10 items-center justify-center rounded-lg bg-[#FCE4EF] px-1 text-center text-[11px] font-semibold text-[#B5246E]"
      >
        {bloque.estudiante ? `Clase · ${bloque.estudiante}` : "Reservado"}
      </div>
    );
  }

  if (bloque.estado === "disponible") {
    return (
      <button
        type="button"
        disabled={!futuro}
        onClick={() => onEliminar(bloque)}
        title={futuro ? "Clic para eliminar este horario" : "Horario pasado"}
        className="group flex h-10 items-center justify-center rounded-lg bg-[#E3F3F0] px-1 text-center text-[11px] font-semibold text-[#14848D] transition-colors enabled:hover:bg-red-50 enabled:hover:text-red-600 disabled:cursor-default"
      >
        <span className={cn(futuro && "group-hover:hidden")}>Disponible</span>
        {futuro && <span className="hidden group-hover:inline">Eliminar</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!futuro}
      onClick={() => onAgregar(bloque.inicio)}
      title={futuro ? "Clic para añadir un horario aquí" : undefined}
      className="group flex h-10 items-center justify-center rounded-lg bg-slate-100 px-1 text-[11px] font-semibold text-slate-500 transition-colors enabled:hover:bg-[#E3F3F0] enabled:hover:text-[#14848D] disabled:cursor-default"
    >
      <span className={cn(futuro && "group-hover:hidden")}>—</span>
      {futuro && <Plus className="hidden h-4 w-4 group-hover:inline" />}
    </button>
  );
}

// Disponibilidad semanal del docente (SCRUM-41): ver, añadir y eliminar horarios en Supabase.
// Debajo va el enlace de videollamada (SCRUM-43).
export function TarjetaDisponibilidad() {
  const perfil = usePerfil();
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [horarios, setHorarios] = useState<HorarioSemana[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);

  // Ventana de nuevo horario
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [sugerencia, setSugerencia] = useState<Date | null>(null);

  // Confirmacion para eliminar
  const [porEliminar, setPorEliminar] = useState<Bloque | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

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
  }, [perfil.id, desplazamiento, recarga]);

  // El aviso de exito desaparece solo despues de unos segundos.
  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const horas = ordenarHoras([...new Set([...HORAS_BASE, ...horarios.map((h) => claveHora(h.inicio))])]);

  const bloque = (fecha: Date, hora: string): Bloque => {
    const inicio = conHora(fecha, hora);
    const horario = horarios.find(
      (h) => h.inicio.toDateString() === fecha.toDateString() && claveHora(h.inicio) === hora,
    );
    if (!horario) return { estado: "vacio", inicio };
    if (horario.estudiante) return { estado: "reservado", inicio, horarioId: horario.id, estudiante: horario.estudiante };
    return { estado: horario.disponible ? "disponible" : "reservado", inicio, horarioId: horario.id };
  };

  const abrirNuevo = useCallback((inicio: Date | null) => {
    setSugerencia(inicio);
    setNuevoAbierto(true);
  }, []);

  const cerrarNuevo = useCallback(() => setNuevoAbierto(false), []);

  const guardarHorario = async (inicio: Date, minutos: number) => {
    await crearHorario(perfil.id, inicio, minutos); // si falla, la ventana muestra el error
    setNuevoAbierto(false);
    setAviso(`Horario agregado: ${formatoFechaHora.format(inicio)}`);
    setDesplazamiento(semanasDesdeHoy(inicio)); // muestra la semana del horario nuevo
    setRecarga((n) => n + 1);
  };

  const cerrarEliminar = useCallback(() => {
    setPorEliminar(null);
    setErrorEliminar(null);
  }, []);

  const confirmarEliminar = async () => {
    if (!porEliminar?.horarioId) return;
    setEliminando(true);
    setErrorEliminar(null);
    try {
      await eliminarHorario(porEliminar.horarioId);
      setAviso(`Horario eliminado: ${formatoFechaHora.format(porEliminar.inicio)}`);
      setPorEliminar(null);
      setRecarga((n) => n + 1);
    } catch (err) {
      setErrorEliminar(err instanceof Error ? err.message : "No se pudo eliminar el horario.");
    } finally {
      setEliminando(false);
    }
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
          onClick={() => abrirNuevo(null)}
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

      {aviso && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-[#E3F3F0] p-3 text-sm text-[#0F6E75]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {aviso}
        </p>
      )}

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
                  <Celda
                    key={nombre}
                    bloque={bloque(fecha, hora)}
                    onAgregar={abrirNuevo}
                    onEliminar={setPorEliminar}
                  />
                ))}
              </div>
            ))}
          </div>
          {!cargando && horarios.length === 0 && (
            <p className="mt-3 text-center text-xs text-slate-500">No tienes horarios registrados esta semana.</p>
          )}
          <p className="mt-3 text-[11px] text-slate-500">
            Haz clic en un espacio vacío para añadir un horario, o en uno disponible para eliminarlo.
          </p>
        </div>
      )}

      <SeccionEnlaceClase />

      <VentanaNuevoHorario
        abierta={nuevoAbierto}
        sugerencia={sugerencia}
        onCerrar={cerrarNuevo}
        onGuardar={guardarHorario}
      />

      <Ventana titulo="Eliminar horario" abierta={porEliminar !== null} onCerrar={cerrarEliminar}>
        {porEliminar && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              ¿Quieres eliminar tu horario del <strong>{formatoFechaHora.format(porEliminar.inicio)}</strong>? Los
              estudiantes ya no podrán reservarlo.
            </p>
            {errorEliminar && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {errorEliminar}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cerrarEliminar}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {eliminando && <Loader2 className="h-4 w-4 animate-spin" />}
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        )}
      </Ventana>
    </section>
  );
}
