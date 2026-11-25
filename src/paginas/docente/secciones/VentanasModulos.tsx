import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { ReproductorVideo } from "@/componentes/UI/ReproductorVideo";
import { Ventana } from "@/componentes/UI/Ventana";
import { ICONOS_MODULO } from "@/lib/iconos";
import { cn } from "@/lib/utils";
import { normalizarEnlaceVideo } from "@/lib/video";
import {
  LECCION_VACIA,
  LIMITES,
  MODULO_VACIO,
  validarLeccion,
  validarModulo,
  type DatosLeccion,
  type DatosModulo,
} from "@/paginas/docente/consultasModulos";

const campo =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#14848D]";

function Error_({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {mensaje}
    </p>
  );
}

function Botones({ guardando, textoGuardar, onCerrar }: { guardando: boolean; textoGuardar: string; onCerrar: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCerrar}
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={guardando}
        className="flex items-center gap-2 rounded-xl bg-[#14848D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F6E75] disabled:opacity-60"
      >
        {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
        {guardando ? "Guardando..." : textoGuardar}
      </button>
    </div>
  );
}

interface VentanaFormularioProps<T> {
  abierta: boolean;
  // null = crear uno nuevo; con datos = editar.
  inicial: T | null;
  onCerrar: () => void;
  onGuardar: (datos: T) => Promise<void>;
}

// Crear o editar un modulo (SCRUM-33).
export function VentanaModulo({ abierta, inicial, onCerrar, onGuardar }: VentanaFormularioProps<DatosModulo>) {
  const [datos, setDatos] = useState<DatosModulo>(MODULO_VACIO);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierta) return;
    setDatos(inicial ?? MODULO_VACIO);
    setError(null);
  }, [abierta, inicial]);

  const guardar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const mensaje = validarModulo(datos);
    if (mensaje) return setError(mensaje);
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el módulo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Ventana titulo={inicial ? "Editar módulo" : "Nuevo módulo"} abierta={abierta} onCerrar={onCerrar} ancho="lg">
      <form onSubmit={guardar} className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Título
          <input
            value={datos.titulo}
            onChange={(e) => setDatos({ ...datos, titulo: e.target.value })}
            maxLength={LIMITES.tituloModulo}
            placeholder="Ej: Saludos y presentaciones"
            className={campo}
            required
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Descripción <span className="font-normal text-slate-400">(opcional)</span>
          <textarea
            value={datos.descripcion}
            onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })}
            maxLength={LIMITES.descripcionModulo}
            rows={2}
            placeholder="Ej: El primer paso para encontrarnos en LSC."
            className={campo}
          />
        </label>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">Icono</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(ICONOS_MODULO).map(([clave, { icono: Icono, nombre }]) => (
              <button
                key={clave}
                type="button"
                title={nombre}
                aria-label={nombre}
                aria-pressed={datos.icono === clave}
                onClick={() => setDatos({ ...datos, icono: clave })}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border-2",
                  datos.icono === clave
                    ? "border-[#14848D] bg-[#E3F3F0] text-[#14848D]"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50",
                )}
              >
                <Icono className="h-5 w-5" />
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm font-semibold text-slate-700">
          Duración estimada en minutos <span className="font-normal text-slate-400">(opcional)</span>
          <input
            type="number"
            min={1}
            max={600}
            value={datos.duracionMin}
            onChange={(e) => setDatos({ ...datos, duracionMin: e.target.value })}
            placeholder="25"
            className={cn(campo, "sm:max-w-[160px]")}
          />
        </label>

        <label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={datos.requiereClaseBienvenida}
            onChange={(e) => setDatos({ ...datos, requiereClaseBienvenida: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[#14848D]"
          />
          <span>
            <strong>Módulo en vivo</strong>: el estudiante lo desbloquea después de su clase de bienvenida.
          </span>
        </label>

        <p className="text-xs text-slate-500">El módulo se crea como borrador. Los estudiantes lo verán cuando lo publiques.</p>

        <Error_ mensaje={error} />
        <Botones guardando={guardando} textoGuardar={inicial ? "Guardar cambios" : "Crear módulo"} onCerrar={onCerrar} />
      </form>
    </Ventana>
  );
}

// Crear o editar una leccion de un modulo (SCRUM-33).
export function VentanaLeccionDocente({ abierta, inicial, onCerrar, onGuardar }: VentanaFormularioProps<DatosLeccion>) {
  const [datos, setDatos] = useState<DatosLeccion>(LECCION_VACIA);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierta) return;
    setDatos(inicial ?? LECCION_VACIA);
    setError(null);
  }, [abierta, inicial]);

  // Enlace valido para la vista previa (null si esta vacio o tiene un error).
  let vistaPrevia: string | null = null;
  try {
    vistaPrevia = normalizarEnlaceVideo(datos.videoUrl);
  } catch {
    vistaPrevia = null;
  }

  const guardar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const mensaje = validarLeccion(datos);
    if (mensaje) return setError(mensaje);
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la lección.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Ventana titulo={inicial ? "Editar lección" : "Nueva lección"} abierta={abierta} onCerrar={onCerrar} ancho="lg">
      <form onSubmit={guardar} className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Título
          <input
            value={datos.titulo}
            onChange={(e) => setDatos({ ...datos, titulo: e.target.value })}
            maxLength={LIMITES.tituloLeccion}
            placeholder="Ej: Letras de la A a la E"
            className={campo}
            required
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Descripción corta <span className="font-normal text-slate-400">(opcional)</span>
          <input
            value={datos.descripcion}
            onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })}
            maxLength={LIMITES.descripcionLeccion}
            placeholder="Ej: Aprende las primeras cinco letras del alfabeto en LSC."
            className={campo}
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Enlace del video <span className="font-normal text-slate-400">(opcional)</span>
          <input
            type="url"
            inputMode="url"
            value={datos.videoUrl}
            onChange={(e) => setDatos({ ...datos, videoUrl: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className={campo}
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            YouTube, Vimeo, Google Drive y archivos .mp4 o .webm se reproducen dentro de la lección; otros enlaces se
            abren aparte.
          </span>
        </label>

        {/* Vista previa del video tal como lo vera el estudiante (SCRUM-40) */}
        {vistaPrevia && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-600">Vista previa</p>
            <ReproductorVideo enlace={vistaPrevia} titulo="Vista previa del video de la lección" />
          </div>
        )}

        <label className="block text-sm font-semibold text-slate-700">
          Contenido <span className="font-normal text-slate-400">(opcional)</span>
          <textarea
            value={datos.contenido}
            onChange={(e) => setDatos({ ...datos, contenido: e.target.value })}
            maxLength={LIMITES.contenidoLeccion}
            rows={7}
            placeholder="Explica la seña, cómo se mueve la mano, consejos de práctica..."
            className={campo}
          />
          <span className="mt-1 block text-right text-xs font-normal text-slate-400">
            {datos.contenido.length}/{LIMITES.contenidoLeccion}
          </span>
        </label>

        <p className="text-xs text-slate-500">La lección se crea como borrador. Los estudiantes la verán cuando la publiques.</p>

        <Error_ mensaje={error} />
        <Botones guardando={guardando} textoGuardar={inicial ? "Guardar cambios" : "Crear lección"} onCerrar={onCerrar} />
      </form>
    </Ventana>
  );
}
