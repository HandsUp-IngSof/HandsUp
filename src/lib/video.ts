// Videos de las lecciones (SCRUM-33). Se guarda el enlace; si es de YouTube o Vimeo se muestra
// incrustado en la pagina, y si es de otro sitio se ofrece como enlace.

// Revisa el enlace de un video. Devuelve el enlace listo o lanza un Error con un mensaje claro.
export function normalizarEnlaceVideo(texto: string): string | null {
  const enlace = texto.trim();
  if (!enlace) return null;
  if (/\s/.test(enlace)) throw new Error("El enlace del video no puede tener espacios.");
  if (enlace.length > 300) throw new Error("El enlace del video es demasiado largo.");
  if (/^http:\/\//i.test(enlace)) throw new Error("Usa un enlace seguro que empiece por https://.");

  const completo = /^https:\/\//i.test(enlace) ? enlace : `https://${enlace}`;
  try {
    const url = new URL(completo);
    if (!url.hostname.includes(".")) throw new Error();
    return url.toString();
  } catch {
    throw new Error("El enlace del video no es válido. Ejemplo: https://www.youtube.com/watch?v=...");
  }
}

// Direccion para incrustar el video (iframe), o null si no es de YouTube/Vimeo.
export function enlaceIncrustable(enlace: string): string | null {
  let url: URL;
  try {
    url = new URL(enlace);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
  }
  if (host === "vimeo.com") {
    const id = url.pathname.match(/^\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}
