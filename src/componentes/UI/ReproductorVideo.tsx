import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";

import { fuenteDeVideo } from "@/lib/video";

interface ReproductorVideoProps {
  enlace: string;
  titulo: string; // para lectores de pantalla: "Video de la lección: ..."
}

const MARCO = "aspect-video w-full overflow-hidden rounded-xl bg-slate-900";

// Reproduce el video de una leccion dentro de handsUp (SCRUM-40):
// YouTube, Vimeo y Google Drive en un reproductor incrustado; archivos .mp4/.webm con el
// reproductor del navegador; cualquier otro enlace se ofrece para abrirlo aparte.
export function ReproductorVideo({ enlace, titulo }: ReproductorVideoProps) {
  // Carga liviana (SCRUM-29): el reproductor de YouTube pesa cerca de 1 MB, asi que primero
  // se muestra solo la miniatura y el reproductor se carga cuando la persona da "play".
  const [reproducir, setReproducir] = useState(false);
  const fuente = fuenteDeVideo(enlace);
  if (!fuente) return null;

  if (fuente.tipo === "youtube" && !reproducir) {
    return (
      <button
        type="button"
        onClick={() => setReproducir(true)}
        className={`group relative block ${MARCO} focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#14848D]/50`}
        aria-label={`Reproducir: ${titulo}`}
      >
        <img
          src={`https://i.ytimg.com/vi/${encodeURIComponent(fuente.id)}/hqdefault.jpg`}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#B5246E] text-white shadow-lg transition-transform group-hover:scale-110">
            <Play className="ml-1 h-7 w-7" fill="currentColor" />
          </span>
        </span>
      </button>
    );
  }

  if (fuente.tipo === "archivo") {
    return (
      <div className={MARCO}>
        <video src={fuente.src} controls playsInline preload="metadata" className="h-full w-full" aria-label={titulo}>
          Tu navegador no puede reproducir este video.{" "}
          <a href={fuente.src} target="_blank" rel="noopener noreferrer">
            Ábrelo aquí
          </a>
          .
        </video>
      </div>
    );
  }

  if (fuente.tipo === "externo") {
    return (
      <a
        href={fuente.src}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-[#E3F3F0] px-4 py-2.5 text-sm font-bold text-[#14848D] hover:bg-[#D3ECE8]"
      >
        <ExternalLink className="h-4 w-4" />
        Ver el video de la lección
      </a>
    );
  }

  return (
    <div className={MARCO}>
      <iframe
        // Si la persona ya dio "play" en la miniatura de YouTube, el video arranca solo.
        src={fuente.tipo === "youtube" ? `${fuente.src}?autoplay=1&rel=0` : fuente.src}
        title={titulo}
        className="h-full w-full"
        allow="accelerometer; autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
