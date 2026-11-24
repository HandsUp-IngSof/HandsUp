import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Link2, Loader2 } from "lucide-react";

import { usePerfil } from "@/componentes/RutaProtegida";
import { cn } from "@/lib/utils";
import {
  guardarEnlaceClase,
  nombrePlataforma,
  normalizarEnlace,
  obtenerEnlaceClase,
} from "@/paginas/docente/enlaceClase";

// Enlace de videollamada del docente (SCRUM-43): lo carga, lo valida, lo guarda y lo quita en Supabase.
export function SeccionEnlaceClase() {
  const perfil = usePerfil();
  const [guardado, setGuardado] = useState<string | null>(null); // el que esta en Supabase
  const [texto, setTexto] = useState(""); // lo que esta escrito en el campo
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    obtenerEnlaceClase(perfil.id)
      .then((enlace) => {
        if (!activo) return;
        setGuardado(enlace);
        setTexto(enlace ?? "");
      })
      .catch((err: Error) => activo && setError(err.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [perfil.id]);

  // El aviso de exito desaparece solo despues de unos segundos.
  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const ejecutar = async (enlace: string | null, mensaje: string) => {
    setGuardando(true);
    setError(null);
    setAviso(null);
    try {
      await guardarEnlaceClase(perfil.id, enlace);
      setGuardado(enlace);
      setTexto(enlace ?? "");
      setAviso(mensaje);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el enlace.");
    } finally {
      setGuardando(false);
    }
  };

  const guardar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let enlace: string;
    try {
      enlace = normalizarEnlace(texto);
    } catch (err) {
      setAviso(null);
      setError(err instanceof Error ? err.message : "El enlace no es válido.");
      return;
    }
    if (enlace === guardado) {
      setTexto(enlace);
      setError(null);
      setAviso("Ese enlace ya está guardado.");
      return;
    }
    ejecutar(enlace, guardado ? "Enlace actualizado." : "Enlace guardado.");
  };

  const quitar = () => ejecutar(null, "Enlace quitado. Tus estudiantes ya no lo verán.");

  const sinCambios = texto.trim() === (guardado ?? "");
  const plataforma = guardado ? nombrePlataforma(guardado) : null;

  return (
    <form onSubmit={guardar} noValidate className="mt-6 border-t border-slate-100 pt-5">
      <label htmlFor="enlace-clase" className="text-sm font-bold text-slate-700">
        Enlace de clase
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14848D]" />
          <input
            id="enlace-clase"
            type="url"
            inputMode="url"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setError(null);
            }}
            disabled={cargando}
            placeholder={cargando ? "Cargando tu enlace..." : "meet.google.com/tu-clase-lsc"}
            aria-invalid={error ? true : undefined}
            className={cn(
              "h-11 w-full rounded-xl border pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:bg-slate-50",
              error ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-[#14848D]",
            )}
          />
        </div>
        <button
          type="submit"
          disabled={cargando || guardando || sinCambios}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#14848D] px-5 text-sm font-bold text-white hover:bg-[#0F6E75] disabled:opacity-60"
        >
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          {guardando ? "Guardando..." : "Guardar enlace"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      {aviso && (
        <p role="status" className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#0F6E75]">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {aviso}
        </p>
      )}

      {guardado ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#14848D]" />
            Enlace guardado{plataforma ? ` · ${plataforma}` : ""}
          </span>
          <a
            href={guardado}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-bold text-[#14848D] hover:underline"
          >
            Probar enlace
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            type="button"
            onClick={quitar}
            disabled={guardando}
            className="font-semibold text-red-600 hover:underline disabled:opacity-60"
          >
            Quitar
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          {cargando ? "" : "Pega el enlace de tu sala de Google Meet, Zoom, Teams o Jitsi. "}
          Tus estudiantes verán este enlace en sus clases reservadas.
        </p>
      )}
    </form>
  );
}
