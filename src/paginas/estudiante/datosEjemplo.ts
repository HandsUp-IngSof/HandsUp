import type { LucideIcon } from "lucide-react";
import { Clock3, Hand, HeartHandshake, MessagesSquare } from "lucide-react";

// =====================================================================
// Datos de EJEMPLO de la maqueta del panel del estudiante (SCRUM-58).
// Todo lo de este archivo se reemplaza por datos reales de Supabase:
//   - siguientePaso y modulos ........ SCRUM-33 (dashboard personalizado)
//   - progreso ....................... SCRUM-34 (calculo del progreso)
//   - progreso.racha ................. SCRUM-35 (reconocimientos e insignias)
//   - claseBienvenida ................ SCRUM-39 (agendamiento de clases)
// =====================================================================

export interface SiguientePaso {
  titulo: string;
  leccion: string;
}

export type EstadoModulo = "bloqueado" | "en_curso" | "disponible";

export interface Modulo {
  codigo: string; // "M01"
  titulo: string;
  descripcion: string;
  estado: EstadoModulo;
  icono: LucideIcon;
  etiqueta: string; // texto de la esquina: "EN CURSO · MÓDULO 02"
  detalle: string; // "3 de 8 lecciones completadas · 25 min"
  enVivo?: boolean;
}

export interface Progreso {
  porcentaje: number;
  completadas: number;
  total: number;
  racha: number; // dias seguidos practicando
}

export interface ClaseBienvenida {
  docente: string;
  fecha: string;
  horario: string;
}

export const siguientePaso: SiguientePaso = {
  titulo: "Cada letra cuenta una historia.",
  leccion: "Lección 4: deletrea tu nombre en LSC.",
};

export const modulos: Modulo[] = [
  {
    codigo: "M01",
    titulo: "Tu primera conversación",
    descripcion: "Practica en vivo lo que aprendes con tu docente.",
    estado: "bloqueado",
    icono: HeartHandshake,
    etiqueta: "BLOQUEADO · EN VIVO",
    detalle: "Se habilita después de tu clase de bienvenida.",
    enVivo: true,
  },
  {
    codigo: "M02",
    titulo: "Alfabeto y deletreo",
    descripcion: "Aprende a presentarte, letra por letra.",
    estado: "en_curso",
    icono: Hand,
    etiqueta: "EN CURSO · MÓDULO 02",
    detalle: "3 de 8 lecciones completadas · 25 min",
  },
  {
    codigo: "M03",
    titulo: "Saludos y presentaciones",
    descripcion: "El primer paso para encontrarnos en LSC.",
    estado: "disponible",
    icono: MessagesSquare,
    etiqueta: "DISPONIBLE · MÓDULO 03",
    detalle: "8 lecciones · 20 min",
  },
  {
    codigo: "M04",
    titulo: "Números y tiempo",
    descripcion: "Expresa cantidades y organiza tu día.",
    estado: "disponible",
    icono: Clock3,
    etiqueta: "DISPONIBLE · MÓDULO 04",
    detalle: "7 lecciones · 30 min",
  },
];

export const progreso: Progreso = {
  porcentaje: 14,
  completadas: 3,
  total: 22,
  racha: 3,
};

export const claseBienvenida: ClaseBienvenida = {
  docente: "Laura Martínez",
  fecha: "Jueves, 22 de octubre",
  horario: "4:00–4:30 p. m. · Hora de Colombia",
};

export const consejoDelDia = "Practica frente al espejo las letras de tu nombre. ¡Sin afán!";
