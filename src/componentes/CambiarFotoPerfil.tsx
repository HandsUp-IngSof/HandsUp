import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { useActualizarPerfil, usePerfil } from "@/componentes/RutaProtegida";
import { FotoPerfil } from "@/componentes/UI/FotoPerfil";
import { Ventana } from "@/componentes/UI/Ventana";
import { quitarFotoPerfil, subirFotoPerfil } from "@/lib/fotoPerfil";

interface CambiarFotoPerfilProps {
  abierta: boolean;
  onCerrar: () => void;
}

// Ventana para subir, cambiar o quitar la foto de perfil del usuario con sesion (SCRUM-45).
// Usa el componente FotoPerfil para elegir la imagen y Supabase Storage para guardarla.
export function CambiarFotoPerfil({ abierta, onCerrar }: CambiarFotoPerfilProps) {
  const perfil = usePerfil();
  const actualizarPerfil = useActualizarPerfil();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que se abre, empieza sin archivo elegido.
  useEffect(() => {
    if (!abierta) return;
    setArchivo(null);
    setError(null);
  }, [abierta]);

  const ejecutar = async (accion: () => Promise<string | null>) => {
    setGuardando(true);
    setError(null);
    try {
      const url = await accion();
      actualizarPerfil({ avatar_url: url });
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la foto.");
    } finally {
      setGuardando(false);
    }
  };

  const guardar = () => {
    if (!archivo) return;
    ejecutar(() => subirFotoPerfil(perfil.id, archivo));
  };

  const quitar = () =>
    ejecutar(async () => {
      await quitarFotoPerfil(perfil.id);
      return null;
    });

  return (
    <Ventana titulo="Foto de perfil" abierta={abierta} onCerrar={onCerrar}>
      <div className="space-y-5">
        <FotoPerfil value={archivo} onChange={setArchivo} urlActual={perfil.avatar_url} opcional={false} />

        <p className="text-center text-xs text-slate-500">JPG, PNG o WEBP de máximo 2 MB.</p>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {perfil.avatar_url && !archivo ? (
            <button
              type="button"
              onClick={quitar}
              disabled={guardando}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Quitar foto
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={!archivo || guardando}
              className="flex items-center gap-2 rounded-xl bg-[#14848D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F6E75] disabled:opacity-60"
            >
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              {guardando ? "Guardando..." : "Guardar foto"}
            </button>
          </div>
        </div>
      </div>
    </Ventana>
  );
}
