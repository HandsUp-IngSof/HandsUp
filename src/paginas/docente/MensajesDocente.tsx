import { MessagesSquare } from "lucide-react";

import { EncabezadoSeccion } from "@/componentes/layout/EncabezadoSeccion";

// Pagina "Mensajes" del docente. Se implementa en SCRUM-44 (mensajeria interna tipo chat).
export function MensajesDocente() {
  return (
    <>
      <EncabezadoSeccion
        titulo="Mensajes"
        descripcion="Conversa con tus estudiantes y resuelve sus dudas."
      />
      <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCE4EF] text-[#B5246E]">
          <MessagesSquare className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-slate-800">Muy pronto podrás chatear aquí</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Estamos construyendo la mensajería para que hables con tus estudiantes sin salir de handsUp.
        </p>
      </section>
    </>
  );
}
