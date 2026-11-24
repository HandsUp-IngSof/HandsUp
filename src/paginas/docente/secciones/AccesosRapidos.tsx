import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, CalendarDays, MessageCircle, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { resumenEjemplo } from "@/paginas/docente/datosEjemplo";

interface Acceso {
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  ruta: string;
  estilo: "principal" | "verde" | "rosado";
}

const accesos: Acceso[] = [
  {
    titulo: "Calendario",
    descripcion: "Disponibilidad y enlace de clase",
    icono: CalendarDays,
    ruta: "/docente/calendario",
    estilo: "principal",
  },
  {
    titulo: "Mis estudiantes",
    descripcion: `${resumenEjemplo.estudiantesActivos} personas aprendiendo contigo`,
    icono: Users,
    ruta: "/docente/estudiantes",
    estilo: "verde",
  },
  {
    titulo: "Contactar estudiante",
    descripcion: "Acompaña y resuelve sus dudas",
    icono: MessageCircle,
    ruta: "/docente/mensajes",
    estilo: "rosado",
  },
];

// Tarjetas de acceso rapido a las secciones del panel.
export function AccesosRapidos() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {accesos.map(({ titulo, descripcion, icono: Icono, ruta, estilo }) => {
        const principal = estilo === "principal";
        return (
          <Link
            key={titulo}
            to={ruta}
            className={cn(
              "group flex items-center gap-4 rounded-2xl p-5 transition-shadow hover:shadow-md",
              principal ? "bg-[#14848D] text-white" : "border border-slate-200 bg-white text-slate-800",
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                principal && "bg-white/15",
                estilo === "verde" && "bg-[#E7F3F3] text-[#14848D]",
                estilo === "rosado" && "bg-[#FCE4EF] text-[#B5246E]",
              )}
            >
              <Icono className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{titulo}</span>
              <span className={cn("block truncate text-xs", principal ? "text-white/80" : "text-slate-500")}>
                {descripcion}
              </span>
            </span>
            <ArrowUpRight
              className={cn(
                "h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                principal ? "text-white" : "text-[#14848D]",
              )}
            />
          </Link>
        );
      })}
    </section>
  );
}
