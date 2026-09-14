// src/layouts/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/ui/Sidebar';
import Header from '../components/ui/Header';

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      {/* min-w-0 es necesario: sin él, un hijo ancho (ej. una tabla con
          min-width fija) fuerza a este contenedor flex a crecer más allá del
          viewport, arrastrando TODA la página (sidebar incluido) en un
          scroll horizontal en vez de que solo esa tabla desborde con su
          propio scroll interno. */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}