import { PaginaMensajes } from "@/componentes/chat/PaginaMensajes";

// Pagina "Mensajes" del docente: chat con sus estudiantes (SCRUM-44).
export function MensajesDocente() {
  return (
    <PaginaMensajes
      descripcion="Conversa con tus estudiantes y resuelve sus dudas."
      sinContactos="Aún no tienes estudiantes. Cuando alguien agende una clase contigo, podrás escribirle aquí."
    />
  );
}
