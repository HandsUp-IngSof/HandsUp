import { BookOpen, CalendarDays, MessagesSquare } from "lucide-react";

import { PaginaPronto } from "@/componentes/layout/PaginaPronto";

// Paginas del menu del estudiante que todavia no tienen contenido (SCRUM-58).

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

export function MensajesEstudiante() {
  return (
    <PaginaPronto
      titulo="Mensajes"
      descripcion="Conversa con tus docentes y resuelve tus dudas."
      icono={MessagesSquare}
      mensaje="Muy pronto podrás chatear aquí"
      detalle="Estamos construyendo la mensajería para que hables con tus docentes sin salir de handsUp."
    />
  );
}
