import { supabase } from "@/lib/supabase";
import { normalizarEnlaceVideo } from "@/lib/video";

// =====================================================================
// Gestion de modulos y lecciones por el docente (SCRUM-33).
// El docente disena el contenido que luego ve el estudiante: un modulo agrupa lecciones y
// solo se muestra a los estudiantes cuando esta publicado. Las politicas RLS de Supabase
// (sql/panel_estudiante.sql) garantizan que cada docente solo cambie lo suyo.
// =====================================================================

export interface LeccionDocente {
  id: string;
  moduloId: string;
  titulo: string;
  descripcion: string;
  contenido: string;
  videoUrl: string;
  orden: number;
  publicada: boolean;
}

export interface ModuloDocente {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  orden: number;
  publicado: boolean;
  requiereClaseBienvenida: boolean;
  duracionMin: number | null;
  lecciones: LeccionDocente[];
}

// Datos que se escriben en los formularios.
export interface DatosModulo {
  titulo: string;
  descripcion: string;
  icono: string;
  requiereClaseBienvenida: boolean;
  duracionMin: string; // texto del campo; vacio = sin duracion
}

export interface DatosLeccion {
  titulo: string;
  descripcion: string;
  contenido: string;
  videoUrl: string;
}

export const LIMITES = {
  tituloModulo: 120,
  descripcionModulo: 400,
  tituloLeccion: 150,
  descripcionLeccion: 300,
  contenidoLeccion: 5000,
};

// ---- Mensajes de error -----------------------------------------------

function traducir(error: { code?: string; message: string }, porDefecto: string): Error {
  if (["42P01", "42703", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
    return new Error("Falta ejecutar el script sql/panel_estudiante.sql en Supabase.");
  }
  if (error.code === "42501") return new Error("No tienes permiso para hacer este cambio.");
  return new Error(porDefecto);
}

// ---- Validacion ------------------------------------------------------

export function validarModulo(datos: DatosModulo): string | null {
  const titulo = datos.titulo.trim();
  if (titulo.length < 2) return "Escribe el título del módulo (mínimo 2 letras).";
  if (titulo.length > LIMITES.tituloModulo) return `El título no puede pasar de ${LIMITES.tituloModulo} caracteres.`;
  if (datos.descripcion.trim().length > LIMITES.descripcionModulo) {
    return `La descripción no puede pasar de ${LIMITES.descripcionModulo} caracteres.`;
  }
  if (datos.duracionMin.trim()) {
    const minutos = Number(datos.duracionMin);
    if (!Number.isInteger(minutos) || minutos < 1 || minutos > 600) {
      return "La duración debe ser un número entero de minutos entre 1 y 600.";
    }
  }
  return null;
}

export function validarLeccion(datos: DatosLeccion): string | null {
  const titulo = datos.titulo.trim();
  if (titulo.length < 2) return "Escribe el título de la lección (mínimo 2 letras).";
  if (titulo.length > LIMITES.tituloLeccion) return `El título no puede pasar de ${LIMITES.tituloLeccion} caracteres.`;
  if (datos.descripcion.trim().length > LIMITES.descripcionLeccion) {
    return `La descripción no puede pasar de ${LIMITES.descripcionLeccion} caracteres.`;
  }
  if (datos.contenido.trim().length > LIMITES.contenidoLeccion) {
    return `El contenido no puede pasar de ${LIMITES.contenidoLeccion} caracteres.`;
  }
  try {
    normalizarEnlaceVideo(datos.videoUrl);
  } catch (err) {
    return err instanceof Error ? err.message : "El enlace del video no es válido.";
  }
  return null;
}

// ---- Consultas ---------------------------------------------------------

export async function obtenerModulosDocente(profesorId: string): Promise<ModuloDocente[]> {
  const { data: modulos, error } = await supabase
    .from("modulos")
    .select("id, titulo, descripcion, icono, orden, esta_habilitado, requiere_clase_bienvenida, duracion_min")
    .eq("profesor_id", profesorId)
    .order("orden")
    .order("creado_en");
  if (error) throw traducir(error, "No se pudieron cargar tus módulos.");
  if (modulos.length === 0) return [];

  const { data: lecciones, error: errorLecciones } = await supabase
    .from("lecciones")
    .select("id, modulo_id, titulo, descripcion, contenido, video_url, orden, esta_habilitada")
    .eq("profesor_id", profesorId)
    .in("modulo_id", modulos.map((m) => m.id))
    .order("orden")
    .order("creado_en");
  if (errorLecciones) throw traducir(errorLecciones, "No se pudieron cargar tus lecciones.");

  return modulos.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    descripcion: m.descripcion ?? "",
    icono: m.icono ?? "hand",
    orden: m.orden ?? 0,
    publicado: m.esta_habilitado === true,
    requiereClaseBienvenida: m.requiere_clase_bienvenida === true,
    duracionMin: m.duracion_min,
    lecciones: lecciones
      .filter((l) => l.modulo_id === m.id)
      .map((l) => ({
        id: l.id,
        moduloId: l.modulo_id,
        titulo: l.titulo,
        descripcion: l.descripcion ?? "",
        contenido: l.contenido ?? "",
        videoUrl: l.video_url ?? "",
        orden: l.orden ?? 0,
        publicada: l.esta_habilitada === true,
      })),
  }));
}

const camposModulo = (datos: DatosModulo) => ({
  titulo: datos.titulo.trim().replace(/\s+/g, " "),
  descripcion: datos.descripcion.trim() || null,
  icono: datos.icono,
  requiere_clase_bienvenida: datos.requiereClaseBienvenida,
  duracion_min: datos.duracionMin.trim() ? Number(datos.duracionMin) : null,
});

const camposLeccion = (datos: DatosLeccion) => ({
  titulo: datos.titulo.trim().replace(/\s+/g, " "),
  descripcion: datos.descripcion.trim() || null,
  contenido: datos.contenido.trim() || null,
  video_url: normalizarEnlaceVideo(datos.videoUrl),
});

export async function crearModulo(profesorId: string, datos: DatosModulo, ordenActual: number): Promise<void> {
  const mensaje = validarModulo(datos);
  if (mensaje) throw new Error(mensaje);
  const { error } = await supabase
    .from("modulos")
    .insert({ ...camposModulo(datos), profesor_id: profesorId, orden: ordenActual + 1, esta_habilitado: false });
  if (error) throw traducir(error, "No se pudo crear el módulo. Inténtalo de nuevo.");
}

export async function actualizarModulo(id: string, datos: DatosModulo): Promise<void> {
  const mensaje = validarModulo(datos);
  if (mensaje) throw new Error(mensaje);
  const { data, error } = await supabase.from("modulos").update(camposModulo(datos)).eq("id", id).select("id");
  if (error) throw traducir(error, "No se pudo guardar el módulo. Inténtalo de nuevo.");
  if (!data || data.length === 0) throw new Error("No tienes permiso para cambiar este módulo.");
}

export async function publicarModulo(id: string, publicado: boolean): Promise<void> {
  const { data, error } = await supabase.from("modulos").update({ esta_habilitado: publicado }).eq("id", id).select("id");
  if (error) throw traducir(error, "No se pudo cambiar la publicación del módulo.");
  if (!data || data.length === 0) throw new Error("No tienes permiso para cambiar este módulo.");
}

export async function eliminarModulo(id: string): Promise<void> {
  const { error, count } = await supabase.from("modulos").delete({ count: "exact" }).eq("id", id);
  // 23503: alguna leccion del modulo ya tiene progreso de estudiantes.
  if (error?.code === "23503") {
    throw new Error("Este módulo tiene lecciones con avance de estudiantes y no se puede eliminar. Ocúltalo en su lugar.");
  }
  if (error) throw traducir(error, "No se pudo eliminar el módulo. Inténtalo de nuevo.");
  if (count === 0) throw new Error("No tienes permiso para eliminar este módulo.");
}

export async function crearLeccion(
  profesorId: string,
  moduloId: string,
  datos: DatosLeccion,
  ordenActual: number,
): Promise<void> {
  const mensaje = validarLeccion(datos);
  if (mensaje) throw new Error(mensaje);
  const { error } = await supabase.from("lecciones").insert({
    ...camposLeccion(datos),
    profesor_id: profesorId,
    modulo_id: moduloId,
    orden: ordenActual + 1,
    esta_habilitada: false,
  });
  if (error) throw traducir(error, "No se pudo crear la lección. Inténtalo de nuevo.");
}

export async function actualizarLeccion(id: string, datos: DatosLeccion): Promise<void> {
  const mensaje = validarLeccion(datos);
  if (mensaje) throw new Error(mensaje);
  const { data, error } = await supabase.from("lecciones").update(camposLeccion(datos)).eq("id", id).select("id");
  if (error) throw traducir(error, "No se pudo guardar la lección. Inténtalo de nuevo.");
  if (!data || data.length === 0) throw new Error("No tienes permiso para cambiar esta lección.");
}

export async function publicarLeccion(id: string, publicada: boolean): Promise<void> {
  const { data, error } = await supabase.from("lecciones").update({ esta_habilitada: publicada }).eq("id", id).select("id");
  if (error) throw traducir(error, "No se pudo cambiar la publicación de la lección.");
  if (!data || data.length === 0) throw new Error("No tienes permiso para cambiar esta lección.");
}

export async function eliminarLeccion(id: string): Promise<void> {
  const { error, count } = await supabase.from("lecciones").delete({ count: "exact" }).eq("id", id);
  // 23503: algun estudiante ya completo la leccion.
  if (error?.code === "23503") {
    throw new Error("Esta lección ya tiene avance de estudiantes y no se puede eliminar. Ocúltala en su lugar.");
  }
  if (error) throw traducir(error, "No se pudo eliminar la lección. Inténtalo de nuevo.");
  if (count === 0) throw new Error("No tienes permiso para eliminar esta lección.");
}

// Guarda un nuevo orden: el elemento que esta en la posicion i queda con orden i + 1.
export async function guardarOrden(tabla: "modulos" | "lecciones", idsEnOrden: string[]): Promise<void> {
  const resultados = await Promise.all(
    idsEnOrden.map((id, i) => supabase.from(tabla).update({ orden: i + 1 }).eq("id", id)),
  );
  if (resultados.some((r) => r.error)) throw new Error("No se pudo guardar el nuevo orden. Inténtalo de nuevo.");
}

// Valores iniciales de los formularios.
export const MODULO_VACIO: DatosModulo = {
  titulo: "",
  descripcion: "",
  icono: "hand",
  requiereClaseBienvenida: false,
  duracionMin: "",
};

export const LECCION_VACIA: DatosLeccion = { titulo: "", descripcion: "", contenido: "", videoUrl: "" };
