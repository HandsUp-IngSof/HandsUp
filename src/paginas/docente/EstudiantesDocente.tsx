import { useState } from "react";
import { Search } from "lucide-react";

import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";
import { cn } from "@/lib/utils";
import type { EstudianteResumen } from "@/paginas/docente/resumenDocente";
import { useResumenDocente } from "@/paginas/docente/useResumenDocente";
import { TablaEstudiantes } from "@/paginas/docente/secciones/TablaEstudiantes";

type Filtro = "todos" | "por-confirmar" | "sin-clases";

const FILTROS: { valor: Filtro; texto: string; cumple: (e: EstudianteResumen) => boolean }[] = [
  { valor: "todos", texto: "Todos", cumple: () => true },
  { valor: "por-confirmar", texto: "Por confirmar", cumple: (e) => e.requiereAtencion },
  { valor: "sin-clases", texto: "Sin clases próximas", cumple: (e) => e.proximaInicio === null },
];

// Quita tildes y mayusculas para buscar "andres" y encontrar "Andrés".
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Pagina "Mis estudiantes" del docente (SCRUM-42): lista con buscador y filtros.
// El contacto se implementa en SCRUM-51.
export function EstudiantesDocente() {
  const { datos, cargando, error } = useResumenDocente();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const todos = datos?.estudiantes ?? [];
  const condicion = FILTROS.find((f) => f.valor === filtro)!.cumple;
  const visibles = todos.filter((e) => condicion(e) && normalizar(e.nombre).includes(normalizar(busqueda.trim())));

  const controles = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative sm:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar estudiante"
          aria-label="Buscar estudiante por nombre"
          className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-[#14848D]"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(({ valor, texto, cumple }) => (
          <button
            key={valor}
            type="button"
            onClick={() => setFiltro(valor)}
            aria-pressed={filtro === valor}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filtro === valor
                ? "border-[#14848D] bg-[#14848D] text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            {texto} ({todos.filter(cumple).length})
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <EncabezadoSeccion
        titulo="Mis estudiantes"
        descripcion="Consulta el avance de cada estudiante y sus próximas clases."
      />
      <TablaEstudiantes
        estudiantes={visibles}
        cargando={cargando}
        error={error}
        mostrarVerTodos={false}
        controles={todos.length > 0 ? controles : undefined}
        mensajeVacio={
          todos.length === 0
            ? undefined
            : "Ningún estudiante coincide con la búsqueda o el filtro."
        }
      />
    </>
  );
}
