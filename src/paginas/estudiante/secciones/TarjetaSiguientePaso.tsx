import { Link } from "react-router-dom";
import { Hand, Play } from "lucide-react";

import type { SiguientePaso } from "@/paginas/estudiante/modelo";

// Ilustracion provisional mientras no tengamos la foto de la maqueta.
function Ilustracion() {
  return (
    <div className="relative hidden min-h-[180px] overflow-hidden bg-gradient-to-br from-[#FCE4EF] via-[#F6EDF3] to-[#E3F3F0] sm:block">
      <span className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#B5246E] shadow-sm">
        <Hand className="h-12 w-12" strokeWidth={1.6} />
      </span>
      {[
        { letra: "L", clase: "left-[18%] top-[18%] bg-[#14848D] text-white" },
        { letra: "S", clase: "right-[16%] top-[26%] bg-white text-[#B5246E]" },
        { letra: "C", clase: "left-[26%] bottom-[16%] bg-white text-[#14848D]" },
      ].map(({ letra, clase }) => (
        <span
          key={letra}
          className={`absolute flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold shadow-sm ${clase}`}
        >
          {letra}
        </span>
      ))}
    </div>
  );
}

// "Tu siguiente paso": lo que el estudiante debe hacer ahora (SCRUM-33): continuar una leccion,
// agendar su clase de bienvenida, etc. Lo calcula modelo.ts.
export function TarjetaSiguientePaso({ paso }: { paso: SiguientePaso }) {
  return (
    <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-[#E3F3F0] sm:grid-cols-[minmax(0,1fr)_240px]">
      <div className="p-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F6E75]">Tu siguiente paso</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-800">{paso.titulo}</h2>
        <p className="mt-2 text-sm text-slate-600">{paso.detalle}</p>
        <Link
          to={paso.ruta}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#14848D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F6E75]"
        >
          <Play className="h-4 w-4" />
          {paso.textoBoton}
        </Link>
      </div>
      <Ilustracion />
    </section>
  );
}
