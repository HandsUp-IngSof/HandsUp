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
  lecciones: string[]; // titulos de las lecciones, en orden
  completadas: number; // cuantas lecciones ya termino (las primeras de la lista)
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
    lecciones: ["Clase en vivo: conoce a tu docente", "Practica tu presentación", "Conversación guiada"],
    completadas: 0,
  },
  {
    codigo: "M02",
    titulo: "Alfabeto y deletreo",
    descripcion: "Aprende a presentarte, letra por letra.",
    estado: "en_curso",
    icono: Hand,
    etiqueta: "EN CURSO · MÓDULO 02",
    detalle: "3 de 8 lecciones completadas · 25 min",
    lecciones: [
      "Letras de la A a la E",
      "Letras de la F a la J",
      "Letras de la K a la O",
      "Deletrea tu nombre",
      "Letras de la P a la T",
      "Letras de la U a la Z",
      "Deletreo rápido",
      "Repaso del alfabeto",
    ],
    completadas: 3,
  },
  {
    codigo: "M03",
    titulo: "Saludos y presentaciones",
    descripcion: "El primer paso para encontrarnos en LSC.",
    estado: "disponible",
    icono: MessagesSquare,
    etiqueta: "DISPONIBLE · MÓDULO 03",
    detalle: "8 lecciones · 20 min",
    lecciones: [
      "Hola y adiós",
      "¿Cómo estás?",
      "Mi nombre es…",
      "Por favor y gracias",
      "Presenta a tu familia",
      "Saludos según la hora",
      "Una conversación corta",
      "Repaso de saludos",
    ],
    completadas: 0,
  },
  {
    codigo: "M04",
    titulo: "Números y tiempo",
    descripcion: "Expresa cantidades y organiza tu día.",
    estado: "disponible",
    icono: Clock3,
    etiqueta: "DISPONIBLE · MÓDULO 04",
    detalle: "7 lecciones · 30 min",
    lecciones: [
      "Números del 1 al 10",
      "Números del 11 al 100",
      "Los días de la semana",
      "Los meses del año",
      "¿Qué hora es?",
      "Hoy, ayer y mañana",
      "Repaso de números y tiempo",
    ],
    completadas: 0,
  },
];

// Ruta de la pagina de un modulo: "M02" -> "/estudiante/modulo/m02".
export const rutaModulo = (codigo: string) => `/estudiante/modulo/${codigo.toLowerCase()}`;

export const buscarModulo = (codigo: string | undefined) =>
  modulos.find((m) => m.codigo.toLowerCase() === codigo?.toLowerCase());

// Modulo que el estudiante esta haciendo ahora ("Continuar leccion" lleva ahi).
export const moduloEnCurso = () => modulos.find((m) => m.estado === "en_curso");

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
