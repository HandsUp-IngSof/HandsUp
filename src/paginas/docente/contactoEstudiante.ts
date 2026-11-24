import { supabase } from "@/lib/supabase";

// Datos de contacto directo de un estudiante (SCRUM-51).
// Se piden a la funcion contacto_estudiante de Supabase, que solo los entrega si el
// estudiante tiene al menos una clase (no cancelada) con el docente que pregunta.
// El correo vive en Supabase Auth y nunca se expone en la tabla perfiles.

export interface ContactoEstudiante {
  nombre: string;
  apellido: string;
  correo: string | null;
  telefono: string | null;
  avatar_url: string | null;
}

export async function obtenerContactoEstudiante(idEstudiante: string): Promise<ContactoEstudiante> {
  const { data, error } = await supabase.rpc("contacto_estudiante", { p_estudiante: idEstudiante });

  if (error) {
    // PGRST202: la funcion todavia no existe en Supabase.
    if (error.code === "PGRST202") throw new Error("Falta crear la función contacto_estudiante en Supabase.");
    throw new Error("No se pudo cargar el contacto. Inténtalo de nuevo.");
  }

  const fila = (data as ContactoEstudiante[] | null)?.[0];
  if (!fila) throw new Error("Solo puedes ver el contacto de los estudiantes que tienen clases contigo.");
  return fila;
}

// Enlace de WhatsApp con un saludo listo. El numero se guarda sin el +57.
export function enlaceWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`;
}

export function enlaceCorreo(correo: string, asunto: string, mensaje: string): string {
  return `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
}
