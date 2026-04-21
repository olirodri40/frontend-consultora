import { useState } from 'react';
import StatCard from '../components/ui/StatCard';
import CitaRow from '../components/ui/CitaRow';

type Cita = {
  id: number;
  nombre: string;
  edad?: number;
  telefono: string;
  fecha: string;
  hora: string;
  area: string;
  profesionalId: number;
  modalidad: 'presencial' | 'virtual';
  sesion: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  nombreCompleto?: string;
  carnet?: string;
  monto?: number;
  metodoPago?: 'efectivo' | 'qr' | 'transferencia';
  estadoPago?: string;
  fechaPago?: string;
  asistio?: boolean;
  servicioNombre?: string;
};

const citasEjemplo: Cita[] = [
  {
    id: 1,
    nombre: 'Veronica Mancilla',
    nombreCompleto: 'Veronica Mancilla',
    edad: 31,
    telefono: '69756336',
    fecha: new Date().toISOString().split('T')[0],
    hora: '10:00',
    area: 'psicologia',
    profesionalId: 1,
    modalidad: 'presencial',
    sesion: '1ra',
    estado: 'confirmada',
    carnet: '1234567',
    monto: 200,
    metodoPago: 'efectivo',
    estadoPago: 'pagado completo',
    fechaPago: new Date().toISOString().split('T')[0],
    asistio: true,
  },
  {
    id: 2,
    nombre: 'Carlos Lopez',
    nombreCompleto: 'Carlos Lopez',
    edad: 45,
    telefono: '72345678',
    fecha: new Date().toISOString().split('T')[0],
    hora: '11:00',
    area: 'fisioterapia',
    profesionalId: 2,
    modalidad: 'presencial',
    sesion: '2da',
    estado: 'confirmada',
    carnet: '7654321',
    monto: 150,
    metodoPago: 'qr',
    estadoPago: 'pagado completo',
    fechaPago: new Date().toISOString().split('T')[0],
    servicioNombre: 'Masajes',
  },
  {
    id: 3,
    nombre: 'Gina Amaya',
    telefono: '77112233',
    fecha: new Date().toISOString().split('T')[0],
    hora: '14:00',
    area: 'psicologia',
    profesionalId: 1,
    modalidad: 'virtual',
    sesion: '1ra',
    estado: 'pendiente',
  },
];

export default function Dashboard() {
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

  const fechaLabel = new Date().toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const citasHoy = citasEjemplo.filter(c => c.estado === 'confirmada');
  const citasPendientes = citasEjemplo.filter(c => c.estado === 'pendiente');

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Panel principal</h1>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{fechaLabel}</p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors">
          + Nueva reserva
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard emoji="⏳" label="Citas pendientes"  valor={citasPendientes.length} color="yellow"  />
        <StatCard emoji="👥" label="Pacientes activos" valor={8}                      color="emerald" />
        <StatCard emoji="📅" label="Citas hoy"         valor={citasHoy.length}        color="blue"    />
        <StatCard emoji="💃" label="Por renovar"       valor={2}                      color="purple"  />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">
              Citas confirmadas hoy
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
              : <p className="p-4 text-sm text-gray-400 text-center">Sin citas hoy</p>
            }
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="p-3 border-b border-yellow-200 flex items-center justify-between">
            <h3 className="font-semibold text-yellow-800 text-sm">
              Citas pendientes
            </h3>
            <span className="text-xs text-yellow-600">{citasPendientes.length} pendientes</span>
          </div>
          <div className="p-3 space-y-2">
            {citasPendientes.length > 0
              ? citasPendientes.map(cita => (
                  <div key={cita.id} className="flex justify-between items-center p-2 bg-white rounded-lg border gap-2">
                    <div className="min-w-0">
                      <span className="font-medium text-sm">{cita.nombre}</span>
                      <span className="text-xs text-gray-500 ml-2">{cita.hora}</span>
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
                {citaSeleccionada.nombreCompleto || citaSeleccionada.nombre}
              </h3>
              <button
                onClick={() => setCitaSeleccionada(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                x
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Hora:</span>
                <span className="font-medium">{citaSeleccionada.hora}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Area:</span>
                <span className="font-medium">
                  {citaSeleccionada.area === 'psicologia' ? 'Psicologia' : 'Fisioterapia'}
                </span>
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
              {citaSeleccionada.telefono && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Telefono:</span>
                  <span className="font-medium">{citaSeleccionada.telefono}</span>
                </div>
              )}
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