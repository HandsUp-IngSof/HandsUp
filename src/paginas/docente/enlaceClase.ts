import { supabase } from "@/lib/supabase";

// Enlace de videollamada del docente (SCRUM-43). Se guarda en la columna perfiles.enlace_clase.
// Se lee aparte del perfil para que el login siga funcionando aunque la columna aun no exista.

const LARGO_MAXIMO = 300;

// Plataformas de videollamada que aceptamos.
const PLATAFORMAS = [
  { nombre: "Google Meet", dominio: "meet.google.com" },
  { nombre: "Zoom", dominio: "zoom.us" },
  { nombre: "Microsoft Teams", dominio: "teams.microsoft.com" },
  { nombre: "Microsoft Teams", dominio: "teams.live.com" },
  { nombre: "Jitsi Meet", dominio: "meet.jit.si" },
];

// El dominio es el de la plataforma o un subdominio suyo (ej: "us02web.zoom.us").
function plataformaDe(host: string) {
  return PLATAFORMAS.find((p) => host === p.dominio || host.endsWith(`.${p.dominio}`));
}

// Revisa lo que escribio el docente y lo deja como un enlace https completo.
// Lanza un Error con un mensaje claro si no es valido.
export function normalizarEnlace(texto: string): string {
  let enlace = texto.trim();
  if (!enlace) throw new Error("Escribe el enlace de tu clase.");
  if (/\s/.test(enlace)) throw new Error("El enlace no puede tener espacios.");
  if (enlace.length > LARGO_MAXIMO) throw new Error(`El enlace no puede tener más de ${LARGO_MAXIMO} caracteres.`);

  if (/^http:\/\//i.test(enlace)) throw new Error("Usa un enlace seguro que empiece por https://.");
  // "meet.google.com/abc" -> "https://meet.google.com/abc"
  if (!/^https:\/\//i.test(enlace)) enlace = `https://${enlace}`;

  let url: URL;
  try {
    url = new URL(enlace);
  } catch {
    throw new Error("El enlace no es válido. Ejemplo: https://meet.google.com/abc-defg-hij");
  }

  if (!plataformaDe(url.hostname.toLowerCase())) {
    throw new Error("Usa un enlace de Google Meet, Zoom, Microsoft Teams o Jitsi Meet.");
  }
  if (url.pathname === "/" || url.pathname === "") {
    throw new Error("El enlace debe llevar el código de tu sala, no solo la página de la plataforma.");
  }
  return url.toString();
}

// Nombre de la plataforma para mostrarlo en pantalla ("Google Meet").
export function nombrePlataforma(enlace: string): string | null {
  try {
    return plataformaDe(new URL(enlace).hostname.toLowerCase())?.nombre ?? null;
  } catch {
    return null;
  }
}

function traducirErrorEnlace(error: { code?: string; message: string }): Error {
  // 42703 / PGRST204: la columna enlace_clase no existe todavia en la tabla perfiles.
  if (error.code === "42703" || error.code === "PGRST204" || error.message.includes("enlace_clase")) {
    return new Error("Falta crear la columna enlace_clase en Supabase.");
  }
  return new Error("No se pudo conectar con el servidor. Inténtalo de nuevo.");
}

export async function obtenerEnlaceClase(idDocente: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("perfiles")
    .select("enlace_clase")
    .eq("id", idDocente)
    .maybeSingle();
  if (error) throw traducirErrorEnlace(error);
  return (data?.enlace_clase as string | null | undefined) ?? null;
}

// Guarda el enlace (ya normalizado) o lo borra si recibe null.
export async function guardarEnlaceClase(idDocente: string, enlace: string | null): Promise<void> {
  const { data, error } = await supabase
    .from("perfiles")
    .update({ enlace_clase: enlace })
    .eq("id", idDocente)
    .select("id");
  if (error) throw traducirErrorEnlace(error);
  // Si RLS no deja actualizar, Supabase no da error: simplemente no cambia ninguna fila.
  if (!data || data.length === 0) throw new Error("No tienes permiso para cambiar este enlace.");
}
