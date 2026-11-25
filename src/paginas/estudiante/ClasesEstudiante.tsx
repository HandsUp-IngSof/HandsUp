import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CalendarPlus, CheckCircle2, Loader2, Video, X } from "lucide-react";

import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";
import { Avatar } from "@/componentes/UI/Avatar";
import { Ventana } from "@/componentes/UI/Ventana";
import { cn } from "@/lib/utils";
import { useDatosEstudiante } from "@/paginas/estudiante/DatosEstudiante";
import {
  agendarClase,
  cancelarClase,
  obtenerHorariosLibres,
  type HorarioLibre,
} from "@/paginas/estudiante/consultas";
import type { ClaseBD, VistaEstudiante } from "@/paginas/estudiante/modelo";
import { ConDatos } from "@/paginas/estudiante/secciones/EstadoCarga";
import { diaClase, horarioClase } from "@/paginas/estudiante/secciones/TarjetasLaterales";

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  pendiente: { texto: "Por confirmar", clase: "bg-amber-100 text-amber-800" },
  confirmada: { texto: "Confirmada", clase: "bg-[#E3F3F0] text-[#14848D]" },
  completada: { texto: "Completada", clase: "bg-slate-100 text-slate-600" },
  cancelada: { texto: "Cancelada", clase: "bg-red-50 text-red-600" },
};

function Estado({ estado }: { estado: string }) {
  const { texto, clase } = ESTADOS[estado] ?? { texto: estado, clase: "bg-slate-100 text-slate-600" };
  return <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", clase)}>{texto}</span>;
}

function FilaClase({ clase, onCancelar }: { clase: ClaseBD; onCancelar?: (clase: ClaseBD) => void }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <Avatar nombre={clase.docente} url={clase.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800">{diaClase(clase.inicio)}</p>
        <p className="text-xs text-slate-500">
          {horarioClase(clase)} · con {clase.docente}
        </p>
      </div>
      <Estado estado={clase.estado} />
      {onCancelar && (
        <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          {clase.enlace && (
            <a
              href={clase.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-[#14848D] px-3 py-2 text-xs font-bold text-white hover:bg-[#0F6E75]"
            >
              <Video className="h-3.5 w-3.5" />
              Unirme
            </a>
          )}
          <button
            type="button"
            onClick={() => onCancelar(clase)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
        </div>
      )}
    </li>
  );
}

// Horarios libres agrupados por dia: { "Lunes 23 de noviembre": [horario, ...] }
function agruparPorDia(horarios: HorarioLibre[]): [string, HorarioLibre[]][] {
  const grupos = new Map<string, HorarioLibre[]>();
  for (const horario of horarios) {
    const dia = diaClase(horario.inicio);
    grupos.set(dia, [...(grupos.get(dia) ?? []), horario]);
  }
  return [...grupos.entries()];
}

// "Mis clases" (SCRUM-39): el estudiante ve sus clases, reserva horarios libres de los docentes
// y cancela las que ya no pueda tomar.
export function ClasesEstudiante() {
  return (
    <div className="mx-auto max-w-4xl">
      <EncabezadoSeccion
        titulo="Mis clases"
        descripcion="Reserva tus clases en vivo y revisa las que tienes agendadas."
      />
      <ConDatos>{(vista) => <ContenidoClases vista={vista} />}</ConDatos>
    </div>
  );
}

function ContenidoClases({ vista }: { vista: VistaEstudiante }) {
  const { recargar } = useDatosEstudiante();

  const [horarios, setHorarios] = useState<HorarioLibre[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docenteFiltro, setDocenteFiltro] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  // Reserva
  const [porReservar, setPorReservar] = useState<HorarioLibre | null>(null);
  const [reservando, setReservando] = useState(false);
  const [errorReserva, setErrorReserva] = useState<string | null>(null);

  // Cancelacion
  const [porCancelar, setPorCancelar] = useState<ClaseBD | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelar, setErrorCancelar] = useState<string | null>(null);

  const cargarHorarios = useCallback(async () => {
    try {
      setHorarios(await obtenerHorariosLibres());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los horarios.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarHorarios();
  }, [cargarHorarios]);

  // Docentes que tienen horarios libres, para el filtro.
  const docentes = useMemo(() => {
    const mapa = new Map<string, string>();
    horarios.forEach((h) => mapa.set(h.docenteId, h.docente));
    return [...mapa.entries()];
  }, [horarios]);

  const visibles = docenteFiltro ? horarios.filter((h) => h.docenteId === docenteFiltro) : horarios;
  const grupos = agruparPorDia(visibles);

  const cerrarReserva = useCallback(() => {
    setPorReservar(null);
    setErrorReserva(null);
  }, []);
  const cerrarCancelar = useCallback(() => {
    setPorCancelar(null);
    setErrorCancelar(null);
  }, []);

  const confirmarReserva = async () => {
    if (!porReservar) return;
    setReservando(true);
    setErrorReserva(null);
    try {
      await agendarClase(porReservar.id);
      const fecha = `${diaClase(porReservar.inicio)}, ${horarioClase(porReservar)}`;
      cerrarReserva();
      setAviso(`¡Listo! Agendaste tu clase con ${porReservar.docente} para el ${fecha}.`);
      await Promise.all([recargar(), cargarHorarios()]);
    } catch (err) {
      setErrorReserva(err instanceof Error ? err.message : "No se pudo agendar la clase.");
      void cargarHorarios(); // por si otra persona reservo ese horario
    } finally {
      setReservando(false);
    }
  };

  const confirmarCancelacion = async () => {
    if (!porCancelar) return;
    setCancelando(true);
    setErrorCancelar(null);
    try {
      await cancelarClase(porCancelar.id);
      cerrarCancelar();
      setAviso("Tu clase fue cancelada. El horario quedó libre de nuevo.");
      await Promise.all([recargar(), cargarHorarios()]);
    } catch (err) {
      setErrorCancelar(err instanceof Error ? err.message : "No se pudo cancelar la clase.");
    } finally {
      setCancelando(false);
    }
  };

  return (
    <div className="space-y-8">
      {aviso && (
        <p role="status" className="flex items-start gap-2 rounded-xl bg-[#E3F3F0] p-3 text-sm text-[#0F6E75]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{aviso}</span>
          <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            <X className="h-4 w-4" />
          </button>
        </p>
      )}

      {!vista.bienvenidaCumplida && (
        <p className="flex items-start gap-2 rounded-2xl bg-[#FCE4EF] p-4 text-sm text-slate-700">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#B5246E]" />
          Agenda tu <strong className="mx-1">clase de bienvenida</strong> con un docente. Cuando termine, se habilitan
          tus módulos de conversación en vivo.
        </p>
      )}

      <section>
        <h2 className="text-lg font-bold text-slate-800">Mis clases agendadas</h2>
        {vista.clasesProximas.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No tienes clases próximas. Elige un horario aquí abajo.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {vista.clasesProximas.map((clase) => (
              <FilaClase key={clase.id} clase={clase} onCancelar={setPorCancelar} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Reservar una clase</h2>
            <p className="text-xs text-slate-500">Horarios libres de los próximos 30 días · Hora de Colombia</p>
          </div>
          {docentes.length > 1 && (
            <label className="text-xs font-semibold text-slate-600">
              Docente
              <select
                value={docenteFiltro}
                onChange={(e) => setDocenteFiltro(e.target.value)}
                className="ml-2 h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none focus:border-[#14848D]"
              >
                <option value="">Todos</option>
                {docentes.map(([id, nombre]) => (
                  <option key={id} value={id}>
                    {nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {cargando ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#14848D]" />
            Buscando horarios...
          </div>
        ) : error ? (
          <p role="alert" className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : grupos.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Por ahora no hay horarios libres. Vuelve a revisar más tarde: los docentes los publican cada semana.
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {grupos.map(([dia, lista]) => (
              <div key={dia} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-bold text-slate-800">{dia}</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {lista.map((horario) => (
                    <li key={horario.id}>
                      <button
                        type="button"
                        onClick={() => setPorReservar(horario)}
                        className="group flex w-full items-center gap-3 rounded-xl bg-[#E3F3F0] px-3 py-2.5 text-left transition-colors hover:bg-[#D3ECE8]"
                      >
                        <Avatar nombre={horario.docente} url={horario.avatarUrl} tamano="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-[#0F6E75]">{horarioClase(horario)}</span>
                          <span className="block truncate text-xs text-slate-600">{horario.docente}</span>
                        </span>
                        <CalendarPlus className="h-4 w-4 shrink-0 text-[#14848D]" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {vista.clasesPasadas.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-800">Historial</h2>
          <ul className="mt-3 space-y-2">
            {vista.clasesPasadas.map((clase) => (
              <FilaClase key={clase.id} clase={clase} />
            ))}
          </ul>
        </section>
      )}

      <Ventana titulo="Confirmar clase" abierta={porReservar !== null} onCerrar={cerrarReserva}>
        {porReservar && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar nombre={porReservar.docente} url={porReservar.avatarUrl} tamano="lg" />
              <div>
                <p className="font-bold text-slate-800">{porReservar.docente}</p>
                <p className="text-xs text-slate-500">Docente de LSC</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-800">{diaClase(porReservar.inicio)}</p>
              <p className="text-xs text-slate-500">{horarioClase(porReservar)} · Hora de Colombia</p>
            </div>
            <p className="text-xs text-slate-500">
              Tu docente verá la reserva y la confirmará. Puedes cancelarla antes de que empiece.
            </p>
            {errorReserva && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {errorReserva}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cerrarReserva}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => void confirmarReserva()}
                disabled={reservando}
                className="flex items-center gap-2 rounded-xl bg-[#14848D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F6E75] disabled:opacity-60"
              >
                {reservando && <Loader2 className="h-4 w-4 animate-spin" />}
                {reservando ? "Reservando..." : "Reservar clase"}
              </button>
            </div>
          </div>
        )}
      </Ventana>

      <Ventana titulo="Cancelar clase" abierta={porCancelar !== null} onCerrar={cerrarCancelar}>
        {porCancelar && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              ¿Seguro que quieres cancelar tu clase del <strong>{diaClase(porCancelar.inicio)}</strong>,{" "}
              {horarioClase(porCancelar)}, con {porCancelar.docente}?
            </p>
            {errorCancelar && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {errorCancelar}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cerrarCancelar}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                No, mantenerla
              </button>
              <button
                type="button"
                onClick={() => void confirmarCancelacion()}
                disabled={cancelando}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelando && <Loader2 className="h-4 w-4 animate-spin" />}
                {cancelando ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        )}
      </Ventana>
    </div>
  );
}
