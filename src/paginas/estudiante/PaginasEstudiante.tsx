import { BookOpen, CalendarDays } from "lucide-react";

import { PaginaMensajes } from "@/componentes/chat/PaginaMensajes";
import { PaginaPronto } from "@/componentes/layout/PaginaPronto";

// Paginas del menu del estudiante (SCRUM-58). Diccionario y Mis clases todavia no tienen contenido.

export function DiccionarioEstudiante() {
  return (
    <PaginaPronto
      titulo="Diccionario LSC"
      descripcion="Busca una palabra y aprende su seña."
      icono={BookOpen}
      mensaje="Muy pronto podrás buscar señas aquí"
      detalle="Estamos preparando el diccionario con videos de cada seña."
    />
  );
}

// Se implementa en SCRUM-39 (agendamiento de clases por parte del estudiante).
export function ClasesEstudiante() {
  return (
    <PaginaPronto
      titulo="Mis clases"
      descripcion="Reserva tus clases en vivo y revisa las que tienes agendadas."
      icono={CalendarDays}
      mensaje="Muy pronto podrás reservar tus clases aquí"
      detalle="Verás los horarios de tus docentes y podrás agendar una clase en vivo."
    />
  );
}

// Chat con sus docentes (SCRUM-44).
export function MensajesEstudiante() {
  return (
    <PaginaMensajes
      descripcion="Conversa con tus docentes y resuelve tus dudas."
      sinContactos="Aún no tienes docentes. Cuando agendes una clase, podrás escribirle a tu docente aquí."
    />
  );
}
