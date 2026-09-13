// src/components/ui/SesionesGrupalesPanel.tsx
// Configuración de servicios grupales recurrentes (ej. "Sesión Embarazadas"
// todos los martes 18:00-19:00): un profesional fijo, uno o más días de la
// semana — cada uno con SU PROPIO horario real de jornada — y una capacidad.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, X, Check, Loader2, Trash2 } from 'lucide-react';
import { getHorarios } from '../../services/admin.service';
import {
  getSesionesGrupales,
  crearSesionGrupal,
  eliminarSesionGrupal,
} from '../../services/sesionesGrupales.service';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const DURACIONES = [30, 45, 60, 90, 120, 150, 180];

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

type ConfigDia = { horaInicio: string; duracion: number };
type Profesional = {
  id: number;
  nombre: string;
  area_id?: number;
  area_nombre?: string;
  areas?: { id: number; nombre: string }[];
  activo?: boolean;
  servicios_ids?: number[];
};
type Servicio = { id: number; nombre: string; area_id: number; costo: number };

export default function SesionesGrupalesPanel({
  profesionales,
  servicios,
}: {
  profesionales: Profesional[];
  servicios: Servicio[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [profesionalId, setProfesionalId] = useState<number | ''>('');
  const [servicioId, setServicioId] = useState<number | ''>('');
  const [servicioIndividualId, setServicioIndividualId] = useState<number | ''>('');
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [configPorDia, setConfigPorDia] = useState<Record<string, ConfigDia>>({});
  const [fechaInicio, setFechaInicio] = useState(hoy());
  const [capacidad, setCapacidad] = useState(5);
  const [costoGrupal, setCostoGrupal] = useState('');
  const [horariosProf, setHorariosProf] = useState<any[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [sesiones, setSesiones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  const profesional = profesionales.find((p) => p.id === profesionalId);
  const areaIdProfesional = profesional?.area_id ?? profesional?.areas?.[0]?.id;
  const serviciosDelArea = servicios.filter((s) => Number(s.area_id) === Number(areaIdProfesional));

  // Solo profesionales activos y con al menos un área y un servicio asignado
  // pueden dar una sesión grupal.
  const profesionalesDisponibles = profesionales.filter(
    (p) => p.activo !== false && (p.areas?.length ?? 0) > 0 && (p.servicios_ids?.length ?? 0) > 0
  );

  const cargarSesiones = useCallback(async () => {
    setCargando(true);
    try {
      const data = await getSesionesGrupales();
      setSesiones(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (abierto) cargarSesiones();
  }, [abierto, cargarSesiones]);

  // Trae el horario real del profesional (Admin > Horarios) apenas se elige,
  // para no poder armar una sesión grupal en una hora en la que no trabaja.
  useEffect(() => {
    if (!profesionalId) { setHorariosProf([]); return; }
    setCargandoHorarios(true);
    getHorarios(Number(profesionalId))
      .then((data) => setHorariosProf(data || []))
      .catch(() => setHorariosProf([]))
      .finally(() => setCargandoHorarios(false));
  }, [profesionalId]);

  function bloquesDe(diaBuscado: string) {
    return horariosProf.filter(
      (h: any) => sinTildes(h.dia) === sinTildes(diaBuscado) && Number(h.area_id) === Number(areaIdProfesional)
    );
  }

  function slotsDeInicioDe(diaBuscado: string): string[] {
    const slots: string[] = [];
    for (const b of bloquesDe(diaBuscado)) {
      const paso = b.slot_minutos || 60;
      let [h, m] = b.hora_inicio.slice(0, 5).split(':').map(Number);
      const [hf, mf] = b.hora_fin.slice(0, 5).split(':').map(Number);
      let actual = h * 60 + m;
      const fin = hf * 60 + mf;
      while (actual < fin) {
        slots.push(`${String(Math.floor(actual / 60)).padStart(2, '0')}:${String(actual % 60).padStart(2, '0')}`);
        actual += paso;
      }
    }
    return slots;
  }

  // Minutos disponibles desde una hora de inicio hasta que termina el bloque
  // de jornada que la contiene, EN ESE día puntual.
  function minutosDisponiblesDesde(diaBuscado: string, horaInicio: string): number {
    if (!horaInicio) return 0;
    const [h, m] = horaInicio.split(':').map(Number);
    const inicioMin = h * 60 + m;
    const bloque = bloquesDe(diaBuscado).find((b: any) => {
      const [hi, mi] = b.hora_inicio.slice(0, 5).split(':').map(Number);
      const [hf, mf] = b.hora_fin.slice(0, 5).split(':').map(Number);
      return inicioMin >= hi * 60 + mi && inicioMin < hf * 60 + mf;
    });
    if (!bloque) return 0;
    const [hf, mf] = bloque.hora_fin.slice(0, 5).split(':').map(Number);
    return hf * 60 + mf - inicioMin;
  }

  function horaFinDe(horaInicio: string, duracion: number): string {
    if (!horaInicio) return '';
    const [h, m] = horaInicio.split(':').map(Number);
    const totalMin = h * 60 + m + duracion;
    return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  }

  const diasSinJornada = useMemo(
    () => diasSeleccionados.filter((d) => bloquesDe(d).length === 0),
    [diasSeleccionados, horariosProf, areaIdProfesional]
  );

  function limpiar() {
    setProfesionalId('');
    setServicioId('');
    setServicioIndividualId('');
    setDiasSeleccionados([]);
    setConfigPorDia({});
    setFechaInicio(hoy());
    setCapacidad(5);
    setCostoGrupal('');
    setError('');
  }

  function alternarDia(d: string) {
    setDiasSeleccionados((prev) => {
      if (prev.includes(d)) {
        setConfigPorDia((cfg) => {
          const nuevo = { ...cfg };
          delete nuevo[d];
          return nuevo;
        });
        return prev.filter((x) => x !== d);
      }
      return [...prev, d];
    });
  }

  function elegirHoraDia(d: string, horaInicio: string) {
    setConfigPorDia((cfg) => ({ ...cfg, [d]: { horaInicio, duracion: cfg[d]?.duracion || 60 } }));
  }

  function elegirDuracionDia(d: string, duracion: number) {
    setConfigPorDia((cfg) => ({ ...cfg, [d]: { horaInicio: cfg[d]?.horaInicio || '', duracion } }));
  }

  async function guardar() {
    setError('');
    setOk('');
    if (!profesional) { setError('Elegí un profesional'); return; }
    if (!servicioId) { setError('Elegí un servicio'); return; }
    if (!areaIdProfesional) { setError('Ese profesional no tiene área asignada'); return; }
    if (diasSeleccionados.length === 0) { setError('Elegí al menos un día de la semana'); return; }
    for (const d of diasSeleccionados) {
      if (!configPorDia[d]?.horaInicio) { setError(`Elegí un horario de inicio para el ${d}`); return; }
      if (configPorDia[d].duracion > minutosDisponiblesDesde(d, configPorDia[d].horaInicio)) {
        setError(`La duración del ${d} se pasa de su jornada ese día`);
        return;
      }
    }
    if (capacidad < 1) { setError('La capacidad debe ser al menos 1'); return; }

    setGuardando(true);
    try {
      // Un día de la semana = una fila, cada una con su propio horario.
      for (const d of diasSeleccionados) {
        const cfg = configPorDia[d];
        await crearSesionGrupal({
          professional_id: profesional.id,
          servicio_id: Number(servicioId),
          servicio_individual_id: servicioIndividualId ? Number(servicioIndividualId) : null,
          area_id: areaIdProfesional,
          dia: d,
          hora_inicio: cfg.horaInicio,
          hora_fin: horaFinDe(cfg.horaInicio, cfg.duracion),
          capacidad,
          costo_grupal: costoGrupal ? Number(costoGrupal) : null,
          visible_publico: true,
          fecha_inicio: fechaInicio,
        });
      }
      setOk(diasSeleccionados.length > 1 ? 'Sesiones grupales creadas correctamente' : 'Sesión grupal creada correctamente');
      limpiar();
      cargarSesiones();
      setTimeout(() => setOk(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.mensaje || 'No se pudo crear la sesión grupal');
      cargarSesiones();
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: number) {
    if (!confirm('¿Eliminar esta sesión grupal? Deja de ofrecerse (las inscripciones ya hechas no se borran).')) return;
    try {
      await eliminarSesionGrupal(id);
      cargarSesiones();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 bg-white border border-gray-200 hover:border-[#A000D1] text-sm font-medium text-gray-700 hover:text-[#A000D1] rounded-xl px-3.5 py-2 transition-all"
      >
        <Users size={16} />
        Sesiones grupales
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setAbierto(false)}>
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users size={18} className="text-[#A000D1]" /> Sesiones grupales
              </h3>
              <button onClick={() => setAbierto(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Para servicios recurrentes con varias personas a la misma hora (ej. "Sesión Embarazadas"
              todos los martes 18:00–19:00). Varios pacientes distintos pueden anotarse en el mismo
              horario hasta llenar el cupo — tanto desde Agenda como desde el sitio web público.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Profesional</label>
                <select
                  value={profesionalId}
                  onChange={(e) => {
                    setProfesionalId(e.target.value ? Number(e.target.value) : '');
                    setServicioId('');
                    setDiasSeleccionados([]);
                    setConfigPorDia({});
                  }}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                >
                  <option value="">Selecciona un profesional...</option>
                  {profesionalesDisponibles.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.area_nombre ? `— ${p.area_nombre}` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Servicio</label>
                <select
                  value={servicioId}
                  onChange={(e) => setServicioId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!profesionalId}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm disabled:opacity-50"
                >
                  <option value="">Selecciona un servicio...</option>
                  {serviciosDelArea.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre} (Bs {s.costo})</option>
                  ))}
                </select>
              </div>

              {servicioId && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Cuando se marca "individual" en la inscripción
                  </label>
                  <select
                    value={servicioIndividualId}
                    onChange={(e) => setServicioIndividualId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                  >
                    <option value="">Usar el mismo servicio grupal (su costo normal)</option>
                    {serviciosDelArea.filter((s) => s.id !== servicioId).map((s) => (
                      <option key={s.id} value={s.id}>Cambiar a: {s.nombre} (Bs {s.costo})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Si marcás a alguien como sesión individual porque vino solo ese día, la cita puede quedar cargada
                    con este otro servicio en vez del grupal.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Días de la semana <span className="text-gray-400 normal-case font-normal">(uno o más)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DIAS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => alternarDia(d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        diasSeleccionados.includes(d) ? 'bg-[#A000D1] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                {diasSinJornada.length > 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5 mt-2">
                    Este profesional no tiene jornada configurada en esta área los: {diasSinJornada.join(', ')}.
                  </p>
                )}
              </div>

              {/* Un bloque de horario POR CADA día elegido — cada uno con su propia jornada real */}
              {profesionalId && diasSeleccionados.filter((d) => !diasSinJornada.includes(d)).map((d) => {
                const slots = slotsDeInicioDe(d);
                const cfg = configPorDia[d] || { horaInicio: '', duracion: 60 };
                const disponibles = cfg.horaInicio ? minutosDisponiblesDesde(d, cfg.horaInicio) : 0;
                return (
                  <div key={d} className="border border-gray-200 rounded-xl p-3 space-y-2.5 bg-gray-50/60">
                    <p className="text-xs font-bold text-gray-700">
                      {d} {cargandoHorarios && <Loader2 size={10} className="inline animate-spin ml-1" />}
                    </p>
                    {!cargandoHorarios && slots.length === 0 ? (
                      <p className="text-xs text-amber-600">Sin jornada configurada ese día.</p>
                    ) : (
                      <>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Horario de inicio</p>
                          <div className="flex flex-wrap gap-1.5">
                            {slots.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => elegirHoraDia(d, s)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                                  cfg.horaInicio === s ? 'bg-[#A000D1] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#A000D1]'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        {cfg.horaInicio && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Duración</p>
                            <div className="flex flex-wrap gap-1.5">
                              {DURACIONES.filter((dur) => dur <= disponibles).map((dur) => (
                                <button
                                  key={dur}
                                  type="button"
                                  onClick={() => elegirDuracionDia(d, dur)}
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                                    cfg.duracion === dur ? 'bg-[#A000D1] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#A000D1]'
                                  }`}
                                >
                                  {dur < 60 ? `${dur} min` : `${dur / 60}h${dur % 60 ? ` ${dur % 60}min` : ''}`}
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1.5">
                              Termina a las {horaFinDe(cfg.horaInicio, cfg.duracion)}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Empieza a regir desde
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  min={hoy()}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                />
                <p className="text-[10px] text-gray-400 mt-1">No va a aparecer disponible en fechas anteriores a esta.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Capacidad (personas)</label>
                  <input type="number" min={1} value={capacidad} onChange={(e) => setCapacidad(Number(e.target.value))} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Costo grupal <span className="text-gray-400 normal-case font-normal">(opcional)</span>
                  </label>
                  <input type="number" min={0} value={costoGrupal} onChange={(e) => setCostoGrupal(e.target.value)} placeholder="Usa el del servicio" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" />
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
              {ok && <p className="text-xs text-emerald-600">{ok}</p>}

              <button
                onClick={guardar}
                disabled={guardando}
                className="w-full bg-[#A000D1] hover:bg-[#8800b3] disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {guardando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Crear sesión grupal
              </button>
            </div>

            <div className="mt-8 pt-5 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Sesiones grupales configuradas</h4>
              {cargando ? (
                <div className="flex justify-center py-6 text-gray-400"><Loader2 size={16} className="animate-spin" /></div>
              ) : sesiones.length === 0 ? (
                <p className="text-xs text-gray-400">No hay sesiones grupales configuradas.</p>
              ) : (
                <div className="space-y-2">
                  {sesiones.map((s) => (
                    <div key={s.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{s.servicio_nombre}</p>
                        <p className="text-[10px] text-gray-400">
                          {s.profesional_nombre} · {s.dia} {s.hora_inicio.slice(0, 5)}–{s.hora_fin.slice(0, 5)} · Cap. {s.capacidad}
                          {s.fecha_inicio ? ` · desde ${s.fecha_inicio.slice(0, 10).split('-').reverse().join('/')}` : ''}
                        </p>
                        {s.servicio_individual_nombre && (
                          <p className="text-[10px] text-violet-500 mt-0.5">
                            Individual → {s.servicio_individual_nombre}
                          </p>
                        )}
                      </div>
                      <button onClick={() => borrar(s.id)} className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
