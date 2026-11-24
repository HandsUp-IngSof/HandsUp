import { ChartLine, Flame, Sparkles, Video } from "lucide-react";

import { Avatar } from "@/componentes/UI/Avatar";
import type { ClaseBienvenida, Progreso } from "@/paginas/estudiante/datosEjemplo";

// "Así vas": porcentaje de la ruta completada y racha (SCRUM-58; calculo real en SCRUM-34 y SCRUM-35).
export function TarjetaProgreso({ progreso }: { progreso: Progreso }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800">Así vas</h2>
        <ChartLine className="h-5 w-5 text-[#14848D]" />
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-[#14848D]">{progreso.porcentaje}%</span>
        <span className="text-xs text-slate-500">de tu ruta completada</span>
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={progreso.porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso de tu ruta"
      >
        <div className="h-full rounded-full bg-[#14848D]" style={{ width: `${progreso.porcentaje}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {progreso.completadas} de {progreso.total} lecciones
        </span>
        <span className="flex items-center gap-1 font-semibold text-[#B5246E]">
          <Flame className="h-3.5 w-3.5" />
          {progreso.racha} días de racha
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">¡Estás construyendo un gran hábito!</p>
    </section>
  );
}

// "Tu clase de bienvenida": primera clase en vivo con su docente (SCRUM-58; datos reales en SCRUM-39).
export function TarjetaClaseBienvenida({ clase }: { clase: ClaseBienvenida }) {
  const primerNombre = clase.docente.split(" ")[0];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800">Tu clase de bienvenida</h2>
        <Video className="h-5 w-5 text-[#14848D]" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Avatar nombre={clase.docente} />
        <div>
          <p className="text-sm font-bold text-slate-800">{clase.docente}</p>
          <p className="text-xs text-slate-500">Tu docente de LSC</p>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-slate-100 px-4 py-3">
        <p className="text-sm font-bold text-slate-800">{clase.fecha}</p>
        <p className="text-xs text-slate-500">{clase.horario}</p>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Conoce a {primerNombre} y activa tu primer módulo de conversación en vivo.
      </p>
      <button
        type="button"
        title="Próximamente"
        className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-[#14848D] hover:bg-slate-50"
      >
        Ver detalle de la clase
      </button>
    </section>
  );
}

// "5 minutos para ti": una practica corta para el dia.
export function TarjetaConsejo({ consejo }: { consejo: string }) {
  return (
    <section className="rounded-2xl bg-[#FCE4EF] p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-[#B5246E]">
        <Sparkles className="h-4 w-4" />5 minutos para ti
      </p>
      <p className="mt-1 text-sm text-slate-700">{consejo}</p>
    </section>
  );
}
