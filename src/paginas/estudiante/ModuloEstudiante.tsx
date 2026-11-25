import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, Lock, Play, RotateCcw, Trophy, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import { rutaModulo, type LeccionVista, type ModuloVista } from "@/paginas/estudiante/modelo";
import { ConDatos } from "@/paginas/estudiante/secciones/EstadoCarga";
import { VentanaLeccion } from "@/paginas/estudiante/secciones/VentanaLeccion";

interface FilaLeccionProps {
  leccion: LeccionVista;
  onAbrir: (leccion: LeccionVista) => void;
}

function FilaLeccion({ leccion, onAbrir }: FilaLeccionProps) {
  const { numero, titulo, estado } = leccion;
  const bloqueada = estado === "bloqueada";

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        estado === "siguiente" ? "border-[#14848D] bg-[#E3F3F0]" : "border-slate-200 bg-white",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          estado === "completada" && "bg-[#14848D] text-white",
          estado === "siguiente" && "bg-white text-[#14848D] ring-2 ring-[#14848D]",
          bloqueada && "bg-slate-100 text-slate-400",
        )}
      >
        {estado === "completada" ? <Check className="h-4 w-4" /> : bloqueada ? <Lock className="h-3.5 w-3.5" /> : numero}
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn("flex items-center gap-1.5 text-xs", bloqueada ? "text-slate-400" : "text-slate-500")}>
          Lección {numero}
          {leccion.videoUrl && <Video className="h-3 w-3" aria-label="Incluye video" />}
        </p>
        <p className={cn("truncate font-semibold", bloqueada ? "text-slate-400" : "text-slate-800")}>{titulo}</p>
      </div>

      {estado === "completada" && (
        <button
          type="button"
          onClick={() => onAbrir(leccion)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[#14848D] hover:bg-[#E7F3F3]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Repasar</span>
        </button>
      )}
      {estado === "siguiente" && (
        <button
          type="button"
          onClick={() => onAbrir(leccion)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#14848D] px-3 py-2 text-xs font-bold text-white hover:bg-[#0F6E75]"
        >
          <Play className="h-3.5 w-3.5" />
          Empezar
        </button>
      )}
      {bloqueada && <span className="shrink-0 text-[11px] text-slate-400">Completa la anterior</span>}
    </li>
  );
}

// Pagina de un modulo de la ruta de aprendizaje: resumen y lista de lecciones (SCRUM-33).
// Las lecciones se abren en orden y se marcan como completadas desde su ventana (SCRUM-34).
export function ModuloEstudiante() {
  const { moduloId } = useParams();

  return (
    <ConDatos>
      {(vista) => {
        const modulo = vista.modulos.find((m) => m.id === moduloId);
        // Si el modulo no existe (o ya no esta publicado), vuelve a la ruta.
        if (!modulo) return <Navigate to="/estudiante" replace />;
        return <ContenidoModulo modulo={modulo} />;
      }}
    </ConDatos>
  );
}

function ContenidoModulo({ modulo }: { modulo: ModuloVista }) {
  // Se guarda solo el id: asi la ventana siempre muestra el estado mas reciente de la leccion.
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  const abierta = modulo.lecciones.find((l) => l.id === abiertaId) ?? null;
  const siguiente = modulo.lecciones.find((l) => l.estado === "siguiente") ?? null;

  const { icono: Icono, estado, total, completadas } = modulo;
  const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
  const enCurso = estado === "en_curso";
  const bloqueado = estado === "bloqueado";
  const completado = estado === "completado";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/estudiante" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#14848D] hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a mi ruta
      </Link>

      <section
        className={cn(
          "rounded-2xl bg-white p-5 sm:p-6",
          enCurso ? "border-2 border-[#B5246E]/70" : "border border-slate-200",
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              bloqueado ? "bg-slate-100 text-slate-400" : enCurso ? "bg-[#FCE4EF] text-[#B5246E]" : "bg-[#E7F3F3] text-[#14848D]",
            )}
          >
            <Icono className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "flex items-center gap-1 text-[11px] font-bold tracking-wide",
                bloqueado ? "text-slate-500" : enCurso ? "text-[#B5246E]" : "text-[#14848D]",
              )}
            >
              {bloqueado && <Lock className="h-3 w-3" />}
              {completado && <Check className="h-3 w-3" />}
              {modulo.etiqueta}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">{modulo.titulo}</h1>
            {modulo.descripcion && <p className="mt-1 text-sm text-slate-500">{modulo.descripcion}</p>}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <BookOpen className="h-3.5 w-3.5" />
              {total} {total === 1 ? "lección" : "lecciones"}
            </p>
          </div>
        </div>

        {!bloqueado && total > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                {completadas} de {total} lecciones completadas
              </span>
              <span className="font-bold text-[#14848D]">{porcentaje}%</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={porcentaje}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso de ${modulo.titulo}`}
            >
              <div className="h-full rounded-full bg-[#14848D]" style={{ width: `${porcentaje}%` }} />
            </div>
          </div>
        )}
      </section>

      {bloqueado && (
        <section className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
          <Lock className="h-5 w-5 shrink-0 text-slate-500" />
          {modulo.motivoBloqueo === "anterior" && modulo.bloqueadoPor ? (
            <>
              {/* Desbloqueo secuencial entre modulos (SCRUM-37) */}
              <p className="flex-1 text-sm text-slate-600">
                Este módulo se desbloquea cuando completes <strong>{modulo.bloqueadoPor.titulo}</strong>. Así aprendes
                paso a paso.
              </p>
              <Link
                to={rutaModulo(modulo.bloqueadoPor.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#14848D] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F6E75]"
              >
                <ArrowRight className="h-4 w-4" />
                Ir a ese módulo
              </Link>
            </>
          ) : (
            <>
              <p className="flex-1 text-sm text-slate-600">
                Este módulo se habilita después de tu <strong>clase de bienvenida</strong> en vivo con tu docente.
              </p>
              <Link
                to="/estudiante/clases"
                className="inline-flex items-center gap-2 rounded-xl bg-[#14848D] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F6E75]"
              >
                <CalendarDays className="h-4 w-4" />
                Ver mis clases
              </Link>
            </>
          )}
        </section>
      )}

      {completado && (
        <p className="flex items-center gap-2 rounded-2xl bg-[#FCE4EF] p-4 text-sm text-slate-700">
          <Trophy className="h-4 w-4 shrink-0 text-[#B5246E]" />
          ¡Completaste este módulo! Puedes repasar cualquier lección cuando quieras.
        </p>
      )}

      <section>
        <h2 className="text-lg font-bold text-slate-800">Lecciones</h2>
        {modulo.lecciones.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Tu docente aún no ha publicado lecciones en este módulo.
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {modulo.lecciones.map((leccion) => (
              <FilaLeccion key={leccion.id} leccion={leccion} onAbrir={(l) => setAbiertaId(l.id)} />
            ))}
          </ol>
        )}
      </section>

      <VentanaLeccion
        leccion={abierta}
        siguiente={siguiente && siguiente.id !== abierta?.id ? siguiente : null}
        onCerrar={() => setAbiertaId(null)}
        onIrASiguiente={() => setAbiertaId(siguiente?.id ?? null)}
      />
    </div>
  );
}
