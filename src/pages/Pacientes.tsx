import { useState, useEffect } from 'react';
import { getPacientes, getPacientePorId } from '../services/pacientes.service';
import { actualizarCitaService, eliminarCitaService } from '../services/citas.service';
import { getServicios } from '../services/admin.service';

const ORDINAL = ['1ra','2da','3ra','4ta','5ta','6ta','7ma','8va','9na','10ma'];

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [expandido, setExpandido] = useState<number | null>(null);
  const [citasPorPaciente, setCitasPorPaciente] = useState<Record<number, any[]>>({});
  const [reagendandoCita, setReagendandoCita] = useState<any>(null);
  const [formReagendar, setFormReagendar] = useState({ fecha: '', hora: '' });

  // Editar paciente
  const [editandoPaciente, setEditandoPaciente] = useState<any>(null);
  const [formPaciente, setFormPaciente] = useState({ nombre: '', telefono: '', carnet: '', edad: '' });

  // Editar cita
  const [editandoCita, setEditandoCita] = useState<any>(null);
  const [formCita, setFormCita] = useState<any>({});

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    try {
      setCargando(true);
      const [data, srvs] = await Promise.all([getPacientes(), getServicios()]);
      setPacientes(data);
      setServicios(srvs);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  }

  async function cargarPacientes(termino?: string) {
    try {
      setCargando(true);
      const data = await getPacientes(termino);
      setPacientes(data);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  }

  async function recargarCitasPaciente(pacienteId: number) {
    const data = await getPacientePorId(pacienteId);
    setCitasPorPaciente(prev => ({ ...prev, [pacienteId]: data.citas }));
  }

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    cargarPacientes(busqueda);
  }

  async function toggleExpand(p: any) {
    if (expandido === p.id) { setExpandido(null); return; }
    setExpandido(p.id);
    if (!citasPorPaciente[p.id]) {
      try { await recargarCitasPaciente(p.id); } catch (err) { console.error(err); }
    }
  }

  async function marcarAsistencia(pacienteId: number, citaId: number, asistio: boolean) {
    try {
      await actualizarCitaService(citaId, { asistio });
      await recargarCitasPaciente(pacienteId);
      await cargarPacientes(busqueda || undefined);
    } catch (err) { console.error(err); }
  }

  async function guardarReagendar(pacienteId: number) {
    if (!formReagendar.fecha || !formReagendar.hora) { alert('Selecciona fecha y hora'); return; }
    try {
      await actualizarCitaService(reagendandoCita.id, { fecha: formReagendar.fecha, hora: formReagendar.hora });
      setReagendandoCita(null);
      setFormReagendar({ fecha: '', hora: '' });
      await recargarCitasPaciente(pacienteId);
    } catch (err) { console.error(err); }
  }

  async function guardarEdicionPaciente() {
    if (!formPaciente.nombre) { alert('El nombre es obligatorio'); return; }
    try {
      const { actualizarPacienteService } = await import('../services/pacientes.service');
      await actualizarPacienteService(editandoPaciente.id, formPaciente);
      setEditandoPaciente(null);
      await cargarPacientes(busqueda || undefined);
    } catch (err) { console.error(err); }
  }

  async function guardarEdicionCita(pacienteId: number) {
    try {
      await actualizarCitaService(editandoCita.id, {
        estado: formCita.estado,
        monto_total: formCita.monto_total || null,
        monto_pagado: formCita.monto_pagado || null,
        metodo_pago: formCita.metodo_pago || null,
        notas: formCita.notas || null,
        total_sesiones: formCita.total_sesiones,
        modalidad: formCita.modalidad,
        servicio_nombre: formCita.servicio_nombre || null,
      });
      setEditandoCita(null);
      await recargarCitasPaciente(pacienteId);
      await cargarPacientes(busqueda || undefined);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al actualizar');
    }
  }

  async function eliminarCita(pacienteId: number, citaId: number) {
    if (!confirm('¿Seguro que deseas eliminar esta cita?')) return;
    try {
      await eliminarCitaService(citaId);
      // Recargar pacientes — si se eliminó el paciente también, refrescar lista
      await cargarPacientes(busqueda || undefined);
      const nuevaData = await getPacientePorId(pacienteId).catch(() => null);
      if (nuevaData) {
        setCitasPorPaciente(prev => ({ ...prev, [pacienteId]: nuevaData.citas }));
      } else {
        setCitasPorPaciente(prev => { const n = { ...prev }; delete n[pacienteId]; return n; });
        setExpandido(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al eliminar');
    }
  }

  const totalIngresos = pacientes.reduce((sum, p) => sum + Number(p.total_pagado || 0), 0);

  function estadoPago(p: any) {
    const pagado = Number(p.total_pagado || 0);
    if (pagado <= 0) return { label: '⏳ Sin pago', cls: 'bg-gray-100 text-gray-600' };
    if (pagado > 0) return { label: '✓ Pagado', cls: 'bg-green-100 text-green-700' };
    return { label: '💰 Parcial', cls: 'bg-yellow-100 text-yellow-700' };
  }

  function asistenciaLabel(asistio: boolean | null) {
    if (asistio === true) return <span className="text-emerald-600 font-medium">✅ Asistio</span>;
    if (asistio === false) return <span className="text-red-500 font-medium">❌ No asistio</span>;
    return <span className="text-gray-400 font-medium">⏳ Pendiente</span>;
  }

  function MetodoPagoSelector({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    return (
      <div className="flex gap-1">
        {['efectivo', 'qr', 'transferencia'].map(m => (
          <button key={m} type="button" onClick={() => onChange(m)}
            className={`flex-1 py-1 rounded text-[10px] font-medium border ${value === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-300'}`}>
            {m === 'efectivo' ? '💵' : m === 'qr' ? '📱' : '🏦'} {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border mb-4">
        <div className="p-5 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">👥 Pacientes</h1>
            <p className="text-xs text-gray-500 mt-0.5">Psicología · Fisioterapia · Medicina · y más</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-gray-500">Total: <span className="font-bold text-gray-700">{pacientes.length}</span> pacientes</div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm font-semibold text-green-700">
              💰 Ingresos totales: Bs {totalIngresos.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="px-5 pb-4">
          <form onSubmit={handleBuscar} className="flex gap-2">
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="🔍 Buscar por nombre, carnet o telefono..."
              className="w-full md:w-96 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Buscar</button>
            {busqueda && (
              <button type="button" onClick={() => { setBusqueda(''); cargarPacientes(); }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">Limpiar</button>
            )}
          </form>
        </div>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="text-center py-12 text-gray-500">Cargando pacientes...</div>
      ) : pacientes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No se encontraron pacientes</div>
      ) : (
        <div className="space-y-3">
          {pacientes.map(p => {
            const citas = citasPorPaciente[p.id] || [];
            const abierto = expandido === p.id;
            const sesionesCompletadas = citas.filter(c => c.asistio === true).length;
            const totalSesiones = Number(p.total_sesiones_pagadas || 0);
            const progreso = totalSesiones > 0 ? Math.round((sesionesCompletadas / totalSesiones) * 100) : 0;
            const ep = estadoPago(p);
            const inicial = p.nombre?.charAt(0).toUpperCase() || '?';
            const primerasCita = citas[0];

            return (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Cabecera */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer hover:bg-gray-50/50"
                  onClick={() => toggleExpand(p)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg shrink-0">
                      {inicial}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {p.nombre} {p.edad && <span className="text-xs text-gray-400 font-normal">{p.edad} años</span>}
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-0.5">
                        {p.carnet && <span>🪪 {p.carnet}</span>}
                        {p.telefono && <span>📞 {p.telefono}</span>}
                        {primerasCita && (
                          <>
                            <span>👩‍⚕️ {primerasCita.profesional_nombre}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700">
                              {primerasCita.area_emoji} {primerasCita.area_nombre}
                            </span>
                            {primerasCita.servicio_nombre && <span className="text-gray-400">{primerasCita.servicio_nombre}</span>}
                            {primerasCita.modalidad && <span className="text-gray-400 capitalize">{primerasCita.modalidad}</span>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col items-center gap-1 min-w-[100px]">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <span className="font-bold text-emerald-700">{sesionesCompletadas}</span>
                        /<span>{totalSesiones}</span>
                        <span className="text-gray-400">sesiones</span>
                      </div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progreso}%` }} />
                      </div>
                      <div className="text-[10px] text-gray-400">
                        ⏳ {citas.filter(c => c.asistio === null || c.asistio === undefined).length} pendientes
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600 text-sm">Bs {Number(p.total_pagado).toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400">total pagado</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${ep.cls}`}>{ep.label}</span>

                    {/* Botón editar paciente */}
                    <button onClick={e => {
                      e.stopPropagation();
                      setEditandoPaciente(p);
                      setFormPaciente({ nombre: p.nombre || '', telefono: p.telefono || '', carnet: p.carnet || '', edad: p.edad || '' });
                    }} className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium hover:bg-emerald-100">
                      ✏️ Editar
                    </button>

                    <span className="text-gray-400 text-xs">{abierto ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Detalle expandible */}
                {abierto && (
                  <div className="border-t border-gray-100">
                    <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500">
                      📅 Fechas y asistencia · ✅❌ marcar asistencia · 📅 reagendar · ✏️ editar cita · 🗑 eliminar
                    </div>
                    {citas.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Cargando citas...</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50/80">
                            <tr className="text-[10px] text-gray-500 uppercase">
                              <th className="px-3 py-2 text-left">Sesion</th>
                              <th className="px-3 py-2 text-left">Fecha</th>
                              <th className="px-3 py-2 text-left">Hora</th>
                              <th className="px-3 py-2 text-left">Asistencia</th>
                              <th className="px-3 py-2 text-left">Monto</th>
                              <th className="px-3 py-2 text-left">Estado</th>
                              <th className="px-3 py-2 text-left">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {citas.map((c, idx) => (
                              <>
                                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50 text-xs">
                                  <td className="px-3 py-2 font-medium text-gray-700">{ORDINAL[idx] || `${idx+1}ra`}</td>
                                  <td className="px-3 py-2 text-gray-600">
                                    {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es', { day:'numeric', month:'short', year:'numeric' })}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">{c.hora?.slice(0,5)}</td>
                                  <td className="px-3 py-2">{asistenciaLabel(c.asistio)}</td>
                                  <td className="px-3 py-2 text-gray-500">{c.monto_pagado ? `Bs ${c.monto_pagado}` : '-'}</td>
                                  <td className="px-3 py-2">
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                      c.estado === 'confirmada' ? 'bg-emerald-100 text-emerald-700' :
                                      c.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>{c.estado}</span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex gap-1 flex-wrap">
                                      <button onClick={() => marcarAsistencia(p.id, c.id, true)}
                                        className={`px-1.5 py-0.5 rounded text-[9px] border ${c.asistio === true ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}>✅</button>
                                      <button onClick={() => marcarAsistencia(p.id, c.id, false)}
                                        className={`px-1.5 py-0.5 rounded text-[9px] border ${c.asistio === false ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>❌</button>
                                      <button onClick={() => { setReagendandoCita(c); setEditandoCita(null); setFormReagendar({ fecha: '', hora: '' }); }}
                                        className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100">📅</button>
                                      <button onClick={() => {
                                        setEditandoCita(c);
                                        setReagendandoCita(null);
                                        setFormCita({
                                          estado: c.estado,
                                          modalidad: c.modalidad || 'presencial',
                                          monto_total: c.monto_total || '',
                                          monto_pagado: c.monto_pagado || '',
                                          metodo_pago: c.metodo_pago || 'efectivo',
                                          notas: c.notas || '',
                                          total_sesiones: c.total_sesiones || 1,
                                          servicio_nombre: c.servicio_nombre || '',
                                        });
                                      }} className="px-1.5 py-0.5 rounded text-[9px] bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100">✏️</button>
                                      <button onClick={() => eliminarCita(p.id, c.id)}
                                        className="px-1.5 py-0.5 rounded text-[9px] bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">🗑</button>
                                    </div>

                                    {/* Reagendar inline */}
                                    {reagendandoCita?.id === c.id && (
                                      <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100 space-y-1">
                                        <p className="text-[10px] font-semibold text-blue-700">Reagendar</p>
                                        <input type="date" value={formReagendar.fecha}
                                          onChange={e => setFormReagendar({ fecha: e.target.value, hora: '' })}
                                          className="w-full border rounded p-1 text-[10px]" />
                                        {formReagendar.fecha && (
                                          <input type="time" value={formReagendar.hora}
                                            onChange={e => setFormReagendar({ ...formReagendar, hora: e.target.value })}
                                            className="w-full border rounded p-1 text-[10px]" />
                                        )}
                                        {formReagendar.fecha && formReagendar.hora && (
                                          <button onClick={() => guardarReagendar(p.id)}
                                            className="w-full py-1 bg-blue-600 text-white rounded text-[10px] hover:bg-blue-700">Confirmar</button>
                                        )}
                                        <button onClick={() => setReagendandoCita(null)}
                                          className="w-full py-1 border rounded text-[10px] text-gray-500 hover:bg-gray-50">Cancelar</button>
                                      </div>
                                    )}
                                  </td>
                                </tr>

                                {/* Editar cita inline */}
                                {editandoCita?.id === c.id && (
                                  <tr key={`edit-${c.id}`} className="bg-emerald-50/50">
                                    <td colSpan={7} className="px-3 py-3">
                                      <div className="space-y-2">
                                        <p className="text-[10px] font-semibold text-emerald-700">✏️ Editar cita</p>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="text-[10px] text-gray-500">Estado</label>
                                            <div className="flex gap-1 mt-0.5">
                                              <button type="button" onClick={() => setFormCita({ ...formCita, estado: 'pendiente' })}
                                                className={`flex-1 py-1 rounded text-[10px] border ${formCita.estado === 'pendiente' ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-white border-gray-300'}`}>
                                                🕐 Reserva
                                              </button>
                                              <button type="button" onClick={() => setFormCita({ ...formCita, estado: 'confirmada' })}
                                                className={`flex-1 py-1 rounded text-[10px] border ${formCita.estado === 'confirmada' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300'}`}>
                                                ✓ Confirmada
                                              </button>
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-gray-500">Modalidad</label>
                                            <select value={formCita.modalidad} onChange={e => setFormCita({ ...formCita, modalidad: e.target.value })}
                                              className="w-full border rounded p-1 text-[10px] mt-0.5">
                                              <option value="presencial">Presencial</option>
                                              <option value="virtual">Virtual</option>
                                              <option value="domicilio">Domicilio</option>
                                            </select>
                                          </div>
                                        </div>

                                        {formCita.estado === 'confirmada' && (
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="text-[10px] text-gray-500">Precio total (Bs)</label>
                                              <input type="number" value={formCita.monto_total}
                                                onChange={e => setFormCita({ ...formCita, monto_total: e.target.value })}
                                                className="w-full border rounded p-1 text-[10px] mt-0.5" />
                                            </div>
                                            <div>
                                              <label className="text-[10px] text-gray-500">Monto pagado (Bs)</label>
                                              <input type="number" value={formCita.monto_pagado}
                                                onChange={e => setFormCita({ ...formCita, monto_pagado: e.target.value })}
                                                className="w-full border rounded p-1 text-[10px] mt-0.5" />
                                            </div>
                                            <div>
                                              <label className="text-[10px] text-gray-500">Sesiones totales</label>
                                              <input type="number" min="1" value={formCita.total_sesiones}
                                                onChange={e => setFormCita({ ...formCita, total_sesiones: Number(e.target.value) })}
                                                className="w-full border rounded p-1 text-[10px] mt-0.5" />
                                            </div>
                                            <div>
                                              <label className="text-[10px] text-gray-500">Servicio</label>
                                              <select value={formCita.servicio_nombre || ''}
                                                onChange={e => setFormCita({ ...formCita, servicio_nombre: e.target.value })}
                                                className="w-full border rounded p-1 text-[10px] mt-0.5">
                                                <option value="">Sin servicio</option>
                                                {servicios.filter(s => s.area_id === c.area_id).map(s => (
                                                  <option key={s.id} value={s.nombre}>{s.nombre}</option>
                                                ))}
                                              </select>
                                            </div>
                                          </div>
                                        )}

                                        {formCita.estado === 'confirmada' && (
                                          <div>
                                            <label className="text-[10px] text-gray-500">Metodo de pago</label>
                                            <div className="mt-0.5">
                                              <MetodoPagoSelector value={formCita.metodo_pago} onChange={v => setFormCita({ ...formCita, metodo_pago: v })} />
                                            </div>
                                          </div>
                                        )}

                                        <div>
                                          <label className="text-[10px] text-gray-500">Notas</label>
                                          <textarea value={formCita.notas} onChange={e => setFormCita({ ...formCita, notas: e.target.value })}
                                            className="w-full border rounded p-1 text-[10px] mt-0.5" rows={2} placeholder="Observaciones..." />
                                        </div>

                                        <div className="flex gap-2">
                                          <button onClick={() => setEditandoCita(null)}
                                            className="flex-1 py-1 border rounded text-[10px] text-gray-600 hover:bg-gray-50">Cancelar</button>
                                          <button onClick={() => guardarEdicionCita(p.id)}
                                            className="flex-1 py-1 bg-emerald-600 text-white rounded text-[10px] hover:bg-emerald-700">Guardar</button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal editar paciente */}
      {editandoPaciente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4"
          onClick={() => setEditandoPaciente(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">✏️ Editar paciente</h3>
              <button onClick={() => setEditandoPaciente(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Nombre completo</label>
                <input type="text" value={formPaciente.nombre}
                  onChange={e => setFormPaciente({ ...formPaciente, nombre: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm mt-0.5" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Telefono</label>
                  <input type="text" value={formPaciente.telefono}
                    onChange={e => setFormPaciente({ ...formPaciente, telefono: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm mt-0.5" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Edad</label>
                  <input type="number" value={formPaciente.edad}
                    onChange={e => setFormPaciente({ ...formPaciente, edad: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm mt-0.5" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Carnet</label>
                <input type="text" value={formPaciente.carnet}
                  onChange={e => setFormPaciente({ ...formPaciente, carnet: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm mt-0.5" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditandoPaciente(null)}
                className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={guardarEdicionPaciente}
                className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm hover:bg-emerald-700">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}