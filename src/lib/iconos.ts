import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  Clock3,
  Flame,
  Hand,
  Heart,
  HeartHandshake,
  Medal,
  MessagesSquare,
  Palette,
  Smile,
  Sparkles,
  Star,
  Trophy,
  Users,
  Utensils,
  Video,
} from "lucide-react";

// Iconos que el docente puede elegir para un modulo (SCRUM-33).
// En la base de datos se guarda solo la clave de texto ("hand", "clock"...).
export const ICONOS_MODULO: Record<string, { icono: LucideIcon; nombre: string }> = {
  hand: { icono: Hand, nombre: "Mano" },
  conversacion: { icono: MessagesSquare, nombre: "Conversación" },
  saludo: { icono: HeartHandshake, nombre: "Saludo" },
  tiempo: { icono: Clock3, nombre: "Tiempo" },
  libro: { icono: BookOpen, nombre: "Libro" },
  familia: { icono: Users, nombre: "Familia" },
  emociones: { icono: Smile, nombre: "Emociones" },
  colores: { icono: Palette, nombre: "Colores" },
  comida: { icono: Utensils, nombre: "Comida" },
  corazon: { icono: Heart, nombre: "Corazón" },
  estrella: { icono: Star, nombre: "Estrella" },
};

export const iconoDeModulo = (clave: string | null | undefined): LucideIcon =>
  ICONOS_MODULO[clave ?? ""]?.icono ?? Hand;

// Iconos de las insignias (SCRUM-35).
const ICONOS_INSIGNIA: Record<string, LucideIcon> = {
  hand: Hand,
  video: Video,
  sparkles: Sparkles,
  medal: Medal,
  trophy: Trophy,
  flame: Flame,
  award: Award,
  star: Star,
};

export const iconoDeInsignia = (clave: string | null | undefined): LucideIcon =>
  ICONOS_INSIGNIA[clave ?? ""] ?? Star;
