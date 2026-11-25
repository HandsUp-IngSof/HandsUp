import type { LucideIcon } from "lucide-react";

import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";

interface PaginaProntoProps {
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  mensaje: string;
  detalle: string;
}

// Pagina de un panel que todavia no tiene contenido: muestra el titulo y un aviso de "muy pronto".
export function PaginaPronto({ titulo, descripcion, icono: Icono, mensaje, detalle }: PaginaProntoProps) {
  return (
    <>
      <EncabezadoSeccion titulo={titulo} descripcion={descripcion} />
      <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCE4EF] text-[#B5246E]">
          <Icono className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-slate-800">{mensaje}</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{detalle}</p>
      </section>
    </>
  );
}
