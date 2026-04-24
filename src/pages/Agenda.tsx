import { useState, useEffect } from 'react';
import { getCitas, actualizarCitaService } from '../services/citas.service';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

export default function Agenda() {
  const [citas, setCitas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [inicioSemana, setInicioSemana] = useState(() => {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diff));
    lunes.setHours(0, 0, 0, 0);
    return lunes;
  });
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);
  const [filtroArea, setFiltroArea] = useState<string>('todas');

  useEffect(() => {
    cargarCitas();
  }, []);

  async function cargarCitas() {
    try {
      setCargando(true);
      const data = await getCitas();
      setCitas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  function cambiarSemana(dias: number) {
    const nueva = new Date(inicioSemana);
    nueva.setDate(nueva.getDate() + dias);
    setInicioSemana(nueva);
  }

  function irAHoy() {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diff));
    lunes.setHours(0, 0, 0, 0);
    setInicioSemana(lunes);
  }

  function getFechaDia(offset: number): Date {
    const fecha = new Date(inicioSemana);
    fecha.setDate(fecha.getDate() + offset);
    return fecha;
  }

  function citasDelDia(offset: number) {
    const fecha = getFechaDia(offset);
    const fechaStr = fecha.toISOString().split('T')[0];
    return citas
      .filter(c => {
        const coincideFecha = c.fecha.startsWith(fechaStr);
        const coincideArea = filtroArea === 'todas' || c.area_nombre === filtroArea;
        return coincideFecha && coincideArea;
      })
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  async function marcarAsistencia(id: number, asistio: boolean) {
    try {
      await actualizarCitaService(id, { asistio });
      await cargarCitas();
      if (citaSeleccionada?.id === id) {
        setCitaSeleccionada({ ...citaSeleccionada, asistio });
      }
    } catch (err) {
      console.error(err);
    }
  }

  const finSemana = new Date(inicioSemana);
  finSemana.setDate(finSemana.getDate() + 6);

  const rangoLabel = `${inicioSemana.toLocaleDateString('es', { day: 'numeric', month: 'short' })} - ${finSemana.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📅 Agenda</h1>
          <p className="text-sm text-gray-500 capitalize">{rangoLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => cambiarSemana(-7)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <button
            onClick={irAHoy}
            className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
          >
            Hoy
          </button>
          <button
            onClick={() => cambiarSemana(7)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Siguiente →
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltroArea('todas')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            filtroArea === 'todas'
              ? 'bg-gray-800 text-white'
              : 'bg-white border border-gray-300 text-gray-600'
          }`}
        >
          Todas las areas
        </button>
        <button
          onClick={() => setFiltroArea('Psicologia')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            filtroArea === 'Psicologia'
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-gray-300 text-gray-600'
          }`}
        >
          🧠 Psicologia
        </button>
        <button
          onClick={() => setFiltroArea('Fisioterapia')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            filtroArea === 'Fisioterapia'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-600'
          }`}
        >
          🦵 Fisioterapia
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-12 text-gray-500">Cargando agenda...</div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {DIAS_SEMANA.map((dia, idx) => {
            const fecha = getFechaDia(idx);
            const citasDia = citasDelDia(idx);
            const esHoy = fecha.toDateString() === new Date().toDateString();

            return (
              <div
                key={dia}
                className={`bg-white rounded-xl border ${esHoy ? 'border-emerald-500 border-2' : 'border-gray-200'} overflow-hidden`}
              >
                <div className={`p-2 text-center ${esHoy ? 'bg-emerald-50' : 'bg-gray-50'} border-b`}>
                  <p className="text-xs font-semibold text-gray-600">{dia}</p>
                  <p className={`text-lg font-bold ${esHoy ? 'text-emerald-600' : 'text-gray-800'}`}>
                    {fecha.getDate()}
                  </p>
                </div>
                <div className="p-1.5 space-y-1 min-h-[200px] max-h-[400px] overflow-y-auto">
                  {citasDia.length === 0 ? (
                    <p className="text-[10px] text-gray-300 text-center pt-2">Sin citas</p>
                  ) : (
                    citasDia.map(cita => (
                      <div
                        key={cita.id}
                        onClick={() => setCitaSeleccionada(cita)}
                        className={`p-1.5 rounded-lg text-[10px] cursor-pointer border-l-4 ${
                          cita.estado === 'confirmada'
                            ? 'bg-emerald-50 border-emerald-500'
                            : cita.estado === 'pendiente'
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-red-50 border-red-500'
                        }`}
                      >
                        <div className="font-bold text-gray-700">
                          {cita.hora.slice(0, 5)}
                        </div>
                        <div className="text-gray-800 truncate font-medium">
                          {cita.paciente_nombre}
                        </div>
                        <div className="text-gray-500 truncate">
                          {cita.area_emoji} {cita.area_nombre}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {citaSeleccionada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4"
          onClick={() => setCitaSeleccionada(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {citaSeleccionada.paciente_nombre}
                </h3>
                <p className="text-xs text-gray-500">
                  {new Date(citaSeleccionada.fecha).toLocaleDateString('es')} - {citaSeleccionada.hora.slice(0,5)}
                </p>
              </div>
              <button
                onClick={() => setCitaSeleccionada(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                x
              </button>
            </div>

            <div className="space-y-2 text-sm">
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
              <div className="flex justify-between">
                <span className="text-gray-500">Sesion:</span>
                <span className="font-medium">{citaSeleccionada.sesion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado:</span>
                <span className="font-medium capitalize">{citaSeleccionada.estado}</span>
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
            </div>

            {citaSeleccionada.estado === 'confirmada' && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">Marcar asistencia:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => marcarAsistencia(citaSeleccionada.id, true)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                      citaSeleccionada.asistio === true
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    ✓ Asistio
                  </button>
                  <button
                    onClick={() => marcarAsistencia(citaSeleccionada.id, false)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                      citaSeleccionada.asistio === false
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    x No asistio
                  </button>
                </div>
              </div>
            )}

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