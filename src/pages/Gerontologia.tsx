import { useState, useEffect } from 'react';
import {
  getActividadesGeronto,
  getParticipantesGeronto,
  crearParticipanteGeronto,
  renovarCicloGeronto,
  marcarAsistenciaGeronto,
} from '../services/geronto.service';

export default function Gerontologia() {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalRenovar, setModalRenovar] = useState<any>(null);
  const [modalAsistencia, setModalAsistencia] = useState<any>(null);
  const [actividadesSeleccionadas, setActividadesSeleccionadas] = useState<number[]>([]);

  const [nuevoForm, setNuevoForm] = useState({
    nombre: '',
    carnet: '',
    telefono: '',
    fecha_nac: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    monto: 0,
    metodo_pago: 'efectivo',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

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

  async function crearParticipante(e: React.FormEvent) {
    e.preventDefault();
    if (actividadesSeleccionadas.length === 0) {
      alert('Selecciona al menos una actividad');
      return;
    }
    try {
      await crearParticipanteGeronto({
        ...nuevoForm,
        actividades_ids: actividadesSeleccionadas,
      });
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

  async function registrarAsistencia(actividadId: number, estado: string) {
    try {
      await marcarAsistenciaGeronto({
        participant_id: modalAsistencia.id,
        cycle_id: modalAsistencia.ciclo_id,
        activity_id: actividadId,
        fecha: new Date().toISOString().split('T')[0],
        estado,
      });
      await cargarDatos();
    } catch (err) {
      console.error(err);
    }
  }

  const actividadesPorDia = actividades.reduce((acc: any, act: any) => {
    if (!acc[act.dia]) acc[act.dia] = [];
    acc[act.dia].push(act);
    return acc;
  }, {});

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
          {participantes.map(p => (
            <div key={p.id} className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">{p.nombre}</h3>
                  <p className="text-xs text-gray-500">
                    {p.carnet && `CI: ${p.carnet}`} {p.telefono && `- ${p.telefono}`}
                  </p>
                </div>
                {p.ciclo_id ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    Ciclo {p.numero_ciclo}
                  </span>
                ) : (
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    Sin ciclo
                  </span>
                )}
              </div>

              {p.actividades_ids && p.actividades_ids.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {p.actividades_ids.map((actId: number) => {
                    const act = actividades.find(a => a.id === actId);
                    return act ? (
                      <span key={actId} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {act.emoji} {act.nombre.split(' ')[0]}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {p.monto && (
                <p className="text-xs text-gray-500 mb-3">
                  Pago: <span className="text-green-600 font-medium">Bs {p.monto}</span>
                  {p.metodo_pago && ` - ${p.metodo_pago}`}
                </p>
              )}

              <div className="flex gap-2">
                {p.ciclo_id ? (
                  <>
                    <button
                      onClick={() => setModalAsistencia(p)}
                      className="flex-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs hover:bg-emerald-200"
                    >
                      Marcar asistencia
                    </button>
                    <button
                      onClick={() => setModalRenovar(p)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
                    >
                      Renovar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setModalRenovar(p)}
                    className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs"
                  >
                    + Iniciar ciclo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalNuevo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <form
            onSubmit={crearParticipante}
            className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold mb-4">Inscribir participante</h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre completo"
                required
                value={nuevoForm.nombre}
                onChange={e => setNuevoForm({ ...nuevoForm, nombre: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Carnet"
                  value={nuevoForm.carnet}
                  onChange={e => setNuevoForm({ ...nuevoForm, carnet: e.target.value })}
                  className="border rounded-lg p-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Telefono"
                  value={nuevoForm.telefono}
                  onChange={e => setNuevoForm({ ...nuevoForm, telefono: e.target.value })}
                  className="border rounded-lg p-2 text-sm"
                />
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Seleccionar actividades
                </p>
                <div className="space-y-2">
                  {actividades.map(act => (
                    <label key={act.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={actividadesSeleccionadas.includes(act.id)}
                        onChange={() => toggleActividad(act.id)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {act.emoji} {act.nombre}
                        <span className="text-xs text-gray-400 ml-2">{act.dia}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Pago</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    value={nuevoForm.fecha_inicio}
                    onChange={e => setNuevoForm({ ...nuevoForm, fecha_inicio: e.target.value })}
                    className="border rounded-lg p-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Monto Bs"
                    required
                    value={nuevoForm.monto}
                    onChange={e => setNuevoForm({ ...nuevoForm, monto: Number(e.target.value) })}
                    className="border rounded-lg p-2 text-sm"
                  />
                </div>
                <select
                  value={nuevoForm.metodo_pago}
                  onChange={e => setNuevoForm({ ...nuevoForm, metodo_pago: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm mt-2"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="qr">QR</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                className="flex-1 border rounded-lg py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm"
              >
                Inscribir
              </button>
            </div>
          </form>
        </div>
      )}

      {modalRenovar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <form
            onSubmit={renovarCiclo}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold mb-1">Nuevo ciclo</h3>
            <p className="text-sm text-gray-500 mb-4">{modalRenovar.nombre}</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Fecha inicio</label>
                <input
                  name="fecha_inicio"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Monto Bs</label>
                <input
                  name="monto"
                  type="number"
                  defaultValue={modalRenovar.monto || 200}
                  required
                  className="w-full border rounded-lg p-2 text-sm"
                />
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
              <button
                type="button"
                onClick={() => setModalRenovar(null)}
                className="flex-1 border rounded-lg py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm"
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      )}

      {modalAsistencia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-1">Marcar asistencia</h3>
            <p className="text-sm text-gray-500 mb-4">
              {modalAsistencia.nombre} - {new Date().toLocaleDateString('es')}
            </p>

            <div className="space-y-3">
              {(modalAsistencia.actividades_ids || []).map((actId: number) => {
                const act = actividades.find(a => a.id === actId);
                if (!act) return null;
                return (
                  <div key={actId} className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">
                      {act.emoji} {act.nombre}
                    </p>
                    <div className="grid grid-cols-4 gap-1">
                      {['asistio', 'falta', 'permiso', 'suspendida'].map(estado => (
                        <button
                          key={estado}
                          onClick={() => registrarAsistencia(actId, estado)}
                          className={`py-1.5 rounded text-[10px] font-medium ${
                            estado === 'asistio'    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                            estado === 'falta'      ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                            estado === 'permiso'    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                            'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {estado}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setModalAsistencia(null)}
              className="w-full mt-4 border rounded-lg py-2 text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}