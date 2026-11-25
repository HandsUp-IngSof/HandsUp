import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, CalendarDays, Check, Lock, Play, RotateCcw, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { buscarModulo, type Modulo } from "@/paginas/estudiante/datosEjemplo";

type EstadoLeccion = "completada" | "siguiente" | "bloqueada";

// Las lecciones se desbloquean en orden: las terminadas, luego la siguiente, y el resto bloqueadas.
// (La regla real de bloqueo secuencial se implementa en SCRUM-37.)
function estadoLeccion(modulo: Modulo, indice: number): EstadoLeccion {
  if (modulo.estado === "bloqueado") return "bloqueada";
  if (indice < modulo.completadas) return "completada";
  if (indice === modulo.completadas) return "siguiente";
  return "bloqueada";
}

function FilaLeccion({ numero, titulo, estado }: { numero: number; titulo: string; estado: EstadoLeccion }) {
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
          estado === "bloqueada" && "bg-slate-100 text-slate-400",
        )}
      >
        {estado === "completada" ? <Check className="h-4 w-4" /> : estado === "bloqueada" ? <Lock className="h-3.5 w-3.5" /> : numero}
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn("text-xs", estado === "bloqueada" ? "text-slate-400" : "text-slate-500")}>Lección {numero}</p>
        <p className={cn("truncate font-semibold", estado === "bloqueada" ? "text-slate-400" : "text-slate-800")}>{titulo}</p>
      </div>

      {estado === "completada" && (
        <button
          type="button"
          title="Próximamente"
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[#14848D] hover:bg-[#E7F3F3]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Repasar</span>
        </button>
      )}
      {estado === "siguiente" && (
        <button
          type="button"
          title="Próximamente"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#14848D] px-3 py-2 text-xs font-bold text-white hover:bg-[#0F6E75]"
        >
          <Play className="h-3.5 w-3.5" />
          Empezar
        </button>
      )}
    </li>
  );
}

// Pagina de un modulo de la ruta de aprendizaje (SCRUM-58): resumen y lista de lecciones.
// Los datos son de ejemplo; las lecciones reales, sus videos y ejercicios llegan en el Sprint 3
// (SCRUM-36 lecciones, SCRUM-37 bloqueo, SCRUM-38 ejercicios, SCRUM-40 multimedia).
export function ModuloEstudiante() {
  const { codigo } = useParams();
  const modulo = buscarModulo(codigo);
  if (!modulo) return <Navigate to="/estudiante" replace />;

  const { icono: Icono, estado } = modulo;
  const total = modulo.lecciones.length;
  const porcentaje = Math.round((modulo.completadas / total) * 100);
  const enCurso = estado === "en_curso";
  const bloqueado = estado === "bloqueado";

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
              {modulo.etiqueta}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">{modulo.titulo}</h1>
            <p className="mt-1 text-sm text-slate-500">{modulo.descripcion}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <BookOpen className="h-3.5 w-3.5" />
              {total} lecciones
            </p>
          </div>
        </div>

        {!bloqueado && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                {modulo.completadas} de {total} lecciones completadas
              </span>
              <span className="font-bold text-[#14848D]">{porcentaje}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#14848D]" style={{ width: `${porcentaje}%` }} />
            </div>
          </div>
        )}
      </section>

      {bloqueado && (
        <section className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
          <Lock className="h-5 w-5 shrink-0 text-slate-500" />
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
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold text-slate-800">Lecciones</h2>
        <ol className="mt-3 space-y-2">
          {modulo.lecciones.map((titulo, indice) => (
            <FilaLeccion key={titulo} numero={indice + 1} titulo={titulo} estado={estadoLeccion(modulo, indice)} />
          ))}
        </ol>
      </section>

      <p className="flex items-center gap-2 rounded-2xl bg-[#FCE4EF] p-4 text-sm text-slate-700">
        <Sparkles className="h-4 w-4 shrink-0 text-[#B5246E]" />
        Muy pronto cada lección tendrá los videos de las señas y ejercicios para practicar.
      </p>
    </div>
  );
}
