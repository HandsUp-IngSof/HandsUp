import { BookOpen, MessagesSquare } from "lucide-react";

import { PaginaPronto } from "@/componentes/layout/PaginaPronto";

// Paginas del menu del estudiante que todavia no tienen contenido.
// "Mis clases" ya esta implementada en ClasesEstudiante.tsx (SCRUM-39).

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
