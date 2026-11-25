import { BookOpen } from "lucide-react";

import { PaginaMensajes } from "@/componentes/chat/PaginaMensajes";
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
    <PaginaMensajes
      descripcion="Conversa con tus docentes y resuelve tus dudas."
      sinContactos="Aún no tienes docentes. Cuando agendes una clase, podrás escribirle a tu docente aquí."
    />
  );
}
