import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Bell, BellRing, CalendarDays, Check, MessageCircle, X } from "lucide-react";

import { usePerfil } from "@/componentes/RutaProtegida";
import {
  escucharNotificaciones,
  hace,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  mostrarEnNavegador,
  obtenerNotificaciones,
  pedirPermisoNavegador,
  permisoNavegador,
  type Notificacion,
  type PermisoNavegador,
  type TipoNotificacion,
} from "@/lib/notificaciones";
import { cn } from "@/lib/utils";

const ICONOS: Record<TipoNotificacion, LucideIcon> = {
  mensaje: MessageCircle,
  clase: CalendarDays,
  sistema: Bell,
};

function IconoTipo({ tipo }: { tipo: TipoNotificacion }) {
  const Icono = ICONOS[tipo] ?? Bell;
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        tipo === "mensaje" ? "bg-[#FCE4EF] text-[#B5246E]" : "bg-[#E7F3F3] text-[#14848D]",
      )}
    >
      <Icono className="h-4 w-4" />
    </span>
  );
}

// Campana del encabezado (SCRUM-49): numero de avisos sin leer, lista, aviso emergente
// cuando llega algo nuevo y notificacion del navegador si la pestaña no esta a la vista.
export function CampanaNotificaciones() {
  const perfil = usePerfil();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [lista, setLista] = useState<Notificacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState(false);
  const [emergente, setEmergente] = useState<Notificacion | null>(null);
  const [permiso, setPermiso] = useState<PermisoNavegador>(permisoNavegador());
  const contenedorRef = useRef<HTMLDivElement>(null);
  const urlActual = `${pathname}${search}`;
  const urlRef = useRef(urlActual);
  urlRef.current = urlActual;

  const recargar = useCallback(() => {
    obtenerNotificaciones()
      .then((datos) => {
        setLista(datos);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const abrir = useCallback(
    (n: Notificacion) => {
      if (!n.leida) {
        setLista((actual) => actual.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
        marcarNotificacionLeida(n.id);
      }
      setAbierta(false);
      setEmergente(null);
      if (n.enlace) navigate(n.enlace);
    },
    [navigate],
  );

  // Carga inicial y tiempo real.
  useEffect(() => {
    recargar();
    return escucharNotificaciones(perfil.id, (n, nueva) => {
      recargar();
      if (!nueva) return;
      // Si ya estas viendo esa pagina (por ejemplo, el chat), no hace falta avisar.
      if (n.enlace && n.enlace === urlRef.current) {
        marcarNotificacionLeida(n.id);
        return;
      }
      setEmergente(n); // canal 2: aviso dentro de la app
      mostrarEnNavegador(n, () => abrir(n)); // canal 3: navegador (si la pestaña no esta a la vista)
    });
  }, [perfil.id, recargar, abrir]);

  // Al entrar a la pagina de un aviso sin leer (por ejemplo, el chat), se marca como leido.
  useEffect(() => {
    const pendientes = lista.filter((n) => !n.leida && n.enlace === urlActual);
    if (pendientes.length === 0) return;
    setLista((actual) => actual.map((x) => (pendientes.some((p) => p.id === x.id) ? { ...x, leida: true } : x)));
    pendientes.forEach((p) => marcarNotificacionLeida(p.id));
  }, [urlActual, lista]);

  // El aviso emergente se va solo a los 6 segundos.
  useEffect(() => {
    if (!emergente) return;
    const temporizador = setTimeout(() => setEmergente(null), 6000);
    return () => clearTimeout(temporizador);
  }, [emergente]);

  // Cierra la lista al hacer clic afuera o con Escape.
  useEffect(() => {
    if (!abierta) return;
    const alClic = (e: MouseEvent) => {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbierta(false);
    };
    const alTecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierta(false);
    document.addEventListener("mousedown", alClic);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, [abierta]);

  const sinLeer = lista.filter((n) => !n.leida).length;

  const marcarTodas = () => {
    setLista((actual) => actual.map((n) => ({ ...n, leida: true })));
    marcarTodasLeidas(perfil.id);
  };

  const activarNavegador = async () => setPermiso(await pedirPermisoNavegador());

  return (
    <>
      <div className="relative" ref={contenedorRef}>
        <button
          type="button"
          onClick={() => setAbierta((a) => !a)}
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label={sinLeer > 0 ? `Notificaciones: ${sinLeer} sin leer` : "Notificaciones"}
          aria-expanded={abierta}
        >
          <Bell className="h-5 w-5" />
          {sinLeer > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#B5246E] px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {sinLeer > 9 ? "9+" : sinLeer}
            </span>
          )}
        </button>

        {abierta && (
          <div className="fixed inset-x-3 top-16 z-30 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="font-bold text-slate-800">Notificaciones</p>
              {sinLeer > 0 && (
                <button type="button" onClick={marcarTodas} className="flex items-center gap-1 text-xs font-bold text-[#14848D] hover:underline">
                  <Check className="h-3.5 w-3.5" />
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {error ? (
                <p className="m-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              ) : lista.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">No tienes notificaciones todavía.</p>
              ) : (
                <ul>
                  {lista.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => abrir(n)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50",
                          !n.leida && "bg-[#F4FAF9]",
                        )}
                      >
                        <IconoTipo tipo={n.tipo} />
                        <span className="min-w-0 flex-1">
                          <span className={cn("block text-sm text-slate-800", !n.leida ? "font-bold" : "font-semibold")}>
                            {n.titulo}
                          </span>
                          {n.texto && <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.texto}</span>}
                          <span className="mt-1 block text-[11px] text-slate-400">{hace(n.creado_en)}</span>
                        </span>
                        {!n.leida && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#B5246E]" aria-label="Sin leer" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Canal 3: avisos del navegador */}
            {permiso !== "no-soportado" && (
              <div className="border-t border-slate-100 px-4 py-3 text-xs">
                {permiso === "granted" ? (
                  <p className="flex items-center gap-1.5 text-[#0F6E75]">
                    <BellRing className="h-3.5 w-3.5" />
                    Avisos del navegador activados.
                  </p>
                ) : permiso === "denied" ? (
                  <p className="text-slate-500">Los avisos del navegador están bloqueados. Puedes activarlos en la configuración del navegador.</p>
                ) : (
                  <button type="button" onClick={activarNavegador} className="flex items-center gap-1.5 font-bold text-[#14848D] hover:underline">
                    <BellRing className="h-3.5 w-3.5" />
                    Activar avisos del navegador
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Canal 2: aviso emergente dentro de la app */}
      {emergente && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
        >
          <IconoTipo tipo={emergente.tipo} />
          <button type="button" onClick={() => abrir(emergente)} className="min-w-0 flex-1 text-left">
            <span className="block text-sm font-bold text-slate-800">{emergente.titulo}</span>
            {emergente.texto && <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{emergente.texto}</span>}
          </button>
          <button
            type="button"
            onClick={() => setEmergente(null)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
