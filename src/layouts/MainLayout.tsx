import { Outlet } from 'react-router-dom';
import Sidebar from '../components/ui/Sidebar';

// Outlet es donde React Router inyecta la página actual
// Si estás en /agenda, Outlet renderiza el componente Agenda
// Si estás en /pacientes, Outlet renderiza Pacientes
// El Sidebar siempre está visible

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      
      <Sidebar />

      {/* Contenido principal — margen izquierdo igual al ancho del sidebar */}
      <main className="flex-1 ml-60">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>

    </div>
  );
}