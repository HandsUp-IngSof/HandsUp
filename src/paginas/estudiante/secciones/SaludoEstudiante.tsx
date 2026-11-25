const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Saludo del estudiante con la fecha de hoy (SCRUM-58).
export function SaludoEstudiante({ nombre }: { nombre: string }) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{formatoFecha.format(new Date())}</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-800 sm:text-3xl">¡Hola, {nombre}! Sigamos conectando.</h1>
      <p className="mt-1 text-sm text-slate-500">Un pequeño paso hoy, una nueva conversación mañana.</p>
    </section>
  );
}
