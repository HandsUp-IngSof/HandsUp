import { supabase } from "@/lib/supabase";
import { nombresDe } from "@/paginas/docente/consultas";

// Reservas de los estudiantes que el docente debe confirmar o rechazar (SCRUM-39).
// La funcion responder_reserva de Supabase (basedatos/SCRUM-39-confirmar-reservas.sql)
// revisa que sea el docente de la clase y que la clase siga pendiente y en el futuro.

export interface ReservaPendiente {
  id: string;
  estudianteId: string;
  estudiante: string;
  inicio: Date;
  fin: Date;
  notas: string | null;
}

export async function obtenerReservasPendientes(profesorId: string): Promise<ReservaPendiente[]> {
  const { data, error } = await supabase
    .from("reuniones")
    .select("id, estudiante_id, fecha_inicio, fecha_fin, notas")
    .eq("profesor_id", profesorId)
    .eq("estado", "pendiente")
    .gte("fecha_inicio", new Date().toISOString())
    .order("fecha_inicio");
  if (error) throw new Error("No se pudieron cargar las reservas por confirmar.");
  if (data.length === 0) return [];

  const nombres = await nombresDe([...new Set(data.map((r) => r.estudiante_id as string))]);
  return data.map((r) => ({
    id: r.id,
    estudianteId: r.estudiante_id,
    estudiante: nombres.get(r.estudiante_id) ?? "Estudiante",
    inicio: new Date(r.fecha_inicio),
    fin: new Date(r.fecha_fin),
    notas: r.notas,
  }));
}

export async function responderReserva(reunionId: string, confirmar: boolean): Promise<void> {
  const { error } = await supabase.rpc("responder_reserva", { p_reunion_id: reunionId, p_confirmar: confirmar });
  if (!error) return;
  if (["42883", "PGRST202"].includes(error.code ?? "")) {
    throw new Error("Falta crear la función responder_reserva en Supabase (SQL de SCRUM-39).");
  }
  if (error.code === "P0001") throw new Error(error.message);
  throw new Error("No se pudo responder la reserva. Inténtalo de nuevo.");
}
