// src/pages/SitioWeb.tsx
import { useState } from 'react';
import {
  Globe,
  Image as ImageIcon,
  Video,
  Share2,
  Newspaper,
  MapPin,
  Eye,
  ExternalLink,
} from 'lucide-react';
import GaleriaManager from '../components/ui/GaleriaManager';
import ArticulosManager from '../components/ui/ArticulosManager';
import UbicacionManager from '../components/ui/UbicacionManager';
import VisibilidadPublicaManager from '../components/ui/VisibilidadPublicaManager';

type Tab = 'inicio' | 'galeria' | 'videos' | 'redes' | 'articulos' | 'ubicacion' | 'visibilidad';

const TABS: { id: Tab; label: string; icon: typeof Globe }[] = [
  { id: 'inicio',      label: 'Inicio (Hero)',     icon: Globe },
  { id: 'galeria',     label: 'Galería de fotos',   icon: ImageIcon },
  { id: 'videos',      label: 'Videos',             icon: Video },
  { id: 'redes',       label: 'Redes sociales',     icon: Share2 },
  { id: 'articulos',   label: 'Artículos',          icon: Newspaper },
  { id: 'ubicacion',   label: 'Ubicación',          icon: MapPin },
  { id: 'visibilidad', label: 'Visibilidad pública', icon: Eye },
];

export default function SitioWeb() {
  const [tabActiva, setTabActiva] = useState<Tab>('inicio');

  return (
    <div>
      {/* Header de la página */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          Administra el contenido público de medyfisio.com
        </p>

        <a
          href="https://medyfisio.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-[#A000D1] hover:text-[#8800b3] border border-violet-200 hover:border-[#A000D1] rounded-xl px-4 py-2.5 transition-all"
        >
          <ExternalLink size={16} />
          Ver sitio público
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 p-1.5 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tabActiva === tab.id
                ? 'bg-white text-[#A000D1] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido por pestaña */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {tabActiva === 'inicio' && (
          <div>
            <div className="mb-4 p-3 bg-violet-50 border border-violet-100 rounded-xl text-sm text-violet-700">
              Estas imágenes aparecen rotando en el carrusel principal, justo al entrar al sitio.
              El "Título" es lo que se usa como etiqueta interna — no reemplaza el texto animado de la portada.
            </div>
            <GaleriaManager tipos={['hero']} />
          </div>
        )}

        {tabActiva === 'galeria' && <GaleriaManager tipos={['imagen']} />}

        {tabActiva === 'videos' && <GaleriaManager tipos={['video', 'youtube', 'shorts']} />}

        {tabActiva === 'redes' && <GaleriaManager tipos={['tiktok', 'reel', 'facebook', 'instagram']} />}

        {tabActiva === 'articulos' && <ArticulosManager />}

        {tabActiva === 'ubicacion' && <UbicacionManager />}

        {tabActiva === 'visibilidad' && <VisibilidadPublicaManager />}
      </div>
    </div>
  );
}