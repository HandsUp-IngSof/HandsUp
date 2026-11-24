import { Link } from "react-router-dom";
import { AlertCircle, Loader2, MessageCircle } from "lucide-react";

import { cn, iniciales } from "@/lib/utils";
import type { EstudianteResumen } from "@/paginas/docente/resumenDocente";

interface TablaEstudiantesProps {
  estudiantes: EstudianteResumen[];
  cargando: boolean;
  error: string | null;
  // En "Mi espacio" muestra el enlace a la pagina completa de estudiantes.
  mostrarVerTodos?: boolean;
}

// Estudiantes del docente con su avance real (SCRUM-42).
// El boton de mensaje se conecta en SCRUM-51.
export function TablaEstudiantes({ estudiantes, cargando, error, mostrarVerTodos = true }: TablaEstudiantesProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Cada persona, un nuevo avance</h2>
          <p className="text-xs text-slate-500">Un vistazo a tus estudiantes y sus próximas clases.</p>
        </div>
        {mostrarVerTodos && estudiantes.length > 0 && (
          <Link to="/docente/estudiantes" className="text-sm font-bold text-[#14848D] hover:underline">
            Ver mis {estudiantes.length} {estudiantes.length === 1 ? "estudiante" : "estudiantes"} →
          </Link>
        )}
      </div>

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#14848D]" />
          Cargando tus estudiantes...
        </div>
      ) : error ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : estudiantes.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Aún no tienes estudiantes. Cuando alguien agende una clase contigo, aparecerá aquí.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-3 font-semibold">Estudiante</th>
                <th className="py-3 font-semibold">Siguiente lección</th>
                <th className="py-3 font-semibold">Progreso</th>
                <th className="py-3 font-semibold">Próxima clase</th>
                <th className="py-3 font-semibold">Estado</th>
                <th className="py-3">
                  <span className="sr-only">Contactar</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                          e.requiereAtencion ? "bg-[#FCE4EF] text-[#B5246E]" : "bg-[#E7F3F3] text-[#14848D]",
                        )}
                      >
                        {iniciales(e.nombre)}
                      </span>
                      <span className="font-bold text-slate-800">{e.nombre}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-500">{e.modulo}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-[#14848D]" style={{ width: `${e.progreso}%` }} />
                      </div>
                      <span className="text-xs font-bold text-[#14848D]">{e.progreso}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-500">{e.proximaClase}</td>
                  <td className="py-3">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        e.requiereAtencion ? "bg-[#FCE4EF] text-[#B5246E]" : "bg-[#E3F3F0] text-[#14848D]",
                      )}
                    >
                      {e.estado}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      title="Próximamente"
                      aria-label={`Enviar mensaje a ${e.nombre}`}
                      className="rounded-lg p-1.5 text-[#14848D] hover:bg-[#E7F3F3]"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
