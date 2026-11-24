import { supabase } from "@/lib/supabase";

// =====================================================================
// Foto de perfil (SCRUM-45). Las fotos se guardan en Supabase Storage,
// en el bucket "avatares", dentro de una carpeta con el id del usuario:
//   avatares/<id-del-usuario>/avatar
// Las reglas de Storage solo dejan a cada usuario modificar su propia carpeta.
// =====================================================================

const BUCKET = "avatares";

const rutaDe = (idUsuario: string) => `${idUsuario}/avatar`;

function traducirErrorFoto(mensaje: string): string {
  const texto = mensaje.toLowerCase();
  if (texto.includes("bucket not found")) {
    return "El espacio para fotos todavía no está configurado en Supabase.";
  }
  if (texto.includes("maximum allowed size") || texto.includes("too large")) {
    return "La imagen supera el tamaño permitido (2 MB).";
  }
  if (texto.includes("mime type") || texto.includes("not supported")) {
    return "Usa una imagen JPG, PNG o WEBP.";
  }
  if (texto.includes("row-level security") || texto.includes("unauthorized") || texto.includes("403")) {
    return "No tienes permiso para cambiar esta foto. Vuelve a iniciar sesión.";
  }
  return "No se pudo subir la foto. Intenta de nuevo.";
}

// Guarda la direccion de la foto en perfiles.avatar_url (o null para quitarla).
async function guardarEnPerfil(idUsuario: string, url: string | null): Promise<void> {
  const { data, error } = await supabase
    .from("perfiles")
    .update({ avatar_url: url })
    .eq("id", idUsuario)
    .select("id");
  if (error || data.length === 0) {
    throw new Error("No se pudo actualizar la foto en tu perfil. Intenta de nuevo.");
  }
}

// Sube la foto del usuario (reemplaza la anterior) y devuelve su direccion publica.
export async function subirFotoPerfil(idUsuario: string, archivo: File): Promise<string> {
  const ruta = rutaDe(idUsuario);

  const { error } = await supabase.storage.from(BUCKET).upload(ruta, archivo, {
    upsert: true,
    contentType: archivo.type,
    cacheControl: "3600",
  });
  if (error) throw new Error(traducirErrorFoto(error.message));

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
  // El "?v=" cambia en cada subida para que el navegador no muestre la foto anterior guardada.
  const url = `${data.publicUrl}?v=${Date.now()}`;

  await guardarEnPerfil(idUsuario, url);
  return url;
}

// Borra la foto del usuario y vuelve a mostrar sus iniciales.
export async function quitarFotoPerfil(idUsuario: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([rutaDe(idUsuario)]);
  if (error) throw new Error(traducirErrorFoto(error.message));
  await guardarEnPerfil(idUsuario, null);
}
