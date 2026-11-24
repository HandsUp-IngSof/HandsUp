import { supabase } from "@/lib/supabase";

// Edicion del perfil del usuario con sesion (SCRUM-48 docente).
// El rol no se edita: la regla de seguridad de Supabase (SCRUM-32) no deja cambiarlo.

export const BIO_MAXIMO = 300;

// Datos que se pueden editar en la pagina "Mi perfil".
export interface DatosPerfil {
  nombre: string;
  apellido: string;
  bio: string;
}

export type ErroresPerfil = Partial<Record<keyof DatosPerfil, string>>;

// Letras (con tildes y ñ), espacios, apostrofo y guion: "María José", "O'Neil", "Gómez-Ruiz".
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

// Quita espacios de los lados y deja un solo espacio entre palabras.
export const limpiarTexto = (texto: string) => texto.trim().replace(/\s+/g, " ");

function validarNombre(valor: string, campo: "nombre" | "apellido"): string | undefined {
  const texto = limpiarTexto(valor);
  const etiqueta = campo === "nombre" ? "el nombre" : "el apellido";
  if (!texto) return `Escribe ${etiqueta}.`;
  if (texto.length < 2) return `${campo === "nombre" ? "El nombre" : "El apellido"} debe tener al menos 2 letras.`;
  if (texto.length > 50) return `${campo === "nombre" ? "El nombre" : "El apellido"} no puede pasar de 50 caracteres.`;
  if (!SOLO_LETRAS.test(texto)) return `Usa solo letras en ${etiqueta}.`;
  return undefined;
}

// Revisa todo el formulario. Devuelve un objeto vacio si no hay errores.
export function validarPerfil(datos: DatosPerfil): ErroresPerfil {
  const errores: ErroresPerfil = {};
  const nombre = validarNombre(datos.nombre, "nombre");
  const apellido = validarNombre(datos.apellido, "apellido");
  if (nombre) errores.nombre = nombre;
  if (apellido) errores.apellido = apellido;
  if (datos.bio.trim().length > BIO_MAXIMO) errores.bio = `La descripción no puede pasar de ${BIO_MAXIMO} caracteres.`;
  return errores;
}

// Deja los datos listos para guardar: sin espacios de sobra y la bio vacia como null.
export function normalizarPerfil(datos: DatosPerfil) {
  return {
    nombre: limpiarTexto(datos.nombre),
    apellido: limpiarTexto(datos.apellido),
    bio: datos.bio.trim() || null,
  };
}

// Lee los campos editables que no vienen en el perfil de la sesion (por ejemplo, la bio).
export async function obtenerCamposPerfil(idUsuario: string, campos: string[]): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from("perfiles").select(campos.join(", ")).eq("id", idUsuario).maybeSingle();
  if (error) throw new Error("No se pudo cargar tu perfil. Inténtalo de nuevo.");
  return (data ?? {}) as Record<string, unknown>;
}

// Correo de la cuenta. Vive en Supabase Auth, no en la tabla perfiles, y no se edita aqui.
export async function obtenerCorreo(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

// Guarda los cambios en la tabla perfiles.
export async function guardarPerfil(idUsuario: string, cambios: Record<string, string | null>): Promise<void> {
  const { data, error } = await supabase.from("perfiles").update(cambios).eq("id", idUsuario).select("id");
  if (error) {
    if (error.code === "42703" || error.code === "PGRST204") {
      throw new Error("Falta crear una columna del perfil en Supabase.");
    }
    if (error.code === "23514") throw new Error("Algún dato no tiene el formato correcto.");
    throw new Error("No se pudo guardar tu perfil. Inténtalo de nuevo.");
  }
  // Si la regla de seguridad no deja actualizar, Supabase no da error: no cambia ninguna fila.
  if (!data || data.length === 0) throw new Error("No tienes permiso para cambiar este perfil.");
}
