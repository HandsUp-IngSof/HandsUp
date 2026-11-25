import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Circle, ListChecks, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import { Ventana } from "@/componentes/UI/Ventana";
import {
  actualizarEjercicio,
  crearEjercicio,
  EJERCICIO_VACIO,
  eliminarEjercicio,
  LIMITE_OPCION,
  LIMITE_PREGUNTA,
  MAX_OPCIONES,
  MIN_OPCIONES,
  NOTA_MINIMA,
  obtenerEjerciciosDocente,
  validarEjercicio,
  type DatosEjercicio,
  type Ejercicio,
} from "@/lib/ejercicios";
import { cn } from "@/lib/utils";

interface VentanaEjerciciosProps {
  leccion: { id: string; titulo: string } | null; // null = cerrada
  onCerrar: () => void;
  onCambio: () => void; // se creo, edito o borro un ejercicio (actualiza el contador)
}

const LETRAS = ["A", "B", "C", "D"];

// Formulario de una pregunta de opcion multiple.
function FormularioEjercicio({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial: DatosEjercicio;
  onGuardar: (datos: DatosEjercicio) => Promise<void>;
  onCancelar: () => void;
}) {
  const [datos, setDatos] = useState<DatosEjercicio>(inicial);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiarOpcion = (i: number, valor: string) =>
    setDatos((d) => ({ ...d, opciones: d.opciones.map((o, j) => (j === i ? valor : o)) }));

  const quitarOpcion = (i: number) =>
    setDatos((d) => ({
      ...d,
      opciones: d.opciones.filter((_, j) => j !== i),
      // Si se quita la correcta o una anterior, la marca se corre para seguir apuntando bien.
      respuestaCorrecta: d.respuestaCorrecta === i ? 0 : d.respuestaCorrecta > i ? d.respuestaCorrecta - 1 : d.respuestaCorrecta,
    }));

  const guardar = async () => {
    const problema = validarEjercicio(datos);
    if (problema) {
      setError(problema);
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el ejercicio.");
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-[#14848D]/40 bg-[#F4FAF9] p-4">
      <div>
        <label htmlFor="ejercicio-pregunta" className="text-sm font-bold text-slate-700">
          Pregunta
        </label>
        <textarea
          id="ejercicio-pregunta"
          value={datos.pregunta}
          onChange={(e) => {
            setDatos({ ...datos, pregunta: e.target.value });
            setError(null);
          }}
          rows={2}
          maxLength={LIMITE_PREGUNTA + 20}
          placeholder="Ej: ¿Qué letra se forma con el puño cerrado y el pulgar al lado?"
          className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-[#14848D]"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-bold text-slate-700">Opciones (marca la correcta)</legend>
        <div className="mt-1.5 space-y-2">
          {datos.opciones.map((opcion, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="opcion-correcta"
                checked={datos.respuestaCorrecta === i}
                onChange={() => setDatos({ ...datos, respuestaCorrecta: i })}
                aria-label={`Marcar la opción ${LETRAS[i]} como correcta`}
                className="h-4 w-4 shrink-0 accent-[#14848D]"
              />
              <span className="w-5 shrink-0 text-xs font-bold text-slate-500">{LETRAS[i]}</span>
              <input
                value={opcion}
                onChange={(e) => {
                  cambiarOpcion(i, e.target.value);
                  setError(null);
                }}
                maxLength={LIMITE_OPCION + 10}
                aria-label={`Opción ${LETRAS[i]}`}
                placeholder={`Opción ${LETRAS[i]}`}
                className={cn(
                  "h-10 min-w-0 flex-1 rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-[#14848D]",
                  datos.respuestaCorrecta === i ? "border-[#14848D]" : "border-slate-200",
                )}
              />
              {datos.opciones.length > MIN_OPCIONES && (
                <button
                  type="button"
                  onClick={() => quitarOpcion(i)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Quitar la opción ${LETRAS[i]}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {datos.opciones.length < MAX_OPCIONES && (
          <button
            type="button"
            onClick={() => setDatos({ ...datos, opciones: [...datos.opciones, ""] })}
            className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#14848D] hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir opción
          </button>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={guardando}
          className="flex items-center gap-2 rounded-xl bg-[#14848D] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F6E75] disabled:opacity-60"
        >
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar ejercicio
        </button>
      </div>
    </div>
  );
}

// Ejercicios de una leccion (SCRUM-38): el docente los crea, edita y borra.
// El estudiante los responde al final de la leccion y Supabase los califica.
export function VentanaEjercicios({ leccion, onCerrar, onCambio }: VentanaEjerciciosProps) {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | "nuevo" | null>(null); // id, "nuevo" o null
  const [porEliminar, setPorEliminar] = useState<string | null>(null);

  const leccionId = leccion?.id;

  const recargar = useCallback(async () => {
    if (!leccionId) return;
    try {
      setEjercicios(await obtenerEjerciciosDocente(leccionId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los ejercicios.");
    } finally {
      setCargando(false);
    }
  }, [leccionId]);

  useEffect(() => {
    if (!leccionId) return;
    setCargando(true);
    setEditando(null);
    setPorEliminar(null);
    void recargar();
  }, [leccionId, recargar]);

  const guardar = async (datos: DatosEjercicio) => {
    if (!leccionId) return;
    if (editando && editando !== "nuevo") await actualizarEjercicio(editando, datos);
    else await crearEjercicio(leccionId, datos, ejercicios.length + 1);
    setEditando(null);
    await recargar();
    onCambio();
  };

  const eliminar = async (id: string) => {
    try {
      await eliminarEjercicio(id);
      setPorEliminar(null);
      await recargar();
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el ejercicio.");
    }
  };

  return (
    <Ventana titulo="Ejercicios de la lección" abierta={leccion !== null} onCerrar={onCerrar} ancho="2xl">
      {leccion && (
        <div className="space-y-4">
          <div>
            <p className="font-bold text-slate-800">{leccion.titulo}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Preguntas de opción múltiple. El estudiante las responde al final de la lección y debe sacar mínimo{" "}
              <strong>{NOTA_MINIMA}%</strong> para completarla. La nota la calcula el sistema.
            </p>
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          {cargando ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#14848D]" />
              Cargando ejercicios...
            </div>
          ) : (
            <>
              {ejercicios.length === 0 && editando !== "nuevo" && (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center">
                  <ListChecks className="h-7 w-7 text-[#14848D]" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">Esta lección todavía no tiene ejercicios.</p>
                  <p className="mt-0.5 text-xs text-slate-500">Sin ejercicios, el estudiante la completa con un solo clic.</p>
                </div>
              )}

              <ol className="space-y-3">
                {ejercicios.map((ejercicio, i) =>
                  editando === ejercicio.id ? (
                    <li key={ejercicio.id}>
                      <FormularioEjercicio
                        inicial={{
                          pregunta: ejercicio.pregunta,
                          opciones: ejercicio.opciones,
                          respuestaCorrecta: ejercicio.respuestaCorrecta,
                        }}
                        onGuardar={guardar}
                        onCancelar={() => setEditando(null)}
                      />
                    </li>
                  ) : (
                    <li key={ejercicio.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start gap-2">
                        <p className="min-w-0 flex-1 text-sm font-semibold text-slate-800">
                          {i + 1}. {ejercicio.pregunta}
                        </p>
                        <button
                          type="button"
                          onClick={() => setEditando(ejercicio.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#14848D]"
                          aria-label={`Editar el ejercicio ${i + 1}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPorEliminar(ejercicio.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Eliminar el ejercicio ${i + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {ejercicio.opciones.map((opcion, j) => {
                          const correcta = j === ejercicio.respuestaCorrecta;
                          return (
                            <li
                              key={j}
                              className={cn("flex items-center gap-2 text-sm", correcta ? "font-semibold text-[#0F6E75]" : "text-slate-600")}
                            >
                              {correcta ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0 text-slate-300" />}
                              {LETRAS[j]}. {opcion}
                              {correcta && <span className="sr-only">(respuesta correcta)</span>}
                            </li>
                          );
                        })}
                      </ul>
                      {porEliminar === ejercicio.id && (
                        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 rounded-lg bg-red-50 p-2 text-sm">
                          <span className="mr-auto text-red-700">¿Eliminar este ejercicio?</span>
                          <button
                            type="button"
                            onClick={() => setPorEliminar(null)}
                            className="rounded-lg px-3 py-1.5 font-semibold text-slate-700 hover:bg-white"
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => void eliminar(ejercicio.id)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 font-bold text-white hover:bg-red-700"
                          >
                            Sí, eliminar
                          </button>
                        </div>
                      )}
                    </li>
                  ),
                )}
              </ol>

              {editando === "nuevo" ? (
                <FormularioEjercicio inicial={EJERCICIO_VACIO} onGuardar={guardar} onCancelar={() => setEditando(null)} />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditando("nuevo")}
                  disabled={editando !== null}
                  className="flex items-center gap-2 rounded-xl border border-[#14848D] px-4 py-2 text-sm font-bold text-[#14848D] hover:bg-[#E3F3F0] disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Añadir ejercicio
                </button>
              )}
            </>
          )}
        </div>
      )}
    </Ventana>
  );
}
