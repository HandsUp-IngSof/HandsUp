import { useState } from "react";
import { ArrowUpRight, Camera } from "lucide-react";

import { CambiarFotoPerfil } from "@/componentes/CambiarFotoPerfil";
import { usePerfil } from "@/componentes/RutaProtegida";
import { Avatar } from "@/componentes/UI/Avatar";

// Resumen del perfil del docente. Clic en la foto para cambiarla (SCRUM-45).
// "Editar perfil" se implementa en SCRUM-48.
export function TarjetaPerfil() {
  const perfil = usePerfil();
  const nombre = `${perfil.nombre} ${perfil.apellido}`.trim();
  const [fotoAbierta, setFotoAbierta] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setFotoAbierta(true)}
          className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14848D] focus-visible:ring-offset-2"
          aria-label="Cambiar foto de perfil"
          title="Cambiar foto de perfil"
        >
          <Avatar nombre={nombre} url={perfil.avatar_url} tamano="lg" />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#14848D] text-white ring-2 ring-white transition-transform group-hover:scale-110">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </button>
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

      <CambiarFotoPerfil abierta={fotoAbierta} onCerrar={() => setFotoAbierta(false)} />
    </section>
  );
}
