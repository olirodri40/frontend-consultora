import { useState, useEffect } from 'react';
import { getPacientes, getPacientePorId } from '../services/pacientes.service';

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [pacienteDetalle, setPacienteDetalle] = useState<any>(null);
  const [citasDetalle, setCitasDetalle] = useState<any[]>([]);

  useEffect(() => {
    cargarPacientes();
  }, []);

  async function cargarPacientes(termino?: string) {
    try {
      setCargando(true);
      const data = await getPacientes(termino);
      setPacientes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    cargarPacientes(busqueda);
  }

  async function verDetalle(id: number) {
    try {
      const data = await getPacientePorId(id);
      setPacienteDetalle(data.paciente);
      setCitasDetalle(data.citas);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800">👥 Pacientes</h1>
        <span className="text-sm text-gray-500">{pacientes.length} pacientes</span>
      </div>

      <form onSubmit={handleBuscar} className="mb-4 flex gap-2">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, carnet o telefono..."
          className="flex-1 border-2 border-gray-200 focus:border-emerald-500 rounded-lg p-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
        >
          Buscar
        </button>
        {busqueda && (
          <button
            type="button"
            onClick={() => { setBusqueda(''); cargarPacientes(); }}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
          >
            Limpiar
          </button>
        )}
      </form>

      {cargando ? (
        <div className="text-center py-12 text-gray-500">Cargando pacientes...</div>
      ) : pacientes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No se encontraron pacientes
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-600">Nombre</th>
                <th className="text-left p-3 font-semibold text-gray-600">Carnet</th>
                <th className="text-left p-3 font-semibold text-gray-600">Telefono</th>
                <th className="text-center p-3 font-semibold text-gray-600">Edad</th>
                <th className="text-center p-3 font-semibold text-gray-600">Citas</th>
                <th className="text-right p-3 font-semibold text-gray-600">Total Pagado</th>
                <th className="text-center p-3 font-semibold text-gray-600">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pacientes.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{p.nombre}</td>
                  <td className="p-3 text-gray-600">{p.carnet || '-'}</td>
                  <td className="p-3 text-gray-600">{p.telefono || '-'}</td>
                  <td className="p-3 text-center text-gray-600">{p.edad || '-'}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                      {p.total_citas}
                    </span>
                  </td>
                  <td className="p-3 text-right text-green-600 font-medium">
                    Bs {Number(p.total_pagado).toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => verDetalle(p.id)}
                      className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pacienteDetalle && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4"
          onClick={() => setPacienteDetalle(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {pacienteDetalle.nombre}
                </h3>
                <p className="text-sm text-gray-500">
                  Carnet: {pacienteDetalle.carnet || 'Sin carnet'}
                </p>
              </div>
              <button
                onClick={() => setPacienteDetalle(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                x
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Telefono</p>
                <p className="font-medium">{pacienteDetalle.telefono || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Edad</p>
                <p className="font-medium">{pacienteDetalle.edad || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Total citas</p>
                <p className="font-medium">{citasDetalle.length}</p>
              </div>
            </div>

            <h4 className="font-semibold text-gray-700 mb-2">Historial de citas</h4>
            {citasDetalle.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Sin citas registradas
              </p>
            ) : (
              <div className="space-y-2">
                {citasDetalle.map(c => (
                  <div key={c.id} className="border rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {new Date(c.fecha).toLocaleDateString('es')}
                        </span>
                        <span className="text-xs text-gray-400">{c.hora.slice(0,5)}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {c.area_emoji} {c.area_nombre}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Con {c.profesional_nombre} - {c.sesion}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        {c.monto ? `Bs ${c.monto}` : '-'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{c.estado}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}