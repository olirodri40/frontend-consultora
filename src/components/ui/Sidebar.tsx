// src/components/ui/Sidebar.tsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Dumbbell,
  HeartHandshake,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  StickyNote,
} from "lucide-react";

const rolesLabel: Record<string, string> = {
  administrador: 'Administrador',
  profesional: 'Profesional',
  recepcionista: 'Recepcionista',
  supervisor: 'Supervisor',
};

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  // Si la pantalla deja de ser mobile (ej. se gira la tablet), cerramos el
  // menú deslizable para no dejarlo abierto sobre el layout de escritorio.
  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  useEffect(() => {
    const handleToggle = () => {
      setMobileOpen(!mobileOpen);
    };
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, [mobileOpen]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // ========== VISIBILIDAD ==========
  const esAdmin = usuario?.rol === 'administrador' || usuario?.rol === 'supervisor';
  // Reportes/Admin/Sitio Web quedan reservados solo al administrador —
  // el supervisor tiene acceso a todo lo demás pero no a estas tres.
  const esAdministradorReal = usuario?.rol === 'administrador';
  const esRecepcionista = usuario?.rol === 'recepcionista';
  const esProfesional = usuario?.rol === 'profesional';

  const areasDelUsuario = usuario?.areas || [];
  const tieneArea = (nombre: string) => areasDelUsuario.some(a => a.toLowerCase() === nombre.toLowerCase());

  const tieneZumba = tieneArea('Zumba');
  const tieneGerontologia = tieneArea('Gerontologia');

  const tieneOtrasAreas = areasDelUsuario.some(a => {
    const nombre = a.toLowerCase();
    return nombre !== 'zumba' && nombre !== 'gerontologia';
  });

  const mostrarDashboardAgenda = !esProfesional || tieneOtrasAreas || (!tieneZumba && !tieneGerontologia);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', visible: mostrarDashboardAgenda },
    { to: '/agenda', icon: CalendarDays, label: 'Agenda', visible: mostrarDashboardAgenda },
    { to: '/pacientes', icon: Users, label: 'Pacientes', visible: esAdmin || esRecepcionista },
    { to: '/zumba', icon: Dumbbell, label: 'Zumba', visible: esAdmin || esRecepcionista || (esProfesional && tieneZumba) },
    { to: '/gerontologia', icon: HeartHandshake, label: 'Gerontología', visible: esAdmin || esRecepcionista || (esProfesional && tieneGerontologia) },
    { to: '/notas', icon: StickyNote, label: 'Notas', visible: true },
    { to: '/reportes', icon: BarChart3, label: 'Reportes', visible: esAdministradorReal },
    { to: '/admin', icon: Settings, label: 'Admin', visible: esAdministradorReal },
    { to: '/sitio-web', icon: Globe, label: 'Sitio Web', visible: esAdministradorReal },
  ];

  // ============================================
  // 👇 REDIRIGIR AL PRIMER BOTÓN VISIBLE
  // ============================================
  useEffect(() => {
    const primerosVisibles = navItems.filter(item => item.visible);
    if (primerosVisibles.length > 0) {
      const primeraRuta = primerosVisibles[0].to;
      // Solo redirigir si está en la raíz o en una ruta no válida.
      // "/perfil" no está en navItems (no tiene botón propio en el menú,
      // se accede desde el bloque de usuario) pero es una ruta válida.
      if (location.pathname !== '/perfil' && (location.pathname === '/' || location.pathname === '' || !navItems.some(item => item.to === location.pathname && item.visible))) {
        navigate(primeraRuta, { replace: true });
      }
    }
  }, []);

  // ============================================
  // MÓVIL - Sidebar deslizable
  // ============================================
  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={`
            fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50
            transition-transform duration-300 ease-in-out
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="text-sm font-bold text-[#c100ff]">SisMedy</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100"
            >
              <PanelLeftClose size={20} className="text-gray-500" />
            </button>
          </div>

          <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
            {navItems.filter(i => i.visible).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#c100ff] text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-gray-200 p-3 space-y-2">
            <button
              type="button"
              onClick={() => { navigate('/perfil'); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-[#c100ff] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {usuario?.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {usuario?.nombre}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {rolesLabel[usuario?.rol || ''] || usuario?.rol}
                </p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>
      </>
    );
  }

  // ============================================
  // DESKTOP - Sidebar fijo
  // ============================================
  const showText = !collapsed;

  return (
    <aside
      className={`
        bg-white border-r border-gray-200 flex flex-col h-full
        transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      <div className={`
        ${collapsed ? 'px-3 py-4' : 'px-6 py-4'}
        shrink-0 flex items-center justify-between
        border-b border-gray-200
      `}>
        {showText ? (
          <span className="text-sm font-bold text-[#c100ff]">SisMedy</span>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-[#c100ff] flex items-center justify-center text-white font-bold text-sm mx-auto">
            {usuario?.nombre?.charAt(0).toUpperCase()}
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all shrink-0"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} className="text-gray-500" />
          ) : (
            <PanelLeftClose size={18} className="text-gray-500" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.filter(i => i.visible).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center ${
                showText ? 'gap-3' : 'justify-center'
              } px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#c100ff] text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
            {showText && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-3 space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/perfil')}
          className={`w-full flex items-center ${
            showText ? 'gap-3' : 'justify-center'
          } px-3 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all text-left`}
        >
          <div className="w-10 h-10 rounded-full bg-[#c100ff] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {usuario?.nombre?.charAt(0).toUpperCase()}
          </div>
          {showText && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {usuario?.nombre}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {rolesLabel[usuario?.rol || ''] || usuario?.rol}
              </p>
            </div>
          )}
        </button>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${
            showText ? 'gap-3' : 'justify-center'
          } px-3 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600`}
        >
          <LogOut size={18} className="shrink-0" />
          {showText && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}