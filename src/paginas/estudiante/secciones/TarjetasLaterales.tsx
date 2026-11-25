import { Link } from "react-router-dom";
import { ArrowRight, CalendarPlus, ChartLine, Flame, Sparkles, Trophy, Video } from "lucide-react";

import { Avatar } from "@/componentes/UI/Avatar";
import { iconoDeInsignia } from "@/lib/iconos";
import type { ClaseBD, Insignia, Progreso } from "@/paginas/estudiante/modelo";

// =====================================================================
// Tarjetas de la columna derecha del inicio del estudiante (SCRUM-58),
// ahora con datos reales: progreso (SCRUM-34), insignias (SCRUM-35) y clases (SCRUM-39).
// Todas las horas se muestran en hora de Colombia.
// =====================================================================

const ZONA = "America/Bogota";

const formatoDia = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: ZONA,
});

const formatoHora = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: ZONA,
});

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

// "Jueves, 22 de octubre"
export function diaClase(fecha: Date): string {
  const [dia, ...resto] = formatoDia.format(fecha).split(" ");
  return capitalizar(`${dia.replace(",", "")}, ${resto.join(" ")}`);
}

// "4:00 p. m. – 4:30 p. m."
export function horarioClase(clase: { inicio: Date; fin: Date }): string {
  return `${formatoHora.format(clase.inicio)} – ${formatoHora.format(clase.fin)}`;
}

// "Así vas": porcentaje de la ruta completada y racha (SCRUM-34 y SCRUM-35).
export function TarjetaProgreso({ progreso }: { progreso: Progreso }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800">Así vas</h2>
        <ChartLine className="h-5 w-5 text-[#14848D]" />
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-[#14848D]">{progreso.porcentaje}%</span>
        <span className="text-xs text-slate-500">de tu ruta completada</span>
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={progreso.porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso de tu ruta"
      >
        <div className="h-full rounded-full bg-[#14848D]" style={{ width: `${progreso.porcentaje}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {progreso.completadas} de {progreso.total} {progreso.total === 1 ? "lección" : "lecciones"}
        </span>
        <span className="flex items-center gap-1 font-semibold text-[#B5246E]">
          <Flame className="h-3.5 w-3.5" />
          {progreso.racha} {progreso.racha === 1 ? "día de racha" : "días de racha"}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {progreso.racha > 0 ? "¡Estás construyendo un gran hábito!" : "Completa una lección hoy para empezar tu racha."}
      </p>
      <Link
        to="/estudiante/progreso"
        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#14848D] hover:underline"
      >
        Ver mi progreso
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

// Proxima clase en vivo (SCRUM-39). Mientras el estudiante no haya tenido su clase de bienvenida,
// la tarjeta se presenta como "Tu clase de bienvenida".
export function TarjetaProximaClase({ clase, bienvenidaCumplida }: { clase: ClaseBD | null; bienvenidaCumplida: boolean }) {
  const titulo = bienvenidaCumplida ? "Tu próxima clase" : "Tu clase de bienvenida";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800">{titulo}</h2>
        <Video className="h-5 w-5 text-[#14848D]" />
      </div>

      {clase ? (
        <>
          <div className="mt-3 flex items-center gap-3">
            <Avatar nombre={clase.docente} url={clase.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">{clase.docente}</p>
              <p className="text-xs text-slate-500">
                {clase.estado === "pendiente" ? "Por confirmar" : "Tu docente de LSC"}
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-800">{diaClase(clase.inicio)}</p>
            <p className="text-xs text-slate-500">{horarioClase(clase)} · Hora de Colombia</p>
          </div>
          {!bienvenidaCumplida && (
            <p className="mt-3 text-xs text-slate-500">
              Conoce a {clase.docente.split(" ")[0]} y activa tu primer módulo de conversación en vivo.
            </p>
          )}
          <Link
            to="/estudiante/clases"
            className="mt-4 block w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-bold text-[#14848D] hover:bg-slate-50"
          >
            Ver detalle de la clase
          </Link>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-slate-600">
            {bienvenidaCumplida
              ? "No tienes clases agendadas. Reserva una para practicar en vivo."
              : "Agenda tu primera clase en vivo con un docente y activa tus módulos de conversación."}
          </p>
          <Link
            to="/estudiante/clases"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#14848D] py-2.5 text-sm font-bold text-white hover:bg-[#0F6E75]"
          >
            <CalendarPlus className="h-4 w-4" />
            Agendar clase
          </Link>
        </>
      )}
    </section>
  );
}

// Ultimas insignias ganadas (SCRUM-35).
export function TarjetaInsignias({ insignias }: { insignias: Insignia[] }) {
  const obtenidas = insignias
    .filter((i) => i.obtenidaEn)
    .sort((a, b) => b.obtenidaEn!.getTime() - a.obtenidaEn!.getTime());

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800">Tus insignias</h2>
        <Trophy className="h-5 w-5 text-[#B5246E]" />
      </div>

      {obtenidas.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Completa tu primera lección para ganar tu primera insignia.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {obtenidas.slice(0, 3).map((insignia) => {
            const Icono = iconoDeInsignia(insignia.icono);
            return (
              <li key={insignia.id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FCE4EF] text-[#B5246E]">
                  <Icono className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-800">{insignia.nombre}</span>
                  <span className="block truncate text-xs text-slate-500">{insignia.descripcion}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/estudiante/progreso"
        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#14848D] hover:underline"
      >
        {obtenidas.length} de {insignias.length} · Ver todas
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

// "5 minutos para ti": una practica corta para el dia.
export function TarjetaConsejo({ consejo }: { consejo: string }) {
  return (
    <section className="rounded-2xl bg-[#FCE4EF] p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-[#B5246E]">
        <Sparkles className="h-4 w-4" />5 minutos para ti
      </p>
      <p className="mt-1 text-sm text-slate-700">{consejo}</p>
    </section>
  );
}
