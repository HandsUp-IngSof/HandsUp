import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Ventana } from "@/componentes/UI/Ventana";
import { validarNuevoHorario } from "@/paginas/docente/consultas";

// Horas que se pueden elegir (cada hora, de 7:00 a. m. a 7:00 p. m.).
const HORAS = Array.from({ length: 13 }, (_, i) => i + 7);
const DURACIONES = [30, 45, 60];

const formatoHora = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" });

// "2026-11-25" a partir de una fecha local.
function aTextoFecha(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

interface VentanaNuevoHorarioProps {
  abierta: boolean;
  // Fecha y hora sugeridas al abrir (por ejemplo, la celda en la que se hizo clic).
  sugerencia: Date | null;
  onCerrar: () => void;
  onGuardar: (inicio: Date, minutos: number) => Promise<void>;
}

// Formulario para que el docente agregue un horario disponible (SCRUM-41).
export function VentanaNuevoHorario({ abierta, sugerencia, onCerrar, onGuardar }: VentanaNuevoHorarioProps) {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState(9);
  const [minutos, setMinutos] = useState(45);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Cada vez que se abre, se precargan la fecha y la hora sugeridas.
  useEffect(() => {
    if (!abierta) return;
    const base = sugerencia ?? new Date();
    setFecha(aTextoFecha(base));
    setHora(sugerencia ? sugerencia.getHours() : 9);
    setMinutos(45);
    setError(null);
  }, [abierta, sugerencia]);

  const guardar = async (evento: React.SubmitEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const [anio, mes, dia] = fecha.split("-").map(Number);
    const inicio = new Date(anio, mes - 1, dia, hora, 0);

    const mensaje = fecha ? validarNuevoHorario(inicio) : "Elige una fecha.";
    if (mensaje) {
      setError(mensaje);
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await onGuardar(inicio, minutos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el horario.");
    } finally {
      setGuardando(false);
    }
  };

  const campo =
    "mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#14848D]";

  return (
    <Ventana titulo="Añadir horario" abierta={abierta} onCerrar={onCerrar}>
      <form onSubmit={guardar} className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Fecha
          <input
            type="date"
            value={fecha}
            min={aTextoFecha(new Date())}
            onChange={(e) => setFecha(e.target.value)}
            className={campo}
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold text-slate-700">
            Hora de inicio
            <select value={hora} onChange={(e) => setHora(Number(e.target.value))} className={campo}>
              {HORAS.map((h) => (
                <option key={h} value={h}>
                  {formatoHora.format(new Date(2026, 0, 1, h, 0))}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Duración
            <select value={minutos} onChange={(e) => setMinutos(Number(e.target.value))} className={campo}>
              {DURACIONES.map((m) => (
                <option key={m} value={m}>
                  {m} minutos
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-xs text-slate-500">Hora de Colombia. Solo de lunes a viernes.</p>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

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
            {guardando ? "Guardando..." : "Guardar horario"}
          </button>
        </div>
      </form>
    </Ventana>
  );
}
