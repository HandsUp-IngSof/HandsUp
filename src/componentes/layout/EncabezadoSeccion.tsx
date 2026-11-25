import { useEffect } from "react";

// Titulo y descripcion al inicio de cada pagina interna de un panel.
// Tambien cambia el titulo de la pestaña ("Mis módulos · handsUp") para que el lector de
// pantalla y la persona sepan en que pagina estan (WCAG 2.4.2, SCRUM-28).
export function EncabezadoSeccion({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  useEffect(() => {
    const anterior = document.title;
    document.title = `${titulo} · handsUp`;
    return () => {
      document.title = anterior;
    };
  }, [titulo]);

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">{titulo}</h1>
      <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
    </div>
  );
}
