import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, ExternalLink, ListChecks, Loader2, Trophy } from "lucide-react";

import { Ventana } from "@/componentes/UI/Ventana";
import { obtenerEjerciciosEstudiante, type EjercicioEstudiante } from "@/lib/ejercicios";
import { iconoDeInsignia } from "@/lib/iconos";
import { enlaceIncrustable } from "@/lib/video";
import { useDatosEstudiante } from "@/paginas/estudiante/DatosEstudiante";
import type { Insignia, LeccionVista } from "@/paginas/estudiante/modelo";
import { EjerciciosLeccion } from "@/paginas/estudiante/secciones/EjerciciosLeccion";

interface VentanaLeccionProps {
  leccion: LeccionVista | null; // null = ventana cerrada
  // Leccion que sigue (si la hay): al completar la actual se ofrece pasar a ella.
  siguiente?: LeccionVista | null;
  onCerrar: () => void;
  onIrASiguiente?: () => void;
}

// Contenido de una leccion y boton para marcarla como completada (SCRUM-34).
// Al completarla, Supabase actualiza el progreso y puede otorgar insignias (SCRUM-35).
export function VentanaLeccion({ leccion, siguiente, onCerrar, onIrASiguiente }: VentanaLeccionProps) {
  const { completar } = useDatosEstudiante();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nuevas, setNuevas] = useState<Insignia[]>([]);
  // Ejercicios de la leccion (SCRUM-38). null = cargando.
  const [ejercicios, setEjercicios] = useState<EjercicioEstudiante[] | null>(null);
  const [practicando, setPracticando] = useState(false);
  // Acaba de aprobar: el resultado sigue visible aunque la leccion ya figure como completada.
  const [recienAprobada, setRecienAprobada] = useState(false);

  // Cada vez que se abre otra leccion, se limpia el estado y se cargan sus ejercicios.
  const idLeccion = leccion?.id;
  useEffect(() => {
    setGuardando(false);
    setError(null);
    setNuevas([]);
    setPracticando(false);
    setRecienAprobada(false);
    setEjercicios(null);
    if (!idLeccion) return;
    let activo = true;
    obtenerEjerciciosEstudiante(idLeccion)
      .then((lista) => activo && setEjercicios(lista))
      .catch(() => activo && setEjercicios([]));
    return () => {
      activo = false;
    };
  }, [idLeccion]);

  const alCompletar = async () => {
    if (!leccion) return;
    setGuardando(true);
    setError(null);
    try {
      setNuevas(await completar(leccion.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar tu avance.");
    } finally {
      setGuardando(false);
    }
  };

  const video = leccion?.videoUrl ?? null;
  const incrustado = video ? enlaceIncrustable(video) : null;
  const completada = leccion?.estado === "completada";
  const puedeCompletar = leccion?.estado === "siguiente";
  const tieneEjercicios = (ejercicios?.length ?? 0) > 0;

  return (
    <Ventana titulo={leccion ? `Lección ${leccion.numero}` : "Lección"} abierta={leccion !== null} onCerrar={onCerrar} ancho="2xl">
      {leccion && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{leccion.titulo}</h3>
            {leccion.descripcion && <p className="mt-1 text-sm text-slate-500">{leccion.descripcion}</p>}
          </div>

          {video &&
            (incrustado ? (
              <div className="aspect-video overflow-hidden rounded-xl bg-slate-900">
                <iframe
                  src={incrustado}
                  title={`Video de la lección: ${leccion.titulo}`}
                  className="h-full w-full"
                  allow="accelerometer; encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            ) : (
              <a
                href={video}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#E3F3F0] px-4 py-2.5 text-sm font-bold text-[#14848D] hover:bg-[#D3ECE8]"
              >
                <ExternalLink className="h-4 w-4" />
                Ver el video de la lección
              </a>
            ))}

          {leccion.contenido ? (
            <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
              {leccion.contenido}
            </div>
          ) : (
            !video && <p className="text-sm text-slate-500">Esta lección todavía no tiene contenido.</p>
          )}

          {/* Ejercicios con calificacion automatica (SCRUM-38) */}
          {ejercicios && tieneEjercicios && (puedeCompletar || practicando || recienAprobada) && (
            <EjerciciosLeccion
              key={`${leccion.id}-${practicando}`}
              leccionId={leccion.id}
              ejercicios={ejercicios}
              modo={puedeCompletar || recienAprobada ? "evaluar" : "practicar"}
              onAprobado={async () => {
                setRecienAprobada(true);
                await alCompletar();
              }}
            />
          )}

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          {nuevas.length > 0 && (
            <div className="rounded-xl bg-[#FCE4EF] p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-[#B5246E]">
                <Trophy className="h-4 w-4" />
                {nuevas.length === 1 ? "¡Ganaste una insignia nueva!" : "¡Ganaste insignias nuevas!"}
              </p>
              <ul className="mt-2 space-y-1.5">
                {nuevas.map((insignia) => {
                  const Icono = iconoDeInsignia(insignia.icono);
                  return (
                    <li key={insignia.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <Icono className="h-4 w-4 shrink-0 text-[#B5246E]" />
                      <span>
                        <strong>{insignia.nombre}</strong> · {insignia.descripcion}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {completada && (
              <span className="mr-auto flex items-center gap-1.5 text-sm font-semibold text-[#14848D]">
                <CheckCircle2 className="h-4 w-4" />
                {tieneEjercicios ? "Lección completada · ejercicios aprobados" : "Lección completada"}
              </span>
            )}
            {completada && tieneEjercicios && !practicando && !recienAprobada && (
              <button
                type="button"
                onClick={() => setPracticando(true)}
                className="flex items-center gap-2 rounded-xl border border-[#B5246E] px-4 py-2.5 text-sm font-bold text-[#B5246E] hover:bg-[#FCE4EF]"
              >
                <ListChecks className="h-4 w-4" />
                Practicar ejercicios
              </button>
            )}
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </button>
            {completada && siguiente && onIrASiguiente && (
              <button
                type="button"
                onClick={onIrASiguiente}
                className="flex items-center gap-2 rounded-xl bg-[#14848D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F6E75]"
              >
                Siguiente lección
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {/* Sin ejercicios se completa con un clic; con ejercicios, al aprobarlos. */}
            {puedeCompletar && ejercicios !== null && !tieneEjercicios && (
              <button
                type="button"
                onClick={() => void alCompletar()}
                disabled={guardando}
                className="flex items-center gap-2 rounded-xl bg-[#14848D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F6E75] disabled:opacity-60"
              >
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {guardando ? "Guardando..." : "Marcar como completada"}
              </button>
            )}
          </div>
        </div>
      )}
    </Ventana>
  );
}
