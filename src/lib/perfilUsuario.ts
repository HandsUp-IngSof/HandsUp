import { supabase } from "@/lib/supabase";

// Edicion del perfil del usuario con sesion (SCRUM-48 docente y SCRUM-47 estudiante).
// El rol no se edita: la regla de seguridad de Supabase (SCRUM-32) no deja cambiarlo.

export const BIO_MAXIMO = 300;

// Datos que se pueden editar en la pagina "Mi perfil".
// El telefono solo lo usa el estudiante (SCRUM-47).
export interface DatosPerfil {
  nombre: string;
  apellido: string;
  bio: string;
  telefono: string;
}

export interface OpcionesPerfil {
  conTelefono?: boolean;
}

// "300 123 4567", "300-123-4567" o "+57 300 123 4567" -> "3001234567".
export function limpiarTelefono(texto: string): string {
  let numero = texto.replace(/[\s().-]/g, "");
  if (numero.startsWith("+57")) numero = numero.slice(3);
  else if (numero.startsWith("57") && numero.length === 12) numero = numero.slice(2);
  return numero;
}

// "3001234567" -> "300 123 4567"
export function formatoTelefono(numero: string): string {
  return numero.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3");
}

// El telefono es opcional; si se escribe, debe ser un celular colombiano.
function validarTelefono(valor: string): string | undefined {
  if (!valor.trim()) return undefined;
  const numero = limpiarTelefono(valor);
  if (!/^\d+$/.test(numero)) return "El teléfono solo puede tener números.";
  if (!/^3\d{9}$/.test(numero)) return "Escribe un celular colombiano de 10 dígitos que empiece por 3.";
  return undefined;
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
export function validarPerfil(datos: DatosPerfil, { conTelefono = false }: OpcionesPerfil = {}): ErroresPerfil {
  const errores: ErroresPerfil = {};
  const nombre = validarNombre(datos.nombre, "nombre");
  const apellido = validarNombre(datos.apellido, "apellido");
  if (nombre) errores.nombre = nombre;
  if (apellido) errores.apellido = apellido;
  if (datos.bio.trim().length > BIO_MAXIMO) errores.bio = `La descripción no puede pasar de ${BIO_MAXIMO} caracteres.`;
  if (conTelefono) {
    const telefono = validarTelefono(datos.telefono);
    if (telefono) errores.telefono = telefono;
  }
  return errores;
}

// Deja los datos listos para guardar: sin espacios de sobra y los campos vacios como null.
export function normalizarPerfil(datos: DatosPerfil, { conTelefono = false }: OpcionesPerfil = {}) {
  const limpios: Record<string, string | null> = {
    nombre: limpiarTexto(datos.nombre),
    apellido: limpiarTexto(datos.apellido),
    bio: datos.bio.trim() || null,
  };
  if (conTelefono) limpios.telefono = limpiarTelefono(datos.telefono) || null;
  return limpios;
}

// Lee los campos editables que no vienen en el perfil de la sesion (por ejemplo, la bio).
export async function obtenerCamposPerfil(idUsuario: string, campos: string[]): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from("perfiles").select(campos.join(", ")).eq("id", idUsuario).maybeSingle();
  if (error?.code === "42703") throw new Error("Falta crear una columna del perfil en Supabase (revisa el SQL).");
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
    if (error.code === "23514") {
      throw new Error(
        error.message.includes("telefono") ? "El teléfono no tiene un formato válido." : "Algún dato no tiene el formato correcto.",
      );
    }
    throw new Error("No se pudo guardar tu perfil. Inténtalo de nuevo.");
  }
  // Si la regla de seguridad no deja actualizar, Supabase no da error: no cambia ninguna fila.
  if (!data || data.length === 0) throw new Error("No tienes permiso para cambiar este perfil.");
}
