// Titulo y descripcion al inicio de cada pagina interna de un panel.
export function EncabezadoSeccion({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">{titulo}</h1>
      <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
    </div>
  );
}
