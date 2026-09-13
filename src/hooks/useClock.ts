import { useState } from 'react';
import { useInterval } from './useInterval';

// Devuelve la hora actual y se refresca sola cada `refreshMs` (1 minuto por
// defecto) — usado para que los avisos de "asistencia pendiente" en
// Gerontología y Zumba se prendan solos sin recargar la página.
export function useClock(refreshMs = 60_000): Date {
  const [ahora, setAhora] = useState(() => new Date());
  useInterval(() => setAhora(new Date()), refreshMs);
  return ahora;
}
