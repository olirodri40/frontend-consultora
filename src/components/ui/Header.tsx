// src/components/ui/Header.tsx
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, BellOff, Menu } from 'lucide-react';
import { activarNotificaciones, desactivarNotificaciones, verificarSuscripcion } from '../../services/push.service';
import { getNotificaciones, marcarLeida, marcarTodasLeidas } from '../../services/notificaciones.service';
import { useIsMobile } from '../../hooks/useIsMobile';

const titulosPorRuta: Record<string, string> = {
  '/': 'Dashboard',
  '/agenda': 'Agenda',
  '/pacientes': 'Pacientes',
  '/zumba': 'Zumba',
  '/gerontologia': 'Gerontología',
  '/notas': 'Notas',
  '/reportes': 'Reportes',
  '/admin': 'Administración',
  '/sitio-web': 'Sitio Web',
  '/perfil': 'Mi perfil',
};

export default function Header() {
  const { usuario } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifActivas, setNotifActivas] = useState(false);
  const [cargandoNotif, setCargandoNotif] = useState(false);

  const [listaAbierta, setListaAbierta] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState<any>(null);

  useEffect(() => {
    verificarSuscripcion().then(setNotifActivas);
  }, []);

  // Cargar notificaciones al inicio, y refrescar cada 60s (para el contador)
  useEffect(() => {
    cargarNotificaciones();
    const interval = setInterval(cargarNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar el desplegable al hacer clic afuera
  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setListaAbierta(false);
      }
    }
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  async function cargarNotificaciones() {
    try {
      const data = await getNotificaciones();
      setNotificaciones(data.notificaciones);
      setNoLeidas(data.noLeidas);
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleNotificaciones() {
    setCargandoNotif(true);
    try {
      if (notifActivas) {
        await desactivarNotificaciones();
        setNotifActivas(false);
      } else {
        const ok = await activarNotificaciones();
        setNotifActivas(ok);
        if (!ok) {
          alert('No se pudo activar. Revisa los permisos de notificación en tu navegador.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error al cambiar el estado de las notificaciones');
    } finally {
      setCargandoNotif(false);
    }
  }

  async function abrirLista() {
    setListaAbierta(!listaAbierta);
    if (!listaAbierta) {
      await cargarNotificaciones();
    }
  }

  async function handleClickNotificacion(n: any) {
    if (!n.leido) {
      await marcarLeida(n.id);
      await cargarNotificaciones();
    }
    setListaAbierta(false);
    setNotificacionSeleccionada(n); // 👈 abre el modal en vez de navegar
  }

  async function handleMarcarTodas() {
    await marcarTodasLeidas();
    await cargarNotificaciones();
  }

  function formatTiempo(fecha: string) {
    const diff = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Ahora';
    if (min < 60) return `Hace ${min} min`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `Hace ${horas}h`;
    return new Date(fecha).toLocaleDateString('es');
  }

  function parsearCuerpo(n: any) {
    // Separamos el "antes" si es una reagendación
    const matchAntes = n.cuerpo.match(/^(.*)\(antes (.*)\)$/);
    const cuerpoPrincipal = matchAntes ? matchAntes[1].trim() : n.cuerpo;
    const antes = matchAntes ? matchAntes[2].trim() : null;

    const partes = cuerpoPrincipal.split(' · ').map((p: string) => p.trim());

    return { partes, antes };
  }

  const fecha = new Date().toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const tituloActual = titulosPorRuta[location.pathname] || 'Dashboard';

  const toggleSidebar = () => {
    const event = new CustomEvent('toggleSidebar');
    window.dispatchEvent(event);
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shrink-0 relative">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Abrir menú"
            >
              <Menu size={22} className="text-gray-700" />
            </button>
          )}

          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">{tituloActual}</h1>
            <p className="text-xs text-gray-400 capitalize hidden sm:block">{fecha}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative" ref={menuRef}>
            <button
              onClick={abrirLista}
              className="relative w-9 h-9 md:w-10 md:h-10 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
              title="Notificaciones"
            >
              <Bell size={18} className={`md:w-5 md:h-5 ${noLeidas > 0 ? 'text-[#A000D1]' : 'text-gray-600'}`} />
              {noLeidas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {noLeidas > 9 ? '9+' : noLeidas}
                </span>
              )}
            </button>

            {listaAbierta && (
              <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-auto mt-0 sm:mt-2 sm:w-80 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-semibold text-gray-800 text-sm">Notificaciones</p>
                  {noLeidas > 0 && (
                    <button onClick={handleMarcarTodas} className="text-xs text-[#A000D1] hover:underline font-medium">
                      Marcar todas leídas
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notificaciones.length === 0 ? (
                    <p className="text-center py-8 text-gray-400 text-sm">Sin notificaciones</p>
                  ) : (
                    notificaciones.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleClickNotificacion(n)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors flex gap-2 ${!n.leido ? 'bg-violet-50/50' : ''}`}
                      >
                        {!n.leido && <span className="w-2 h-2 rounded-full bg-[#A000D1] mt-1.5 flex-shrink-0" />}
                        <div className={`min-w-0 flex-1 ${n.leido ? 'pl-4' : ''}`}>
                          <p className="text-sm font-semibold text-gray-800 truncate">{n.titulo}</p>
                          <p className="text-xs text-gray-500 truncate">{n.cuerpo}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{formatTiempo(n.created_at)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                  <button
                    onClick={toggleNotificaciones}
                    disabled={cargandoNotif}
                    className="w-full text-xs text-center text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {notifActivas ? <Bell size={12} /> : <BellOff size={12} />}
                    {notifActivas ? 'Notificaciones push activas' : 'Activar notificaciones push'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#c100ff] flex items-center justify-center text-white text-sm font-bold">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {usuario?.nombre}
            </span>
          </div>
        </div>
      </header>

      {/* Modal de detalle de notificación */}
      {notificacionSeleccionada && (() => {
        const { partes, antes } = parsearCuerpo(notificacionSeleccionada);
        return (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={() => setNotificacionSeleccionada(null)}
          >
            <div
              className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl border border-[#efedf0]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{notificacionSeleccionada.titulo}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(notificacionSeleccionada.created_at).toLocaleString('es')}
                  </p>
                </div>
                <button
                  onClick={() => setNotificacionSeleccionada(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all text-sm font-bold flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {partes.map((p: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2">
                    {p}
                  </div>
                ))}

                {antes && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Horario anterior</p>
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 line-through">
                      {antes}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setNotificacionSeleccionada(null)}
                className="w-full mt-5 bg-[#A000D1] hover:bg-[#8800b3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-purple-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );
}