// src/components/ui/ReservasPublicasPanel.tsx
// Bandeja de reservas hechas desde el sitio web público, pendientes de que
// recepción/administración les asigne un profesional y las confirme en la Agenda.
import { useState, useEffect, useCallback } from 'react';
import { Globe, X, Check, Loader2, UserCheck, Clock, Calendar, History, Trash2 } from 'lucide-react';
import api from '../../services/api';

type ReservaPublica = {
  id: number;
  fecha: string;
  hora: string;
  paciente_nombre: string;
  paciente_telefono: string;
  paciente_email: string | null;
  notas: string | null;
  servicio_id: number;
  servicio_nombre: string;
  costo: number | null;
  area_id: number;
  area_nombre: string;
  created_at: string;
  estado?: string;
  confirmado_at?: string | null;
  professional_id?: number | null;
  professional_nombre?: string | null;
};

type Candidato = { id: number; nombre: string; disponible: boolean };

function formatearFecha(fecha: string) {
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

export default function ReservasPublicasPanel() {
  const [abierto, setAbierto] = useState(false);
  const [pestana, setPestana] = useState<'pendientes' | 'historial'>('pendientes');
  const [reservas, setReservas] = useState<ReservaPublica[]>([]);
  const [historial, setHistorial] = useState<ReservaPublica[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [reservaEnConfirmacion, setReservaEnConfirmacion] = useState<ReservaPublica | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [cargandoCandidatos, setCargandoCandidatos] = useState(false);
  const [profesionalElegido, setProfesionalElegido] = useState<number | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const cargarPendientes = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/reservas-publicas/pendientes');
      setReservas(data.reservas || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarHistorial = useCallback(async () => {
    setCargandoHistorial(true);
    try {
      const { data } = await api.get('/reservas-publicas/historial');
      setHistorial(data.reservas || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  useEffect(() => {
    cargarPendientes();
    const intervalo = setInterval(cargarPendientes, 60000);
    return () => clearInterval(intervalo);
  }, [cargarPendientes]);

  useEffect(() => {
    if (abierto && pestana === 'historial') cargarHistorial();
  }, [abierto, pestana, cargarHistorial]);

  async function eliminarDelHistorial(reserva: ReservaPublica) {
    if (!confirm(`¿Eliminar del historial la reserva de ${reserva.paciente_nombre}? Esto no afecta ninguna cita ya creada, solo borra este registro.`)) return;
    try {
      await api.delete(`/reservas-publicas/${reserva.id}`);
      cargarHistorial();
    } catch (err: any) {
      alert(err?.response?.data?.mensaje || 'No se pudo eliminar');
    }
  }

  async function abrirConfirmacion(reserva: ReservaPublica) {
    setReservaEnConfirmacion(reserva);
    setProfesionalElegido(null);
    setError('');
    setCargandoCandidatos(true);
    try {
      const { data } = await api.get(`/reservas-publicas/${reserva.id}/candidatos`);
      setCandidatos(data.candidatos || []);
    } catch (err) {
      console.error(err);
      setCandidatos([]);
    } finally {
      setCargandoCandidatos(false);
    }
  }

  async function confirmar() {
    if (!reservaEnConfirmacion || !profesionalElegido) return;
    setProcesando(true);
    setError('');
    try {
      await api.put(`/reservas-publicas/${reservaEnConfirmacion.id}/confirmar`, {
        professional_id: profesionalElegido,
      });
      setReservaEnConfirmacion(null);
      cargarPendientes();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje || 'No se pudo confirmar la reserva');
    } finally {
      setProcesando(false);
    }
  }

  async function rechazar(reserva: ReservaPublica) {
    if (!confirm(`¿Rechazar la reserva de ${reserva.paciente_nombre}?`)) return;
    try {
      await api.put(`/reservas-publicas/${reserva.id}/rechazar`);
      cargarPendientes();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="relative flex items-center gap-2 bg-white border border-gray-200 hover:border-[#A000D1] text-sm font-medium text-gray-700 hover:text-[#A000D1] rounded-xl px-3.5 py-2 transition-all"
      >
        <Globe size={16} />
        Reservas del sitio web
        {reservas.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {reservas.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setAbierto(false)}>
          <div
            className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Globe size={18} className="text-[#A000D1]" /> Reservas del sitio web
              </h3>
              <button
                onClick={() => setAbierto(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-2 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
              <button
                onClick={() => setPestana('pendientes')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pestana === 'pendientes' ? 'bg-white text-[#A000D1] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setPestana('historial')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  pestana === 'historial' ? 'bg-white text-[#A000D1] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <History size={12} /> Historial
              </button>
            </div>

            {pestana === 'pendientes' ? (
              cargando ? (
              <div className="flex justify-center py-10 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : reservas.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No hay reservas pendientes por confirmar.</p>
            ) : (
              <div className="space-y-3">
                {reservas.map((r) => (
                  <div key={r.id} className="border border-gray-200 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800 text-sm">{r.paciente_nombre}</span>
                      <span className="text-[10px] bg-violet-50 text-[#A000D1] px-2 py-0.5 rounded-full font-medium">
                        {r.area_nombre}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{r.servicio_nombre}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {formatearFecha(r.fecha)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {r.hora.slice(0, 5)}
                      </span>
                      <span>{r.paciente_telefono}</span>
                    </div>
                    {r.notas && <p className="text-[11px] text-gray-400 mt-1 italic">"{r.notas}"</p>}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => abrirConfirmacion(r)}
                        className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] text-white text-xs font-semibold rounded-lg py-2 flex items-center justify-center gap-1.5"
                      >
                        <UserCheck size={13} /> Asignar y confirmar
                      </button>
                      <button
                        onClick={() => rechazar(r)}
                        className="px-3 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-lg py-2"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )
            ) : cargandoHistorial ? (
              <div className="flex justify-center py-10 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : historial.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Todavía no hay reservas resueltas (confirmadas o rechazadas).</p>
            ) : (
              <div className="space-y-3">
                {historial.map((r) => (
                  <div key={r.id} className="border border-gray-200 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800 text-sm">{r.paciente_nombre}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        r.estado === 'confirmada' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {r.estado === 'confirmada' ? 'Confirmada' : 'Rechazada'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{r.servicio_nombre} · {r.area_nombre}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {formatearFecha(r.fecha)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {r.hora.slice(0, 5)}
                      </span>
                    </div>
                    {r.professional_nombre && (
                      <p className="text-[11px] text-gray-400 mt-1">Profesional: {r.professional_nombre}</p>
                    )}
                    <button
                      onClick={() => eliminarDelHistorial(r)}
                      className="w-full mt-3 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 text-xs font-semibold rounded-lg py-2 transition-all"
                    >
                      <Trash2 size={12} /> Eliminar del historial
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {reservaEnConfirmacion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-800">Asignar profesional</h4>
              <button
                onClick={() => setReservaEnConfirmacion(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {reservaEnConfirmacion.servicio_nombre} — {formatearFecha(reservaEnConfirmacion.fecha)} a las{' '}
              {reservaEnConfirmacion.hora.slice(0, 5)}
            </p>

            {cargandoCandidatos ? (
              <div className="flex justify-center py-6 text-gray-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : candidatos.length === 0 ? (
              <p className="text-xs text-amber-600 py-3">
                No hay profesionales disponibles para ese horario. Verifica su horario en Admin.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {candidatos.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer ${
                      !c.disponible
                        ? 'opacity-40 cursor-not-allowed border-gray-100'
                        : profesionalElegido === c.id
                        ? 'border-[#A000D1] bg-violet-50'
                        : 'border-gray-200 hover:border-violet-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="profesional"
                      disabled={!c.disponible}
                      checked={profesionalElegido === c.id}
                      onChange={() => setProfesionalElegido(c.id)}
                    />
                    {c.nombre}
                    {!c.disponible && <span className="text-[10px] text-red-400 ml-auto">Ya ocupado</span>}
                  </label>
                ))}
              </div>
            )}

            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

            <button
              onClick={confirmar}
              disabled={!profesionalElegido || procesando}
              className="w-full mt-4 bg-[#A000D1] hover:bg-[#8800b3] disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {procesando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Confirmar y agendar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
