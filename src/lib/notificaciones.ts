import { supabase } from "@/lib/supabase";

// =====================================================================
// Notificaciones y alertas multicanal (SCRUM-49).
// La tabla notificaciones la llenan triggers de Supabase (basedatos/SCRUM-49-notificaciones.sql).
// Canales: 1) campana del encabezado, 2) aviso emergente dentro de la app,
//          3) notificacion del navegador (si la persona da permiso).
// =====================================================================

export type TipoNotificacion = "mensaje" | "clase" | "sistema";

export interface Notificacion {
  id: string;
  usuario_id: string;
  tipo: TipoNotificacion;
  titulo: string;
  texto: string | null;
  enlace: string | null;
  leida: boolean;
  creado_en: string;
}

const COLUMNAS = "id, usuario_id, tipo, titulo, texto, enlace, leida, creado_en";

export async function obtenerNotificaciones(): Promise<Notificacion[]> {
  const { data, error } = await supabase
    .from("notificaciones")
    .select(COLUMNAS)
    .order("creado_en", { ascending: false })
    .limit(30);
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") {
      throw new Error("Falta crear las notificaciones en Supabase (SQL de SCRUM-49).");
    }
    throw new Error("No se pudieron cargar las notificaciones.");
  }
  return data as Notificacion[];
}

export async function marcarNotificacionLeida(id: string): Promise<void> {
  await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
}

export async function marcarTodasLeidas(usuarioId: string): Promise<void> {
  await supabase.from("notificaciones").update({ leida: true }).eq("usuario_id", usuarioId).eq("leida", false);
}

// Escucha las notificaciones nuevas o actualizadas de la persona. Devuelve una funcion para dejar de escuchar.
export function escucharNotificaciones(usuarioId: string, alCambiar: (n: Notificacion, nueva: boolean) => void): () => void {
  const canal = supabase
    .channel(`notificaciones-${usuarioId}-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notificaciones", filter: `usuario_id=eq.${usuarioId}` },
      (cambio) => {
        if (cambio.eventType === "INSERT" || cambio.eventType === "UPDATE") {
          const n = cambio.new as Notificacion;
          // Es "nueva" si llega sin leer (un mensaje nuevo tambien actualiza el aviso que ya existia).
          alCambiar(n, !n.leida);
        }
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(canal);
  };
}

// ---------------------------------------------------------------------
// Canal 3: notificaciones del navegador
// ---------------------------------------------------------------------
export type PermisoNavegador = "no-soportado" | "default" | "granted" | "denied";

export function permisoNavegador(): PermisoNavegador {
  if (typeof window === "undefined" || !("Notification" in window)) return "no-soportado";
  return Notification.permission;
}

export async function pedirPermisoNavegador(): Promise<PermisoNavegador> {
  if (permisoNavegador() === "no-soportado") return "no-soportado";
  return Notification.requestPermission();
}

// Solo se muestra cuando la pestaña de handsUp no esta a la vista (si esta a la vista, basta el aviso de la app).
export function mostrarEnNavegador(n: Notificacion, alAbrir: () => void): void {
  if (permisoNavegador() !== "granted" || document.visibilityState === "visible") return;
  try {
    const aviso = new Notification(n.titulo, { body: n.texto ?? undefined, icon: "/favicon.png", tag: n.id });
    aviso.onclick = () => {
      window.focus();
      alAbrir();
      aviso.close();
    };
  } catch {
    // Algunos navegadores no permiten crear avisos desde la pagina; la campana y el aviso de la app siguen funcionando.
  }
}

// "hace un momento", "hace 5 min", "hace 2 h", "ayer", "20 nov"
const formatoCorto = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });
export function hace(iso: string): string {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return "hace un momento";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  if (horas < 48) return "ayer";
  return formatoCorto.format(new Date(iso));
}
