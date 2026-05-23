import { useState, useEffect } from 'react';
import {
  getActividadesGeronto,
  getParticipantesGeronto,
  crearParticipanteGeronto,
  renovarCicloGeronto,
  marcarAsistenciaGeronto,
  getAsistenciaCiclo,
  editarParticipanteGeronto,
  eliminarParticipanteGeronto,
} from '../services/geronto.service';

export default function Gerontologia() {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalRenovar, setModalRenovar] = useState<any>(null);
  const [modalAsistencia, setModalAsistencia] = useState<any>(null);
  const [asistenciaDetalle, setAsistenciaDetalle] = useState<any[]>([]);
  const [actividadesSeleccionadas, setActividadesSeleccionadas] = useState<number[]>([]);
  const [modalEditar, setModalEditar] = useState<any>(null);
  const [formEditar, setFormEditar] = useState<any>({ 
    nombre: '', carnet: '', telefono: '', fecha_nac: '', 
    actividades_ids: [], fecha_inicio: '', monto: 0, metodo_pago: 'efectivo' 
  });

  const [nuevoForm, setNuevoForm] = useState({
    nombre: '', carnet: '', telefono: '', fecha_nac: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    monto: 0, metodo_pago: 'efectivo',
  });

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      const [parts, acts] = await Promise.all([
        getParticipantesGeronto(),
        getActividadesGeronto(),
      ]);
      setParticipantes(parts);
      setActividades(acts);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  function toggleActividad(id: number) {
    setActividadesSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  }

  async function abrirModalAsistencia(p: any) {
    setModalAsistencia(p);
    if (p.ciclo_id) {
      try {
        const data = await getAsistenciaCiclo(p.ciclo_id);
        setAsistenciaDetalle(data);
      } catch (err) { console.error(err); }
    }
  }

  async function crearParticipante(e: React.FormEvent) {
    e.preventDefault();
    if (actividadesSeleccionadas.length === 0) {
      alert('Selecciona al menos una actividad');
      return;
    }
    try {
      await crearParticipanteGeronto({ ...nuevoForm, actividades_ids: actividadesSeleccionadas });
      setModalNuevo(false);
      setActividadesSeleccionadas([]);
      setNuevoForm({
        nombre: '', carnet: '', telefono: '', fecha_nac: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        monto: 0, metodo_pago: 'efectivo',
      });
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al inscribir');
    }
  }

  async function renovarCiclo(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    try {
      await renovarCicloGeronto(modalRenovar.id, {
        fecha_inicio: form.get('fecha_inicio'),
        monto: Number(form.get('monto')),
        metodo_pago: form.get('metodo_pago'),
        actividades_ids: modalRenovar.actividades_ids || [],
      });
      setModalRenovar(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al renovar');
    }
  }

  async function registrarAsistencia(actividadId: number, estado: string, fecha: string) {
    try {
      await marcarAsistenciaGeronto({
        participant_id: modalAsistencia.id,
        cycle_id: modalAsistencia.ciclo_id,
        activity_id: actividadId,
        fecha,
        estado,
      });
      const data = await getAsistenciaCiclo(modalAsistencia.ciclo_id);
      setAsistenciaDetalle(data);
      await cargarDatos();
    } catch (err) { console.error(err); }
  }

  function calcularSesiones(act: any, fechaInicio: string, asistenciaActividad: any[]) {
    const diasSemana: Record<string, number> = {
      'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miercoles': 3,
      'Jueves': 4, 'Viernes': 5, 'Sabado': 6
    };
    const diaActividad = diasSemana[act.dia] ?? 1;
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + 1);

    while (fecha.getDay() !== diaActividad) {
      fecha.setDate(fecha.getDate() + 1);
    }

    const sesiones: Date[] = [];
    let sesionesValidas = 0;
    let maxIteraciones = 20;

    while (sesionesValidas < 4 && maxIteraciones > 0) {
      const fechaActual = new Date(fecha);
      sesiones.push(fechaActual);
      const fechaStr = fechaActual.toISOString().split('T')[0];
      const registro = asistenciaActividad.find(a => a.fecha?.split('T')[0] === fechaStr);

      if (registro?.estado === 'permiso' || registro?.estado === 'suspendida') {
        // No cuenta como sesión válida
      } else {
        sesionesValidas++;
      }
      fecha.setDate(fecha.getDate() + 7);
      maxIteraciones--;
    }
    return sesiones;
  }

  // 🆕 FUNCIÓN: Calcular progreso total del ciclo
  function calcularProgresoCiclo(p: any): number {
    if (!p.ciclo_id || !p.actividades_ids || p.actividades_ids.length === 0) return 0;
    
    const totalActividades = p.actividades_ids.length;
    const totalClasesEsperadas = totalActividades * 4; // 4 sesiones por actividad
    
    const asistidas = parseInt(p.clases_asistidas || 0);
    const faltas = parseInt(p.clases_falta || 0);
    const permisos = parseInt(p.clases_permiso || 0);
    const totalMarcadas = asistidas + faltas + permisos;
    
    if (totalClasesEsperadas === 0) return 0;
    
    return Math.min((totalMarcadas / totalClasesEsperadas) * 100, 100);
  }

  // 🆕 FUNCIÓN: Determinar si el ciclo está completo
  function cicloCompleto(p: any): boolean {
    return calcularProgresoCiclo(p) >= 100;
  }

  const actividadesPorDia = actividades.reduce((acc: any, act: any) => {
    if (!acc[act.dia]) acc[act.dia] = [];
    acc[act.dia].push(act);
    return acc;
  }, {});

  const hoy = new Date().toISOString().split('T')[0];

  function abrirModalEditar(p: any) {
    setFormEditar({
      nombre: p.nombre || '',
      carnet: p.carnet || '',
      telefono: p.telefono || '',
      fecha_nac: p.fecha_nac ? p.fecha_nac.split('T')[0] : '',
      actividades_ids: p.actividades_ids || [],
      fecha_inicio: p.fecha_inicio ? p.fecha_inicio.split('T')[0] : '',
      monto: p.monto || 0,
      metodo_pago: p.metodo_pago || 'efectivo',
    });
    setModalEditar(p);
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    try {
      await editarParticipanteGeronto(modalEditar.id, formEditar);
      setModalEditar(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al editar');
    }
  }

  async function eliminarParticipante(id: number) {
    if (!confirm('Seguro que deseas eliminar este participante?')) return;
    try {
      await eliminarParticipanteGeronto(id);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al eliminar');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">👴 Gerontologia</h1>
          <p className="text-sm text-gray-500">{participantes.length} participantes activos</p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Inscribir participante
        </button>
      </div>

      <div className="mb-6 bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Actividades disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(actividadesPorDia).map(([dia, acts]: any) => (
            <div key={dia} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-bold text-gray-600 mb-2">{dia}</p>
              {acts.map((act: any) => (
                <div key={act.id} className="flex items-center gap-2 text-sm py-1">
                  <span>{act.emoji}</span>
                  <span className="text-gray-700">{act.nombre}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {act.hora_inicio?.slice(0,5)} - {act.hora_fin?.slice(0,5)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : participantes.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
          No hay participantes inscritos.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participantes.map(p => {
            const sinCiclo = !p.ciclo_id;
            const asistidas = parseInt(p.clases_asistidas || 0);
            const faltas = parseInt(p.clases_falta || 0);
            const permisos = parseInt(p.clases_permiso || 0);
            const totalMarcadas = asistidas + faltas + permisos;
            const totalActividades = p.actividades_ids?.length || 0;
            const totalEsperadas = totalActividades * 4;
            const progreso = calcularProgresoCiclo(p);
            const completo = cicloCompleto(p);

            return (
              <div key={p.id} className={`bg-white rounded-xl border p-4 shadow-sm ${completo ? 'border-emerald-400 bg-emerald-50/30' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{p.nombre}</h3>
                    <p className="text-xs text-gray-500">
                      {p.carnet && `CI: ${p.carnet}`} {p.telefono && `- ${p.telefono}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => abrirModalEditar(p)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                    <button onClick={() => eliminarParticipante(p.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                    {sinCiclo ? (
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Sin ciclo</span>
                    ) : completo ? (
                      <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full">✓ Completo</span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Ciclo {p.numero_ciclo}</span>
                    )}
                  </div>
                </div>

                {/* 🆕 Mostrar costo del ciclo */}
                {!sinCiclo && p.monto > 0 && (
                  <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
                    <span>💰 Costo ciclo:</span>
                    <span className="font-bold text-gray-700">Bs {p.monto}</span>
                    {p.metodo_pago && (
                      <span className="text-[10px] text-gray-400 capitalize">({p.metodo_pago})</span>
                    )}
                  </div>
                )}

                {/* Actividades con barras individuales */}
                {p.actividades_ids && p.actividades_ids.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    {p.actividades_ids.map((actId: number) => {
                      const act = actividades.find(a => a.id === actId);
                      if (!act) return null;
                      const asistidasAct = parseInt(p.asistencia_por_actividad?.[actId] || 0);
                      const porcentajeAct = Math.min((asistidasAct / 4) * 100, 100);
                      return (
                        <div key={actId}>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[10px] text-gray-600">{act.emoji} {act.nombre.split(' ')[0]}</span>
                            <span className={`text-[10px] ${asistidasAct >= 4 ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                              {asistidasAct}/4 {asistidasAct >= 4 ? '✓' : ''}
                            </span>
                          </div>
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${asistidasAct >= 4 ? 'bg-emerald-500' : 'bg-blue-400'}`}
                              style={{ width: `${porcentajeAct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 🆕 Barra de progreso general */}
                {!sinCiclo && totalEsperadas > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progreso total: {totalMarcadas} / {totalEsperadas}</span>
                      <span className={completo ? 'text-emerald-600 font-bold' : ''}>
                        {Math.round(progreso)}%
                        {completo && ' ✓'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${completo ? 'bg-emerald-500' : 'bg-emerald-400'}`} 
                        style={{ width: `${progreso}%` }} 
                      />
                    </div>
                  </div>
                )}

                {/* Contadores */}
                {!sinCiclo && (
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="bg-emerald-50 rounded p-1">
                      <p className="text-[10px] text-gray-500">Asistió</p>
                      <p className="text-sm font-bold text-emerald-600">{asistidas}</p>
                    </div>
                    <div className="bg-red-50 rounded p-1">
                      <p className="text-[10px] text-gray-500">Falta</p>
                      <p className="text-sm font-bold text-red-600">{faltas}</p>
                    </div>
                    <div className="bg-yellow-50 rounded p-1">
                      <p className="text-[10px] text-gray-500">Permiso</p>
                      <p className="text-sm font-bold text-yellow-600">{permisos}</p>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2">
                  {sinCiclo ? (
                    <button onClick={() => setModalRenovar(p)} className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700">
                      + Iniciar ciclo
                    </button>
                  ) : (
                    <>
                      <button onClick={() => abrirModalAsistencia(p)} className="flex-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs hover:bg-emerald-200">
                        Marcar asistencia
                      </button>
                      {/* 🆕 Botón Renovar cambia de color */}
                      <button 
                        onClick={() => setModalRenovar(p)} 
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          completo 
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {completo ? '✓ Renovar' : 'Renovar'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Editar */}
      {modalEditar !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <form onSubmit={guardarEdicion} className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Editar participante</h3>
              <button type="button" onClick={() => setModalEditar(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Nombre completo</label>
                <input type="text" required value={formEditar.nombre} onChange={e => setFormEditar({ ...formEditar, nombre: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Carnet</label>
                  <input type="text" value={formEditar.carnet} onChange={e => setFormEditar({ ...formEditar, carnet: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Telefono</label>
                  <input type="text" value={formEditar.telefono} onChange={e => setFormEditar({ ...formEditar, telefono: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Fecha nacimiento</label>
                <input type="date" value={formEditar.fecha_nac} onChange={e => setFormEditar({ ...formEditar, fecha_nac: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" />
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Actividades del ciclo actual</p>
                <div className="space-y-2">
                  {actividades.map(act => (
                    <label key={act.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formEditar.actividades_ids?.includes(act.id)} onChange={() => {
                        const ids = formEditar.actividades_ids || [];
                        setFormEditar({ ...formEditar, actividades_ids: ids.includes(act.id) ? ids.filter((id: number) => id !== act.id) : [...ids, act.id] });
                      }} className="rounded" />
                      <span className="text-sm">{act.emoji} {act.nombre}<span className="text-xs text-gray-400 ml-2">{act.dia}</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Pago del ciclo actual</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Fecha inicio</label>
                    <input type="date" value={formEditar.fecha_inicio} onChange={e => setFormEditar({ ...formEditar, fecha_inicio: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Monto Bs</label>
                    <input type="number" value={formEditar.monto} onChange={e => setFormEditar({ ...formEditar, monto: Number(e.target.value) })} className="w-full border rounded-lg p-2 text-sm mt-1" />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-xs text-gray-500">Metodo de pago</label>
                  <select value={formEditar.metodo_pago} onChange={e => setFormEditar({ ...formEditar, metodo_pago: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1">
                    <option value="efectivo">Efectivo</option>
                    <option value="qr">QR</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setModalEditar(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
              <button type="submit" className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm hover:bg-emerald-700">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Nuevo */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <form onSubmit={crearParticipante} className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Inscribir participante</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Nombre completo" required value={nuevoForm.nombre} onChange={e => setNuevoForm({ ...nuevoForm, nombre: e.target.value })} className="w-full border rounded-lg p-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Carnet" value={nuevoForm.carnet} onChange={e => setNuevoForm({ ...nuevoForm, carnet: e.target.value })} className="border rounded-lg p-2 text-sm" />
                <input type="text" placeholder="Telefono" value={nuevoForm.telefono} onChange={e => setNuevoForm({ ...nuevoForm, telefono: e.target.value })} className="border rounded-lg p-2 text-sm" />
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Seleccionar actividades</p>
                <div className="space-y-2">
                  {actividades.map(act => (
                    <label key={act.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={actividadesSeleccionadas.includes(act.id)} onChange={() => toggleActividad(act.id)} className="rounded" />
                      <span className="text-sm">{act.emoji} {act.nombre}<span className="text-xs text-gray-400 ml-2">{act.dia}</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Pago</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" required value={nuevoForm.fecha_inicio} onChange={e => setNuevoForm({ ...nuevoForm, fecha_inicio: e.target.value })} className="border rounded-lg p-2 text-sm" />
                  <input type="number" placeholder="Monto Bs" required value={nuevoForm.monto} onChange={e => setNuevoForm({ ...nuevoForm, monto: Number(e.target.value) })} className="border rounded-lg p-2 text-sm" />
                </div>
                <select value={nuevoForm.metodo_pago} onChange={e => setNuevoForm({ ...nuevoForm, metodo_pago: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-2">
                  <option value="efectivo">Efectivo</option>
                  <option value="qr">QR</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setModalNuevo(false)} className="flex-1 border rounded-lg py-2 text-sm">Cancelar</button>
              <button type="submit" className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm">Inscribir</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Renovar */}
      {modalRenovar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <form onSubmit={renovarCiclo} className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-1">Nuevo ciclo</h3>
            <p className="text-sm text-gray-500 mb-4">{modalRenovar.nombre}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Fecha inicio</label>
                <input name="fecha_inicio" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Monto Bs</label>
                <input name="monto" type="number" defaultValue={modalRenovar.monto || 200} required className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Metodo de pago</label>
                <select name="metodo_pago" className="w-full border rounded-lg p-2 text-sm">
                  <option value="efectivo">Efectivo</option>
                  <option value="qr">QR</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setModalRenovar(null)} className="flex-1 border rounded-lg py-2 text-sm">Cancelar</button>
              <button type="submit" className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm">Confirmar</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Asistencia - SIN CAMBIOS (ya funciona bien) */}
      {modalAsistencia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{modalAsistencia.nombre}</h3>
                <p className="text-xs text-gray-500">
                  Ciclo {modalAsistencia.numero_ciclo} — Inicio: {new Date(modalAsistencia.fecha_inicio).toLocaleDateString('es')}
                </p>
              </div>
              <button onClick={() => { setModalAsistencia(null); setAsistenciaDetalle([]); }} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="p-4">
              {(() => {
                const todasSesiones = (modalAsistencia.actividades_ids || []).map((actId: number) => {
                  const act = actividades.find(a => a.id === actId);
                  if (!act) return 4;
                  const asistenciaActividad = asistenciaDetalle.filter(a => a.activity_id === actId);
                  return calcularSesiones(act, modalAsistencia.fecha_inicio, asistenciaActividad).length;
                });
                const maxSesiones = Math.max(4, ...todasSesiones);

                return (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 w-48">Actividad</th>
                        {Array.from({ length: maxSesiones }, (_, i) => (
                          <th key={i} className="text-center py-2 px-2 text-xs font-semibold text-gray-600">S{i+1}</th>
                        ))}
                        <th className="text-center py-2 px-2 text-xs font-semibold text-emerald-600">Asistio</th>
                        <th className="text-center py-2 px-2 text-xs font-semibold text-red-500">Falta</th>
                        <th className="text-center py-2 px-2 text-xs font-semibold text-yellow-500">Permiso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(modalAsistencia.actividades_ids || []).map((actId: number) => {
                        const act = actividades.find(a => a.id === actId);
                        if (!act) return null;
                        const asistenciaActividad = asistenciaDetalle.filter(a => a.activity_id === actId);
                        const sesiones = calcularSesiones(act, modalAsistencia.fecha_inicio, asistenciaActividad);
                        const conteo = { asistio: 0, falta: 0, permiso: 0 };
                        asistenciaActividad.forEach(a => {
                          if (a.estado === 'asistio') conteo.asistio++;
                          else if (a.estado === 'falta') conteo.falta++;
                          else if (a.estado === 'permiso') conteo.permiso++;
                        });

                        return (
                          <tr key={actId} className="hover:bg-gray-50">
                            <td className="py-3 px-3">
                              <p className="font-medium text-gray-800 text-xs">{act.emoji} {act.nombre}</p>
                              <p className="text-[10px] text-gray-400">{act.dia} · {act.hora_inicio?.slice(0,5)}-{act.hora_fin?.slice(0,5)}</p>
                            </td>
                            {sesiones.map((fechaSesion, idx) => {
                              const fechaStr = fechaSesion.toISOString().split('T')[0];
                              const registro = asistenciaActividad.find(a => a.fecha?.split('T')[0] === fechaStr);
                              const esHoy = fechaStr === hoy;
                              const esPasada = fechaSesion <= new Date();
                              const colorActivo =
                                registro?.estado === 'asistio'    ? 'bg-emerald-500 text-white' :
                                registro?.estado === 'falta'      ? 'bg-red-400 text-white' :
                                registro?.estado === 'permiso'    ? 'bg-yellow-400 text-white' :
                                registro?.estado === 'suspendida' ? 'bg-gray-400 text-white' : '';

                              return (
                                <td key={idx} className="py-3 px-2 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <p className="text-[9px] text-gray-400">{fechaSesion.toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                                    {(esHoy || esPasada) ? (
                                      <div className="relative group">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border-2 cursor-pointer ${
                                          registro ? `${colorActivo} border-transparent` : 'border-dashed border-gray-300 text-gray-300'
                                        } ${esHoy ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}>
                                          {registro?.estado === 'asistio' ? '✓' : registro?.estado === 'falta' ? '✗' : registro?.estado === 'permiso' ? 'P' : registro?.estado === 'suspendida' ? '-' : '+'}
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center z-20">
                                          <div className="bg-white border rounded-lg shadow-lg p-1 flex gap-1">
                                            {['asistio','falta','permiso','suspendida'].map(estado => (
                                              <button key={estado} onClick={() => registrarAsistencia(actId, estado, fechaStr)} title={estado}
                                                className={`w-7 h-7 rounded text-xs font-bold ${
                                                  estado === 'asistio' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                                                  estado === 'falta' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                                  estado === 'permiso' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                                  'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                } ${registro?.estado === estado ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}>
                                                {estado === 'asistio' ? '✓' : estado === 'falta' ? '✗' : estado === 'permiso' ? 'P' : '-'}
                                              </button>
                                            ))}
                                          </div>
                                          <div className="w-2 h-2 bg-white border-r border-b rotate-45 -mt-1"></div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                                        <span className="text-[10px] text-gray-200">·</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            {Array.from({ length: maxSesiones - sesiones.length }, (_, i) => (
                              <td key={`empty-${i}`} className="py-3 px-2 text-center">
                                <div className="w-8 h-8 rounded-lg border border-dashed border-gray-100 flex items-center justify-center mx-auto">
                                  <span className="text-[10px] text-gray-200">·</span>
                                </div>
                              </td>
                            ))}
                            <td className="py-3 px-2 text-center"><span className="text-sm font-bold text-emerald-600">{conteo.asistio}</span></td>
                            <td className="py-3 px-2 text-center"><span className="text-sm font-bold text-red-500">{conteo.falta}</span></td>
                            <td className="py-3 px-2 text-center"><span className="text-sm font-bold text-yellow-500">{conteo.permiso}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
            <div className="p-4 border-t">
              <button onClick={() => { setModalAsistencia(null); setAsistenciaDetalle([]); }} className="w-full border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}