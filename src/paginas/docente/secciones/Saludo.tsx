import { resumenEjemplo } from "@/paginas/docente/datosEjemplo";

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Saludo con la fecha de hoy y los contadores del docente.
export function Saludo({ nombre }: { nombre: string }) {
  return (
    <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {formatoFecha.format(new Date())}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-800 sm:text-3xl">
          ¡Hola, {nombre}! Tu enseñanza conecta.
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Organiza tus clases y acompaña cada nuevo aprendizaje.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-6">
        <div>
          <p className="text-3xl font-bold text-[#14848D]">{resumenEjemplo.estudiantesActivos}</p>
          <p className="text-xs text-slate-500">estudiantes activos</p>
        </div>
        <div className="h-10 w-px bg-slate-200" />
        <div>
          <p className="text-3xl font-bold text-[#B5246E]">{resumenEjemplo.clasesSemana}</p>
          <p className="text-xs text-slate-500">clases esta semana</p>
        </div>
      </div>
    </section>
  );
}
