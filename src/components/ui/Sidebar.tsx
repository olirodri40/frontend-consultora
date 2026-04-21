import { NavLink } from 'react-router-dom';

// Definimos los ítems de navegación en un array
// Así si quieres agregar uno nuevo, solo lo agregas aquí
const navItems = [
  { to: '/',             emoji: '📊', label: 'Dashboard'    },
  { to: '/agenda',       emoji: '📅', label: 'Agenda'       },
  { to: '/pacientes',    emoji: '👥', label: 'Pacientes'    },
  { to: '/zumba',        emoji: '💃', label: 'Zumba'        },
  { to: '/gerontologia', emoji: '👴', label: 'Gerontología' },
  { to: '/reportes',     emoji: '📈', label: 'Reportes'     },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-20">
      
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <span className="text-sm font-bold text-emerald-600">
          🏥 Consultora Salud
        </span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
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

      {/* Footer del sidebar */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gray-50">
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">Admin</p>
            <p className="text-[10px] text-gray-400">Administrador</p>
          </div>
        </div>
      </div>

    </aside>
  );
}