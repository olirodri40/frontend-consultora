// Nombres de días en español, sin y con acento — la columna `dia` en la base
// de datos a veces se guarda sin tilde ("Miercoles") y a veces con tilde
// ("Miércoles"), así que todo el frontend necesita poder comparar ambas
// formas sin importarle cuál llegó del backend.
export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
export const DIAS_SEMANA_COMPLETA = [...DIAS_SEMANA, 'Domingo'];
export const DIAS_JS: Record<number, string> = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sabado',
};
export const DIAS_CORTOS_SEM = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MAPA_VOCALES_ACENTUADAS: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };

// Quita tildes de vocales para poder comparar "Miercoles" con "Miércoles",
// o "Sabado" con "Sábado", sin depender de cómo haya quedado guardado en
// la base de datos.
export function sinTildes(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .split('')
    .map(ch => MAPA_VOCALES_ACENTUADAS[ch] ?? ch)
    .join('');
}

export function mismoDia(diaA: string, diaB: string): boolean {
  return sinTildes(diaA) === sinTildes(diaB);
}
