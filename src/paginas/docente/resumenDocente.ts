import { supabase } from "@/lib/supabase";
import { lunesDeLaSemana, nombresDe, NO_CANCELADA, sumarDias } from "@/paginas/docente/consultas";

// =====================================================================
// Resumen del docente (SCRUM-42): estudiantes asignados con su avance,
// proxima clase y contadores. Un estudiante "asignado" es el que tiene
// al menos una clase agendada con el docente.
// =====================================================================

const formatoHora = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" });
const formatoDia = new Intl.DateTimeFormat("es-CO", { weekday: "long" });
const formatoFechaLarga = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });
const formatoFechaCorta = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

// "Hoy · 4:00 p. m.", "Mañana · 10:00 a. m.", "Viernes · 9:00 a. m." o "3 dic · 9:00 a. m."
function fechaRelativa(fecha: Date): string {
  const hoy = new Date();
  const hora = formatoHora.format(fecha);
  const dias = Math.round((sumarDias(fecha, 0).getTime() - sumarDias(hoy, 0).getTime()) / 86_400_000);
  if (dias === 0) return `Hoy · ${hora}`;
  if (dias === 1) return `Mañana · ${hora}`;
  if (dias > 1 && dias < 7) return `${capitalizar(formatoDia.format(fecha))} · ${hora}`;
  return `${formatoFechaCorta.format(fecha)} · ${hora}`;
}

export interface EstudianteResumen {
  id: string;
  nombre: string;
  modulo: string;
  progreso: number;
  proximaClase: string;
  // Momento de la proxima clase (milisegundos) o null si no tiene. Se usa para ordenar.
  proximaInicio: number | null;
  estado: string;
  requiereAtencion: boolean;
}

export interface ProximaClase {
  titulo: string;
  fecha: string;
  horario: string;
  nota?: string;
}

export interface ResumenDocente {
  estudiantes: EstudianteResumen[];
  clasesSemana: number;
  proximaClase: ProximaClase | null;
}

export async function obtenerResumenDocente(profesorId: string): Promise<ResumenDocente> {
  const { data: reuniones, error } = await supabase
    .from("reuniones")
    .select("estudiante_id, fecha_inicio, fecha_fin, estado, notas")
    .eq("profesor_id", profesorId)
    .or(NO_CANCELADA)
    .order("fecha_inicio");
  if (error) throw new Error("No se pudieron cargar tus clases.");

  const idsEstudiantes = [...new Set(reuniones.map((r) => r.estudiante_id))];
  const ahora = new Date();
  const lunes = lunesDeLaSemana();
  const siguienteLunes = sumarDias(lunes, 7);

  const clasesSemana = reuniones.filter((r) => {
    const inicio = new Date(r.fecha_inicio);
    return inicio >= lunes && inicio < siguienteLunes;
  }).length;

  // Clases que aun no han empezado y no estan completadas, en orden de fecha.
  const futuras = reuniones.filter((r) => new Date(r.fecha_inicio) >= ahora && r.estado !== "completada");

  if (idsEstudiantes.length === 0) {
    return { estudiantes: [], clasesSemana, proximaClase: null };
  }

  const [nombres, lecciones, progreso] = await Promise.all([
    nombresDe(idsEstudiantes),
    supabase.from("lecciones").select("id, titulo, orden").eq("esta_habilitada", true).order("orden"),
    supabase
      .from("progreso_lecciones")
      .select("estudiante_id, leccion_id")
      .in("estudiante_id", idsEstudiantes)
      .eq("completada", true),
  ]);
  if (lecciones.error) throw new Error("No se pudieron cargar las lecciones.");
  if (progreso.error) throw new Error("No se pudo cargar el progreso de los estudiantes.");

  const totalLecciones = lecciones.data.length;

  const estudiantes: EstudianteResumen[] = idsEstudiantes
    .map((id) => {
    const completadas = new Set(
      progreso.data.filter((p) => p.estudiante_id === id).map((p) => p.leccion_id),
    );
    const siguiente = lecciones.data.find((l) => !completadas.has(l.id));
    const proxima = futuras.find((r) => r.estudiante_id === id);
    const porConfirmar = proxima?.estado === "pendiente";

    return {
      id,
      nombre: nombres.get(id) ?? "Estudiante",
      modulo: siguiente?.titulo ?? (totalLecciones > 0 ? "Completó todas las lecciones" : "Sin lecciones"),
      progreso: totalLecciones > 0 ? Math.round((completadas.size / totalLecciones) * 100) : 0,
      proximaClase: proxima ? fechaRelativa(new Date(proxima.fecha_inicio)) : "Sin clase agendada",
      proximaInicio: proxima ? new Date(proxima.fecha_inicio).getTime() : null,
      estado: porConfirmar ? "Clase por confirmar" : proxima ? "Al día" : "Sin clases próximas",
      requiereAtencion: porConfirmar,
    };
    })
    // Primero quien tiene la clase mas cercana; los que no tienen clase proxima van al final,
    // en orden alfabetico.
    .sort((a, b) => {
      if (a.proximaInicio !== null && b.proximaInicio !== null) return a.proximaInicio - b.proximaInicio;
      if (a.proximaInicio !== null) return -1;
      if (b.proximaInicio !== null) return 1;
      return a.nombre.localeCompare(b.nombre, "es");
    });

  let proximaClase: ProximaClase | null = null;
  if (futuras.length > 0) {
    const clase = futuras[0];
    const inicio = new Date(clase.fecha_inicio);
    const fin = new Date(clase.fecha_fin);
    const nombre = (nombres.get(clase.estudiante_id) ?? "tu estudiante").split(" ")[0];
    const despues = futuras[1];

    proximaClase = {
      titulo: `${clase.notas ?? "Clase"} con ${nombre}`,
      fecha: capitalizar(formatoFechaLarga.format(inicio)),
      horario: `${formatoHora.format(inicio)} – ${formatoHora.format(fin)} · Clase individual`,
      nota: despues
        ? `Después tienes clase con ${(nombres.get(despues.estudiante_id) ?? "otro estudiante").split(" ")[0]}: ${fechaRelativa(new Date(despues.fecha_inicio)).toLowerCase()}`
        : undefined,
    };
  }

  return { estudiantes, clasesSemana, proximaClase };
}
