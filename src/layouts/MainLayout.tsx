import { Outlet } from 'react-router-dom';
import Sidebar from '../components/ui/Sidebar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Contenido principal */}
      <main
        className="
          transition-all duration-300
          md:ml-72
        "
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <Outlet />
        </div>
      </main>

    </div>
  );
}