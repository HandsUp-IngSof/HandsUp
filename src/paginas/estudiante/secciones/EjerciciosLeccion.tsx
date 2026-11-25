import { useState } from "react";
import { AlertCircle, CheckCircle2, ListChecks, Loader2, RotateCcw, XCircle } from "lucide-react";

import { calificarLeccion, NOTA_MINIMA, type EjercicioEstudiante, type ResultadoCalificacion } from "@/lib/ejercicios";
import { cn } from "@/lib/utils";

interface EjerciciosLeccionProps {
  leccionId: string;
  ejercicios: EjercicioEstudiante[];
  // "evaluar": al aprobar se completa la leccion. "practicar": la leccion ya estaba completada.
  modo: "evaluar" | "practicar";
  onAprobado?: () => Promise<void>;
}

const LETRAS = ["A", "B", "C", "D"];

// Ejercicios interactivos de una leccion con calificacion automatica (SCRUM-38).
// Supabase califica: el navegador del estudiante nunca recibe las respuestas antes de calificar.
export function EjerciciosLeccion({ leccionId, ejercicios, modo, onAprobado }: EjerciciosLeccionProps) {
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [resultado, setResultado] = useState<ResultadoCalificacion | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const respondidas = ejercicios.filter((e) => respuestas[e.id] !== undefined).length;
  const completas = respondidas === ejercicios.length;

  const calificar = async () => {
    if (!completas) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await calificarLeccion(leccionId, respuestas);
      setResultado(r);
      if (r.aprobado && modo === "evaluar" && onAprobado) await onAprobado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron calificar tus respuestas.");
    } finally {
      setEnviando(false);
    }
  };

  const reintentar = () => {
    setRespuestas({});
    setResultado(null);
    setError(null);
  };

  const detalleDe = (id: string) => resultado?.detalle.find((d) => d.ejercicioId === id);

  return (
    <section className="rounded-xl border border-slate-200 p-4" aria-labelledby="titulo-ejercicios">
      <h4 id="titulo-ejercicios" className="flex items-center gap-2 font-bold text-slate-800">
        <ListChecks className="h-4 w-4 text-[#B5246E]" />
        {modo === "evaluar" ? "Ejercicios para completar la lección" : "Practica los ejercicios"}
      </h4>
      <p className="mt-0.5 text-xs text-slate-500">
        {modo === "evaluar"
          ? `Responde todas las preguntas. Necesitas ${NOTA_MINIMA}% o más para completar la lección.`
          : "Ya completaste esta lección. Puedes practicar las veces que quieras."}
      </p>

      <ol className="mt-4 space-y-4">
        {ejercicios.map((ejercicio, i) => {
          const detalle = detalleDe(ejercicio.id);
          return (
            <li key={ejercicio.id}>
              <fieldset disabled={resultado !== null || enviando}>
                <legend className="flex items-start gap-2 text-sm font-semibold text-slate-800">
                  <span>
                    {i + 1}. {ejercicio.pregunta}
                  </span>
                  {detalle &&
                    (detalle.correcta ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#14848D]" aria-label="Respuesta correcta" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-label="Respuesta incorrecta" />
                    ))}
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {ejercicio.opciones.map((opcion, j) => {
                    const elegida = respuestas[ejercicio.id] === j;
                    const esCorrecta = detalle?.respuestaCorrecta === j;
                    return (
                      <label
                        key={j}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#14848D]",
                          resultado
                            ? esCorrecta
                              ? "border-[#14848D] bg-[#E3F3F0] font-semibold text-[#0F6E75]"
                              : elegida && detalle && !detalle.correcta
                                ? "border-red-300 bg-red-50 text-red-700"
                                : "border-slate-200 text-slate-600"
                            : elegida
                              ? "border-[#14848D] bg-[#E3F3F0] font-semibold text-[#0F6E75]"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50",
                          (resultado || enviando) && "cursor-default",
                        )}
                      >
                        <input
                          type="radio"
                          name={`ejercicio-${ejercicio.id}`}
                          checked={elegida}
                          onChange={() => setRespuestas((r) => ({ ...r, [ejercicio.id]: j }))}
                          className="h-4 w-4 shrink-0 accent-[#14848D]"
                        />
                        <span className="font-bold">{LETRAS[j]}.</span>
                        <span className="min-w-0 flex-1">{opcion}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {resultado ? (
        <div
          role="status"
          className={cn(
            "mt-4 flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center",
            resultado.aprobado ? "bg-[#E3F3F0]" : "bg-amber-50",
          )}
        >
          <div className="flex-1">
            <p className={cn("text-lg font-bold", resultado.aprobado ? "text-[#0F6E75]" : "text-amber-800")}>
              {resultado.puntaje}% · {resultado.correctas} de {resultado.total} correctas
            </p>
            <p className="text-sm text-slate-700">
              {resultado.aprobado
                ? modo === "evaluar"
                  ? "¡Aprobaste! La lección quedó completada."
                  : "¡Muy bien! Sigues dominando esta lección."
                : `Necesitas ${resultado.minimo}% para aprobar. Repasa el video y el contenido e inténtalo de nuevo.`}
            </p>
          </div>
          {(!resultado.aprobado || modo === "practicar") && (
            <button
              type="button"
              onClick={reintentar}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Intentar de nuevo
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          <span className="mr-auto text-xs text-slate-500">
            {respondidas} de {ejercicios.length} respondidas
          </span>
          <button
            type="button"
            onClick={() => void calificar()}
            disabled={!completas || enviando}
            className="flex items-center gap-2 rounded-xl bg-[#B5246E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#9A1F5E] disabled:opacity-50"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {enviando ? "Calificando..." : "Calificar mis respuestas"}
          </button>
        </div>
      )}
    </section>
  );
}
