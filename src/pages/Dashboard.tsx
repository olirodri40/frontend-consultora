import { useState, useEffect } from 'react';
import { getDashboardData, getProgresoTemporalData } from '../services/reportes.service';
import { actualizarCitaService } from '../services/citas.service';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle,
  Clock, Users, DollarSign, Activity, Dumbbell, HeartHandshake,
  Bell, User, FileText, Award, MapPin, Music, Heart,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Tarjeta de área — tooltip + carrusel LOCAL
// ─────────────────────────────────────────────
interface AreaCardProps {
  area: {
    area_id: string;
    area_nombre: string;
    area_emoji: string;
    periodos: {
      label: string;
      orden: number;
      total_pacientes: number;
      total_sesiones: number;
      ingresos: number;
    }[];
  };
}

function AreaCard({ area }: AreaCardProps) {
  const MAX_VISIBLE = 3;
  const [inicio, setInicio] = useState(0);

  const color = {
    text: 'text-[#A000D1]',
    border: 'border-[#efedf0]',
  };

  const totalPacientes = area.periodos.reduce((s, p) => s + p.total_pacientes, 0);
  const totalSesiones  = area.periodos.reduce((s, p) => s + p.total_sesiones, 0);
  const totalIngresos  = area.periodos.reduce((s, p) => s + p.ingresos, 0);

  // Ordenar periodos y armar datos del gráfico
  const chartDataCompleto = [...area.periodos]
    .sort((a, b) => a.orden - b.orden)
    .map((p, index) => ({
      id: `${area.area_id}-${index}-${p.label}`,
      label: p.label,
      Pacientes: Number(p.total_pacientes),
      Sesiones:  Number(p.total_sesiones),
      Ingresos:  Number(p.ingresos),
    }));

  // Slice visible del carrusel
  const chartData = chartDataCompleto.slice(inicio, inicio + MAX_VISIBLE);

  const puedeRetroceder = inicio > 0;
  const puedeAvanzar    = inicio + MAX_VISIBLE < chartDataCompleto.length;

  function retroceder() {
    if (puedeRetroceder) {
      setInicio(prev => Math.max(prev - 1, 0));
    }
  }

  function avanzar() {
    if (puedeAvanzar) {
      setInicio(prev => prev + 1);
    }
  }

  return (
    <div className={`
      rounded-3xl border ${color.border} bg-white p-5
      hover:shadow-xl transition-all duration-300
      h-full w-full min-h-[370px] flex flex-col
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{area.area_emoji}</span>
          <p className="text-sm font-bold text-gray-800">{area.area_nombre}</p>
        </div>
        <div className="flex gap-2 text-right">
          <div>
            <p className={`text-base font-bold ${color.text}`}>{totalPacientes}</p>
            <p className="text-[9px] text-gray-400">pacientes</p>
          </div>
          <div>
            <p className="text-base font-bold text-gray-600">{totalSesiones}</p>
            <p className="text-[9px] text-gray-400">sesiones</p>
          </div>
          <div>
            <p className="text-base font-bold text-green-600">Bs {totalIngresos.toFixed(0)}</p>
            <p className="text-[9px] text-gray-400">total</p>
          </div>
        </div>
      </div>

      {/* Gráfico — flex-1 para ocupar espacio disponible */}
      <div className="flex-1 flex flex-col">
        <div className="relative flex-1" style={{ minHeight: '208px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              barGap={4}
              barCategoryGap={28}
              tabIndex={-1}
              style={{ outline: 'none' }}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left"  hide />
              <YAxis yAxisId="right" hide />

              {/* ✅ Tooltip nativo de Recharts — detecta hover en toda la columna del mes */}
              <Tooltip
                cursor={{ fill: 'rgba(193,0,255,0.06)', radius: 8 }}
                isAnimationActive={false}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  // ✅ Leer cada valor directamente de su entrada en payload[]
                  // Recharts garantiza que payload[i].value corresponde al mes activo
                  const pacientes = payload.find(p => p.dataKey === 'Pacientes')?.value ?? 0;
                  const sesiones  = payload.find(p => p.dataKey === 'Sesiones')?.value  ?? 0;
                  const ingresos  = payload.find(p => p.dataKey === 'Ingresos')?.value  ?? 0;
                  return (
                    <div className="bg-white shadow-2xl border border-gray-100 rounded-2xl px-3 py-2 min-w-[130px]">
                      <p className="text-xs font-semibold text-gray-800 mb-2">{label}</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#C100FF]" />
                          <span className="text-[10px] text-gray-500">Pacientes: {pacientes}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#D946EF]" />
                          <span className="text-[10px] text-gray-500">Sesiones: {sesiones}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#A855F7]" />
                          <span className="text-[10px] text-gray-500">Ingresos: Bs {Number(ingresos).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              <Bar yAxisId="left"  dataKey="Pacientes" fill="#C100FF" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              <Bar yAxisId="left"  dataKey="Sesiones"  fill="#D946EF" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              <Bar yAxisId="right" dataKey="Ingresos"  fill="#A855F7" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda + flechas del carrusel */}
        <div className="relative mt-4 h-8 flex items-center justify-center">
          {/* Flecha izquierda */}
          <button
            onClick={retroceder}
            disabled={!puedeRetroceder}
            className="
              absolute left-0 top-1/2 -translate-y-1/2
              w-8 h-8 rounded-full border border-gray-200 bg-white
              flex items-center justify-center shadow-sm
              transition-all duration-200
              hover:bg-gray-50 hover:shadow-md
              disabled:opacity-30 disabled:cursor-not-allowed
            "
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>

          {/* Leyenda centrada */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#C100FF]" />
              <span className="text-[10px] text-gray-500">Pacientes</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#D946EF]" />
              <span className="text-[10px] text-gray-500">Sesiones</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#A855F7]" />
              <span className="text-[10px] text-gray-500">Ingresos</span>
            </div>
          </div>

          {/* Flecha derecha */}
          <button
            onClick={avanzar}
            disabled={!puedeAvanzar}
            className="
              absolute right-0 top-1/2 -translate-y-1/2
              w-8 h-8 rounded-full border border-gray-200 bg-white
              flex items-center justify-center shadow-sm
              transition-all duration-200
              hover:bg-gray-50 hover:shadow-md
              disabled:opacity-30 disabled:cursor-not-allowed
            "
          >
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Dashboard principal
// ─────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState<'hoy' | 'manana'>('hoy');
  const [progreso, setProgreso] = useState<any[]>([]);
  const [periodoProgreso, setPeriodoProgreso] = useState<'semanal' | 'mensual' | 'anual'>(() => {
    return (localStorage.getItem('dashboard_periodo') as 'semanal' | 'mensual' | 'anual') || 'mensual';
  });
  const [cargandoProgreso, setCargandoProgreso] = useState(false);

  const fechaLabel = new Date().toLocaleDateString('es', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  useEffect(() => { localStorage.setItem('dashboard_periodo', periodoProgreso); }, [periodoProgreso]);
  useEffect(() => { cargarDatos(); }, []);
  useEffect(() => { cargarProgreso(periodoProgreso); }, [periodoProgreso]);

  async function cargarDatos() {
    try {
      setCargando(true);
      const res = await getDashboardData();
      setData(res);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  }

  async function cargarProgreso(periodo: 'semanal' | 'mensual' | 'anual') {
    try {
      setCargandoProgreso(true);
      const res = await getProgresoTemporalData(periodo);
      setProgreso(res.data);
    } catch (err) { console.error(err); }
    finally { setCargandoProgreso(false); }
  }

  async function marcarAsistencia(id: number, asistio: boolean) {
    try {
      const citaActual = data?.citasHoy?.find((c: any) => c.id === id);
      const nuevoValor = citaActual?.asistio === asistio ? null : asistio;
      await actualizarCitaService(id, { asistio: nuevoValor });
      setData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          citasHoy: prev.citasHoy.map((c: any) =>
            c.id === id ? { ...c, asistio: nuevoValor } : c
          ),
        };
      });
    } catch (err) { console.error(err); }
  }

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl mb-3">⏳</div>
        <p className="text-gray-500">Cargando panel...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { citasHoy, citasManana, ingresosHoy, ingresosMes, ciclosCompletos, profHoy } = data;

  const confirmadas  = citasHoy.filter((c: any) => c.estado === 'confirmada');
  const reservas     = citasHoy.filter((c: any) => c.estado === 'pendiente');
  const asistieron   = citasHoy.filter((c: any) => c.asistio === true).length;
  const noAsistieron = citasHoy.filter((c: any) => c.asistio === false).length;
  const sinMarcar    = confirmadas.filter((c: any) => c.asistio === null).length;

  // Agrupar progreso por área
  const areasMap: Record<string, any> = {};
  progreso.forEach(row => {
    if (!areasMap[row.area_id]) {
      areasMap[row.area_id] = {
        area_id: row.area_id,
        area_nombre: row.area_nombre,
        area_emoji: row.area_emoji,
        periodos: [],
      };
    }
    areasMap[row.area_id].periodos.push({
      label: row.periodo_label,
      orden: row.periodo_orden,
      total_pacientes: parseInt(row.total_pacientes),
      total_sesiones:  parseInt(row.total_sesiones),
      ingresos: parseFloat(row.ingresos),
    });
  });
  const areasArray = Object.values(areasMap);

  const DIAS_JS: Record<number, string> = {
    0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miercoles',
    4: 'Jueves', 5: 'Viernes', 6: 'Sabado',
  };
  const diaNombre = DIAS_JS[new Date().getDay()];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📊 Panel del día</h1>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{fechaLabel}</p>
        </div>
        <button
          onClick={cargarDatos}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Progreso por área */}
      <div>
        {cargandoProgreso ? (
          <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>
        ) : areasArray.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">Sin datos para este periodo</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {areasArray.map((area: any) => (
              <AreaCard key={area.area_id} area={area} />
            ))}
          </div>
        )}
      </div>

      {/* Ciclos que terminan hoy */}
      {ciclosCompletos.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="px-5 py-4 flex items-center gap-2">
            <Bell size={18} className="text-amber-700" />
            <p className="text-sm font-semibold text-amber-800">Pacientes que completan su ciclo hoy</p>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">{ciclosCompletos.length}</span>
          </div>
          <div>
            {ciclosCompletos.map((c: any, idx: number) => (
              <div key={idx} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <User size={18} className="text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.paciente_nombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{c.area_nombre}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-xs text-gray-500">Ciclo {c.ciclo}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-xs text-gray-500">{c.total_sesiones} sesiones</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-xs text-gray-500">{c.profesional_nombre}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-100 px-3 py-1.5 rounded-full">
                  <Award size={12} className="text-amber-700" />
                  <span className="text-[11px] font-medium text-amber-700">Última sesión</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citas + Panel derecho */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lista citas hoy / mañana */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-[#efedf0] overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="p-5 flex items-center gap-1">
            <button
              onClick={() => setTabActiva('hoy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tabActiva === 'hoy' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Hoy ({citasHoy.length})
            </button>
            <button
              onClick={() => setTabActiva('manana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tabActiva === 'manana' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Mañana ({citasManana.length})
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {tabActiva === 'hoy' ? (
              citasHoy.length === 0 ? (
                <p className="text-center py-12 text-gray-400 text-sm">Sin citas para hoy</p>
              ) : citasHoy.map((c: any) => (
                <div key={c.id} className="p-3 hover:bg-gray-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-1.5 h-10 rounded-full shrink-0 ${c.estado === 'confirmada' ? 'bg-purple-500' : 'bg-yellow-400'}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-700">{c.hora?.slice(0, 5)}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${c.estado === 'confirmada' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {c.estado === 'confirmada' ? 'Confirmada' : 'Reserva'}
                          </span>
                          {c.sesion && c.total_sesiones > 1 && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                              S{c.sesion}/{c.total_sesiones}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 truncate">{c.paciente_nombre}</p>
                        <p className="text-[10px] text-gray-500">{c.area_emoji} {c.area_nombre} · {c.profesional_nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {c.estado === 'confirmada' && (
                        <>
                          <button
                            onClick={() => marcarAsistencia(c.id, true)}
                            className={`p-1.5 rounded-lg border transition-all ${c.asistio === true ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => marcarAsistencia(c.id, false)}
                            className={`p-1.5 rounded-lg border transition-all ${c.asistio === false ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      {c.monto_pagado && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                          Bs {c.monto_pagado}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              citasManana.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Sin citas para mañana</p>
              ) : citasManana.map((c: any) => (
                <div key={c.id} className="p-3 hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-10 rounded-full shrink-0 ${c.estado === 'confirmada' ? 'bg-emerald-500' : 'bg-yellow-400'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">{c.hora?.slice(0, 5)}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${c.estado === 'confirmada' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {c.estado === 'confirmada' ? 'Confirmada' : 'Reserva'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{c.paciente_nombre}</p>
                      <p className="text-[10px] text-gray-500">{c.area_emoji} {c.area_nombre} · {c.profesional_nombre}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">
          {/* Profesionales hoy */}
          <div className="bg-white rounded-3xl border border-[#efedf0] overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-5 flex items-center gap-2">
              <Users size={18} className="text-gray-500" />
              <p className="text-sm font-semibold text-gray-700">Profesionales hoy</p>
            </div>
            <div>
              {profHoy.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Sin actividad hoy</p>
              ) : profHoy.map((pr: any, idx: number) => (
                <div key={idx} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{pr.profesional_nombre}</p>
                    <p className="text-xs text-gray-400">{pr.area_nombre}</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{pr.total_citas} citas</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reservas pendientes */}
          {reservas.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-5 flex items-center gap-2">
                <Clock size={16} className="text-yellow-700" />
                <p className="text-sm font-semibold text-yellow-800">Reservas sin confirmar ({reservas.length})</p>
              </div>
              <div>
                {reservas.map((c: any) => (
                  <div key={c.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-800">{c.paciente_nombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{c.hora?.slice(0, 5)}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <Activity size={10} className="text-yellow-600" />
                      <span className="text-xs text-gray-500">{c.area_nombre}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumen asistencia */}
          <div className="bg-white rounded-3xl border border-[#efedf0] p-5 hover:shadow-xl transition-all duration-300">
            <p className="text-sm font-semibold text-gray-700 mb-4">Resumen asistencia</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="text-sm text-gray-600">Asistieron</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">{asistieron}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <XCircle size={16} className="text-red-500" />
                  <span className="text-sm text-gray-600">No asistieron</span>
                </div>
                <span className="text-sm font-bold text-red-500">{noAsistieron}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Sin marcar</span>
                </div>
                <span className="text-sm font-bold text-gray-400">{sinMarcar}</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${confirmadas.length > 0 ? (asistieron / confirmadas.length) * 100 : 0}%` }}
                  />
                  <div
                    className="h-full bg-red-400 transition-all"
                    style={{ width: `${confirmadas.length > 0 ? (noAsistieron / confirmadas.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {confirmadas.length > 0 ? Math.round((asistieron / confirmadas.length) * 100) : 0}% de asistencia
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zumba y Gerontología */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Zumba */}
        <div className="bg-white rounded-3xl border border-[#efedf0] overflow-hidden h-full flex flex-col hover:shadow-xl transition-all duration-300">
          <div className="p-5 border-b border-[#efedf0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell size={20} className="text-purple-600" />
              <p className="text-sm font-semibold text-purple-800">Zumba</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{data.zumba.activos} activos</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Bs {data.ingresosMesZumba.toFixed(0)} mes</span>
            </div>
          </div>

          {(data.zumba.horariosHoy || []).length > 0 ? (
            <div className="px-5 py-3 bg-pink-50 border-b border-pink-100">
              <div className="flex items-center gap-1 mb-1.5">
                <MapPin size={10} className="text-pink-700" />
                <p className="text-[10px] font-semibold text-pink-700">Hoy — {diaNombre}</p>
              </div>
              {(data.zumba.horariosHoy || []).map((h: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-pink-800">
                  <Music size={12} className="text-pink-600" />
                  <span className="font-medium">Zumba</span>
                  <span className="text-pink-500">{h.hora_inicio?.slice(0, 5)} - {h.hora_fin?.slice(0, 5)}</span>
                  <span className="ml-auto text-[10px] bg-pink-100 px-1.5 py-0.5 rounded-full">{data.zumba.activos} participantes</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 bg-gray-50 border-b text-[10px] text-gray-400 text-center">Sin clases de Zumba hoy</div>
          )}

          <div className="divide-y flex-1">
            {data.zumba.ciclosMes.length === 0 ? (
              <p className="text-center py-4 text-gray-400 text-xs">Sin ciclos este mes</p>
            ) : data.zumba.ciclosMes.map((z: any, idx: number) => (
              <div key={idx} className="px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-800">{z.participante}</p>
                  <p className="text-[10px] text-gray-500">Ciclo {z.numero_ciclo} · {z.clases_pagadas} clases · {z.metodo_pago}</p>
                </div>
                <span className="text-xs font-bold text-green-600">Bs {Number(z.monto).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gerontología */}
        <div className="bg-white rounded-3xl border border-[#efedf0] overflow-hidden h-full flex flex-col hover:shadow-xl transition-all duration-300">
          <div className="p-5 border-b border-[#efedf0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake size={20} className="text-orange-600" />
              <p className="text-sm font-semibold text-orange-800">Gerontología</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{data.geronto.activos} activos</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Bs {data.ingresosMesGeronto.toFixed(0)} mes</span>
            </div>
          </div>

          {(data.geronto.actividadesHoy || []).length > 0 ? (
            <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100">
              <div className="flex items-center gap-1 mb-1.5">
                <MapPin size={10} className="text-emerald-700" />
                <p className="text-[10px] font-semibold text-emerald-700">Hoy — {diaNombre}</p>
              </div>
              <div className="space-y-1">
                {(data.geronto.actividadesHoy || []).map((act: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-emerald-800">
                    <Heart size={12} className="text-emerald-600" />
                    <span className="font-medium">{act.nombre}</span>
                    <span className="text-emerald-500">{act.hora_inicio?.slice(0, 5)} - {act.hora_fin?.slice(0, 5)}</span>
                    <span className="ml-auto text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded-full">{act.inscritos} inscritos</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 bg-gray-50 border-b text-[10px] text-gray-400 text-center">Sin actividades de Gerontología hoy</div>
          )}

          <div className="divide-y flex-1">
            {data.geronto.ciclosMes.length === 0 ? (
              <p className="text-center py-4 text-gray-400 text-xs">Sin ciclos este mes</p>
            ) : data.geronto.ciclosMes.map((g: any, idx: number) => (
              <div key={idx} className="px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-800">{g.participante}</p>
                  <p className="text-[10px] text-gray-500">Ciclo {g.numero_ciclo} · {g.metodo_pago}</p>
                </div>
                <span className="text-xs font-bold text-green-600">Bs {Number(g.monto).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}