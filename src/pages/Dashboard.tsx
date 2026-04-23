import { useState, useEffect } from 'react';
import StatCard from '../components/ui/StatCard';
import CitaRow from '../components/ui/CitaRow';
import { getCitas } from '../services/citas.service';

export default function Dashboard() {
  const [citas, setCitas] = useState<CitaAPI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
 const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);

  const hoy = new Date().toISOString().split('T')[0];

  const fechaLabel = new Date().toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Cargar citas al montar el componente
  useEffect(() => {
    cargarCitas();
  }, []);

  async function cargarCitas() {
    try {
      setCargando(true);
      const data = await getCitas();
      setCitas(data);
    } catch (err) {
      setError('Error al cargar las citas');
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  // Filtrar citas
  const citasHoy      = citas.filter(c => c.fecha.startsWith(hoy) && c.estado === 'confirmada');
  const citasManana   = citas.filter(c => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return c.fecha.startsWith(manana.toISOString().split('T')[0]) && c.estado === 'confirmada';
  });
  const citasPendientes = citas.filter(c => c.estado === 'pendiente');

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={cargarCitas}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📊 Panel principal</h1>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{fechaLabel}</p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors">
          + Nueva reserva
        </button>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard emoji="⏳" label="Citas pendientes"  valor={citasPendientes.length} color="yellow"  />
        <StatCard emoji="👥" label="Pacientes activos" valor={new Set(citas.map(c => c.patient_id)).size} color="emerald" />
        <StatCard emoji="📅" label="Citas hoy"         valor={citasHoy.length}        color="blue"    />
        <StatCard emoji="📆" label="Citas manana"      valor={citasManana.length}      color="purple"  />
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Citas hoy */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">
              Citas confirmadas — <span className="text-emerald-600">Hoy</span>
            </h3>
            <span className="text-xs text-gray-400">{citasHoy.length} citas</span>
          </div>
          <div className="divide-y">
            {citasHoy.length > 0
              ? citasHoy
                  .sort((a, b) => a.hora.localeCompare(b.hora))
                  .map(cita => (
                    <CitaRow
                      key={cita.id}
                      cita={cita}
                      onClick={setCitaSeleccionada}
                    />
                  ))
              : <p className="p-4 text-sm text-gray-400 text-center">Sin citas confirmadas hoy</p>
            }
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="p-3 border-b border-yellow-200 flex items-center justify-between">
            <h3 className="font-semibold text-yellow-800 text-sm">Citas pendientes</h3>
            <span className="text-xs text-yellow-600">{citasPendientes.length} pendientes</span>
          </div>
          <div className="p-3 space-y-2">
            {citasPendientes.length > 0
              ? citasPendientes.map(cita => (
                  <div key={cita.id} className="flex justify-between items-center p-2 bg-white rounded-lg border gap-2">
                    <div className="min-w-0">
                      <span className="font-medium text-sm">{cita.paciente_nombre}</span>
                      <span className="text-xs text-gray-500 ml-2">{cita.hora.slice(0,5)}</span>
                    </div>
                    <button className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-lg shrink-0 hover:bg-yellow-600">
                      Completar
                    </button>
                  </div>
                ))
              : <p className="text-gray-400 text-sm text-center py-2">Sin pendientes</p>
            }
          </div>
        </div>

      </div>

      {/* Modal detalle */}
      {citaSeleccionada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          onClick={() => setCitaSeleccionada(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {citaSeleccionada.paciente_nombre}
              </h3>
              <button
                onClick={() => setCitaSeleccionada(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                x
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Hora:</span>
                <span className="font-medium">{citaSeleccionada.hora.slice(0,5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Area:</span>
                <span className="font-medium">
                  {citaSeleccionada.area_emoji} {citaSeleccionada.area_nombre}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Profesional:</span>
                <span className="font-medium">{citaSeleccionada.profesional_nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Modalidad:</span>
                <span className="font-medium capitalize">{citaSeleccionada.modalidad}</span>
              </div>
              {citaSeleccionada.monto && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Monto:</span>
                  <span className="font-medium text-green-600">Bs {citaSeleccionada.monto}</span>
                </div>
              )}
              {citaSeleccionada.paciente_telefono && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Telefono:</span>
                  <span className="font-medium">{citaSeleccionada.paciente_telefono}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Estado:</span>
                <span className={`font-medium capitalize ${
                  citaSeleccionada.asistio === true  ? 'text-green-600' :
                  citaSeleccionada.asistio === false ? 'text-red-600'   : 'text-gray-600'
                }`}>
                  {citaSeleccionada.asistio === true  ? 'Asistio' :
                   citaSeleccionada.asistio === false ? 'No asistio' : 'Pendiente'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setCitaSeleccionada(null)}
              className="w-full mt-4 px-4 py-2 border rounded-lg text-gray-600 text-sm hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}