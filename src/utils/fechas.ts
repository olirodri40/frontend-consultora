// Formatea una fecha 'YYYY-MM-DD' (o con hora pegada al final) como
// "jueves, 10 de septiembre" en español — usado en varios lugares de la
// Agenda para mostrar la fecha de una cita de forma legible.
export function formatFecha(fecha: string): string {
  if (!fecha) return '';
  const soloFecha = fecha.toString().slice(0, 10);
  return new Date(soloFecha + 'T00:00:00').toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
