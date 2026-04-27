import { useState, useEffect } from 'react';
import {
  getParticipantesZumba,
  crearParticipanteZumba,
  renovarCicloZumba,
  marcarAsistenciaZumba,
  getHorariosZumbaPublic,
  editarParticipanteZumba,
  eliminarParticipanteZumba,
  getAsistenciaCicloZumba,
} from '../services/zumba.service';

export default function Zumba() {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [horariosZumba, setHorariosZumba] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalRenovar, setModalRenovar] = useState<any>(null);
  const [modalAsistencia, setModalAsistencia] = useState<any>(null);
  const [asistenciaDetalle, setAsistenciaDetalle] = useState<any[]>([]);
  const [modalEditar, setModalEditar] = useState<any>(null);
  const [formEditar, setFormEditar] = useState<any>({
    nombre: '', carnet: '', telefono: '', fecha_nac: '',
    fecha_inicio: '', clases_pagadas: 8, monto: 0, metodo_pago: 'efectivo',
  });

  const [nuevoForm, setNuevoForm] = useState({
    nombre: '', carnet: '', telefono: '', fecha_nac: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    clases_pagadas: 8, monto: 400, metodo_pago: 'efectivo',
  });

  const hoy = new Date().toISOString().split('T')[0];

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      const [data, horarios] = await Promise.all([
        getParticipantesZumba(),
        getHorariosZumbaPublic(),
      ]);
      setParticipantes(data);
      setHorariosZumba(horarios);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  async function abrirModalAsistencia(p: any) {
    setModalAsistencia(p);
    if (p.ciclo_id) {
      try {
        const data = await getAsistenciaCicloZumba(p.ciclo_id);
        setAsistenciaDetalle(data);
      } catch (err) {
        console.error(err);
      }
    }
  }

  function abrirModalEditar(p: any) {
    setFormEditar({
      nombre: p.nombre || '',
      carnet: p.carnet || '',
      telefono: p.telefono || '',
      fecha_nac: p.fecha_nac ? p.fecha_nac.split('T')[0] : '',
      fecha_inicio: p.fecha_inicio ? p.fecha_inicio.split('T')[0] : '',
      clases_pagadas: p.clases_pagadas || 8,
      monto: p.monto || 0,
      metodo_pago: p.metodo_pago || 'efectivo',
    });
    setModalEditar(p);
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    try {
      await editarParticipanteZumba(modalEditar.id, formEditar);
      setModalEditar(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al editar');
    }
  }

  async function eliminarParticipante(id: number) {
    if (!confirm('Seguro que deseas eliminar este participante?')) return;
    try {
      await eliminarParticipanteZumba(id);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al eliminar');
    }
  }

  async function crearParticipante(e: React.FormEvent) {
    e.preventDefault();
    try {
      await crearParticipanteZumba(nuevoForm);
      setModalNuevo(false);
      setNuevoForm({
        nombre: '', carnet: '', telefono: '', fecha_nac: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        clases_pagadas: 8, monto: 400, metodo_pago: 'efectivo',
      });
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al crear participante');
    }
  }

  async function renovarCiclo(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    try {
      await renovarCicloZumba(modalRenovar.id, {
        fecha_inicio: form.get('fecha_inicio'),
        monto: Number(form.get('monto')),
        metodo_pago: form.get('metodo_pago'),
        clases_pagadas: Number(form.get('clases_pagadas')),
      });
      setModalRenovar(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al renovar ciclo');
    }
  }

  async function registrarAsistencia(estado: string, fecha: string) {
    try {
      await marcarAsistenciaZumba({
        participant_id: modalAsistencia.id,
        cycle_id: modalAsistencia.ciclo_id,
        fecha,
        estado,
      });
      const data = await getAsistenciaCicloZumba(modalAsistencia.ciclo_id);
      setAsistenciaDetalle(data);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert('Error al marcar asistencia');
    }
  }

function calcularSesionesZumba(fechaInicio: string, clasesPagadas: number, asistencia: any[]) {
  const sesiones: Date[] = [];
  const diasClase = horariosZumba.filter(h => h.activo).map((h: any) => {
    const dias: Record<string, number> = {
      'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miercoles': 3,
      'Jueves': 4, 'Viernes': 5, 'Sabado': 6
    };
    return dias[h.dia] ?? -1;
  }).filter(d => d >= 0);

  if (diasClase.length === 0) return sesiones;

  const MAX_TOTAL = clasesPagadas + 4;
  const fecha = new Date(fechaInicio);
  fecha.setDate(fecha.getDate() + 1);
  let sesionesValidas = 0;
  let maxIter = MAX_TOTAL * 3;

  while (sesionesValidas < clasesPagadas && sesiones.length < MAX_TOTAL && maxIter > 0) {
    if (diasClase.includes(fecha.getDay())) {
      const fechaActual = new Date(fecha);
      sesiones.push(fechaActual);
      const fechaStr = fechaActual.toISOString().split('T')[0];
      const registro = asistencia.find(a => a.fecha?.split('T')[0] === fechaStr);
      if (registro?.estado !== 'permiso' && registro?.estado !== 'suspendida') {
        sesionesValidas++;
      }
    }
    fecha.setDate(fecha.getDate() + 1);
    maxIter--;
  }
  return sesiones;
}
function calcularClasesAutomatico(): number {
  const diasActivos = horariosZumba.filter(h => h.activo).length;
  return diasActivos * 4;
}
  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">💃 Zumba</h1>
          <p className="text-sm text-gray-500">{participantes.length} participantes activos</p>
        </div>
        <button
          onClick={() => {
  const clases = calcularClasesAutomatico();
  setNuevoForm(prev => ({ ...prev, clases_pagadas: clases }));
  setModalNuevo(true);
}}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Inscribir participante
        </button>
      </div>

      {horariosZumba.length > 0 && (
        <div className="mb-6 bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Horarios de clases</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(() => {
              const porDia: Record<string, any[]> = {};
              horariosZumba.filter(h => h.activo).forEach(h => {
                if (!porDia[h.dia]) porDia[h.dia] = [];
                porDia[h.dia].push(h);
              });
              return Object.entries(porDia).map(([dia, turnos]) => (
                <div key={dia} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-600 mb-2">{dia}</p>
                  {turnos.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm py-1">
                      <span className="text-pink-500">💃</span>
                      <span className="text-gray-700">Zumba</span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {t.hora_inicio?.slice(0,5)} - {t.hora_fin?.slice(0,5)}
                      </span>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {cargando ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : participantes.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
          No hay participantes. Inscribe el primero con el boton superior.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participantes.map(p => {
            const sinCiclo = !p.ciclo_id;
            const asistidas = parseInt(p.clases_asistidas || 0);
            const pagadas = p.clases_pagadas || 0;
            const progreso = pagadas > 0 ? (asistidas / pagadas) * 100 : 0;

            return (
              <div key={p.id} className="bg-white rounded-xl border p-4 shadow-sm">
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
                    ) : (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Ciclo {p.numero_ciclo}</span>
                    )}
                  </div>
                </div>

                {!sinCiclo && (
                  <>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Clases: {asistidas} / {pagadas}</span>
                        <span>{Math.round(progreso)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 transition-all" style={{ width: `${progreso}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      <div className="bg-emerald-50 rounded p-1">
                        <p className="text-[10px] text-gray-500">Asistio</p>
                        <p className="text-sm font-bold text-emerald-600">{asistidas}</p>
                      </div>
                      <div className="bg-red-50 rounded p-1">
                        <p className="text-[10px] text-gray-500">Falta</p>
                        <p className="text-sm font-bold text-red-600">{p.clases_falta || 0}</p>
                      </div>
                      <div className="bg-yellow-50 rounded p-1">
                        <p className="text-[10px] text-gray-500">Permiso</p>
                        <p className="text-sm font-bold text-yellow-600">{p.clases_permiso || 0}</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  {sinCiclo ? (
                    <button onClick={() => setModalRenovar(p)} className="flex-1 px-3 py-2 bg-pink-600 text-white rounded-lg text-xs hover:bg-pink-700">
                      + Iniciar ciclo
                    </button>
                  ) : (
                    <>
                      <button onClick={() => abrirModalAsistencia(p)} className="flex-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs hover:bg-emerald-200">
                        Marcar asistencia
                      </button>
                      <button onClick={() => setModalRenovar(p)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200">
                        Renovar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalEditar !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <form onSubmit={guardarEdicion} className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Editar participante</h3>
              <button type="button" onClick={() => setModalEditar(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Nombre completo</label>
                <input type="text" required value={formEditar.nombre} onChange={e => setFormEditar({ ...formEditar, nombre: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
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
                <p className="text-xs font-semibold text-gray-600 mb-2">Ciclo actual</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Fecha inicio</label>
                    <input type="date" value={formEditar.fecha_inicio} onChange={e => setFormEditar({ ...formEditar, fecha_inicio: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Clases pagadas</label>
                    <input type="number" value={formEditar.clases_pagadas} onChange={e => setFormEditar({ ...formEditar, clases_pagadas: Number(e.target.value) })} className="w-full border rounded-lg p-2 text-sm mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-xs text-gray-500">Monto Bs</label>
                    <input type="number" value={formEditar.monto} onChange={e => setFormEditar({ ...formEditar, monto: Number(e.target.value) })} className="w-full border rounded-lg p-2 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Metodo pago</label>
                    <select value={formEditar.metodo_pago} onChange={e => setFormEditar({ ...formEditar, metodo_pago: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1">
                      <option value="efectivo">Efectivo</option>
                      <option value="qr">QR</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setModalEditar(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
              <button type="submit" className="flex-1 bg-pink-600 text-white rounded-lg py-2 text-sm hover:bg-pink-700">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}

      {modalNuevo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <form onSubmit={crearParticipante} className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Inscribir participante</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Nombre completo" required value={nuevoForm.nombre} onChange={e => setNuevoForm({ ...nuevoForm, nombre: e.target.value })} className="w-full border rounded-lg p-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Carnet" value={nuevoForm.carnet} onChange={e => setNuevoForm({ ...nuevoForm, carnet: e.target.value })} className="border rounded-lg p-2 text-sm" />
                <input type="text" placeholder="Telefono" value={nuevoForm.telefono} onChange={e => setNuevoForm({ ...nuevoForm, telefono: e.target.value })} className="border rounded-lg p-2 text-sm" />
              </div>
              <input type="date" value={nuevoForm.fecha_nac} onChange={e => setNuevoForm({ ...nuevoForm, fecha_nac: e.target.value })} className="w-full border rounded-lg p-2 text-sm" />
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Primer ciclo</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" required value={nuevoForm.fecha_inicio} onChange={e => setNuevoForm({ ...nuevoForm, fecha_inicio: e.target.value })} className="border rounded-lg p-2 text-sm" />
                  <div className="border rounded-lg p-2 text-sm bg-gray-50 text-gray-500 flex flex-col">
  <span className="text-xs text-gray-400">Clases</span>
  <span className="font-medium">{nuevoForm.clases_pagadas} clases</span>
  <span className="text-[10px] text-gray-400">{horariosZumba.filter(h => h.activo).length} dias x 4 sem</span>
</div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input type="number" placeholder="Monto Bs" required value={nuevoForm.monto} onChange={e => setNuevoForm({ ...nuevoForm, monto: Number(e.target.value) })} className="border rounded-lg p-2 text-sm" />
                  <select value={nuevoForm.metodo_pago} onChange={e => setNuevoForm({ ...nuevoForm, metodo_pago: e.target.value })} className="border rounded-lg p-2 text-sm">
                    <option value="efectivo">Efectivo</option>
                    <option value="qr">QR</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setModalNuevo(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-lg py-2 text-sm">Inscribir</button>
            </div>
          </form>
        </div>
      )}

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
  <label className="text-xs text-gray-500">Clases pagadas</label>
  <input
    name="clases_pagadas"
    type="number"
    value={calcularClasesAutomatico()}
    readOnly
    className="w-full border rounded-lg p-2 text-sm bg-gray-50 text-gray-500"
  />
  <p className="text-[10px] text-gray-400 mt-1">
    Calculado automaticamente: {horariosZumba.filter(h => h.activo).length} dias x 4 semanas
  </p>
</div>
              <div>
                <label className="text-xs text-gray-500">Monto Bs</label>
                <input name="monto" type="number" defaultValue={400} required className="w-full border rounded-lg p-2 text-sm" />
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
              <button type="submit" className="flex-1 bg-pink-600 text-white rounded-lg py-2 text-sm">Confirmar</button>
            </div>
          </form>
        </div>
      )}

      {modalAsistencia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{modalAsistencia.nombre}</h3>
                <p className="text-xs text-gray-500">
                  Ciclo {modalAsistencia.numero_ciclo} — {modalAsistencia.clases_pagadas} clases pagadas
                </p>
              </div>
              <button onClick={() => { setModalAsistencia(null); setAsistenciaDetalle([]); }} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>

            <div className="p-4">
              {(() => {
                const sesiones = calcularSesionesZumba(
                  modalAsistencia.fecha_inicio,
                  modalAsistencia.clases_pagadas,
                  asistenciaDetalle
                );
               
                const conteo = { asistio: 0, falta: 0, permiso: 0 };
                asistenciaDetalle.forEach(a => {
                  if (a.estado === 'asistio') conteo.asistio++;
                  else if (a.estado === 'falta') conteo.falta++;
                  else if (a.estado === 'permiso') conteo.permiso++;
                });

                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                      <div className="bg-emerald-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Asistio</p>
                        <p className="text-lg font-bold text-emerald-600">{conteo.asistio}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Falta</p>
                        <p className="text-lg font-bold text-red-600">{conteo.falta}</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Permiso</p>
                        <p className="text-lg font-bold text-yellow-600">{conteo.permiso}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {sesiones.map((fechaSesion, idx) => {
                        const fechaStr = fechaSesion.toISOString().split('T')[0];
                        const registro = asistenciaDetalle.find(a => a.fecha?.split('T')[0] === fechaStr);
                        const esHoy = fechaStr === hoy;
                        const esPasada = fechaSesion <= new Date();

                        const colorActivo =
                          registro?.estado === 'asistio'    ? 'bg-emerald-500 text-white' :
                          registro?.estado === 'falta'      ? 'bg-red-400 text-white' :
                          registro?.estado === 'permiso'    ? 'bg-yellow-400 text-white' :
                          registro?.estado === 'suspendida' ? 'bg-gray-400 text-white' : '';

                        return (
                          <div key={idx} className={`border rounded-xl p-2 text-center ${esHoy ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'}`}>
                            <p className="text-[10px] font-bold text-gray-500 mb-1">S{idx + 1}</p>
                            <p className="text-[10px] text-gray-400 mb-2">
                              {fechaSesion.toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                            </p>
                            {(esHoy || esPasada) ? (
                              <div className="relative group">
                                <div className={`w-full py-1.5 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer ${
                                  registro ? `${colorActivo}` : 'border border-dashed border-gray-300 text-gray-300'
                                }`}>
                                  {registro?.estado === 'asistio'    ? '✓' :
                                   registro?.estado === 'falta'      ? '✗' :
                                   registro?.estado === 'permiso'    ? 'P' :
                                   registro?.estado === 'suspendida' ? '-' : '+'}
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center z-20">
                                  <div className="bg-white border rounded-lg shadow-lg p-1 flex gap-1">
                                    {[
                                      { estado: 'asistio',    icon: '✓', cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                                      { estado: 'falta',      icon: '✗', cls: 'bg-red-100 text-red-700 hover:bg-red-200' },
                                      { estado: 'permiso',    icon: 'P', cls: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                                      { estado: 'suspendida', icon: '-', cls: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                                    ].map(({ estado, icon, cls }) => (
                                      <button
                                        key={estado}
                                        onClick={() => registrarAsistencia(estado, fechaStr)}
                                        title={estado}
                                        className={`w-7 h-7 rounded text-xs font-bold ${cls} ${registro?.estado === estado ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                                      >
                                        {icon}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="w-2 h-2 bg-white border-r border-b rotate-45 -mt-1"></div>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full py-1.5 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                                <span className="text-[10px] text-gray-200">·</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => { setModalAsistencia(null); setAsistenciaDetalle([]); }}
                className="w-full border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}