// =====================================================================
// DATOS DE EJEMPLO DEL PANEL DOCENTE
// Se usan mientras se implementan los requisitos correspondientes.
// Al hacer cada requisito, reemplazar su parte por la consulta a Supabase.
// =====================================================================

// Contadores del saludo. Pendiente: tarea "Resumen de actividad del docente".
export const resumenEjemplo = {
  estudiantesActivos: 12,
  clasesSemana: 5,
};

// Cuadricula de disponibilidad. Pendiente: SCRUM-41.
export type EstadoBloque = "vacio" | "disponible" | "reservado";

export interface Bloque {
  estado: EstadoBloque;
  estudiante?: string;
}

export const HORAS_EJEMPLO = ["9:00", "10:00", "16:00"];

const vacio: Bloque = { estado: "vacio" };
const disponible: Bloque = { estado: "disponible" };

// Filas = horas, columnas = lunes a viernes de la semana actual.
export const disponibilidadEjemplo: Bloque[][] = [
  [vacio, vacio, disponible, vacio, { estado: "reservado", estudiante: "Andrés" }],
  [vacio, vacio, disponible, { estado: "reservado", estudiante: "Sofía" }, vacio],
  [vacio, vacio, vacio, { estado: "reservado", estudiante: "Valentina" }, disponible],
];

// Proxima clase. Pendiente: tarea "Visualización de la próxima clase del docente".
export const proximaClaseEjemplo = {
  titulo: "Saludos con Sofía",
  fecha: "Jueves, 22 de octubre",
  horario: "10:00–10:45 a. m. · Clase individual",
  nota: "Mañana también tienes la bienvenida de Valentina a las 4:00 p. m.",
};

// Lista de estudiantes. Pendiente: SCRUM-42.
export interface EstudianteResumen {
  nombre: string;
  modulo: string;
  progreso: number;
  proximaClase: string;
  estado: string;
  requiereAtencion: boolean;
}

export const estudiantesEjemplo: EstudianteResumen[] = [
  {
    nombre: "Valentina Gómez",
    modulo: "Alfabeto y deletreo",
    progreso: 14,
    proximaClase: "Mañana · 4:00 p. m.",
    estado: "Bienvenida pendiente",
    requiereAtencion: true,
  },
  {
    nombre: "Sofía Ramírez",
    modulo: "Saludos y presentaciones",
    progreso: 45,
    proximaClase: "Mañana · 10:00 a. m.",
    estado: "Al día",
    requiereAtencion: false,
  },
  {
    nombre: "Andrés Torres",
    modulo: "Números y tiempo",
    progreso: 68,
    proximaClase: "Viernes · 9:00 a. m.",
    estado: "Al día",
    requiereAtencion: false,
  },
];
