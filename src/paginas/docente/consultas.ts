import { supabase } from "@/lib/supabase";

// =====================================================================
// Consultas a Supabase de la disponibilidad del docente (SCRUM-41).
// Las politicas RLS (SCRUM-32) garantizan que cada docente solo lea
// sus propios horarios y reuniones.
// =====================================================================

// Hora en formato de la cuadricula: "9:00", "10:00", "16:00".
export function claveHora(fecha: Date): string {
  return `${fecha.getHours()}:${String(fecha.getMinutes()).padStart(2, "0")}`;
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

// Lunes a las 00:00 de la semana actual, movido "desplazamiento" semanas.
export function lunesDeLaSemana(desplazamiento = 0): Date {
  const hoy = new Date();
  const diaSemana = (hoy.getDay() + 6) % 7; // 0 = lunes ... 6 = domingo
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diaSemana + desplazamiento * 7);
}

// Solo las reuniones que no estan canceladas (incluye las que no tienen estado).
export const NO_CANCELADA = "estado.is.null,estado.neq.cancelada";

// Nombre completo de cada perfil, por id.
export async function nombresDe(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.from("perfiles").select("id, nombre, apellido").in("id", ids);
  if (error) throw new Error("No se pudieron cargar los nombres de los estudiantes.");
  return new Map(data.map((p) => [p.id, `${p.nombre} ${p.apellido}`.trim()]));
}

export interface HorarioSemana {
  id: string;
  inicio: Date;
  disponible: boolean;
  estudiante?: string; // nombre del estudiante si el horario tiene una clase agendada
}

// Horarios del docente de una semana (lunes a viernes), con el estudiante si ya esta reservado.
export async function obtenerHorariosSemana(profesorId: string, lunes: Date): Promise<HorarioSemana[]> {
  const sabado = sumarDias(lunes, 5);

  const { data: horarios, error } = await supabase
    .from("horarios_disponibles")
    .select("id, fecha_inicio, esta_disponible")
    .eq("profesor_id", profesorId)
    .gte("fecha_inicio", lunes.toISOString())
    .lt("fecha_inicio", sabado.toISOString())
    .order("fecha_inicio");
  if (error) throw new Error("No se pudieron cargar tus horarios.");
  if (horarios.length === 0) return [];

  const { data: reservas, error: errorReservas } = await supabase
    .from("reuniones")
    .select("horario_id, estudiante_id")
    .in("horario_id", horarios.map((h) => h.id))
    .or(NO_CANCELADA);
  if (errorReservas) throw new Error("No se pudieron cargar las clases agendadas.");

  const nombres = await nombresDe([...new Set(reservas.map((r) => r.estudiante_id))]);

  return horarios.map((h) => {
    const reserva = reservas.find((r) => r.horario_id === h.id);
    const nombre = reserva ? nombres.get(reserva.estudiante_id) : undefined;
    return {
      id: h.id,
      inicio: new Date(h.fecha_inicio),
      disponible: h.esta_disponible === true && !reserva,
      estudiante: nombre?.split(" ")[0],
    };
  });
}
