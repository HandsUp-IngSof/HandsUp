import { useEffect, useId, useRef, type ReactNode } from "react";
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

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, video[controls], [tabindex]:not([tabindex="-1"])';

// Ventana emergente (modal) reutilizable. Se cierra con la X, con Escape o al hacer clic afuera.
// Accesibilidad (SCRUM-28): al abrir, el foco entra a la ventana; Tab no se escapa de ella;
// al cerrar, el foco vuelve al boton que la abrio. El lector de pantalla anuncia su titulo.
export function Ventana({ titulo, abierta, onCerrar, ancho = "md", children }: VentanaProps) {
  const idTitulo = useId();
  const ventanaRef = useRef<HTMLDivElement>(null);
  const onCerrarRef = useRef(onCerrar);
  onCerrarRef.current = onCerrar;

  useEffect(() => {
    if (!abierta) return;
    const anterior = document.activeElement as HTMLElement | null;
    // El foco entra al primer campo de texto (o a la ventana) apenas se abre.
    // Las opciones de los ejercicios (radio) no cuentan: la leccion debe empezar arriba.
    const primero = ventanaRef.current?.querySelector<HTMLElement>(
      "input:not([disabled]):not([type=radio]):not([type=checkbox]):not([type=file]), textarea:not([disabled]), select:not([disabled])",
    );
    (primero ?? ventanaRef.current)?.focus();

    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        onCerrarRef.current();
        return;
      }
      if (evento.key !== "Tab" || !ventanaRef.current) return;
      // Tab y Shift + Tab dan la vuelta dentro de la ventana.
      const enfocables = Array.from(ventanaRef.current.querySelectorAll<HTMLElement>(ENFOCABLES)).filter(
        (el) => el.offsetParent !== null,
      );
      if (enfocables.length === 0) return;
      const primerEl = enfocables[0];
      const ultimoEl = enfocables[enfocables.length - 1];
      if (evento.shiftKey && document.activeElement === primerEl) {
        evento.preventDefault();
        ultimoEl.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimoEl) {
        evento.preventDefault();
        primerEl.focus();
      }
    };
    document.addEventListener("keydown", alPresionar);
    return () => {
      document.removeEventListener("keydown", alPresionar);
      anterior?.focus?.();
    };
  }, [abierta]);

  if (!abierta) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 font-['Fredoka',sans-serif]"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <div
        ref={ventanaRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={cn("max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-xl outline-none sm:p-6", ANCHOS[ancho])}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={idTitulo} className="text-lg font-bold text-slate-800">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar ventana"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
