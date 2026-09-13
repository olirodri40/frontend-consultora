// src/components/ui/BloqueosAgendaPanel.tsx
// Cursos, capacitaciones, seminarios y otros bloqueos de agenda: dejan a un
// profesional completamente ocupado en fechas/horarios puntuales, tanto en
// Admin/Agenda como en el sitio web público.
import { useState, useEffect, useCallback } from 'react';
import { GraduationCap, X, Check, Loader2, Calendar, Trash2 } from 'lucide-react';
import { getHorarios } from '../../services/admin.service';
import { getBloqueos, crearBloqueo, eliminarBloqueo } from '../../services/bloqueosAgenda.service';

const DIAS_JS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

type Profesional = {
  id: number;
  nombre: string;
  area_id?: number;
  area_nombre?: string;
  areas?: { id: number; nombre: string }[];
  activo?: boolean;
  servicios_ids?: number[];
};

type Bloqueo = {
  id: number;
  professional_id: number;
  profesional_nombre: string;
  area_nombre: string;
  nombre: string;
  tipo: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
};

function formatearFecha(fecha: string) {
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

export default function BloqueosAgendaPanel({
  profesionales,
  onCreado,
}: {
  profesionales: Profesional[];
  onCreado?: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [profesionalId, setProfesionalId] = useState<number | ''>('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'presencial' | 'virtual' | 'semipresencial'>('presencial');
  const [fechaInput, setFechaInput] = useState('');
  const [fechas, setFechas] = useState<string[]>([]);
  const [horaInicio, setHoraInicio] = useState('18:00');
  const [horaFin, setHoraFin] = useState('20:00');
  const [notas, setNotas] = useState('');
  const [horariosProf, setHorariosProf] = useState<any[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [proximos, setProximos] = useState<Bloqueo[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);

  const profesional = profesionales.find((p) => p.id === profesionalId);

  // Solo profesionales activos y con al menos un área asignada.
  const profesionalesDisponibles = profesionales.filter(
    (p) => p.activo !== false && (p.areas?.length ?? 0) > 0
  );

  const cargarProximos = useCallback(async () => {
    setCargandoLista(true);
    try {
      const hoy = new Date().toISOString().slice(0, 10);
      const data = await getBloqueos(hoy);
      setProximos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoLista(false);
    }
  }, []);

  useEffect(() => {
    if (abierto) cargarProximos();
  }, [abierto, cargarProximos]);

  useEffect(() => {
    if (!profesionalId) {
      setHorariosProf([]);
      return;
    }
    getHorarios(Number(profesionalId))
      .then(setHorariosProf)
      .catch(() => setHorariosProf([]));
  }, [profesionalId]);

  function diaDeFecha(fecha: string) {
    const d = new Date(`${fecha}T00:00:00`);
    return DIAS_JS[d.getDay()];
  }

  function horarioDelDia(fecha: string) {
    const dia = diaDeFecha(fecha);
    const filas = horariosProf.filter((h) => h.dia === dia);
    if (filas.length === 0) return 'Sin horario configurado ese día';
    return filas.map((h) => `${h.hora_inicio?.slice(0, 5)}–${h.hora_fin?.slice(0, 5)}`).join(', ');
  }

  function agregarFecha() {
    if (!fechaInput) return;
    if (fechas.includes(fechaInput)) return;
    setFechas((prev) => [...prev, fechaInput].sort());
    setFechaInput('');
  }

  function quitarFecha(f: string) {
    setFechas((prev) => prev.filter((x) => x !== f));
  }

  function limpiarFormulario() {
    setProfesionalId('');
    setNombre('');
    setTipo('presencial');
    setFechaInput('');
    setFechas([]);
    setHoraInicio('18:00');
    setHoraFin('20:00');
    setNotas('');
    setError('');
  }

  async function guardar() {
    setError('');
    setOk('');
    if (!profesional) { setError('Elegí un profesional'); return; }
    if (!nombre.trim()) { setError('Ponele un nombre al curso/evento'); return; }
    if (fechas.length === 0) { setError('Agregá al menos una fecha'); return; }
    if (horaFin <= horaInicio) { setError('La hora de fin debe ser mayor a la de inicio'); return; }

    const areaId = profesional.area_id ?? profesional.areas?.[0]?.id;
    if (!areaId) { setError('Ese profesional no tiene área asignada'); return; }

    setGuardando(true);
    try {
      await crearBloqueo({
        professional_id: profesional.id,
        area_id: areaId,
        nombre: nombre.trim(),
        tipo,
        fechas,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        notas: notas.trim() || undefined,
      });
      setOk('Bloqueo creado correctamente');
      limpiarFormulario();
      cargarProximos();
      if (onCreado) onCreado();
      setTimeout(() => setOk(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.mensaje || 'No se pudo crear el bloqueo');
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: number) {
    if (!confirm('¿Eliminar este bloqueo? El horario volverá a quedar disponible.')) return;
    try {
      await eliminarBloqueo(id);
      cargarProximos();
      if (onCreado) onCreado();
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
        <GraduationCap size={16} />
        Cursos y bloqueos
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setAbierto(false)}>
          <div
            className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap size={18} className="text-[#A000D1]" /> Cursos y bloqueos de agenda
              </h3>
              <button
                onClick={() => setAbierto(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Para cursos, capacitaciones, seminarios o reuniones: el profesional queda ocupado
              en esas fechas y horas, tanto en Agenda como en el sitio web público.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Profesional
                </label>
                <select
                  value={profesionalId}
                  onChange={(e) => setProfesionalId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                >
                  <option value="">Selecciona un profesional...</option>
                  {profesionalesDisponibles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.area_nombre ? `— ${p.area_nombre}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Nombre del curso / evento
                </label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Curso de Psicología Clínica"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Modalidad
                </label>
                <div className="flex gap-2">
                  {(['presencial', 'virtual', 'semipresencial'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={`flex-1 text-xs font-semibold rounded-lg py-2 capitalize transition-all ${
                        tipo === t ? 'bg-[#A000D1] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Fechas
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={fechaInput}
                    onChange={(e) => setFechaInput(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl p-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={agregarFecha}
                    className="px-3 bg-violet-50 hover:bg-violet-100 text-[#A000D1] text-xs font-semibold rounded-xl"
                  >
                    Agregar
                  </button>
                </div>

                {fechas.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {fechas.map((f) => (
                      <div key={f} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <Calendar size={11} /> {formatearFecha(f)} · {diaDeFecha(f)}
                          </span>
                          {profesionalId && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Horario habitual: {horarioDelDia(f)}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => quitarFecha(f)}
                          className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Hora fin
                  </label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Notas <span className="text-gray-400 normal-case font-normal">(opcional)</span>
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm resize-none"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
              {ok && <p className="text-xs text-emerald-600">{ok}</p>}

              <button
                onClick={guardar}
                disabled={guardando}
                className="w-full bg-[#A000D1] hover:bg-[#8800b3] disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {guardando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Crear bloqueo
              </button>
            </div>

            <div className="mt-8 pt-5 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Próximos cursos/bloqueos</h4>
              {cargandoLista ? (
                <div className="flex justify-center py-6 text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              ) : proximos.length === 0 ? (
                <p className="text-xs text-gray-400">No hay bloqueos programados.</p>
              ) : (
                <div className="space-y-2">
                  {proximos.map((b) => (
                    <div key={b.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{b.nombre}</p>
                        <p className="text-[10px] text-gray-400">
                          {b.profesional_nombre} · {formatearFecha(b.fecha)} · {b.hora_inicio.slice(0, 5)}–{b.hora_fin.slice(0, 5)}
                        </p>
                      </div>
                      <button
                        onClick={() => borrar(b.id)}
                        className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                      >
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
