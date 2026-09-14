import { useState, useEffect } from 'react';
import { getReporteGeneral, getHistorialPagos, getProgresoTemporalData } from '../services/reportes.service';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ── Iconos profesionales (SVG) ──────────────────────────────────────────────
const IconTrendingUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconDollarSign = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const IconPieChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
    <path d="M22 12A10 10 0 0 0 12 2v10z"/>
  </svg>
);

const IconCreditCard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ─────────────────────────────────────────────
// Tarjeta de área — tooltip + carrusel LOCAL (mismo comportamiento que Dashboard)
// ─────────────────────────────────────────────
interface AreaCardProps {
  area: {
    area_id: string;
    area_nombre: string;
    area_emoji: string;
    periodos: {
      label: string;
      orden: string;
      total_pacientes: number;
      total_sesiones: number;
      ingresos: number;
    }[];
  };
  granularidad: 'semanal' | 'mensual' | 'anual';
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Arranca del inicio del período (semana/mes/año) al que pertenece "fecha",
// igual que hace DATE_TRUNC en el backend — así podemos comparar contra
// `periodo_orden` sin depender del idioma/formato del label que manda la API.
function inicioDePeriodo(fecha: Date, granularidad: 'semanal' | 'mensual' | 'anual'): Date {
  if (granularidad === 'anual') return new Date(fecha.getFullYear(), 0, 1);
  if (granularidad === 'semanal') {
    const d = new Date(fecha);
    const diaSemana = (d.getDay() + 6) % 7; // 0 = lunes, igual que date_trunc('week', ...)
    d.setDate(d.getDate() - diaSemana);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

// El backend manda periodo_orden como una marca UTC a medianoche (ej.
// "2026-09-01T00:00:00.000Z"). Si se lee con `new Date(...)` y luego se usa
// .getMonth()/.getFullYear() (hora LOCAL), en zonas horarias negativas como
// Bolivia (UTC-4) esa medianoche UTC cae en el día/mes anterior localmente
// (31 de agosto 8pm en vez de 1 de septiembre) — el gráfico terminaba
// agrupando los datos un mes antes. Esta función lee la fecha "de
// calendario" tal cual la mandó el backend, ignorando el desfase de huso horario.
function fechaDeCalendarioUTC(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function sumarPeriodos(fecha: Date, cantidad: number, granularidad: 'semanal' | 'mensual' | 'anual'): Date {
  const d = new Date(fecha);
  if (granularidad === 'anual') d.setFullYear(d.getFullYear() + cantidad);
  else if (granularidad === 'semanal') d.setDate(d.getDate() + cantidad * 7);
  else d.setMonth(d.getMonth() + cantidad);
  return d;
}

function mismoPeriodo(a: Date, b: Date, granularidad: 'semanal' | 'mensual' | 'anual'): boolean {
  if (granularidad === 'anual') return a.getFullYear() === b.getFullYear();
  if (granularidad === 'mensual') return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  return a.getTime() === b.getTime();
}

// Generamos nosotros mismos la etiqueta de cada columna (en vez de usar el
// label que manda la API) para que las 3 columnas —incluidas las que no
// tienen datos todavía, como el mes que recién empieza— se vean consistentes.
function etiquetaDePeriodo(fecha: Date, granularidad: 'semanal' | 'mensual' | 'anual'): string {
  if (granularidad === 'anual') return String(fecha.getFullYear());
  if (granularidad === 'mensual') return `${MESES_CORTOS[fecha.getMonth()]} ${fecha.getFullYear()}`;
  const fin = sumarPeriodos(fecha, 1, 'semanal');
  fin.setDate(fin.getDate() - 1);
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${fmt(fecha)} - ${fmt(fin)}`;
}

function AreaCard({ area, granularidad }: AreaCardProps) {
  // Siempre 3 columnas centradas en el período ACTUAL (anterior · actual ·
  // siguiente) — sin flechas ni navegación: si un período no tiene datos
  // todavía, simplemente se muestra en cero.
  const periodoActual = inicioDePeriodo(new Date(), granularidad);
  const ventana = [-1, 0, 1].map(offset => sumarPeriodos(periodoActual, offset, granularidad));

  const chartData = ventana.map((fechaPeriodo, index) => {
    const encontrado = area.periodos.find(p => mismoPeriodo(fechaDeCalendarioUTC(p.orden), fechaPeriodo, granularidad));
    return {
      id: `${area.area_id}-${index}`,
      label: etiquetaDePeriodo(fechaPeriodo, granularidad),
      Pacientes: Number(encontrado?.total_pacientes || 0),
      Sesiones: Number(encontrado?.total_sesiones || 0),
      Ingresos: Number(encontrado?.ingresos || 0),
    };
  });

  return (
    <div className={`
      rounded-3xl border border-[#efedf0] bg-white p-4 sm:p-5
      hover:shadow-xl transition-all duration-300
      h-full w-full min-h-[370px] flex flex-col
    `}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{area.area_emoji}</span>
        <p className="text-sm font-bold text-gray-800 truncate">{area.area_nombre}</p>
      </div>

      {/* Gráfico */}
      <div className="flex-1 flex flex-col">
        <div className="relative flex-1" style={{ minHeight: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              barGap={4}
              barCategoryGap={20}
              tabIndex={-1}
              style={{ outline: 'none' }}
              margin={{ top: 10, right: 5, left: 5, bottom: 0 }}
            >
              <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left"  hide />
              <YAxis yAxisId="right" hide />

              <Tooltip
                cursor={{ fill: 'rgba(193,0,255,0.06)', radius: 8 }}
                isAnimationActive={false}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const pacientes = payload.find(p => p.dataKey === 'Pacientes')?.value ?? 0;
                  const sesiones  = payload.find(p => p.dataKey === 'Sesiones')?.value  ?? 0;
                  const ingresos  = payload.find(p => p.dataKey === 'Ingresos')?.value  ?? 0;
                  return (
                    <div className="bg-white shadow-2xl border border-gray-100 rounded-2xl px-3 py-2 min-w-[120px]">
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

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
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
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Reportes() {
  const { usuario } = useAuth();
  const [reporte, setReporte] = useState<any>(null);
  const [pagos, setPagos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState<'resumen' | 'pagos'>('resumen');

  // Filtros — persistidos en localStorage para que no se pierdan al navegar a otra pantalla y volver
  const [anioFiltro, setAnioFiltro] = useState<string>(() => localStorage.getItem('reportes_anio_filtro') || 'todos');
  const [mesFiltro, setMesFiltro] = useState<string>(() => localStorage.getItem('reportes_mes_filtro') || 'todos');
  const [areaFiltro, setAreaFiltro] = useState<string>(() => localStorage.getItem('reportes_area_filtro') || 'todas');
  const [menuMesAbierto, setMenuMesAbierto] = useState(false);

  useEffect(() => { localStorage.setItem('reportes_anio_filtro', anioFiltro); }, [anioFiltro]);
  useEffect(() => { localStorage.setItem('reportes_mes_filtro', mesFiltro); }, [mesFiltro]);
  useEffect(() => { localStorage.setItem('reportes_area_filtro', areaFiltro); }, [areaFiltro]);

  // Progreso por área (mismo funcionamiento que Dashboard)
  const [progreso, setProgreso] = useState<any[]>([]);
  const [periodoProgreso, setPeriodoProgreso] = useState<'semanal' | 'mensual' | 'anual'>(() => {
    return (localStorage.getItem('reportes_periodo_progreso') as 'semanal' | 'mensual' | 'anual') || 'mensual';
  });
  const [cargandoProgreso, setCargandoProgreso] = useState(false);

  // Si hay año Y mes elegidos, se manda como 'YYYY-MM' (filtro exacto de mes).
  function mesParaApi(): string | undefined {
    if (anioFiltro === 'todos' || mesFiltro === 'todos') return undefined;
    return `${anioFiltro}-${mesFiltro}`;
  }
  // Si solo hay año elegido (sin mes específico), se manda como 'YYYY' (todo el año).
  function anioParaApi(): string | undefined {
    if (mesFiltro !== 'todos') return undefined;
    if (anioFiltro === 'todos') return undefined;
    return anioFiltro;
  }

  async function cargarDatos() {
    try {
      setCargando(true);
      const filtroMes = mesParaApi();
      const filtroAnio = anioParaApi();
      const [rep, hist] = await Promise.all([
        getReporteGeneral(filtroMes, filtroAnio),
        // El historial de pagos solo soporta filtro exacto de mes en el backend;
        // si el filtro es "solo año", se trae todo y se recorta por año en el cliente.
        getHistorialPagos(filtroMes),
      ]);
      setReporte(rep);
      setPagos(hist.pagos);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  // Se re-consulta el resumen cada vez que cambia mes o año.
  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anioFiltro, mesFiltro]);

  useEffect(() => { localStorage.setItem('reportes_periodo_progreso', periodoProgreso); }, [periodoProgreso]);
  useEffect(() => { cargarProgreso(periodoProgreso); }, [periodoProgreso]);

  async function cargarProgreso(periodo: 'semanal' | 'mensual' | 'anual') {
    try {
      setCargandoProgreso(true);
      const res = await getProgresoTemporalData(periodo);
      setProgreso(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoProgreso(false);
    }
  }

  // ── Años disponibles para el selector (rango fijo alrededor del año actual) ──
  const anioActualNum = new Date().getFullYear();
  const aniosParaSelector = Array.from({ length: 6 }, (_, i) => String(anioActualNum + 1 - i)); // año+1 ... año-4, descendente

  const areasDisponibles = [...new Set(pagos.map(p => p.area).filter(Boolean))].sort();

  // Filtro de área (solo aplica a la tabla de Historial de pagos) +
  // recorte por año cuando el filtro es "todo un año" (ya que el backend de
  // historial solo filtra por mes exacto, el año-solo se filtra aquí).
  const filtroSoloAnio = anioFiltro !== 'todos' && mesFiltro === 'todos';
  const pagosFiltrados = pagos.filter(p => {
    if (areaFiltro !== 'todas' && p.area !== areaFiltro) return false;
    if (filtroSoloAnio && p.fecha && p.fecha.toString().slice(0, 4) !== anioFiltro) return false;
    return true;
  });

  function limpiarFiltros() {
    setAnioFiltro('todos');
    setMesFiltro('todos');
    setAreaFiltro('todas');
  }

  function aplicarMesYRecargar(anio: string, mes: string) {
    setAnioFiltro(anio);
    setMesFiltro(mes);
    setMenuMesAbierto(false);
  }

  // "Ver todo el año": deja el año elegido, pero quita el mes específico.
  function verTodoElAnio() {
    setMesFiltro('todos');
    setMenuMesAbierto(false);
  }

  if (usuario?.rol !== 'administrador' && usuario?.rol !== 'supervisor') {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <p className="text-gray-600 font-medium">No tienes acceso a los reportes</p>
      </div>
    );
  }

  const cardCls = "bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200";
  const chipCls = (activo: boolean) => `px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
    activo ? 'bg-[#A000D1] text-white shadow-md shadow-purple-200' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#A000D1]/30 hover:text-[#A000D1]'
  }`;

  const hayFiltrosActivos = anioFiltro !== 'todos' || mesFiltro !== 'todos' || areaFiltro !== 'todas';

  const hayMesEspecifico = anioFiltro !== 'todos' && mesFiltro !== 'todos';
  const hayAnioSolo = anioFiltro !== 'todos' && mesFiltro === 'todos';
  const filtroPeriodoActivo = hayMesEspecifico || hayAnioSolo;

  const etiquetaMes = hayMesEspecifico
    ? `${MESES[Number(mesFiltro) - 1]} ${anioFiltro}`
    : 'Mes';

  const etiquetaPeriodo = hayMesEspecifico
    ? `${MESES[Number(mesFiltro) - 1]} ${anioFiltro}`
    : hayAnioSolo
      ? `el año ${anioFiltro}`
      : '';

  // ── Agrupación de datos de progreso por área (igual que en Dashboard) ──
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

  return (
    <div className="reportes-root" style={{ fontFamily: 'inherit' }}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#A000D1]/10 flex items-center justify-center text-[#A000D1]">
            <IconTrendingUp />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Reportes</h1>
        </div>
      </div>

      {/* ── Barra de filtros ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de AÑO — independiente del mes */}
          <select
            value={anioFiltro}
            onChange={e => setAnioFiltro(e.target.value)}
            className={`px-3 py-2.5 border rounded-xl text-sm transition-all bg-white ${
              anioFiltro !== 'todos' ? 'border-[#A000D1] text-[#A000D1] font-medium' : 'border-gray-200 text-gray-600'
            }`}
          >
            <option value="todos">Todos los años</option>
            {aniosParaSelector.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Selector de mes propio (dropdown) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuMesAbierto(v => !v)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm border transition-all ${
                mesFiltro !== 'todos' ? 'border-[#A000D1] text-[#A000D1] bg-[#A000D1]/5 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <IconCalendar />
              {etiquetaMes}
              <IconChevronDown />
            </button>

            {menuMesAbierto && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuMesAbierto(false)} />
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-xl z-30 p-3">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <button
                      type="button"
                      onClick={() => setAnioFiltro(String(Number(anioFiltro === 'todos' ? new Date().getFullYear() : anioFiltro) - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-all"
                    >
                      ‹
                    </button>
                    <span className="text-sm font-semibold text-gray-700">
                      {anioFiltro === 'todos' ? new Date().getFullYear() : anioFiltro}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAnioFiltro(String(Number(anioFiltro === 'todos' ? new Date().getFullYear() : anioFiltro) + 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-all"
                    >
                      ›
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MESES.map((m, idx) => {
                      const valorMes = String(idx + 1).padStart(2, '0');
                      const anioActivo = anioFiltro === 'todos' ? String(new Date().getFullYear()) : anioFiltro;
                      const activo = mesFiltro === valorMes && anioFiltro === anioActivo;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => aplicarMesYRecargar(anioActivo, valorMes)}
                          className={`py-2 rounded-xl text-xs font-medium transition-all ${
                            activo ? 'bg-[#A000D1] text-white' : 'text-gray-600 hover:bg-violet-50 hover:text-[#A000D1]'
                          }`}
                        >
                          {m.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                  {mesFiltro !== 'todos' && (
                    <button
                      type="button"
                      onClick={verTodoElAnio}
                      className="w-full mt-2 py-1.5 rounded-xl text-xs text-gray-500 hover:bg-gray-50 border border-gray-100 transition-all"
                    >
                      Ver todo el año
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
            >
              <IconX /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-100">
        <button
          onClick={() => setTabActiva('resumen')}
          className={`px-5 py-2.5 rounded-t-xl text-sm font-medium transition-all ${
            tabActiva === 'resumen'
              ? 'text-[#A000D1] border-b-2 border-[#A000D1] bg-[#A000D1]/5'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Resumen general
        </button>
        <button
          onClick={() => setTabActiva('pagos')}
          className={`px-5 py-2.5 rounded-t-xl text-sm font-medium transition-all flex items-center gap-2 ${
            tabActiva === 'pagos'
              ? 'text-[#A000D1] border-b-2 border-[#A000D1] bg-[#A000D1]/5'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <IconCreditCard />
          Historial de pagos
          {pagosFiltrados.length > 0 && (
            <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {pagosFiltrados.length}
            </span>
          )}
        </button>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#A000D1]/20 border-t-[#A000D1] rounded-full animate-spin" />
        </div>
      ) : tabActiva === 'resumen' && reporte ? (
        <div className="space-y-5">
          {/* Tarjetas principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`${cardCls} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <IconDollarSign />
                </div>
                <span className="text-xs text-gray-400">{filtroPeriodoActivo ? 'Del periodo' : 'Total'}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                Bs {Number(reporte.resumen.ingresos_total).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filtroPeriodoActivo ? `Ingresos de ${etiquetaPeriodo}` : 'Ingresos totales'}
              </p>
            </div>

            <div className={`${cardCls} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <IconCalendar />
                </div>
                <span className="text-xs text-gray-400">{filtroPeriodoActivo ? 'Del periodo' : 'Hoy'}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {reporte.resumen.citas_hoy}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filtroPeriodoActivo ? 'Citas confirmadas en el periodo' : 'Citas programadas'}
              </p>
            </div>

            <div className={`${cardCls} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <IconUsers />
                </div>
                <span className="text-xs text-gray-400">{filtroPeriodoActivo ? 'Del periodo' : 'Activos'}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {reporte.resumen.total_pacientes}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filtroPeriodoActivo ? 'Pacientes atendidos' : 'Pacientes activos'}
              </p>
            </div>

            <div className={`${cardCls} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12.5A7.5 7.5 0 0 1 8 15m0-5.5a3 3 0 1 0 6 0 3 3 0 1 0-6 0Z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-400">Activos</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {reporte.resumen.total_zumba}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Participantes de Zumba ahora
              </p>
            </div>
          </div>

          {/* Gráfico de ingresos por área */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className={`${cardCls} p-5`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#A000D1]/10 flex items-center justify-center text-[#A000D1]">
                  <IconPieChart />
                </div>
                <h3 className="font-semibold text-gray-700">Ingresos por área</h3>
              </div>
              {reporte.ingresos_por_area.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sin datos disponibles</p>
              ) : (
                <div className="space-y-3">
                  {reporte.ingresos_por_area.map((area: any) => (
                    <div key={area.area} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-700">
                        {area.area}
                      </span>
                      <span className="font-semibold text-[#A000D1] text-sm">
                        Bs {Number(area.total_ingresos).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`${cardCls} p-5`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-700">Áreas destacadas</h3>
              </div>
              <p className="text-[11px] text-gray-400 -mt-2 mb-3">
                Participantes activos ahora mismo — no cambian con el filtro de mes/año
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-500" />
                    <span className="text-sm text-gray-600">Zumba</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800 text-sm">
                      {reporte.resumen.total_zumba} participantes
                    </p>
                    <p className="text-xs text-green-600">
                      Bs {Number(reporte.resumen.ingresos_zumba).toFixed(0)}
                      {filtroPeriodoActivo ? ` (${etiquetaPeriodo})` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-600" />
                    <span className="text-sm text-gray-600">Gerontología</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800 text-sm">
                      {reporte.resumen.total_geronto} participantes
                    </p>
                    <p className="text-xs text-green-600">
                      Bs {Number(reporte.resumen.ingresos_geronto).toFixed(0)}
                      {filtroPeriodoActivo ? ` (${etiquetaPeriodo})` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : tabActiva === 'pagos' ? (
        <div className="space-y-4">
          {/* Chips por área — SOLO aquí, filtran la tabla de pagos */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setAreaFiltro('todas')} className={chipCls(areaFiltro === 'todas')}>
              Todas las áreas
            </button>
            {areasDisponibles.map(area => (
              <button key={area} onClick={() => setAreaFiltro(area)} className={chipCls(areaFiltro === area)}>
                {area}
              </button>
            ))}
          </div>

          <div className={`${cardCls} overflow-hidden`}>
            {pagosFiltrados.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <IconCreditCard />
                </div>
                <p className="text-gray-500">Sin pagos registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Fecha</th>
                      <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Paciente</th>
                      <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Área</th>
                      <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Detalle</th>
                      <th className="text-right p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Monto</th>
                      <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Método</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pagosFiltrados.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-gray-500 text-xs">
                          {p.fecha ? new Date(p.fecha).toLocaleDateString('es') : '-'}
                        </td>
                        <td className="p-4 font-medium text-gray-800 text-sm">{p.paciente}</td>
                        <td className="p-4">
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#A000D1]/10 text-[#A000D1]">
                            {p.area}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 text-xs">{p.sesion}</td>
                        <td className="p-4 text-right font-semibold text-emerald-600 text-sm">
                          Bs {Number(p.monto).toFixed(0)}
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                            p.metodo_pago === 'efectivo'
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.metodo_pago === 'qr'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}>
                            {p.metodo_pago}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={`${cardCls} p-12 text-center`}>
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      )}

      {/* ── Progreso por área (mismo comportamiento que Dashboard) ── */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#A000D1]/10 flex items-center justify-center text-[#A000D1]">
              <IconTrendingUp />
            </div>
            <h3 className="font-semibold text-gray-700">Progreso por área</h3>
          </div>
          <select
            value={periodoProgreso}
            onChange={(e) => setPeriodoProgreso(e.target.value as any)}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
          >
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
            <option value="anual">Anual</option>
          </select>
        </div>

        {cargandoProgreso ? (
          <div className={`${cardCls} p-6 text-center text-gray-400 text-sm`}>Cargando...</div>
        ) : areasArray.length === 0 ? (
          <div className={`${cardCls} p-6 text-center text-gray-400 text-sm`}>Sin datos para este periodo</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {areasArray.map((area: any) => (
              <AreaCard key={area.area_id} area={area} granularidad={periodoProgreso} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .reportes-root {
          width: 100%;
        }
        .reportes-root *::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .reportes-root *::-webkit-scrollbar-track {
          background: transparent;
        }
        .reportes-root *::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}