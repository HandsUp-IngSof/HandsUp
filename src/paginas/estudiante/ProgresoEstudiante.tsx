import { Link } from "react-router-dom";
import { ChartLine, Check, Flame, Lock, Trophy } from "lucide-react";

import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";
import { cn } from "@/lib/utils";
import { iconoDeInsignia } from "@/lib/iconos";
import { rutaModulo, type Insignia, type VistaEstudiante } from "@/paginas/estudiante/modelo";
import { ConDatos } from "@/paginas/estudiante/secciones/EstadoCarga";

const formatoFecha = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" });

function Barra({ porcentaje, etiqueta }: { porcentaje: number; etiqueta: string }) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      aria-valuenow={porcentaje}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={etiqueta}
    >
      <div className="h-full rounded-full bg-[#14848D]" style={{ width: `${porcentaje}%` }} />
    </div>
  );
}

function TarjetaInsignia({ insignia, progresoTexto }: { insignia: Insignia; progresoTexto: string }) {
  const Icono = iconoDeInsignia(insignia.icono);
  const lograda = insignia.obtenidaEn !== null;
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3",
        lograda ? "border-[#B5246E]/30 bg-[#FCE4EF]/50" : "border-slate-200 bg-white",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          lograda ? "bg-[#FCE4EF] text-[#B5246E]" : "bg-slate-100 text-slate-300",
        )}
      >
        {lograda ? <Icono className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
      </span>
      <div className="min-w-0">
        <p className={cn("text-sm font-bold", lograda ? "text-slate-800" : "text-slate-500")}>{insignia.nombre}</p>
        <p className="text-xs text-slate-500">{insignia.descripcion}</p>
        <p className={cn("mt-1 text-[11px] font-semibold", lograda ? "text-[#B5246E]" : "text-slate-400")}>
          {lograda ? `Obtenida el ${formatoFecha.format(insignia.obtenidaEn!)}` : progresoTexto}
        </p>
      </div>
    </li>
  );
}

// Cuanto le falta al estudiante para una insignia que aun no tiene.
function textoFaltante(insignia: Insignia, vista: VistaEstudiante): string {
  const { progreso } = vista;
  const modulosCompletos = vista.modulos.filter((m) => m.estado === "completado").length;
  const clases = vista.clasesProximas.length + vista.clasesPasadas.filter((c) => c.estado !== "cancelada").length;
  const actual = {
    lecciones: progreso.completadas,
    modulos: modulosCompletos,
    racha: progreso.racha,
    clases,
  }[insignia.criterio];
  return `Llevas ${Math.min(actual, insignia.valor)} de ${insignia.valor}`;
}

// "Mi progreso" (SCRUM-34 y SCRUM-35): avance general y por modulo, racha e insignias.
export function ProgresoEstudiante() {
  return (
    <div className="mx-auto max-w-4xl">
      <EncabezadoSeccion
        titulo="Mi progreso"
        descripcion="Mira cuánto has avanzado, tu racha de práctica y las insignias que has ganado."
      />
      <ConDatos>
        {(vista) => {
          const { progreso } = vista;
          const obtenidas = vista.insignias.filter((i) => i.obtenidaEn).length;
          return (
            <div className="space-y-6">
              <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-slate-800">Tu ruta completa</h2>
                    <ChartLine className="h-5 w-5 text-[#14848D]" />
                  </div>
                  <p className="mt-3 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-[#14848D]">{progreso.porcentaje}%</span>
                    <span className="text-sm text-slate-500">
                      {progreso.completadas} de {progreso.total} lecciones
                    </span>
                  </p>
                  <div className="mt-3">
                    <Barra porcentaje={progreso.porcentaje} etiqueta="Progreso de toda tu ruta" />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-slate-800">Racha</h2>
                    <Flame className={cn("h-5 w-5", progreso.racha > 0 ? "text-[#B5246E]" : "text-slate-300")} />
                  </div>
                  <p className="mt-3 text-4xl font-bold text-[#B5246E]">{progreso.racha}</p>
                  <p className="text-sm text-slate-500">{progreso.racha === 1 ? "día seguido" : "días seguidos"}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {progreso.racha === 0 ? "Completa una lección hoy para empezar tu racha." : "Completa una lección hoy para mantenerla."}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-bold text-slate-800">Avance por módulo</h2>
                {vista.modulos.length === 0 ? (
                  <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    Aún no hay módulos publicados.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {vista.modulos.map((modulo) => {
                      const porcentaje = modulo.total > 0 ? Math.round((modulo.completadas / modulo.total) * 100) : 0;
                      const Icono = modulo.icono;
                      return (
                        <li key={modulo.id}>
                          <Link
                            to={rutaModulo(modulo.id)}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-[#14848D]"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F3F3] text-[#14848D]">
                              {modulo.estado === "completado" ? <Check className="h-5 w-5" /> : <Icono className="h-5 w-5" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-bold text-slate-800">
                                  {modulo.codigo} · {modulo.titulo}
                                </p>
                                <span className="shrink-0 text-xs font-bold text-[#14848D]">
                                  {modulo.estado === "bloqueado" ? "Bloqueado" : `${porcentaje}%`}
                                </span>
                              </div>
                              <div className="mt-2">
                                <Barra porcentaje={porcentaje} etiqueta={`Progreso de ${modulo.titulo}`} />
                              </div>
                              <p className="mt-1 text-[11px] text-slate-500">{modulo.detalle}</p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                    <Trophy className="h-5 w-5 text-[#B5246E]" />
                    Reconocimientos
                  </h2>
                  <span className="rounded-full bg-[#FCE4EF] px-3 py-1 text-xs font-bold text-[#B5246E]">
                    {obtenidas} de {vista.insignias.length}
                  </span>
                </div>
                {vista.insignias.length === 0 ? (
                  <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    Las insignias estarán disponibles muy pronto.
                  </p>
                ) : (
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {vista.insignias.map((insignia) => (
                      <TarjetaInsignia key={insignia.id} insignia={insignia} progresoTexto={textoFaltante(insignia, vista)} />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          );
        }}
      </ConDatos>
    </div>
  );
}
