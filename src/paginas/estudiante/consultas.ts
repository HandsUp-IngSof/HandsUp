import { supabase } from "@/lib/supabase";
import type { ClaseBD, DatosCrudos, Insignia, LeccionBD, ModuloBD } from "@/paginas/estudiante/modelo";

// =====================================================================
// Consultas a Supabase del panel del estudiante.
// Las reglas de seguridad (RLS) y las funciones de Supabase (ver sql/panel_estudiante.sql)
// garantizan que cada estudiante solo lea y cambie sus propios datos.
// =====================================================================

// Convierte un error de Supabase en un mensaje claro. Los errores que lanzan las funciones
// de la base de datos (raise exception) ya traen un texto pensado para el usuario.
function mensajeDe(error: { code?: string; message: string }, porDefecto: string): Error {
  // 42883 / PGRST202: la funcion no existe. 42P01: la tabla no existe. 42703: la columna no existe.
  if (["42883", "PGRST202", "42P01", "42703", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
    return new Error("Falta ejecutar el script sql/panel_estudiante.sql en Supabase.");
  }
  if (error.code === "P0001" || error.code === "42501") return new Error(error.message);
  return new Error(porDefecto);
}

// ---- Carga general del panel (SCRUM-33) -----------------------------

export async function cargarDatosEstudiante(estudianteId: string): Promise<DatosCrudos> {
  const [modulos, lecciones, progreso, clases, racha, catalogo, obtenidas] = await Promise.all([
    supabase
      .from("modulos")
      .select("id, titulo, descripcion, icono, orden, requiere_clase_bienvenida, duracion_min")
      .eq("esta_habilitado", true)
      .order("orden"),
    supabase
      .from("lecciones")
      .select("id, modulo_id, titulo, descripcion, contenido, video_url, orden")
      .eq("esta_habilitada", true)
      .not("modulo_id", "is", null),
    supabase
      .from("progreso_lecciones")
      .select("leccion_id")
      .eq("estudiante_id", estudianteId)
      .eq("completada", true),
    supabase.rpc("mis_clases"),
    supabase.rpc("mi_racha"),
    supabase.from("insignias").select("id, codigo, nombre, descripcion, icono, criterio, valor").order("orden"),
    supabase.from("insignias_estudiante").select("insignia_id, obtenida_en").eq("estudiante_id", estudianteId),
  ]);

  // Lo esencial: si falla, la pantalla muestra el error.
  if (modulos.error) throw mensajeDe(modulos.error, "No se pudieron cargar los módulos.");
  if (lecciones.error) throw mensajeDe(lecciones.error, "No se pudieron cargar las lecciones.");
  if (progreso.error) throw mensajeDe(progreso.error, "No se pudo cargar tu progreso.");
  if (clases.error) throw mensajeDe(clases.error, "No se pudieron cargar tus clases.");
  // Lo complementario (racha e insignias): si falla, el panel sigue funcionando sin ello.

  const idsModulos = new Set(modulos.data.map((m) => m.id));

  const modulosBD: ModuloBD[] = modulos.data.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    descripcion: m.descripcion,
    icono: m.icono,
    orden: m.orden ?? 0,
    requiereClaseBienvenida: m.requiere_clase_bienvenida === true,
    duracionMin: m.duracion_min,
  }));

  // Solo lecciones de modulos publicados.
  const leccionesBD: LeccionBD[] = lecciones.data
    .filter((l) => l.modulo_id && idsModulos.has(l.modulo_id))
    .map((l) => ({
      id: l.id,
      moduloId: l.modulo_id as string,
      titulo: l.titulo,
      descripcion: l.descripcion,
      contenido: l.contenido,
      videoUrl: l.video_url,
      orden: l.orden ?? 0,
    }));

  const clasesBD: ClaseBD[] = (clases.data ?? []).map(
    (c: {
      reunion_id: string;
      estado: string;
      fecha_inicio: string;
      fecha_fin: string;
      notas: string | null;
      profesor_id: string;
      profesor_nombre: string;
      profesor_apellido: string;
      avatar_url: string | null;
      enlace_clase: string | null;
    }) => ({
      id: c.reunion_id,
      estado: c.estado,
      inicio: new Date(c.fecha_inicio),
      fin: new Date(c.fecha_fin),
      notas: c.notas,
      docenteId: c.profesor_id,
      docente: `${c.profesor_nombre} ${c.profesor_apellido}`.trim(),
      avatarUrl: c.avatar_url,
      enlace: c.enlace_clase,
    }),
  );

  const fechasObtenidas = new Map<string, Date>(
    (obtenidas.data ?? []).map((o) => [o.insignia_id as string, new Date(o.obtenida_en as string)]),
  );
  const insignias: Insignia[] = (catalogo.data ?? []).map((i) => ({
    id: i.id,
    codigo: i.codigo,
    nombre: i.nombre,
    descripcion: i.descripcion,
    icono: i.icono,
    criterio: i.criterio,
    valor: i.valor,
    obtenidaEn: fechasObtenidas.get(i.id) ?? null,
  }));

  return {
    modulos: modulosBD,
    lecciones: leccionesBD,
    completadas: new Set(progreso.data.map((p) => p.leccion_id as string)),
    clases: clasesBD,
    racha: typeof racha.data === "number" ? racha.data : 0,
    insignias,
  };
}

// ---- Progreso (SCRUM-34) ---------------------------------------------

// Marca una leccion como completada. Supabase valida las reglas (orden de las lecciones y
// clase de bienvenida) y, con un trigger, otorga las insignias que correspondan (SCRUM-35).
export async function completarLeccion(leccionId: string): Promise<void> {
  const { error } = await supabase.rpc("completar_leccion", { p_leccion_id: leccionId });
  if (error) throw mensajeDe(error, "No se pudo guardar tu avance. Inténtalo de nuevo.");
}

// ---- Agendamiento de clases (SCRUM-39) -------------------------------

export interface HorarioLibre {
  id: string;
  docenteId: string;
  docente: string;
  avatarUrl: string | null;
  inicio: Date;
  fin: Date;
}

export async function obtenerHorariosLibres(): Promise<HorarioLibre[]> {
  const { data, error } = await supabase.rpc("horarios_para_estudiante");
  if (error) throw mensajeDe(error, "No se pudieron cargar los horarios disponibles.");

  return (
    (data ?? []) as {
      horario_id: string;
      profesor_id: string;
      profesor_nombre: string;
      profesor_apellido: string;
      avatar_url: string | null;
      fecha_inicio: string;
      fecha_fin: string;
    }[]
  ).map((h) => ({
    id: h.horario_id,
    docenteId: h.profesor_id,
    docente: `${h.profesor_nombre} ${h.profesor_apellido}`.trim(),
    avatarUrl: h.avatar_url,
    inicio: new Date(h.fecha_inicio),
    fin: new Date(h.fecha_fin),
  }));
}

export async function agendarClase(horarioId: string): Promise<void> {
  const { error } = await supabase.rpc("agendar_clase", { p_horario_id: horarioId });
  if (error) throw mensajeDe(error, "No se pudo agendar la clase. Inténtalo de nuevo.");
}

export async function cancelarClase(reunionId: string): Promise<void> {
  const { error } = await supabase.rpc("cancelar_clase", { p_reunion_id: reunionId });
  if (error) throw mensajeDe(error, "No se pudo cancelar la clase. Inténtalo de nuevo.");
}
