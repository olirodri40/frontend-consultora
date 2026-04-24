import { useState, useEffect } from 'react';
import {
  getParticipantesZumba,
  crearParticipanteZumba,
  renovarCicloZumba,
  marcarAsistenciaZumba,
} from '../services/zumba.service';

export default function Zumba() {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalRenovar, setModalRenovar] = useState<any>(null);
  const [modalAsistencia, setModalAsistencia] = useState<any>(null);

  const [nuevoForm, setNuevoForm] = useState({
    nombre: '',
    carnet: '',
    telefono: '',
    fecha_nac: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    clases_pagadas: 8,
    monto: 400,
    metodo_pago: 'efectivo',
  });

  useEffect(() => {
    cargarParticipantes();
  }, []);

  async function cargarParticipantes() {
    try {
      setCargando(true);
      const data = await getParticipantesZumba();
      setParticipantes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  async function crearParticipante(e: React.FormEvent) {
    e.preventDefault();
    try {
      await crearParticipanteZumba(nuevoForm);
      setModalNuevo(false);
      setNuevoForm({
        nombre: '',
        carnet: '',
        telefono: '',
        fecha_nac: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        clases_pagadas: 8,
        monto: 400,
        metodo_pago: 'efectivo',
      });
      await cargarParticipantes();
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
      await cargarParticipantes();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al renovar ciclo');
    }
  }

  async function registrarAsistencia(estado: string) {
    try {
      await marcarAsistenciaZumba({
        participant_id: modalAsistencia.id,
        cycle_id: modalAsistencia.ciclo_id,
        fecha: new Date().toISOString().split('T')[0],
        estado,
      });
      setModalAsistencia(null);
      await cargarParticipantes();
    } catch (err) {
      console.error(err);
      alert('Error al marcar asistencia');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">💃 Zumba</h1>
          <p className="text-sm text-gray-500">{participantes.length} participantes activos</p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Inscribir participante
        </button>
      </div>

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
                  {sinCiclo ? (
                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      Sin ciclo activo
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Ciclo {p.numero_ciclo}
                    </span>
                  )}
                </div>

                {!sinCiclo && (
                  <>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Clases: {asistidas} / {pagadas}</span>
                        <span>{Math.round(progreso)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pink-500 transition-all"
                          style={{ width: `${progreso}%` }}
                        />
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
                    <button
                      onClick={() => setModalRenovar(p)}
                      className="flex-1 px-3 py-2 bg-pink-600 text-white rounded-lg text-xs hover:bg-pink-700"
                    >
                      + Iniciar ciclo
                    </button>
                  ) : (
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
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalNuevo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <form
            onSubmit={crearParticipante}
            className="bg-white rounded-xl p-6 w-full max-w-md"
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
              <input
                type="date"
                value={nuevoForm.fecha_nac}
                onChange={e => setNuevoForm({ ...nuevoForm, fecha_nac: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm"
              />
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Primer ciclo</p>
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
                    placeholder="Clases"
                    value={nuevoForm.clases_pagadas}
                    onChange={e => setNuevoForm({ ...nuevoForm, clases_pagadas: Number(e.target.value) })}
                    className="border rounded-lg p-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="number"
                    placeholder="Monto Bs"
                    required
                    value={nuevoForm.monto}
                    onChange={e => setNuevoForm({ ...nuevoForm, monto: Number(e.target.value) })}
                    className="border rounded-lg p-2 text-sm"
                  />
                  <select
                    value={nuevoForm.metodo_pago}
                    onChange={e => setNuevoForm({ ...nuevoForm, metodo_pago: e.target.value })}
                    className="border rounded-lg p-2 text-sm"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="qr">QR</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-lg py-2 text-sm"
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
                <label className="text-xs text-gray-500">Clases pagadas</label>
                <input
                  name="clases_pagadas"
                  type="number"
                  defaultValue={8}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Monto Bs</label>
                <input
                  name="monto"
                  type="number"
                  defaultValue={400}
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
                className="flex-1 bg-pink-600 text-white rounded-lg py-2 text-sm"
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

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => registrarAsistencia('asistio')}
                className="p-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-sm font-medium"
              >
                ✓ Asistio
              </button>
              <button
                onClick={() => registrarAsistencia('falta')}
                className="p-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium"
              >
                x Falta
              </button>
              <button
                onClick={() => registrarAsistencia('permiso')}
                className="p-4 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm font-medium"
              >
                ~ Permiso
              </button>
              <button
                onClick={() => registrarAsistencia('suspendida')}
                className="p-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
              >
                - Suspendida
              </button>
            </div>

            <button
              onClick={() => setModalAsistencia(null)}
              className="w-full mt-4 border rounded-lg py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}