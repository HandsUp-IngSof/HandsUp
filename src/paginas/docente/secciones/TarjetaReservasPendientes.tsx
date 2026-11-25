import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarClock, Check, CheckCircle2, Loader2, X } from "lucide-react";

import { usePerfil } from "@/componentes/RutaProtegida";
import { Avatar } from "@/componentes/UI/Avatar";
import { obtenerReservasPendientes, responderReserva, type ReservaPendiente } from "@/paginas/docente/reservas";

const formatoDia = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });
const formatoHora = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" });
const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// Clases que los estudiantes reservaron y el docente debe confirmar o rechazar (SCRUM-39).
// Solo se muestra si hay alguna pendiente. Al responder, el estudiante recibe la notificacion.
export function TarjetaReservasPendientes({ onCambio }: { onCambio: () => void }) {
  const perfil = usePerfil();
  const [reservas, setReservas] = useState<ReservaPendiente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState<string | null>(null); // id de la reserva que se esta respondiendo
  const [porRechazar, setPorRechazar] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      setReservas(await obtenerReservasPendientes(perfil.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las reservas.");
    }
  }, [perfil.id]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const responder = async (reserva: ReservaPendiente, confirmar: boolean) => {
    setOcupada(reserva.id);
    setError(null);
    try {
      await responderReserva(reserva.id, confirmar);
      const primerNombre = reserva.estudiante.split(" ")[0];
      setAviso(
        confirmar
          ? `Clase con ${primerNombre} confirmada. Le llegó la notificación.`
          : `Reserva de ${primerNombre} rechazada. El horario volvió a quedar libre.`,
      );
      setPorRechazar(null);
      await recargar();
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo responder la reserva.");
    } finally {
      setOcupada(null);
    }
  };

  if (reservas.length === 0 && !aviso && !error) return null;

  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-5" aria-labelledby="titulo-reservas">
      <h2 id="titulo-reservas" className="flex items-center gap-2 font-bold text-slate-800">
        <CalendarClock className="h-5 w-5 text-amber-700" />
        Reservas por confirmar
        {reservas.length > 0 && (
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900">{reservas.length}</span>
        )}
      </h2>
      <p className="mt-0.5 text-xs text-slate-600">Tus estudiantes reservaron estas clases. Confírmalas para que sepan que vas.</p>

      {aviso && (
        <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-[#E3F3F0] p-3 text-sm font-semibold text-[#0F6E75]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {aviso}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {reservas.length > 0 && (
        <ul className="mt-4 space-y-3">
          {reservas.map((r) => (
            <li key={r.id} className="rounded-xl border border-amber-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar nombre={r.estudiante} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800">{r.estudiante}</p>
                  <p className="text-sm text-slate-600">
                    {capitalizar(formatoDia.format(r.inicio))} · {formatoHora.format(r.inicio)} – {formatoHora.format(r.fin)}
                  </p>
                  {r.notas && <p className="text-xs text-slate-500">{r.notas}</p>}
                </div>

                {porRechazar === r.id ? (
                  <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                    <span className="mr-auto text-sm text-red-700 sm:mr-0">¿Rechazar esta reserva?</span>
                    <button
                      type="button"
                      onClick={() => setPorRechazar(null)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => void responder(r, false)}
                      disabled={ocupada === r.id}
                      className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {ocupada === r.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      Sí, rechazar
                    </button>
                  </div>
                ) : (
                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setPorRechazar(r.id)}
                      disabled={ocupada !== null}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 sm:flex-none"
                    >
                      <X className="h-4 w-4" />
                      Rechazar
                    </button>
                    <button
                      type="button"
                      onClick={() => void responder(r, true)}
                      disabled={ocupada !== null}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#14848D] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F6E75] disabled:opacity-60 sm:flex-none"
                    >
                      {ocupada === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Confirmar
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
