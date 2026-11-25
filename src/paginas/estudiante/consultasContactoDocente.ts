import { supabase } from "@/lib/supabase";

// Datos de contacto directo de los docentes del estudiante (SCRUM-50).
// Los entrega la funcion mis_docentes de Supabase, que solo incluye a los docentes con los que
// el estudiante tiene al menos una clase (no cancelada). El correo vive en Supabase Auth.

export interface ContactoDocente {
  id: string;
  nombre: string;
  apellido: string;
  avatarUrl: string | null;
  bio: string | null;
  correo: string | null;
  telefono: string | null;
  enlaceClase: string | null;
}

export async function obtenerMisDocentes(): Promise<ContactoDocente[]> {
  const { data, error } = await supabase.rpc("mis_docentes");

  if (error) {
    // PGRST202: la funcion todavia no existe en Supabase.
    if (error.code === "PGRST202") throw new Error("Falta ejecutar el script sql/panel_estudiante.sql en Supabase.");
    throw new Error("No se pudo cargar el contacto de tus docentes. Inténtalo de nuevo.");
  }

  return (
    (data ?? []) as {
      profesor_id: string;
      nombre: string;
      apellido: string;
      avatar_url: string | null;
      bio: string | null;
      correo: string | null;
      telefono: string | null;
      enlace_clase: string | null;
    }[]
  ).map((d) => ({
    id: d.profesor_id,
    nombre: d.nombre,
    apellido: d.apellido,
    avatarUrl: d.avatar_url,
    bio: d.bio,
    correo: d.correo,
    telefono: d.telefono,
    enlaceClase: d.enlace_clase,
  }));
}
