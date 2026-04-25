import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const rolesLabel: Record<string, string> = {
  administrador: 'Administrador',
  profesional:   'Profesional',
  recepcionista: 'Recepcionista',
  supervisor:    'Supervisor',
};

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const esAdmin = usuario?.rol === 'administrador' || usuario?.rol === 'supervisor';

  const navItems = [
    { to: '/',             emoji: '📊', label: 'Dashboard',    visible: true     },
    { to: '/agenda',       emoji: '📅', label: 'Agenda',       visible: true     },
    { to: '/pacientes',    emoji: '👥', label: 'Pacientes',    visible: true     },
    { to: '/zumba',        emoji: '💃', label: 'Zumba',        visible: true     },
    { to: '/gerontologia', emoji: '👴', label: 'Gerontologia', visible: true     },
    { to: '/reportes',     emoji: '📈', label: 'Reportes',     visible: esAdmin  },
    { to: '/admin',        emoji: '⚙️', label: 'Admin',        visible: esAdmin  },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-20">

      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <span className="text-sm font-bold text-emerald-600">
          🏥 Consultora Salud
        </span>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.filter(i => i.visible).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className="text-xl">{item.emoji}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-3 space-y-1">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gray-50">
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {usuario?.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">
              {usuario?.nombre}
            </p>
            <p className="text-[10px] text-gray-400">
              {rolesLabel[usuario?.rol || ''] || usuario?.rol}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span>🚪</span>
          <span>Cerrar sesion</span>
        </button>
      </div>

    </aside>
  );
}