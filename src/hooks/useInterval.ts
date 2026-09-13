import { useEffect, useRef } from 'react';

// Ejecuta `callback` cada `delayMs` milisegundos mientras el componente esté
// montado — reemplaza el patrón repetido de `setInterval` + `clearInterval`
// en un useEffect (usado para refrescar notificaciones, el "reloj" de
// Gerontología/Zumba que activa el aviso de asistencia pendiente, etc.).
// `callback` puede cambiar entre renders sin reiniciar el interval.
export function useInterval(callback: () => void, delayMs: number | null) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (delayMs === null) return;
    const id = setInterval(() => callbackRef.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
