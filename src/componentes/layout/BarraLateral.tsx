import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { HeartHandshake, HelpCircle, ArrowUpRight, X } from "lucide-react";

import { cn } from "@/lib/utils";
import isotipo from "@/recursos/isotipo.webp";

export interface EnlaceMenu {
  texto: string;
  icono: LucideIcon;
  ruta: string;
  // true: solo se resalta en esa ruta exacta (no en sus subpaginas). Se usa en "Mi espacio".
  exacto?: boolean;
  insignia?: number;
}

interface BarraLateralProps {
  etiqueta: string;
  enlaces: EnlaceMenu[];
  abierta: boolean;
  onCerrar: () => void;
}

// Menu lateral de los paneles. En escritorio siempre esta visible;
// en celular se abre como un cajon con el boton de menu del encabezado.
export function BarraLateral({ etiqueta, enlaces, abierta, onCerrar }: BarraLateralProps) {
  return (
    <>
      {/* Fondo oscuro detras del menu en celular */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/40 transition-opacity lg:hidden",
          abierta ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onCerrar}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          abierta ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <img src={isotipo} alt="" className="h-9 w-auto" />
            <span className="text-2xl font-bold text-[#14848D]">
              hands<span className="text-[#B5246E]">Up</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-8 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {etiqueta}
        </p>

        <nav className="mt-2 flex flex-col gap-1">
          {enlaces.map(({ texto, icono: Icono, ruta, exacto, insignia }) => (
            <NavLink
              key={texto}
              to={ruta}
              end={exacto}
              onClick={onCerrar}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#E7F3F3] text-[#14848D]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
                )
              }
            >
              <Icono className="h-[18px] w-[18px]" />
              <span className="flex-1">{texto}</span>
              {insignia ? (
                <span className="rounded-full bg-[#FCE4EF] px-2 py-0.5 text-[11px] font-bold text-[#B5246E]">
                  {insignia}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-[#FFF6E5] p-4">
          <HeartHandshake className="h-5 w-5 text-[#B4690E]" />
          <p className="mt-2 text-sm font-bold text-slate-800">Aprendemos en comunidad</p>
          <p className="mt-1 text-xs text-slate-500">Cada seña abre una nueva conversación.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#14848D]">
            Conoce la comunidad
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="mt-auto space-y-2 px-2 pt-6">
          <button
            type="button"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#14848D]"
          >
            <HelpCircle className="h-4 w-4" />
            ¿Necesitas ayuda?
          </button>
          <p className="text-[11px] text-slate-400">Hecho para conectar · Colombia</p>
        </div>
      </aside>
    </>
  );
}
