import { supabase } from "@/lib/supabase";

// =====================================================================
// Ejercicios interactivos con calificación automática (SCRUM-38).
// El docente los crea en "Mis módulos"; el estudiante los responde en la lección.
// Supabase califica (basedatos/SCRUM-38-ejercicios.sql): la respuesta correcta
// no se envía al estudiante antes de calificar.
// =====================================================================

export const NOTA_MINIMA = 70;
export const LIMITE_PREGUNTA = 300;
export const LIMITE_OPCION = 120;
export const MIN_OPCIONES = 2;
export const MAX_OPCIONES = 4;

// Ejercicio completo (lo ve el docente).
export interface Ejercicio {
  id: string;
  leccionId: string;
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number;
  orden: number;
}

// Ejercicio sin la respuesta (lo ve el estudiante).
export interface EjercicioEstudiante {
  id: string;
  pregunta: string;
  opciones: string[];
}

export interface DatosEjercicio {
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number;
}

export interface ResultadoCalificacion {
  correctas: number;
  total: number;
  puntaje: number;
  aprobado: boolean;
  minimo: number;
  // Por ejercicio: si acertó y, solo si aprobó, cuál era la correcta.
  detalle: { ejercicioId: string; correcta: boolean; respuestaCorrecta?: number }[];
}

export const EJERCICIO_VACIO: DatosEjercicio = { pregunta: "", opciones: ["", ""], respuestaCorrecta: 0 };

function traducir(error: { code?: string; message: string }, porDefecto: string): Error {
  if (["42P01", "42883", "PGRST202", "PGRST205"].includes(error.code ?? "")) {
    return new Error("Falta crear los ejercicios en Supabase (SQL de SCRUM-38).");
  }
  if (error.code === "P0001") return new Error(error.message);
  if (error.code === "23514") return new Error("El ejercicio no cumple las reglas (revisa la pregunta y las opciones).");
  if (error.code === "42501") return new Error("No tienes permiso para hacer este cambio.");
  return new Error(porDefecto);
}

// ---- Validación (docente) --------------------------------------------

export function validarEjercicio(datos: DatosEjercicio): string | null {
  const pregunta = datos.pregunta.trim();
  if (pregunta.length < 3) return "Escribe la pregunta (mínimo 3 caracteres).";
  if (pregunta.length > LIMITE_PREGUNTA) return `La pregunta no puede pasar de ${LIMITE_PREGUNTA} caracteres.`;

  const opciones = datos.opciones.map((o) => o.trim());
  if (opciones.length < MIN_OPCIONES || opciones.length > MAX_OPCIONES) {
    return `El ejercicio debe tener entre ${MIN_OPCIONES} y ${MAX_OPCIONES} opciones.`;
  }
  if (opciones.some((o) => !o)) return "Ninguna opción puede quedar vacía.";
  if (opciones.some((o) => o.length > LIMITE_OPCION)) return `Cada opción puede tener máximo ${LIMITE_OPCION} caracteres.`;
  if (new Set(opciones.map((o) => o.toLowerCase())).size !== opciones.length) return "Las opciones no pueden repetirse.";
  if (datos.respuestaCorrecta < 0 || datos.respuestaCorrecta >= opciones.length) return "Marca cuál es la opción correcta.";
  return null;
}

const campos = (datos: DatosEjercicio) => ({
  pregunta: datos.pregunta.trim().replace(/\s+/g, " "),
  opciones: datos.opciones.map((o) => o.trim().replace(/\s+/g, " ")),
  respuesta_correcta: datos.respuestaCorrecta,
});

// ---- Docente ----------------------------------------------------------

export async function obtenerEjerciciosDocente(leccionId: string): Promise<Ejercicio[]> {
  const { data, error } = await supabase
    .from("ejercicios")
    .select("id, leccion_id, pregunta, opciones, respuesta_correcta, orden")
    .eq("leccion_id", leccionId)
    .order("orden")
    .order("creado_en");
  if (error) throw traducir(error, "No se pudieron cargar los ejercicios.");
  return data.map((e) => ({
    id: e.id,
    leccionId: e.leccion_id,
    pregunta: e.pregunta,
    opciones: e.opciones,
    respuestaCorrecta: e.respuesta_correcta,
    orden: e.orden,
  }));
}

// Cuántos ejercicios tiene cada lección (para mostrarlo en "Mis módulos").
// Si la tabla aún no existe, devuelve un mapa vacío para no romper la página.
export async function contarEjercicios(leccionIds: string[]): Promise<Map<string, number>> {
  const cuenta = new Map<string, number>();
  if (leccionIds.length === 0) return cuenta;
  const { data, error } = await supabase.from("ejercicios").select("leccion_id").in("leccion_id", leccionIds);
  if (error) return cuenta;
  for (const fila of data) cuenta.set(fila.leccion_id, (cuenta.get(fila.leccion_id) ?? 0) + 1);
  return cuenta;
}

export async function crearEjercicio(leccionId: string, datos: DatosEjercicio, orden: number): Promise<void> {
  const mensaje = validarEjercicio(datos);
  if (mensaje) throw new Error(mensaje);
  const { error } = await supabase.from("ejercicios").insert({ ...campos(datos), leccion_id: leccionId, orden });
  if (error) throw traducir(error, "No se pudo guardar el ejercicio. Inténtalo de nuevo.");
}

export async function actualizarEjercicio(id: string, datos: DatosEjercicio): Promise<void> {
  const mensaje = validarEjercicio(datos);
  if (mensaje) throw new Error(mensaje);
  const { data, error } = await supabase.from("ejercicios").update(campos(datos)).eq("id", id).select("id");
  if (error) throw traducir(error, "No se pudo guardar el ejercicio. Inténtalo de nuevo.");
  if (!data || data.length === 0) throw new Error("No tienes permiso para cambiar este ejercicio.");
}

export async function eliminarEjercicio(id: string): Promise<void> {
  const { error, count } = await supabase.from("ejercicios").delete({ count: "exact" }).eq("id", id);
  if (error) throw traducir(error, "No se pudo eliminar el ejercicio. Inténtalo de nuevo.");
  if (count === 0) throw new Error("No tienes permiso para eliminar este ejercicio.");
}

// ---- Estudiante -------------------------------------------------------

export async function obtenerEjerciciosEstudiante(leccionId: string): Promise<EjercicioEstudiante[]> {
  const { data, error } = await supabase.rpc("ejercicios_de_leccion", { p_leccion_id: leccionId });
  if (error) {
    // Si aún no existe en Supabase, la lección se muestra sin ejercicios.
    if (["42883", "PGRST202"].includes(error.code ?? "")) return [];
    throw traducir(error, "No se pudieron cargar los ejercicios.");
  }
  return ((data ?? []) as { id: string; pregunta: string; opciones: string[] }[]).map((e) => ({
    id: e.id,
    pregunta: e.pregunta,
    opciones: e.opciones,
  }));
}

export async function calificarLeccion(
  leccionId: string,
  respuestas: Record<string, number>,
): Promise<ResultadoCalificacion> {
  const { data, error } = await supabase.rpc("calificar_leccion", { p_leccion_id: leccionId, p_respuestas: respuestas });
  if (error) throw traducir(error, "No se pudieron calificar tus respuestas. Inténtalo de nuevo.");
  const r = data as {
    correctas: number;
    total: number;
    puntaje: number;
    aprobado: boolean;
    minimo: number;
    detalle: { ejercicio_id: string; correcta: boolean; respuesta_correcta?: number }[];
  };
  return {
    correctas: r.correctas,
    total: r.total,
    puntaje: r.puntaje,
    aprobado: r.aprobado,
    minimo: r.minimo,
    detalle: r.detalle.map((d) => ({ ejercicioId: d.ejercicio_id, correcta: d.correcta, respuestaCorrecta: d.respuesta_correcta })),
  };
}
