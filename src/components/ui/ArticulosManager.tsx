// src/components/ui/ArticulosManager.tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff, Loader2, UploadCloud, Newspaper } from 'lucide-react';
import {
  getArticulosAdmin,
  crearArticulo,
  actualizarArticulo,
  eliminarArticulo,
  resolverUrlArchivo,
  type Articulo,
  type CategoriaArticulo,
} from '../../services/sitioWeb.service';

const CATEGORIAS: CategoriaArticulo[] = ['Fisioterapia', 'Medicina', 'Psicología'];

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Postgres devuelve la fecha con hora/zona incluida (ej: '2026-09-05T04:00:00.000Z').
// Para mostrarla en el panel nos quedamos solo con 'YYYY-MM-DD'.
function soloFecha(valor: string): string {
  return valor ? valor.slice(0, 10) : '';
}

export default function ArticulosManager() {
  const [items, setItems] = useState<Articulo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [contenido, setContenido] = useState('');
  const [categoria, setCategoria] = useState<CategoriaArticulo>('Fisioterapia');
  const [publicadoEn, setPublicadoEn] = useState(hoyISO());
  const [imagen, setImagen] = useState<File | null>(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await getArticulosAdmin();
      setItems(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los artículos');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function limpiarFormulario() {
    setTitulo('');
    setDescripcion('');
    setContenido('');
    setCategoria('Fisioterapia');
    setPublicadoEn(hoyISO());
    setImagen(null);
  }

  async function handleCrear() {
    setError('');
    if (!titulo.trim() || !descripcion.trim() || !contenido.trim()) {
      setError('Título, resumen y contenido son obligatorios');
      return;
    }

    try {
      setGuardando(true);
      await crearArticulo({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        contenido: contenido.trim(),
        categoria,
        publicado_en: publicadoEn,
        imagen,
        orden: items.length,
      });
      limpiarFormulario();
      await cargar();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje || 'Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggleActivo(item: Articulo) {
    const anterior = items;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, activo: !i.activo } : i)));
    try {
      await actualizarArticulo(item.id, { activo: !item.activo });
    } catch (err) {
      console.error(err);
      setItems(anterior);
    }
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return;
    const anterior = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await eliminarArticulo(id);
    } catch (err) {
      console.error(err);
      setItems(anterior);
    }
  }

  return (
    <div>
      {/* Formulario para agregar */}
      <div className="border border-gray-200 rounded-2xl p-5 mb-6 bg-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
            <Plus size={16} className="text-[#A000D1]" />
          </div>
          <h4 className="font-semibold text-gray-700">Nuevo artículo</h4>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1 font-medium">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: 5 Ejercicios para Aliviar el Dolor de Espalda"
            className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaArticulo)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1]"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Fecha de publicación</label>
            <input
              type="date"
              value={publicadoEn}
              onChange={(e) => setPublicadoEn(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1]"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1 font-medium">
            Resumen corto <span className="text-red-500">*</span>{' '}
            <span className="text-gray-400">(el que se ve en la tarjeta)</span>
          </label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descubre ejercicios simples y efectivos para..."
            className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1]"
          />
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1 font-medium">
            Contenido completo <span className="text-red-500">*</span>{' '}
            <span className="text-gray-400">(el que se ve al abrir el artículo)</span>
          </label>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={5}
            className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] resize-y"
          />
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1 font-medium">
            Imagen (opcional) <span className="text-gray-400">— jpg, png, webp, máx 5MB</span>
          </label>
          <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl p-3 text-sm text-gray-500 cursor-pointer hover:border-[#A000D1] hover:text-[#A000D1] transition-all">
            <UploadCloud size={16} />
            {imagen ? imagen.name : 'Seleccionar imagen...'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setImagen(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <button
          onClick={handleCrear}
          disabled={guardando}
          className="w-full bg-[#A000D1] hover:bg-[#8800b3] disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
        >
          {guardando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {guardando ? 'Guardando...' : 'Publicar artículo'}
        </button>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Cargando...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">Todavía no hay artículos publicados.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-2xl p-4 flex gap-4 items-start">
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {item.imagen_url ? (
                  <img
                    src={resolverUrlArchivo(item.imagen_url)}
                    alt={item.titulo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Newspaper size={22} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                    {item.categoria}
                  </span>
                  <span className="text-xs text-gray-400">{soloFecha(item.publicado_en)}</span>
                  {!item.activo && (
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Oculto
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">{item.titulo}</p>
                <p className="text-xs text-gray-400 truncate">{item.descripcion}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleActivo(item)}
                  className="flex items-center gap-1 text-xs font-medium py-1.5 px-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
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
          ))}
        </div>
      )}
    </div>
  );
}