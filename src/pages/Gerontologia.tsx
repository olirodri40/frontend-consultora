import { useState, useEffect } from 'react';
import {
  getActividadesGeronto,
  getParticipantesGeronto,
  crearParticipanteGeronto,
  renovarCicloGeronto,
  marcarAsistenciaGeronto,
  getAsistenciaCiclo,
  editarParticipanteGeronto,
  eliminarParticipanteGeronto,
  getHistorialCiclosGeronto,
  actualizarPagoGeronto,
  eliminarAsistenciaGeronto,
  getActividadesConProfesionales,
} from '../services/geronto.service';
import AbrazandoVidass from '../assets/AbrazandoVidass.jpg';
import { useAuth } from '../context/AuthContext';
import { useClock } from '../hooks/useClock';
import { DIAS_JS, mismoDia } from '../utils/dias';
// ── LOGO ──────────────────────────────────────────────────────────────────────
const LOGO_ABRAZANDO_VIDAS = AbrazandoVidass;

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconGeronto = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconClock = ({ size = 14 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/>
    <line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
);

const IconActivity = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

// ── Iconos para Recibo ──────────────────────────────────────────────────────
const IconReceipt = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5 4 2z"/>
    <line x1="8" y1="7" x2="16" y2="7"/>
    <line x1="8" y1="11" x2="16" y2="11"/>
    <line x1="8" y1="15" x2="13" y2="15"/>
  </svg>
);

const IconPrinter = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ── FUNCIÓN PARA OBTENER ACTIVIDADES CON DÍA, NOMBRE Y HORARIO ───────────
function obtenerActividadesConDiaHorario(pago: any, actividades: any[]): string {
  if (!pago.actividades_ids || pago.actividades_ids.length === 0) return '—';
  
  const ordenDias: Record<string, number> = {
    'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 7,
    'Miercoles': 3,
  };
  
  function normalizarDia(dia: string): string {
    const mapa: Record<string, string> = {
      'Lunes': 'Lunes',
      'Martes': 'Martes',
      'Miércoles': 'Miercoles',
      'Miercoles': 'Miercoles',
      'Jueves': 'Jueves',
      'Viernes': 'Viernes',
      'Sábado': 'Sabado',
      'Sabado': 'Sabado',
      'Domingo': 'Domingo'
    };
    return mapa[dia] || dia;
  }
  
  const actividadesConDia = pago.actividades_ids
    .map((actId: number) => {
      const act = actividades.find(a => a.id === actId);
      if (!act) return null;
      
      const diaNormalizado = normalizarDia(act.dia || '');
      const orden = ordenDias[act.dia] || ordenDias[diaNormalizado] || 99;
      
      return {
        dia: act.dia || '—',
        nombre: act.nombre,
        horario: `${act.hora_inicio?.slice(0,5) || '—'} - ${act.hora_fin?.slice(0,5) || '—'}`,
        orden: orden
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.orden - b.orden);
  
  return actividadesConDia.map((a: any) => 
    `${a.dia}: ${a.nombre} (${a.horario})`
  ).join('\n');
}

// ── Badge de estado de pago ──────────────────────────────────────────────
function BadgePago({ estado, deuda }: { estado: string; deuda: number }) {
  if (estado === 'pagado') return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-medium border border-violet-200">Pagado</span>
  );
  if (estado === 'parcial') return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium border border-orange-200">
      Debe Bs {Number(deuda).toFixed(0)}
    </span>
  );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium border border-red-200">
      Sin pago · Bs {Number(deuda).toFixed(0)}
    </span>
  );
}

export default function Gerontologia() {
  const { usuario } = useAuth();
  // ── Estado principal ──────────────────────────────────────────────────────
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [aniosDisponiblesParticipantes, setAniosDisponiblesParticipantes] = useState<number[]>([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState<number | 'todos'>(new Date().getFullYear());

  // Reloj que se refresca cada minuto — solo para que las tarjetas de
  // participantes se resalten automáticamente en cuanto falten 20min para
  // que termine una actividad de hoy sin asistencia marcada.
  const ahora = useClock();

  // ── Modales existentes ────────────────────────────────────────────────────
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalRenovar, setModalRenovar] = useState<any>(null);
  const [modalAsistencia, setModalAsistencia] = useState<any>(null);
  const [asistenciaDetalle, setAsistenciaDetalle] = useState<any[]>([]);
  const [actividadesSeleccionadas, setActividadesSeleccionadas] = useState<number[]>([]);
  const [modalEditar, setModalEditar] = useState<any>(null);
  const [menuAbierto, setMenuAbierto] = useState<{ actividadId: number; sesionIdx: number } | null>(null);
  const [formEditar, setFormEditar] = useState<any>({
    nombre: '', carnet: '', telefono: '', fecha_nac: '',
    actividades_ids: [], fecha_inicio: '', monto: 0, metodo_pago: 'efectivo',
    contacto_relacion: '',
    contacto_nombre: '',
    contacto_telefono: ''
  });
  const [nuevoForm, setNuevoForm] = useState({
    nombre: '', carnet: '', telefono: '', fecha_nac: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    monto: 0, metodo_pago: 'efectivo',
    contacto_relacion: '',
    contacto_nombre: '',
    contacto_telefono: ''
  });

  // ── Modales de contacto ────────────────────────────────────────────────────
  const [modalContactoEmergencia, setModalContactoEmergencia] = useState<any>(null);
  const [modalContactarParticipante, setModalContactarParticipante] = useState<any>(null);

  // ── Nuevos modales (historial) ────────────────────────────────────────────
  const [modalHistorial, setModalHistorial] = useState<any>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [modalPago, setModalPago] = useState<any>(null);
  const [formPago, setFormPago] = useState({ monto_pagado: 0, metodo_pago: 'efectivo' });
  const [modalDetalleAsistencias, setModalDetalleAsistencias] = useState<any>(null);
  const [cargandoAsistenciasDetalle, setCargandoAsistenciasDetalle] = useState(false);

  // ── Reportes ──────────────────────────────────────────────────────────────
   // ── NUEVO: Modal de Recibo ──────────────────────────────────────────────
  const [reciboPago, setReciboPago] = useState<any>(null);

  // ── Formulario renovar ────────────────────────────────────────────────────
  const [formRenovar, setFormRenovar] = useState({
    fecha_inicio: new Date().toISOString().split('T')[0],
    monto: 200,
    monto_pagado: 200,
    metodo_pago: 'efectivo',
    actividades_ids: [] as number[],
  });

  const hoy = new Date().toISOString().split('T')[0];
  

   const [actividadesConProfesional, setActividadesConProfesional] = useState<any[]>([]);

  // 👇 AGREGAR ESTO AQUÍ
  const actividadesDelProfesional = usuario?.rol === 'profesional'
    ? actividadesConProfesional
        .filter(ap => ap.profesional?.id === usuario.id)
        .map(ap => ap.id)
    : [];
  // ── Cargar datos ──────────────────────────────────────────────────────────
  async function cargarDatos(anio?: number) {
  try {
    setCargando(true);
    const [data, acts, actividadesConProf] = await Promise.all([
      getParticipantesGeronto(anio),
      getActividadesGeronto(),
      getActividadesConProfesionales(), // 👈 AGREGAR
    ]);
    setParticipantes(data.participantes);
    setAniosDisponiblesParticipantes(data.anios_disponibles || []);
    setActividades(acts);
    setActividadesConProfesional(actividadesConProf); // 👈 AGREGAR
  } catch (err) {
    console.error(err);
  } finally {
    setCargando(false);
  }
}

  useEffect(() => {
    cargarDatos(anioSeleccionado === 'todos' ? undefined : anioSeleccionado);
  }, [anioSeleccionado]);

  // ── Funciones de historial ────────────────────────────────────────────────
  async function abrirHistorial(p: any) {
    setCargandoHistorial(true);
    setModalHistorial({ participante: p, ciclos: [] });
    try {
      const data = await getHistorialCiclosGeronto(p.id, anioSeleccionado === 'todos' ? undefined : anioSeleccionado);
      setModalHistorial({ participante: data.participante, ciclos: data.ciclos });
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoHistorial(false);
    }
  }

  async function abrirDetalleAsistencias(ciclo: any) {
    setCargandoAsistenciasDetalle(true);
    setModalDetalleAsistencias({ ciclo, asistencias: [] });
    try {
      const data = await getAsistenciaCiclo(ciclo.id);
      setModalDetalleAsistencias({ ciclo, asistencias: data });
    } catch (err) {
      console.error(err);
      alert('Error al cargar asistencias');
    } finally {
      setCargandoAsistenciasDetalle(false);
    }
  }

  function abrirModalPago(ciclo: any) {
    setFormPago({
      monto_pagado: ciclo.monto_pagado ?? ciclo.monto,
      metodo_pago: ciclo.metodo_pago ?? 'efectivo',
    });
    setModalPago(ciclo);
  }

  async function guardarPago(e: React.FormEvent) {
    e.preventDefault();
    try {
      await actualizarPagoGeronto(modalPago.id, formPago);
      setModalPago(null);
      if (modalHistorial) {
        const data = await getHistorialCiclosGeronto(modalHistorial.participante.id);
        setModalHistorial({ participante: data.participante, ciclos: data.ciclos });
      }
      await cargarDatos(anioSeleccionado === 'todos' ? undefined : anioSeleccionado);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al actualizar pago');
    }
  }

  // ── Funciones de cumpleaños ───────────────────────────────────────────────
  function obtenerEstadoCumpleanos(fechaNac: string | null): { proximo: boolean; mensaje: string; dias: number } {
    if (!fechaNac) return { proximo: false, mensaje: '', dias: 0 };
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    
    const proximoCumple = new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate());
    
    if (proximoCumple < hoy) {
      proximoCumple.setFullYear(hoy.getFullYear() + 1);
    }
    
    const diffTime = proximoCumple.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) {
      if (diffDays === 0) {
        return { proximo: true, mensaje: '🎂 Hoy', dias: 0 };
      } else if (diffDays === 1) {
        return { proximo: true, mensaje: '🎂 Mañana', dias: 1 };
      } else {
        return { proximo: true, mensaje: `🎂 ${diffDays} días`, dias: diffDays };
      }
    }
    
    return { proximo: false, mensaje: '', dias: diffDays };
  }

  // ── Funciones existentes ──────────────────────────────────────────────────
  function toggleActividad(id: number) {
    setActividadesSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  }

  async function abrirModalAsistencia(p: any) {
    setModalAsistencia(p);
    if (p.ciclo_id) {
      try {
        const data = await getAsistenciaCiclo(p.ciclo_id);
        setAsistenciaDetalle(data);
      } catch (err) { console.error(err); }
    }
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
        monto_pagado: nuevoForm.monto,
        contacto_relacion: nuevoForm.contacto_relacion,
        contacto_nombre: nuevoForm.contacto_nombre,
        contacto_telefono: nuevoForm.contacto_telefono,
      });
      setModalNuevo(false);
      setActividadesSeleccionadas([]);
      setNuevoForm({
        nombre: '', carnet: '', telefono: '', fecha_nac: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        monto: 0, metodo_pago: 'efectivo',
        contacto_relacion: '',
        contacto_nombre: '',
        contacto_telefono: '',
      });
      await cargarDatos(anioSeleccionado === 'todos' ? undefined : anioSeleccionado);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al inscribir');
    }
  }

  async function renovarCiclo(e: React.FormEvent) {
    e.preventDefault();
    try {
      await renovarCicloGeronto(modalRenovar.id, {
        fecha_inicio: formRenovar.fecha_inicio,
        monto: formRenovar.monto,
        monto_pagado: formRenovar.monto_pagado,
        metodo_pago: formRenovar.metodo_pago,
        actividades_ids: modalRenovar.actividades_ids || [],
      });
      setModalRenovar(null);
      setFormRenovar({
        fecha_inicio: new Date().toISOString().split('T')[0],
        monto: 200,
        monto_pagado: 200,
        metodo_pago: 'efectivo',
        actividades_ids: [],
      });
      await cargarDatos(anioSeleccionado === 'todos' ? undefined : anioSeleccionado);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al renovar ciclo');
    }
  }

  async function registrarAsistencia(actividadId: number, estado: string | null, fecha: string) {
    try {
      if (estado === null) {
        await eliminarAsistenciaGeronto({
          participant_id: modalAsistencia.id,
          cycle_id: modalAsistencia.ciclo_id,
          activity_id: actividadId,
          fecha,
        });
      } else {
        await marcarAsistenciaGeronto({
          participant_id: modalAsistencia.id,
          cycle_id: modalAsistencia.ciclo_id,
          activity_id: actividadId,
          fecha,
          estado,
        });
      }
      
      const data = await getAsistenciaCiclo(modalAsistencia.ciclo_id);
      setAsistenciaDetalle(data);
      await cargarDatos(anioSeleccionado === 'todos' ? undefined : anioSeleccionado);
    } catch (err) { 
      console.error(err); 
    }
  }

    function calcularSesiones(act: any, fechaInicio: string, asistenciaActividad: any[]) {
    const diasSemana: Record<string, number> = {
      'Domingo': 0,
      'Lunes': 1,
      'Martes': 2,
      'Miércoles': 3, 'Miercoles': 3,
      'Jueves': 4,
      'Viernes': 5,
      'Sábado': 6, 'Sabado': 6,
    };
    const diaActividad = diasSemana[act.dia];
    if (diaActividad === undefined) {
      console.warn(`Día de actividad no reconocido: "${act.dia}" (actividad: ${act.nombre})`);
      return [];
    }
    const fecha = new Date(fechaInicio);

    while (fecha.getDay() !== diaActividad) {
      fecha.setDate(fecha.getDate() + 1);
    }

    const sesiones: Date[] = [];
    let sesionesValidas = 0;
    let maxIteraciones = 20;

    while (sesionesValidas < 4 && maxIteraciones > 0) {
      const fechaActual = new Date(fecha);
      sesiones.push(fechaActual);
      const fechaStr = fechaActual.toISOString().split('T')[0];
      const registro = asistenciaActividad.find(a => a.fecha?.split('T')[0] === fechaStr);

      if (registro?.estado !== 'permiso' && registro?.estado !== 'suspendida') {
        sesionesValidas++;
      }
      fecha.setDate(fecha.getDate() + 7);
      maxIteraciones--;
    }
    return sesiones;
  }

  function calcularProgresoCiclo(p: any): number {
    if (!p.ciclo_id || !p.actividades_ids || p.actividades_ids.length === 0) return 0;
    const totalClasesEsperadas = p.actividades_ids.length * 4;
    const totalClasesRealizadas = parseInt(p.clases_asistidas || 0) + parseInt(p.clases_falta || 0);
    if (totalClasesEsperadas === 0) return 0;
    return Math.min((totalClasesRealizadas / totalClasesEsperadas) * 100, 100);
  }

  function cicloCompleto(p: any): boolean {
    return calcularProgresoCiclo(p) >= 100;
  }

  // ── Aviso de asistencia pendiente ──────────────────────────────────────
  // Se activa 20min antes de que termine la actividad de HOY (ej. si la
  // actividad es de 15:00 a 16:00, se activa a las 15:40) y sigue prendido
  // hasta que se marque la asistencia — así no se olvida.
  function actividadPendienteHoy(act: any, p: any): boolean {
    if (!act?.dia || !act?.hora_fin) return false;
    const diaHoy = DIAS_JS[ahora.getDay()];
    if (!mismoDia(act.dia, diaHoy)) return false;
    const [hh, mm] = act.hora_fin.slice(0, 5).split(':').map(Number);
    const finEnMinutos = hh * 60 + mm;
    const ahoraEnMinutos = ahora.getHours() * 60 + ahora.getMinutes();
    if (ahoraEnMinutos < finEnMinutos - 20) return false;
    return !p.marcado_hoy_por_actividad?.[act.id];
  }
  function tieneAlgunaPendienteHoy(p: any): boolean {
    if (!p.actividades_ids || p.actividades_ids.length === 0) return false;
    return p.actividades_ids.some((actId: number) => {
      const act = actividades.find(a => a.id === actId);
      return act && actividadPendienteHoy(act, p);
    });
  }

  function abrirModalEditar(p: any) {
    setFormEditar({
      nombre: p.nombre || '',
      carnet: p.carnet || '',
      telefono: p.telefono || '',
      fecha_nac: p.fecha_nac ? p.fecha_nac.split('T')[0] : '',
      actividades_ids: p.actividades_ids || [],
      fecha_inicio: p.fecha_inicio ? p.fecha_inicio.split('T')[0] : '',
      monto: p.monto || 0,
      metodo_pago: p.metodo_pago || 'efectivo',
      contacto_relacion: p.contacto_relacion || '',
      contacto_nombre: p.contacto_nombre || '',
      contacto_telefono: p.contacto_telefono || '',
    });
    setModalEditar(p);
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    try {
      await editarParticipanteGeronto(modalEditar.id, {
        ...formEditar,
        contacto_relacion: formEditar.contacto_relacion,
        contacto_nombre: formEditar.contacto_nombre,
        contacto_telefono: formEditar.contacto_telefono,
      });
      setModalEditar(null);
      await cargarDatos(anioSeleccionado === 'todos' ? undefined : anioSeleccionado);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al editar');
    }
  }

  async function eliminarParticipante(id: number) {
    if (!confirm('Seguro que deseas eliminar este participante?')) return;
    try {
      await eliminarParticipanteGeronto(id);
      await cargarDatos(anioSeleccionado === 'todos' ? undefined : anioSeleccionado);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al eliminar');
    }
  }

  async function eliminarAsistencia(actividadId: number, fecha: string) {
    try {
      await eliminarAsistenciaGeronto({
        participant_id: modalAsistencia.id,
        cycle_id: modalAsistencia.ciclo_id,
        activity_id: actividadId,
        fecha,
      });
      
      const data = await getAsistenciaCiclo(modalAsistencia.ciclo_id);
      setAsistenciaDetalle(data);
      await cargarDatos(anioSeleccionado === 'todos' ? undefined : anioSeleccionado);
    } catch (err) { 
      console.error(err); 
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all";
  const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isMenuButton = target.closest('.asistencia-trigger');
      const isInsideMenu = target.closest('.assistencia-menu');
      
      if (!isMenuButton && !isInsideMenu && menuAbierto) {
        setMenuAbierto(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuAbierto]);
  
 
  // ── VISTA PRINCIPAL ────────────────────────────────────────────────────────
  return (
    <div className="max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <IconGeronto />
          </div>
          <div>
            <p className="text-xs text-gray-400">{participantes.length} participantes activos</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 font-medium">Año:</label>
            <select
              value={anioSeleccionado}
              onChange={e => setAnioSeleccionado(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
            >
              <option value="todos">Todos los años</option>
              {aniosDisponiblesParticipantes.map(anio => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </div>

          {/* Solo Administrador/Supervisor/Recepcionista ven "Inscribir" */}
{usuario?.rol !== 'profesional' && (
  <button
    onClick={() => setModalNuevo(true)}
    className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-200 whitespace-nowrap"
  >
    + Inscribir
  </button>
)}
        </div>
      </div>

      {/* Actividades disponibles */}
    {(() => {
  // 👇 FILTRAR actividades si es profesional
  const actividadesFiltradas = usuario?.rol === 'profesional'
    ? actividadesConProfesional.filter(ap => ap.profesional?.id === usuario.id)
    : actividadesConProfesional;

  if (actividadesFiltradas.length === 0) return null;

  return (
    <div className="mb-6 bg-white rounded-3xl border border-[#efedf0] p-4 sm:p-5 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
          <IconActivity />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-lg">Actividades disponibles</h3>
          <span className="text-xs text-gray-400">{actividadesFiltradas.length} actividades registradas</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(
          actividadesFiltradas.reduce((acc: any, act: any) => {
            if (!acc[act.dia]) acc[act.dia] = [];
            acc[act.dia].push(act);
            return acc;
          }, {})
        ).map(([dia, acts]: any) => (
          <div key={dia} className="bg-violet-50/50 rounded-xl p-4 border border-violet-100">
            <p className="text-xs font-bold text-violet-700 mb-3 uppercase tracking-wide">{dia}</p>
            {acts.map((act: any) => (
              <div key={act.id} className="flex flex-col gap-0.5 py-1.5 border-b border-violet-100/50 last:border-0">
                <div className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: act.color || '#8B5CF6' }}
                  ></div>
                  <span className="text-gray-700 font-medium truncate">{act.nombre}</span>
                  <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                    {act.hora_inicio?.slice(0, 5)} - {act.hora_fin?.slice(0, 5)}
                  </span>
                </div>
                
                {act.profesional ? (
                  <div className="text-[10px] text-gray-400 pl-5 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {act.profesional.nombre}
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-300 pl-5">
                    Sin profesional asignado
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
})()}

      {/* Grid de participantes */}
      {cargando ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : participantes.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-3xl border border-[#efedf0]">
          <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <IconUser />
          </div>
          <p className="text-gray-500 font-medium">No hay participantes</p>
          <p className="text-xs text-gray-400 mt-1">Inscribe el primero con el botón superior</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participantes.map(p => {
            const sinCiclo = !p.ciclo_id;
            const asistidas = parseInt(p.clases_asistidas || 0);
            const faltas = parseInt(p.clases_falta || 0);
            const permisos = parseInt(p.clases_permiso || 0);
            const totalMarcadas = asistidas + faltas;
            const totalActividades = p.actividades_ids?.length || 0;
            const totalEsperadas = totalActividades * 4;
            const progreso = calcularProgresoCiclo(p);
            const completo = cicloCompleto(p);
            const estadoPago = p.estado_pago || 'pagado';
            const deuda = Number(p.deuda || 0);
            const pendienteHoy = !sinCiclo && !completo && tieneAlgunaPendienteHoy(p);

            return (
              <div
                key={p.id}
                className={`bg-white rounded-3xl border p-4 sm:p-5 hover:shadow-xl transition-all duration-300 ${
                  pendienteHoy
                    ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-200'
                    : `border-[#efedf0] ${completo ? 'border-violet-400 bg-violet-50/30' : ''} ${estadoPago !== 'pagado' && !sinCiclo ? 'border-orange-200' : ''}`
                }`}
              >
                {pendienteHoy && (
                  <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2.5 py-1 w-fit">
                    <IconClock size={11} />
                    Falta marcar asistencia de hoy
                  </div>
                )}
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-800 truncate">{p.nombre}</h3>
                    {/* CI y teléfono - solo visible para Administrador/Supervisor/Recepcionista */}
{usuario?.rol !== 'profesional' && (
  <p className="text-xs text-gray-400 truncate">
    {p.carnet && `CI: ${p.carnet}`}{p.telefono && ` · ${p.telefono}`}
  </p>
)}
                    {/* Badge de cumpleaños - solo visible para Administrador/Supervisor/Recepcionista */}
{usuario?.rol !== 'profesional' && (() => {
  const cumple = obtenerEstadoCumpleanos(p.fecha_nac);
  if (cumple.proximo) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-medium border border-pink-200 inline-flex items-center gap-1.5 mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <rect x="3" y="8" width="18" height="14" rx="2" ry="2"/>
          <line x1="12" y1="8" x2="12" y2="22"/>
          <path d="M8 8h8"/>
          <path d="M7 4 L9 8 L12 4 L15 8 L17 4"/>
        </svg>
        {cumple.mensaje}
      </span>
    );
  }
  return null;
})()}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Solo Administrador/Supervisor/Recepcionista ven historial */}
{usuario?.rol !== 'profesional' && (
  <button
    onClick={() => abrirHistorial(p)}
    className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-50 text-violet-500 hover:bg-violet-100 transition-all duration-200 flex-shrink-0"
    title="Ver historial de ciclos"
  >
    <IconClock size={14} />
  </button>
)}
                   {/* Solo Administrador/Supervisor/Recepcionista ven Editar y Eliminar */}
{usuario?.rol !== 'profesional' && (
  <>
    <button
      onClick={() => abrirModalEditar(p)}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all duration-200 flex-shrink-0"
      title="Editar"
    >
      <IconEdit />
    </button>
    <button
      onClick={() => eliminarParticipante(p.id)}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200 flex-shrink-0"
      title="Eliminar"
    >
      <IconTrash />
    </button>
  </>
)}
                    {sinCiclo ? (
                      <span className="text-[10px] px-3 py-1 rounded-full bg-red-50 text-red-700 font-medium border border-red-200 whitespace-nowrap">Sin ciclo</span>
                    ) : completo ? (
                      <span className="text-[10px] px-3 py-1 rounded-full bg-violet-100 text-violet-700 font-medium border border-violet-200 whitespace-nowrap">Completo</span>
                    ) : (
                      <span className="text-[10px] px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-medium border border-violet-200 whitespace-nowrap">Ciclo {p.numero_ciclo}</span>
                    )}
                  </div>
                </div>

                {/* Costo, método de pago y estado de pago - solo visible para Administrador/Supervisor/Recepcionista */}
{usuario?.rol !== 'profesional' && !sinCiclo && p.monto > 0 && (
  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
    <span className="text-gray-400">Costo ciclo:</span>
    <span className="font-bold text-gray-700">Bs {p.monto}</span>
    {p.metodo_pago && (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{p.metodo_pago}</span>
    )}
    <BadgePago estado={estadoPago} deuda={deuda} />
  </div>
)}

                {p.actividades_ids && p.actividades_ids.length > 0 && !sinCiclo && (
  <div className="mb-3 space-y-2">
    {p.actividades_ids
      .filter((actId: number) => {
        // Si es profesional, solo mostrar sus actividades
        if (usuario?.rol === 'profesional') {
          return actividadesDelProfesional.includes(actId);
        }
        return true; // Administrador/Supervisor/Recepcionista ven todo
      })
      .map((actId: number) => {
        const act = actividades.find(a => a.id === actId);
        if (!act) return null;
        const asistidasAct = parseInt(p.asistencia_por_actividad?.[actId] || 0);
        const porcentajeAct = Math.min((asistidasAct / 4) * 100, 100);
        const pendienteAct = actividadPendienteHoy(act, p);
        return (
          <div key={actId}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-[10px] font-medium uppercase tracking-wide truncate ${pendienteAct ? 'text-amber-700 font-bold' : 'text-gray-600'}`}>
                {pendienteAct && '⏰ '}{act.nombre.split(' ')[0]}
              </span>
              <span className={`text-[10px] font-semibold ${asistidasAct >= 4 ? 'text-emerald-600' : pendienteAct ? 'text-amber-600' : 'text-gray-400'} whitespace-nowrap ml-2`}>
                {asistidasAct}/4{asistidasAct >= 4 ? ' ✓' : ''}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${asistidasAct >= 4 ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                style={{ width: `${porcentajeAct}%` }}
              />
            </div>
          </div>
        );
      })}
  </div>
)}

               {/* Progreso general - solo visible para Administrador/Supervisor/Recepcionista */}
{usuario?.rol !== 'profesional' && !sinCiclo && totalEsperadas > 0 && (
  <div className="mb-3">
    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
      <span>Progreso: {totalMarcadas} / {totalEsperadas} clases</span>
      <span className={completo ? 'text-violet-600 font-bold' : 'text-violet-600 font-medium'}>
        {Math.round(progreso)}%{completo && ' ✓'}
      </span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-500 rounded-full ${completo ? 'bg-violet-500' : 'bg-violet-500'}`}
        style={{ width: `${progreso}%` }}
      />
    </div>
  </div>
)}

                {!sinCiclo && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-emerald-50 rounded-xl p-2 text-center border border-emerald-100">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Asistió</p>
                      <p className="text-lg font-bold text-emerald-600">{asistidas}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-2 text-center border border-red-100">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Falta</p>
                      <p className="text-lg font-bold text-red-600">{faltas}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-2 text-center border border-yellow-100">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Permiso</p>
                      <p className="text-lg font-bold text-yellow-600">{permisos}</p>
                    </div>
                  </div>
                )}

               {/* Solo Administrador/Supervisor/Recepcionista ven Contactar y Emergencia */}
{usuario?.rol !== 'profesional' && (
  <div className="mt-3 grid grid-cols-2 gap-2">
    <button
      onClick={() => {
        if (p.telefono) {
          setModalContactarParticipante(p);
        } else {
          alert('Este participante no tiene número de teléfono registrado');
        }
      }}
      className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
      Contactar
    </button>

    <button
      onClick={() => {
        if (p.contacto_nombre || p.contacto_telefono) {
          setModalContactoEmergencia(p);
        } else {
          alert('Este participante no tiene registrado un contacto de emergencia');
        }
      }}
      className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 ${
        (p.contacto_nombre || p.contacto_telefono)
          ? 'bg-violet-100 hover:bg-violet-200 text-violet-700 border border-violet-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200 cursor-pointer'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
      Emergencia
      {(p.contacto_nombre || p.contacto_telefono) && (
        <span className="ml-auto text-[10px] bg-white/20 rounded-full px-2 py-0.5">!</span>
      )}
    </button>
  </div>
)}

            <div className="flex gap-2 mt-2">
  {sinCiclo ? (
    /* Solo Administrador/Supervisor/Recepcionista pueden iniciar ciclo */
    usuario?.rol !== 'profesional' ? (
      <button
        onClick={() => {
          setFormRenovar({
            ...formRenovar,
            actividades_ids: p.actividades_ids || [],
          });
          setModalRenovar(p);
        }}
        className="flex-1 px-3 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-medium hover:bg-violet-700 transition-all shadow-lg shadow-violet-200"
      >
        + Iniciar ciclo
      </button>
    ) : (
      <button
        disabled
        className="flex-1 px-3 py-2.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
      >
        Sin ciclo
      </button>
    )
  ) : (
    <>
      <button
        onClick={() => abrirModalAsistencia(p)}
        className="flex-1 px-3 py-2.5 bg-violet-50 text-violet-700 rounded-xl text-xs font-medium hover:bg-violet-100 transition-all border border-violet-200"
      >
        Marcar asistencia
      </button>
      {/* Renovar ciclo - solo visible para Administrador/Supervisor/Recepcionista */}
      {usuario?.rol !== 'profesional' && completo ? (
        <button
          onClick={() => {
            setFormRenovar({
              fecha_inicio: new Date().toISOString().split('T')[0],
              monto: p.monto || 200,
              monto_pagado: 0,
              metodo_pago: 'efectivo',
              actividades_ids: p.actividades_ids || [],
            });
            setModalRenovar(p);
          }}
          className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all bg-violet-500 text-white hover:bg-violet-600 shadow-lg shadow-violet-200"
        >
          Renovar ciclo
        </button>
      ) : (
        usuario?.rol !== 'profesional' && (
          <button
            disabled
            className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
            title="Debes completar el 100% del ciclo para renovar"
          >
            Renovar
          </button>
        )
      )}
    </>
  )}
</div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* ── MODAL CONTACTO DE EMERGENCIA ── */}
      {modalContactoEmergencia && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-[#efedf0] animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-5 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate">Contacto de emergencia</h3>
                    <p className="text-xs text-white/80 truncate">{modalContactoEmergencia.nombre}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setModalContactoEmergencia(null)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all text-sm font-bold flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {modalContactoEmergencia.contacto_relacion && (
                  <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Relación</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{modalContactoEmergencia.contacto_relacion}</p>
                    </div>
                  </div>
                )}

                {modalContactoEmergencia.contacto_nombre && (
                  <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Nombre completo</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{modalContactoEmergencia.contacto_nombre}</p>
                    </div>
                  </div>
                )}

                {modalContactoEmergencia.contacto_telefono && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                        <line x1="12" y1="18" x2="12.01" y2="18"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Teléfono</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{modalContactoEmergencia.contacto_telefono}</p>
                    </div>
                  </div>
                )}
              </div>

              {modalContactoEmergencia.contacto_telefono && (
                <div className="mt-5 space-y-3">
                  <a
                    href={`tel:${modalContactoEmergencia.contacto_telefono}`}
                    className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-violet-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    Llamar ahora
                  </a>

                  <a
                    href={`https://wa.me/${modalContactoEmergencia.contacto_telefono.replace(/\s/g, '').replace(/^0+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-green-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    WhatsApp
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={() => setModalContactoEmergencia(null)} 
                className="w-full border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-100 transition-all font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONTACTAR PARTICIPANTE ── */}
      {modalContactarParticipante && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-[#efedf0] animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-violet-500 to-teal-600 p-5 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate">Contactar a</h3>
                    <p className="text-xs text-white/80 truncate">{modalContactarParticipante.nombre}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setModalContactarParticipante(null)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all text-sm font-bold flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Participante</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{modalContactarParticipante.nombre}</p>
                  </div>
                </div>

                {modalContactarParticipante.telefono && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                        <line x1="12" y1="18" x2="12.01" y2="18"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Teléfono</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{modalContactarParticipante.telefono}</p>
                    </div>
                  </div>
                )}
              </div>

              {modalContactarParticipante.telefono && (
                <div className="mt-5 space-y-3">
                  <a
                    href={`tel:${modalContactarParticipante.telefono}`}
                    className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-violet-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    Llamar ahora
                  </a>

                  <a
                    href={`https://wa.me/${modalContactarParticipante.telefono.replace(/\s/g, '').replace(/^0+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-green-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    WhatsApp
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={() => setModalContactarParticipante(null)} 
                className="w-full border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-100 transition-all font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL HISTORIAL DE CICLOS ── */}
      {modalHistorial && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#efedf0]">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-3xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <IconClock size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 text-lg truncate">{modalHistorial.participante?.nombre}</h3>
                  <p className="text-xs text-gray-400">Historial de ciclos</p>
                </div>
              </div>
              <button onClick={() => setModalHistorial(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all text-sm font-bold flex-shrink-0">✕</button>
            </div>

            <div className="p-4 sm:p-5">
              {cargandoHistorial ? (
                <div className="text-center py-8 text-gray-400">Cargando historial...</div>
              ) : modalHistorial.ciclos?.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No hay ciclos registrados</div>
              ) : (
                <div className="space-y-3">
                  {modalHistorial.ciclos.map((ciclo: any) => {
                    const esActivo = ciclo.ciclo_estado === 'activo';
                    const estadoPago = ciclo.estado_pago || 'pagado';
                    const deuda = Number(ciclo.deuda || 0);

                    return (
                      <div
                        key={ciclo.id}
                        className={`rounded-2xl border p-4 transition-all ${esActivo ? 'border-violet-300 bg-violet-50/30' : 'border-gray-100 bg-gray-50/30'}`}
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${esActivo ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                              Ciclo {ciclo.numero_ciclo}
                            </span>
                            {esActivo && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-medium">Activo</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <BadgePago estado={estadoPago} deuda={deuda} />
                            <button
                              onClick={() => abrirModalPago(ciclo)}
                              className="text-[10px] px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all font-medium whitespace-nowrap"
                            >
                              Editar pago
                            </button>
                            <button
                              onClick={() => setReciboPago({ ...ciclo, participante: modalHistorial.participante })}
                              className="text-[10px] px-2.5 py-1 rounded-full border border-violet-200 text-violet-600 hover:bg-violet-50 hover:text-violet-700 transition-all font-medium flex items-center gap-1 whitespace-nowrap"
                            >
                              <IconReceipt /> Recibo
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Fecha inicio</p>
                            <p className="text-sm text-gray-700 font-medium">
                              {new Date(ciclo.fecha_inicio).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Pago</p>
                            <p className="text-sm text-gray-700 font-medium">
                              Bs {ciclo.monto_pagado != null ? Number(ciclo.monto_pagado).toFixed(0) : '—'}
                              <span className="text-gray-400"> / Bs {Number(ciclo.monto).toFixed(0)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white rounded-xl p-2 text-center border border-emerald-100">
                            <p className="text-[10px] text-gray-500 uppercase font-medium">Asistió</p>
                            <p className="text-base font-bold text-emerald-600">{ciclo.clases_asistidas}</p>
                          </div>
                          <div className="bg-white rounded-xl p-2 text-center border border-red-100">
                            <p className="text-[10px] text-gray-500 uppercase font-medium">Falta</p>
                            <p className="text-base font-bold text-red-500">{ciclo.clases_falta}</p>
                          </div>
                          <div className="bg-white rounded-xl p-2 text-center border border-yellow-100">
                            <p className="text-[10px] text-gray-500 uppercase font-medium">Permiso</p>
                            <p className="text-base font-bold text-yellow-500">{ciclo.clases_permiso}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <button
                            onClick={() => abrirDetalleAsistencias(ciclo)}
                            className="w-full text-xs py-2 rounded-xl border border-violet-200 text-violet-600 hover:bg-violet-50 transition-all font-medium"
                          >
                            Ver detalle de asistencias
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-gray-100">
              <button onClick={() => setModalHistorial(null)} className="w-full border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALLE ASISTENCIAS POR CICLO ── */}
      {modalDetalleAsistencias && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#efedf0]">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-3xl">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-800 text-lg truncate">
                  Asistencias - Ciclo {modalDetalleAsistencias.ciclo.numero_ciclo}
                </h3>
                <p className="text-xs text-gray-400 truncate">
                  Inicio: {new Date(modalDetalleAsistencias.ciclo.fecha_inicio).toLocaleDateString('es')}
                </p>
              </div>
              <button 
                onClick={() => setModalDetalleAsistencias(null)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all text-sm font-bold flex-shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {cargandoAsistenciasDetalle ? (
                <div className="text-center py-8 text-gray-400">Cargando asistencias...</div>
              ) : modalDetalleAsistencias.asistencias?.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No hay registros de asistencia para este ciclo</div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 mb-4 pb-3 border-b border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase">Fecha</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Actividad</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase text-center">Estado</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase text-center">Día</div>
                  </div>
                  {modalDetalleAsistencias.asistencias
                    .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                    .map((a: any) => {
                      const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
                        asistio: { label: '✓ Asistió', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        falta: { label: '✗ Falta', color: 'text-red-600', bg: 'bg-red-50' },
                        permiso: { label: 'P Permiso', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                        suspendida: { label: '— Suspendida', color: 'text-gray-500', bg: 'bg-gray-100' },
                      };
                      const config = estadoConfig[a.estado] || estadoConfig.falta;
                      const fecha = new Date(a.fecha);
                      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      
                      return (
                        <div key={a.id} className={`grid grid-cols-4 gap-2 p-3 rounded-xl ${config.bg} border border-gray-100`}>
                          <div className="text-sm font-medium text-gray-700 truncate">
                            {fecha.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                          <div className="text-sm font-medium text-gray-700 truncate">
                            {a.actividad_nombre || 'Actividad'}
                          </div>
                          <div className={`text-sm font-semibold text-center ${config.color}`}>
                            {config.label}
                          </div>
                          <div className="text-xs text-gray-500 text-center">
                            {diasSemana[fecha.getDay()]}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-gray-100">
              <button onClick={() => setModalDetalleAsistencias(null)} className="w-full border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR PAGO ── */}
      {modalPago && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <form onSubmit={guardarPago} className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl border border-[#efedf0]">
            <div className="flex justify-between items-center mb-6">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-800">Editar pago</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">Ciclo {modalPago.numero_ciclo} · Costo: Bs {Number(modalPago.monto).toFixed(0)}</p>
              </div>
              <button type="button" onClick={() => setModalPago(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all text-sm font-bold flex-shrink-0">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Monto pagado Bs</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={modalPago.monto}
                  step="0.01"
                  value={formPago.monto_pagado}
                  onChange={e => setFormPago({ ...formPago, monto_pagado: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                />
                {Number(formPago.monto_pagado) < Number(modalPago.monto) && (
                  <p className="text-xs text-orange-500 mt-1.5 font-medium">
                    Deuda pendiente: Bs {(Number(modalPago.monto) - Number(formPago.monto_pagado)).toFixed(0)}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Método de pago</label>
                <select
                  value={formPago.metodo_pago}
                  onChange={e => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="qr">QR</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setModalPago(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">Cancelar</button>
              <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-violet-200">Guardar</button>
            </div>
          </form>
        </div>
      )}

           {/* ── MODAL EDITAR PARTICIPANTE ── */}
      {modalEditar !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <form onSubmit={guardarEdicion} className="bg-white rounded-3xl w-full max-w-lg md:max-w-3xl shadow-2xl border border-[#efedf0] max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-800">Editar participante</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">Modifica los datos del participante</p>
              </div>
              <button type="button" onClick={() => setModalEditar(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all text-sm font-bold flex-shrink-0">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 md:items-start">

                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Nombre completo</label>
                    <input type="text" required value={formEditar.nombre} onChange={e => setFormEditar({ ...formEditar, nombre: e.target.value })} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Carnet</label>
                      <input type="text" value={formEditar.carnet} onChange={e => setFormEditar({ ...formEditar, carnet: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Teléfono</label>
                      <input type="text" value={formEditar.telefono} onChange={e => setFormEditar({ ...formEditar, telefono: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Fecha de nacimiento</label>
                    <input type="date" value={formEditar.fecha_nac} onChange={e => setFormEditar({ ...formEditar, fecha_nac: e.target.value })} className={inputCls} />
                  </div>

                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">📞 Contacto de emergencia</p>
                    <div className="space-y-3">
                      <div>
                        <label className={labelCls}>Relación</label>
                        <input type="text" placeholder="Ej: Hija" value={formEditar.contacto_relacion} onChange={e => setFormEditar({ ...formEditar, contacto_relacion: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Nombre completo</label>
                        <input type="text" placeholder="Nombre completo" value={formEditar.contacto_nombre} onChange={e => setFormEditar({ ...formEditar, contacto_nombre: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Teléfono</label>
                        <input type="tel" placeholder="Número de teléfono" value={formEditar.contacto_telefono} onChange={e => setFormEditar({ ...formEditar, contacto_telefono: e.target.value })} className={inputCls} />
                      </div>
                    </div>
                  </div>
                </div>
              <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Actividades del ciclo actual</p>
                    <div className="space-y-2">
                      {actividades.map(act => (
                        <label key={act.id} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-violet-50 transition-all border border-transparent hover:border-violet-100">
                          <input
                            type="checkbox"
                            checked={formEditar.actividades_ids?.includes(act.id)}
                            onChange={() => {
                              const ids = formEditar.actividades_ids || [];
                              setFormEditar({ ...formEditar, actividades_ids: ids.includes(act.id) ? ids.filter((id: number) => id !== act.id) : [...ids, act.id] });
                            }}
                            className="rounded accent-violet-600 flex-shrink-0"
                          />
                          <span className="text-sm text-gray-700 font-medium truncate">{act.nombre}</span>
                          <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">{act.dia}</span>
                        </label>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Pago del ciclo actual</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Fecha inicio</label>
                      <input type="date" value={formEditar.fecha_inicio} onChange={e => setFormEditar({ ...formEditar, fecha_inicio: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Monto Bs</label>
                      <input type="number" value={formEditar.monto} onChange={e => setFormEditar({ ...formEditar, monto: Number(e.target.value) })} className={inputCls} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={labelCls}>Método de pago</label>
                    <select value={formEditar.metodo_pago} onChange={e => setFormEditar({ ...formEditar, metodo_pago: e.target.value })} className={inputCls}>
                      <option value="efectivo">Efectivo</option>
                      <option value="qr">QR</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                </div>
              </div>
                
              </div>
            </div>

            <div className="flex gap-2 p-5 sm:p-6 border-t border-gray-100 flex-shrink-0">
              <button type="button" onClick={() => setModalEditar(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">Cancelar</button>
              <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-violet-200">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}

            {/* ── MODAL NUEVO PARTICIPANTE ── */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <form onSubmit={crearParticipante} className="bg-white rounded-3xl w-full max-w-lg md:max-w-3xl shadow-2xl border border-[#efedf0] max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-800">Inscribir participante</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">Completa los datos del nuevo participante</p>
              </div>
              <button type="button" onClick={() => setModalNuevo(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all text-sm font-bold flex-shrink-0">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 md:items-start">

                                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Nombre completo</label>
                    <input type="text" placeholder="Nombre completo" required value={nuevoForm.nombre} onChange={e => setNuevoForm({ ...nuevoForm, nombre: e.target.value })} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Carnet</label>
                      <input type="text" placeholder="Carnet" value={nuevoForm.carnet} onChange={e => setNuevoForm({ ...nuevoForm, carnet: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Teléfono</label>
                      <input type="text" placeholder="Teléfono" value={nuevoForm.telefono} onChange={e => setNuevoForm({ ...nuevoForm, telefono: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Fecha de nacimiento</label>
                    <input type="date" value={nuevoForm.fecha_nac} onChange={e => setNuevoForm({ ...nuevoForm, fecha_nac: e.target.value })} className={inputCls} />
                  </div>

                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">📞 Contacto de emergencia</p>
                    <div className="space-y-3">
                      <div>
                        <label className={labelCls}>Relación</label>
                        <input type="text" placeholder="Ej: Hija" value={nuevoForm.contacto_relacion} onChange={e => setNuevoForm({ ...nuevoForm, contacto_relacion: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Nombre completo</label>
                        <input type="text" placeholder="Nombre completo" value={nuevoForm.contacto_nombre} onChange={e => setNuevoForm({ ...nuevoForm, contacto_nombre: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Teléfono</label>
                        <input type="tel" placeholder="Número de teléfono" value={nuevoForm.contacto_telefono} onChange={e => setNuevoForm({ ...nuevoForm, contacto_telefono: e.target.value })} className={inputCls} />
                      </div>
                    </div>
                  </div>

                  
                </div>

                

                <div className="border-t border-gray-100 pt-4 md:border-t-0 md:pt-0 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Seleccionar actividades</p>
                    <div className="space-y-2">
                      {actividades.map(act => (
                        <label key={act.id} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-violet-50 transition-all border border-transparent hover:border-violet-100">
                          <input
                            type="checkbox"
                            checked={actividadesSeleccionadas.includes(act.id)}
                            onChange={() => toggleActividad(act.id)}
                            className="rounded accent-violet-600 flex-shrink-0"
                          />
                          <span className="text-sm text-gray-700 font-medium truncate">{act.nombre}</span>
                          <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">{act.dia}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Primer ciclo</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Fecha inicio</label>
                        <input type="date" required value={nuevoForm.fecha_inicio} onChange={e => setNuevoForm({ ...nuevoForm, fecha_inicio: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Monto Bs</label>
                        <input type="number" placeholder="0" required value={nuevoForm.monto} onChange={e => setNuevoForm({ ...nuevoForm, monto: Number(e.target.value) })} className={inputCls} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className={labelCls}>Método de pago</label>
                      <select value={nuevoForm.metodo_pago} onChange={e => setNuevoForm({ ...nuevoForm, metodo_pago: e.target.value })} className={inputCls}>
                        <option value="efectivo">Efectivo</option>
                        <option value="qr">QR</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-5 sm:p-6 border-t border-gray-100 flex-shrink-0">
              <button type="button" onClick={() => setModalNuevo(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">Cancelar</button>
              <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-violet-200">Inscribir</button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL RENOVAR CICLO ── */}
      {modalRenovar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <form onSubmit={renovarCiclo} className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-[#efedf0]">
            <div className="flex justify-between items-center mb-6">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-800">Nuevo ciclo</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{modalRenovar.nombre}</p>
              </div>
              <button type="button" onClick={() => setModalRenovar(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all text-sm font-bold flex-shrink-0">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Fecha inicio</label>
                <input type="date" required value={formRenovar.fecha_inicio} onChange={e => setFormRenovar({ ...formRenovar, fecha_inicio: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Monto total Bs</label>
                <input type="number" required min={0} value={formRenovar.monto} onChange={e => setFormRenovar({ ...formRenovar, monto: Number(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Monto pagado Bs</label>
                <input type="number" required min={0} max={formRenovar.monto} step="0.01" value={formRenovar.monto_pagado} onChange={e => setFormRenovar({ ...formRenovar, monto_pagado: Number(e.target.value) })} className={inputCls} />
                {formRenovar.monto_pagado < formRenovar.monto && (
                  <p className="text-xs text-orange-500 mt-1.5 font-medium">
                    Deuda pendiente: Bs {(formRenovar.monto - formRenovar.monto_pagado).toFixed(0)}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Método de pago</label>
                <select value={formRenovar.metodo_pago} onChange={e => setFormRenovar({ ...formRenovar, metodo_pago: e.target.value })} className={inputCls}>
                  <option value="efectivo">Efectivo</option>
                  <option value="qr">QR</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setModalRenovar(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">Cancelar</button>
              <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-violet-200">Confirmar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL ASISTENCIA ── */}
      {modalAsistencia && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#efedf0]">
            <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-3xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 text-lg truncate">{modalAsistencia.nombre}</h3>
                  <p className="text-xs text-gray-400 truncate">
                    Ciclo {modalAsistencia.numero_ciclo} · Inicio: {new Date(modalAsistencia.fecha_inicio).toLocaleDateString('es')}
                  </p>
                </div>
              </div>
              <button onClick={() => { setModalAsistencia(null); setAsistenciaDetalle([]); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all text-sm font-bold flex-shrink-0">✕</button>
            </div>

            <div className="p-4 sm:p-5 overflow-x-auto">
              {(() => {
                const todasSesiones = (modalAsistencia.actividades_ids || []).map((actId: number) => {
                  const act = actividades.find(a => a.id === actId);
                  if (!act) return 4;
                  const asistenciaActividad = asistenciaDetalle.filter(a => a.activity_id === actId);
                  return calcularSesiones(act, modalAsistencia.fecha_inicio, asistenciaActividad).length;
                });
                const maxSesiones = Math.max(4, ...todasSesiones);

                return (
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60">
                        <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32 sm:w-48">Actividad</th>
                        {Array.from({ length: maxSesiones }, (_, i) => (
                          <th key={i} className="text-center py-3 px-1 sm:px-2 text-xs font-semibold text-gray-500 uppercase">S{i + 1}</th>
                        ))}
                        <th className="text-center py-3 px-1 sm:px-2 text-xs font-semibold text-emerald-600 uppercase">Asistió</th>
                        <th className="text-center py-3 px-1 sm:px-2 text-xs font-semibold text-red-500 uppercase">Falta</th>
                        <th className="text-center py-3 px-1 sm:px-2 text-xs font-semibold text-yellow-500 uppercase">Permiso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                     {(modalAsistencia.actividades_ids || [])
  .filter((actId: number) => {
    // Si es profesional, solo mostrar sus actividades
    if (usuario?.rol === 'profesional') {
      return actividadesDelProfesional.includes(actId);
    }
    return true; // Administrador/Supervisor/Recepcionista ven todo
  })
  .map((actId: number) => {
    const act = actividades.find(a => a.id === actId);
    if (!act) return null;
    const asistenciaActividad = asistenciaDetalle.filter(a => a.activity_id === actId);
    const sesiones = calcularSesiones(act, modalAsistencia.fecha_inicio, asistenciaActividad);
    const conteo = { asistio: 0, falta: 0, permiso: 0 };
    asistenciaActividad.forEach(a => {
      if (a.estado === 'asistio') conteo.asistio++;
      else if (a.estado === 'falta') conteo.falta++;
      else if (a.estado === 'permiso') conteo.permiso++;
    });

    return (
      <tr key={actId} className="hover:bg-gray-50/50 transition-all">
        <td className="py-3 px-3 sm:px-4">
          <p className="font-semibold text-gray-800 text-xs truncate">{act.nombre}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{act.dia} · {act.hora_inicio?.slice(0, 5)}-{act.hora_fin?.slice(0, 5)}</p>
        </td>
        {sesiones.map((fechaSesion, idx) => {
          const fechaStr = fechaSesion.toISOString().split('T')[0];
          const registro = asistenciaActividad.find(a => a.fecha?.split('T')[0] === fechaStr);
          const esHoy = fechaStr === hoy;
          const esPasada = fechaSesion <= new Date();
          const colorActivo =
            registro?.estado === 'asistio'    ? 'bg-emerald-500 text-white' :
            registro?.estado === 'falta'      ? 'bg-red-400 text-white' :
            registro?.estado === 'permiso'    ? 'bg-yellow-400 text-white' :
            registro?.estado === 'suspendida' ? 'bg-gray-400 text-white' : '';

          return (
            <td key={idx} className="py-3 px-1 sm:px-2 text-center">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[9px] text-gray-400">{fechaSesion.toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                {(esHoy || esPasada) ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuAbierto(prev => 
                          prev?.actividadId === actId && prev?.sesionIdx === idx 
                            ? null 
                            : { actividadId: actId, sesionIdx: idx }
                        );
                      }}
                      className={`asistencia-trigger w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-bold border-2 cursor-pointer transition-all ${
                        registro ? `${colorActivo} border-transparent` : 'border-dashed border-gray-300 text-gray-300 hover:border-violet-400 hover:text-violet-400'
                      } ${esHoy ? 'ring-2 ring-violet-400 ring-offset-1' : ''}`}
                    >
                      {registro?.estado === 'asistio' ? '✓' : registro?.estado === 'falta' ? '✗' : registro?.estado === 'permiso' ? 'P' : registro?.estado === 'suspendida' ? '—' : '+'}
                    </button>
                    
                    {menuAbierto?.actividadId === actId && menuAbierto?.sesionIdx === idx && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex flex-col items-center z-20">
                        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 flex gap-1">
                          {[
                            { estado: 'asistio', icon: '✓', cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                            { estado: 'falta', icon: '✗', cls: 'bg-red-100 text-red-700 hover:bg-red-200' },
                            { estado: 'permiso', icon: 'P', cls: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                            { estado: 'suspendida', icon: '—', cls: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                          ].map(({ estado, icon, cls }) => (
                            <button
                              key={estado}
                              type="button"
                              onClick={() => {
                                if (registro?.estado === estado) {
                                  eliminarAsistencia(actId, fechaStr);
                                } else {
                                  registrarAsistencia(actId, estado, fechaStr);
                                }
                                setMenuAbierto(null);
                              }}
                              title={estado}
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-bold transition-all ${cls} ${registro?.estado === estado ? 'ring-2 ring-offset-1 ring-violet-400' : ''}`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                        <div className="w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 -mt-1"></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-dashed border-gray-200 flex items-center justify-center">
                    <span className="text-[10px] text-gray-200">·</span>
                  </div>
                )}
              </div>
            </td>
          );
        })}
        {Array.from({ length: maxSesiones - sesiones.length }, (_, i) => (
          <td key={`empty-${i}`} className="py-3 px-1 sm:px-2 text-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-dashed border-gray-100 flex items-center justify-center mx-auto">
              <span className="text-[10px] text-gray-200">·</span>
            </div>
          </td>
        ))}
        <td className="py-3 px-1 sm:px-2 text-center">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto border border-emerald-100">
            <span className="text-sm font-bold text-emerald-600">{conteo.asistio}</span>
          </div>
        </td>
        <td className="py-3 px-1 sm:px-2 text-center">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-50 flex items-center justify-center mx-auto border border-red-100">
            <span className="text-sm font-bold text-red-500">{conteo.falta}</span>
          </div>
        </td>
        <td className="py-3 px-1 sm:px-2 text-center">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-yellow-50 flex items-center justify-center mx-auto border border-yellow-100">
            <span className="text-sm font-bold text-yellow-500">{conteo.permiso}</span>
          </div>
        </td>
      </tr>
    );
  })}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            <div className="p-4 sm:p-5 border-t border-gray-100">
              <button
                onClick={() => { setModalAsistencia(null); setAsistenciaDetalle([]); }}
                className="w-full border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RECIBO ────────────────────────────────────────────────────── */}
      {reciboPago && (
        <ReciboModal 
          pago={reciboPago} 
          actividades={actividades}
          onClose={() => setReciboPago(null)} 
        />
      )}
    </div>
  );
}

// ── COMPONENTE RECIBO MODAL ────────────────────────────────────────────────

function ReciboModal({ pago, actividades, onClose }: { pago: any; actividades: any[]; onClose: () => void }) {
  function imprimir() {
    window.print();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 recibo-overlay">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl recibo-modal-shell">
        {/* Barra de acciones (no se imprime) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl no-print">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <IconReceipt /> Recibo de pago
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={imprimir}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-all shadow-md shadow-violet-200"
            >
              <IconPrinter /> Imprimir
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all flex-shrink-0"
            >
              <IconX />
            </button>
          </div>
        </div>

        {/* Hoja tamaño carta con las dos mitades */}
        <div className="p-4 bg-gray-100 recibo-print-wrapper">
          <div className="recibo-pagina">
            <ReciboMitad 
              pago={pago} 
              actividades={actividades}
              etiqueta="ORIGINAL" 
              subtexto="Conserva el participante" 
            />
            <div className="recibo-linea-corte">
              <svg width="100%" height="2" className="recibo-tijera-svg">
                <line x1="0" y1="1" x2="100%" y2="1" stroke="#c4c4c4" strokeWidth="1.5" strokeDasharray="6,5" />
              </svg>
              <span className="recibo-tijera-icono">✂</span>
            </div>
            <ReciboMitad 
              pago={pago} 
              actividades={actividades}
              etiqueta="COPIA" 
              subtexto="Conserva recepción" 
            />
          </div>
        </div>
      </div>

      <style>{`
        .recibo-pagina {
          background: white;
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
          aspect-ratio: 8.5 / 11;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 8px rgba(0,0,0,0.08);
        }
        .recibo-mitad {
          flex: 1;
          padding: 22px 28px;
          display: flex;
          flex-direction: column;
        }
        .recibo-linea-corte {
          position: relative;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .recibo-tijera-svg { position: absolute; left: 0; top: 50%; transform: translateY(-50%); }
        .recibo-tijera-icono {
          position: relative;
          background: white;
          padding: 0 8px;
          font-size: 11px;
          color: #b0b0b0;
          z-index: 1;
        }

        @media (max-width: 640px) {
          .recibo-mitad {
            padding: 16px 18px;
          }
          .recibo-pagina {
            aspect-ratio: unset;
            min-height: 90vh;
          }
        }

        @media print {
          body * { visibility: hidden; }
          .recibo-print-wrapper, .recibo-print-wrapper * { visibility: visible; }
          .recibo-print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            background: white !important;
          }
          .recibo-pagina {
            width: 8.5in;
            height: 11in;
            max-width: none;
            aspect-ratio: unset;
            box-shadow: none;
            margin: 0;
          }
          .no-print { display: none !important; }
          .recibo-overlay {
            position: absolute;
            background: white !important;
            backdrop-filter: none !important;
          }
          .recibo-modal-shell {
            box-shadow: none !important;
            max-height: none !important;
            overflow: visible !important;
          }
          @page { size: letter; margin: 0; }
        }
      `}</style>
    </div>
  );
}

// ── COMPONENTE MITAD DE RECIBO ─────────────────────────────────────────────

function ReciboMitad({ pago, actividades, etiqueta, subtexto }: { pago: any; actividades: any[]; etiqueta: string; subtexto: string }) {
  const logo = LOGO_ABRAZANDO_VIDAS;
  const centro = 'Abrazando Vidas';
  const fechaEmision = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  const fechaPago = pago.fecha_inicio ? new Date(pago.fecha_inicio).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  
  // Obtener actividades con día, nombre y horario
  const actividadesTexto = obtenerActividadesConDiaHorario(pago, actividades);

  return (
    <div className="recibo-mitad">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f3f4f6', paddingBottom: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={logo} alt={centro} style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 800, color: '#1f2937', lineHeight: 1.15, fontSize: 17, margin: 0, letterSpacing: '-0.01em' }}>{centro}</p>
            <p style={{ color: '#9ca3af', fontSize: 10.5, margin: '3px 0 0' }}>Recibo de pago por servicio</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', padding: '5px 12px', borderRadius: 9999, fontWeight: 800, letterSpacing: '0.08em', fontSize: 10.5, background: '#f3e8ff', color: '#A000D1' }}>
            {etiqueta}
          </span>
          <p style={{ color: '#9ca3af', margin: '5px 0 0', fontSize: 9.5 }}>{subtexto}</p>
        </div>
      </div>

      {/* ── DATOS DEL PARTICIPANTE ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 4 }}>
        <CampoRecibo label="Participante" value={pago.participante?.nombre || pago.nombre || '—'} ancho="33%" />
        <CampoRecibo label="Área" value="Gerontología" ancho="33%" />
        <CampoRecibo label="Fecha de inicio" value={fechaPago} ancho="34%" />
      </div>

      {/* ── ACTIVIDADES ── */}
      <div style={{ marginBottom: 10, width: '100%' }}>
        <p style={{ color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 8.5, margin: 0, fontWeight: 600 }}>Actividades</p>
        <div style={{ 
          fontWeight: 500, 
          color: '#1f2937', 
          margin: '4px 0 0', 
          fontSize: 12.5,
          whiteSpace: 'pre-line',
          lineHeight: 1.6,
          background: '#faf5ff',
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid #f3e8ff',
          width: '100%'
        }}>
          {actividadesTexto}
        </div>
      </div>

      {/* ── PAGO ── */}
      <div style={{ borderRadius: 14, marginTop: 6, marginBottom: 16, background: '#faf5ff', border: '1px solid #ecd9ff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ color: '#A000D1', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 9, margin: 0, fontWeight: 700, opacity: 0.7 }}>Método de pago</p>
          <p style={{ fontWeight: 700, color: '#374151', fontSize: 13.5, margin: '4px 0 0', textTransform: 'capitalize' }}>{pago.metodo_pago || '—'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#A000D1', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 9, margin: 0, fontWeight: 700, opacity: 0.7 }}>Monto pagado</p>
          <p style={{ fontWeight: 800, fontSize: 22, color: '#A000D1', margin: '4px 0 0' }}>Bs {Number(pago.monto_pagado || pago.monto || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Fecha de emisión */}
      <p style={{ color: '#b0b0b0', fontSize: 9.5, margin: '0 0 auto' }}>Emitido el {fechaEmision}</p>

      {/* Firma */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 18, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ textAlign: 'center', width: '55%', minWidth: 120 }}>
          <div style={{ borderTop: '1px solid #9ca3af', marginBottom: 5 }} />
          <p style={{ color: '#6b7280', fontSize: 9.5, margin: 0 }}>Firma del participante</p>
        </div>
        <p style={{ color: '#d1d5db', fontSize: 8, margin: 0 }}>Generado por sistema</p>
      </div>
    </div>
  );
}

// ── COMPONENTE CAMPO DE RECIBO ─────────────────────────────────────────────

function CampoRecibo({ label, value, ancho }: { label: string; value: string; ancho?: string }) {
  return (
    <div style={{ width: ancho || '50%', marginBottom: 10, paddingRight: 10, boxSizing: 'border-box' }}>
      <p style={{ color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 8.5, margin: 0, fontWeight: 600 }}>{label}</p>
      <p style={{ fontWeight: 600, color: '#1f2937', margin: '3px 0 0', fontSize: 12.5 }}>{value || '—'}</p>
    </div>
  );
}