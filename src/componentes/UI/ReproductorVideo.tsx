import { ExternalLink } from "lucide-react";

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
  const fuente = fuenteDeVideo(enlace);
  if (!fuente) return null;

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
        src={fuente.src}
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
