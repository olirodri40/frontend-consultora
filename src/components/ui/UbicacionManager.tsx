// src/components/ui/UbicacionManager.tsx
import { useState, useEffect } from 'react';
import { Loader2, UploadCloud, Save, CheckCircle2 } from 'lucide-react';
import {
  getSettings,
  actualizarSettings,
  FILE_BASE_URL,
  type SiteSettings,
} from '../../services/sitioWeb.service';

type Campo = keyof Omit<SiteSettings, 'id' | 'imagen_edificio_url'>;

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1 font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1]"
      />
    </div>
  );
}

export default function UbicacionManager() {
  const [datos, setDatos] = useState<Record<Campo, string> | null>(null);
  const [imagenActual, setImagenActual] = useState<string | null>(null);
  const [imagenNueva, setImagenNueva] = useState<File | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [guardadoOk, setGuardadoOk] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings();
        const { id, imagen_edificio_url, ...resto } = settings;
        setDatos(resto);
        setImagenActual(imagen_edificio_url);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la configuración');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  function actualizarCampo(campo: Campo, valor: string) {
    setDatos((prev) => (prev ? { ...prev, [campo]: valor } : prev));
  }

  async function handleGuardar() {
    if (!datos) return;
    setError('');
    setGuardadoOk(false);
    try {
      setGuardando(true);
      const actualizado = await actualizarSettings({ ...datos, imagen: imagenNueva });
      setImagenActual(actualizado.imagen_edificio_url);
      setImagenNueva(null);
      setGuardadoOk(true);
      setTimeout(() => setGuardadoOk(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.mensaje || 'Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Cargando...
      </div>
    );
  }

  if (!datos) {
    return <p className="text-sm text-red-500">{error || 'No se pudo cargar la configuración'}</p>;
  }

  return (
    <div className="space-y-8">
      {/* Dirección y sede */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Dirección y sede</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CampoTexto label="Ciudad / País" value={datos.ciudad_pais} onChange={(v) => actualizarCampo('ciudad_pais', v)} />
          <CampoTexto label="Nombre de la sede" value={datos.sede_nombre} onChange={(v) => actualizarCampo('sede_nombre', v)} />
          <CampoTexto label="Dirección — línea 1" value={datos.direccion_linea1} onChange={(v) => actualizarCampo('direccion_linea1', v)} />
          <CampoTexto label="Dirección — línea 2" value={datos.direccion_linea2} onChange={(v) => actualizarCampo('direccion_linea2', v)} />
        </div>
      </div>

      {/* Contacto */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Contacto</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CampoTexto label="Teléfono principal" value={datos.telefono_principal} onChange={(v) => actualizarCampo('telefono_principal', v)} />
          <CampoTexto label="Teléfono(s) secundario(s)" value={datos.telefono_secundario || ''} onChange={(v) => actualizarCampo('telefono_secundario', v)} placeholder="Ej: 2491442 - 2481367" />
          <CampoTexto label="WhatsApp (para info)" value={datos.whatsapp || ''} onChange={(v) => actualizarCampo('whatsapp', v)} placeholder="Ej: 77501516" />
          <CampoTexto label="Link para unirme al grupo de WhatsApp" value={datos.whatsapp_grupo_url || ''} onChange={(v) => actualizarCampo('whatsapp_grupo_url', v)} placeholder="https://chat.whatsapp.com/..." />
          <CampoTexto label="Correo de contacto" value={datos.email_contacto || ''} onChange={(v) => actualizarCampo('email_contacto', v)} />
          <CampoTexto label="Horario de atención" value={datos.horario_texto} onChange={(v) => actualizarCampo('horario_texto', v)} placeholder="Ej: Lun – Sáb · 09:00 – 18:00" />
        </div>
      </div>

      {/* Mapa */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Mapa</h4>
        <label className="text-xs text-gray-500 block mb-1 font-medium">
          Enlace de Google Maps (embed) <span className="text-gray-400">— en Google Maps: Compartir → Insertar un mapa → copia solo el link del "src"</span>
        </label>
        <input
          value={datos.mapa_embed_url}
          onChange={(e) => actualizarCampo('mapa_embed_url', e.target.value)}
          className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1]"
        />
        {datos.mapa_embed_url && (
          <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 h-48">
            <iframe src={datos.mapa_embed_url} className="w-full h-full" loading="lazy" title="Vista previa del mapa" />
          </div>
        )}
      </div>

      {/* Foto del edificio */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Foto del edificio</h4>
        <div className="flex items-start gap-4">
          <div className="w-28 h-28 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
            {(imagenNueva || imagenActual) && (
              <img
                src={imagenNueva ? URL.createObjectURL(imagenNueva) : `${FILE_BASE_URL}${imagenActual}`}
                alt="Edificio"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl p-3 text-sm text-gray-500 cursor-pointer hover:border-[#A000D1] hover:text-[#A000D1] transition-all">
              <UploadCloud size={16} />
              {imagenNueva ? imagenNueva.name : 'Cambiar foto...'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setImagenNueva(e.target.files?.[0] || null)}
              />
            </label>
            <CampoTexto label="Detalle del edificio" value={datos.edificio_detalle} onChange={(v) => actualizarCampo('edificio_detalle', v)} placeholder="Ej: Edificio color Lila · Primer piso" />
            <CampoTexto label="Referencia" value={datos.edificio_referencia} onChange={(v) => actualizarCampo('edificio_referencia', v)} placeholder="Ej: Frente a Madre Tierra de Mi Teleférico" />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleGuardar}
        disabled={guardando}
        className="w-full bg-[#A000D1] hover:bg-[#8800b3] disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
      >
        {guardando ? (
          <Loader2 size={16} className="animate-spin" />
        ) : guardadoOk ? (
          <CheckCircle2 size={16} />
        ) : (
          <Save size={16} />
        )}
        {guardando ? 'Guardando...' : guardadoOk ? 'Guardado' : 'Guardar cambios'}
      </button>
    </div>
  );
}