// src/components/ui/GaleriaManager.tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff, Link2, Loader2, UploadCloud } from 'lucide-react';
import {
  getGaleriaAdmin,
  crearItemGaleria,
  actualizarItemGaleria,
  eliminarItemGaleria,
  FILE_BASE_URL,
  type GaleriaItem,
  type TipoGaleria,
} from '../../services/sitioWeb.service';

const ETIQUETAS: Record<TipoGaleria, string> = {
  imagen: 'Imagen',
  video: 'Video',
  youtube: 'YouTube',
  shorts: 'YouTube Short',
  tiktok: 'TikTok',
  reel: 'Reel de Facebook',
  facebook: 'Facebook',
  instagram: 'Instagram',
  hero: 'Imagen de portada',
};

const TIPOS_CON_ARCHIVO: TipoGaleria[] = ['imagen', 'video', 'hero'];
const TIPOS_IMAGEN: TipoGaleria[] = ['imagen', 'hero'];

function extraerIdYoutube(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|v=|shorts\/)([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : null;
}

export default function GaleriaManager({ tipos }: { tipos: TipoGaleria[] }) {
  const [items, setItems] = useState<GaleriaItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [tipoNuevo, setTipoNuevo] = useState<TipoGaleria>(tipos[0]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enlace, setEnlace] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await getGaleriaAdmin();
      setItems(data.filter((i) => tipos.includes(i.tipo)));
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el contenido');
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipos.join(',')]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleCrear() {
    setError('');
    if (!titulo.trim()) {
      setError('El título es obligatorio');
      return;
    }
    if (TIPOS_CON_ARCHIVO.includes(tipoNuevo) && !archivo) {
      setError('Selecciona un archivo');
      return;
    }
    if (!TIPOS_CON_ARCHIVO.includes(tipoNuevo) && !enlace.trim()) {
      setError('Pega el enlace');
      return;
    }

    try {
      setGuardando(true);
      await crearItemGaleria({
        tipo: tipoNuevo,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        enlace_url: enlace.trim() || undefined,
        archivo,
        orden: items.length,
      });
      setTitulo('');
      setDescripcion('');
      setEnlace('');
      setArchivo(null);
      await cargar();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje || 'Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggleActivo(item: GaleriaItem) {
    const anterior = items;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, activo: !i.activo } : i)));
    try {
      await actualizarItemGaleria(item.id, { activo: !item.activo });
    } catch (err) {
      console.error(err);
      setItems(anterior); // revertir si falló
    }
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Eliminar este elemento? Esta acción no se puede deshacer.')) return;
    const anterior = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await eliminarItemGaleria(id);
    } catch (err) {
      console.error(err);
      setItems(anterior);
    }
  }

  return (
    <div>
      {/* Formulario para agregar contenido nuevo */}
      <div className="border border-gray-200 rounded-2xl p-5 mb-6 bg-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
            <Plus size={16} className="text-[#A000D1]" />
          </div>
          <h4 className="font-semibold text-gray-700">Agregar contenido</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {tipos.length > 1 && (
            <div>
              <label className="text-xs text-gray-500 block mb-1 font-medium">Tipo</label>
              <select
                value={tipoNuevo}
                onChange={(e) => setTipoNuevo(e.target.value as TipoGaleria)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1]"
              >
                {tipos.map((t) => (
                  <option key={t} value={t}>
                    {ETIQUETAS[t]}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={tipos.length > 1 ? '' : 'sm:col-span-2'}>
            <label className="text-xs text-gray-500 block mb-1 font-medium">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Nuestras instalaciones"
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1]"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1 font-medium">Descripción (opcional)</label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1]"
          />
        </div>

        {TIPOS_CON_ARCHIVO.includes(tipoNuevo) ? (
          <div className="mb-3">
            <label className="text-xs text-gray-500 block mb-1 font-medium">
              Archivo <span className="text-red-500">*</span>{' '}
              <span className="text-gray-400">
                ({TIPOS_IMAGEN.includes(tipoNuevo) ? 'jpg, png, webp — máx 5MB' : 'mp4, webm — máx 50MB'})
              </span>
            </label>
            <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl p-3 text-sm text-gray-500 cursor-pointer hover:border-[#A000D1] hover:text-[#A000D1] transition-all">
              <UploadCloud size={16} />
              {archivo ? archivo.name : 'Seleccionar archivo...'}
              <input
                type="file"
                accept={TIPOS_IMAGEN.includes(tipoNuevo) ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm'}
                className="hidden"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        ) : (
          <div className="mb-3">
            <label className="text-xs text-gray-500 block mb-1 font-medium">
              Enlace <span className="text-red-500">*</span>
            </label>
            <input
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1]"
            />
          </div>
        )}

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <button
          onClick={handleCrear}
          disabled={guardando}
          className="w-full bg-[#A000D1] hover:bg-[#8800b3] disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
        >
          {guardando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {guardando ? 'Guardando...' : 'Agregar'}
        </button>
      </div>

      {/* Lista de contenido existente */}
      {cargando ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Cargando...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">
          Todavía no hay contenido en esta sección.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const esYoutube = item.tipo === 'youtube' || item.tipo === 'shorts';
            const ytId = esYoutube && item.enlace_url ? extraerIdYoutube(item.enlace_url) : null;

            return (
              <div key={item.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="h-36 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                  {(item.tipo === 'imagen' || item.tipo === 'hero') && item.archivo_url && (
                    <img
                      src={`${FILE_BASE_URL}${item.archivo_url}`}
                      alt={item.titulo}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {item.tipo === 'video' && item.archivo_url && (
                    <video src={`${FILE_BASE_URL}${item.archivo_url}`} className="w-full h-full object-cover" muted />
                  )}
                  {ytId && (
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                      alt={item.titulo}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {!ytId && !TIPOS_CON_ARCHIVO.includes(item.tipo) && (
                    <Link2 size={28} className="text-gray-400" />
                  )}
                  {!item.activo && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-medium">
                      Oculto
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-violet-600 mb-0.5">{ETIQUETAS[item.tipo]}</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.titulo}</p>
                  {item.descripcion && (
                    <p className="text-xs text-gray-400 truncate">{item.descripcion}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleToggleActivo(item)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      {item.activo ? <EyeOff size={13} /> : <Eye size={13} />}
                      {item.activo ? 'Ocultar' : 'Mostrar'}
                    </button>
                    <button
                      onClick={() => handleEliminar(item.id)}
                      className="flex items-center justify-center gap-1 text-xs font-medium py-1.5 px-2.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}