import React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getCitas, actualizarCitaService, crearCita, crearMultiplesCitas, crearCitaGrupal, eliminarCitaService } from '../services/citas.service';
import { getTodosHorariosProfesionales, getProfesionales, getServicios, getSecciones } from '../services/admin.service';import { getPacientes } from '../services/pacientes.service';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ReservasPublicasPanel from '../components/ui/ReservasPublicasPanel';
import BloqueosAgendaPanel from '../components/ui/BloqueosAgendaPanel';
import SesionesGrupalesPanel from '../components/ui/SesionesGrupalesPanel';
import SesionGrupalAsistenciaModal from '../components/ui/SesionGrupalAsistenciaModal';
import { getBloqueos } from '../services/bloqueosAgenda.service';
import { getSesionesGrupales } from '../services/sesionesGrupales.service';
import { DIAS_SEMANA, DIAS_JS, MESES, DIAS_CORTOS_SEM } from '../utils/dias';
import { capitalizarTexto } from '../utils/texto';
import { useIsMobile } from '../hooks/useIsMobile';
import { PALETA_COLORES_PACIENTE, COLOR_COMPLETADO } from '../utils/agendaColors';
import { formatFecha } from '../utils/fechas';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
  IconClock,
  IconTrash,
  IconEdit,
  IconChevronDown,
} from '../components/agenda/icons';
import { MetodoPagoSelector } from '../components/agenda/MetodoPagoSelector';
import { NuevaCitaModal } from '../components/agenda/NuevaCitaModal';

const DIAS_CORTOS_MES = DIAS_CORTOS_SEM;

export default function Agenda() {

  const [mostrarInactivos, setMostrarInactivos] = useState<Record<string, boolean>>({});
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set());
  const { usuario } = useAuth(); 
  // ✅ ESTADOS PARA AUTOCOMPLETADO - Agrega estas líneas
  // ✅ ESTADOS PARA AUTOCOMPLETADO DE CONTACTO DE EMERGENCIA
const [sugerenciasContacto, setSugerenciasContacto] = useState<any[]>([]);
const [mostrarSugerenciasContacto, setMostrarSugerenciasContacto] = useState(false);
const [sugerenciasPacientes, setSugerenciasPacientes] = useState<any[]>([]);
const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
const [sugerenciasAcompanante, setSugerenciasAcompanante] = useState<{ [key: number]: any[] }>({});
const [mostrarSugerenciasAcomp, setMostrarSugerenciasAcomp] = useState<{ [key: number]: boolean }>({});
  const [citas, setCitas] = useState<any[]>([]);
  const [bloqueosAgenda, setBloqueosAgenda] = useState<any[]>([]);
  const [sesionesGrupales, setSesionesGrupales] = useState<any[]>([]);
  type ModalSesionGrupalState = { sesionId: number | null; fecha: string; nombre: string; hora?: string; profesionalId?: number };
  const [modalSesionGrupal, setModalSesionGrupal] = useState<ModalSesionGrupalState | null>(null);
  const [modalSesionGrupalPendiente, setModalSesionGrupalPendiente] = useState<ModalSesionGrupalState | null>(null);
  const [horariosProf, setHorariosProf] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [seccionesArea, setSeccionesArea] = useState<any[]>([]);
  const [seccionSeleccionadaNueva, setSeccionSeleccionadaNueva] = useState<number | ''>('');
  const [seccionSeleccionadaEditar, setSeccionSeleccionadaEditar] = useState<number | ''>('');
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [profSeleccionado, setProfSeleccionado] = useState<any>(() => {
    try { const saved = localStorage.getItem('agenda_prof'); return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  // ✅ NUEVO: Estado para el área seleccionada en el filtro
const [areaSeleccionadaFiltro, setAreaSeleccionadaFiltro] = useState<number | null>(() => {
  try {
    const saved = localStorage.getItem('agenda_area_seleccionada');
    return saved ? Number(saved) : null;
  } catch {
    return null;
  }
});
  const [areaExpandida, setAreaExpandida] = useState<string>(() => localStorage.getItem('agenda_area') || '');
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);
  const [modalNuevaCita, setModalNuevaCita] = useState<any>(null);
  const [editandoCita, setEditandoCita] = useState(false);
  const [guardandoCita, setGuardandoCita] = useState(false);
  const [buscarPaciente, setBuscarPaciente] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [modoNuevoPaciente, setModoNuevoPaciente] = useState(false);
  const [sesionesAdicionales, setSesionesAdicionales] = useState<{fecha: string, hora: string}[]>([]);
  const [acompanantes, setAcompanantes] = useState<{
    modo: 'nuevo' | 'existente';
    nuevo: { nombre: string; telefono: string; carnet: string; edad: string };
    existente: any | null;
    buscar: string;
  }[]>([]);
  const [vistaActual, setVistaActual] = useState<'semana' | 'mes'>(() => (localStorage.getItem('agenda_vista') as 'semana' | 'mes') || 'semana');
  const [diaSeleccionadoMes, setDiaSeleccionadoMes] = useState<Date | null>(null);
  const [mostrarFormularioMes, setMostrarFormularioMes] = useState<Date | null>(null);
  const isMobile = useIsMobile();

  // En tablet/laptop/PC intentamos que todas las horas entren en pantalla
  // achicando las filas — pero solo hasta un mínimo (que la hora + "?" + el
  // nombre del paciente todavía se vean en una sola línea). Si ni siquiera al
  // mínimo entran todas, recién ahí dejamos que la agenda crezca hacia abajo
  // y sea el scroll PRINCIPAL de la página el que la muestre completa (nunca
  // un scroll propio de la agenda). En mobile no se toca nada.
  const semanaBodyRef = useRef<HTMLDivElement>(null);
  const [alturaFilasDisponible, setAlturaFilasDisponible] = useState<number | null>(null);

  const [formPaciente, setFormPaciente] = useState({ 
    nombre: '', telefono: '', carnet: '', edad: '',
    contacto_relacion: '', contacto_nombre: '', contacto_telefono: '' 
  });
  
  const [formCita, setFormCita] = useState({
    total_sesiones: 1, modalidad: 'presencial', estado: 'pendiente',
    monto_total: '', monto_pagado: '', metodo_pago: 'efectivo',
    servicio_id: '', servicio_nombre: '', notas: '',
  });
  
  const [formEditar, setFormEditar] = useState<any>({
  nombre: '', telefono: '', carnet: '', edad: '',
  contacto_relacion: '', contacto_nombre: '', contacto_telefono: '',
  estado: 'pendiente', modalidad: 'presencial',
  monto_total: '', monto_pagado: '', metodo_pago: 'efectivo',
  notas: '', total_sesiones: 1, servicio_nombre: '', servicio_id: '',
});

  const [participantesEditar, setParticipantesEditar] = useState<{
    patient_id: any;
    nombre: string; telefono: string; carnet: string; edad: string;
    contacto_relacion: string; contacto_nombre: string; contacto_telefono: string;
    esNuevo?: boolean;
    modo?: 'nuevo' | 'existente';
    buscar?: string;
  }[]>([]);
  
  const [sesionesAdicionalesEditar, setSesionesAdicionalesEditar] = useState<{fecha: string, hora: string}[]>([]);
  const [sesionesAEliminarEditar, setSesionesAEliminarEditar] = useState<number[]>([]);
  const [reagendando, setReagendando] = useState(false);
  const [formReagendar, setFormReagendar] = useState({ fecha: '', hora: '' });
  const accordionRef = useRef<HTMLDivElement>(null);

  // ✅ PRIMERO: El useMemo (fuera del useState)
const diasMostrar = useMemo(() => {
  if (!profSeleccionado) return ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  
  const areaIdUsar = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
  
  // Verificar si el profesional tiene horarios en DOMINGO
  const tieneDomingo = horariosProf.some(h => 
    h.user_id === profSeleccionado.id && 
    Number(h.area_id) === Number(areaIdUsar) &&
    h.dia === 'Domingo'
  );
  
  // Siempre mostrar Lunes a Sábado
  const diasBase = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  
  // Solo agregar DOMINGO si tiene horarios
  if (tieneDomingo) {
    return [...diasBase, 'Domingo'];
  }
  return diasBase;
}, [profSeleccionado, horariosProf, areaSeleccionadaFiltro]);

// ✅ SEGUNDO: El useState (SOLO UNA VEZ)
const [inicioSemana, setInicioSemana] = useState(() => {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
  const lunes = new Date(hoy.setDate(diff));
  lunes.setHours(0, 0, 0, 0);
  return lunes;
});
  
  
  

  const [mesActual, setMesActual] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accordionRef.current && !accordionRef.current.contains(e.target as Node)) {
        setAreaExpandida('');
      }
    }
    if (areaExpandida) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [areaExpandida]);

  useEffect(() => {
    if (profSeleccionado) localStorage.setItem('agenda_prof', JSON.stringify(profSeleccionado));
    else localStorage.removeItem('agenda_prof');
  }, [profSeleccionado]);

  useEffect(() => { localStorage.setItem('agenda_vista', vistaActual); }, [vistaActual]);
  useEffect(() => { localStorage.setItem('agenda_area', areaExpandida); }, [areaExpandida]);
  useEffect(() => { cargarDatos(); }, []);
    
        useEffect(() => {
    const areaIdActual = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
    if (!areaIdActual) { setSeccionesArea([]); return; }
    const permitidos = profSeleccionado?.servicios_ids?.length ? profSeleccionado.servicios_ids : null;
    getSecciones(areaIdActual)
      .then((data: any[]) => {
        const activas = data.filter((s: any) => s.activo);
        if (!permitidos) { setSeccionesArea(activas); return; }
        const seccionesConServicioPermitido = activas.filter(sec =>
          servicios.some(s => Number(s.area_id) === Number(areaIdActual) && s.seccion_id === sec.id && permitidos.includes(s.id))
        );
        setSeccionesArea(seccionesConServicioPermitido);
      })
      .catch(() => setSeccionesArea([]));
  }, [areaSeleccionadaFiltro, profSeleccionado, servicios]);

// ✅ NUEVO: Guardar área seleccionada
useEffect(() => {
  if (areaSeleccionadaFiltro !== null) {
    localStorage.setItem('agenda_area_seleccionada', String(areaSeleccionadaFiltro));
  } else {
    localStorage.removeItem('agenda_area_seleccionada');
  }
}, [areaSeleccionadaFiltro]);

  useEffect(() => {
    if (usuario?.rol === 'profesional' && profesionales.length > 0 && !profSeleccionado) {
      const miPerfil = profesionales.find(p => p.id === usuario.id);
      if (miPerfil) {
        setProfSeleccionado(miPerfil);
      }
    }
  }, [profesionales, usuario?.rol, usuario?.id]);



 const slotMinutosProfesional = profSeleccionado
  ? (horariosProf.find(h => 
      h.user_id === profSeleccionado.id && 
      Number(h.area_id) === Number(areaSeleccionadaFiltro ?? profSeleccionado.area_id)
    )?.slot_minutos || 60)
  : 60;

  function horaOcupadaPorGeronto(fecha: string, hora: string): { ocupado: boolean; detalle: string } {
    if (!profSeleccionado?.actividades_geronto?.length) return { ocupado: false, detalle: '' };
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diaNombre = DIAS_JS[fechaObj.getDay()];
    const actividad = profSeleccionado.actividades_geronto.find((act: any) => {
      if (act.dia !== diaNombre) return false;
      const [horaIniH, horaIniM] = (act.hora_inicio || '').split(':').map(Number);
      const [horaFinH, horaFinM] = (act.hora_fin || '').split(':').map(Number);
      const [horaSlotH, horaSlotM] = hora.split(':').map(Number);
      const minutosInicio = horaIniH * 60 + horaIniM;
      const minutosFin = horaFinH * 60 + horaFinM;
      const minutosSlot = horaSlotH * 60 + horaSlotM;
      return minutosSlot >= minutosInicio && minutosSlot < minutosFin;
    });
    if (actividad) return { ocupado: true, detalle: `Gerontología - ${actividad.nombre}` };
    return { ocupado: false, detalle: '' };
  }

  // Cursos/capacitaciones/seminarios (bloqueos_agenda) — dejan al profesional
  // ocupado en ese rango, igual que una cita o una actividad de gerontología.
  function bloqueoEnSlot(fecha: string, hora: string, profesionalId?: number): { ocupado: boolean; detalle: string } {
    const idProf = profesionalId ?? profSeleccionado?.id;
    if (!idProf) return { ocupado: false, detalle: '' };
    const bloqueo = bloqueosAgenda.find((b: any) =>
      b.professional_id === idProf &&
      b.fecha === fecha &&
      hora >= b.hora_inicio.slice(0, 5) &&
      hora < b.hora_fin.slice(0, 5)
    );
    if (bloqueo) return { ocupado: true, detalle: `${bloqueo.nombre} (${bloqueo.tipo})` };
    return { ocupado: false, detalle: '' };
  }

  // Servicios grupales recurrentes (ej. "Sesión Embarazadas" todos los martes
  // 18:00-19:00) — un slot puede recibir VARIOS pacientes distintos, así que
  // se detecta aparte de una cita normal y abre un modal de inscripción propio.
  function sesionGrupalEnSlot(fecha: string, hora: string, profesionalId?: number): any | null {
    const idProf = profesionalId ?? profSeleccionado?.id;
    if (!idProf) return null;
    const diaNombre = DIAS_JS[new Date(fecha + 'T00:00:00').getDay()];
    return (
      sesionesGrupales.find((s: any) =>
        s.professional_id === idProf &&
        s.activo !== false &&
        (s.dia === diaNombre || s.dia?.normalize('NFD').replace(/[̀-ͯ]/g, '') === diaNombre.normalize('NFD').replace(/[̀-ͯ]/g, '')) &&
        hora >= s.hora_inicio.slice(0, 5) && hora < s.hora_fin.slice(0, 5) &&
        (!s.fecha_inicio || fecha >= s.fecha_inicio.slice(0, 10))
      ) || null
    );
  }

  // Cierra la ficha de una cita — si se abrió desde adentro del modal de una
  // sesión grupal (para editar a un asistente puntual), vuelve a mostrar ese
  // modal con la lista de inscritos, en vez de dejar todo cerrado.
  function cerrarCitaSeleccionada() {
    setCitaSeleccionada(null);
    setEditandoCita(false);
    if (modalSesionGrupalPendiente) {
      setModalSesionGrupal(modalSesionGrupalPendiente);
      setModalSesionGrupalPendiente(null);
    }
  }

  // Abre la ficha de un asistente puntual de una sesión grupal (llamado desde
  // el modal de inscritos) — oculta ese modal y recuerda que hay que volver a
  // mostrarlo cuando se cierre/guarde la ficha.
  function editarAsistenteSesionGrupal(appointmentId: number) {
    const cita = citas.find((c: any) => c.id === appointmentId);
    if (!cita) return;
    setModalSesionGrupalPendiente(modalSesionGrupal);
    setModalSesionGrupal(null);
    setEditandoCita(false);
    setCitaSeleccionada(cita);
  }

  async function cargarDatos() {
    try {
      setCargando(true);
      
      const [citasData, horariosData, serviciosData, pacientesData, bloqueosData, sesionesGrupalesData] = await Promise.all([
        getCitas(),
        getTodosHorariosProfesionales(),
        getServicios(),
        getPacientes(),
        getBloqueos().catch(() => []),
        getSesionesGrupales().catch(() => []),
      ]);
      
      let profsFiltrados = [];
      
      if (usuario?.rol === 'profesional') {
        const perfilResponse = await api.get(`/users/${usuario.id}`);
        const perfil = perfilResponse.data.usuario;
        
               const miPerfil = {
          id: usuario.id,
          nombre: usuario.nombre,
          area_id: usuario.area_id,
          area_nombre: perfil.area_nombre || 'Sin área',
          especialidad: perfil.especialidad || '',
          actividades_geronto: perfil.actividades_geronto || [],
          email: perfil.email || '',
          telefono: perfil.telefono || '',
          areas: perfil.areas || [],
          servicios_ids: perfil.servicios_ids || [],
          rol: usuario.rol,
        };
        
        profsFiltrados = [miPerfil];
      } else {
        const profsData = await getProfesionales();
        const areasExcluidas = ['Gerontologia', 'Zumba'];
        profsFiltrados = profsData.filter(prof => 
          !areasExcluidas.includes(prof.area_nombre)
        );
      }
      
      setCitas(citasData);
      setBloqueosAgenda(bloqueosData || []);
      setSesionesGrupales(sesionesGrupalesData || []);
      setHorariosProf(horariosData);
      setProfesionales(profsFiltrados);
      setServicios(serviciosData);
      setPacientes(pacientesData);
      
      if (usuario?.rol === 'profesional' && profsFiltrados.length > 0) {
        setProfSeleccionado(profsFiltrados[0]);
      }
      
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

  function cambiarMes(meses: number) {
    const nuevo = new Date(mesActual);
    nuevo.setMonth(nuevo.getMonth() + meses);
    setMesActual(nuevo);
  }

  function irAHoy() {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diff));
    lunes.setHours(0, 0, 0, 0);
    setInicioSemana(lunes);
    setMesActual(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  }

  function getFechaDia(offset: number): Date {
    const fecha = new Date(inicioSemana);
    fecha.setDate(fecha.getDate() + offset);
    return fecha;
  }

  function horariosProfDia(diaNombre: string) {
    if (!profSeleccionado) return [];
    const areaIdUsar = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
    return horariosProf.filter(h => 
      h.user_id === profSeleccionado.id && 
      h.dia === diaNombre &&
      Number(h.area_id) === Number(areaIdUsar)
    );
  }

  // ✅ FUNCIÓN CORREGIDA - Filtra por área
  function horasProfParaDia(userId: number, fecha: string, areaId?: number): string[] {
    if (!fecha) return [];
    const d = new Date(fecha + 'T00:00:00');
    const diaNombre = DIAS_JS[d.getDay()];
    
    // ✅ Usar el área del filtro si existe
    const areaIdUsar = areaId ?? areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
    
    const horarios = horariosProf.filter(h => {
      let coincide = h.user_id === userId && h.dia === diaNombre;
      if (areaIdUsar) {
        coincide = coincide && Number(h.area_id) === Number(areaIdUsar);
      }
      return coincide;
    });
    
    const horas = new Set<string>();
    horarios.forEach(h => {
      const slotMinutos = h.slot_minutos || 60;
      const [horaIni, minIni] = (h.hora_inicio || '08:00').split(':').map(Number);
      const [horaFin, minFin] = (h.hora_fin || '17:00').split(':').map(Number);
      const minutosInicio = horaIni * 60 + minIni;
      const minutosFin = horaFin * 60 + minFin;
      for (let minutos = minutosInicio; minutos < minutosFin; minutos += slotMinutos) {
        const hora = Math.floor(minutos / 60);
        const min = minutos % 60;
        horas.add(`${String(hora).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
      }
    });
    return Array.from(horas).sort();
  }

  function getSlotMinutosProfesional(): number {
    if (!profSeleccionado) return 60;
    const areaIdUsar = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
    const horariosProfe = horariosProf.filter(h => 
      h.user_id === profSeleccionado.id && 
      Number(h.area_id) === Number(areaIdUsar)
    );
    return horariosProfe[0]?.slot_minutos || 60;
  }

// ✅ FUNCIÓN CORREGIDA - Usa citas filtradas por área
function getCitaEnSlot(hora: string, offset: number): any {
  const citasDelDia = citasProfDia(offset);
  if (citasDelDia.length === 0) return null;
  const slotMinutos = getSlotMinutosProfesional();
  const fecha = getFechaDia(offset);
  const fechaStr = fecha.toISOString().split('T')[0];
  const areaIdUsar = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
  const horasDelDia = horasProfParaDia(profSeleccionado!.id, fechaStr, areaIdUsar);
  
  for (const cita of citasDelDia) {
    if (cita.hora?.slice(0, 5) === hora && cita.estado !== 'cancelada') return cita;
  }
  for (const cita of citasDelDia) {
    if (!cita.duracion_min || cita.duracion_min <= slotMinutos) continue;
    if (cita.estado === 'cancelada') continue;
    const horaInicio = cita.hora?.slice(0, 5);
    const idxInicio = horasDelDia.indexOf(horaInicio);
    const idxActual = horasDelDia.indexOf(hora);
    if (idxInicio === -1 || idxActual === -1) continue;
    const slotsOcupados = Math.ceil(cita.duracion_min / slotMinutos);
    if (idxActual >= idxInicio && idxActual < idxInicio + slotsOcupados) return cita;
  }
  return null;
}

// ✅ FUNCIÓN CORREGIDA
function isSlotDisponible(hora: string, offset: number): boolean {
  const diaNombre = DIAS_SEMANA[offset];
  if (!estaEnHorario(hora, diaNombre)) return false;
  const cita = getCitaEnSlot(hora, offset);
  if (cita) return false;
  const fecha = getFechaDia(offset);
  const fechaStr = fecha.toISOString().split('T')[0];
  const geronto = horaOcupadaPorGeronto(fechaStr, hora);
  if (geronto.ocupado) return false;
  const bloqueo = bloqueoEnSlot(fechaStr, hora);
  if (bloqueo.ocupado) return false;
  return true;
}

  // ✅ FUNCIÓN CORREGIDA
  function isSlotDisponiblePorFecha(fecha: string, hora: string, excludeIds: number[] = [], profesionalIdOverride?: number, areaIdOverride?: number): boolean {
    const profesionalId = profesionalIdOverride ?? profSeleccionado?.id;
    const areaId = areaIdOverride ?? areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
    if (!profesionalId) return false;
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diaNombre = DIAS_JS[fechaObj.getDay()];
    
    const tieneHorarioEnArea = horariosProf.some(h => 
      h.user_id === profesionalId && 
      h.dia === diaNombre && 
      Number(h.area_id) === Number(areaId)
    );
    if (!tieneHorarioEnArea) return false;

    const slotMinutos = getSlotMinutosProfesional();
    const horasDelDia = horasProfParaDia(profesionalId, fecha, areaId);
    const idxHoraActual = horasDelDia.indexOf(hora);

        const citasDelDia = citas.filter(c =>
      c.fecha.startsWith(fecha) &&
      c.profesional_id === profesionalId &&
      Number(c.area_id) === Number(areaId) &&  // ✅ AGREGA ESTA LÍNEA
      c.estado !== 'cancelada' &&
      !excludeIds.includes(c.id)
    );

    for (const c of citasDelDia) {
      const horaInicioCita = c.hora?.slice(0, 5);
      if (horaInicioCita === hora) return false;

      if (c.duracion_min && c.duracion_min > slotMinutos) {
        const idxInicio = horasDelDia.indexOf(horaInicioCita);
        if (idxInicio === -1) continue;
        const slotsOcupados = Math.ceil(c.duracion_min / slotMinutos);
        if (idxHoraActual >= idxInicio && idxHoraActual < idxInicio + slotsOcupados) return false;
      }
    }

    const geronto = horaOcupadaPorGeronto(fecha, hora);
    if (geronto.ocupado) return false;

    const bloqueo = bloqueoEnSlot(fecha, hora, profesionalId);
    if (bloqueo.ocupado) return false;

    return true;
  }

  function getSlotsConsecutivosLibres(fecha: string, horaInicio: string, profesionalId: number, excludeIds: number[] = []): number {
    const areaIdUsar = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
    const horasDelDia = horasProfParaDia(profesionalId, fecha, areaIdUsar);
    const idxInicio = horasDelDia.indexOf(horaInicio);
    if (idxInicio === -1) return 0;
    let libres = 0;
    for (let i = idxInicio; i < horasDelDia.length; i++) {
      if (isSlotDisponiblePorFecha(fecha, horasDelDia[i], excludeIds, profesionalId, areaIdUsar)) libres++;
      else break;
    }
    return libres;
  }

  function getEstilosCelda(hora: string, offset: number): string {
    const cita = getCitaEnSlot(hora, offset);
    if (!cita || !cita.duracion_min) return 'rounded-xl';
    const slotMinutos = getSlotMinutosProfesional();
    if (cita.duracion_min <= slotMinutos) return 'rounded-xl';
    const fecha = getFechaDia(offset);
    const fechaStr = fecha.toISOString().split('T')[0];
    const areaIdUsar = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
    const horasDelDia = horasProfParaDia(profSeleccionado!.id, fechaStr, areaIdUsar);
    const horaInicio = cita.hora?.slice(0, 5);
    const idxInicio = horasDelDia.indexOf(horaInicio);
    const idxActual = horasDelDia.indexOf(hora);
    const slotsOcupados = Math.ceil(cita.duracion_min / slotMinutos);
    const esPrimero = idxActual === idxInicio;
    const esUltimo = idxActual === idxInicio + slotsOcupados - 1;
    if (esPrimero && esUltimo) return 'rounded-xl';
    if (esPrimero) return 'rounded-t-xl border-b-0';
    if (esUltimo) return 'rounded-b-xl border-t-0';
    return 'rounded-none border-t-0 border-b-0';
  }

  function horasProfCalendario(): string[] {
    if (!profSeleccionado) return [];
    const horas = new Set<string>();
    const areaIdUsar = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
    DIAS_SEMANA.forEach(dia => {
      horariosProfDia(dia).forEach(h => {
        const slotMinutos = h.slot_minutos || 60;
        const [horaIni, minIni] = (h.hora_inicio || '08:00').split(':').map(Number);
        const [horaFin, minFin] = (h.hora_fin || '17:00').split(':').map(Number);
        const minutosInicio = horaIni * 60 + minIni;
        const minutosFin = horaFin * 60 + minFin;
        for (let minutos = minutosInicio; minutos < minutosFin; minutos += slotMinutos) {
          const hr = Math.floor(minutos / 60);
          const m = minutos % 60;
          horas.add(`${String(hr).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
      });
    });
    return Array.from(horas).sort();
  }

// ✅ FUNCIÓN CORREGIDA - Filtra citas por área
function citasProfDia(offset: number) {
  if (!profSeleccionado) return [];
  const fecha = getFechaDia(offset);
  const fechaStr = fecha.toISOString().split('T')[0];
  const areaIdUsar = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
  return citas.filter(c => 
    c.fecha.startsWith(fechaStr) && 
    c.profesional_id === profSeleccionado.id &&
    Number(c.area_id) === Number(areaIdUsar)
  ).sort((a, b) => a.hora.localeCompare(b.hora));
}

  function estaEnHorario(hora: string, diaNombre: string): boolean {
    return horariosProfDia(diaNombre).some(h => {
      const [horaIniH, horaIniM] = (h.hora_inicio || '').split(':').map(Number);
      const [horaFinH, horaFinM] = (h.hora_fin || '').split(':').map(Number);
      const [horaSlotH, horaSlotM] = hora.split(':').map(Number);
      const minutosInicio = horaIniH * 60 + horaIniM;
      const minutosFin = horaFinH * 60 + horaFinM;
      const minutosSlot = horaSlotH * 60 + horaSlotM;
      return minutosSlot >= minutosInicio && minutosSlot < minutosFin;
    });
  }

  function getDiasMes(): (Date | null)[] {
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    let primerDiaSemana = primerDia.getDay();
    primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    const dias: (Date | null)[] = [];
    for (let i = 0; i < primerDiaSemana; i++) dias.push(null);
    for (let i = 1; i <= diasEnMes; i++) dias.push(new Date(año, mes, i));
    return dias;
  }

 // ✅ FUNCIÓN CORREGIDA - Filtra citas por área para la vista mensual
function citasDelDia(fecha: Date): any[] {
  if (!profSeleccionado) return [];
  const fechaStr = fecha.toISOString().split('T')[0];
  const areaIdUsar = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
  return citas.filter(c => 
    c.fecha.startsWith(fechaStr) && 
    c.profesional_id === profSeleccionado.id &&
    Number(c.area_id) === Number(areaIdUsar)
  );
}

  function agruparCitasParaVista(citasArr: any[]): any[] {
    const vistos = new Set<string>();
    const resultado: any[] = [];
    for (const c of citasArr) {
      const clave = c.grupo_id ? `g-${c.grupo_id}` : `c-${c.id}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      resultado.push(c);
    }
    return resultado;
  }

  function getGrupoInfoCanonico(cita: any): { claveColor: string; participantes: any[]; anclaPatientId: any; anclaCiclo: any } {
    if (!cita) return { claveColor: '', participantes: [], anclaPatientId: null, anclaCiclo: null };
    const aParticipante = (c: any) => ({
      patient_id: c.patient_id ?? c.id ?? null,
      nombre: c.nombre ?? c.paciente_nombre,
      telefono: c.telefono ?? c.paciente_telefono ?? '',
      carnet: c.carnet ?? c.paciente_carnet ?? '',
      edad: c.edad ?? c.paciente_edad ?? '',
      contacto_relacion: c.contacto_relacion ?? c.paciente_contacto_relacion ?? '',
      contacto_nombre: c.contacto_nombre ?? c.paciente_contacto_nombre ?? '',
      contacto_telefono: c.contacto_telefono ?? c.paciente_contacto_telefono ?? '',
    });

    if (!cita.grupo_id) {
      return {
        claveColor: String(cita.patient_id ?? cita.paciente_carnet ?? cita.paciente_nombre),
        participantes: [aParticipante(cita)],
        anclaPatientId: cita.patient_id,
        anclaCiclo: cita.ciclo,
      };
    }

    const propiaSesionUno = citas.find(c =>
      c.patient_id === cita.patient_id &&
      c.profesional_id === cita.profesional_id &&
      c.ciclo === cita.ciclo &&
      String(c.sesion) === '1'
    ) || cita;

    const grupoAncla = propiaSesionUno.grupo_id;
    const filasSesionUno = citas
      .filter(c => c.grupo_id === grupoAncla)
      .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

    const participantes = filasSesionUno.length > 0
      ? filasSesionUno.map(aParticipante)
      : [aParticipante(propiaSesionUno)];

    const filaAncla = filasSesionUno[0] || propiaSesionUno;

    return {
      claveColor: String(filaAncla.patient_id ?? propiaSesionUno.patient_id ?? propiaSesionUno.paciente_carnet ?? propiaSesionUno.paciente_nombre),
      participantes,
      anclaPatientId: filaAncla.patient_id,
      anclaCiclo: filaAncla.ciclo,
    };
  }

  function getSesionesDelCiclo(cita: any): any[] {
    if (!cita) return [];
    const info = getGrupoInfoCanonico(cita);
    return citas
      .filter(c =>
        c.patient_id === info.anclaPatientId &&
        c.profesional_id === cita.profesional_id &&
        c.ciclo === info.anclaCiclo
      )
      .sort((a, b) => Number(a.sesion) - Number(b.sesion));
  }

  function getFilasSesionSeleccionada(cita: any): any[] {
    if (!cita) return [];
    if (!cita.grupo_id) return [cita];
    const filas = citas
      .filter(c => c.grupo_id === cita.grupo_id)
      .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    return filas.length > 0 ? filas : [cita];
  }

  function nombreGrupoDisplay(cita: any): string {
    const info = getGrupoInfoCanonico(cita);
    if (!info.participantes.length) return cita?.paciente_nombre || '';
    return info.participantes.map(p => p.nombre).join(' + ');
  }

  function profTrabajaDia(fecha: Date): boolean {
    const diaNombre = DIAS_JS[fecha.getDay()];
    const areaIdUsar = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
    return horariosProf.some(h => 
      h.user_id === profSeleccionado?.id && 
      h.dia === diaNombre &&
      Number(h.area_id) === Number(areaIdUsar)
    );
  }

  function abrirModalNuevaCitaMes(fecha: Date) {
    if (!profSeleccionado) return;
    if (usuario?.rol === 'profesional') return;
    const fechaStr = fecha.toISOString().split('T')[0];
    if (!profTrabajaDia(fecha)) return;
    
    const areaIdUsar = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
    const horas = horasProfParaDia(profSeleccionado.id, fechaStr, areaIdUsar);
    
    const diaSemana = DIAS_JS[fecha.getDay()];
    const offsetDia = DIAS_SEMANA.indexOf(diaSemana);
    const primeraHoraLibre = horas.find(h => isSlotDisponible(h, offsetDia));
    if (!primeraHoraLibre) { alert('No hay horarios disponibles para este día'); return; }
    setModalNuevaCita({ hora: primeraHoraLibre, fecha: fechaStr });
    setPacienteSeleccionado(null); setBuscarPaciente(''); setModoNuevoPaciente(true);
    setFormPaciente({ nombre: '', telefono: '', carnet: '', edad: '', contacto_relacion: '', contacto_nombre: '', contacto_telefono: '' });
        setFormCita({ total_sesiones: 1, modalidad: 'presencial', estado: 'pendiente', monto_total: '', monto_pagado: '', metodo_pago: 'efectivo', servicio_id: '', servicio_nombre: '', notas: '' });
    setSesionesAdicionales([]);
    setAcompanantes([]);
    setSeccionSeleccionadaNueva('');
  }

  function handleCarnetBlur(e: React.FocusEvent<HTMLInputElement>) {
    const carnetIngresado = e.target.value.trim();
    if (!carnetIngresado) return;
    const existente = pacientes.find(p => p.carnet && p.carnet.trim() === carnetIngresado);
    if (existente) {
      const cargar = confirm(`Ya existe un paciente registrado con este carnet:\n\n${existente.nombre}\n\n¿Deseas cargar sus datos? (podrás editar el teléfono si cambió)`);
      if (cargar) {
        setFormPaciente({
          nombre: existente.nombre || '',
          edad: existente.edad || '',
          telefono: existente.telefono || '',
          carnet: existente.carnet || carnetIngresado,
          contacto_relacion: existente.contacto_relacion || '',
          contacto_nombre: existente.contacto_nombre || '',
          contacto_telefono: existente.contacto_telefono || '',
        });
      }
    }
  }

  // ✅ BUSCAR PACIENTES MIENTRAS ESCRIBES (AUTOCOMPLETADO)
function buscarPacientesMientrasEscribe(valor: string, tipo: 'nombre' | 'telefono' | 'carnet' = 'nombre'): any[] {
  if (!valor || valor.length < 2) {
    return [];
  }
  
  const busqueda = valor.toLowerCase().trim();
  
  return pacientes.filter(p => {
    if (tipo === 'nombre') {
      return p.nombre?.toLowerCase().includes(busqueda);
    }
    if (tipo === 'telefono') {
      return p.telefono?.includes(valor.trim());
    }
    if (tipo === 'carnet') {
      return p.carnet?.includes(valor.trim());
    }
    return false;
  }).slice(0, 6);
}

  function abrirModalNuevaCita(hora: string, offset: number) {
    if (usuario?.rol === 'profesional') return;
    const fecha = getFechaDia(offset);
    const fechaStr = fecha.toISOString().split('T')[0];
    if (!isSlotDisponible(hora, offset)) return;
    setModalNuevaCita({ hora, fecha: fechaStr });
    setPacienteSeleccionado(null); setBuscarPaciente(''); setModoNuevoPaciente(true);
    setFormPaciente({ nombre: '', telefono: '', carnet: '', edad: '', contacto_relacion: '', contacto_nombre: '', contacto_telefono: '' });
    setFormCita({ total_sesiones: 1, modalidad: 'presencial', estado: 'pendiente', monto_total: '', monto_pagado: '', metodo_pago: 'efectivo', servicio_id: '', servicio_nombre: '', notas: '' });
    setSesionesAdicionales([]);
    setAcompanantes([]);
  }

  function agregarAcompanante() {
    setAcompanantes(prev => [...prev, {
      modo: 'nuevo',
      nuevo: { nombre: '', telefono: '', carnet: '', edad: '' },
      existente: null,
      buscar: '',
    }]);
  }

  function quitarAcompanante(idx: number) {
    setAcompanantes(prev => prev.filter((_, i) => i !== idx));
  }

  function actualizarAcompanante(idx: number, cambios: Partial<typeof acompanantes[number]>) {
    setAcompanantes(prev => prev.map((a, i) => i === idx ? { ...a, ...cambios } : a));
  }

  function agregarParticipanteEditar() {
    setParticipantesEditar(prev => [...prev, {
      patient_id: null,
      nombre: '', telefono: '', carnet: '', edad: '',
      contacto_relacion: '', contacto_nombre: '', contacto_telefono: '',
      esNuevo: true, modo: 'nuevo', buscar: '',
    }]);
  }

  function quitarParticipanteEditar(idx: number) {
    if (participantesEditar.length <= 1) return;
    setParticipantesEditar(prev => prev.filter((_, i) => i !== idx));
  }

  function actualizarParticipanteEditar(idx: number, cambios: Partial<typeof participantesEditar[number]>) {
    setParticipantesEditar(prev => prev.map((p, i) => i === idx ? { ...p, ...cambios } : p));
  }

    async function guardarNuevaCita(e: React.FormEvent) {
    e.preventDefault();
    if (seccionesArea.length > 0 && !seccionSeleccionadaNueva) {
      alert('Selecciona una sección antes de guardar la reserva');
      return;
    }
    if (esAreaConServicios && serviciosDelArea.length > 0 && !formCita.servicio_id) {
      alert('Selecciona un servicio antes de guardar la reserva');
      return;
    }
    const fechaObj = new Date(modalNuevaCita.fecha + 'T00:00:00');
    const diaSemana = DIAS_JS[fechaObj.getDay()];
    const offsetDia = DIAS_SEMANA.indexOf(diaSemana);
    if (!isSlotDisponible(modalNuevaCita.hora, offsetDia)) { alert(`La hora ${modalNuevaCita.hora} ya está ocupada.`); return; }
    const servicioSeleccionado = servicios.find(s => String(s.id) === formCita.servicio_id);
    if (servicioSeleccionado?.duracion_min && servicioSeleccionado.duracion_min > slotMinutosProfesional) {
      const slotsNecesarios = Math.ceil(servicioSeleccionado.duracion_min / slotMinutosProfesional);
      const todasHoras = horasProfParaDia(profSeleccionado.id, modalNuevaCita.fecha, areaSeleccionadaFiltro ?? profSeleccionado?.area_id);
      const idxHoraInicio = todasHoras.indexOf(modalNuevaCita.hora);
      if (idxHoraInicio !== -1) {
        for (let i = 1; i < slotsNecesarios; i++) {
          const horaSiguiente = todasHoras[idxHoraInicio + i];
          if (!horaSiguiente) { alert(`El servicio requiere ${servicioSeleccionado.duracion_min} minutos pero no hay suficientes slots.`); return; }
          if (!isSlotDisponible(horaSiguiente, offsetDia)) { alert(`La hora ${horaSiguiente} está ocupada.`); return; }
          const gerontoOcupado = horaOcupadaPorGeronto(modalNuevaCita.fecha, horaSiguiente);
          if (gerontoOcupado.ocupado) { alert(`La hora ${horaSiguiente} está reservada para gerontología.`); return; }
        }
      }
    }
    for (const s of sesionesAdicionales) {
      if (!s.fecha || !s.hora) { alert('Completa fecha y hora de todas las sesiones adicionales'); return; }
      const ocupada = citas.some(c => c.fecha.startsWith(s.fecha) && c.profesional_id === profSeleccionado.id && c.hora?.slice(0, 5) === s.hora && c.estado !== 'cancelada');
      if (ocupada) { alert(`La hora ${s.hora} del ${s.fecha} ya está ocupada.`); return; }
      const gerontoOcupado = horaOcupadaPorGeronto(s.fecha, s.hora);
      if (gerontoOcupado.ocupado) { alert(`La hora ${s.hora} del ${s.fecha} está reservada para gerontología.`); return; }
    }
    if (acompanantes.length > 0) {
      for (const a of acompanantes) {
        if (a.modo === 'nuevo' && !a.nuevo.nombre) { alert('Completa el nombre de todos los acompañantes'); return; }
        if (a.modo === 'existente' && !a.existente) { alert('Selecciona un paciente para cada acompañante, o cámbialo a "Nuevo"'); return; }
      }
    }
    try {
      setGuardandoCita(true);
      let datosPaciente: any = {};
      if (modoNuevoPaciente) {
        if (!formPaciente.nombre) { alert('El nombre es obligatorio'); return; }
        datosPaciente = { 
          patient_id: pacienteSeleccionado?.id || undefined, // 👈 si hay id enlazado, viaja al backend → UPDATE
          paciente_nombre: formPaciente.nombre,
          paciente_telefono: formPaciente.telefono || null,
          paciente_carnet: formPaciente.carnet || null, 
          paciente_edad: formPaciente.edad || null,
          paciente_contacto_relacion: formPaciente.contacto_relacion || null,
          paciente_contacto_nombre: formPaciente.contacto_nombre || null,
          paciente_contacto_telefono: formPaciente.contacto_telefono || null,
        };
      } else {
        if (!pacienteSeleccionado) { alert('Selecciona un paciente'); return; }
        datosPaciente = { 
          paciente_nombre: pacienteSeleccionado.nombre, 
          paciente_telefono: pacienteSeleccionado.telefono || null, 
          paciente_carnet: pacienteSeleccionado.carnet || null, 
          paciente_edad: pacienteSeleccionado.edad || null,
          paciente_contacto_relacion: pacienteSeleccionado.contacto_relacion || null,
          paciente_contacto_nombre: pacienteSeleccionado.contacto_nombre || null,
          paciente_contacto_telefono: pacienteSeleccionado.contacto_telefono || null,
        };
      }
      const datosComunes = {
        ...datosPaciente, professional_id: profSeleccionado.id, area_id: areaSeleccionadaFiltro ?? profSeleccionado.area_id,
        total_sesiones: formCita.total_sesiones, modalidad: formCita.modalidad, estado: formCita.estado,
        monto_total: formCita.estado === 'confirmada' ? (formCita.monto_total || null) : null,
        monto_pagado: formCita.estado === 'confirmada' ? (formCita.monto_pagado || null) : null,
        metodo_pago: formCita.estado === 'confirmada' ? formCita.metodo_pago : null,
        servicio_nombre: formCita.servicio_nombre || null, notas: formCita.notas || null,
        duracion_min: servicioSeleccionado?.duracion_min || null,
      };

      if (acompanantes.length > 0) {
        const pacientesGrupo = [
          datosPaciente,
          ...acompanantes.map(a => a.modo === 'existente'
            ? {
                paciente_nombre: a.existente.nombre,
                paciente_telefono: a.existente.telefono || null,
                paciente_carnet: a.existente.carnet || null,
                paciente_edad: a.existente.edad || null,
                paciente_contacto_relacion: a.existente.contacto_relacion || null,
                paciente_contacto_nombre: a.existente.contacto_nombre || null,
                paciente_contacto_telefono: a.existente.contacto_telefono || null,
                patient_id: a.existente.id,
              }
            :  {
                paciente_nombre: a.nuevo.nombre,
                paciente_telefono: a.nuevo.telefono || null,
                paciente_carnet: a.nuevo.carnet || null,
                paciente_edad: a.nuevo.edad || null,
                patient_id: a.existente?.id || undefined, // 👈 si seleccionó sugerencia, viaja el id → UPDATE
              }
          ),
        ];
        const sesionesGrupo = [
          { fecha: modalNuevaCita.fecha, hora: modalNuevaCita.hora, sesion: 1 },
          ...sesionesAdicionales.map((s, idx) => ({ fecha: s.fecha, hora: s.hora, sesion: idx + 2 })),
        ];
        await crearCitaGrupal({
          pacientes: pacientesGrupo,
          sesiones: sesionesGrupo,
          professional_id: profSeleccionado.id,
          area_id: areaSeleccionadaFiltro ?? profSeleccionado.area_id,
          modalidad: formCita.modalidad,
          servicio_nombre: formCita.servicio_nombre || null,
          duracion_min: servicioSeleccionado?.duracion_min || null,
          estado: formCita.estado,
          monto_total: formCita.estado === 'confirmada' ? (formCita.monto_total || null) : null,
          monto_pagado: formCita.estado === 'confirmada' ? (formCita.monto_pagado || null) : null,
          metodo_pago: formCita.estado === 'confirmada' ? formCita.metodo_pago : null,
          notas: formCita.notas || null,
          total_sesiones: formCita.total_sesiones,
        });
      } else {
        const todasSesiones = [
          { ...datosComunes, fecha: modalNuevaCita.fecha, hora: modalNuevaCita.hora, sesion: 1 },
          ...sesionesAdicionales.map((s, idx) => ({ ...datosComunes, fecha: s.fecha, hora: s.hora, sesion: idx + 2, monto_total: null, monto_pagado: null })),
        ];
        await crearMultiplesCitas(todasSesiones);
      }
      setModalNuevaCita(null);
      setAcompanantes([]);
      await cargarDatos();
    } catch (err: any) { alert(err.response?.data?.mensaje || 'Error al crear cita'); }
    finally { setGuardandoCita(false); }
  }

async function guardarEdicionCita(e: React.FormEvent) {
  e.preventDefault();
  try {
    setGuardandoCita(true);
    
    // Validaciones de sesiones adicionales
    for (const s of sesionesAdicionalesEditar) {
      if (!s.fecha || !s.hora) { 
        alert('Completa fecha y hora de todas las sesiones adicionales'); 
        setGuardandoCita(false);
        return; 
      }
      const ocupada = citas.some(c => c.fecha.startsWith(s.fecha) && c.profesional_id === citaSeleccionada.profesional_id && c.hora?.slice(0, 5) === s.hora && c.estado !== 'cancelada');
      if (ocupada) { 
        alert(`La hora ${s.hora} del ${s.fecha} ya está ocupada.`); 
        setGuardandoCita(false);
        return; 
      }
      const gerontoOcupado = horaOcupadaPorGeronto(s.fecha, s.hora);
      if (gerontoOcupado.ocupado) { 
        alert(`La hora ${s.hora} del ${s.fecha} está reservada para gerontología.`); 
        setGuardandoCita(false);
        return; 
      }
    }
    
    // Validar nombres de participantes
    for (const p of participantesEditar) {
      if (!p.nombre) { 
        alert('Completa el nombre de todos los pacientes'); 
        setGuardandoCita(false); 
        return; 
      }
    }

    const infoGrupoEdicion = getGrupoInfoCanonico(citaSeleccionada);
    const citasRelacionadas = citas.filter(c => 
      c.patient_id === infoGrupoEdicion.anclaPatientId && 
      c.profesional_id === citaSeleccionada.profesional_id &&
      c.ciclo === infoGrupoEdicion.anclaCiclo
    );
    const servicioEditado = servicios.find(s => String(s.id) === formEditar.servicio_id);
    const [participantePrincipal, ...participantesAcompanantes] = participantesEditar;
    
    // Actualizar citas relacionadas
    await Promise.all(citasRelacionadas.map(c => {
      const esPrimeraSesion = String(c.sesion) === '1';
      return actualizarCitaService(c.id, {
        estado: formEditar.estado,
        monto_total: esPrimeraSesion ? (formEditar.monto_total || null) : null,
        monto_pagado: esPrimeraSesion ? (formEditar.monto_pagado || null) : null,
        metodo_pago: esPrimeraSesion ? (formEditar.metodo_pago || null) : null,
        total_sesiones: formEditar.total_sesiones,
        modalidad: formEditar.modalidad,
        servicio_nombre: formEditar.servicio_nombre || null,
        duracion_min: servicioEditado?.duracion_min || null,
        notas: formEditar.notas || null,
        paciente_nombre: participantePrincipal?.nombre || null,
        paciente_telefono: participantePrincipal?.telefono || null,
        paciente_carnet: participantePrincipal?.carnet || null,
        paciente_edad: participantePrincipal?.edad || null,
        paciente_contacto_relacion: participantePrincipal?.contacto_relacion || null,
        paciente_contacto_nombre: participantePrincipal?.contacto_nombre || null,
        paciente_contacto_telefono: participantePrincipal?.contacto_telefono || null,
      });
    }));

        // Actualizar acompañantes existentes
    const acompanantesExistentes = participantesAcompanantes.filter(p => !p.esNuevo);
    if (acompanantesExistentes.length > 0) {
      const filasHermanas = citasRelacionadas.flatMap(r =>
        citas.filter(c => r.grupo_id && c.grupo_id === r.grupo_id && c.id !== r.id)
      );
      const actualizacionesAcompanantes = acompanantesExistentes.flatMap(p => {
        const filasDeEstePaciente = filasHermanas.filter(f =>
          p.patient_id != null ? f.patient_id === p.patient_id : f.paciente_carnet === p.carnet
        );
        return filasDeEstePaciente.map(f => actualizarCitaService(f.id, {
          // 👇 Campos comunes de la cita: deben quedar IGUALES en todas las filas
          // del ciclo grupal (paciente principal + acompañantes), o el cálculo de
          // slots ocupados en la agenda semanal queda inconsistente.
          estado: formEditar.estado,
          total_sesiones: formEditar.total_sesiones,
          modalidad: formEditar.modalidad,
          servicio_nombre: formEditar.servicio_nombre || null,
          duracion_min: servicioEditado?.duracion_min || null,
          notas: formEditar.notas || null,
          // Datos propios de este paciente
          paciente_nombre: p.nombre || null,
          paciente_telefono: p.telefono || null,
          paciente_carnet: p.carnet || null,
          paciente_edad: p.edad || null,
          paciente_contacto_relacion: p.contacto_relacion || null,
          paciente_contacto_nombre: p.contacto_nombre || null,
          paciente_contacto_telefono: p.contacto_telefono || null,
        }));
      });
      await Promise.all(actualizacionesAcompanantes);
    }

    // Crear nuevas sesiones si es necesario
    let filasNuevasSesiones: { id: number; fecha: string; hora: string; sesion: number }[] = [];
    if (sesionesAdicionalesEditar.length > 0) {
      const datosPaciente = { 
        patient_id: infoGrupoEdicion.anclaPatientId,
        paciente_nombre: participantePrincipal?.nombre || citaSeleccionada.paciente_nombre, 
        paciente_telefono: participantePrincipal?.telefono || citaSeleccionada.paciente_telefono || null, 
        paciente_carnet: participantePrincipal?.carnet || citaSeleccionada.paciente_carnet || null, 
        paciente_edad: participantePrincipal?.edad || citaSeleccionada.paciente_edad || null,
        paciente_contacto_relacion: participantePrincipal?.contacto_relacion || null,
        paciente_contacto_nombre: participantePrincipal?.contacto_nombre || null,
        paciente_contacto_telefono: participantePrincipal?.contacto_telefono || null,
      };
      const sesionesNuevas = sesionesAdicionalesEditar.map((s, idx) => ({ 
        ...datosPaciente, 
        professional_id: citaSeleccionada.profesional_id, 
        area_id: citaSeleccionada.area_id, 
        fecha: s.fecha, 
        hora: s.hora, 
        sesion: parseInt(citaSeleccionada.sesion || '1') + idx + 1, 
        ciclo: infoGrupoEdicion.anclaCiclo,
        total_sesiones: formEditar.total_sesiones, 
        modalidad: formEditar.modalidad, 
        estado: formEditar.estado, 
        monto_total: null,
        monto_pagado: null,
        metodo_pago: null,
        notas: formEditar.notas || null,
        duracion_min: servicioEditado?.duracion_min || citaSeleccionada.duracion_min || null,
        servicio_nombre: formEditar.servicio_nombre || null
      }));
      const resultadoNuevas = await crearMultiplesCitas(sesionesNuevas);
      const idsCreados: number[] = resultadoNuevas?.ids || [];
      filasNuevasSesiones = sesionesNuevas.map((s, idx) => ({
        id: idsCreados[idx], fecha: s.fecha, hora: s.hora, sesion: s.sesion,
      })).filter(f => f.id != null);

      if (filasNuevasSesiones.length > 0 && acompanantesExistentes.length > 0) {
        for (const p of acompanantesExistentes) {
          const filasCompanieroFechasNuevas = filasNuevasSesiones.map(f => ({
            paciente_nombre: p.nombre,
            paciente_telefono: p.telefono || null,
            paciente_carnet: p.carnet || null,
            paciente_edad: p.edad || null,
            paciente_contacto_relacion: p.contacto_relacion || null,
            paciente_contacto_nombre: p.contacto_nombre || null,
            paciente_contacto_telefono: p.contacto_telefono || null,
            patient_id: p.patient_id,
            professional_id: citaSeleccionada.profesional_id,
            area_id: citaSeleccionada.area_id,
            fecha: f.fecha,
            hora: f.hora,
            sesion: f.sesion,
            vincular_a: f.id,
            total_sesiones: formEditar.total_sesiones,
            modalidad: formEditar.modalidad,
            estado: formEditar.estado,
            monto_total: null,
            monto_pagado: null,
            metodo_pago: null,
            notas: formEditar.notas || null,
            duracion_min: servicioEditado?.duracion_min || citaSeleccionada.duracion_min || null,
            servicio_nombre: formEditar.servicio_nombre || null,
          }));
          await crearMultiplesCitas(filasCompanieroFechasNuevas);
        }
      }
    }

    // Crear nuevos participantes
    const participantesNuevos = participantesAcompanantes.filter(p => p.esNuevo);
    if (participantesNuevos.length > 0) {
      const todasLasFilasDelCiclo = [
        ...citasRelacionadas.map(r => ({ id: r.id, fecha: r.fecha, hora: r.hora?.slice(0, 5), sesion: r.sesion })),
        ...filasNuevasSesiones,
      ];
      for (const p of participantesNuevos) {
        const filasParaEstePaciente = todasLasFilasDelCiclo.map(f => ({
          patient_id: p.patient_id || undefined, // 👈 si seleccionó sugerencia, viaja el id → UPDATE
          paciente_nombre: p.nombre,
          paciente_telefono: p.telefono || null,
          paciente_carnet: p.carnet || null,
          paciente_edad: p.edad || null,
          paciente_contacto_relacion: p.contacto_relacion || null,
          paciente_contacto_nombre: p.contacto_nombre || null,
          paciente_contacto_telefono: p.contacto_telefono || null,
          professional_id: citaSeleccionada.profesional_id,
          area_id: citaSeleccionada.area_id,
          fecha: f.fecha,
          hora: f.hora,
          sesion: f.sesion,
          vincular_a: f.id,
          total_sesiones: formEditar.total_sesiones,
          modalidad: formEditar.modalidad,
          estado: formEditar.estado,
          monto_total: null,
          monto_pagado: null,
          metodo_pago: null,
          notas: formEditar.notas || null,
          duracion_min: servicioEditado?.duracion_min || citaSeleccionada.duracion_min || null,
          servicio_nombre: formEditar.servicio_nombre || null,
        }));
        await crearMultiplesCitas(filasParaEstePaciente);
      }
    }

    // ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE (SIN ESPERAR)
    const servicioEditadoParaEstado = servicios.find(s => String(s.id) === formEditar.servicio_id);
    setCitas(prevCitas => 
      prevCitas.map(c => 
        c.id === citaSeleccionada.id 
          ? { 
              ...c, 
              duracion_min: servicioEditadoParaEstado?.duracion_min || null,
              servicio_nombre: formEditar.servicio_nombre || null,
              estado: formEditar.estado,
              modalidad: formEditar.modalidad,
            }
          : c
      )
    );

    // ✅ RECARGAR DESDE EL BACKEND PARA CONFIRMAR
    await cargarDatos();

   // ✅ FORZAR RE-RENDER COMPLETO
    setCitas([]);  // ← LIMPIAR ARRAY
    setCargando(true);  // ← MOSTRAR LOADING (OPCIONAL)
    await cargarDatos();  // ← RECARGAR

    // ✅ LIMPIAR ESTADOS DEL MODAL
    cerrarCitaSeleccionada();
    setSesionesAdicionalesEditar([]);
    setParticipantesEditar([]);

  } catch (err: any) { 
    alert(err.response?.data?.mensaje || 'Error al actualizar'); 
  } finally { 
    setGuardandoCita(false); 
  }
}


  async function marcarAsistencia(id: number, asistio: boolean | null) {
    try {
      await actualizarCitaService(id, { asistio });
      await cargarDatos();
      if (citaSeleccionada?.id === id) setCitaSeleccionada({ ...citaSeleccionada, asistio });
    
    
    } catch (err) { console.error(err); }
    
  }

  async function eliminarCita(id: number) {
    const cita = citas.find(c => c.id === id);
    if (!cita) return;

    const citasDelCiclo = citas.filter(c =>
      c.patient_id === cita.patient_id &&
      c.profesional_id === cita.profesional_id &&
      c.ciclo === cita.ciclo
    );

    const mensaje = citasDelCiclo.length > 1
      ? `¿Seguro que deseas eliminar TODAS las ${citasDelCiclo.length} sesiones de este ciclo?`
      : '¿Seguro que deseas eliminar esta cita?';
    if (!confirm(mensaje)) return;

    try {
      await Promise.all(citasDelCiclo.map(c => eliminarCitaService(c.id)));
      cerrarCitaSeleccionada();
      await cargarDatos();
    } catch (err: any) { alert(err.response?.data?.mensaje || 'Error al eliminar'); }
  }

  async function guardarReagendar() {
    if (!formReagendar.fecha || !formReagendar.hora) { alert('Selecciona fecha y hora'); return; }
    const filasAMover = getFilasSesionSeleccionada(citaSeleccionada);
    const idsAMover = new Set(filasAMover.map(f => f.id));
    const ocupadaPorCita = citas.some(c => c.fecha.startsWith(formReagendar.fecha) && c.profesional_id === citaSeleccionada.profesional_id && c.hora?.slice(0, 5) === formReagendar.hora && c.estado !== 'cancelada' && !idsAMover.has(c.id));
    const gerontoOcupado = horaOcupadaPorGeronto(formReagendar.fecha, formReagendar.hora);
    if (ocupadaPorCita || gerontoOcupado.ocupado) { 
      alert(`La hora ${formReagendar.hora} ya está ocupada.${gerontoOcupado.ocupado ? ' (Actividad de Gerontología)' : ''}`); 
      return; 
    }
    try {
      await Promise.all(filasAMover.map(f => actualizarCitaService(f.id, { 
        fecha: formReagendar.fecha, 
        hora: formReagendar.hora,
        asistio: null
      })));
      setReagendando(false); 
      cerrarCitaSeleccionada();
      await cargarDatos();
    } catch (err: any) { alert(err.response?.data?.mensaje || 'Error al reagendar'); }
  }

  const rangoLabel = vistaActual === 'semana'
    ? `${MESES[inicioSemana.getMonth()]} ${inicioSemana.getFullYear()}`
    : `${MESES[mesActual.getMonth()]} ${mesActual.getFullYear()}`;

  const AREAS_EXCLUIDAS = ['Gerontologia', 'Zumba', 'Gerontología', 'Zumba'];

  const areasProfesionales = profesionales.reduce((acc: any, p: any) => {
    if (p.areas && p.areas.length > 0) {
      p.areas.forEach((area: any) => {
        const nombreArea = area.nombre || 'Sin area';
        if (AREAS_EXCLUIDAS.includes(nombreArea)) return;
        
        if (!acc[nombreArea]) acc[nombreArea] = { profesionales: [] };
        const yaExiste = acc[nombreArea].profesionales.some((prof: any) => prof.id === p.id);
        if (!yaExiste) {
          acc[nombreArea].profesionales.push({
            ...p,
            area_id: area.id,
            area_nombre: area.nombre
          });
        }
      });
    } else {
      const area = p.area_nombre || 'Sin area';
      if (AREAS_EXCLUIDAS.includes(area)) return acc;
      
      if (!acc[area]) acc[area] = { profesionales: [] };
      acc[area].profesionales.push(p);
    }
    return acc;
  }, {});

  const colorPorPacienteArea = (() => {
    const mapa = new Map<string, { bg: string; border: string; text: string }>();
    if (!profSeleccionado) return mapa;
    const areaId = areaSeleccionadaFiltro ?? profSeleccionado.area_id;

    const citasDelArea = citas.filter(c => c.area_id === areaId && c.estado !== 'cancelada');
    const porPaciente = new Map<string, any[]>();
    citasDelArea.forEach(c => {
      const clave = getGrupoInfoCanonico(c).claveColor;
      if (!porPaciente.has(clave)) porPaciente.set(clave, []);
      porPaciente.get(clave)!.push(c);
    });

    const pacientesOrdenados = Array.from(porPaciente.entries()).sort((a, b) => {
      const fa = a[1].reduce((min, c) => (c.fecha < min ? c.fecha : min), a[1][0].fecha);
      const fb = b[1].reduce((min, c) => (c.fecha < min ? c.fecha : min), b[1][0].fecha);
      return fa.localeCompare(fb);
    });

    const coloresLibres: number[] = [];
    const indiceColorDePaciente = new Map<string, number>();
    let siguienteColorNuevo = 0;

    pacientesOrdenados.forEach(([clave, citasPaciente]) => {
      const completado = citasPaciente.every(c => c.asistio === true || c.asistio === false);

      let idxColor: number;
      if (coloresLibres.length > 0) {
        idxColor = coloresLibres.shift()!;
      } else if (siguienteColorNuevo < PALETA_COLORES_PACIENTE.length) {
        idxColor = siguienteColorNuevo++;
      } else {
        idxColor = indiceColorDePaciente.size % PALETA_COLORES_PACIENTE.length;
      }
      indiceColorDePaciente.set(clave, idxColor);

      if (completado) {
        mapa.set(clave, COLOR_COMPLETADO);
        coloresLibres.push(idxColor);
      } else {
        mapa.set(clave, PALETA_COLORES_PACIENTE[idxColor]);
      }
    });

    return mapa;
  })();

  function getColorCita(cita: any): { bg: string; border: string; text: string } {
    const clave = getGrupoInfoCanonico(cita).claveColor;
    return colorPorPacienteArea.get(clave) || PALETA_COLORES_PACIENTE[0];
  }

  const profTieneHorarios = profSeleccionado ? horariosProf.some(h => h.user_id === profSeleccionado.id) : false;
  // Un profesional inactivo se muestra en modo solo-lectura: se puede ver su
  // agenda/citas pasadas pero no crear, editar, eliminar ni marcar asistencia.
  const profesionalInactivo = profSeleccionado?.activo === false;
  const todasHoras = horasProfCalendario();

  useEffect(() => {
    function recalcularAltura() {
      if (window.innerWidth < 768 || !semanaBodyRef.current) {
        setAlturaFilasDisponible(null);
        return;
      }
      const top = semanaBodyRef.current.getBoundingClientRect().top;
      const disponible = window.innerHeight - top - 4;
      setAlturaFilasDisponible(Math.max(disponible, 0));
    }
    // Recalculamos varias veces en los frames siguientes (no solo una vez al
    // montar) porque el encabezado de arriba puede seguir moviéndose un poco
    // mientras terminan de llegar los datos (profesionales, áreas, etc.).
    let frame = 0;
    let intentos = 0;
    function recalcularEnCadena() {
      recalcularAltura();
      intentos++;
      if (intentos < 12) frame = requestAnimationFrame(recalcularEnCadena);
    }
    frame = requestAnimationFrame(recalcularEnCadena);
    window.addEventListener('resize', recalcularAltura);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', recalcularAltura);
    };
  }, [vistaActual, todasHoras.length, profSeleccionado?.id, cargando]);

  // Altura mínima de una fila: la que hace falta para que "hora + ? + nombre"
  // todavía entren en una sola línea (ver diseño compacto más abajo). Nunca
  // achicamos las filas más que esto — si ni con este mínimo entran todas las
  // horas en pantalla, dejamos que la agenda crezca y el scroll PRINCIPAL de
  // la página se encargue (no un scroll interno de la agenda).
  const ALTURA_MINIMA_FILA = 22;
  // Umbral bajo el cual el contenido pasa al diseño de una sola línea.
  const UMBRAL_FILA_COMPACTA = 34;
  const alturaIdealPorFila = alturaFilasDisponible != null && todasHoras.length > 0
    ? alturaFilasDisponible / todasHoras.length
    : null;
  const alturaPorFila = alturaIdealPorFila != null
    ? Math.max(alturaIdealPorFila, ALTURA_MINIMA_FILA)
    : null;
  const filaEsCompacta = alturaPorFila != null && alturaPorFila < UMBRAL_FILA_COMPACTA;
  const pacientesFiltrados = pacientes.filter(p => p.nombre?.toLowerCase().includes(buscarPaciente.toLowerCase()) || p.carnet?.toLowerCase().includes(buscarPaciente.toLowerCase())).slice(0, 6);
  const serviciosDelArea = servicios.filter(s => {
    const areaIdUsar = areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
    const permitidos = profSeleccionado?.servicios_ids?.length ? profSeleccionado.servicios_ids : null;
    return Number(s.area_id) === Number(areaIdUsar) && (!permitidos || permitidos.includes(s.id));
  });
    const esAreaConServicios = profSeleccionado && !['zumba', 'gerontologia'].includes(profSeleccionado.area_nombre?.toLowerCase());

  function getPagoDelCiclo(cita: any) {
    if (!cita) return { monto_total: 0, monto_pagado: 0, metodo_pago: '' };
    const info = getGrupoInfoCanonico(cita);
    const sesionUno = citas.find(c =>
      c.patient_id === info.anclaPatientId &&
      c.profesional_id === cita.profesional_id &&
      c.ciclo === info.anclaCiclo &&
      String(c.sesion) === '1'
    );
    const fuente = sesionUno || cita;
    return {
      monto_total: Number(fuente.monto_total) || 0,
      monto_pagado: Number(fuente.monto_pagado) || 0,
      metodo_pago: fuente.metodo_pago || '',
    };
  }

  const servicioSeleccionadoActual = servicios.find(s => String(s.id) === formCita.servicio_id);
  const slotsNecesariosNueva = servicioSeleccionadoActual?.duracion_min
    ? Math.ceil(servicioSeleccionadoActual.duracion_min / slotMinutosProfesional) : 1;

  const servicioEditadoActual = citaSeleccionada
  ? servicios.find(s => String(s.id) === formEditar.servicio_id)
  : null;
  const slotsNecesariosEditar = servicioEditadoActual?.duracion_min
    ? Math.ceil(servicioEditadoActual.duracion_min / slotMinutosProfesional) : 1;

  const slotsNecesariosReagendar = citaSeleccionada?.duracion_min
    ? Math.ceil(citaSeleccionada.duracion_min / slotMinutosProfesional) : 1;

  const pagoCicloSeleccionado = getPagoDelCiclo(citaSeleccionada);
  const montoPendiente = pagoCicloSeleccionado.monto_total - pagoCicloSeleccionado.monto_pagado;
  const grupoInfoSeleccionado = getGrupoInfoCanonico(citaSeleccionada);
  const filasAsistenciaSeleccionada = getFilasSesionSeleccionada(citaSeleccionada);
  const serviciosPermitidosEditar = citaSeleccionada
    ? (() => {
        const prof = profesionales.find(p => p.id === citaSeleccionada.profesional_id);
        return prof?.servicios_ids?.length ? prof.servicios_ids : null;
      })()
    : null;
  function calcularProximaSesion(
    fechaBaseStr: string,
    horaBaseStr: string,
    semanasOffset: number,
    profesionalId: number,
    sesionesYaAsignadas: { fecha: string; hora: string }[],
    areaId?: number
  ): { fecha: string; hora: string } {
    if (!fechaBaseStr || !horaBaseStr) return { fecha: '', hora: '' };
    const fechaBase = new Date(fechaBaseStr.toString().slice(0, 10) + 'T00:00:00');
    fechaBase.setDate(fechaBase.getDate() + 7 * semanasOffset);
    const fechaStr = fechaBase.toISOString().split('T')[0];
    
    const areaIdUsar = areaId ?? areaSeleccionadaFiltro ?? profSeleccionado?.area_id;
    const horasDisponibles = horasProfParaDia(profesionalId, fechaStr, areaIdUsar);
    
    if (horasDisponibles.length === 0) return { fecha: fechaStr, hora: '' };
    const idxHoraBase = horasDisponibles.indexOf(horaBaseStr);
    const candidatas = idxHoraBase !== -1 ? horasDisponibles.slice(idxHoraBase) : horasDisponibles;
    for (const h of candidatas) {
      const yaAsignadaEnFormulario = sesionesYaAsignadas.some(s => s.fecha === fechaStr && s.hora === h);
      if (isSlotDisponiblePorFecha(fechaStr, h) && !yaAsignadaEnFormulario) {
        return { fecha: fechaStr, hora: h };
      }
    }
    return { fecha: fechaStr, hora: '' };
  }

  const inputCls = "w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all bg-white";
  const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block";

  return (
    <div className="agenda-root" style={{ fontFamily: 'inherit' }}>
     {(usuario?.rol === 'administrador' || usuario?.rol === 'recepcionista' || usuario?.rol === 'supervisor') && (
       <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
         <SesionesGrupalesPanel profesionales={profesionales} servicios={servicios} />
         <BloqueosAgendaPanel profesionales={profesionales} onCreado={cargarDatos} />
         <ReservasPublicasPanel />
       </div>
     )}
     <div
  className="agenda-filters"
  ref={accordionRef}
  style={{
    position: 'relative',
    marginBottom: '12px',
    overflow: 'visible'
  }}
>
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    }}
  >
    {/* ── GRUPO DE PASTILLAS (ÁREAS) ── */}
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
        flex: '1 1 auto',
      }}
    >
      {Object.entries(areasProfesionales)
        .filter(([area, data]: any) => {
          if (area === 'Sin area') return false;
          if (usuario?.rol === 'profesional') {
            return data.profesionales.some((p: any) => p.id === usuario.id);
          }
          const profesionalesConAreas = data.profesionales.filter((p: any) => {
            return p.areas && p.areas.length > 0;
          });
          return profesionalesConAreas.length > 0;
        })
        .map(([area, data]: any) => {
          // ← TODO EL MAP EXISTENTE (sin cambios)
          const estaActiva = areaExpandida === area;
          const esAreaSeleccionada = profSeleccionado && 
            data.profesionales.some((p: any) => p.id === profSeleccionado.id) &&
            areaSeleccionadaFiltro === data.profesionales.find((p: any) => p.id === profSeleccionado.id)?.area_id;

          return (
            <div
              key={area}
              style={{
                position: 'relative',
                display: 'inline-block',
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => {
                  if (estaActiva) {
                    setAreaExpandida('');
                  } else {
                    setAreaExpandida(area);
                  }
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s',
                  background: esAreaSeleccionada
                    ? '#A000D1'
                    : 'rgba(160,0,209,0.1)',
                  color: esAreaSeleccionada
                    ? '#fff'
                    : '#A000D1',
                  
                }}
              >
                {area}
                {esAreaSeleccionada && (
                  <span style={{ fontSize: '9px', marginLeft: '2px' }}></span>
                )}
                {data.profesionales.length > 1 && (
                  <IconChevronDown rotated={estaActiva} />
                )}
              </button>

              {estaActiva && data.profesionales?.length >= 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    zIndex: 9999,
                    background: '#fff',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    minWidth: '260px',
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  {/* Profesionales activos */}
                  {data.profesionales
                    .filter((p: any) => p.activo !== false && p.areas && p.areas.length > 0)
                    .map((p: any) => {
                      const esProfesionalSeleccionado = profSeleccionado?.id === p.id && areaSeleccionadaFiltro === p.area_id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setProfSeleccionado(p);
                            setAreaSeleccionadaFiltro(p.area_id);
                            setAreaExpandida('');
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 16px',
                            border: 'none',
                            cursor: 'pointer',
                            background: esProfesionalSeleccionado ? 'rgba(160,0,209,0.05)' : '#fff',
                            borderLeft: esProfesionalSeleccionado ? '3px solid #A000D1' : '3px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!esProfesionalSeleccionado) {
                              e.currentTarget.style.background = 'rgba(160,0,209,0.03)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!esProfesionalSeleccionado) {
                              e.currentTarget.style.background = '#fff';
                            }
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: esProfesionalSeleccionado ? '#A000D1' : '#1f2937',
                              }}
                            >
                              {p.nombre}
                            </div>
                            {p.especialidad && (
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: '#6b7280',
                                  marginTop: '2px',
                                }}
                              >
                                {p.especialidad}
                              </div>
                            )}
                          </div>
                          {esProfesionalSeleccionado && (
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                color: '#A000D1',
                                background: 'rgba(160,0,209,0.1)',
                                padding: '2px 7px',
                                borderRadius: '999px',
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}

                  {/* Separador y profesionales inactivos */}
                  {data.profesionales
                    .filter((p: any) => p.activo === false && p.areas && p.areas.length > 0)
                    .length > 0 && (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          opacity: 0.5,
                        }}
                        onClick={() => {
                          setMostrarInactivos(prev => ({
                            ...prev,
                            [area]: !prev[area]
                          }));
                        }}
                      >
                        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e5e7eb' }} />
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 500,
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{
                            display: 'inline-block',
                            transform: mostrarInactivos[area] ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                          }}>▶</span>
                          Inactivos ({data.profesionales.filter((p: any) => p.activo === false && p.areas && p.areas.length > 0).length})
                        </span>
                        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e5e7eb' }} />
                      </div>

                      {mostrarInactivos[area] && (
                        <div>
                          {data.profesionales
                            .filter((p: any) => p.activo === false && p.areas && p.areas.length > 0)
                            .map((p: any) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setProfSeleccionado(p);
                                  setAreaSeleccionadaFiltro(p.area_id);
                                  setAreaExpandida('');
                                }}
                                style={{
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '10px 16px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: profSeleccionado?.id === p.id ? 'rgba(160,0,209,0.05)' : '#fff',
                                  borderLeft: profSeleccionado?.id === p.id ? '3px solid #A000D1' : '3px solid transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  transition: 'all 0.15s',
                                  opacity: 0.6,
                                }}
                                onMouseEnter={(e) => {
                                  if (profSeleccionado?.id !== p.id) {
                                    e.currentTarget.style.background = 'rgba(160,0,209,0.03)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (profSeleccionado?.id !== p.id) {
                                    e.currentTarget.style.background = '#fff';
                                  }
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: 500,
                                      color: profSeleccionado?.id === p.id ? '#A000D1' : '#6b7280',
                                      textDecoration: 'line-through',
                                    }}
                                  >
                                    {p.nombre}
                                  </div>
                                  {p.especialidad && (
                                    <div
                                      style={{
                                        fontSize: '11px',
                                        color: '#9ca3af',
                                        marginTop: '2px',
                                      }}
                                    >
                                      {p.especialidad}
                                    </div>
                                  )}
                                </div>
                                {profSeleccionado?.id === p.id && (
                                  <span
                                    style={{
                                      fontSize: '9px',
                                      fontWeight: 700,
                                      color: '#A000D1',
                                      background: 'rgba(160,0,209,0.1)',
                                      padding: '2px 7px',
                                      borderRadius: '999px',
                                    }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>

    {/* ── NOMBRE DEL PROFESIONAL SELECCIONADO ── */}
    {profSeleccionado && (
      <div
        className="profesional-nombre"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          background: 'rgba(160,0,209,0.08)',
          borderRadius: '999px',
          border: '1px solid rgba(160,0,209,0.15)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '14px' }}>👤</span>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#A000D1',
          }}
        >
          {profSeleccionado.nombre}
        </span>
        {profesionalInactivo && (
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '999px', padding: '2px 8px', marginLeft: '4px' }}>
            🔒 Solo lectura (inactivo)
          </span>
        )}
      </div>
    )}
  </div>
</div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#6b7280', background: '#fff', borderRadius: '24px', border: '1px solid #efedf0' }}>Cargando...</div>
      ) : !profSeleccionado ? (
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #efedf0', padding: '64px 0', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#A000D1' }}>
            <IconCalendar />
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>Selecciona un área y profesional</p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Usa los filtros de arriba para comenzar</p>
        </div>
      ) : !profTieneHorarios && profSeleccionado?.activo !== false ? (
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #efedf0', padding: '64px 0', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>{profSeleccionado.nombre} no tiene horarios asignados</p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Ve a Admin → Personal → Ver horarios para asignarlos</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #efedf0', overflow: 'hidden' }}>
                    <div className="agenda-header-controls" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
            gap: '10px', padding: '14px 18px', borderBottom: '1px solid #f3f4f6',
          }}>
            <div className="agenda-header-toggle" style={{ display: 'flex', background: '#f3f4f6', borderRadius: '12px', padding: '3px', gap: '2px' }}>
              <button onClick={() => setVistaActual('mes')}
                style={{
                  padding: '5px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: vistaActual === 'mes' ? '#fff' : 'transparent',
                  color: vistaActual === 'mes' ? '#1f2937' : '#374151',
                  boxShadow: vistaActual === 'mes' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}>Mes</button>
              <button onClick={() => setVistaActual('semana')}
                style={{
                  padding: '5px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: vistaActual === 'semana' ? '#fff' : 'transparent',
                  color: vistaActual === 'semana' ? '#1f2937' : '#374151',
                  boxShadow: vistaActual === 'semana' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}>Semana</button>
            </div>
               <div className="agenda-header-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flex: 1, minWidth: '120px' }}>
              <button onClick={() => vistaActual === 'semana' ? cambiarSemana(-7) : cambiarMes(-1)}
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#f3f4f6', color: '#4b5563', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', textAlign: 'center', whiteSpace: 'nowrap' }}>{rangoLabel}</span>
              <button onClick={() => vistaActual === 'semana' ? cambiarSemana(7) : cambiarMes(1)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#f3f4f6', color: '#4b5563', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconChevronRight size={16} />
              </button>
            </div>
                        <button onClick={irAHoy} className="agenda-header-hoy"
              style={{ padding: '5px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '11px', fontWeight: 600, color: '#4b5563', cursor: 'pointer', flexShrink: 0 }}>
              Hoy
            </button>
          </div>

          {vistaActual === 'semana' ? (
            <>
              <div style={{
                display: 'table',
                width: '100%',
                tableLayout: 'fixed',
                borderBottom: '1px solid #f3f4f6',
              }}>
                <div style={{ display: 'table-row' }}>
                  <div style={{ display: 'table-cell', width: '30px', padding: '4px 1px', borderRight: '1px solid #f3f4f6', textAlign: 'center' }} />
                  {diasMostrar.map((dia, idx) => {
                    const fecha = getFechaDia(idx);
                    const esHoy = fecha.toDateString() === new Date().toDateString();
                    const tieneDia = horariosProfDia(dia).length > 0;
                    return (
                      <div key={dia} style={{
                        display: 'table-cell',
                        padding: '4px 1px',
                        textAlign: 'center',
                        borderRight: '1px solid #f3f4f6',
                        opacity: tieneDia ? 1 : 0.3,
                      }}>
                        <p style={{ fontSize: '9px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '1px' }}>{DIAS_CORTOS_SEM[idx]}</p>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: esHoy ? '#A000D1' : 'transparent',
                          color: esHoy ? '#fff' : '#374151',
                        }}>{fecha.getDate()}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                ref={semanaBodyRef}
                style={
                  isMobile
                    ? { maxHeight: 'clamp(340px, 65vh, 700px)', overflowY: 'auto', overflowX: 'hidden' }
                    : { overflow: 'visible' }
                }>
                {todasHoras.map(hora => (
                  <div key={hora} style={{
                    display: 'table',
                    width: '100%',
                    tableLayout: 'fixed',
                    borderBottom: '1px solid #fafafa',
                    height: alturaPorFila != null ? alturaPorFila : undefined,
                  }}>
                    <div style={{ display: 'table-row' }}>
                      <div style={{
                        display: 'table-cell',
                        width: '30px',
                        padding: '1px 2px 1px 1px',
                        borderRight: '1px solid #f3f4f6',
                        verticalAlign: 'middle',
                        textAlign: 'right',
                      }}>
                        <span style={{ fontSize: '10px', color: '#1f2937', fontWeight: 700 }}>{hora}</span>
                      </div>

                      {diasMostrar.map((dia, idx) => {
                        const enHorario = estaEnHorario(hora, dia);
                        const cita = getCitaEnSlot(hora, idx);
                        const fecha = getFechaDia(idx);
                        const fechaStr = fecha.toISOString().split('T')[0];
                        const gerontoOcupado = horaOcupadaPorGeronto(fechaStr, hora);
                        const esGeronto = gerontoOcupado.ocupado;
                        const bloqueoOcupado = bloqueoEnSlot(fechaStr, hora);
                        const esBloqueo = bloqueoOcupado.ocupado;
                        const sesionGrupalAqui = sesionGrupalEnSlot(fechaStr, hora);
                        const citasGrupoAqui = sesionGrupalAqui
                          ? citas.filter((c: any) =>
                              c.profesional_id === sesionGrupalAqui.professional_id &&
                              c.fecha?.startsWith(fechaStr) &&
                              c.hora?.slice(0, 5) === sesionGrupalAqui.hora_inicio.slice(0, 5) &&
                              c.estado !== 'cancelada'
                            )
                          : [];
                        // Si la plantilla de la sesión grupal ya se borró pero quedaron varias
                        // citas independientes a esa misma hora (ej. se cortó el servicio), las
                        // seguimos mostrando agrupadas — si no, solo se vería a una sola persona
                        // y las demás quedarían "escondidas" detrás de esa celda.
                        const citasHuerfanasAqui = !sesionGrupalAqui
                          ? citas.filter((c: any) =>
                              c.profesional_id === profSeleccionado?.id &&
                              c.fecha?.startsWith(fechaStr) &&
                              c.hora?.slice(0, 5) === hora &&
                              c.estado !== 'cancelada'
                            )
                          : [];
                        const esGrupoHuerfano = citasHuerfanasAqui.length > 1;
                        const slotMinutos = getSlotMinutosProfesional();
                        const esMultiSlot = cita && cita.duracion_min && cita.duracion_min > slotMinutos;
                        const esPrimerSlot = cita && cita.hora?.slice(0, 5) === hora;
                        const estilosBorde = getEstilosCelda(hora, idx);

                        return (
                          <div key={`${dia}-${hora}`} style={{
                            display: 'table-cell',
                            padding: '0.5px 1px',
                            verticalAlign: 'middle',
                            height: alturaPorFila != null ? alturaPorFila : undefined,
                          }}>
                            {sesionGrupalAqui ? (
                              <div
                                className="agenda-slot-cell"
                                onClick={() => setModalSesionGrupal({
                                  sesionId: sesionGrupalAqui.id,
                                  fecha: fechaStr,
                                  nombre: sesionGrupalAqui.servicio_nombre,
                                })}
                                title={`${sesionGrupalAqui.servicio_nombre} — ${citasGrupoAqui.length}/${sesionGrupalAqui.capacidad} inscritos`}
                                style={{
                                  height: alturaPorFila != null ? alturaPorFila : '30px',
                                  width: '100%',
                                  borderRadius: '6px',
                                  background: citasGrupoAqui.length >= sesionGrupalAqui.capacidad ? '#fee2e2' : '#ecfdf5',
                                  border: `1px solid ${citasGrupoAqui.length >= sesionGrupalAqui.capacidad ? '#fecaca' : '#a7f3d0'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  boxSizing: 'border-box',
                                }}>
                                <span style={{
                                  fontSize: '7px',
                                  fontWeight: 700,
                                  color: citasGrupoAqui.length >= sesionGrupalAqui.capacidad ? '#b91c1c' : '#047857',
                                  lineHeight: 1,
                                }}>
                                  👥 {citasGrupoAqui.length}/{sesionGrupalAqui.capacidad}
                                </span>
                              </div>
                            ) : esGrupoHuerfano ? (
                              <div
                                className="agenda-slot-cell"
                                onClick={() => setModalSesionGrupal({
                                  sesionId: null,
                                  fecha: fechaStr,
                                  nombre: citasHuerfanasAqui[0]?.servicio_nombre || 'Citas agrupadas',
                                  hora,
                                  profesionalId: profSeleccionado?.id,
                                })}
                                title={`${citasHuerfanasAqui.length} personas anotadas a esta hora (ya no se ofrece este servicio grupal)`}
                                style={{
                                  height: alturaPorFila != null ? alturaPorFila : '30px',
                                  width: '100%',
                                  borderRadius: '6px',
                                  background: '#f3f4f6',
                                  border: '1px solid #d1d5db',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  boxSizing: 'border-box',
                                }}>
                                <span style={{ fontSize: '7px', fontWeight: 700, color: '#4b5563', lineHeight: 1 }}>
                                  👥 {citasHuerfanasAqui.length}
                                </span>
                              </div>
                            ) : cita ? (
                              (() => {
                                const colorCita = cita.estado === 'confirmada'
                                  ? getColorCita(cita)
                                  : cita.estado === 'pendiente'
                                  ? { bg: '#fefce8', border: '#fde68a', text: '#92400e' }
                                  : { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' };
                                   return (
                                  <div
                                    className={estilosBorde + ' agenda-slot-cell'}
                                    onClick={() => { setCitaSeleccionada(cita); setEditandoCita(false); }}
                                    style={{
                                      height: alturaPorFila != null ? alturaPorFila : '30px',
                                      width: '100%',
                                      cursor: 'pointer',
                                      background: colorCita.bg,
                                      border: `1px solid ${colorCita.border}`,
                                      overflow: 'hidden',
                                      display: 'flex',
                                      flexDirection: filaEsCompacta ? 'row' : 'column',
                                      alignItems: filaEsCompacta ? 'center' : 'stretch',
                                      justifyContent: 'center',
                                      gap: filaEsCompacta ? '3px' : 0,
                                      padding: '1px 3px',
                                      boxSizing: 'border-box',
                                    }}>
                                    {(esPrimerSlot || !esMultiSlot) && (
                                      <>
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '2px',
                                          overflow: 'hidden',
                                          whiteSpace: 'nowrap',
                                          flexShrink: 0,
                                        }}>
                                         <span className="agenda-slot-time" style={{
                                            fontSize: '6px',
                                            fontWeight: 700,
                                            color: colorCita.text,
                                            flexShrink: 0,
                                            lineHeight: 1.1,
                                          }}>{cita.hora?.slice(0, 5)}</span>
                                           {cita.total_sesiones > 1 && (
                                            <span className="agenda-slot-badge" style={{
                                              fontSize: '7px',
                                              fontWeight: 700,
                                              padding: '0 2px',
                                              borderRadius: '2px',
                                              background: 'rgba(255,255,255,0.6)',
                                              color: colorCita.text,
                                              flexShrink: 0,
                                              lineHeight: 1.2,
                                            }}>{cita.sesion}/{cita.total_sesiones}</span>
                                          )}
                                           {cita.estado === 'confirmada' && (
                                            <span className="agenda-slot-badge" style={{
                                              fontSize: '7px',
                                              fontWeight: 700,
                                              padding: '0 2px',
                                              borderRadius: '2px',
                                              background: cita.asistio === true ? '#A000D1' : cita.asistio === false ? '#ef4444' : '#d1d5db',
                                              color: '#fff',
                                              flexShrink: 0,
                                              lineHeight: 1.2,
                                            }}>
                                              {cita.asistio === true ? '✓' : cita.asistio === false ? '✗' : '?'}
                                            </span>
                                          )}
                                        </div>
                                         <div className="agenda-slot-name" style={{
                                          fontSize: '8px',
                                          fontWeight: 500,
                                          color: colorCita.text,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          width: filaEsCompacta ? undefined : '100%',
                                          flex: filaEsCompacta ? '1 1 auto' : undefined,
                                          minWidth: 0,
                                          lineHeight: 1.2,
                                        }}>
                                          {nombreGrupoDisplay(cita)}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })()
                               ) : esGeronto ? (
                              <div className="agenda-slot-cell" style={{
                                height: alturaPorFila != null ? alturaPorFila : '30px',
                                width: '100%',
                                borderRadius: '6px',
                                background: '#f5f3ff',
                                border: '1px solid #ddd6fe',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box',
                              }}>
                                <span style={{ fontSize: '7px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', lineHeight: 1 }}>G</span>
                              </div>
                            ) : esBloqueo ? (
                              <div
                                className="agenda-slot-cell"
                                title={bloqueoOcupado.detalle}
                                style={{
                                  height: alturaPorFila != null ? alturaPorFila : '30px',
                                  width: '100%',
                                  borderRadius: '6px',
                                  background: 'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 4px, #e5e7eb 4px, #e5e7eb 8px)',
                                  border: '1px solid #d1d5db',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden',
                                  boxSizing: 'border-box',
                                  cursor: 'not-allowed',
                                }}>
                                <span style={{ fontSize: '6px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', lineHeight: 1, padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  🔒 {bloqueoOcupado.detalle}
                                </span>
                              </div>
                            ) : enHorario && !profesionalInactivo ? (
                               <div
                                onClick={() => abrirModalNuevaCita(hora, idx)}
                                className="slot-disponible agenda-slot-cell"
                                style={{
                                  height: alturaPorFila != null ? alturaPorFila : '30px',
                                  width: '100%',
                                  borderRadius: '6px',
                                  border: '1px dashed #e5e7eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  boxSizing: 'border-box',
                                }}>
                                <div style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  border: '1px solid rgba(160,0,209,0.45)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="rgba(160,0,209,0.85)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                  </svg>
                                </div>
                              </div>
                             ) : (
                              <div className="agenda-slot-cell" style={{ height: alturaPorFila != null ? alturaPorFila : '30px', width: '100%' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* ── VISTA MENSUAL ── */
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f3f4f6' }}>
                {DIAS_CORTOS_MES.map(d => (
                  <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {d}
                  </div>
                ))}
              </div>
             <div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  width: '100%',
}}>
  {getDiasMes().map((fecha, idx) => {
                  if (!fecha) return (
                    <div key={`empty-${idx}`} style={{ minHeight: isMobile ? 'clamp(50px, 8vw, 70px)' : 'clamp(80px, 13vw, 120px)', borderBottom: '1px solid #f9fafb', borderRight: '1px solid #f9fafb', background: '#fafafa' }} />
                  );
                  const esHoy = fecha.toDateString() === new Date().toDateString();
                  const citasDia = citasDelDia(fecha);
                  const trabajaHoy = profTrabajaDia(fecha);
                  const esDomingo = fecha.getDay() === 0;
                  const esUltimaDerecha = (idx + 1) % 7 === 0;
                  const tieneCitas = citasDia.length > 0;
                  const estaSeleccionado = diaSeleccionadoMes && fecha.toDateString() === diaSeleccionadoMes.toDateString();
                  const formularioAbierto = mostrarFormularioMes && fecha.toDateString() === mostrarFormularioMes.toDateString();
                  return (
                    <div
  key={fecha.toISOString()}
  style={{
    minHeight: isMobile ? 'clamp(50px, 8vw, 70px)' : 'clamp(80px, 13vw, 120px)',
    borderBottom: '1px solid #f3f4f6',
    borderRight: esUltimaDerecha ? 'none' : '1px solid #f3f4f6',
    padding: isMobile ? '4px 6px' : '6px',
    background: esDomingo ? '#fafafa' : (isMobile && estaSeleccionado ? 'rgba(160,0,209,0.03)' : (esHoy ? 'rgba(160,0,209,0.03)' : '#fff')),
    cursor: (trabajaHoy && !esDomingo) ? 'pointer' : 'default',
    transition: 'background 0.1s',
    position: 'relative',
  }}
  className={trabajaHoy && !esDomingo ? 'mes-dia-hover' : ''}>
  
  {/* CONTENIDO DEL DÍA */}
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span 
  onClick={(e) => {
    e.stopPropagation();
    if (trabajaHoy && !esDomingo) {
      setDiaSeleccionadoMes(fecha);
      setMostrarFormularioMes(null);
    }
  }}
  style={{
    fontSize: isMobile ? 'clamp(11px, 1.6vw, 14px)' : 'clamp(13px, 1.95vw, 17px)',
    fontWeight: 700,
    width: isMobile ? '24px' : '36px',
    height: isMobile ? '24px' : '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: esHoy ? '#A000D1' : 'transparent',
    color: esHoy ? '#fff' : '#1f2937',
    cursor: (trabajaHoy && !esDomingo) ? 'pointer' : 'default',
    flexShrink: 0,
  }}
>{fecha.getDate()}</span>
    
    {/* 👇 BOTÓN DE AGENDAR - SOLO EN DESKTOP (NO EN MOBILE) */}
    {!isMobile && trabajaHoy && !esDomingo && usuario?.rol !== 'profesional' && !profesionalInactivo && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          // Abrir el formulario directamente para este día
          const fechaStr = fecha.toISOString().split('T')[0];
          const horas = horasProfParaDia(profSeleccionado.id, fechaStr, areaSeleccionadaFiltro ?? profSeleccionado?.area_id);
          const primeraHoraLibre = horas.find(h => isSlotDisponiblePorFecha(fechaStr, h));
          if (!primeraHoraLibre) { 
            alert('No hay horarios disponibles para este día'); 
            return; 
          }
          setModalNuevaCita({ hora: primeraHoraLibre, fecha: fechaStr });
          setPacienteSeleccionado(null); 
          setBuscarPaciente(''); 
          setModoNuevoPaciente(true);
          setFormPaciente({ nombre: '', telefono: '', carnet: '', edad: '', contacto_relacion: '', contacto_nombre: '', contacto_telefono: '' });
                    setFormCita({ total_sesiones: 1, modalidad: 'presencial', estado: 'pendiente', monto_total: '', monto_pagado: '', metodo_pago: 'efectivo', servicio_id: '', servicio_nombre: '', notas: '' });
          setSesionesAdicionales([]);
          setSeccionSeleccionadaNueva('');
        }}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: '1px solid #ddd6fe',
          background: 'transparent',
          color: '#A000D1',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          fontSize: '14px',
          fontWeight: 600,
          flexShrink: 0,
          transition: 'all 0.1s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#A000D1';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = '#A000D1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#A000D1';
          e.currentTarget.style.borderColor = '#ddd6fe';
        }}
        title="Agendar cita en este día"
      >
        +
      </button>
    )}
    
    {isMobile && trabajaHoy && !esDomingo && tieneCitas && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#A000D1',
          display: 'inline-block',
        }} />
      </div>
    )}
  </div>
                      
                      {!isMobile && (() => {
  const citasAgrupadas = agruparCitasParaVista(citasDia);
  const fechaKey = fecha.toISOString().split('T')[0];
  const estaExpandido = diasExpandidos.has(fechaKey);
  const citasAMostrar = estaExpandido ? citasAgrupadas : citasAgrupadas.slice(0, 3);
  const hayMasCitas = citasAgrupadas.length > 3;
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '2px', 
      marginTop: '4px',
      overflow: 'hidden',
      width: '100%',
    }}>
      {citasAMostrar.map(cita => {
        const colorMes = cita.estado === 'confirmada'
          ? getColorCita(cita)
          : cita.estado === 'pendiente'
          ? { bg: '#fefce8', border: '#fde68a', text: '#92400e' }
          : { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' };
        const nombreMostrado = nombreGrupoDisplay(cita);
        return (
          <div
            key={cita.id}
            onClick={e => { e.stopPropagation(); setCitaSeleccionada(cita); setEditandoCita(false); }}
            style={{
              padding: '2px 6px',
              borderRadius: '6px',
              fontSize: 'clamp(8px, 1.1vw, 10px)',
              fontWeight: 600,
              cursor: 'pointer',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              background: colorMes.bg,
              color: colorMes.text,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              maxWidth: '100%',
            }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              flexShrink: 0,
              background: cita.asistio === true ? '#A000D1' : cita.asistio === false ? '#ef4444' : '#d1d5db',
            }} />
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}>
              {cita.hora?.slice(0, 5)} {nombreMostrado}
            </span>
          </div>
        );
      })}
      
      {/* Botón Ver más / Ver menos */}
      {hayMasCitas && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDiasExpandidos(prev => {
              const nuevo = new Set(prev);
              if (nuevo.has(fechaKey)) {
                nuevo.delete(fechaKey);
              } else {
                nuevo.add(fechaKey);
              }
              return nuevo;
            });
          }}
          style={{
            fontSize: '9px',
            color: '#A000D1',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 0',
            fontWeight: 600,
            textAlign: 'center',
            width: '100%',
            transition: 'color 0.1s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#7c0080'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#A000D1'}
        >
          {estaExpandido ? `− Ver menos (${citasAgrupadas.length})` : `+ Ver más (${citasAgrupadas.length - 3})`}
        </button>
      )}
    </div>
  );
})()}
                    </div>
                  );
                })}
              </div>

             {isMobile && diaSeleccionadoMes && (
  <div style={{ 
    borderTop: '1px solid #e5e7eb', 
    padding: '14px 12px 12px 12px',
    background: '#fff',
  }}>
    {/* Encabezado */}
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '10px',
    }}>
      <h4 style={{ 
        fontSize: '14px', 
        fontWeight: 600, 
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Pacientes · {diaSeleccionadoMes.toLocaleDateString('es', { day: 'numeric', month: 'short' })}
      </h4>
      <button 
        onClick={() => setDiaSeleccionadoMes(null)}
        style={{ 
          fontSize: '12px', 
          color: '#374151', 
          background: 'transparent',
          border: 'none',
          padding: '4px 8px',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        ✕
      </button>
    </div>

    {/* ── LISTA DE PACIENTES ── */}
    {agruparCitasParaVista(citasDelDia(diaSeleccionadoMes)).length > 0 ? (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {agruparCitasParaVista(citasDelDia(diaSeleccionadoMes)).map((cita, index, arr) => {
          const colorCita = cita.estado === 'confirmada'
            ? getColorCita(cita)
            : cita.estado === 'pendiente'
            ? { bg: '#fefce8', border: '#fde68a', text: '#92400e' }
            : { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' };
          const nombreMostrado = nombreGrupoDisplay(cita);
          return (
            <div key={cita.id}>
              <div
                onClick={() => { setCitaSeleccionada(cita); setEditandoCita(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 0',
                  cursor: 'pointer',
                  flexWrap: 'nowrap',
                }}
              >
                {/* Indicador de asistencia */}
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: cita.asistio === true ? '#A000D1' : cita.asistio === false ? '#ef4444' : '#d1d5db',
                }} />
                
                {/* Nombre - ocupa espacio flexible pero no se encoge */}
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#1f2937',
                  flex: '1 1 40%',
                  minWidth: '80px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {nombreMostrado}
                </span>
                
                {/* Hora - fijo */}
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 600,
                  color: '#4b5563',
                  flexShrink: 0,
                  padding: '0 4px',
                }}>
                  {cita.hora?.slice(0, 5)}
                </span>
                
                {/* Estado - se encoge pero no desaparece */}
                <span style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '1px 8px',
                  borderRadius: '999px',
                  background: colorCita.bg,
                  color: colorCita.text,
                  border: `1px solid ${colorCita.border}`,
                  flexShrink: 0,
                  textTransform: 'capitalize',
                }}>
                  {cita.estado === 'confirmada' ? 'Conf' : 'Res'}
                </span>
                
                {/* Sesión - siempre visible */}
                {cita.total_sesiones > 1 && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#374151',
                    background: '#f3f4f6',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    flexShrink: 0,
                    minWidth: '18px',
                    textAlign: 'center',
                  }}>
                    {cita.sesion}/{cita.total_sesiones}
                  </span>
                )}
              </div>
              
              {/* Línea divisoria - excepto después del último */}
              {index < arr.length - 1 && (
                <div style={{ borderBottom: '1px solid #f3f4f6' }} />
              )}
            </div>
          );
        })}
      </div>
    ) : (
      <div style={{ 
        textAlign: 'center', 
        padding: '24px 0',
        color: '#374151',
        fontSize: '13px',
      }}>
        No hay pacientes programados
      </div>
    )}

    {/* ── BOTÓN AGENDAR ── */}
    {/* ── BOTÓN AGENDAR ── */}
    {profTrabajaDia(diaSeleccionadoMes) && usuario?.rol !== 'profesional' && !profesionalInactivo && (
      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
        <button
          onClick={() => {
            if (!diaSeleccionadoMes) return;
            const fechaStr = diaSeleccionadoMes.toISOString().split('T')[0];
            const horas = horasProfParaDia(profSeleccionado.id, fechaStr);
            const primeraHoraLibre = horas.find(h => isSlotDisponiblePorFecha(fechaStr, h));
            if (!primeraHoraLibre) { 
              alert('No hay horarios disponibles para este día'); 
              return; 
            }
            setModalNuevaCita({ hora: primeraHoraLibre, fecha: fechaStr });
            setPacienteSeleccionado(null); 
            setBuscarPaciente(''); 
            setModoNuevoPaciente(true);
            setFormPaciente({ nombre: '', telefono: '', carnet: '', edad: '', contacto_relacion: '', contacto_nombre: '', contacto_telefono: '' });
               setFormCita({ total_sesiones: 1, modalidad: 'presencial', estado: 'pendiente', monto_total: '', monto_pagado: '', metodo_pago: 'efectivo', servicio_id: '', servicio_nombre: '', notas: '' });
    setSesionesAdicionales([]);
    setSeccionSeleccionadaNueva('');
  }}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: '10px',
            background: '#A000D1',
            color: '#fff',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(160,0,209,0.2)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agendar nueva cita
        </button>
      </div>
    )}
  </div>
)}
            </>
          )}

          
        </div>
      )}

      <NuevaCitaModal
        modalNuevaCita={modalNuevaCita}
        setModalNuevaCita={setModalNuevaCita}
        profSeleccionado={profSeleccionado}
        guardarNuevaCita={guardarNuevaCita}
        modoNuevoPaciente={modoNuevoPaciente}
        setModoNuevoPaciente={setModoNuevoPaciente}
        pacienteSeleccionado={pacienteSeleccionado}
        setPacienteSeleccionado={setPacienteSeleccionado}
        buscarPaciente={buscarPaciente}
        setBuscarPaciente={setBuscarPaciente}
        formPaciente={formPaciente}
        setFormPaciente={setFormPaciente}
        buscarPacientesMientrasEscribe={buscarPacientesMientrasEscribe}
        sugerenciasPacientes={sugerenciasPacientes}
        setSugerenciasPacientes={setSugerenciasPacientes}
        mostrarSugerencias={mostrarSugerencias}
        setMostrarSugerencias={setMostrarSugerencias}
        sugerenciasContacto={sugerenciasContacto}
        setSugerenciasContacto={setSugerenciasContacto}
        mostrarSugerenciasContacto={mostrarSugerenciasContacto}
        setMostrarSugerenciasContacto={setMostrarSugerenciasContacto}
        pacientesFiltrados={pacientesFiltrados}
        acompanantes={acompanantes}
        agregarAcompanante={agregarAcompanante}
        actualizarAcompanante={actualizarAcompanante}
        quitarAcompanante={quitarAcompanante}
        sugerenciasAcompanante={sugerenciasAcompanante}
        setSugerenciasAcompanante={setSugerenciasAcompanante}
        mostrarSugerenciasAcomp={mostrarSugerenciasAcomp}
        setMostrarSugerenciasAcomp={setMostrarSugerenciasAcomp}
        pacientes={pacientes}
        formCita={formCita}
        setFormCita={setFormCita}
        seccionesArea={seccionesArea}
        seccionSeleccionadaNueva={seccionSeleccionadaNueva}
        setSeccionSeleccionadaNueva={setSeccionSeleccionadaNueva}
        esAreaConServicios={esAreaConServicios}
        serviciosDelArea={serviciosDelArea}
        horasProfParaDia={horasProfParaDia}
        areaSeleccionadaFiltro={areaSeleccionadaFiltro}
        isSlotDisponiblePorFecha={isSlotDisponiblePorFecha}
        horaOcupadaPorGeronto={horaOcupadaPorGeronto}
        slotsNecesariosNueva={slotsNecesariosNueva}
        getSlotsConsecutivosLibres={getSlotsConsecutivosLibres}
        servicioSeleccionadoActual={servicioSeleccionadoActual}
        sesionesAdicionales={sesionesAdicionales}
        setSesionesAdicionales={setSesionesAdicionales}
        calcularProximaSesion={calcularProximaSesion}
        guardandoCita={guardandoCita}
      />
      {citaSeleccionada && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
    onClick={() => cerrarCitaSeleccionada()}>
    <div className="modal-card" style={{ background: '#fff', borderRadius: '28px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', border: '1px solid #efedf0' }}
      onClick={e => e.stopPropagation()}>
      
      {/* HEADER */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, background: '#fff', zIndex: 10, borderRadius: '28px 28px 0 0' }}>
        <div>
          {/* Todos los pacientes de la cita se muestran con el MISMO tamaño y color,
              en el orden canónico del ciclo, para que quede claro que es un mismo servicio
              con 2+ pacientes (ej. terapia de pareja) y no "un paciente + un acompañante menor". */}
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>
            {grupoInfoSeleccionado.participantes.map(p => p.nombre).join('  +  ')}
          </h3>
          <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconClock /> {formatFecha(citaSeleccionada.fecha)} · {citaSeleccionada.hora?.slice(0, 5)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Botón Editar - SOLO para admin/supervisor */}
          {!editandoCita && usuario?.rol !== 'profesional' && !profesionalInactivo && (
            <button onClick={() => {
              setEditandoCita(true); setSesionesAdicionalesEditar([]);
              const pagoCiclo = getPagoDelCiclo(citaSeleccionada);
              const infoGrupo = getGrupoInfoCanonico(citaSeleccionada);
              setParticipantesEditar(infoGrupo.participantes.map(p => ({
                patient_id: p.patient_id,
                nombre: p.nombre || '',
                telefono: p.telefono || '',
                carnet: p.carnet || '',
                edad: p.edad || '',
                contacto_relacion: p.contacto_relacion || '',
                contacto_nombre: p.contacto_nombre || '',
                contacto_telefono: p.contacto_telefono || '',
                esNuevo: false,
              })));
const servicioActual = servicios.find(s => s.nombre === citaSeleccionada.servicio_nombre && Number(s.area_id) === Number(citaSeleccionada.area_id));
setSeccionSeleccionadaEditar(servicioActual?.seccion_id || '');
setFormEditar({
  estado: citaSeleccionada.estado,
  modalidad: citaSeleccionada.modalidad || 'presencial',
  monto_total: pagoCiclo.monto_total || '',
  monto_pagado: pagoCiclo.monto_pagado || '',
  metodo_pago: pagoCiclo.metodo_pago || 'efectivo',
  notas: citaSeleccionada.notas || '',
  total_sesiones: citaSeleccionada.total_sesiones || 1,
  servicio_nombre: citaSeleccionada.servicio_nombre || '',
  servicio_id: servicioActual ? String(servicioActual.id) : '',
});
            }} style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconEdit />
            </button>
          )}
          <button onClick={() => cerrarCitaSeleccionada()} style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#f3f4f6', color: '#6b7280', cursor: 'pointer', fontSize: '13px' }}>✕</button>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="modal-body-desktop" style={{ padding: '18px 20px' }}>
        {!editandoCita ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* GRID DE INFORMACIÓN BÁSICA - Visible para TODOS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
  {[
    { label: 'Área', value: citaSeleccionada.area_nombre },
    { label: 'Profesional', value: citaSeleccionada.profesional_nombre },
    { label: 'Modalidad', value: citaSeleccionada.modalidad },
    { label: 'Sesión', value: `${citaSeleccionada.sesion} / ${citaSeleccionada.total_sesiones || 1}` },
    ...(citaSeleccionada.servicio_nombre
      ? [{ label: 'Servicio', value: citaSeleccionada.servicio_nombre }]
      : []),
  ].map(item => (
    <div key={item.label} style={{ background: '#f9fafb', borderRadius: '12px', padding: '10px 12px', border: '1px solid #f3f4f6' }}>
      <p style={{ fontSize: '9px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{item.label}</p>
      <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937', textTransform: 'capitalize' }}>{item.value}</p>
    </div>
  ))}
              <div style={{ gridColumn: '1/-1', background: '#f9fafb', borderRadius: '12px', padding: '10px 12px', border: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: '9px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Estado</p>
                {(() => {
                  const colorEstado = citaSeleccionada.estado === 'confirmada'
                    ? getColorCita(citaSeleccionada)
                    : citaSeleccionada.estado === 'pendiente'
                    ? { bg: '#fefce8', border: '#fde68a', text: '#92400e' }
                    : { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' };
                  return (
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', border: '1px solid',
                      background: colorEstado.bg, color: colorEstado.text, borderColor: colorEstado.border,
                    }}>{citaSeleccionada.estado}</span>
                  );
                })()}
              </div>
            </div>

            {/* SECCIÓN PAGO - SOLO para admin/supervisor */}
            {/* SECCIÓN PAGO - SOLO para admin/supervisor */}
            {usuario?.rol !== 'profesional' && citaSeleccionada.estado === 'confirmada' && (
              <div style={{ background: 'rgba(245,243,255,0.5)', border: '1px solid #ede9fe', borderRadius: '16px', padding: '14px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Pago</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                  {[
                    { label: 'Total', value: `Bs ${pagoCicloSeleccionado.monto_total}`, color: '#1f2937' },
                    { label: 'Pagado', value: `Bs ${pagoCicloSeleccionado.monto_pagado}`, color: '#5b21b6' },
                    { label: 'Pendiente', value: `Bs ${montoPendiente > 0 ? montoPendiente : 0}`, color: montoPendiente > 0 ? '#ef4444' : '#5b21b6' },
                  ].map(item => (
                    <div key={item.label} style={{ background: '#fff', borderRadius: '10px', padding: '8px', border: '1px solid #f3f4f6' }}>
                      <p style={{ fontSize: '9px', color: '#374151' }}>{item.label}</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                {pagoCicloSeleccionado.metodo_pago && (
                  <p style={{ fontSize: '10px', color: '#374151', marginTop: '8px', textAlign: 'center' }}>
                    Método: <span style={{ fontWeight: 600, color: '#4b5563', textTransform: 'capitalize' }}>{pagoCicloSeleccionado.metodo_pago}</span>
                  </p>
                )}
              </div>
            )}

            {/* Mensaje de reserva pendiente - visible para TODOS */}
            {citaSeleccionada.estado === 'pendiente' && (
              <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '14px', padding: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>Reserva pendiente de confirmación</p>
                <p style={{ fontSize: '10px', color: '#b45309', marginTop: '2px' }}>Edita para confirmar el pago</p>
              </div>
            )}

            {/* NOTAS - Visible para TODOS */}
            {citaSeleccionada.notas && (
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '10px 12px', border: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: '9px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Notas</p>
                <p style={{ fontSize: '12px', color: '#374151' }}>{citaSeleccionada.notas}</p>
              </div>
            )}

            {/* ASISTENCIA - Visible para TODOS (solo si está confirmada) */}
            {/* La asistencia SÍ es individual (cada persona puede venir o no), pero el
                reagendado es UNO SOLO para toda la sesión: son los mismos pacientes en
                el mismo horario, así que se mueven todos juntos, nunca por separado. */}
            {citaSeleccionada.estado === 'confirmada' && !profesionalInactivo && (
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Marcar asistencia{filasAsistenciaSeleccionada.length > 1 ? ' (por persona)' : ''}
                </p>
                {filasAsistenciaSeleccionada.map(fila => (
                  <div key={fila.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filasAsistenciaSeleccionada.length > 1 && (
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: 0 }}>{fila.paciente_nombre}</p>
                    )}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => marcarAsistencia(fila.id, true)}
                        style={{ flex: 1, padding: '8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, border: `1px solid ${fila.asistio === true ? '#A000D1' : '#ddd6fe'}`, background: fila.asistio === true ? '#A000D1' : '#f5f3ff', color: fila.asistio === true ? '#fff' : '#5b21b6', cursor: 'pointer' }}>
                        Asistió
                      </button>
                      <button onClick={() => marcarAsistencia(fila.id, false)}
                        style={{ flex: 1, padding: '8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, border: `1px solid ${fila.asistio === false ? '#ef4444' : '#fecaca'}`, background: fila.asistio === false ? '#ef4444' : '#fef2f2', color: fila.asistio === false ? '#fff' : '#991b1b', cursor: 'pointer' }}>
                        No asistió
                      </button>
                    </div>
                  </div>
                ))}

                {/* ── Reagendar: UNO solo para toda la cita, mueve a todos los pacientes juntos ── */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      const siguiente = !reagendando;
                      setReagendando(siguiente);
                      setFormReagendar({ fecha: '', hora: '' });
                    }}
                    style={{ 
                      width: '100%', padding: '9px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, 
                      border: `1px solid ${reagendando ? '#374151' : '#e5e7eb'}`, 
                      background: reagendando ? '#1f2937' : '#f9fafb', 
                      color: reagendando ? '#fff' : '#4b5563', 
                      cursor: 'pointer' 
                    }}
                  >
                    {reagendando ? 'Cancelar reagendado' : `Reagendar${filasAsistenciaSeleccionada.length > 1 ? ' (todos los pacientes)' : ''}`}
                  </button>

                  {reagendando && (
                    <div style={{ background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Nueva fecha y hora{filasAsistenciaSeleccionada.length > 1 ? ` · ${filasAsistenciaSeleccionada.map(f => f.paciente_nombre).join(' + ')}` : ''}
                      </p>
                      <input type="date" value={formReagendar.fecha} onChange={e => setFormReagendar({ fecha: e.target.value, hora: '' })} className={inputCls} />
                      {formReagendar.fecha && (
                        horasProfParaDia(citaSeleccionada.profesional_id, formReagendar.fecha, citaSeleccionada.area_id).length === 0 ? (
                          <p style={{ fontSize: '10px', color: '#ef4444', background: '#fef2f2', padding: '6px', borderRadius: '8px', border: '1px solid #fecaca' }}>El profesional no trabaja este día</p>
                        ) : (
                                                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {horasProfParaDia(citaSeleccionada.profesional_id, formReagendar.fecha, citaSeleccionada.area_id).map(h => {
                              const idsSesion = filasAsistenciaSeleccionada.map(f => f.id);
                              const ocupada = !isSlotDisponiblePorFecha(formReagendar.fecha, h, idsSesion, citaSeleccionada.profesional_id);
                              return (
                                <button key={h} type="button" disabled={ocupada}
                                  onClick={() => { if (!ocupada) setFormReagendar({ ...formReagendar, hora: h }); }}
                                  style={{
                                    padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                                    border: `1px solid ${ocupada ? '#e5e7eb' : formReagendar.hora === h ? '#A000D1' : '#e5e7eb'}`,
                                    background: ocupada ? '#f3f4f6' : formReagendar.hora === h ? '#A000D1' : '#fff',
                                    color: ocupada ? '#9ca3af' : formReagendar.hora === h ? '#fff' : '#4b5563',
                                    cursor: ocupada ? 'not-allowed' : 'pointer',
                                    textDecoration: ocupada ? 'line-through' : 'none',
                                  }}>
                                  {h}
                                </button>
                              );
                            })}
                          </div>
                        )
                      )}
                      {formReagendar.fecha && formReagendar.hora && slotsNecesariosReagendar > 1 && (() => {
                        const idsSesion = filasAsistenciaSeleccionada.map(f => f.id);
                        const consecutivos = getSlotsConsecutivosLibres(formReagendar.fecha, formReagendar.hora, citaSeleccionada.profesional_id, idsSesion);
                        if (consecutivos >= slotsNecesariosReagendar) return null;
                        return (
                          <p style={{ fontSize: '10px', color: '#c2410c', background: '#fff7ed', padding: '6px 10px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                            ⚠ El servicio dura {citaSeleccionada.duracion_min} min ({slotsNecesariosReagendar} horarios) pero este día solo hay {consecutivos} hora{consecutivos === 1 ? '' : 's'} libre{consecutivos === 1 ? '' : 's'} seguida{consecutivos === 1 ? '' : 's'} desde las {formReagendar.hora}. Se registrará solo con esa hora — cambia el horario o la fecha si necesitas cubrir la duración completa.
                          </p>
                        );
                      })()}
                      {formReagendar.fecha && formReagendar.hora && (
                        <button onClick={guardarReagendar} style={{ width: '100%', padding: '10px', background: '#A000D1', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(160,0,209,0.3)' }}>
                          Confirmar · {formReagendar.hora} — {formatFecha(formReagendar.fecha)}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // FORMULARIO DE EDICIÓN - SOLO para admin/supervisor
          <form onSubmit={guardarEdicionCita} className="modal-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* ── PACIENTES DEL CICLO ── Mismo formato que al crear: paciente principal +
                acompañantes, todos editables, con opción de agregar o quitar pacientes. */}
                        {/* ── PACIENTE 1 (principal) — mismo estilo plano que "Datos del paciente" en Nueva reserva ── */}
            <div>
  <label className={labelCls}>Datos del paciente</label>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {/* NOMBRE CON AUTOCOMPLETADO - EDICIÓN */}
      <div style={{ position: 'relative' }}>
        <input 
          type="text" 
          placeholder="Nombre completo *" 
          value={participantesEditar[0]?.nombre || ''} 
          onChange={(e) => {
            const valor = e.target.value;
            // ✅ CAMBIA ESTO: Agrega capitalizarTexto
            const valorCapitalizado = capitalizarTexto(valor); // <-- NUEVA LÍNEA
            actualizarParticipanteEditar(0, { nombre: valorCapitalizado }); // <-- CAMBIA aquí
            const resultados = buscarPacientesMientrasEscribe(valorCapitalizado, 'nombre');
            setSugerenciasPacientes(resultados);
            setMostrarSugerencias(resultados.length > 0 && valor.length >= 2);
          }}
          onFocus={(e) => {
            if (e.target.value.length >= 2) {
              const resultados = buscarPacientesMientrasEscribe(e.target.value, 'nombre');
              setSugerenciasPacientes(resultados);
              setMostrarSugerencias(resultados.length > 0);
            }
          }}
          onBlur={() => {
            setTimeout(() => setMostrarSugerencias(false), 200);
          }}
          className={inputCls} 
        />
        {mostrarSugerencias && sugerenciasPacientes.length > 0 && (
          <div style={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            zIndex: 9999,
            background: '#fff', 
            borderRadius: '14px', 
            marginTop: '6px', 
            border: '1px solid #f3f4f6', 
            maxHeight: '180px', 
            overflowY: 'auto', 
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)' 
          }}>
            {sugerenciasPacientes.map(p => (
              <button 
                key={p.id} 
                type="button" 
                               onClick={() => {
  // ✅ OBTENER EL PACIENTE ACTUAL PARA NO PERDER DATOS
  const pacienteActual = participantesEditar[0] || {};
  
  actualizarParticipanteEditar(0, {
    // Mantener patient_id
    patient_id: p.id,
    // ✅ SOLO LLENAR CAMPOS VACÍOS
    nombre: pacienteActual.nombre || p.nombre || '',
    telefono: pacienteActual.telefono || p.telefono || '',
    carnet: pacienteActual.carnet || p.carnet || '',
    edad: pacienteActual.edad || p.edad || '',
    // 👇 El contacto de emergencia NO se autorellena aquí: se deja como
    // esté ya en el formulario, sin copiar el del paciente encontrado.
    esNuevo: false,
  });
  
  setSugerenciasPacientes([]);
  setMostrarSugerencias(false);
}}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '8px 14px', 
                  border: 'none', 
                  background: '#fff', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #f9fafb',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f3ff'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>{p.nombre}</p>
                <p style={{ fontSize: '11px', color: '#374151' }}>
                  {p.carnet && `🆔 ${p.carnet}`} 
                  {p.telefono && ` · 📱 ${p.telefono}`}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
      <input type="number" placeholder="Edad" value={participantesEditar[0]?.edad || ''} 
        onChange={e => actualizarParticipanteEditar(0, { edad: e.target.value })} 
        className={inputCls} />
    </div>
    <input type="text" placeholder="Teléfono" value={participantesEditar[0]?.telefono || ''} 
      onChange={e => actualizarParticipanteEditar(0, { telefono: e.target.value })} 
      className={inputCls} />
    <input type="text" placeholder="Carnet de identidad" value={participantesEditar[0]?.carnet || ''} 
      onChange={e => actualizarParticipanteEditar(0, { carnet: e.target.value })} 
      className={inputCls} />
  </div>
</div>

           <div>
  <label className={labelCls}>Contacto de emergencia</label>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
    <input 
      type="text" 
      placeholder="Relación (ej: Hija)" 
      value={participantesEditar[0]?.contacto_relacion || ''} 
      onChange={e => actualizarParticipanteEditar(0, { contacto_relacion: e.target.value })} 
      className={inputCls} 
    />
    
    {/* NOMBRE DEL CONTACTO CON AUTOCOMPLETADO - EDICIÓN */}
    <div style={{ position: 'relative' }}>
      <input 
        type="text" 
        placeholder="Nombre completo del contacto" 
        value={participantesEditar[0]?.contacto_nombre || ''} 
        onChange={(e) => {
          const valor = e.target.value;
          // ✅ CAMBIA ESTO: Agrega capitalizarTexto
          const valorCapitalizado = capitalizarTexto(valor); // <-- NUEVA LÍNEA
          actualizarParticipanteEditar(0, { contacto_nombre: valorCapitalizado }); // <-- CAMBIA aquí
          const resultados = buscarPacientesMientrasEscribe(valorCapitalizado, 'nombre');
          setSugerenciasContacto(resultados);
          setMostrarSugerenciasContacto(resultados.length > 0 && valor.length >= 2);
        }}
        onFocus={(e) => {
          if (e.target.value.length >= 2) {
            const resultados = buscarPacientesMientrasEscribe(e.target.value, 'nombre');
            setSugerenciasContacto(resultados);
            setMostrarSugerenciasContacto(resultados.length > 0);
          }
        }}
        onBlur={() => {
          setTimeout(() => setMostrarSugerenciasContacto(false), 200);
        }}
        className={inputCls} 
      />
      
      {mostrarSugerenciasContacto && sugerenciasContacto.length > 0 && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          zIndex: 9999,
          background: '#fff', 
          borderRadius: '14px', 
          marginTop: '6px', 
          border: '1px solid #f3f4f6', 
          maxHeight: '150px', 
          overflowY: 'auto', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)' 
        }}>
          {sugerenciasContacto.map(p => (
            <button 
              key={p.id} 
              type="button" 
              onClick={() => {
  // ✅ OBTENER EL PACIENTE ACTUAL
  const pacienteActual = participantesEditar[0] || {};
  
  actualizarParticipanteEditar(0, {
  ...pacienteActual,
  contacto_nombre: p.nombre || '',
  contacto_telefono: pacienteActual.contacto_telefono || p.telefono || '',
  contacto_relacion: pacienteActual.contacto_relacion || p.contacto_relacion || '',
});
  
  setSugerenciasContacto([]);
  setMostrarSugerenciasContacto(false);
}}
              style={{ 
                width: '100%', 
                textAlign: 'left', 
                padding: '8px 14px', 
                border: 'none', 
                background: '#fff', 
                cursor: 'pointer', 
                borderBottom: '1px solid #f9fafb',
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f3ff'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>{p.nombre}</p>
              <p style={{ fontSize: '10px', color: '#374151' }}>
                {p.carnet && `🆔 ${p.carnet}`} 
                {p.telefono && ` · 📱 ${p.telefono}`}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
    
    <input 
      type="tel" 
      placeholder="Teléfono del contacto" 
      value={participantesEditar[0]?.contacto_telefono || ''} 
      onChange={e => actualizarParticipanteEditar(0, { contacto_telefono: e.target.value })} 
      className={inputCls} 
    />
  </div>
</div>

            {/* ── ACOMPAÑANTES (Paciente 2, 3...) — mismo estilo de tarjetas que "Acompañantes" en Nueva reserva ── */}
            <div className="span-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className={labelCls}>Acompañantes (opcional)</label>
                <button type="button" onClick={agregarParticipanteEditar}
                  style={{ fontSize: '12px', color: '#A000D1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  + Agregar paciente
                </button>
              </div>
              {participantesEditar.length <= 1 ? (
                <p style={{ fontSize: '10px', color: '#374151' }}>Usa esto para citas con más de un paciente en el mismo horario (ej. terapia de pareja o familiar).</p>
              ) : (
                <div className="participantes-grid" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {participantesEditar.slice(1).map((p, i) => {
  const idx = i + 1;
  return (
    <div key={idx} style={{ padding: '12px', background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
          Paciente {idx + 1}{p.esNuevo ? ' (nuevo)' : ''}
        </span>
        <button type="button" onClick={() => quitarParticipanteEditar(idx)}
          style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
          Quitar
        </button>
      </div>

      {p.esNuevo && p.modo === 'existente' ? (
        p.patient_id ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>{p.nombre}</p>
              <p style={{ fontSize: '10px', color: '#374151' }}>{p.carnet && `CI: ${p.carnet}`} {p.telefono && `· ${p.telefono}`}</p>
            </div>
            <button type="button" onClick={() => actualizarParticipanteEditar(idx, { patient_id: null, nombre: '', telefono: '', carnet: '', edad: '', buscar: '' })}>
              Cambiar
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Buscar por nombre o carnet..." 
              value={p.buscar || ''}
              onChange={(e) => {
                const valor = e.target.value;
                actualizarParticipanteEditar(idx, { buscar: valor });
                const resultados = buscarPacientesMientrasEscribe(valor, 'nombre');
                setSugerenciasPacientes(resultados);
                setMostrarSugerencias(resultados.length > 0 && valor.length >= 2);
              }}
              onFocus={(e) => {
                if (e.target.value.length >= 2) {
                  const resultados = buscarPacientesMientrasEscribe(e.target.value, 'nombre');
                  setSugerenciasPacientes(resultados);
                  setMostrarSugerencias(resultados.length > 0);
                }
              }}
              onBlur={() => {
                setTimeout(() => setMostrarSugerencias(false), 200);
              }}
              className={inputCls} 
              autoFocus
            />
            {mostrarSugerencias && sugerenciasPacientes.length > 0 && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                zIndex: 9999,
                background: '#fff', 
                borderRadius: '14px', 
                marginTop: '6px', 
                border: '1px solid #f3f4f6', 
                maxHeight: '150px', 
                overflowY: 'auto', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)' 
              }}>
                {sugerenciasPacientes.map(pac => (
                  <button 
                    key={pac.id} 
                    type="button" 
                    onClick={() => {
                      actualizarParticipanteEditar(idx, {
                        patient_id: pac.id,
                        nombre: pac.nombre || '',
                        telefono: pac.telefono || '',
                        carnet: pac.carnet || '',
                        edad: pac.edad || '',
                        esNuevo: true,
                        modo: 'existente',
                        buscar: pac.nombre || '',
                      });
                      setSugerenciasPacientes([]);
                      setMostrarSugerencias(false);
                    }}
                    style={{ 
                      width: '100%', 
                      textAlign: 'left', 
                      padding: '8px 14px', 
                      border: 'none', 
                      background: '#fff', 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #f9fafb',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f3ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>{pac.nombre}</p>
                    <p style={{ fontSize: '10px', color: '#374151' }}>
                      {pac.carnet && `🆔 ${pac.carnet}`} 
                      {pac.telefono && ` · 📱 ${pac.telefono}`}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        // ✅ AQUÍ ESTÁ EL CAMPO DE NOMBRE QUE DEBES MODIFICAR
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
    <div style={{ position: 'relative' }}>
      <input 
        type="text" 
        placeholder="Nombre completo *" 
        value={p.nombre} 
        onChange={(e) => {
          const valor = e.target.value;
          // ✅ CAMBIA ESTO: Agrega capitalizarTexto
          const valorCapitalizado = capitalizarTexto(valor); // <-- NUEVA LÍNEA
          actualizarParticipanteEditar(idx, { 
            nombre: valorCapitalizado, // <-- CAMBIA aquí
            patient_id: null 
          });
          const resultados = buscarPacientesMientrasEscribe(valorCapitalizado, 'nombre');
          setSugerenciasAcompanante(prev => ({ ...prev, [idx]: resultados }));
          setMostrarSugerenciasAcomp(prev => ({ ...prev, [idx]: resultados.length > 0 && valor.length >= 2 }));
        }}
              onFocus={(e) => {
                if (e.target.value.length >= 2) {
                  const resultados = buscarPacientesMientrasEscribe(e.target.value, 'nombre');
                  setSugerenciasAcompanante(prev => ({ ...prev, [idx]: resultados }));
                  setMostrarSugerenciasAcomp(prev => ({ ...prev, [idx]: resultados.length > 0 }));
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setMostrarSugerenciasAcomp(prev => ({ ...prev, [idx]: false }));
                }, 200);
              }}
              className={inputCls} 
            />
            {/* ✅ AHORA USA mostrarSugerenciasAcomp[idx] en lugar de mostrarSugerencias */}
            {mostrarSugerenciasAcomp[idx] && sugerenciasAcompanante[idx]?.length > 0 && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                zIndex: 9999,
                background: '#fff', 
                borderRadius: '14px', 
                marginTop: '6px', 
                border: '1px solid #f3f4f6', 
                maxHeight: '150px', 
                overflowY: 'auto', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)' 
              }}>
                {sugerenciasAcompanante[idx].map(pac => (
                  <button 
                    key={pac.id} 
                    type="button" 
                    // ✅ AHORA
onClick={() => {
  actualizarParticipanteEditar(idx, {
    patient_id: pac.id,
    nombre: pac.nombre || '',
    telefono: pac.telefono || '',
    carnet: pac.carnet || '',
    edad: pac.edad || '',
    esNuevo: true,
    modo: 'nuevo',  // ← ✅ MANTIENE 'nuevo' (campos editables)
    buscar: pac.nombre || '',  // ← ✅ El campo de búsqueda muestra el nombre
  });
  setSugerenciasAcompanante(prev => ({ ...prev, [idx]: [] }));
  setMostrarSugerenciasAcomp(prev => ({ ...prev, [idx]: false }));
}}
                    style={{ 
                      width: '100%', 
                      textAlign: 'left', 
                      padding: '8px 14px', 
                      border: 'none', 
                      background: '#fff', 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #f9fafb',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f3ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>{pac.nombre}</p>
                    <p style={{ fontSize: '10px', color: '#374151' }}>
                      {pac.carnet && `🆔 ${pac.carnet}`} 
                      {pac.telefono && ` · 📱 ${pac.telefono}`}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input type="number" placeholder="Edad" value={p.edad} 
            onChange={e => actualizarParticipanteEditar(idx, { edad: e.target.value })} 
            className={inputCls} />
          <input type="text" placeholder="Teléfono" value={p.telefono} 
            onChange={e => actualizarParticipanteEditar(idx, { telefono: e.target.value })} 
            className={inputCls} />
          <input type="text" placeholder="Carnet" value={p.carnet} 
            onChange={e => actualizarParticipanteEditar(idx, { carnet: e.target.value })} 
            className={inputCls} />
        </div>
      )}

      {p.esNuevo && (
        <button type="button"
          onClick={() => actualizarParticipanteEditar(idx, { modo: p.modo === 'nuevo' ? 'existente' : 'nuevo', patient_id: null, nombre: '', telefono: '', carnet: '', edad: '', buscar: '' })}
          style={{ fontSize: '11px', color: '#A000D1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}>
          {p.modo === 'nuevo' ? '← Buscar existente' : '+ Escribir nuevo paciente'}
        </button>
      )}
    </div>
  );
})}
                </div>
              )}
            </div>

                        <div>
              <label className={labelCls}>Modalidad</label>
              <select value={formEditar.modalidad} onChange={e => setFormEditar({ ...formEditar, modalidad: e.target.value })} className={inputCls}>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="domicilio">Domicilio</option>
              </select>
            </div>

                             {seccionesArea.length > 0 && (
                    <div className="span-2">
                      <label className={labelCls}>Sección</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                        {seccionesArea.map(sec => (
                          <label key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 6px', borderRadius: '8px' }}>
                            <input
                              type="radio"
                              name="seccion_editar_cita"
                              checked={seccionSeleccionadaEditar === sec.id}
                              onChange={() => {
                                setSeccionSeleccionadaEditar(sec.id);
                                setFormEditar({ ...formEditar, servicio_id: '', servicio_nombre: '' });
                              }}
                            />
                            <span style={{ fontSize: '13px', color: '#1f2937' }}>{sec.nombre}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                                   {servicios.filter(s => s.area_id === citaSeleccionada.area_id && !['zumba', 'gerontologia'].includes(citaSeleccionada.area_nombre?.toLowerCase()) && (seccionesArea.length === 0 || s.seccion_id === seccionSeleccionadaEditar) && (!serviciosPermitidosEditar || serviciosPermitidosEditar.includes(s.id))).length > 0 && (
  <div>
    <label className={labelCls}>Servicio</label>
    <div style={{ position: 'relative' }}>
      <select
        value={formEditar.servicio_id || ''}
        onChange={e => {
          const listaServicios = servicios.filter(s => Number(s.area_id) === Number(citaSeleccionada.area_id) && (seccionesArea.length === 0 || s.seccion_id === seccionSeleccionadaEditar) && (!serviciosPermitidosEditar || serviciosPermitidosEditar.includes(s.id)));
          const srv = listaServicios.find(s => String(s.id) === e.target.value);
          const precioFinal = srv?.costo_descuento || srv?.costo;
          setFormEditar({ ...formEditar, servicio_id: e.target.value, servicio_nombre: srv?.nombre || '', monto_total: precioFinal ? String(precioFinal) : formEditar.monto_total });
        }}
        className={inputCls}
        style={{ appearance: 'none', paddingRight: '32px' }}
      >
        <option value="">Sin servicio específico</option>
        {servicios
          .filter(s => Number(s.area_id) === Number(citaSeleccionada.area_id) && s.activo !== false && (seccionesArea.length === 0 || s.seccion_id === seccionSeleccionadaEditar) && (!serviciosPermitidosEditar || serviciosPermitidosEditar.includes(s.id)))
          .map(s => (
            <option key={s.id} value={s.id}>
              {s.nombre}
              {s.costo_descuento
                ? ` — Bs ${s.costo_descuento} (antes Bs ${s.costo})${s.descripcion_descuento ? ` · ${s.descripcion_descuento}` : ''}`
                : s.costo ? ` — Bs ${s.costo}` : ''}
              {s.duracion_min ? ` (${s.duracion_min}min)` : ''}
            </option>
          ))}
      </select>
    </div>
  </div>
)}

            <div className="span-2">
              <label className={labelCls}>Estado</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="button" onClick={() => setFormEditar({ ...formEditar, estado: 'pendiente' })}
                  style={{ padding: '10px', borderRadius: '14px', border: `2px solid ${formEditar.estado === 'pendiente' ? '#fbbf24' : '#e5e7eb'}`, background: formEditar.estado === 'pendiente' ? '#fefce8' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>Reserva</p>
                </button>
                <button type="button" onClick={() => setFormEditar({ ...formEditar, estado: 'confirmada' })}
                  style={{ padding: '10px', borderRadius: '14px', border: `2px solid ${formEditar.estado === 'confirmada' ? '#A000D1' : '#e5e7eb'}`, background: formEditar.estado === 'confirmada' ? '#f5f3ff' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>Confirmada</p>
                </button>
              </div>
            </div>

            {formEditar.estado === 'confirmada' && (
              <div className="span-2" style={{ padding: '14px', background: 'rgba(245,243,255,0.5)', borderRadius: '16px', border: '1px solid #ede9fe', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Datos de pago</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#374151', display: 'block', marginBottom: '4px' }}>Precio total (Bs)</label>
                    <input type="number" value={formEditar.monto_total} onChange={e => setFormEditar({ ...formEditar, monto_total: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#374151', display: 'block', marginBottom: '4px' }}>Cant. sesiones</label>
<input type="text" inputMode="numeric" pattern="[0-9]*" value={formEditar.total_sesiones}
  onChange={e => {
    const soloNumeros = e.target.value.replace(/\D/g, '');
    const n = soloNumeros === '' ? 0 : Number(soloNumeros);
    setFormEditar({ ...formEditar, total_sesiones: n });
                        setFormEditar({ ...formEditar, total_sesiones: n });
                        // Sesiones ya existentes en este ciclo (antes de editar)
                        const sesionesActuales = citaSeleccionada.total_sesiones || 1;
                        const extras = n - sesionesActuales;
                        if (extras > sesionesAdicionalesEditar.length) {
                          const nuevas = [...sesionesAdicionalesEditar];
                          const horaBase = citaSeleccionada.hora?.slice(0, 5);
                          for (let i = sesionesAdicionalesEditar.length; i < extras; i++) {
                            // La semana i-ésima cuenta desde la sesión 1: sesion 2 = +1 semana, sesion 3 = +2 semanas, etc.
                            const semanasOffset = sesionesActuales + i;
                            const sugerencia = calcularProximaSesion(
  citaSeleccionada.fecha, horaBase, semanasOffset, citaSeleccionada.profesional_id, nuevas, citaSeleccionada.area_id
);
                            nuevas.push(sugerencia);
                          }
                          setSesionesAdicionalesEditar(nuevas);
                        } else {
                          setSesionesAdicionalesEditar(sesionesAdicionalesEditar.slice(0, Math.max(0, extras)));
                        }
                      }} className={inputCls} />
                  </div>
                </div>
             <div>
                  <label style={{ fontSize: '10px', color: '#374151', display: 'block', marginBottom: '4px' }}>Monto pagado (Bs)</label>
                  <input type="number" value={formEditar.monto_pagado} onChange={e => setFormEditar({ ...formEditar, monto_pagado: e.target.value })} className={inputCls} />
                  {formEditar.monto_total && formEditar.monto_pagado && (
                    <div style={{ fontSize: '11px', fontWeight: 600, padding: '6px 10px', borderRadius: '10px', marginTop: '6px', border: '1px solid', background: Number(formEditar.monto_pagado) >= Number(formEditar.monto_total) ? '#f5f3ff' : '#fff7ed', color: Number(formEditar.monto_pagado) >= Number(formEditar.monto_total) ? '#5b21b6' : '#c2410c', borderColor: Number(formEditar.monto_pagado) >= Number(formEditar.monto_total) ? '#ddd6fe' : '#fed7aa' }}>
                      {Number(formEditar.monto_pagado) >= Number(formEditar.monto_total) ? 'Pago completo' : `Pendiente: Bs ${Number(formEditar.monto_total) - Number(formEditar.monto_pagado)}`}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#374151', display: 'block', marginBottom: '6px' }}>Método de pago</label>
                  <MetodoPagoSelector value={formEditar.metodo_pago} onChange={v => setFormEditar({ ...formEditar, metodo_pago: v })} />
                </div>

                {sesionesAdicionalesEditar.length > 0 && (
                  <div style={{ borderTop: '1px solid #ddd6fe', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Programar sesiones adicionales</p>
                    {sesionesAdicionalesEditar.map((s, idx) => {
                     const horasDisponibles = s.fecha ? horasProfParaDia(citaSeleccionada.profesional_id, s.fecha, citaSeleccionada.area_id) : [];
                      const numeroSesion = (citaSeleccionada.total_sesiones || 1) + idx + 1;
                      return (
                        <div key={idx} style={{ padding: '10px', background: '#fff', borderRadius: '12px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <p style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Sesión {numeroSesion}</p>
                          <input type="date" required value={s.fecha}
                            onChange={e => {
                              const nuevas = [...sesionesAdicionalesEditar];
                              nuevas[idx] = { fecha: e.target.value, hora: '' };
                              setSesionesAdicionalesEditar(nuevas);
                            }}
                            className={inputCls} />
                          {s.fecha && (
                            horasDisponibles.length === 0 ? (
                              <p style={{ fontSize: '10px', color: '#ef4444', background: '#fef2f2', padding: '6px 10px', borderRadius: '8px', border: '1px solid #fecaca' }}>El profesional no trabaja este día</p>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {horasDisponibles.map(h => {
                                  const isOcupado = !isSlotDisponiblePorFecha(s.fecha, h);
                                  return (
                                    <button key={h} type="button" disabled={isOcupado}
                                      onClick={() => {
                                        if (!isOcupado) {
                                          const nuevas = [...sesionesAdicionalesEditar];
                                          nuevas[idx] = { ...nuevas[idx], hora: h };
                                          setSesionesAdicionalesEditar(nuevas);
                                        }
                                      }}
                                      style={{
                                        padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                                        border: `1px solid ${isOcupado ? '#e5e7eb' : s.hora === h ? '#A000D1' : '#e5e7eb'}`,
                                        background: isOcupado ? '#f3f4f6' : s.hora === h ? '#A000D1' : '#fff',
                                        color: isOcupado ? '#9ca3af' : s.hora === h ? '#fff' : '#4b5563',
                                        cursor: isOcupado ? 'not-allowed' : 'pointer',
                                        textDecoration: isOcupado ? 'line-through' : 'none',
                                      }}>
                                      {h}
                                    </button>
                                  );
                                })}
                              </div>
                            )
                          )}
                          {s.fecha && s.hora && slotsNecesariosEditar > 1 && (() => {
                            const consecutivos = getSlotsConsecutivosLibres(s.fecha, s.hora, citaSeleccionada.profesional_id);
                            if (consecutivos >= slotsNecesariosEditar) return null;
                            return (
                              <p style={{ fontSize: '10px', color: '#c2410c', background: '#fff7ed', padding: '6px 10px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                                ⚠ El servicio dura {servicioEditadoActual?.duracion_min} min ({slotsNecesariosEditar} horarios) pero este día solo hay {consecutivos} hora{consecutivos === 1 ? '' : 's'} libre{consecutivos === 1 ? '' : 's'} seguida{consecutivos === 1 ? '' : 's'} desde las {s.hora}. Se registrará solo con esa hora — cambia el horario o la fecha si necesitas cubrir la duración completa.
                              </p>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="span-2">
              <label className={labelCls}>Notas</label>
              <textarea value={formEditar.notas} onChange={e => setFormEditar({ ...formEditar, notas: e.target.value })} className={inputCls + ' resize-none'} rows={2} placeholder="Observaciones..." />
            </div>

            <div className="span-2" style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setEditandoCita(false)} style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '14px', padding: '10px', fontSize: '13px', color: '#4b5563', fontWeight: 600, background: '#fff', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={guardandoCita} style={{ flex: 1, background: '#A000D1', border: 'none', borderRadius: '14px', padding: '10px', fontSize: '13px', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: guardandoCita ? 0.5 : 1, boxShadow: '0 4px 14px rgba(160,0,209,0.3)' }}>
                {guardandoCita ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FOOTER - SOLO para admin/supervisor (botón Eliminar) */}
      {!editandoCita && usuario?.rol !== 'profesional' && (
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {!profesionalInactivo && (
            <button onClick={() => eliminarCita(citaSeleccionada.id)} style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <IconTrash /> Eliminar cita
            </button>
          )}
          <button onClick={() => cerrarCitaSeleccionada()} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px', fontSize: '13px', color: '#4b5563', fontWeight: 600, background: '#fff', cursor: 'pointer' }}>
            Cerrar
          </button>
        </div>
      )}

      {/* FOOTER - SOLO para profesionales (solo botón Cerrar) */}
      {!editandoCita && usuario?.rol === 'profesional' && (
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button onClick={() => cerrarCitaSeleccionada()} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px', fontSize: '13px', color: '#4b5563', fontWeight: 600, background: '#fff', cursor: 'pointer' }}>
            Cerrar
          </button>
        </div>
      )}
    </div>
  </div>
)}

      <style>{`
        .agenda-root {
          width: 100%;
          container-type: inline-size;
        }
          .agenda-root input[type="number"]::-webkit-outer-spin-button,
  .agenda-root input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .agenda-root input[type="number"] {
    -moz-appearance: textfield;
  }
        .slot-disponible:hover {
          border-color: rgba(160,0,209,0.4) !important;
          background: rgba(245,243,255,0.4) !important;
        }
        .slot-disponible:hover > div {
          border-color: #A000D1 !important;
          background: rgba(160,0,209,0.1) !important;
        }
        .slot-disponible:hover > div svg {
          stroke: #A000D1 !important;
          stroke-opacity: 1 !important;
        }
        .mes-dia-hover:hover {
          background: rgba(245,243,255,2.9) !important;
        }
        @media (max-width: 640px) {
          .agenda-week-header,
          .agenda-week-header ~ div > div {
            grid-template-columns: 40px repeat(6, 1fr) !important;
          }
        }
        @media (min-width: 2400px) {
          .agenda-root { font-size: 15px; }
        }
        @media (min-width: 1920px) and (max-width: 2399px) {
          .agenda-root { font-size: 14px; }
        }
        @media (min-width: 1440px) and (max-width: 1919px) {
          .agenda-root { font-size: 13px; }
        }
        @media (min-width: 1024px) and (max-width: 1439px) {
          .agenda-root { font-size: 12.5px; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .agenda-root { font-size: 12px; }
        }
                @media (max-width: 767px) {
          .agenda-root { font-size: 11px; }
          .agenda-week-header {
            grid-template-columns: 36px repeat(6, 1fr) !important;
            overflow-x: auto;
          }

          /* Fila 1: Mes/Semana (izq) + Hoy (der). Fila 2: navegación de fecha, centrada. */
          .agenda-header-controls {
            justify-content: flex-start !important;
          }
          .agenda-header-toggle { order: 1; }
          .agenda-header-hoy { order: 2; margin-left: auto; }
          .agenda-header-nav {
            order: 3;
            flex: 1 1 100% !important;
            min-width: 100% !important;
          }
        }
        .agenda-root *::-webkit-scrollbar { width: 4px; height: 4px; }
        .agenda-root *::-webkit-scrollbar-track { background: transparent; }
        .agenda-root *::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        .agenda-root *::-webkit-scrollbar-thumb:hover { background: #d1d5db; }

        /* ===================================================================
           DESKTOP: modales "Nueva reserva" / "Editar cita" en grilla de 2
           columnas, sin cambiar NADA del layout mobile (que sigue siendo una
           sola columna con scroll, como antes de estos estilos).
        =================================================================== */
        @media (min-width: 860px) {
          .modal-card {
            max-width: 780px !important;
            border-radius: 20px !important;
          }
          .modal-body-desktop {
            padding: 22px 26px !important;
          }
          .modal-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 14px 22px;
            align-items: start;
          }
          .modal-grid > .span-2 {
            grid-column: 1 / -1;
          }
          .acompanantes-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 10px;
          }
          .participantes-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 10px;
          }
          .sesiones-adicionales-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px !important;
          }
          .sesiones-adicionales-grid > p {
            grid-column: 1 / -1;
          }
        }

        /* Hovers rápidos y consistentes en toda la agenda (nada de 0.15–0.2s) */
                /* Hovers rápidos y consistentes en toda la agenda (nada de 0.15–0.2s) */
        .agenda-root button,
        .agenda-root .slot-disponible,
        .agenda-root select,
        .agenda-root input {
          transition: background 0.08s ease, border-color 0.08s ease, color 0.08s ease, box-shadow 0.08s ease, opacity 0.08s ease !important;
        }

        /* ===================================================================
           VISTA SEMANA: en tablet/laptop/PC la altura de cada fila la decide
           JS (alturaPorFila) para que todas las horas entren sin scroll
           propio, achicando hasta un mínimo cómodo — acá solo agrandamos un
           poco el texto. En mobile no se toca nada (scroll interno, 30px).
        =================================================================== */
        @media (min-width: 768px) {
          .agenda-slot-time { font-size: clamp(7px, 0.75vw, 10px) !important; }
          .agenda-slot-badge { font-size: clamp(8px, 0.8vw, 10px) !important; }
          .agenda-slot-name { font-size: clamp(9px, 0.85vw, 11px) !important; }
        }
      `}</style>

      {modalSesionGrupal && (
        <SesionGrupalAsistenciaModal
          sesionId={modalSesionGrupal.sesionId}
          citasDirectas={
            modalSesionGrupal.sesionId == null
              ? citas.filter((c: any) =>
                  c.profesional_id === modalSesionGrupal.profesionalId &&
                  c.fecha?.startsWith(modalSesionGrupal.fecha) &&
                  c.hora?.slice(0, 5) === modalSesionGrupal.hora &&
                  c.estado !== 'cancelada'
                )
              : undefined
          }
          fecha={modalSesionGrupal.fecha}
          nombreServicio={modalSesionGrupal.nombre}
          onClose={() => setModalSesionGrupal(null)}
          onCambio={cargarDatos}
          onEditarAsistente={editarAsistenteSesionGrupal}
        />
      )}
    </div>
  );
}
