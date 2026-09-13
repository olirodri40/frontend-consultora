import { useState, useEffect } from 'react';
import { getPacientes, getPacientePorId, actualizarPaciente } from '../services/pacientes.service';
import { actualizarCitaService, eliminarCitaService, crearMultiplesCitas } from '../services/citas.service';
import { getServicios, getTodosHorariosProfesionales, getProfesionales } from '../services/admin.service';
import MedyFisioLogo from '../assets/medyfisio.jpg';

// ── LOGO ──────────────────────────────────────────────────────────────────────
const LOGO_MEDYFISIO = MedyFisioLogo;

const DIAS_JS: Record<number, string> = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sabado' };
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconPacientes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconChevron = ({ up }: { up: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {up ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
  </svg>
);

const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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

const IconWhatsApp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);
// ── Component ─────────────────────────────────────────────────────────────────

function colorPorArea(areaNombre?: string): { bg: string; text: string; border: string } {
  const nombre = (areaNombre || '').toLowerCase();
  if (nombre.includes('fisio')) return { bg: '#e6f7f6', text: '#2f8a86', border: '#a9e0dd' };
  if (nombre.includes('medic')) return { bg: '#f1f8e8', text: '#5c8a2e', border: '#c8e3a3' };
  if (nombre.includes('psico')) return { bg: '#f3ecf5', text: '#7a3d85', border: '#d9bfe0' };
  return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' };
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [horariosProf, setHorariosProf] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [areaFiltro, setAreaFiltro] = useState<string>('todas');
  // ── Acordeón de servicios (y secciones dentro del área) ──
  const [servicioFiltro, setServicioFiltro] = useState<string>('');
  const [acordionAbierto, setAcordionAbierto] = useState<Record<string, boolean>>({});

  // ── FILTROS: Por defecto mes y año actual ──
  const hoy = new Date();
  const mesActual = String(hoy.getMonth() + 1).padStart(2, '0');
  const anioActual = String(hoy.getFullYear());
  
  const [anioFiltro, setAnioFiltro] = useState<string>(anioActual);
  const [mesFiltro, setMesFiltro] = useState<string>(mesActual);
  
  const [expandido, setExpandido] = useState<number | null>(null);
  const [citasPorPaciente, setCitasPorPaciente] = useState<Record<number, any[]>>({});
  const [, setReagendandoCita] = useState<any>(null);
  const [, setFormReagendar] = useState({ fecha: '', hora: '' });

  // ── MODALES PARA PACIENTE (datos personales) ──
  const [modalVerPaciente, setModalVerPaciente] = useState<any>(null);
  const [modalEditarPaciente, setModalEditarPaciente] = useState<any>(null);
  const [formEditarPaciente, setFormEditarPaciente] = useState<any>({});
  const [guardandoPaciente, setGuardandoPaciente] = useState(false);
  
  // ── MODALES PARA CICLO ──
  const [modalVerCiclo, setModalVerCiclo] = useState<any>(null);
  const [modalEditarCiclo, setModalEditarCiclo] = useState<any>(null);
  const [formEditarCiclo, setFormEditarCiclo] = useState<any>({});
  const [guardandoEdicionCiclo, setGuardandoEdicionCiclo] = useState(false);
  // 👇 NUEVO ESTADO para la sección seleccionada en edición
  const [seccionSeleccionadaEditar, setSeccionSeleccionadaEditar] = useState<number | ''>('');

  const [modalNuevoCiclo, setModalNuevoCiclo] = useState<any>(null);
  const [formNuevoCiclo, setFormNuevoCiclo] = useState<any>({});
  const [sesionesNuevoCiclo, setSesionesNuevoCiclo] = useState<{fecha: string, hora: string}[]>([]);
  const [guardandoCiclo, setGuardandoCiclo] = useState(false);


  // ── NUEVO: Modal de Recibo ──────────────────────────────────────────────
  const [reciboPago, setReciboPago] = useState<any>(null);
  const [modalSesionesCiclo, setModalSesionesCiclo] = useState<any>(null); // { paciente: p, grupo }


  useEffect(() => { cargarTodo(); }, []);

  const areasUnicas = [...new Set(
    pacientes.flatMap(p => {
      const citas = citasPorPaciente[p.id] || [];
      return citas.map(c => c.area_nombre).filter(Boolean);
    })
  )].sort();

  const aniosUnicos = [...new Set(
    pacientes.flatMap(p => {
      const citas = citasPorPaciente[p.id] || [];
      return citas.map(c => c.fecha ? c.fecha.toString().slice(0, 4) : null).filter(Boolean);
    })
  )].sort((a, b) => b.localeCompare(a));

  async function cargarTodo() {
    try {
      setCargando(true);
      const [data, srvs, horarios, profs] = await Promise.all([
        getPacientes(), getServicios(), getTodosHorariosProfesionales(), getProfesionales()
      ]);
      setPacientes(data);
      setServicios(srvs);
      setHorariosProf(horarios);
      setProfesionales(profs);
      const citasMap: Record<number, any[]> = {};
      await Promise.all(data.map(async (p: any) => {
        try {
          const detalle = await getPacientePorId(p.id);
          citasMap[p.id] = detalle.citas;
        } catch (err) { console.error(err); }
      }));
      setCitasPorPaciente(citasMap);
      aplicarFiltros(data, busqueda, areaFiltro, anioFiltro, mesFiltro, citasMap);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  }

  function fechaMasRecienteDe(citas: any[]): string {
    if (!citas || citas.length === 0) return '';
    return citas.reduce((max, c) => {
      const f = c.fecha ? c.fecha.toString().slice(0, 10) : '';
      return f > max ? f : max;
    }, '');
  }

  function aplicarFiltros(data: any[], termino: string, area: string, anio: string, mes: string, citasMapOverride?: Record<number, any[]>, servicio?: string) {
    const mapaCitas = citasMapOverride || citasPorPaciente;
    const servicioActivo = servicio !== undefined ? servicio : servicioFiltro;
    let filtrados = [...data];
    if (termino) {
      const t = termino.toLowerCase();
      filtrados = filtrados.filter(p =>
        p.nombre?.toLowerCase().includes(t) ||
        p.carnet?.toLowerCase().includes(t) ||
        p.telefono?.toLowerCase().includes(t)
      );
    }
    if (area !== 'todas') {
      filtrados = filtrados.filter(p => {
        const citas = mapaCitas[p.id] || [];
        return citas.some(c => c.area_nombre === area);
      });
    }
    if (servicioActivo) {
      filtrados = filtrados.filter(p => {
        const citas = mapaCitas[p.id] || [];
        return citas.some(c => c.servicio_nombre === servicioActivo);
      });
    }
    if (anio !== 'todos') {
      filtrados = filtrados.filter(p => {
        const citas = mapaCitas[p.id] || [];
        return citas.some(c => c.fecha && c.fecha.toString().slice(0, 4) === anio);
      });
    }
    if (mes !== 'todos') {
      filtrados = filtrados.filter(p => {
        const citas = mapaCitas[p.id] || [];
        return citas.some(c => c.fecha && c.fecha.toString().slice(5, 7) === mes);
      });
    }
    filtrados.sort((a, b) => {
      const fa = fechaMasRecienteDe(mapaCitas[a.id] || []);
      const fb = fechaMasRecienteDe(mapaCitas[b.id] || []);
      return fb.localeCompare(fa);
    });
    setPacientesFiltrados(filtrados);
  }

  async function cargarPacientes(termino?: string) {
    try {
      const data = await getPacientes(termino);
      setPacientes(data);
      const citasMap: Record<number, any[]> = {};
      await Promise.all(data.map(async (p: any) => {
        try {
          const detalle = await getPacientePorId(p.id);
          citasMap[p.id] = detalle.citas;
        } catch (err) { console.error(err); }
      }));
      setCitasPorPaciente(citasMap);
      aplicarFiltros(data, termino || busqueda, areaFiltro, anioFiltro, mesFiltro, citasMap);
    } catch (err) { console.error(err); }
  }

  function cambiarArea(area: string) {
    setAreaFiltro(area);
    setServicioFiltro('');
    setAcordionAbierto({});
    aplicarFiltros(pacientes, busqueda, area, anioFiltro, mesFiltro, undefined, '');
  }

  function cambiarServicio(servicio: string) {
    const nuevo = servicioFiltro === servicio ? '' : servicio;
    setServicioFiltro(nuevo);
    aplicarFiltros(pacientes, busqueda, areaFiltro, anioFiltro, mesFiltro, undefined, nuevo);
  }

  function toggleAcordion(clave: string) {
    setAcordionAbierto(prev => ({ ...prev, [clave]: !prev[clave] }));
  }

  function cambiarAnio(anio: string) {
    setAnioFiltro(anio);
    aplicarFiltros(pacientes, busqueda, areaFiltro, anio, mesFiltro);
  }

  function cambiarMes(mes: string) {
    setMesFiltro(mes);
    aplicarFiltros(pacientes, busqueda, areaFiltro, anioFiltro, mes);
  }

  async function recargarCitasPaciente(pacienteId: number) {
    const data = await getPacientePorId(pacienteId);
    setCitasPorPaciente(prev => {
      const next = { ...prev, [pacienteId]: data.citas };
      return next;
    });
    return data.citas;
  }

  function horasProfParaDia(userId: number, fecha: string): string[] {
    if (!fecha) return [];
    const d = new Date(fecha + 'T00:00:00');
    const diaNombre = DIAS_JS[d.getDay()];
    const horarios = horariosProf.filter(h => h.user_id === userId && h.dia === diaNombre);
    const horas = new Set<string>();
    horarios.forEach(h => {
      const inicio = parseInt(h.hora_inicio?.slice(0, 2));
      const fin = parseInt(h.hora_fin?.slice(0, 2));
      for (let i = inicio; i < fin; i++) horas.add(`${String(i).padStart(2,'0')}:00`);
    });
    return Array.from(horas).sort();
  }

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    cargarPacientes(busqueda);
  }

  async function toggleExpand(p: any) {
    if (expandido === p.id) { setExpandido(null); return; }
    setExpandido(p.id);
    if (!citasPorPaciente[p.id]) {
      try { await recargarCitasPaciente(p.id); } catch (err) { console.error(err); }
    }
  }

  async function marcarAsistencia(pacienteId: number, citaId: number, asistio: boolean) {
    try {
      await actualizarCitaService(citaId, { asistio });
      await recargarCitasPaciente(pacienteId);
      await cargarPacientes(busqueda || undefined);
    } catch (err) { console.error(err); }
  }

  // ── FUNCIONES PARA PACIENTE ──
 function abrirModalVerPaciente(p: any) {
  const contacto = obtenerContactoConGrupo(p.id, pacientes, citasPorPaciente);
  setModalVerPaciente({ ...p, ...contacto });
}

// ── FUNCIÓN CORRECTA para guardar edición de PACIENTE ──
async function guardarEdicionPaciente(e: React.FormEvent) {
  e.preventDefault();
  try {
    setGuardandoPaciente(true);

    // ✅ Convierte strings vacíos a null para que el backend los reciba correctamente
    const payload = {
      nombre: formEditarPaciente.nombre?.trim() || '',
      edad: formEditarPaciente.edad === '' || formEditarPaciente.edad === null
        ? null
        : Number(formEditarPaciente.edad),
      carnet: formEditarPaciente.carnet?.trim() || null,
      telefono: formEditarPaciente.telefono?.trim() || null,
      contacto_relacion: formEditarPaciente.contacto_relacion?.trim() || null,
      contacto_nombre: formEditarPaciente.contacto_nombre?.trim() || null,
      contacto_telefono: formEditarPaciente.contacto_telefono?.trim() || null,
    };

    await actualizarPaciente(modalEditarPaciente.id, payload);

    setModalEditarPaciente(null);
    setModalVerPaciente(null);
    await cargarPacientes(busqueda || undefined);
  } catch (err: any) {
    console.error('Error:', err);
    alert(err.response?.data?.mensaje || 'Error al actualizar paciente');
  } finally {
    setGuardandoPaciente(false);
  }
}

  // ── FUNCIONES PARA CICLO ──
  function abrirModalVerCiclo(p: any, c: any, grupo: any) {
    setModalVerCiclo({ paciente: p, cita: c, grupo: grupo });
  }

    function abrirModalEditarCiclo() {
    const p = modalVerCiclo.paciente;
    const c = modalVerCiclo.cita;
    const grupo = modalVerCiclo.grupo;
    setModalVerCiclo(null);
    setModalEditarCiclo({ paciente: p, cita: c, grupo: grupo });

    // ✅ Buscar el servicio actual para poder preseleccionarlo por id
    const servicioActual = servicios.find(
      s => s.nombre === c?.servicio_nombre && Number(s.area_id) === Number(c?.area_id)
    );

    // 👇 NUEVO: Preseleccionar la sección del servicio actual
    if (servicioActual?.seccion_id) {
      setSeccionSeleccionadaEditar(servicioActual.seccion_id);
    } else {
      setSeccionSeleccionadaEditar('');
    }

    setFormEditarCiclo({
      nombre: p.nombre || '',
      estado: c?.estado || 'confirmada',
      modalidad: c?.modalidad || 'presencial',
      monto_total: c?.monto_total || '',
      monto_pagado: c?.monto_pagado || '',
      metodo_pago: c?.metodo_pago || 'efectivo',
      notas: c?.notas || '',
      total_sesiones: c?.total_sesiones || 1,
      servicio_nombre: c?.servicio_nombre || '',
      servicio_id: servicioActual ? String(servicioActual.id) : '',
    });
  }

   async function guardarEdicionCicloCompleta() {
  try {
    setGuardandoEdicionCiclo(true);
    const p = modalEditarCiclo.paciente;
    const c = modalEditarCiclo.cita;
    const citasDelPaciente = citasPorPaciente[p.id] || [];
    const citasCiclo = citasDelPaciente.filter(x => x.ciclo === c.ciclo && x.area_id === c.area_id);

    // ✅ Buscar el servicio seleccionado para obtener su duración
    const servicioSeleccionado = servicios.find(s => String(s.id) === formEditarCiclo.servicio_id);
    const duracionMin = servicioSeleccionado?.duracion_min || null;

    await Promise.all(citasCiclo.map(cita =>
      actualizarCitaService(cita.id, {
        estado: formEditarCiclo.estado,
        monto_total: formEditarCiclo.monto_total || null,
        monto_pagado: formEditarCiclo.monto_pagado || null,
        metodo_pago: formEditarCiclo.metodo_pago || null,
        total_sesiones: formEditarCiclo.total_sesiones,
        modalidad: formEditarCiclo.modalidad,
        servicio_nombre: formEditarCiclo.servicio_nombre || null,
        duracion_min: duracionMin, // ✅ nuevo
        notas: formEditarCiclo.notas || null,
      })
    ));

    // Sincronizar compañeros de grupo — también necesitan duracion_min actualizado
    const primeraCitaCiclo = citasCiclo.find(x => x.sesion?.toString() === '1') || citasCiclo[0];
    if (primeraCitaCiclo?.companeros?.length > 0) {
      for (const comp of primeraCitaCiclo.companeros) {
        try {
          const dataComp = await getPacientePorId(comp.patient_id);
          const sesionUnoComp = dataComp.citas.find((x: any) =>
            x.grupo_id === primeraCitaCiclo.grupo_id && x.sesion?.toString() === '1'
          );
          if (sesionUnoComp) {
            await actualizarCitaService(sesionUnoComp.id, {
              estado: formEditarCiclo.estado,
              monto_total: formEditarCiclo.monto_total || null,
              monto_pagado: formEditarCiclo.monto_pagado || null,
              metodo_pago: formEditarCiclo.metodo_pago || null,
              total_sesiones: formEditarCiclo.total_sesiones,
              modalidad: formEditarCiclo.modalidad,
              servicio_nombre: formEditarCiclo.servicio_nombre || null,
              duracion_min: duracionMin, // ✅ nuevo
              notas: formEditarCiclo.notas || null,
            });
          }
        } catch (err) {
          console.error('Error sincronizando compañero de grupo:', err);
        }
      }
    }

    setModalEditarCiclo(null);
    await recargarCitasPaciente(p.id);
    await cargarPacientes(busqueda || undefined);
  } catch (err: any) {
    alert(err.response?.data?.mensaje || 'Error al actualizar');
  } finally {
    setGuardandoEdicionCiclo(false);
  }
}

  async function guardarNuevoCiclo() {
    if (!formNuevoCiclo.profesional_id) { alert('Selecciona un profesional'); return; }
    if (sesionesNuevoCiclo.length === 0) { alert('Agrega al menos una sesion'); return; }
    for (const s of sesionesNuevoCiclo) {
      if (!s.fecha || !s.hora) { alert('Completa fecha y hora de todas las sesiones'); return; }
    }
    try {
      setGuardandoCiclo(true);
      const p = modalNuevoCiclo;
      const prof = profesionales.find(pr => pr.id === formNuevoCiclo.profesional_id);
      const citas = citasPorPaciente[p.id] || [];
      const areaId = prof?.area_id;
      const citasArea = citas.filter(c => c.area_id === areaId);
      const maxCiclo = citasArea.length > 0 ? Math.max(...citasArea.map(c => c.ciclo || 1)) : 0;
      const nuevoCiclo = maxCiclo + 1;

      const todasSesiones = sesionesNuevoCiclo.map((s, idx) => ({
        paciente_nombre: p.nombre,
        paciente_telefono: p.telefono || null,
        paciente_carnet: p.carnet || null,
        paciente_edad: p.edad || null,
        patient_id: p.id,
        professional_id: formNuevoCiclo.profesional_id,
        area_id: areaId,
        fecha: s.fecha,
        hora: s.hora,
        sesion: idx + 1,
        total_sesiones: sesionesNuevoCiclo.length,
        ciclo: nuevoCiclo,
        estado: formNuevoCiclo.estado || 'confirmada',
        monto_total: formNuevoCiclo.monto_total || null,
        monto_pagado: formNuevoCiclo.monto_pagado || null,
        metodo_pago: formNuevoCiclo.metodo_pago || null,
        servicio_nombre: formNuevoCiclo.servicio_nombre || null,
        modalidad: formNuevoCiclo.modalidad || 'presencial',
        notas: formNuevoCiclo.notas || null,
      }));

      await crearMultiplesCitas(todasSesiones);
      setModalNuevoCiclo(null);
      setSesionesNuevoCiclo([]);
      setFormNuevoCiclo({});
      await recargarCitasPaciente(p.id);
      await cargarPacientes(busqueda || undefined);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al crear ciclo');
    } finally { setGuardandoCiclo(false); }
  }

  async function eliminarCitaPendiente(pacienteId: number, citaId: number) {
    if (!confirm('¿Seguro que deseas eliminar esta reserva?')) return;
    try {
      await eliminarCitaService(citaId);
      await cargarPacientes(busqueda || undefined);
      const nuevaData = await getPacientePorId(pacienteId).catch(() => null);
      if (nuevaData) {
        setCitasPorPaciente(prev => ({ ...prev, [pacienteId]: nuevaData.citas }));
      } else {
        setCitasPorPaciente(prev => { const n = { ...prev }; delete n[pacienteId]; return n; });
        setExpandido(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al eliminar');
    }
  }

  async function eliminarPacienteCompleto(p: any) {
    if (!confirm(`¿Eliminar a ${p.nombre} y todas sus citas? Esta accion no se puede deshacer.`)) return;
    try {
      let citasActuales = citasPorPaciente[p.id];
      if (!citasActuales || citasActuales.length === 0) {
        const data = await getPacientePorId(p.id);
        citasActuales = data.citas;
      }
      await Promise.all(citasActuales.map((c: any) => eliminarCitaService(c.id)));
      setCitasPorPaciente(prev => { const n = { ...prev }; delete n[p.id]; return n; });
      if (expandido === p.id) setExpandido(null);
      await cargarPacientes(busqueda || undefined);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al eliminar');
    }
  }

function obtenerContactoConGrupo(
  pacienteId: number,
  listaPacientes: any[],
  mapaCitas: Record<number, any[]>
) {
  const propio = listaPacientes.find(p => p.id === pacienteId);

  // Si el paciente ya tiene su propio contacto, se usa tal cual
  if (propio && (propio.contacto_nombre || propio.contacto_telefono)) {
    return {
      contacto_relacion: propio.contacto_relacion,
      contacto_nombre: propio.contacto_nombre,
      contacto_telefono: propio.contacto_telefono,
      contacto_heredado: false,
      contacto_heredado_de: null,
    };
  }

  // Si no tiene, buscamos entre sus compañeros de cita grupal
  const citas = mapaCitas[pacienteId] || [];
  const companerosIds = new Set<number>();
  citas.forEach(c => {
    (c.companeros || []).forEach((comp: any) => companerosIds.add(comp.patient_id));
  });

  for (const compId of companerosIds) {
    const compañero = listaPacientes.find(p => p.id === compId);
    if (compañero && (compañero.contacto_nombre || compañero.contacto_telefono)) {
      return {
        contacto_relacion: compañero.contacto_relacion,
        contacto_nombre: compañero.contacto_nombre,
        contacto_telefono: compañero.contacto_telefono,
        contacto_heredado: true,
        contacto_heredado_de: compañero.nombre,
      };
    }
  }

  return {
    contacto_relacion: null,
    contacto_nombre: null,
    contacto_telefono: null,
    contacto_heredado: false,
    contacto_heredado_de: null,
  };
}


  function agruparCitasPorCiclo(citas: any[]) {
    const grupos: Record<string, any[]> = {};
    citas.forEach(c => {
      const cicloNum = parseInt(c.ciclo) || 1;
      const key = `${c.area_id}-${cicloNum}`;
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push({ ...c, ciclo: cicloNum });
    });
    return Object.entries(grupos).map(([key, cs]) => ({
      key,
      ciclo: cs[0].ciclo,
      area_id: cs[0].area_id,
      area_nombre: cs[0].area_nombre,
      profesional_nombre: cs[0].profesional_nombre,
      citas: cs.sort((a, b) => a.fecha?.localeCompare(b.fecha)),
    })).sort((a, b) => a.area_id - b.area_id || a.ciclo - b.ciclo);
  }
// ── FUNCIÓN PARA CALCULAR EL PROGRESO REAL DEL PACIENTE ──
function calcularEstadoRealPaciente(citas: any[]) {
  const ciclos: Record<string, { total: number; sesion_actual: number; asistidas: number; pendientes: number }> = {};
  
  citas.forEach(c => {
    const key = `${c.area_id}-${c.ciclo}`;
    if (!ciclos[key]) {
      ciclos[key] = { total: 0, sesion_actual: 0, asistidas: 0, pendientes: 0 };
    }
    const total = Number(c.total_sesiones) || 0;
    const sesion = Number(c.sesion) || 0;
    ciclos[key].total = total;
    ciclos[key].sesion_actual = Math.max(ciclos[key].sesion_actual, sesion);
    if (c.asistio === true) {
      ciclos[key].asistidas++;
    } else {
      ciclos[key].pendientes++;
    }
  });

  let totalSesiones = 0;
  let sesionesCompletadas = 0;
  let sesionesPendientes = 0;
  let tienePendientes = false;

  for (const key in ciclos) {
    const ciclo = ciclos[key];
    totalSesiones += ciclo.total;
    sesionesCompletadas += ciclo.asistidas;
    
    // ✅ CORRECCIÓN: Un ciclo tiene pendientes si:
    // 1. La sesión actual es menor que el total (faltan sesiones por agendar)
    // 2. O hay sesiones con asistio = null o false
    if (ciclo.sesion_actual < ciclo.total || ciclo.pendientes > 0) {
      tienePendientes = true;
      sesionesPendientes += (ciclo.total - ciclo.sesion_actual) + ciclo.pendientes;
    }
  }

return {
    totalSesiones,
    sesionesCompletadas,
    sesionesPendientes,
    tienePendientes,
    progreso: `${sesionesCompletadas}/${totalSesiones}`
  };
}

// ── FUNCIÓN PARA DETERMINAR EL ESTADO GENERAL DEL PACIENTE ──
// reservado = ninguna cita confirmada (todo está en "pendiente"/reserva, no pagó)
// activo = tiene al menos una cita confirmada y aún faltan sesiones
// completo = todas las sesiones confirmadas fueron completadas
function obtenerEstadoPaciente(citasFiltradas: any[]): 'reservado' | 'activo' | 'completo' | 'sin_datos' {
  if (!citasFiltradas || citasFiltradas.length === 0) return 'sin_datos';
  const tieneCitasConfirmadas = citasFiltradas.some(c => c.estado === 'confirmada');
  if (!tieneCitasConfirmadas) return 'reservado';
  const estadoReal = calcularEstadoRealPaciente(citasFiltradas);
  return estadoReal.tienePendientes ? 'activo' : 'completo';
}

  const inputCls = "w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all";
  const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block";

  function MetodoPagoSelector({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    const metodos = [
      { key: 'efectivo', label: 'Efectivo', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
      { key: 'qr', label: 'QR', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> },
      { key: 'transferencia', label: 'Transferencia', icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> },
    ];
    return (
      <div className="flex gap-2">
        {metodos.map(m => (
          <button key={m.key} type="button" onClick={() => onChange(m.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${value === m.key ? 'bg-[#A000D1] text-white border-[#A000D1] shadow-lg shadow-purple-200' : 'bg-white text-gray-600 border-gray-200 hover:border-[#A000D1]/30'}`}>
            {m.icon} {m.label}
          </button>
        ))}
     </div>
    );
  }

  // ── CONTEO DE ESTADOS PARA EL HEADER (respeta el filtro de área actual) ──
  const conteoEstados = pacientesFiltrados.reduce((acc, p) => {
    const citas = citasPorPaciente[p.id] || [];
    const citasFiltr = areaFiltro !== 'todas' ? citas.filter(c => c.area_nombre === areaFiltro) : citas;
    const estado = obtenerEstadoPaciente(citasFiltr);
    if (estado === 'reservado') acc.reservados++;
    else if (estado === 'activo' || estado === 'completo') acc.confirmados++;
    return acc;
  }, { confirmados: 0, reservados: 0 });

    return (
    <div>
      {/* ── Header ── */}
     <div className="bg-white rounded-3xl border border-[#efedf0] mb-5 overflow-hidden">
  <div className="p-5 flex flex-wrap justify-between items-center gap-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
        <IconPacientes />
      </div>
      <div>
       
        <p className="text-xs text-gray-400">Psicología · Fisioterapia · Medicina · y más</p>
      </div>
    </div>
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          Total{areaFiltro !== 'todas' ? ` ${areaFiltro}` : ''}: <span className="font-bold text-gray-700">{pacientesFiltrados.length}</span> pacientes
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-medium">
          {conteoEstados.confirmados} confirmados
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium">
          {conteoEstados.reservados} reservados
        </span>
      </div>
    </div>
  </div>

  {/* Búsqueda + filtros */}
  <div className="px-3 sm:px-5 pb-3 sm:pb-5 border-t border-gray-50 pt-2 sm:pt-4">
    
    {/* ── FILA 1: Búsqueda + Botón Buscar ── */}
    <form onSubmit={handleBuscar} className="flex gap-2 mb-3 sm:mb-4">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <IconSearch />
        </span>
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar..."
          className="w-full pl-9 pr-3 py-2.5 sm:py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] text-sm transition-all"
        />
      </div>
      <button type="submit" className="px-4 py-2.5 sm:py-2.5 bg-[#A000D1] text-white rounded-xl text-sm font-medium hover:bg-[#8800b3] transition-all shadow-lg shadow-purple-200 whitespace-nowrap">
        Buscar
      </button>
      {busqueda && (
        <button type="button" onClick={() => { setBusqueda(''); cargarPacientes(); }}
          className="px-4 py-2.5 sm:py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-all font-medium whitespace-nowrap">
          Limpiar
        </button>
      )}
    </form>

    {/* ── FILA 2: Años + Meses ── */}
    <div className="flex gap-2 mb-3 sm:mb-4">
      <select
        value={anioFiltro}
        onChange={e => cambiarAnio(e.target.value)}
        className="flex-1 px-3 py-2.5 sm:py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all bg-white"
      >
        <option value="todos">Todos los años</option>
        {aniosUnicos.map(a => <option key={a} value={a}>{a}</option>)}
      </select>

      <select
        value={mesFiltro}
        onChange={e => cambiarMes(e.target.value)}
        className="flex-1 px-3 py-2.5 sm:py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all bg-white"
      >
        <option value="todos">Todos los meses</option>
        {MESES.map((m, idx) => (
          <option key={m} value={String(idx + 1).padStart(2, '0')}>{m}</option>
        ))}
      </select>
    </div>

    {/* ── FILA 3: Áreas (wrap) ── */}
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => cambiarArea('todas')}
        className={`px-3 py-2 sm:py-1.5 rounded-xl text-sm sm:text-xs font-medium transition-all whitespace-nowrap ${
          areaFiltro === 'todas'
            ? 'bg-[#A000D1] text-white shadow-md shadow-purple-200'
            : 'bg-white border border-gray-200 text-gray-600 hover:border-[#A000D1]/30 hover:text-[#A000D1]'
        }`}
      >
        Todas
      </button>
      
      {areasUnicas.map(area => (
        <button
          key={area}
          onClick={() => cambiarArea(area)}
          className={`px-3 py-2 sm:py-1.5 rounded-xl text-sm sm:text-xs font-medium transition-all whitespace-nowrap ${
            areaFiltro === area
              ? 'bg-[#A000D1] text-white shadow-md shadow-purple-200'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-[#A000D1]/30 hover:text-[#A000D1]'
          }`}
        >
          {area}
        </button>
      ))}
    </div>

    {/* ── FILA 4: Acordeón de secciones/servicios — solo con un área elegida ── */}
    {areaFiltro !== 'todas' && (() => {
      const serviciosVisibles = servicios.filter(s => s.area_nombre === areaFiltro);
      if (serviciosVisibles.length === 0) return null;

      function botonServicio(s: any) {
        return (
          <button
            key={s.id}
            onClick={() => cambiarServicio(s.nombre)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
              servicioFiltro === s.nombre
                ? 'text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#A000D1]/30 hover:text-[#A000D1]'
            }`}
            style={servicioFiltro === s.nombre ? { background: colorPorArea(s.area_nombre).text } : undefined}
          >
            {s.nombre}
          </button>
        );
      }

      function bloqueArea(areaNombre: string) {
        const serviciosDelArea = serviciosVisibles.filter(s => s.area_nombre === areaNombre);
        const secciones = [...new Set(
          serviciosDelArea.filter(s => s.seccion_id).map(s => s.seccion_nombre)
        )];
        const sinSeccion = serviciosDelArea.filter(s => !s.seccion_id);

        return (
          <div key={areaNombre} className="space-y-1.5">
            {secciones.length === 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {serviciosDelArea.map(botonServicio)}
              </div>
            ) : (
              <>
                {sinSeccion.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sinSeccion.map(botonServicio)}
                  </div>
                )}
                {secciones.map(seccionNombre => {
                  const clave = `${areaNombre}|${seccionNombre}`;
                  const abierta = !!acordionAbierto[clave];
                  const serviciosSeccion = serviciosDelArea.filter(s => s.seccion_nombre === seccionNombre);
                  return (
                    <div key={clave} className="border border-gray-100 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleAcordion(clave)}
                        className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-50/60 hover:bg-gray-100/60 text-left transition-all"
                      >
                        <span className="text-[11px] font-semibold text-gray-600">{seccionNombre}</span>
                        <span className={`text-gray-400 transition-transform ${abierta ? 'rotate-180' : ''}`}>
                          <IconChevron up={abierta} />
                        </span>
                      </button>
                      {abierta && (
                        <div className="flex flex-wrap gap-1.5 px-3 py-2">
                          {serviciosSeccion.map(botonServicio)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      }

      return <div className="pt-1">{bloqueArea(areaFiltro)}</div>;
    })()}
  </div>
</div>

      {/* ── Lista ── */}
      {cargando ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-[#efedf0]">Cargando pacientes...</div>
      ) : pacientesFiltrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-[#efedf0]">
          {areaFiltro !== 'todas' ? `No hay pacientes en ${areaFiltro}` : 'No se encontraron pacientes'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {pacientesFiltrados.map(p => {
            const citas = citasPorPaciente[p.id] || [];
const abierto = expandido === p.id;
// ── Calcular total de sesiones SOLO del área filtrada ──
const citasFiltradas = areaFiltro !== 'todas' 
  ? citas.filter(c => c.area_nombre === areaFiltro)
  : citas;
let gruposCiclos = agruparCitasPorCiclo(citas);
// ✅ FILTRO POR ÁREA - Solo mostrar ciclos del área seleccionada
if (areaFiltro !== 'todas') {
  gruposCiclos = gruposCiclos.filter(grupo => grupo.area_nombre === areaFiltro);
}
// ── CALCULAR PROGRESO REAL DEL PACIENTE ──
const estadoReal = calcularEstadoRealPaciente(citasFiltradas);
const totalSesionesCompletadas = estadoReal.sesionesCompletadas;
const totalSesiones = estadoReal.totalSesiones;
const estadoPaciente = obtenerEstadoPaciente(citasFiltradas);
const inicial = p.nombre?.charAt(0).toUpperCase() || '?';

            return (
              <div key={p.id} className="bg-white rounded-xl border border-[#efedf0] overflow-hidden hover:shadow-md transition-all duration-300">
                {/* Cabecera paciente - CON OJO AQUÍ (ver paciente) */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50/50 transition-all"
                  onClick={() => toggleExpand(p)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-base shrink-0 border-2 border-violet-200">
                      {inicial}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 flex items-center gap-2">
                        {p.nombre}
                        {p.edad && <span className="text-xs text-gray-400 font-normal">{p.edad} años</span>}
                      </div>
                      <div className="text-xs text-gray-400 flex flex-wrap items-center gap-2 mt-0.5">
                        {p.carnet && (
                          <span className="flex items-center gap-1">
                            {p.carnet}
                          </span>
                        )}
                        {p.telefono && (
                          <span className="flex items-center gap-1">
                            <IconPhone /> {p.telefono}
                          </span>
                        )}
                        {gruposCiclos.length > 1 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 font-medium">
                            {gruposCiclos.length} ciclos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Progreso en UNA SOLA LÍNEA con los botones */}
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      {totalSesionesCompletadas}/{totalSesiones} sesiones
                      {estadoPaciente === 'reservado' && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold border border-yellow-200 whitespace-nowrap">
                      Reservado
                    </span>
                  )}
                      {estadoPaciente === 'activo' && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold border border-orange-200 whitespace-nowrap">
                      Activo
                    </span>
                  )}
                      {estadoPaciente === 'completo' && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold border border-green-200 whitespace-nowrap">
                      Completo
                    </span>
                  )}
  </div>

                    <button
                      disabled={estadoPaciente !== 'completo'}
                      onClick={async e => {
                        e.stopPropagation();
                        if (estadoPaciente !== 'completo') return;
                        setModalNuevoCiclo(p);
                        setFormNuevoCiclo({
                          modalidad: 'presencial', estado: 'confirmada',
                          monto_total: '', monto_pagado: '', metodo_pago: 'efectivo',
                          servicio_nombre: '', notas: '', profesional_id: null, area_id: null,
                        });
                        setSesionesNuevoCiclo([{ fecha: '', hora: '' }]);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        estadoPaciente === 'completo'
                          ? 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 cursor-pointer'
                          : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'
                      }`}
                      title={estadoPaciente === 'completo' ? 'Nuevo Ciclo' : 'Solo disponible cuando el ciclo actual esté completo'}
                    >
                      <IconPlus />
                    </button>

                    {/* ── OJO: VER PACIENTE ── */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        abrirModalVerPaciente(p);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all duration-200"
                      title="Ver paciente"
                    >
                      <IconEye />
                    </button>

                    <button
                      onClick={e => { e.stopPropagation(); eliminarPacienteCompleto(p); }}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200"
                      title="Eliminar"
                    >
                      <IconTrash />
                    </button>

                    <span className="text-gray-400">
                      <IconChevron up={abierto} />
                    </span>
                  </div>
              
</div>
                {/* ── Detalle expandible — ciclos agrupados ── */}
                {abierto && (
                  <div className="border-t border-gray-100">
                    {gruposCiclos.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">Sin citas registradas</p>
                    ) : (
                      gruposCiclos.map(grupo => {
                        const sesionesCompletadas = grupo.citas.filter(c => c.asistio === true).length;
                        const sesionesNoAsistio = grupo.citas.filter(c => c.asistio === false).length;
                        const totalSes = grupo.citas.length;
                        const progresoCiclo = totalSes > 0 ? Math.round((sesionesCompletadas / totalSes) * 100) : 0;
                        const progresoNoAsistio = totalSes > 0 ? Math.round((sesionesNoAsistio / totalSes) * 100) : 0;
                        const primeraCita = grupo.citas.find(c => c.sesion?.toString() === '1') || grupo.citas[0];
                        const montoCiclo = Number(primeraCita?.monto_pagado || 0);
                       
                        
                        const estaPendiente = grupo.citas.some(c => c.estado === 'pendiente');

                                                async function eliminarCiclo(pacienteId: number, cicloNum: number, areaId: number) {
                          const tieneCompaneros = (primeraCita?.companeros?.length || 0) > 0;
                          const mensaje = tieneCompaneros
                            ? `Este ciclo es compartido con ${primeraCita.companeros.map((c: any) => c.nombre).join(' + ')}. Solo se eliminarán las sesiones de ${p.nombre}; los demás pacientes conservarán las suyas. ¿Continuar?`
                            : `¿Eliminar el Ciclo ${cicloNum} y todas sus sesiones?`;
                          if (!confirm(mensaje)) return;
                          try {
                            const citasCiclo = (citasPorPaciente[pacienteId] || []).filter(
                              c => parseInt(c.ciclo) === cicloNum && c.area_id === areaId
                            );
                            await Promise.all(citasCiclo.map((c: any) => eliminarCitaService(c.id)));
                            await cargarPacientes(busqueda || undefined);
                            const nuevaData = await getPacientePorId(pacienteId).catch(() => null);
                            if (nuevaData) {
                              setCitasPorPaciente(prev => ({ ...prev, [pacienteId]: nuevaData.citas }));
                            } else {
                              setCitasPorPaciente(prev => { const n = { ...prev }; delete n[pacienteId]; return n; });
                              setExpandido(null);
                            }
                          } catch (err: any) {
                            alert(err.response?.data?.mensaje || 'Error al eliminar ciclo');
                          }
                        }

                        return (
                          <div key={grupo.key} className={`border-b border-gray-50 last:border-0 ${estaPendiente ? 'border-l-4 border-l-yellow-400 bg-yellow-50/20' : ''}`}>
                            {/* Header ciclo - CON OJO AQUÍ (ver ciclo) */}
                            <div
  className="px-4 py-2 bg-gray-50/60 flex items-center justify-between cursor-pointer hover:bg-gray-100/60 transition-all"
  onClick={() => setModalSesionesCiclo({ paciente: p, grupo })}
>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                  style={{
                                    background: colorPorArea(grupo.area_nombre).bg,
                                    color: colorPorArea(grupo.area_nombre).text,
                                    border: `1px solid ${colorPorArea(grupo.area_nombre).border}`,
                                  }}
                                >
                                  {grupo.area_nombre}
                                </span>
                                <span className="text-xs font-bold text-gray-700">
                                  Ciclo {grupo.ciclo}
                                  {estaPendiente && (
                                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 font-medium">
                                      Pendiente
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-gray-400">· {grupo.profesional_nombre}</span>
                                {primeraCita?.companeros?.length > 0 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                    Con {primeraCita.companeros.map((c: any) => c.nombre).join(' + ')}
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                                  Bs {montoCiclo.toFixed(2)}
                                </span>
                                <button
                                  onClick={e => { e.stopPropagation(); eliminarCiclo(p.id, grupo.ciclo, grupo.area_id); }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-200"
                                  title="Eliminar ciclo"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                                {/* ── BOTÓN RECIBO ── */}
                                <button
  onClick={e => {
    e.stopPropagation();
    // ✅ Junta al paciente principal + sus compañeros de ciclo grupal (si los hay)
    const nombresParticipantes = [
      p.nombre,
      ...(primeraCita?.companeros || []).map((c: any) => c.nombre),
    ].filter(Boolean);

    setReciboPago({
      paciente: p,
      participantes_nombres: nombresParticipantes, // ✅ nuevo
      ciclo: grupo.ciclo,
      area: grupo.area_nombre,
      profesional: grupo.profesional_nombre,
      citas: grupo.citas,
      fecha_inicio: grupo.citas[0]?.fecha,
      servicio_nombre: grupo.citas[0]?.servicio_nombre || grupo.area_nombre,
      total_sesiones: grupo.citas.length,
      monto_pagado: montoCiclo,
      metodo_pago: grupo.citas[0]?.metodo_pago || 'efectivo',
    });
  }}
  className="w-6 h-6 flex items-center justify-center rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all border border-violet-200"
  title="Ver recibo"
>
  <IconReceipt />
</button>
                                {/* ── BOTÓN OJO (VER DETALLE DEL CICLO) ── */}
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    const citaDelCiclo = grupo.citas[0];
                                    abrirModalVerCiclo(p, citaDelCiclo, grupo);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all border border-violet-200"
                                  title="Ver detalle del ciclo"
                                >
                                  <IconEye />
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400">{sesionesCompletadas}/{totalSes} sesiones</span>
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                                  <div className="h-full bg-[#A000D1] transition-all" style={{ width: `${progresoCiclo}%` }} />
                                  <div className="h-full bg-red-400 transition-all" style={{ width: `${progresoNoAsistio}%` }} />
                                </div>
                                  <span className="text-gray-400"><IconEye /></span>
                              </div>
                                                       </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
            {/* ── MODAL VER PACIENTE (datos personales) ── */}
       {modalVerPaciente && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4" onClick={() => setModalVerPaciente(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-[#efedf0] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 pb-3 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{modalVerPaciente.nombre}</h3>
                <p className="text-xs text-violet-500 flex items-center gap-1.5 mt-1">
                  <IconClock /> {new Date().toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    // ✅ PASA modalVerPaciente (que tiene los campos de contacto)
                    const p = modalVerPaciente;
                    setFormEditarPaciente({
                      nombre: p.nombre || '',
                      edad: p.edad || '',
                      carnet: p.carnet || '',
                      telefono: p.telefono || '',
                      contacto_relacion: p.contacto_relacion || '',
                      contacto_nombre: p.contacto_nombre || '',
                      contacto_telefono: p.contacto_telefono || '',
                    });
                    setModalEditarPaciente(p);
                    setModalVerPaciente(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all"
                  title="Editar"
                >
                  <IconEdit />
                </button>
                <button
                  onClick={() => setModalVerPaciente(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                  title="Cerrar"
                >
                  <IconX />
                </button>
              </div>
            </div>

            <div className="px-5 pb-5 space-y-4">
              {/* ── DATOS DEL PACIENTE ── */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Datos del paciente</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] text-gray-400">Edad</p>
                    <p className="text-sm font-semibold text-gray-800">{modalVerPaciente.edad || '—'} años</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400">Carnet</p>
                    <p className="text-sm font-semibold text-gray-800">{modalVerPaciente.carnet || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[9px] text-gray-400">Teléfono</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-sm font-semibold text-gray-800">{modalVerPaciente.telefono || '—'}</p>
                      {modalVerPaciente.telefono && (
                        <>
                          <a
                            href={`tel:${modalVerPaciente.telefono}`}
                            className="text-[10px] px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all border border-violet-200 flex items-center gap-1"
                            title="Llamar"
                          >
                            <IconPhone /> Llamar
                          </a>
                          <a
                            href={`https://wa.me/${modalVerPaciente.telefono.replace(/\s/g, '').replace(/^0+/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-200 flex items-center gap-1"
                            title="WhatsApp"
                          >
                            <IconWhatsApp /> WhatsApp
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacto de emergencia */}
              {(modalVerPaciente.contacto_nombre || modalVerPaciente.contacto_telefono) && (
  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
      Contacto de emergencia
      {modalVerPaciente.contacto_heredado && (
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium normal-case tracking-normal">
          Compartido con {modalVerPaciente.contacto_heredado_de}
        </span>
      )}
    </p>
                  <div className="space-y-2">
                    {modalVerPaciente.contacto_nombre && (
                      <div>
                        <p className="text-[9px] text-gray-400">Nombre</p>
                        <p className="text-sm font-semibold text-gray-800">{modalVerPaciente.contacto_nombre}</p>
                      </div>
                    )}
                    {modalVerPaciente.contacto_relacion && (
                      <div>
                        <p className="text-[9px] text-gray-400">Relación</p>
                        <p className="text-sm font-semibold text-gray-800">{modalVerPaciente.contacto_relacion}</p>
                      </div>
                    )}
                    {modalVerPaciente.contacto_telefono && (
                      <div>
                        <p className="text-[9px] text-gray-400">Teléfono</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <p className="text-sm font-semibold text-gray-800">{modalVerPaciente.contacto_telefono}</p>
                          <a
                            href={`tel:${modalVerPaciente.contacto_telefono}`}
                            className="text-[10px] px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all border border-violet-200 flex items-center gap-1"
                            title="Llamar"
                          >
                            <IconPhone /> Llamar
                          </a>
                          <a
                            href={`https://wa.me/${modalVerPaciente.contacto_telefono.replace(/\s/g, '').replace(/^0+/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-200 flex items-center gap-1"
                            title="WhatsApp"
                          >
                            <IconWhatsApp /> WhatsApp
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setModalVerPaciente(null)}
                className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR PACIENTE (solo datos personales) ── */}
      {modalEditarPaciente && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4" onClick={() => setModalEditarPaciente(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-[#efedf0] overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-3xl">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Editar paciente</h3>
                <p className="text-xs text-gray-400 mt-0.5">Modifica los datos personales</p>
              </div>
              <button onClick={() => setModalEditarPaciente(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all text-sm font-bold">✕</button>
            </div>

            <form onSubmit={guardarEdicionPaciente} className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Nombre completo</label>
                <input
                  type="text"
                  required
                  value={formEditarPaciente.nombre}
                  onChange={e => setFormEditarPaciente({ ...formEditarPaciente, nombre: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Edad</label>
                  <input
                    type="number"
                    value={formEditarPaciente.edad}
                    onChange={e => setFormEditarPaciente({ ...formEditarPaciente, edad: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Carnet</label>
                  <input
                    type="text"
                    value={formEditarPaciente.carnet}
                    onChange={e => setFormEditarPaciente({ ...formEditarPaciente, carnet: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input
                  type="text"
                  value={formEditarPaciente.telefono}
                  onChange={e => setFormEditarPaciente({ ...formEditarPaciente, telefono: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="border-t border-gray-100 pt-4 mt-2">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Contacto de emergencia</p>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Relación</label>
                    <input
                      type="text"
                      placeholder="Ej: Hija"
                      value={formEditarPaciente.contacto_relacion}
                      onChange={e => setFormEditarPaciente({ ...formEditarPaciente, contacto_relacion: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nombre completo</label>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={formEditarPaciente.contacto_nombre}
                      onChange={e => setFormEditarPaciente({ ...formEditarPaciente, contacto_nombre: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Teléfono</label>
                    <input
                      type="tel"
                      placeholder="Número de teléfono"
                      value={formEditarPaciente.contacto_telefono}
                      onChange={e => setFormEditarPaciente({ ...formEditarPaciente, contacto_telefono: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalEditarPaciente(null)}
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPaciente}
                  className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
                >
                  {guardandoPaciente ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL VER CICLO (datos del ciclo) ── */}
      {modalVerCiclo && (() => {
        const p = modalVerCiclo.paciente;
        const c = modalVerCiclo.cita;
        const montoTotal = Number(c?.monto_total || 0);
        const montoPagado = Number(c?.monto_pagado || 0);
        const pendiente = Math.max(montoTotal - montoPagado, 0);
        const fechaTexto = c?.fecha
          ? new Date(c.fecha.toString().slice(0,10) + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Sin fecha';
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4" onClick={() => setModalVerCiclo(null)}>
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-[#efedf0] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-5 pb-3 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{p.nombre}</h3>
                  <p className="text-xs text-violet-500 flex items-center gap-1.5 mt-1">
                    <IconClock /> {fechaTexto} · {c?.hora?.slice(0,5) || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={abrirModalEditarCiclo}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all"
                    title="Editar ciclo"
                  >
                    <IconEdit />
                  </button>
                  <button
                    onClick={() => setModalVerCiclo(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                    title="Cerrar"
                  >
                    <IconX />
                  </button>
                </div>
              </div>

              <div className="px-5 pb-5 space-y-4">
                {/* ── ÁREA / PROFESIONAL ── */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Área</p>
                    <p className="text-sm font-semibold text-gray-800">{c?.area_nombre || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Profesional</p>
                    <p className="text-sm font-semibold text-gray-800">{c?.profesional_nombre || '—'}</p>
                  </div>
                </div>

                {/* ── MODALIDAD / SESIÓN ── */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Modalidad</p>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{c?.modalidad || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Sesión</p>
                    <p className="text-sm font-semibold text-gray-800">{c?.sesion || 1} / {c?.total_sesiones || 1}</p>
                  </div>
                </div>

                {/* ── SERVICIO ── */}
                {c?.servicio_nombre && (
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Servicio</p>
                    <p className="text-sm font-semibold text-gray-800">{c.servicio_nombre}</p>
                  </div>
                )}

                {/* ── ESTADO ── */}
                <div className="bg-gray-50 rounded-2xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Estado</p>
                  <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium border ${
                    c?.estado === 'confirmada' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                    c?.estado === 'pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>{c?.estado || '—'}</span>
                </div>

                {/* ── PAGO ── */}
                <div className="bg-violet-50/60 rounded-2xl p-4 border border-violet-100">
                  <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-3">Pago</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-xl p-2.5 text-center border border-gray-100">
                      <p className="text-[10px] text-gray-400">Total</p>
                      <p className="text-sm font-bold text-gray-800">Bs {montoTotal.toFixed(0)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 text-center border border-gray-100">
                      <p className="text-[10px] text-gray-400">Pagado</p>
                      <p className="text-sm font-bold text-violet-700">Bs {montoPagado.toFixed(0)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 text-center border border-gray-100">
                      <p className="text-[10px] text-gray-400">Pendiente</p>
                      <p className="text-sm font-bold text-violet-700">Bs {pendiente.toFixed(0)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center mt-3">Método: <span className="uppercase font-medium text-gray-500">{c?.metodo_pago || '—'}</span></p>
                </div>

                {/* ── NOTAS ── */}
                {c?.notas && (
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Notas</p>
                    <p className="text-sm text-gray-700">{c.notas}</p>
                  </div>
                )}

                <button
                  onClick={() => setModalVerCiclo(null)}
                  className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL EDITAR CICLO ── */}
           {/* ── MODAL EDITAR CICLO ── */}
      {modalEditarCiclo && (() => {
        // 👇 OBTENER DATOS NECESARIOS
                // 👇 OBTENER DATOS NECESARIOS
        const citaActual = modalEditarCiclo.cita;
        const areaId = citaActual?.area_id;

        // ✅ Obtener qué servicios tiene habilitados el profesional asignado a esta cita
        const profesionalAsignado = profesionales.find(pr => pr.id === citaActual?.profesional_id);
        const serviciosPermitidos = profesionalAsignado?.servicios_ids?.length ? profesionalAsignado.servicios_ids : null;

        // Filtrar servicios por área Y por lo que el profesional tiene habilitado
        const serviciosDelArea = servicios.filter(s =>
          Number(s.area_id) === Number(areaId) &&
          (!serviciosPermitidos || serviciosPermitidos.includes(s.id))
        );
        
        // ✅ OBTENER SECCIONES DEL ÁREA
        // NOTA: Como no tenemos un servicio para obtener secciones por área en el frontend,
        // usamos las secciones de los servicios disponibles (ya filtrados por lo que el
        // profesional tiene habilitado), para que solo aparezcan secciones con al menos
        // un servicio que este profesional puede atender.
        const seccionesIds = new Set<number>();
        const seccionesMap: Record<number, any> = {};
        serviciosDelArea.forEach(s => {
          if (s.seccion_id) {
            seccionesIds.add(s.seccion_id);
            if (!seccionesMap[s.seccion_id]) {
              seccionesMap[s.seccion_id] = { id: s.seccion_id, nombre: s.seccion_nombre || `Sección ${s.seccion_id}` };
            }
          }
        });
        const seccionesArea = Object.values(seccionesMap);
        const esAreaConSecciones = seccionesArea.length > 0;

        // Filtrar servicios según sección seleccionada
        const serviciosFiltrados = esAreaConSecciones
          ? serviciosDelArea.filter(s => Number(s.seccion_id) === Number(seccionSeleccionadaEditar))
          : serviciosDelArea;

        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4" onClick={() => { setModalEditarCiclo(null); setSeccionSeleccionadaEditar(''); }}>
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-[#efedf0]" onClick={e => e.stopPropagation()}>
              {/* ── HEADER ── */}
              <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-3xl">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Editar ciclo</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {modalEditarCiclo.cita?.area_nombre} · Ciclo {modalEditarCiclo.cita?.ciclo}
                  </p>
                </div>
                <button onClick={() => { setModalEditarCiclo(null); setSeccionSeleccionadaEditar(''); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all text-sm font-bold">✕</button>
              </div>

              {/* ── CUERPO ── */}
              <div className="p-5 space-y-4">
                {/* 👇 1. SECCIONES (RADIO BUTTONS) - SOLO SI EL ÁREA TIENE SECCIONES */}
                {esAreaConSecciones && (
                  <div>
                    <label className={labelCls}>Sección <span style={{ color: '#ef4444' }}>*</span></label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                      {seccionesArea.map(sec => (
                        <label key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 6px', borderRadius: '8px' }}>
                          <input
                            type="radio"
                            name="seccion_editar_ciclo"
                            checked={seccionSeleccionadaEditar === sec.id}
                            onChange={() => {
                              setSeccionSeleccionadaEditar(sec.id);
                              // Limpiar servicio seleccionado al cambiar de sección
                              setFormEditarCiclo({ ...formEditarCiclo, servicio_id: '', servicio_nombre: '' });
                            }}
                          />
                          <span style={{ fontSize: '13px', color: '#1f2937' }}>{sec.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 👇 2. SERVICIOS - FILTRADOS POR SECCIÓN */}
                {serviciosDelArea.length > 0 && (esAreaConSecciones ? seccionSeleccionadaEditar !== '' : true) && (
                  <div>
                    <label className={labelCls}>Servicio</label>
                    <select
                      value={formEditarCiclo.servicio_id || ''}
                      onChange={e => {
                        const srv = serviciosFiltrados.find(s => String(s.id) === e.target.value);
                        setFormEditarCiclo({
                          ...formEditarCiclo,
                          servicio_id: e.target.value,
                          servicio_nombre: srv?.nombre || '',
                          // Si el servicio tiene precio, actualizar monto_total
                          monto_total: srv?.costo_descuento || srv?.costo || formEditarCiclo.monto_total,
                        });
                      }}
                      className={inputCls}
                    >
                      <option value="">Sin servicio específico</option>
                      {serviciosFiltrados
                        .filter(s => s.activo !== false)
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
                )}

                {/* 👇 3. MODALIDAD (sin cambios) */}
                <div>
                  <label className={labelCls}>Modalidad</label>
                  <select
                    value={formEditarCiclo.modalidad}
                    onChange={e => setFormEditarCiclo({ ...formEditarCiclo, modalidad: e.target.value })}
                    className={inputCls}
                  >
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                    <option value="domicilio">Domicilio</option>
                  </select>
                </div>

                {/* 👇 4. ESTADO (sin cambios) */}
                <div>
                  <label className={labelCls}>Estado</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormEditarCiclo({ ...formEditarCiclo, estado: 'pendiente' })}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${formEditarCiclo.estado === 'pendiente' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="text-xs font-bold text-gray-700">Reserva</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Pendiente de confirmar</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormEditarCiclo({ ...formEditarCiclo, estado: 'confirmada' })}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${formEditarCiclo.estado === 'confirmada' ? 'border-[#A000D1] bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="text-xs font-bold text-gray-700">Confirmada</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Cita activa</p>
                    </button>
                  </div>
                </div>

                {/* 👇 5. PAGO (sin cambios, solo se muestra si está confirmada) */}
                {formEditarCiclo.estado === 'confirmada' && (
                  <div className="p-4 bg-violet-50/50 rounded-2xl border border-violet-100 space-y-4">
                    <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Datos de pago</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">Precio total (Bs)</label>
                        <input
                          type="number"
                          value={formEditarCiclo.monto_total}
                          onChange={e => setFormEditarCiclo({ ...formEditarCiclo, monto_total: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">Cant. sesiones</label>
                        <input
                          type="number"
                          min="1"
                          value={formEditarCiclo.total_sesiones}
                          onChange={e => setFormEditarCiclo({ ...formEditarCiclo, total_sesiones: Number(e.target.value) })}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1 block">Monto pagado (Bs)</label>
                      <input
                        type="number"
                        value={formEditarCiclo.monto_pagado}
                        onChange={e => setFormEditarCiclo({ ...formEditarCiclo, monto_pagado: e.target.value })}
                        className={inputCls}
                      />
                      {formEditarCiclo.monto_total && formEditarCiclo.monto_pagado && (
                        <div className={`text-xs font-medium px-3 py-1.5 rounded-xl mt-2 border ${Number(formEditarCiclo.monto_pagado) >= Number(formEditarCiclo.monto_total) ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                          {Number(formEditarCiclo.monto_pagado) >= Number(formEditarCiclo.monto_total)
                            ? 'Pago completo'
                            : `Pendiente: Bs ${Number(formEditarCiclo.monto_total) - Number(formEditarCiclo.monto_pagado)}`}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1.5 block">Método de pago</label>
                      <MetodoPagoSelector
                        value={formEditarCiclo.metodo_pago}
                        onChange={v => setFormEditarCiclo({ ...formEditarCiclo, metodo_pago: v })}
                      />
                    </div>
                  </div>
                )}

                {/* 👇 6. NOTAS (sin cambios) */}
                <div>
                  <label className={labelCls}>Notas</label>
                  <textarea
                    value={formEditarCiclo.notas}
                    onChange={e => setFormEditarCiclo({ ...formEditarCiclo, notas: e.target.value })}
                    className={inputCls + ' resize-none'}
                    rows={2}
                    placeholder="Observaciones..."
                  />
                </div>

                {/* ── BOTONES ── */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => { setModalEditarCiclo(null); setSeccionSeleccionadaEditar(''); }}
                    className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarEdicionCicloCompleta}
                    disabled={guardandoEdicionCiclo}
                    className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
                  >
                    {guardandoEdicionCiclo ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
            {/* ── MODAL NUEVO CICLO ── */}
      {modalNuevoCiclo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-[#efedf0]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-3xl">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Nuevo ciclo</h3>
                <p className="text-xs text-gray-400 mt-0.5">{modalNuevoCiclo.nombre}</p>
              </div>
              <button onClick={() => setModalNuevoCiclo(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all text-sm font-bold">✕</button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className={labelCls}>Profesional</label>
                <select
                  value={formNuevoCiclo.profesional_id || ''}
                  onChange={e => setFormNuevoCiclo({ ...formNuevoCiclo, profesional_id: Number(e.target.value) })}
                  className={inputCls}
                >
                  <option value="">Selecciona un profesional</option>
                  {profesionales
                    .filter(pr => {
                      const area = pr.area_nombre?.toLowerCase() || '';
                      return area !== 'zumba' && area !== 'gerontologia';
                    })
                    .map(pr => (
                      <option key={pr.id} value={pr.id}>{pr.nombre} — {pr.area_nombre}</option>
                    ))}
                </select>
              </div>

              {formNuevoCiclo.profesional_id && servicios.filter(s => s.area_id === profesionales.find(pr => pr.id === formNuevoCiclo.profesional_id)?.area_id).length > 0 && (
                <div>
                  <label className={labelCls}>Servicio</label>
                 <select value={formNuevoCiclo.servicio_nombre || ''}
  onChange={e => setFormNuevoCiclo({ ...formNuevoCiclo, servicio_nombre: e.target.value })}
  className={inputCls}>
  <option value="">Sin servicio específico</option>
  {servicios.filter(s => s.area_id === profesionales.find(pr => pr.id === formNuevoCiclo.profesional_id)?.area_id).map(s => (
    <option key={s.id} value={s.nombre}>
      {s.nombre} {s.costo ? `— Bs ${s.costo}` : ''} {s.duracion_min ? `(${s.duracion_min}min)` : ''}
    </option>
  ))}
</select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Modalidad</label>
                  <select value={formNuevoCiclo.modalidad || 'presencial'}
                    onChange={e => setFormNuevoCiclo({ ...formNuevoCiclo, modalidad: e.target.value })}
                    className={inputCls}>
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                    <option value="domicilio">Domicilio</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <select value={formNuevoCiclo.estado || 'confirmada'}
                    onChange={e => setFormNuevoCiclo({ ...formNuevoCiclo, estado: e.target.value })}
                    className={inputCls}>
                    <option value="confirmada">Confirmada</option>
                    <option value="pendiente">Reserva</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-violet-50/50 rounded-2xl border border-violet-100 space-y-3">
                <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Pago</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">Monto total (Bs)</label>
                    <input type="number" placeholder="0" value={formNuevoCiclo.monto_total || ''}
                      onChange={e => setFormNuevoCiclo({ ...formNuevoCiclo, monto_total: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">Monto pagado (Bs)</label>
                    <input type="number" placeholder="0" value={formNuevoCiclo.monto_pagado || ''}
                      onChange={e => setFormNuevoCiclo({ ...formNuevoCiclo, monto_pagado: e.target.value })}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 mb-1.5 block">Método de pago</label>
                  <MetodoPagoSelector value={formNuevoCiclo.metodo_pago || 'efectivo'} onChange={v => setFormNuevoCiclo({ ...formNuevoCiclo, metodo_pago: v })} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className={labelCls}>Sesiones</label>
                  <button
                    type="button"
                    onClick={() => setSesionesNuevoCiclo([...sesionesNuevoCiclo, { fecha: '', hora: '' }])}
                    className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium transition-all"
                  >
                    <IconPlus /> Agregar sesión
                  </button>
                </div>
                <div className="space-y-2">
                  {sesionesNuevoCiclo.map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="date"
                            value={s.fecha}
                            onChange={e => {
                              const ns = [...sesionesNuevoCiclo];
                              ns[idx] = { ...ns[idx], fecha: e.target.value, hora: '' };
                              setSesionesNuevoCiclo(ns);
                            }}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          {s.fecha && formNuevoCiclo.profesional_id ? (() => {
                            const horasDisp = horasProfParaDia(formNuevoCiclo.profesional_id, s.fecha);
                            return horasDisp.length === 0 ? (
                              <div className="w-full border border-red-200 rounded-xl p-2.5 text-xs text-red-500 bg-red-50">No disponible</div>
                            ) : (
                              <select
                                value={s.hora}
                                onChange={e => {
                                  const ns = [...sesionesNuevoCiclo];
                                  ns[idx] = { ...ns[idx], hora: e.target.value };
                                  setSesionesNuevoCiclo(ns);
                                }}
                                className={inputCls}
                              >
                                <option value="">Hora</option>
                                {horasDisp.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            );
                          })() : (
                            <div className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-300 bg-gray-50">Selecciona fecha</div>
                          )}
                        </div>
                      </div>
                      {sesionesNuevoCiclo.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSesionesNuevoCiclo(sesionesNuevoCiclo.filter((_, i) => i !== idx))}
                          className="w-6 h-6 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all shrink-0 mt-0.5"
                        >
                          <IconX />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Notas</label>
                <textarea value={formNuevoCiclo.notas || ''}
                  onChange={e => setFormNuevoCiclo({ ...formNuevoCiclo, notas: e.target.value })}
                  className={inputCls + ' resize-none'} rows={2} placeholder="Observaciones..." />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-2 sticky bottom-0 bg-white rounded-b-3xl">
              <button onClick={() => setModalNuevoCiclo(null)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">
                Cancelar
              </button>
              <button onClick={guardarNuevoCiclo}
                disabled={guardandoCiclo}
                className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-purple-200 disabled:opacity-50">
                {guardandoCiclo ? 'Guardando...' : 'Crear ciclo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RECIBO ── */}
      {reciboPago && (
        <ReciboModal 
          pago={reciboPago}
          onClose={() => setReciboPago(null)} 
        />
      )}
      {modalSesionesCiclo && (
  <ModalSesionesCiclo
    pago={modalSesionesCiclo}
    onClose={() => setModalSesionesCiclo(null)}
    marcarAsistencia={marcarAsistencia}
    setReagendandoCita={setReagendandoCita}
    setFormReagendar={setFormReagendar}
    eliminarCitaPendiente={eliminarCitaPendiente}
  />
)}
    </div>
  );
}
// ── COMPONENTE RECIBO MODAL ────────────────────────────────────────────────

function ReciboModal({ pago, onClose }: { pago: any; onClose: () => void }) {
  function imprimir() {
    window.print();
  }

  const fechaInicio = pago.fecha_inicio
    ? new Date(pago.fecha_inicio.toString().slice(0, 10) + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 recibo-overlay">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl recibo-modal-shell">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl no-print">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <IconReceipt /> Recibo de pago
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={imprimir}
              className="flex items-center gap-2 px-4 py-2 bg-[#A000D1] text-white rounded-xl text-sm font-medium hover:bg-[#8800b3] transition-all shadow-md shadow-purple-200"
            >
              <IconPrinter /> Imprimir
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
            >
              <IconX />
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-100 recibo-print-wrapper">
          <div className="recibo-pagina">
            <ReciboMitad 
              pago={pago}
              fechaInicio={fechaInicio}
              etiqueta="ORIGINAL" 
              subtexto="Conserva el paciente" 
            />
            <div className="recibo-linea-corte">
              <svg width="100%" height="2" className="recibo-tijera-svg">
                <line x1="0" y1="1" x2="100%" y2="1" stroke="#c4c4c4" strokeWidth="1.5" strokeDasharray="6,5" />
              </svg>
              <span className="recibo-tijera-icono">✂</span>
            </div>
            <ReciboMitad 
              pago={pago}
              fechaInicio={fechaInicio}
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


function ModalSesionesCiclo({ pago, onClose, marcarAsistencia, setReagendandoCita, setFormReagendar, eliminarCitaPendiente }: any) {
  const { paciente, grupo } = pago;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-bold text-gray-800">{paciente.nombre}</h3>
            <p className="text-xs text-gray-400">{grupo.area_nombre} — Ciclo {grupo.ciclo}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
            <IconX />
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs sm:text-sm min-w-[320px] sm:min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30">
                <th className="px-2 sm:px-5 py-1.5 sm:py-2.5 text-left text-[8px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="px-1 sm:px-3 py-1.5 sm:py-2.5 text-left text-[8px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                <th className="px-1 sm:px-3 py-1.5 sm:py-2.5 text-left text-[8px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Hora</th>
                <th className="px-1 sm:px-3 py-1.5 sm:py-2.5 text-left text-[8px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Asist</th>
                <th className="px-1 sm:px-3 py-1.5 sm:py-2.5 text-left text-[8px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-1 sm:px-3 py-1.5 sm:py-2.5 text-left text-[8px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Acc</th>
              </tr>
            </thead>
            <tbody>
              {grupo.citas.map((c: any, idx: number) => {
                const esPendiente = c.estado === 'pendiente';
                return (
                  <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-all ${esPendiente ? 'bg-yellow-50/30' : ''}`}>
                    <td className="px-2 sm:px-5 py-2 sm:py-3 font-semibold text-gray-700 text-[10px] sm:text-xs whitespace-nowrap">
                      {idx + 1}
                    </td>
                    <td className="px-1 sm:px-3 py-2 sm:py-3 text-gray-600 text-[10px] sm:text-xs whitespace-nowrap">
                      {c.fecha ? new Date(c.fecha.toString().slice(0,10) + 'T00:00:00').toLocaleDateString('es', { day:'2-digit', month:'short' }) : '—'}
                    </td>
                    <td className="px-1 sm:px-3 py-2 sm:py-3 text-gray-600 text-[10px] sm:text-xs whitespace-nowrap">
                      {c.hora?.slice(0,5) || '—'}
                    </td>
                    <td className="px-1 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                      {c.asistio === true && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600" title="Asistió">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                      )}
                      {c.asistio === false && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600" title="No asistió">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </span>
                      )}
                      {c.asistio === null && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-600" title="Pendiente">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </span>
                      )}
                    </td>
                    <td className="px-1 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                      {c.estado === 'confirmada' && (
                        <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-medium whitespace-nowrap">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          <span className="hidden sm:inline">Conf</span>
                        </span>
                      )}
                      {c.estado === 'pendiente' && (
                        <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium whitespace-nowrap">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span className="hidden sm:inline">Res</span>
                        </span>
                      )}
                    </td>
                    <td className="px-1 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                      {!esPendiente ? (
                        <div className="flex gap-0.5 sm:gap-1">
                          <button
                            onClick={() => marcarAsistencia(paciente.id, c.id, true)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${c.asistio === true ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}
                            title="Asistió"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                          <button
                            onClick={() => marcarAsistencia(paciente.id, c.id, false)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${c.asistio === false ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                            title="No asistió"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                          <button
                            onClick={() => { setReagendandoCita(c); setFormReagendar({ fecha: '', hora: '' }); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all"
                            title="Reagendar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          </button>
                          {c.estado === 'pendiente' && (
                            <button
                              onClick={() => eliminarCitaPendiente(paciente.id, c.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
                              title="Eliminar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] sm:text-[10px] text-yellow-600 font-medium">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// ── COMPONENTE MITAD DE RECIBO ─────────────────────────────────────────────

function ReciboMitad({ pago, fechaInicio, etiqueta, subtexto }: { pago: any; fechaInicio: string; etiqueta: string; subtexto: string }) {
  const logo = LOGO_MEDYFISIO;
  const centro = 'MedyFisio';

  return (
    <div className="recibo-mitad">
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

      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 4 }}>
<CampoRecibo
  label={pago.participantes_nombres?.length > 1 ? 'Participantes' : 'Participante'}
  value={pago.participantes_nombres?.length > 0
    ? pago.participantes_nombres.join(' + ')
    : (pago.paciente?.nombre || '—')}
  ancho="100%"
/>        <CampoRecibo label="Área" value={pago.area || '—'} ancho="50%" />
        <CampoRecibo label="Fecha de inicio" value={fechaInicio} ancho="50%" />
        <CampoRecibo label="Servicio" value={pago.servicio_nombre ? `${pago.servicio_nombre} - Ciclo ${pago.ciclo}` : `${pago.area} - Ciclo ${pago.ciclo}`} ancho="100%" />
        <CampoRecibo label="Sesión" value={pago.total_sesiones?.toString() || '—'} ancho="50%" />
      </div>

      <div style={{ borderRadius: 14, marginTop: 6, marginBottom: 16, background: '#faf5ff', border: '1px solid #ecd9ff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#A000D1', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 9, margin: 0, fontWeight: 700, opacity: 0.7 }}>Método de pago</p>
          <p style={{ fontWeight: 700, color: '#374151', fontSize: 13.5, margin: '4px 0 0', textTransform: 'capitalize' }}>{pago.metodo_pago || '—'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#A000D1', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 9, margin: 0, fontWeight: 700, opacity: 0.7 }}>Monto pagado</p>
          <p style={{ fontWeight: 800, fontSize: 22, color: '#A000D1', margin: '4px 0 0' }}>Bs {Number(pago.monto_pagado || 0).toFixed(2)}</p>
        </div>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 18 }}>
        <div style={{ textAlign: 'center', width: '55%' }}>
          <div style={{ borderTop: '1px solid #9ca3af', marginBottom: 5 }} />
          <p style={{ color: '#6b7280', fontSize: 9.5, margin: 0 }}>Firma del paciente</p>
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
