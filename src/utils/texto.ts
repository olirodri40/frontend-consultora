// Pone en mayúscula la primera letra de cada palabra — "juan perez" → "Juan Perez".
export function capitalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}
