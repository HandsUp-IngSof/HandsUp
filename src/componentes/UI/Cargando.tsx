import { Loader2 } from "lucide-react";

// Indicador de carga a pantalla completa.
// Aparece con un pequeno retraso (200 ms): si la carga es rapida, el usuario no ve un parpadeo.
export function Cargando({ texto = "Cargando..." }: { texto?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen flex flex-col items-center justify-center gap-3 opacity-0 animate-aparecer-tarde font-['Fredoka',sans-serif]"
    >
      <Loader2 className="w-8 h-8 animate-spin text-[#14848D]" />
      <span className="text-sm text-slate-500">{texto}</span>
    </div>
  );
}
