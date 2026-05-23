import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Activity,
  BarChart3,
  Settings,
  LogOut,
  Dumbbell,
  HeartHandshake,
  PanelLeftClose,
  PanelLeftOpen,
  Menu
} from "lucide-react";

const rolesLabel: Record<string, string> = {
  administrador: 'Administrador',
  profesional:   'Profesional',
  recepcionista: 'Recepcionista',
  supervisor:    'Supervisor',
};

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
 const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  checkMobile();

  window.addEventListener('resize', checkMobile);

  return () => window.removeEventListener('resize', checkMobile);
}, []); 
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Si cambia a desktop, cerramos el menú móvil
      if (!mobile) {
        setMobileOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function handleLogout() {
    setShouldAnimate(false);
    setMobileOpen(false);
    setTimeout(() => setShouldAnimate(true), 0);
    logout();
    navigate('/login');
  }

  function handleNavClick() {
    setShouldAnimate(false);
    setMobileOpen(false);
    setTimeout(() => setShouldAnimate(true), 0);
  }

  const esAdmin = usuario?.rol === 'administrador' || usuario?.rol === 'supervisor';

  const navItems = [
    {
      to: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      visible: true,
    },
    {
      to: '/agenda',
      icon: CalendarDays,
      label: 'Agenda',
      visible: true,
    },
    {
      to: '/pacientes',
      icon: Users,
      label: 'Pacientes',
      visible: true,
    },
    {
      to: '/zumba',
      icon: Dumbbell,
      label: 'Zumba',
      visible: true,
    },
    {
      to: '/gerontologia',
      icon: HeartHandshake,
      label: 'Gerontología',
      visible: true,
    },
    {
      to: '/reportes',
      icon: BarChart3,
      label: 'Reportes',
      visible: esAdmin,
    },
    {
      to: '/admin',
      icon: Settings,
      label: 'Admin',
      visible: esAdmin,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => {
            setShouldAnimate(false);
            setMobileOpen(false);
            setTimeout(() => setShouldAnimate(true), 0);
          }}
        />
      )}

      {/* Mobile menu button - siempre visible en móvil cuando el sidebar está cerrado */}
      {isMobile && !mobileOpen &&
  createPortal(
    <button
      onClick={() => {
        setShouldAnimate(true);
        setMobileOpen(true);
      }}
      className="
        fixed
        top-4
        left-4
        z-[9999]
        w-11
        h-11
        rounded-2xl
        bg-white
        border
        border-gray-200
        shadow-lg
        flex
        items-center
        justify-center
        hover:bg-gray-50
      "
    >
      <Menu size={20} className="text-gray-700" />
    </button>,
    document.body
  )}

      {/* Sidebar */}
      <aside
  className={`
    fixed inset-y-4 left-4
    bg-[#fcfcfd]
    rounded-3xl
    shadow-sm
    border border-gray-100
    flex flex-col
    z-40
    ${shouldAnimate ? 'transition-all duration-300' : 'transition-none'}

    ${!isMobile && collapsed ? 'w-20' : ''}
    ${!isMobile && !collapsed ? 'w-64' : ''}

    max-md:left-0
    max-md:inset-y-0
    max-md:rounded-none
    max-md:w-72
    max-md:h-screen
    ${
      mobileOpen
        ? 'max-md:translate-x-0'
        : 'max-md:-translate-x-full'
    }
  `}
>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {(!collapsed || isMobile) && (
            <span className="text-sm font-bold text-[#c100ff]">
              Consultora Salud
            </span>
          )}

          <button
            onClick={() => {
              if (isMobile) {
                setShouldAnimate(false);
                setMobileOpen(false);
                setTimeout(() => setShouldAnimate(true), 0);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all"
          >
            {isMobile || !collapsed ? (
              <PanelLeftClose size={18} className="text-gray-500" />
            ) : (
              <PanelLeftOpen size={18} className="text-gray-500" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1.5 overflow-y-auto">
          {navItems.filter(i => i.visible).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center ${
                  !isMobile && collapsed ? 'justify-center' : 'gap-3'
                } px-3 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#c100ff] text-white '
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <item.icon size={18} />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-3 space-y-2">
          <div
            className={`flex items-center ${
              !isMobile && collapsed ? 'justify-center' : 'gap-3'
            } px-3 py-3 rounded-2xl bg-gray-50 transition-all`}
          >
            <div className="w-10 h-10 rounded-2xl bg-[#c100ff] flex items-center justify-center text-white text-sm font-bold shrink-0">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </div>

            {(!collapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {usuario?.nombre}
                </p>

                <p className="text-[11px] text-gray-400">
                  {rolesLabel[usuario?.rol || ''] || usuario?.rol}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              !isMobile && collapsed ? 'justify-center' : 'gap-3'
            } px-3 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200`}
          >
            <LogOut size={18} />
            {(!collapsed || isMobile) && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}