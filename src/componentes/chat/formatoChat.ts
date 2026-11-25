// Fechas y horas del chat en español de Colombia.

const formatoHora = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" });
const formatoDia = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long" });
const formatoCorto = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });

const inicioDelDia = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
const diasAtras = (fecha: Date) => Math.round((inicioDelDia(new Date()) - inicioDelDia(fecha)) / 86_400_000);

export const hora = (iso: string) => formatoHora.format(new Date(iso));

// Separador entre dias dentro del chat: "Hoy", "Ayer" o "24 de noviembre".
export function etiquetaDia(iso: string): string {
  const fecha = new Date(iso);
  const dias = diasAtras(fecha);
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  return formatoDia.format(fecha);
}

// Fecha corta en la lista de chats: "4:05 p. m.", "Ayer" o "20 nov".
export function fechaCorta(iso: string): string {
  const fecha = new Date(iso);
  const dias = diasAtras(fecha);
  if (dias === 0) return formatoHora.format(fecha);
  if (dias === 1) return "Ayer";
  return formatoCorto.format(fecha);
}

export const mismoDia = (a: string, b: string) => inicioDelDia(new Date(a)) === inicioDelDia(new Date(b));
