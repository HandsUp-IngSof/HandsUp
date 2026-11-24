import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface CargandoProps {
  texto?: string;
  // true: ocupa toda la pantalla. false: solo el area de contenido (dentro de un panel).
  pantallaCompleta?: boolean;
}

// Indicador de carga.
// Aparece con un pequeno retraso (200 ms): si la carga es rapida, el usuario no ve un parpadeo.
export function Cargando({ texto = "Cargando...", pantallaCompleta = true }: CargandoProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 opacity-0 animate-aparecer-tarde font-['Fredoka',sans-serif]",
        pantallaCompleta ? "min-h-screen" : "py-24",
      )}
    >
      <Loader2 className="w-8 h-8 animate-spin text-[#14848D]" />
      <span className="text-sm text-slate-500">{texto}</span>
    </div>
  );
}
