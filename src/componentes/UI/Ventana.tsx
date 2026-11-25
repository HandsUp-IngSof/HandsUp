import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const ANCHOS = {
  md: "max-w-md",
  lg: "max-w-lg",
  "2xl": "max-w-2xl",
};

interface VentanaProps {
  titulo: string;
  abierta: boolean;
  onCerrar: () => void;
  // Ancho maximo de la ventana. Por defecto "md" (formularios y confirmaciones cortas).
  ancho?: keyof typeof ANCHOS;
  children: ReactNode;
}

// Ventana emergente (modal) reutilizable. Se cierra con la X, con Escape o al hacer clic afuera.
export function Ventana({ titulo, abierta, onCerrar, ancho = "md", children }: VentanaProps) {
  useEffect(() => {
    if (!abierta) return;
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [abierta, onCerrar]);

  if (!abierta) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 font-['Fredoka',sans-serif]"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={cn("max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl", ANCHOS[ancho])}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
