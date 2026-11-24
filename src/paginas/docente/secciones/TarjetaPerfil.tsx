import { ArrowUpRight } from "lucide-react";

import { iniciales } from "@/lib/utils";

// Resumen del perfil del docente. "Editar perfil" se implementa en SCRUM-48.
export function TarjetaPerfil({ nombre }: { nombre: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E7F3F3] text-base font-bold text-[#14848D]">
          {iniciales(nombre)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-800">{nombre}</p>
          <p className="text-xs text-slate-500">Docente de LSC</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full bg-[#E3F3F0] px-3 py-1 text-xs font-semibold text-[#14848D]">
          Perfil verificado
        </span>
        <button
          type="button"
          title="Próximamente"
          className="flex items-center gap-1 text-xs font-bold text-[#14848D] hover:underline"
        >
          Editar perfil
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
