import { useState, useEffect } from 'react';

// Se repetía el mismo patrón (useState + listener de "resize" comparando
// contra 768px) en Agenda, Header y Sidebar — centralizado acá para no
// duplicarlo cada vez que se agrega una pantalla nueva.
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < breakpoint);
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}
