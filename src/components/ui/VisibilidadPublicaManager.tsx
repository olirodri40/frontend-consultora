// src/components/ui/VisibilidadPublicaManager.tsx
import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, Users } from 'lucide-react';
import {
  getAreas,
  getSecciones,
  getServicios,
  getProfesionales,
  actualizarArea,
  actualizarSeccion,
  actualizarServicio,
  actualizarVisibilidadServicioProfesional,
} from '../../services/admin.service';

// Solo estas áreas se ofrecen en el sitio web público.
// Zumba y Gerontología tienen su propia gestión (pestañas Zumba / Gerontología) y no aplican acá.
const AREAS_PUBLICABLES = ['psicologia', 'fisioterapia', 'medicina'];

type Area = { id: number; nombre: string; visible_publico?: boolean };
type Seccion = { id: number; area_id: number; nombre: string; visible_publico?: boolean };
type Servicio = {
  id: number;
  area_id: number;
  seccion_id: number | null;
  nombre: string;
  visible_publico?: boolean;
};
type ServicioPublico = { servicio_id: number; visible_publico: boolean };
type Profesional = {
  id: number;
  nombre: string;
  areas: { id: number; nombre: string }[];
  servicios_ids: number[];
  servicios_publico: ServicioPublico[];
};

function Interruptor({
  activo,
  onToggle,
  disabled,
}: {
  activo: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      title={activo ? 'Visible en el sitio público' : 'Oculto en el sitio público'}
      className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 disabled:opacity-50 ${
        activo ? 'bg-[#A000D1]' : 'bg-gray-300'
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
          activo ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function ProfesionalesAsignados({ lista }: { lista: Profesional[] }) {
  if (lista.length === 0) {
    return (
      <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-0.5">
        <Users size={11} /> Sin profesionales asignados
      </p>
    );
  }
  return (
    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 flex-wrap">
      <Users size={11} className="flex-shrink-0" />
      {lista.map((p) => p.nombre).join(', ')}
    </p>
  );
}

function InterruptorChico({
  activo,
  onToggle,
  disabled,
}: {
  activo: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      title={activo ? 'Este profesional cuenta como cupo público' : 'Oculto del conteo de cupos públicos'}
      className={`w-7 h-4 rounded-full transition-all relative flex-shrink-0 disabled:opacity-50 ${
        activo ? 'bg-[#A000D1]' : 'bg-gray-300'
      }`}
    >
      <div
        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${
          activo ? 'left-[14px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function ProfesionalesConToggle({
  servicioId,
  profesionales,
  guardandoId,
  onToggle,
}: {
  servicioId: number;
  profesionales: Profesional[];
  guardandoId: string | null;
  onToggle: (profesional: Profesional, servicioId: number, nuevoValor: boolean) => void;
}) {
  if (profesionales.length === 0) {
    return (
      <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-0.5">
        <Users size={11} /> Sin profesionales asignados
      </p>
    );
  }
  return (
    <div className="mt-1 space-y-1">
      {profesionales.map((p) => {
        const entrada = p.servicios_publico?.find((sp) => sp.servicio_id === servicioId);
        const visible = entrada?.visible_publico ?? true;
        const key = `prof-${p.id}-servicio-${servicioId}`;
        return (
          <div key={p.id} className="flex items-center justify-between gap-2 max-w-xs">
            <span className={`text-[11px] flex items-center gap-1 ${visible ? 'text-gray-500' : 'text-gray-400 line-through'}`}>
              <Users size={10} className="flex-shrink-0" />
              {p.nombre}
            </span>
            <InterruptorChico
              activo={visible}
              onToggle={() => onToggle(p, servicioId, !visible)}
              disabled={guardandoId === key}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function VisibilidadPublicaManager() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [seccionesPorArea, setSeccionesPorArea] = useState<Record<number, Seccion[]>>({});
  const [serviciosPorArea, setServiciosPorArea] = useState<Record<number, Servicio[]>>({});
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardandoId, setGuardandoId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [todasLasAreas, listaProfesionales] = await Promise.all([
          getAreas(),
          getProfesionales(),
        ]);
        const listaAreas: Area[] = todasLasAreas.filter((a: Area) =>
          AREAS_PUBLICABLES.includes(a.nombre.toLowerCase())
        );
        setAreas(listaAreas);
        setProfesionales(listaProfesionales);

        const secciones: Record<number, Seccion[]> = {};
        const servicios: Record<number, Servicio[]> = {};
        for (const area of listaAreas) {
          const [secs, servs] = await Promise.all([
            getSecciones(area.id),
            getServicios(area.id),
          ]);
          secciones[area.id] = secs;
          servicios[area.id] = servs;
        }
        setSeccionesPorArea(secciones);
        setServiciosPorArea(servicios);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la configuración de visibilidad');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  function profesionalesDeArea(areaId: number): Profesional[] {
    return profesionales.filter((p) => p.areas?.some((a) => a.id === areaId));
  }

  function profesionalesDeServicio(servicioId: number): Profesional[] {
    return profesionales.filter((p) => p.servicios_ids?.includes(servicioId));
  }

  async function toggleProfesionalServicio(
    profesional: Profesional,
    servicioId: number,
    nuevoValor: boolean
  ) {
    const key = `prof-${profesional.id}-servicio-${servicioId}`;
    setGuardandoId(key);

    function aplicar(valor: boolean) {
      setProfesionales((prev) =>
        prev.map((p) => {
          if (p.id !== profesional.id) return p;
          const yaExiste = p.servicios_publico?.some((sp) => sp.servicio_id === servicioId);
          const servicios_publico = yaExiste
            ? p.servicios_publico.map((sp) =>
                sp.servicio_id === servicioId ? { ...sp, visible_publico: valor } : sp
              )
            : [...(p.servicios_publico || []), { servicio_id: servicioId, visible_publico: valor }];
          return { ...p, servicios_publico };
        })
      );
    }

    aplicar(nuevoValor);
    try {
      await actualizarVisibilidadServicioProfesional(profesional.id, servicioId, nuevoValor);
    } catch (err) {
      console.error(err);
      aplicar(!nuevoValor);
      setError('No se pudo actualizar la visibilidad del profesional en ese servicio');
    } finally {
      setGuardandoId(null);
    }
  }

  function profesionalesDeSeccion(serviciosSeccion: Servicio[]): Profesional[] {
    const ids = new Set(serviciosSeccion.map((s) => s.id));
    const encontrados = new Map<number, Profesional>();
    for (const p of profesionales) {
      if (p.servicios_ids?.some((sid) => ids.has(sid))) encontrados.set(p.id, p);
    }
    return Array.from(encontrados.values());
  }

  async function toggleArea(area: Area) {
    const nuevoValor = !(area.visible_publico ?? true);
    setGuardandoId(`area-${area.id}`);
    setAreas((prev) =>
      prev.map((a) => (a.id === area.id ? { ...a, visible_publico: nuevoValor } : a))
    );
    try {
      await actualizarArea(area.id, { visible_publico: nuevoValor });
    } catch (err) {
      console.error(err);
      setAreas((prev) =>
        prev.map((a) => (a.id === area.id ? { ...a, visible_publico: !nuevoValor } : a))
      );
      setError('No se pudo actualizar la visibilidad del área');
    } finally {
      setGuardandoId(null);
    }
  }

  async function toggleSeccion(seccion: Seccion) {
    const nuevoValor = !(seccion.visible_publico ?? true);
    setGuardandoId(`seccion-${seccion.id}`);
    setSeccionesPorArea((prev) => ({
      ...prev,
      [seccion.area_id]: prev[seccion.area_id].map((s) =>
        s.id === seccion.id ? { ...s, visible_publico: nuevoValor } : s
      ),
    }));
    try {
      await actualizarSeccion(seccion.id, { visible_publico: nuevoValor });
    } catch (err) {
      console.error(err);
      setSeccionesPorArea((prev) => ({
        ...prev,
        [seccion.area_id]: prev[seccion.area_id].map((s) =>
          s.id === seccion.id ? { ...s, visible_publico: !nuevoValor } : s
        ),
      }));
      setError('No se pudo actualizar la visibilidad de la sección');
    } finally {
      setGuardandoId(null);
    }
  }

  async function toggleServicio(servicio: Servicio) {
    const nuevoValor = !(servicio.visible_publico ?? true);
    setGuardandoId(`servicio-${servicio.id}`);
    setServiciosPorArea((prev) => ({
      ...prev,
      [servicio.area_id]: prev[servicio.area_id].map((s) =>
        s.id === servicio.id ? { ...s, visible_publico: nuevoValor } : s
      ),
    }));
    try {
      await actualizarServicio(servicio.id, { visible_publico: nuevoValor });
    } catch (err) {
      console.error(err);
      setServiciosPorArea((prev) => ({
        ...prev,
        [servicio.area_id]: prev[servicio.area_id].map((s) =>
          s.id === servicio.id ? { ...s, visible_publico: !nuevoValor } : s
        ),
      }));
      setError('No se pudo actualizar la visibilidad del servicio');
    } finally {
      setGuardandoId(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl text-sm text-violet-700 flex items-start gap-2">
        <Eye size={16} className="mt-0.5 flex-shrink-0" />
        <span>
          Controla qué áreas, secciones y servicios puede ver y elegir un visitante en el sitio
          web público. Esto es independiente del interruptor "activo" de Admin, que solo controla
          si se puede agendar internamente desde Agenda.
        </span>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {areas.map((area) => {
        const secciones = seccionesPorArea[area.id] || [];
        const servicios = serviciosPorArea[area.id] || [];
        const serviciosSinSeccion = servicios.filter((s) => !s.seccion_id);
        const areaVisible = area.visible_publico ?? true;

        return (
          <div key={area.id} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {areaVisible ? (
                    <Eye size={15} className="text-[#A000D1]" />
                  ) : (
                    <EyeOff size={15} className="text-gray-400" />
                  )}
                  <span className="font-semibold text-gray-800 text-sm">{area.nombre}</span>
                </div>
                <ProfesionalesAsignados lista={profesionalesDeArea(area.id)} />
              </div>
              <Interruptor
                activo={areaVisible}
                onToggle={() => toggleArea(area)}
                disabled={guardandoId === `area-${area.id}`}
              />
            </div>

            {areaVisible && (secciones.length > 0 || servicios.length > 0) && (
              <div className="divide-y divide-gray-100">
                {secciones.map((seccion) => {
                  const serviciosSeccion = servicios.filter((s) => s.seccion_id === seccion.id);
                  const seccionVisible = seccion.visible_publico ?? true;
                  return (
                    <div key={seccion.id} className="pl-6">
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <div className="min-w-0">
                          <span className="text-sm text-gray-700">{seccion.nombre}</span>
                          <ProfesionalesAsignados lista={profesionalesDeSeccion(serviciosSeccion)} />
                        </div>
                        <Interruptor
                          activo={seccionVisible}
                          onToggle={() => toggleSeccion(seccion)}
                          disabled={guardandoId === `seccion-${seccion.id}`}
                        />
                      </div>
                      {seccionVisible && serviciosSeccion.length > 0 && (
                        <div className="pl-6 pb-1">
                          {serviciosSeccion.map((servicio) => (
                            <div
                              key={servicio.id}
                              className="flex items-center justify-between px-4 py-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-gray-500">{servicio.nombre}</span>
                                  <Interruptor
                                    activo={servicio.visible_publico ?? true}
                                    onToggle={() => toggleServicio(servicio)}
                                    disabled={guardandoId === `servicio-${servicio.id}`}
                                  />
                                </div>
                                {(servicio.visible_publico ?? true) && (
                                  <ProfesionalesConToggle
                                    servicioId={servicio.id}
                                    profesionales={profesionalesDeServicio(servicio.id)}
                                    guardandoId={guardandoId}
                                    onToggle={toggleProfesionalServicio}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {serviciosSinSeccion.map((servicio) => (
                  <div key={servicio.id} className="px-4 py-2.5 pl-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-gray-600">{servicio.nombre}</span>
                      <Interruptor
                        activo={servicio.visible_publico ?? true}
                        onToggle={() => toggleServicio(servicio)}
                        disabled={guardandoId === `servicio-${servicio.id}`}
                      />
                    </div>
                    {(servicio.visible_publico ?? true) && (
                      <ProfesionalesConToggle
                        servicioId={servicio.id}
                        profesionales={profesionalesDeServicio(servicio.id)}
                        guardandoId={guardandoId}
                        onToggle={toggleProfesionalServicio}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
