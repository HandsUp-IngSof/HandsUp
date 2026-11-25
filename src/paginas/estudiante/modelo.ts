import type { LucideIcon } from "lucide-react";

import { iconoDeModulo } from "@/lib/iconos";

// =====================================================================
// Modelo y calculos del panel del estudiante (SCRUM-33, 34, 35 y 39).
// Aqui NO se consulta Supabase: reciben los datos ya cargados (consultas.ts)
// y devuelven lo que las pantallas necesitan mostrar.
// =====================================================================

// ---- Datos tal como vienen de la base de datos ----------------------

export interface ModuloBD {
  id: string;
  titulo: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
  requiereClaseBienvenida: boolean;
  duracionMin: number | null;
}

export interface LeccionBD {
  id: string;
  moduloId: string;
  titulo: string;
  descripcion: string | null;
  contenido: string | null;
  videoUrl: string | null;
  orden: number;
}

export interface ClaseBD {
  id: string;
  estado: string; // pendiente | confirmada | completada | cancelada
  inicio: Date;
  fin: Date;
  notas: string | null;
  docenteId: string;
  docente: string;
  avatarUrl: string | null;
  enlace: string | null;
}

export interface Insignia {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  criterio: "lecciones" | "modulos" | "racha" | "clases";
  valor: number;
  obtenidaEn: Date | null; // null = todavia no la tiene
}

export interface DatosCrudos {
  modulos: ModuloBD[];
  lecciones: LeccionBD[];
  completadas: Set<string>; // ids de lecciones completadas
  clases: ClaseBD[];
  racha: number;
  insignias: Insignia[];
}

// ---- Datos listos para mostrar --------------------------------------

export type EstadoModulo = "bloqueado" | "en_curso" | "disponible" | "completado";
export type EstadoLeccion = "completada" | "siguiente" | "bloqueada";

export interface LeccionVista extends LeccionBD {
  numero: number;
  estado: EstadoLeccion;
}

export interface ModuloVista {
  id: string;
  codigo: string; // "M01"
  titulo: string;
  descripcion: string;
  estado: EstadoModulo;
  icono: LucideIcon;
  etiqueta: string; // texto de la esquina: "EN CURSO · MÓDULO 02"
  detalle: string; // "3 de 8 lecciones completadas · 25 min"
  enVivo: boolean;
  lecciones: LeccionVista[];
  completadas: number;
  total: number;
}

export interface Progreso {
  porcentaje: number;
  completadas: number;
  total: number;
  racha: number; // dias seguidos practicando
}

export interface SiguientePaso {
  titulo: string;
  detalle: string;
  ruta: string;
  textoBoton: string;
}

export interface VistaEstudiante {
  modulos: ModuloVista[];
  progreso: Progreso;
  siguientePaso: SiguientePaso;
  moduloActual: ModuloVista | undefined;
  // Clase mas importante para mostrar en el inicio: la proxima, o null si no tiene ninguna.
  claseDestacada: ClaseBD | null;
  bienvenidaCumplida: boolean;
  clasesProximas: ClaseBD[];
  clasesPasadas: ClaseBD[];
  insignias: Insignia[];
}

// ---- Utilidades ------------------------------------------------------

// Ruta de la pagina de un modulo.
export const rutaModulo = (id: string) => `/estudiante/modulo/${id}`;

const dosDigitos = (n: number) => String(n).padStart(2, "0");

export const claseActiva = (c: ClaseBD) => c.estado !== "cancelada";

// La clase de bienvenida se cumple con una clase no cancelada que ya termino
// (misma regla que la funcion clase_bienvenida_cumplida de Supabase).
export function hayBienvenidaCumplida(clases: ClaseBD[], ahora = new Date()): boolean {
  return clases.some((c) => claseActiva(c) && (c.estado === "completada" || c.fin < ahora));
}

// Lecciones ordenadas como en la base de datos: por "orden" y, si empatan, por id.
const porOrden = (a: LeccionBD, b: LeccionBD) => a.orden - b.orden || (a.id < b.id ? -1 : 1);

// ---- Calculo principal ----------------------------------------------

export function construirVista(datos: DatosCrudos, ahora = new Date()): VistaEstudiante {
  const bienvenidaCumplida = hayBienvenidaCumplida(datos.clases, ahora);
  const modulosOrdenados = [...datos.modulos].sort((a, b) => a.orden - b.orden);

  // 1. Cada modulo con sus lecciones y su estado.
  const modulos: ModuloVista[] = modulosOrdenados.map((modulo, indice) => {
    const bloqueado = modulo.requiereClaseBienvenida && !bienvenidaCumplida;
    const lecciones = datos.lecciones.filter((l) => l.moduloId === modulo.id).sort(porOrden);
    const completadas = lecciones.filter((l) => datos.completadas.has(l.id)).length;
    const total = lecciones.length;

    let estado: EstadoModulo;
    if (bloqueado) estado = "bloqueado";
    else if (total > 0 && completadas === total) estado = "completado";
    else if (completadas > 0) estado = "en_curso";
    else estado = "disponible";

    // Las lecciones se abren en orden: las terminadas, la siguiente y el resto bloqueadas.
    let siguienteAsignada = false;
    const leccionesVista: LeccionVista[] = lecciones.map((leccion, i) => {
      let estadoLeccion: EstadoLeccion;
      if (datos.completadas.has(leccion.id)) estadoLeccion = "completada";
      else if (!bloqueado && !siguienteAsignada) {
        estadoLeccion = "siguiente";
        siguienteAsignada = true;
      } else estadoLeccion = "bloqueada";
      return { ...leccion, numero: i + 1, estado: estadoLeccion };
    });

    const numero = dosDigitos(indice + 1);
    const duracion = modulo.duracionMin ? ` · ${modulo.duracionMin} min` : "";
    const enVivo = modulo.requiereClaseBienvenida;

    const etiqueta = {
      bloqueado: `BLOQUEADO${enVivo ? " · EN VIVO" : ""}`,
      en_curso: `EN CURSO · MÓDULO ${numero}`,
      disponible: `DISPONIBLE · MÓDULO ${numero}`,
      completado: `COMPLETADO · MÓDULO ${numero}`,
    }[estado];

    let detalle: string;
    if (estado === "bloqueado") detalle = "Se habilita después de tu clase de bienvenida.";
    else if (total === 0) detalle = "Muy pronto tendrá lecciones.";
    else if (estado === "en_curso") detalle = `${completadas} de ${total} lecciones completadas${duracion}`;
    else if (estado === "completado") detalle = `${total} ${total === 1 ? "lección completada" : "lecciones completadas"}${duracion}`;
    else detalle = `${total} ${total === 1 ? "lección" : "lecciones"}${duracion}`;

    return {
      id: modulo.id,
      codigo: `M${numero}`,
      titulo: modulo.titulo,
      descripcion: modulo.descripcion ?? "",
      estado,
      icono: iconoDeModulo(modulo.icono),
      etiqueta,
      detalle,
      enVivo,
      lecciones: leccionesVista,
      completadas,
      total,
    };
  });

  // 2. Progreso general (SCRUM-34): lecciones completadas sobre todas las publicadas.
  const total = modulos.reduce((suma, m) => suma + m.total, 0);
  const completadas = modulos.reduce((suma, m) => suma + m.completadas, 0);
  const progreso: Progreso = {
    porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0,
    completadas,
    total,
    racha: datos.racha,
  };

  // 3. Modulo actual: el que ya empezo o, si no hay, el primero disponible con lecciones.
  const moduloActual =
    modulos.find((m) => m.estado === "en_curso") ?? modulos.find((m) => m.estado === "disponible" && m.total > 0);

  // 4. Clases (SCRUM-39)
  const ahoraMs = ahora.getTime();
  const activas = datos.clases.filter(claseActiva);
  const clasesProximas = activas.filter((c) => c.fin.getTime() >= ahoraMs && c.estado !== "completada");
  const clasesPasadas = datos.clases
    .filter((c) => !clasesProximas.includes(c))
    .sort((a, b) => b.inicio.getTime() - a.inicio.getTime());
  const claseDestacada = clasesProximas[0] ?? null;

  // 5. "Tu siguiente paso"
  let siguientePaso: SiguientePaso;
  const siguienteLeccion = moduloActual?.lecciones.find((l) => l.estado === "siguiente");
  if (moduloActual && siguienteLeccion) {
    siguientePaso = {
      titulo: siguienteLeccion.titulo,
      detalle: `Lección ${siguienteLeccion.numero} de ${moduloActual.titulo}.`,
      ruta: rutaModulo(moduloActual.id),
      textoBoton: completadas > 0 ? "Continuar lección" : "Empezar a aprender",
    };
  } else if (modulos.length > 0 && modulos.every((m) => m.estado === "bloqueado")) {
    siguientePaso = {
      titulo: "Agenda tu clase de bienvenida.",
      detalle: "Conoce a tu docente en vivo y activa tus módulos de conversación.",
      ruta: "/estudiante/clases",
      textoBoton: "Agendar clase",
    };
  } else if (total > 0 && completadas === total) {
    siguientePaso = {
      titulo: "¡Completaste todas las lecciones!",
      detalle: "Repasa lo aprendido o agenda una clase en vivo para practicar.",
      ruta: "/estudiante/clases",
      textoBoton: "Ver mis clases",
    };
  } else {
    siguientePaso = {
      titulo: "Tu docente está preparando nuevas lecciones.",
      detalle: "Mientras tanto, puedes agendar una clase en vivo.",
      ruta: "/estudiante/clases",
      textoBoton: "Ver mis clases",
    };
  }

  return {
    modulos,
    progreso,
    siguientePaso,
    moduloActual,
    claseDestacada,
    bienvenidaCumplida,
    clasesProximas,
    clasesPasadas,
    insignias: datos.insignias,
  };
}

// ---- Consejo del dia ("5 minutos para ti") ---------------------------

const CONSEJOS = [
  "Practica frente al espejo las letras de tu nombre. ¡Sin afán!",
  "Repasa hoy tres señas del último módulo y úsalas en una frase.",
  "Las expresiones de la cara también son parte de la seña: exagéralas al practicar.",
  "Graba un video corto de tus manos y compáralo con el de la lección.",
  "Practica con alguien de tu casa: enséñale una seña nueva.",
  "Dedica 5 minutos a deletrear objetos que veas a tu alrededor.",
  "Mira la lección sin sonido e intenta entender solo con las señas.",
];

export function consejoDelDia(fecha = new Date()): string {
  const inicioAnio = new Date(fecha.getFullYear(), 0, 0);
  const dia = Math.floor((fecha.getTime() - inicioAnio.getTime()) / 86_400_000);
  return CONSEJOS[dia % CONSEJOS.length];
}
