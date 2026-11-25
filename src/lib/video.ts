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

// ---------------------------------------------------------------------
// Reproduccion integrada (SCRUM-40): de que tipo es el video y como se reproduce
// dentro de la leccion, sin salir de handsUp.
// ---------------------------------------------------------------------
export type FuenteVideo =
  | { tipo: "youtube"; id: string; src: string }
  | { tipo: "vimeo"; src: string }
  | { tipo: "drive"; src: string }
  | { tipo: "archivo"; src: string } // .mp4, .webm, .ogg o .mov: reproductor del navegador
  | { tipo: "externo"; src: string }; // otro sitio: se abre aparte

const EXTENSIONES_VIDEO = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;

export function idYouTube(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    return url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1] ?? null;
  }
  return null;
}

export function fuenteDeVideo(enlace: string): FuenteVideo | null {
  let url: URL;
  try {
    url = new URL(enlace);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  const youtube = idYouTube(url);
  // youtube-nocookie: YouTube no guarda cookies de seguimiento hasta que se reproduce.
  if (youtube) return { tipo: "youtube", id: youtube, src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube)}` };

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/(\d{6,})/)?.[1];
    if (id) return { tipo: "vimeo", src: `https://player.vimeo.com/video/${id}` };
  }

  if (host === "drive.google.com") {
    const id = url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ?? url.searchParams.get("id");
    if (id) return { tipo: "drive", src: `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` };
  }

  if (EXTENSIONES_VIDEO.test(url.pathname)) return { tipo: "archivo", src: url.toString() };

  return { tipo: "externo", src: url.toString() };
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
