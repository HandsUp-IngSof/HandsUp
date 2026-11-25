import { supabase } from "@/lib/supabase";

// =====================================================================
// Mensajería interna tipo chat (SCRUM-44).
// Tablas: conversaciones y mensajes. Funciones de Supabase: mis_chats,
// abrir_conversacion, marcar_leidos y mensajes_sin_leer (basedatos/SCRUM-44-mensajeria.sql).
// =====================================================================

export const MENSAJE_MAXIMO = 1000;

// Los mensajes se borran solos despues de estos dias (SCRUM-52, basedatos/SCRUM-52-vaciado-chats.sql).
// Si se cambia, cambiar tambien el 30 de la tarea programada en Supabase.
export const DIAS_RETENCION = 30;

// Evento del navegador para avisar que se leyeron mensajes (actualiza el número del menú).
export const EVENTO_LEIDOS = "handsup:mensajes-leidos";

export interface Chat {
  otroId: string;
  nombre: string;
  apellido: string;
  avatarUrl: string | null;
  rol: string; // "profesor" o "estudiante"
  conversacionId: string | null; // null = todavia no se han escrito
  ultimoTexto: string | null;
  ultimoAutorId: string | null;
  ultimoEn: string | null;
  sinLeer: number;
}

export interface Mensaje {
  id: string;
  conversacion_id: string;
  autor_id: string;
  texto: string;
  creado_en: string;
  leido_en: string | null;
}

interface FilaChat {
  otro_id: string;
  nombre: string;
  apellido: string;
  avatar_url: string | null;
  rol: string;
  conversacion_id: string | null;
  ultimo_texto: string | null;
  ultimo_autor: string | null;
  ultimo_en: string | null;
  sin_leer: number;
}

function traducirError(error: { code?: string; message: string }, porDefecto: string): Error {
  // Funciones o tablas que aun no existen en Supabase.
  if (error.code === "PGRST202" || error.code === "PGRST205" || error.code === "42P01") {
    return new Error("Falta crear el chat en Supabase (SQL de SCRUM-44).");
  }
  // Mensajes que vienen de las funciones de Supabase (ya estan en español).
  if (error.code === "P0001") return new Error(error.message);
  if (error.code === "23514") return new Error(`El mensaje debe tener entre 1 y ${MENSAJE_MAXIMO} caracteres.`);
  if (error.code === "42501") return new Error("No tienes permiso para escribir en esta conversación.");
  return new Error(porDefecto);
}

// Revisa el mensaje antes de enviarlo. Devuelve el error o null.
export function validarMensaje(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio) return "Escribe un mensaje.";
  if (limpio.length > MENSAJE_MAXIMO) return `El mensaje no puede pasar de ${MENSAJE_MAXIMO} caracteres.`;
  return null;
}

export async function obtenerChats(): Promise<Chat[]> {
  const { data, error } = await supabase.rpc("mis_chats");
  if (error) throw traducirError(error, "No se pudieron cargar tus mensajes.");
  return ((data ?? []) as FilaChat[]).map((f) => ({
    otroId: f.otro_id,
    nombre: f.nombre,
    apellido: f.apellido,
    avatarUrl: f.avatar_url,
    rol: f.rol,
    conversacionId: f.conversacion_id,
    ultimoTexto: f.ultimo_texto,
    ultimoAutorId: f.ultimo_autor,
    ultimoEn: f.ultimo_en,
    sinLeer: f.sin_leer,
  }));
}

// Ultimos 200 mensajes de una conversacion, del mas viejo al mas nuevo.
export async function obtenerMensajes(conversacionId: string): Promise<Mensaje[]> {
  const { data, error } = await supabase
    .from("mensajes")
    .select("id, conversacion_id, autor_id, texto, creado_en, leido_en")
    .eq("conversacion_id", conversacionId)
    .order("creado_en", { ascending: false })
    .limit(200);
  if (error) throw traducirError(error, "No se pudieron cargar los mensajes.");
  return (data as Mensaje[]).reverse();
}

// Devuelve la conversacion con esa persona; si no existe, la crea (solo si tienen clases juntos).
export async function abrirConversacion(otroId: string): Promise<string> {
  const { data, error } = await supabase.rpc("abrir_conversacion", { p_otro: otroId });
  if (error) throw traducirError(error, "No se pudo abrir la conversación.");
  return data as string;
}

export async function enviarMensaje(conversacionId: string, autorId: string, texto: string): Promise<Mensaje> {
  const { data, error } = await supabase
    .from("mensajes")
    .insert({ conversacion_id: conversacionId, autor_id: autorId, texto: texto.trim() })
    .select("id, conversacion_id, autor_id, texto, creado_en, leido_en")
    .single();
  if (error) throw traducirError(error, "No se pudo enviar el mensaje. Inténtalo de nuevo.");
  return data as Mensaje;
}

export async function marcarLeidos(conversacionId: string): Promise<void> {
  const { data } = await supabase.rpc("marcar_leidos", { p_conversacion: conversacionId });
  if (typeof data === "number" && data > 0) window.dispatchEvent(new Event(EVENTO_LEIDOS));
}

export async function contarSinLeer(): Promise<number> {
  const { data, error } = await supabase.rpc("mensajes_sin_leer");
  if (error) return 0;
  return (data as number) ?? 0;
}

// Escucha en tiempo real los mensajes nuevos o leidos. Supabase solo envia los
// mensajes que la persona puede ver (reglas de SCRUM-44).
// Devuelve una funcion para dejar de escuchar.
export function escucharMensajes(
  alCambiar: (evento: "INSERT" | "UPDATE", mensaje: Mensaje) => void,
  conversacionId?: string,
): () => void {
  const canal = supabase
    .channel(`mensajes-${conversacionId ?? "todos"}-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "mensajes",
        ...(conversacionId ? { filter: `conversacion_id=eq.${conversacionId}` } : {}),
      },
      (cambio) => {
        if (cambio.eventType === "INSERT" || cambio.eventType === "UPDATE") {
          alCambiar(cambio.eventType, cambio.new as Mensaje);
        }
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(canal);
  };
}
