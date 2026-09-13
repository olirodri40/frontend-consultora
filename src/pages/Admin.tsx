import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Trash2, Pencil, Search, X,
  Users, UserCog, Building2, Briefcase,
  Clock, Activity, LayoutDashboard,
  UserPlus, Plus, AlertCircle, CheckCircle, Calendar,
  Clock as ClockIcon, MapPin, User
} from "lucide-react";
import {
  getProfesionales,
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  getAuditLog,
  getAreas,
  actualizarArea,
  getServicios,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
  getHorariosZumba,
  crearHorarioZumba,
  actualizarHorarioZumba,
  eliminarHorarioZumba,
  getActividadesGeronto,
  crearActividadGeronto,
  actualizarActividadGeronto,
  eliminarActividadGeronto,
  getHorarios,
  guardarHorarios,
  getTodosHorariosProfesionales,
    getSecciones,
  crearSeccion,
  actualizarSeccion,
  eliminarSeccion,
} from '../services/admin.service';

type Tab = 'dashboard' | 'usuarios' | 'areas' | 'servicios' | 'zumba' | 'geronto' | 'horarios' | 'auditoria';
type Step = 'basico' | 'profesional' | 'asignaciones';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const AREAS_CON_SECCIONES = ['psicologia', 'fisioterapia', 'medicina'];
export default function Admin() {
  const { usuario } = useAuth();
  
  // Estado de tabs
  const [tabActiva, setTabActiva] = useState<Tab>('dashboard');

  // Estado de datos
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [horariosZumba, setHorariosZumba] = useState<any[]>([]);
  const [actividadesGeronto, setActividadesGeronto] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [todosHorarios, setTodosHorarios] = useState<any[]>([]);
  const [seccionesPorArea, setSeccionesPorArea] = useState<Record<number, any[]>>({});  
    const [seccionesDisponiblesServicio, setSeccionesDisponiblesServicio] = useState<any[]>([]);
  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  
  // Estados de modales
  const [modalUsuario, setModalUsuario] = useState<any>(null);
  const [modalArea, setModalArea] = useState<any>(null);
  const [modalServicio, setModalServicio] = useState<any>(null);
  const [modalHorarioZumba, setModalHorarioZumba] = useState<any>(null);
  const [modalActividad, setModalActividad] = useState<any>(null);
  const [modalHorariosProfesional, setModalHorariosProfesional] = useState<any>(null);
  const [modalSecciones, setModalSecciones] = useState<any>(null); // área cuyo listado de secciones se ve
  const [secciones, setSecciones] = useState<any[]>([]);
  const [cargandoSecciones, setCargandoSecciones] = useState(false);
  const [modalSeccionForm, setModalSeccionForm] = useState<any>(null); // sección en edición/creación
  const [esNuevaSeccion, setEsNuevaSeccion] = useState(true);
  const [formSeccion, setFormSeccion] = useState({ nombre: '', descripcion: '', activo: true });
  // Estados de creación/edición
  const [esNuevo, setEsNuevo] = useState(true);
  const [esNuevoArea, setEsNuevoArea] = useState(true);
  const [esNuevoServicio, setEsNuevoServicio] = useState(true);
  const [esNuevoHorario, setEsNuevoHorario] = useState(true);
  const [esNuevaActividad, setEsNuevaActividad] = useState(true);
  
  // Stepper para usuario
  const [stepActual, setStepActual] = useState<Step>('basico');
  
  // Horarios profesional
  const [horariosProfesional, setHorariosProfesional] = useState<any[]>([]);
  const [, setCargandoHorarios] = useState(false);
  const [nuevoHorario, setNuevoHorario] = useState<{
    dia: string;
    hora_inicio: string;
    hora_fin: string;
    slot_minutos: number;
    area_id: string | number;
  }>({
    dia: 'Lunes',
    hora_inicio: '08:00',
    hora_fin: '17:00',
    slot_minutos: 60,
    area_id: '',
  });

  // Formularios
    const [form, setForm] = useState({
    nombre: '', usuario: '', password: '', email: '',
    telefono: '', carnet: '', role_id: 3, area_id: '', especialidad: '',
    sueldo: '', contrato: 'indefinido', fecha_nac: '',
    fecha_ingreso: '', activo: true,
    areas_ids: [] as number[],
    actividades_geronto_ids: [] as number[],
    servicios_ids: [] as number[],
  });

  const [formArea, setFormArea] = useState({
    nombre: '', descripcion: '', activo: true,
  });

    const [formServicio, setFormServicio] = useState({
  area_id: '', seccion_id: '', nombre: '', descripcion: '', costo: '', costo_descuento: '', descripcion_descuento: '', duracion_min: '', activo: true,
});

  const [formHorario, setFormHorario] = useState({
    dia: 'Lunes', hora_inicio: '08:00', hora_fin: '09:00', activo: true,
  });

  const [formActividad, setFormActividad] = useState({
    nombre: '', dia: 'Lunes', hora_inicio: '15:00',
    hora_fin: '16:00', precio: 75, activo: true,
  });

  // Cargar datos
  useEffect(() => {
    cargarDatos();
  }, []);

    useEffect(() => {
    async function cargarSeccionesPorArea() {
      const areasConSecciones = areas.filter(a => AREAS_CON_SECCIONES.includes(a.nombre.toLowerCase()));
      const resultado: Record<number, any[]> = {};
      for (const a of areasConSecciones) {
        try {
          const data = await getSecciones(a.id);
          resultado[a.id] = data.filter((s: any) => s.activo);
        } catch {
          resultado[a.id] = [];
        }
      }
      setSeccionesPorArea(resultado);
    }
    if (areas.length > 0) cargarSeccionesPorArea();
  }, [areas]);

  // ✅ NUEVO: recargar todosHorarios cada vez que se entra a la pestaña "horarios"
  useEffect(() => {
    if (tabActiva === 'horarios') {
      cargarTodosHorarios();
    }
  }, [tabActiva]);

  async function cargarDatos() {
    try {
      setCargando(true);
      const [profs, users, logs, areasData, servData, horariosData, actData] = await Promise.all([
        getProfesionales(),
        getUsuarios(),
        getAuditLog(),
        getAreas(),
        getServicios(),
        getHorariosZumba(),
        getActividadesGeronto(),
      ]);
      setProfesionales(profs);
      setUsuarios(users);
      setAuditLogs(logs);
      setAreas(areasData);
      setServicios(servData);
      setHorariosZumba(horariosData);
      setActividadesGeronto(actData);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  async function cargarTodosHorarios() {
    try {
      const data = await getTodosHorariosProfesionales();
      setTodosHorarios(data);
    } catch (err) {
      console.error('Error al cargar todos los horarios:', err);
    }
  }
async function cargarSeccionesParaServicio(areaId: string) {
  if (!areaId) {
    setSeccionesDisponiblesServicio([]);
    return;
  }
  const area = areas.find(a => a.id === Number(areaId));
  if (!area || !AREAS_CON_SECCIONES.includes(area.nombre.toLowerCase())) {
    setSeccionesDisponiblesServicio([]);
    return;
  }
  try {
    const data = await getSecciones(Number(areaId));
    setSeccionesDisponiblesServicio(data.filter((s: any) => s.activo));
  } catch (err) {
    console.error(err);
    setSeccionesDisponiblesServicio([]);
  }
}
  // Datos filtrados
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const matchBusqueda = u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                           u.usuario?.toLowerCase().includes(busqueda.toLowerCase());
      const matchRol = filtroRol === 'todos' || u.rol === filtroRol;
      const matchArea = filtroArea === 'todas' || u.area_nombre === filtroArea;
      return matchBusqueda && matchRol && matchArea;
    });
  }, [usuarios, busqueda, filtroRol, filtroArea]);

  // Estadísticas
  const stats = {
    totalUsuarios: usuarios.length,
    profesionales: usuarios.filter(u => u.rol === 'profesional').length,
    areasActivas: areas.filter(a => a.activo).length,
    serviciosActivos: servicios.filter(s => s.activo).length,
  };

  // Funciones de apertura de modales
   function abrirModalNuevo() {
    setEsNuevo(true);
    setStepActual('basico');
    setForm({ nombre: '', usuario: '', password: '', email: '', telefono: '', carnet: '', role_id: 3, area_id: '', especialidad: '', sueldo: '', contrato: 'indefinido', fecha_nac: '', fecha_ingreso: '', activo: true, areas_ids: [], actividades_geronto_ids: [], servicios_ids: [] });
    setModalUsuario({});
  }

  function abrirModalEditar(u: any) {
    setEsNuevo(false);
    setStepActual('basico');
    setForm({
      nombre: u.nombre || '', usuario: u.usuario || '', password: '',
      email: u.email || '', telefono: u.telefono || '', carnet: u.carnet || '', role_id: u.role_id || 3,
      area_id: u.area_id || '', especialidad: u.especialidad || '',
      sueldo: u.sueldo || '', contrato: u.contrato || 'indefinido',
      fecha_nac: u.fecha_nac ? u.fecha_nac.split('T')[0] : '',
      fecha_ingreso: u.fecha_ingreso ? u.fecha_ingreso.split('T')[0] : '',
      activo: u.activo,
            areas_ids: u.areas ? u.areas.map((a: any) => a.id) : [],
      actividades_geronto_ids: u.actividades_geronto ? u.actividades_geronto.map((a: any) => a.id) : [],
      servicios_ids: u.servicios_ids || [],
    });
    setModalUsuario(u);
  }

async function abrirModalSecciones(area: any) {
  setModalSecciones(area);
  setCargandoSecciones(true);
  try {
    const data = await getSecciones(area.id);
    setSecciones(data);
  } catch (err) {
    console.error(err);
  } finally {
    setCargandoSecciones(false);
  }
}

function abrirFormNuevaSeccion() {
  setEsNuevaSeccion(true);
  setFormSeccion({ nombre: '', descripcion: '', activo: true });
  setModalSeccionForm({});
}

function abrirFormEditarSeccion(s: any) {
  setEsNuevaSeccion(false);
  setFormSeccion({ nombre: s.nombre || '', descripcion: s.descripcion || '', activo: s.activo });
  setModalSeccionForm(s);
}

async function guardarSeccion(e: React.FormEvent) {
  e.preventDefault();
  try {
    if (esNuevaSeccion) {
      await crearSeccion(modalSecciones.id, formSeccion);
    } else {
      await actualizarSeccion(modalSeccionForm.id, formSeccion);
    }
    setModalSeccionForm(null);
    const data = await getSecciones(modalSecciones.id);
    setSecciones(data);
  } catch (err: any) {
    alert(err.response?.data?.mensaje || 'Error al guardar sección');
  }
}

async function handleEliminarSeccion(id: number) {
  if (!confirm('¿Seguro que deseas eliminar esta sección?')) return;
  try {
    await eliminarSeccion(id);
    const data = await getSecciones(modalSecciones.id);
    setSecciones(data);
  } catch (err: any) {
    alert(err.response?.data?.mensaje || 'Error al eliminar sección');
  }
}

function serviciosDeArea(areaId: number) {
  return servicios.filter(s => s.area_id === areaId);
}
function serviciosDeSeccion(areaId: number, seccionId: number) {
  return servicios.filter(s => s.area_id === areaId && s.seccion_id === seccionId);
}
function todosServiciosSeleccionados(ids: number[]) {
  return ids.length > 0 && ids.every(id => form.servicios_ids.includes(id));
}
function toggleServicio(servicioId: number) {
  setForm(prev => ({
    ...prev,
    servicios_ids: prev.servicios_ids.includes(servicioId)
      ? prev.servicios_ids.filter(id => id !== servicioId)
      : [...prev.servicios_ids, servicioId],
  }));
}
function toggleSeccionCompleta(areaId: number, seccionId: number) {
  const ids = serviciosDeSeccion(areaId, seccionId).map(s => s.id);
  const todosMarcados = todosServiciosSeleccionados(ids);
  setForm(prev => ({
    ...prev,
    servicios_ids: todosMarcados
      ? prev.servicios_ids.filter(id => !ids.includes(id))
      : Array.from(new Set([...prev.servicios_ids, ...ids])),
  }));
}
function toggleAreaCompleta(areaId: number) {
  const ids = serviciosDeArea(areaId).map(s => s.id);
  const todosMarcados = todosServiciosSeleccionados(ids);
  setForm(prev => ({
    ...prev,
    servicios_ids: todosMarcados
      ? prev.servicios_ids.filter(id => !ids.includes(id))
      : Array.from(new Set([...prev.servicios_ids, ...ids])),
  }));
}


  function abrirModalEditarArea(a: any) {
    setEsNuevoArea(false);
    setFormArea({ nombre: a.nombre || '', descripcion: a.descripcion || '', activo: a.activo });
    setModalArea(a);
  }

   function abrirModalNuevoServicio() {
  setEsNuevoServicio(true);
  setFormServicio({ area_id: '', seccion_id: '', nombre: '', descripcion: '', costo: '', costo_descuento: '', descripcion_descuento: '', duracion_min: '', activo: true });
  setSeccionesDisponiblesServicio([]);
  setModalServicio({});
}

function abrirModalEditarServicio(s: any) {
  setEsNuevoServicio(false);
  setFormServicio({ area_id: s.area_id || '', seccion_id: s.seccion_id || '', nombre: s.nombre || '', descripcion: s.descripcion || '', costo: s.costo || '', costo_descuento: s.costo_descuento || '', descripcion_descuento: s.descripcion_descuento || '', duracion_min: s.duracion_min || '', activo: s.activo });
  cargarSeccionesParaServicio(String(s.area_id));
  setModalServicio(s);
}

  function abrirModalNuevoHorario() {
    setEsNuevoHorario(true);
    setFormHorario({ dia: 'Lunes', hora_inicio: '08:00', hora_fin: '09:00', activo: true });
    setModalHorarioZumba({});
  }

  function abrirModalEditarHorario(h: any) {
    setEsNuevoHorario(false);
    setFormHorario({ dia: h.dia, hora_inicio: h.hora_inicio.slice(0, 5), hora_fin: h.hora_fin.slice(0, 5), activo: h.activo });
    setModalHorarioZumba(h);
  }

  function abrirModalNuevaActividad() {
    setEsNuevaActividad(true);
    setFormActividad({ nombre: '', dia: 'Lunes', hora_inicio: '15:00', hora_fin: '16:00', precio: 75, activo: true });
    setModalActividad({});
  }

  function abrirModalEditarActividad(a: any) {
    setEsNuevaActividad(false);
    setFormActividad({
      nombre: a.nombre || '',
      dia: a.dia || 'Lunes',
      hora_inicio: a.hora_inicio?.slice(0, 5) || '15:00',
      hora_fin: a.hora_fin?.slice(0, 5) || '16:00',
      precio: a.precio || 75,
      activo: a.activo,
    });
    setModalActividad(a);
  }

  // Función para abrir el modal con las áreas del profesional
  async function abrirModalHorariosProfesional(p: any) {
    setModalHorariosProfesional(p);
    setCargandoHorarios(true);
    try {
      const data = await getHorarios(p.id);
      const horariosConArea = data.map((h: any) => ({
        ...h,
        area_id: h.area_id || p.areas?.[0]?.id || null
      }));
      setHorariosProfesional(horariosConArea);
      setNuevoHorario({
        dia: 'Lunes',
        hora_inicio: '08:00',
        hora_fin: '17:00',
        slot_minutos: 60,
        area_id: p.areas?.[0]?.id || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoHorarios(false);
    }
  }

  async function agregarHorarioProfesionalConArea() {
  if (!modalHorariosProfesional || !nuevoHorario.area_id) {
    alert('Selecciona un área primero');
    return;
  }
  
  try {
    // ✅ Validar que no exista horario duplicado en el mismo día y área
    const horaInicio = nuevoHorario.hora_inicio;
    const horaFin = nuevoHorario.hora_fin;
    
    const existeSuperposicion = horariosProfesional.some(h => {
      if (h.dia !== nuevoHorario.dia) return false;
      if (Number(h.area_id) !== Number(nuevoHorario.area_id)) return false;
      
      const hInicio = h.hora_inicio.slice(0, 5);
      const hFin = h.hora_fin.slice(0, 5);
      
      // ✅ Verificar si los horarios se superponen
      return (horaInicio < hFin && hInicio < horaFin);
    });
    
    if (existeSuperposicion) {
      alert('Ya existe un horario para este día y área que se superpone con el horario seleccionado');
      return;
    }

    const horariosNormalizados = horariosProfesional.map(h => ({
      dia: h.dia,
      hora_inicio: h.hora_inicio.slice(0, 5),
      hora_fin: h.hora_fin.slice(0, 5),
      slot_minutos: h.slot_minutos || 60,
      area_id: Number(h.area_id),
    }));
    
    const nuevos = [...horariosNormalizados, {
      dia: nuevoHorario.dia,
      hora_inicio: nuevoHorario.hora_inicio,
      hora_fin: nuevoHorario.hora_fin,
      slot_minutos: nuevoHorario.slot_minutos,
      area_id: Number(nuevoHorario.area_id),
    }];
    
    await guardarHorarios(modalHorariosProfesional.id, nuevos);
    const data = await getHorarios(modalHorariosProfesional.id);
    setHorariosProfesional(data);
    
    const primerArea = modalHorariosProfesional.areas?.[0]?.id || '';
    setNuevoHorario({ 
      dia: 'Lunes', 
      hora_inicio: '08:00', 
      hora_fin: '17:00', 
      slot_minutos: 60,
      area_id: primerArea,
    });
    
    await cargarTodosHorarios();
  } catch (err) {
    console.error(err);
    alert('Error al agregar horario');
  }
}

  
  // Función para eliminar horario
  async function eliminarHorarioProfesionalConArea(index: number) {
    if (!modalHorariosProfesional) return;
    try {
      const nuevos = horariosProfesional
        .filter((_, i) => i !== index)
        .map(h => ({
          dia: h.dia,
          hora_inicio: h.hora_inicio.slice(0, 5),
          hora_fin: h.hora_fin.slice(0, 5),
          slot_minutos: h.slot_minutos || 60,
          area_id: Number(h.area_id),
        }));
      await guardarHorarios(modalHorariosProfesional.id, nuevos);
      const data = await getHorarios(modalHorariosProfesional.id);
      setHorariosProfesional(data);
      
      // Recargar la lista de todos los horarios
      await cargarTodosHorarios();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar horario');
    }
  }

  // Funciones de guardado
  // ✅ MODIFICAR esta función en Admin.tsx
async function guardarUsuario(e: React.FormEvent) {
  e.preventDefault();
  try {
    const datos: any = { ...form };
    if (!datos.password) delete datos.password;
    if (!datos.area_id) datos.area_id = null;
    if (!datos.sueldo) datos.sueldo = null;
    if (!datos.fecha_nac) datos.fecha_nac = null;
    if (!datos.fecha_ingreso) datos.fecha_ingreso = null;
    if (datos.areas_ids && datos.areas_ids.length > 0) {
      datos.area_id = datos.areas_ids[0];
    }
    esNuevo ? await crearUsuario(datos) : await actualizarUsuario(modalUsuario.id, datos);
    setModalUsuario(null);
    await cargarDatos();
    
    // ✅ NUEVO: Si la pestaña Horarios está activa, recargar los horarios
    if (tabActiva === 'horarios') {
      await cargarTodosHorarios();
    }
  } catch (err: any) {
    alert(err.response?.data?.mensaje || 'Error al guardar');
  }
}

async function guardarArea(e: React.FormEvent) {
  e.preventDefault();
  try {
    const datos = {
      ...formArea,
      activo: formArea.activo !== undefined ? formArea.activo : true
    };
    
    await actualizarArea(modalArea.id, datos); // ya no hay rama "esNuevoArea"
    setModalArea(null);
    await cargarDatos();
  } catch (err: any) {
    console.error('Error completo:', err);
    alert(err.response?.data?.mensaje || 'Error al guardar area');
  }
}
  
async function guardarServicio(e: React.FormEvent) {
  e.preventDefault();
  try {
    const datos = {
      ...formServicio,
      seccion_id: formServicio.seccion_id || null,
      costo: formServicio.costo || null,
      costo_descuento: formServicio.costo_descuento || null,
      descripcion_descuento: formServicio.descripcion_descuento || null,
      duracion_min: formServicio.duracion_min || null,
    };
    esNuevoServicio ? await crearServicio(datos) : await actualizarServicio(modalServicio.id, datos);
    setModalServicio(null);
    await cargarDatos();
  } catch (err: any) {
    alert(err.response?.data?.mensaje || 'Error al guardar servicio');
  }
}

  async function guardarHorarioZumba(e: React.FormEvent) {
    e.preventDefault();
    try {
      esNuevoHorario ? await crearHorarioZumba(formHorario) : await actualizarHorarioZumba(modalHorarioZumba.id, formHorario);
      setModalHorarioZumba(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al guardar horario');
    }
  }

  async function guardarActividad(e: React.FormEvent) {
    e.preventDefault();
    try {
      esNuevaActividad ? await crearActividadGeronto(formActividad) : await actualizarActividadGeronto(modalActividad.id, formActividad);
      setModalActividad(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al guardar actividad');
    }
  }

  // Funciones de eliminación
  async function handleEliminarServicio(id: number) {
    if (!confirm('¿Seguro que deseas eliminar este servicio?')) return;
    try {
      await eliminarServicio(id);
      await cargarDatos();
    } catch (err: any) { alert(err.response?.data?.mensaje || 'Error al eliminar'); }
  }

  async function handleEliminarHorario(id: number) {
    if (!confirm('¿Seguro que deseas eliminar este horario?')) return;
    try {
      await eliminarHorarioZumba(id);
      await cargarDatos();
    } catch (err: any) { alert(err.response?.data?.mensaje || 'Error al eliminar'); }
  }

  async function handleEliminarActividad(id: number) {
    if (!confirm('¿Seguro que deseas eliminar esta actividad?')) return;
    try {
      await eliminarActividadGeronto(id);
      await cargarDatos();
    } catch (err: any) { alert(err.response?.data?.mensaje || 'Error al eliminar'); }
  }

  async function toggleActivo(u: any) {
    try {
      await actualizarUsuario(u.id, { activo: !u.activo });
      await cargarDatos();
    } catch (err) { console.error(err); }
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return;
    try {
      await eliminarUsuario(id);
      await cargarDatos();
    } catch (err: any) { alert(err.response?.data?.mensaje || 'Error al eliminar'); }
  }

  // Verificar acceso
  if (usuario?.rol !== 'administrador' && usuario?.rol !== 'supervisor') {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🔒</span>
        </div>
        <p className="text-gray-600 font-medium text-lg">No tienes acceso a esta sección</p>
        <p className="text-gray-400 text-sm mt-1">Solo administradores y supervisores pueden acceder</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'areas', label: 'Áreas', icon: Building2 },
    { id: 'servicios', label: 'Servicios', icon: Briefcase },
    { id: 'zumba', label: 'Zumba', icon: Activity },
    { id: 'geronto', label: 'Gerontología', icon: UserCog },
    { id: 'horarios', label: 'Horarios', icon: Clock },
    { id: 'auditoria', label: 'Auditoría', icon: Clock },
  ];

  const serviciosPorArea = areas.map(a => ({
    ...a,
    servicios: servicios.filter(s => s.area_id === a.id),
  }));

  // Agrupar horarios por profesional y área
  const horariosAgrupados = useMemo(() => {
    const grupos: any = {};
    
    todosHorarios.forEach((h: any) => {
      const key = `${h.user_id}-${h.area_id}`;
      if (!grupos[key]) {
        grupos[key] = {
          user_id: h.user_id,
          profesional_nombre: h.profesional_nombre,
          area_id: h.area_id,
          area_nombre: h.area_nombre || 'Sin área',
          horarios: []
        };
      }
      grupos[key].horarios.push({
        dia: h.dia,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
        slot_minutos: h.slot_minutos
      });
    });
    
    // Ordenar horarios por día
    const ordenDias: { [key: string]: number } = {
      'Lunes': 1, 'Martes': 2, 'Miercoles': 3, 
      'Jueves': 4, 'Viernes': 5, 'Sabado': 6, 'Domingo': 7
    };
    
    Object.values(grupos).forEach((grupo: any) => {
      grupo.horarios.sort((a: any, b: any) => ordenDias[a.dia] - ordenDias[b.dia]);
    });
    
    return Object.values(grupos);
  }, [todosHorarios]);

  // Profesionales que NO tienen horarios
  const profesionalesSinHorarios = useMemo(() => {
  const profesionalesConHorarios = new Set(todosHorarios.map((h: any) => h.user_id));
  // ✅ SOLO profesionales ACTIVOS, que NO tienen horarios Y que tienen al menos 1 área asignada
  return profesionales.filter(p => 
    !profesionalesConHorarios.has(p.id) && 
    p.activo && 
    p.areas && 
    p.areas.length > 0  // <--- NUEVO: debe tener al menos un área
  );
}, [profesionales, todosHorarios]);

  return (
    <div className="max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {tabActiva === 'usuarios' && (
            <button 
              onClick={abrirModalNuevo} 
              className="bg-[#A000D1] text-white px-4 py-2.5 rounded-xl text-sm hover:bg-[#8800b3] transition-all shadow-lg shadow-purple-200 whitespace-nowrap flex items-center gap-2"
            >
              <UserPlus size={18} />
              Nuevo usuario
            </button>
          )}
         
          {tabActiva === 'servicios' && (
            <button 
              onClick={abrirModalNuevoServicio} 
              className="bg-[#A000D1] text-white px-4 py-2.5 rounded-xl text-sm hover:bg-[#8800b3] transition-all shadow-lg shadow-purple-200 whitespace-nowrap flex items-center gap-2"
            >
              <Plus size={18} />
              Nuevo servicio
            </button>
          )}
          {tabActiva === 'zumba' && (
            <button 
              onClick={abrirModalNuevoHorario} 
              className="bg-[#A000D1] text-white px-4 py-2.5 rounded-xl text-sm hover:bg-[#8800b3] transition-all shadow-lg shadow-purple-200 whitespace-nowrap flex items-center gap-2"
            >
              <Plus size={18} />
              Nuevo horario
            </button>
          )}
          {tabActiva === 'geronto' && (
            <button 
              onClick={abrirModalNuevaActividad} 
              className="bg-[#A000D1] text-white px-4 py-2.5 rounded-xl text-sm hover:bg-[#8800b3] transition-all shadow-lg shadow-purple-200 whitespace-nowrap flex items-center gap-2"
            >
              <Plus size={18} />
              Nueva actividad
            </button>
          )}
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 border-b overflow-x-auto pb-0.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button 
              key={t.id} 
              onClick={() => setTabActiva(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                tabActiva === t.id 
                  ? 'border-[#A000D1] text-[#A000D1]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-[#A000D1] rounded-full animate-spin"></div>
            <p className="text-gray-500 text-sm">Cargando datos...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ========== DASHBOARD ========== */}
          {tabActiva === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-[#efedf0] p-5 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Total Usuarios</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalUsuarios}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Users size={24} className="text-purple-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-[#efedf0] p-5 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Profesionales</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{stats.profesionales}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <UserCog size={24} className="text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-[#efedf0] p-5 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Áreas Activas</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{stats.areasActivas}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <Building2 size={24} className="text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-[#efedf0] p-5 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Servicios Activos</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{stats.serviciosActivos}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                      <Briefcase size={24} className="text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actividad reciente */}
              <div className="bg-white rounded-2xl border border-[#efedf0] p-5 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">Última actividad</h3>
                  <button 
                    onClick={() => setTabActiva('auditoria')}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Ver todos
                  </button>
                </div>
                <div className="space-y-2">
                  {auditLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-2 h-2 rounded-full ${
                        log.accion === 'crear' ? 'bg-green-500' : 
                        log.accion === 'editar' ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm text-gray-600 flex-1">
                        <span className="font-medium">{log.usuario_nombre || log.user_nombre}</span>
                        {' '}{log.accion}{' '}
                        <span className="text-gray-400">{log.tabla}</span>
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleString('es', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========== USUARIOS ========== */}
          {tabActiva === 'usuarios' && (
            <div className="bg-white rounded-3xl border border-[#efedf0] hover:shadow-xl transition-all duration-300">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Users size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-800">Usuarios del sistema</h2>
                      <span className="text-xs text-gray-400">{usuariosFiltrados.length} usuarios</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-medium border border-violet-200 whitespace-nowrap">
                      Control de acceso
                    </span>
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o usuario..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                    />
                  </div>
                  <select
                    value={filtroRol}
                    onChange={(e) => setFiltroRol(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                  >
                    <option value="todos">Todos los roles</option>
                    <option value="administrador">Administrador</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="profesional">Profesional</option>
                    <option value="recepcionista">Recepcionista</option>
                  </select>
                  <select
                    value={filtroArea}
                    onChange={(e) => setFiltroArea(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                  >
                    <option value="todas">Todas las áreas</option>
                    {areas.filter(a => a.activo).map(a => (
                      <option key={a.id} value={a.nombre}>{a.nombre}</option>
                    ))}
                  </select>
                  {(busqueda || filtroRol !== 'todos' || filtroArea !== 'todas') && (
                    <button
                      onClick={() => { setBusqueda(''); setFiltroRol('todos'); setFiltroArea('todas'); }}
                      className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <X size={14} /> Limpiar
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Nombre</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Usuario</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Rol</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Área</th>
                      <th className="text-center p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Estado</th>
                      <th className="text-center p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 sm:p-4 font-medium text-gray-800 text-xs sm:text-sm whitespace-nowrap">{u.nombre}</td>
                        <td className="p-3 sm:p-4 text-gray-600 font-mono text-xs whitespace-nowrap">{u.usuario}</td>
                        <td className="p-3 sm:p-4">
                          <span className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap ${
                            u.rol === 'administrador' ? 'bg-red-100 text-red-700' : 
                            u.rol === 'supervisor' ? 'bg-violet-100 text-violet-700' : 
                            u.rol === 'profesional' ? 'bg-blue-100 text-blue-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.rol}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-gray-600 text-xs whitespace-nowrap">{u.area_nombre || '-'}</td>
                        <td className="p-3 sm:p-4 text-center">
                          <button 
                            onClick={() => toggleActivo(u)} 
                            className={`text-[10px] px-2 sm:px-3 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1 mx-auto ${
                              u.activo 
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {u.activo ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="p-3 sm:p-4 text-center">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button 
                              onClick={() => abrirModalEditar(u)} 
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all duration-200"
                              title="Editar usuario"
                            >
                              <Pencil size={14} />
                            </button>
                            {usuario?.rol === 'administrador' && u.id !== usuario.id && (
                              <button 
                                onClick={() => handleEliminar(u.id)} 
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200"
                                title="Eliminar usuario"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {usuariosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                          No se encontraron usuarios
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========== ÁREAS ========== */}
          {tabActiva === 'areas' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {areas.map(a => (
                <div key={a.id} className="bg-white rounded-3xl border border-[#efedf0] p-5 hover:shadow-xl transition-all duration-300 group">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-800 truncate">{a.nombre}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                        a.activo ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {a.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => abrirModalEditarArea(a)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all duration-200"
                        title="Editar área"
                      >
                        <Pencil size={16} />
                      </button>
                      {AREAS_CON_SECCIONES.includes(a.nombre.toLowerCase()) && (
                        <button
                          onClick={() => abrirModalSecciones(a)}
                          className="text-[10px] px-2 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all duration-200 font-medium whitespace-nowrap"
                          title="Gestionar secciones"
                        >
                          Secciones
                        </button>
                      )}
                    </div>
                  </div>
                  {a.descripcion && (
                    <p className="text-xs text-gray-500 mt-2 break-words">{a.descripcion}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {servicios.filter(s => s.area_id === a.id).length} servicios
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========== SERVICIOS ========== */}
          {tabActiva === 'servicios' && (
            <div className="space-y-4">
              {serviciosPorArea
                .filter(a => a.nombre.toLowerCase() !== 'zumba' && a.nombre.toLowerCase() !== 'gerontologia' && a.activo)
                .map(area => (
                  <div key={area.id} className="bg-white rounded-3xl border border-[#efedf0] hover:shadow-xl transition-all duration-300">
                    <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                            <Building2 size={18} className="text-violet-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">{area.nombre}</h3>
                            <span className="text-xs text-gray-400">{area.servicios.length} servicios</span>
                          </div>
                        </div>
                        <span className="text-[10px] px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-medium border border-violet-200 whitespace-nowrap">
                          Activa
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-sm min-w-[700px]">
                        <thead className="border-gray-100">
                          <tr>
                            <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Nombre</th>
                            <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Descripción</th>
                            <th className="text-right p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Costo</th>
                            <th className="text-center p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Duración</th>
                            <th className="text-center p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Estado</th>
                            <th className="text-center p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {area.servicios.map((s: any) => (
                            <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-3 sm:p-4 font-medium text-gray-800 text-xs sm:text-sm whitespace-nowrap">{s.nombre}</td>
                              <td className="p-3 sm:p-4 text-gray-500 text-xs max-w-[150px] truncate">{s.descripcion || '-'}</td>
                                                            <td className="p-3 sm:p-4 text-right text-xs whitespace-nowrap">
                                {s.costo_descuento ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-gray-400 line-through text-[10px]">
                                      Bs {Number(s.costo).toFixed(0)}
                                    </span>
                                    <span className="text-emerald-600 font-semibold">
                                      Bs {Number(s.costo_descuento).toFixed(0)}
                                    </span>
                                    {s.descripcion_descuento && (
                                      <span className="text-[9px] text-emerald-500">{s.descripcion_descuento}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-violet-600 font-semibold">
                                    {s.costo ? `Bs ${Number(s.costo).toFixed(0)}` : '-'}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 sm:p-4 text-center text-gray-600 text-xs whitespace-nowrap">
                                {s.duracion_min ? `${s.duracion_min} min` : '-'}
                              </td>
                              <td className="p-3 sm:p-4 text-center">
                                <span className={`text-[10px] px-2 sm:px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                                  s.activo 
                                    ? 'bg-violet-50 text-violet-700 border border-violet-200' 
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  {s.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="p-3 sm:p-4 text-center">
                                <div className="flex items-center justify-center gap-1 sm:gap-2">
                                  <button 
                                    onClick={() => abrirModalEditarServicio(s)} 
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all duration-200"
                                    title="Editar servicio"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleEliminarServicio(s.id)} 
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200"
                                    title="Eliminar servicio"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ========== ZUMBA ========== */}
          {tabActiva === 'zumba' && (
            <div className="bg-white rounded-3xl border border-[#efedf0] hover:shadow-xl transition-all duration-300">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Activity size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-800">Horarios de Zumba</h2>
                      <span className="text-xs text-gray-400">{horariosZumba.length} horarios</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-medium border border-violet-200 whitespace-nowrap">
                    Gestión de clases
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="border-gray-100">
                    <tr>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Día</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Hora inicio</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Hora fin</th>
                      <th className="text-center p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Estado</th>
                      <th className="text-center p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horariosZumba.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 sm:p-4 font-medium text-gray-800 text-xs sm:text-sm whitespace-nowrap">{h.dia}</td>
                        <td className="p-3 sm:p-4 text-gray-600 text-xs whitespace-nowrap">{h.hora_inicio?.slice(0, 5)}</td>
                        <td className="p-3 sm:p-4 text-gray-600 text-xs whitespace-nowrap">{h.hora_fin?.slice(0, 5)}</td>
                        <td className="p-3 sm:p-4 text-center">
                          <span className={`text-[10px] px-2 sm:px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                            h.activo 
                              ? 'bg-violet-50 text-violet-700 border border-violet-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {h.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-center">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button 
                              onClick={() => abrirModalEditarHorario(h)} 
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all duration-200"
                              title="Editar horario"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => handleEliminarHorario(h.id)} 
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200"
                              title="Eliminar horario"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========== GERONTOLOGÍA ========== */}
          {tabActiva === 'geronto' && (
            <div className="bg-white rounded-3xl border border-[#efedf0] hover:shadow-xl transition-all duration-300">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <UserCog size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-800">Actividades de Gerontología</h2>
                      <span className="text-xs text-gray-400">{actividadesGeronto.length} actividades</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-medium border border-violet-200 whitespace-nowrap">
                    Gestión de actividades
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="border-gray-100">
                    <tr>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Nombre</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Día</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Horario</th>
                      <th className="text-right p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Precio</th>
                      <th className="text-center p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Estado</th>
                      <th className="text-center p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actividadesGeronto.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 sm:p-4 font-medium text-gray-800 text-xs sm:text-sm whitespace-nowrap">{a.nombre}</td>
                        <td className="p-3 sm:p-4 text-gray-600 text-xs whitespace-nowrap">{a.dia}</td>
                        <td className="p-3 sm:p-4 text-gray-600 text-xs whitespace-nowrap">
                          {a.hora_inicio?.slice(0, 5)} - {a.hora_fin?.slice(0, 5)}
                        </td>
                        <td className="p-3 sm:p-4 text-right text-violet-600 font-semibold text-xs whitespace-nowrap">
                          Bs {a.precio}
                        </td>
                        <td className="p-3 sm:p-4 text-center">
                          <span className={`text-[10px] px-2 sm:px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                            a.activo 
                              ? 'bg-violet-50 text-violet-700 border border-violet-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {a.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-center">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button 
                              onClick={() => abrirModalEditarActividad(a)} 
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all duration-200"
                              title="Editar actividad"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => handleEliminarActividad(a.id)} 
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200"
                              title="Eliminar actividad"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


            {/* ========== MODAL LISTA DE SECCIONES ========== */}
            {modalSecciones !== null && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
                <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-[#efedf0]">
                  <div className="flex justify-between items-center mb-5">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-800">Secciones de {modalSecciones.nombre}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Crea, edita o elimina secciones de esta área</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalSecciones(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all text-sm font-bold flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  <button
                    onClick={abrirFormNuevaSeccion}
                    className="w-full mb-4 bg-[#A000D1] hover:bg-[#8800b3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Nueva sección
                  </button>

                  {cargandoSecciones ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-8 h-8 border-4 border-purple-200 border-t-[#A000D1] rounded-full animate-spin"></div>
                    </div>
                  ) : secciones.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      <p className="text-sm text-gray-500">Aún no hay secciones en esta área</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {secciones.map(s => (
                        <div key={s.id} className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{s.nombre}</p>
                            {s.descripcion && <p className="text-xs text-gray-500 truncate">{s.descripcion}</p>}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                            s.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {s.activo ? 'Activa' : 'Inactiva'}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => abrirFormEditarSeccion(s)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all duration-200"
                              title="Editar sección"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleEliminarSeccion(s.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200"
                              title="Eliminar sección"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========== MODAL FORM SECCIÓN (crear/editar) ========== */}
            {modalSeccionForm !== null && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
                <form onSubmit={guardarSeccion} className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-[#efedf0]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">
                      {esNuevaSeccion ? 'Nueva sección' : 'Editar sección'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setModalSeccionForm(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all text-sm font-bold flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                        Nombre de la sección <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Recuperación y movimiento"
                        value={formSeccion.nombre}
                        onChange={e => setFormSeccion({ ...formSeccion, nombre: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                        Descripción <span className="text-gray-300 font-normal normal-case">(opcional)</span>
                      </label>
                      <textarea
                        value={formSeccion.descripcion}
                        onChange={e => setFormSeccion({ ...formSeccion, descripcion: e.target.value })}
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all resize-none"
                      />
                    </div>
                    {!esNuevaSeccion && (
                      <div
                        onClick={() => setFormSeccion({ ...formSeccion, activo: !formSeccion.activo })}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          formSeccion.activo ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-700">
                          {formSeccion.activo ? 'Sección activa' : 'Sección inactiva'}
                        </p>
                        <div className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${
                          formSeccion.activo ? 'bg-[#A000D1]' : 'bg-gray-300'
                        }`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                            formSeccion.activo ? 'left-5' : 'left-0.5'
                          }`} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button type="button" onClick={() => setModalSeccionForm(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">
                      Cancelar
                    </button>
                    <button type="submit" className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-purple-200">
                      {esNuevaSeccion ? 'Crear sección' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          {/* ========== AUDITORÍA ========== */}
          {tabActiva === 'auditoria' && (
            <div className="bg-white rounded-3xl border border-[#efedf0] hover:shadow-xl transition-all duration-300">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-violet-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800">Registro de actividad</h2>
                    <p className="text-xs text-gray-500">Quién hizo qué y cuándo</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Fecha</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Usuario</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Acción</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Tabla</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 sm:p-4 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('es')}
                        </td>
                        <td className="p-3 sm:p-4 font-medium text-gray-800 text-xs sm:text-sm whitespace-nowrap">
                          {log.usuario_nombre || log.user_nombre}
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                            log.accion === 'crear' ? 'bg-emerald-100 text-emerald-700' : 
                            log.accion === 'editar' ? 'bg-blue-100 text-blue-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {log.accion}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-gray-600 font-mono text-xs whitespace-nowrap">{log.tabla}</td>
                        <td className="p-3 sm:p-4 text-gray-500 text-xs max-w-[200px] truncate">
                          {log.datos_despues ? JSON.stringify(log.datos_despues).slice(0, 60) + '...' : 'Eliminado'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========== TODOS LOS HORARIOS (AGRUPADO) ========== */}
{tabActiva === 'horarios' && (
  <div className="space-y-6">
    {/* Profesionales con horarios */}
    <div className="bg-white rounded-3xl border border-[#efedf0] hover:shadow-xl transition-all duration-300">
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Horarios por profesional y área</h2>
              <span className="text-xs text-gray-400">
                {horariosAgrupados.length} combinaciones de profesional/área con horarios
              </span>
            </div>
          </div>
          <span className="text-[10px] px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-medium border border-violet-200 whitespace-nowrap">
            Gestión general
          </span>
        </div>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Profesional</th>
              <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Área</th>
              <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Horarios</th>
              <th className="text-center p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {horariosAgrupados.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-400 text-sm">
                  No hay horarios registrados
                </td>
              </tr>
            ) : (
              horariosAgrupados.map((grupo: any, index: number) => (
                <tr key={`${grupo.user_id}-${grupo.area_id}-${index}`} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                  <td className="p-3 sm:p-4 font-medium text-gray-800 text-xs sm:text-sm whitespace-nowrap">
                    {grupo.profesional_nombre}
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {grupo.area_nombre}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="flex flex-wrap gap-1">
                      {grupo.horarios.map((h: any, idx: number) => (
                        <span 
                          key={idx} 
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap border border-gray-200"
                        >
                          {h.dia} {h.hora_inicio?.slice(0, 5)}-{h.hora_fin?.slice(0, 5)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 sm:p-4 text-center">
                    <button
                      onClick={() => {
                        const profesional = profesionales.find(p => p.id === grupo.user_id);
                        if (profesional) {
                          abrirModalHorariosProfesional(profesional);
                        }
                      }}
                      className="text-xs text-violet-600 hover:text-violet-800 font-medium border border-violet-300 px-3 py-1.5 rounded-lg transition-all hover:bg-violet-50 whitespace-nowrap"
                    >
                      Editar horarios
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* ✅ Profesionales sin horarios PERO con áreas asignadas */}
    {profesionalesSinHorarios.length > 0 && (
      <div className="bg-white rounded-3xl border border-[#efedf0] hover:shadow-xl transition-all duration-300">
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={18} className="text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold text-amber-800">Profesionales sin horarios</h2>
                <span className="text-xs text-amber-600">
                  {profesionalesSinHorarios.length} profesionales necesitan horarios
                </span>
              </div>
            </div>
            <span className="text-[10px] px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200 whitespace-nowrap">
              Pendientes
            </span>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Profesional</th>
                <th className="text-left p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Áreas asignadas</th>
                <th className="text-center p-3 sm:p-4 font-semibold text-gray-600 text-xs whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {profesionalesSinHorarios.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 sm:p-4 font-medium text-gray-800 text-xs sm:text-sm whitespace-nowrap">
                    {p.nombre}
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="flex flex-wrap gap-1">
                      {p.areas?.map((area: any) => (
                        <span key={area.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {area.nombre}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 sm:p-4 text-center">
                    <button
                      onClick={() => abrirModalHorariosProfesional(p)}
                      className="text-xs text-amber-600 hover:text-amber-800 font-medium border border-amber-300 px-3 py-1.5 rounded-lg transition-all hover:bg-amber-50 whitespace-nowrap"
                    >
                      Gestionar horarios
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
)}
        </>
      )}

      {/* ========== MODAL USUARIO (con Stepper) ========== */}
      {modalUsuario !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <form onSubmit={guardarUsuario} className={`bg-white rounded-3xl p-5 sm:p-6 w-full ${esNuevo ? 'max-w-lg' : 'max-w-4xl'} max-h-[90vh] overflow-y-auto shadow-2xl border border-[#efedf0]`}>
            <div className="flex justify-between items-center mb-6">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-800">{esNuevo ? 'Nuevo usuario' : 'Editar usuario'}</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {esNuevo ? 'Completa los datos del usuario' : 'Modifica los datos del usuario'}
                </p>
              </div>
              <button type="button" onClick={() => setModalUsuario(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all text-sm font-bold flex-shrink-0">✕</button>
            </div>

            {/* Stepper */}
            {esNuevo && (
              <div className="flex items-center gap-2 mb-6">
                {['basico', 'profesional', 'asignaciones'].map((step, idx) => (
                  <div key={step} className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => setStepActual(step as Step)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        stepActual === step 
                          ? 'bg-[#A000D1] text-white' 
                          : stepActual === 'profesional' && step === 'basico'
                          ? 'bg-green-100 text-green-700'
                          : stepActual === 'asignaciones' && (step === 'basico' || step === 'profesional')
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {stepActual === 'profesional' && step === 'basico' ? '✓' :
                       stepActual === 'asignaciones' && (step === 'basico' || step === 'profesional') ? '✓' :
                       idx + 1}
                      <span className="hidden sm:inline">
                        {step === 'basico' ? 'Básico' : step === 'profesional' ? 'Profesional' : 'Asignaciones'}
                      </span>
                    </button>
                    {idx < 2 && <div className="flex-1 h-0.5 bg-gray-200" />}
                  </div>
                ))}
              </div>
            )}

            <div className={esNuevo ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start"}>
              {/* Paso 1: Básico */}
              {(stepActual === 'basico' || !esNuevo) && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={form.nombre} 
                      onChange={e => setForm({ ...form, nombre: e.target.value })} 
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                        Usuario <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required={esNuevo} 
                        value={form.usuario} 
                        onChange={e => setForm({ ...form, usuario: e.target.value })} 
                        disabled={!esNuevo} 
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all disabled:bg-gray-100" 
                        placeholder="usuario"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                        {esNuevo ? 'Contraseña' : 'Nueva contraseña'}
                        {esNuevo && <span className="text-red-500">*</span>}
                      </label>
                      <input 
                        type="password" 
                        required={esNuevo} 
                        value={form.password} 
                        onChange={e => setForm({ ...form, password: e.target.value })} 
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                        placeholder={esNuevo ? '••••••••' : 'Nueva contraseña (opcional)'}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                        Rol <span className="text-red-500">*</span>
                      </label>
                      <select 
                        value={form.role_id} 
                        onChange={e => setForm({ ...form, role_id: Number(e.target.value) })} 
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                      >
                        <option value={1}>Administrador</option>
                        <option value={2}>Supervisor</option>
                        <option value={3}>Profesional</option>
                        <option value={4}>Recepcionista</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Email</label>
                      <input 
                        type="email" 
                        value={form.email} 
                        onChange={e => setForm({ ...form, email: e.target.value })} 
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                        placeholder="ejemplo@correo.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Teléfono</label>
                      <input
                        type="text"
                        value={form.telefono}
                        onChange={e => setForm({ ...form, telefono: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                        placeholder="+591 7xxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Carnet C.I.</label>
                      <input
                        type="text"
                        value={form.carnet}
                        onChange={e => setForm({ ...form, carnet: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                        placeholder="Ej. 1234567"
                      />
                    </div>
                  </div>
                  {!esNuevo && (
                    <div
                      onClick={() => setForm({ ...form, activo: !form.activo })}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        form.activo ? 'bg-violet-50 border-violet-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {form.activo ? 'Usuario activo' : 'Usuario inactivo'}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {form.activo ? 'Puede acceder al sistema' : 'Acceso bloqueado'}
                        </p>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${
                        form.activo ? 'bg-[#A000D1]' : 'bg-gray-300'
                      }`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          form.activo ? 'left-5' : 'left-0.5'
                        }`} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 2: Profesional */}
              {(stepActual === 'profesional' || !esNuevo) && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Especialidad</label>
                    <input 
                      type="text" 
                      value={form.especialidad} 
                      onChange={e => setForm({ ...form, especialidad: e.target.value })} 
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                      placeholder="Ej. Psicología clínica"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Sueldo (Bs)</label>
                      <input 
                        type="number" 
                        value={form.sueldo} 
                        onChange={e => setForm({ ...form, sueldo: e.target.value })} 
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Contrato</label>
                      <select 
                        value={form.contrato} 
                        onChange={e => setForm({ ...form, contrato: e.target.value })} 
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                      >
                        <option value="indefinido">Indefinido</option>
                        <option value="temporal">Temporal</option>
                        <option value="practicante">Practicante</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Fecha nacimiento</label>
                      <input 
                        type="date" 
                        value={form.fecha_nac} 
                        onChange={e => setForm({ ...form, fecha_nac: e.target.value })} 
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Fecha ingreso</label>
                      <input 
                        type="date" 
                        value={form.fecha_ingreso} 
                        onChange={e => setForm({ ...form, fecha_ingreso: e.target.value })} 
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 3: Asignaciones */}
              {(stepActual === 'asignaciones' || !esNuevo) && (
                <div className={esNuevo ? undefined : 'md:col-span-2'}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Áreas</label>
                                    <div className="space-y-1.5 border border-gray-200 rounded-xl p-2 max-h-[300px] overflow-y-auto">
                    {areas.map(a => {
                      const seleccionada = form.areas_ids.includes(a.id);
                      const esGeronto = a.nombre.toLowerCase() === 'gerontologia';
                      const tieneSecciones = AREAS_CON_SECCIONES.includes(a.nombre.toLowerCase());
                      return (
                        <div key={a.id}>
                          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors">
                            <input 
                              type="checkbox" 
                              checked={seleccionada}
                              onChange={() => {
                                const nuevas = seleccionada
                                  ? form.areas_ids.filter(id => id !== a.id)
                                  : [...form.areas_ids, a.id];
                                const nuevasActividades = !nuevas.includes(a.id) && esGeronto
                                  ? []
                                  : form.actividades_geronto_ids;
                                const idsServiciosArea = serviciosDeArea(a.id).map(s => s.id);
                                const nuevosServicios = !nuevas.includes(a.id)
                                  ? form.servicios_ids.filter(id => !idsServiciosArea.includes(id))
                                  : form.servicios_ids;
                                setForm({ ...form, areas_ids: nuevas, actividades_geronto_ids: nuevasActividades, servicios_ids: nuevosServicios });
                              }}
                              className="rounded text-[#A000D1] focus:ring-[#A000D1] flex-shrink-0" 
                            />
                            <span className="text-sm truncate">{a.nombre}</span>
                            <span className={`text-[10px] ml-auto ${
                              a.activo ? 'text-green-500' : 'text-red-400'
                            }`}>
                              {a.activo ? '●' : '○'}
                            </span>
                          </label>

                          {seleccionada && tieneSecciones && (
                            <div className="ml-6 mt-1 mb-2 border-l-2 border-violet-100 pl-3 space-y-2">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-violet-700">
                                <input
                                  type="checkbox"
                                  checked={todosServiciosSeleccionados(serviciosDeArea(a.id).map(s => s.id))}
                                  onChange={() => toggleAreaCompleta(a.id)}
                                  className="rounded text-[#A000D1] focus:ring-[#A000D1]"
                                />
                                Todos los servicios de {a.nombre}
                              </label>
                              {(seccionesPorArea[a.id] || []).length === 0 ? (
                                <p className="text-[10px] text-gray-400">Esta área aún no tiene secciones creadas</p>
                              ) : (
                                (seccionesPorArea[a.id] || []).map(sec => {
                                  const idsSeccion = serviciosDeSeccion(a.id, sec.id).map(s => s.id);
                                  return (
                                    <div key={sec.id} className="ml-3">
                                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-600">
                                        <input
                                          type="checkbox"
                                          checked={todosServiciosSeleccionados(idsSeccion)}
                                          onChange={() => toggleSeccionCompleta(a.id, sec.id)}
                                          className="rounded text-[#A000D1] focus:ring-[#A000D1]"
                                        />
                                        {sec.nombre}
                                      </label>
                                      <div className="ml-5 space-y-0.5 mt-0.5">
                                        {serviciosDeSeccion(a.id, sec.id).length === 0 ? (
                                          <p className="text-[10px] text-gray-300">Sin servicios en esta sección</p>
                                        ) : (
                                          serviciosDeSeccion(a.id, sec.id).map(serv => (
                                            <label key={serv.id} className="flex items-center gap-2 cursor-pointer text-xs text-gray-500">
                                              <input
                                                type="checkbox"
                                                checked={form.servicios_ids.includes(serv.id)}
                                                onChange={() => toggleServicio(serv.id)}
                                                className="rounded text-[#A000D1] focus:ring-[#A000D1]"
                                              />
                                              {serv.nombre}
                                            </label>
                                          ))
                                        )}
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
                  {form.areas_ids.includes(areas.find(a => a.nombre.toLowerCase() === 'gerontologia')?.id || -1) && (
                    <div className="mt-3 border border-violet-200 rounded-xl p-3 bg-violet-50">
                      <p className="text-xs font-semibold text-violet-700 mb-2">👴 Actividades de Gerontología que dará</p>
                      <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                        {actividadesGeronto.map(act => {
                          const seleccionada = form.actividades_geronto_ids.includes(act.id);
                          return (
                            <label key={act.id} className="flex items-center gap-2 cursor-pointer hover:bg-violet-100 p-1 rounded-lg transition-colors">
                              <input 
                                type="checkbox" 
                                checked={seleccionada}
                                onChange={() => {
                                  const nuevas = seleccionada
                                    ? form.actividades_geronto_ids.filter(id => id !== act.id)
                                    : [...form.actividades_geronto_ids, act.id];
                                  setForm({ ...form, actividades_geronto_ids: nuevas });
                                }}
                                className="rounded text-[#A000D1] focus:ring-[#A000D1] flex-shrink-0" 
                              />
                              <span className="text-sm truncate">{act.nombre}</span>
                              <span className="text-[10px] text-gray-400 ml-auto whitespace-nowrap">
                                {act.dia} · {act.hora_inicio?.slice(0, 5)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              {esNuevo && stepActual !== 'basico' ? (
                <button 
                  type="button" 
                  onClick={() => setStepActual(stepActual === 'profesional' ? 'basico' : 'profesional')}
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium"
                >
                  Anterior
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setModalUsuario(null)} 
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium"
                >
                  Cancelar
                </button>
              )}
              {esNuevo && stepActual !== 'asignaciones' ? (
                <button 
                  type="button" 
                  onClick={() => setStepActual(stepActual === 'basico' ? 'profesional' : 'asignaciones')}
                  className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-purple-200"
                >
                  Siguiente
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-purple-200"
                >
                  {esNuevo ? 'Crear usuario' : 'Guardar cambios'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ========== MODAL ÁREA ========== */}
      {modalArea !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <form onSubmit={guardarArea} className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-[#efedf0]">
            <div className="flex justify-between items-center mb-6">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-800">{esNuevoArea ? 'Nueva área' : 'Editar área'}</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {esNuevoArea ? 'Completa los datos del área' : 'Modifica los datos del área'}
                </p>
              </div>
              <button type="button" onClick={() => setModalArea(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all text-sm font-bold flex-shrink-0">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Nombre del área <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej. Fisioterapia" 
                  value={formArea.nombre} 
                  onChange={e => setFormArea({ ...formArea, nombre: e.target.value })} 
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Descripción <span className="text-gray-300 font-normal normal-case">(opcional)</span>
                </label>
                <textarea 
                  value={formArea.descripcion} 
                  onChange={e => setFormArea({ ...formArea, descripcion: e.target.value })} 
                  placeholder="Descripción breve del área..." 
                  rows={3} 
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all resize-none" 
                />
              </div>
              {!esNuevoArea && (
                <div 
                  onClick={() => setFormArea({ ...formArea, activo: !formArea.activo })} 
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    formArea.activo ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {formArea.activo ? 'Área activa' : 'Área inactiva'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {formArea.activo ? 'Visible y operativa' : 'Oculta del sistema'}
                    </p>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${
                    formArea.activo ? 'bg-[#A000D1]' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      formArea.activo ? 'left-5' : 'left-0.5'
                    }`} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setModalArea(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">Cancelar</button>
              <button type="submit" className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-purple-200">
                {esNuevoArea ? 'Crear área' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========== MODAL SERVICIO ========== */}
           {/* ========== MODAL SERVICIO (REDISEÑADO - 2 COLUMNAS) ========== */}
      {modalServicio !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <form onSubmit={guardarServicio} className="bg-white rounded-3xl p-5 sm:p-7 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#efedf0]">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{esNuevoServicio ? 'Nuevo servicio' : 'Editar servicio'}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {esNuevoServicio ? 'Completa los datos del servicio' : 'Modifica los datos del servicio'}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalServicio(null)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all text-lg font-bold flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Grid 2 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-stretch">
              {/* Columna izquierda */}
              <div className="space-y-4 flex flex-col">
                {/* Área */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Área <span className="text-red-500">*</span>
                  </label>
                  <select 
                    required 
                    value={formServicio.area_id} 
                    onChange={e => {
                      const nuevoAreaId = e.target.value;
                      setFormServicio({ ...formServicio, area_id: nuevoAreaId, seccion_id: '' });
                      cargarSeccionesParaServicio(nuevoAreaId);
                    }} 
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all bg-white"
                  >
                    <option value="">Selecciona un área</option>
                    {areas
                      .filter(a => a.nombre.toLowerCase() !== 'zumba' && a.nombre.toLowerCase() !== 'gerontologia' && a.activo)
                      .map(a => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                      ))
                    }
                  </select>
                </div>

                {/* Sección (si existe) */}
                {seccionesDisponiblesServicio.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      Sección <span className="text-red-500">*</span>
                    </label>
                    <div className="border border-gray-200 rounded-xl p-2 max-h-[120px] overflow-y-auto bg-gray-50/50">
                      {seccionesDisponiblesServicio.map(sec => (
                        <label key={sec.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="seccion_servicio"
                            required
                            checked={formServicio.seccion_id === sec.id}
                            onChange={() => setFormServicio({ ...formServicio, seccion_id: sec.id })}
                            className="text-[#A000D1] focus:ring-[#A000D1] flex-shrink-0 w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">{sec.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Descripción */}
                <div className="flex-1 flex flex-col min-h-0">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Descripción <span className="text-gray-300 font-normal normal-case">(opcional)</span>
                  </label>
                  <textarea
                    value={formServicio.descripcion}
                    onChange={e => setFormServicio({ ...formServicio, descripcion: e.target.value })}
                    placeholder="Breve descripción del servicio..."
                    className="w-full flex-1 min-h-[120px] border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all resize-none"
                  />
                </div>
              </div>

              {/* Columna derecha */}
              <div className="space-y-4">
                {/* Nombre del servicio */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Nombre del servicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formServicio.nombre}
                    onChange={e => setFormServicio({ ...formServicio, nombre: e.target.value })}
                    placeholder="Ej. Consulta psicológica"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                  />
                </div>

                {/* Costo y Duración */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Costo (Bs)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formServicio.costo} 
                      onChange={e => setFormServicio({ ...formServicio, costo: e.target.value })} 
                      placeholder="0.00" 
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Duración (min)</label>
                    <select
                      value={formServicio.duracion_min}
                      onChange={e => setFormServicio({ ...formServicio, duracion_min: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                    >
                      <option value="">Selecciona duración</option>
                      {[30, 60, 90, 120, 150, 180, 210, 240].map(min => (
                        <option key={min} value={min}>{min} min</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descuento / Promoción */}
                <div className="bg-violet-50/50 rounded-xl p-4 border border-violet-100">
                  <p className="text-xs font-semibold text-violet-700 mb-3 flex items-center gap-2">
                    🏷️ Descuento / promoción
                    <span className="text-gray-400 font-normal normal-case text-[10px]">(opcional)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Costo con descuento</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formServicio.costo_descuento} 
                        onChange={e => setFormServicio({ ...formServicio, costo_descuento: e.target.value })} 
                        placeholder="45.00" 
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all bg-white" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Descripción</label>
                      <input 
                        type="text" 
                        value={formServicio.descripcion_descuento} 
                        onChange={e => setFormServicio({ ...formServicio, descripcion_descuento: e.target.value })} 
                        placeholder="Promo primavera" 
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all bg-white" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle Activo - Ocupa todo el ancho */}
            {!esNuevoServicio && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div 
                  onClick={() => setFormServicio({ ...formServicio, activo: !formServicio.activo })} 
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    formServicio.activo ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {formServicio.activo ? '✅ Servicio activo' : '⛔ Servicio inactivo'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formServicio.activo ? 'Visible y disponible para reservas' : 'Oculto del sistema, no disponible'}
                    </p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
                    formServicio.activo ? 'bg-[#A000D1]' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      formServicio.activo ? 'left-6' : 'left-0.5'
                    }`} />
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setModalServicio(null)} 
                className="flex-1 border border-gray-200 rounded-xl py-3 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-purple-200 order-1 sm:order-2 flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                {esNuevoServicio ? 'Crear servicio' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========== MODAL HORARIO ZUMBA ========== */}
      {modalHorarioZumba !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <form onSubmit={guardarHorarioZumba} className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl border border-[#efedf0]">
            <div className="flex justify-between items-center mb-6">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-800">{esNuevoHorario ? 'Nuevo horario Zumba' : 'Editar horario'}</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {esNuevoHorario ? 'Completa los datos del horario' : 'Modifica los datos del horario'}
                </p>
              </div>
              <button type="button" onClick={() => setModalHorarioZumba(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all text-sm font-bold flex-shrink-0">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Día <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formHorario.dia} 
                  onChange={e => setFormHorario({ ...formHorario, dia: e.target.value })} 
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                >
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Hora inicio <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="time" 
                    value={formHorario.hora_inicio} 
                    onChange={e => setFormHorario({ ...formHorario, hora_inicio: e.target.value })} 
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Hora fin <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="time" 
                    value={formHorario.hora_fin} 
                    onChange={e => setFormHorario({ ...formHorario, hora_fin: e.target.value })} 
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                  />
                </div>
              </div>
              {!esNuevoHorario && (
                <div 
                  onClick={() => setFormHorario({ ...formHorario, activo: !formHorario.activo })} 
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    formHorario.activo ? 'bg-violet-50 border-violet-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {formHorario.activo ? 'Horario activo' : 'Horario inactivo'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {formHorario.activo ? 'Visible y disponible' : 'Oculto del sistema'}
                    </p>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${
                    formHorario.activo ? 'bg-[#A000D1]' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      formHorario.activo ? 'left-5' : 'left-0.5'
                    }`} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setModalHorarioZumba(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">Cancelar</button>
              <button type="submit" className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-purple-200">
                {esNuevoHorario ? 'Crear horario' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========== MODAL ACTIVIDAD GERONTO ========== */}
      {modalActividad !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <form onSubmit={guardarActividad} className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-[#efedf0]">
            <div className="flex justify-between items-center mb-6">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-800">{esNuevaActividad ? 'Nueva actividad' : 'Editar actividad'}</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {esNuevaActividad ? 'Completa los datos de la actividad' : 'Modifica los datos de la actividad'}
                </p>
              </div>
              <button type="button" onClick={() => setModalActividad(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all text-sm font-bold flex-shrink-0">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  value={formActividad.nombre} 
                  onChange={e => setFormActividad({ ...formActividad, nombre: e.target.value })} 
                  placeholder="Ej. Yoga para adultos mayores" 
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Día <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formActividad.dia} 
                  onChange={e => setFormActividad({ ...formActividad, dia: e.target.value })} 
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                >
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Hora inicio <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="time" 
                    value={formActividad.hora_inicio} 
                    onChange={e => setFormActividad({ ...formActividad, hora_inicio: e.target.value })} 
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Hora fin <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="time" 
                    value={formActividad.hora_fin} 
                    onChange={e => setFormActividad({ ...formActividad, hora_fin: e.target.value })} 
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Precio (Bs) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  required
                  value={formActividad.precio} 
                  onChange={e => setFormActividad({ ...formActividad, precio: Number(e.target.value) })} 
                  placeholder="75" 
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                />
              </div>
              {!esNuevaActividad && (
                <div 
                  onClick={() => setFormActividad({ ...formActividad, activo: !formActividad.activo })} 
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    formActividad.activo ? 'bg-violet-50 border-violet-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {formActividad.activo ? 'Actividad activa' : 'Actividad inactiva'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {formActividad.activo ? 'Visible y disponible' : 'Oculta del sistema'}
                    </p>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${
                    formActividad.activo ? 'bg-[#A000D1]' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      formActividad.activo ? 'left-5' : 'left-0.5'
                    }`} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setModalActividad(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">Cancelar</button>
              <button type="submit" className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-purple-200">
                {esNuevaActividad ? 'Crear actividad' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========== MODAL HORARIOS PROFESIONAL (REDISEÑADO - MÁS AMPLIO Y ORDENADO) ========== */}
      {modalHorariosProfesional !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#efedf0]">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <User size={24} className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 truncate">{modalHorariosProfesional.nombre}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      {modalHorariosProfesional.area_nombre || 'Sin área principal'} · 
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                        {modalHorariosProfesional.areas?.length || 0} áreas asignadas
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <button 
  onClick={() => {
    setModalHorariosProfesional(null);
    cargarTodosHorarios();
  }} 
  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all text-lg font-bold flex-shrink-0"
>
  ✕
</button>
            </div>

            {/* Información del profesional */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
              <div>
                <p className="text-xs text-gray-500 font-medium">Especialidad</p>
                <p className="text-sm text-gray-800 font-semibold">{modalHorariosProfesional.especialidad || 'No especificada'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                <p className="text-sm text-gray-800">{modalHorariosProfesional.telefono || 'No registrado'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Email</p>
                <p className="text-sm text-gray-800 truncate">{modalHorariosProfesional.email || 'No registrado'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Estado</p>
                <span className={`text-xs px-2 py-1 rounded-full ${modalHorariosProfesional.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {modalHorariosProfesional.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {/* Áreas con horarios */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar size={18} className="text-violet-600" />
                  Horarios por área
                </h4>
                <span className="text-xs text-gray-400">
                  {horariosProfesional.length} horarios totales
                </span>
              </div>

              {modalHorariosProfesional.areas?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modalHorariosProfesional.areas.map((area: any) => {
                    const horariosArea = horariosProfesional.filter(h => Number(h.area_id) === Number(area.id));
                    return (
                      <div key={area.id} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="bg-gradient-to-r from-violet-50 to-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-violet-600" />
                            <span className="font-semibold text-gray-800 text-sm">{area.nombre}</span>
                          </div>
                          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                            {horariosArea.length} {horariosArea.length === 1 ? 'horario' : 'horarios'}
                          </span>
                        </div>
                        <div className="p-3 space-y-2 max-h-[200px] overflow-y-auto">
                          {horariosArea.length === 0 ? (
                            <div className="text-center py-6">
                              <ClockIcon size={24} className="text-gray-300 mx-auto mb-1" />
                              <p className="text-xs text-gray-400">Sin horarios para esta área</p>
                              <p className="text-[10px] text-gray-300">Agrega uno desde abajo</p>
                            </div>
                          ) : (
                            horariosArea.map((h: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-violet-50 transition-all group">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <span className="font-medium text-sm text-gray-700 w-16 flex-shrink-0">{h.dia}</span>
                                  <span className="text-sm text-gray-600">
                                    {h.hora_inicio?.slice(0, 5)} - {h.hora_fin?.slice(0, 5)}
                                  </span>
                                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                    {h.slot_minutos || 60} min
                                  </span>
                                </div>
                                <button 
                                  onClick={() => {
                                    const realIndex = horariosProfesional.indexOf(h);
                                    eliminarHorarioProfesionalConArea(realIndex);
                                  }} 
                                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-all opacity-0 group-hover:opacity-100 hover:bg-red-50 px-2 py-1 rounded-lg flex-shrink-0"
                                >
                                  Eliminar
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <AlertCircle size={32} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Este profesional no tiene áreas asignadas</p>
                  <p className="text-xs text-gray-400 mt-1">Asigna áreas desde el perfil del usuario para poder gestionar horarios</p>
                </div>
              )}
            </div>

            {/* Formulario para agregar horario */}
            <div className="border-t border-gray-200 pt-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                  <Plus size={16} className="text-violet-600" />
                </div>
                <h4 className="font-semibold text-gray-700">Agregar nuevo horario</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs text-gray-500 block mb-1 font-medium">Área <span className="text-red-500">*</span></label>
                  <select
                    value={nuevoHorario.area_id}
                    onChange={e => setNuevoHorario({ ...nuevoHorario, area_id: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                  >
                    <option value="">Seleccionar</option>
                    {modalHorariosProfesional.areas?.map((area: any) => (
                      <option key={area.id} value={area.id}>{area.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-medium">Día</label>
                  <select 
                    value={nuevoHorario.dia} 
                    onChange={e => setNuevoHorario({ ...nuevoHorario, dia: e.target.value })} 
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                  >
                    {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-medium">Hora inicio</label>
                  <input 
                    type="time" 
                    value={nuevoHorario.hora_inicio} 
                    onChange={e => setNuevoHorario({ ...nuevoHorario, hora_inicio: e.target.value })} 
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-medium">Hora fin</label>
                  <input 
                    type="time" 
                    value={nuevoHorario.hora_fin} 
                    onChange={e => setNuevoHorario({ ...nuevoHorario, hora_fin: e.target.value })} 
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-medium">Slot</label>
                  <select 
                    value={nuevoHorario.slot_minutos} 
                    onChange={e => setNuevoHorario({ ...nuevoHorario, slot_minutos: Number(e.target.value) })} 
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all"
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>
              
              <button 
                onClick={agregarHorarioProfesionalConArea} 
                disabled={!nuevoHorario.area_id}
                className={`w-full mt-3 rounded-xl py-3 text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${
                  nuevoHorario.area_id 
                    ? 'bg-[#A000D1] hover:bg-[#8800b3] text-white shadow-purple-200' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus size={16} />
                Agregar horario a esta área
              </button>
              {!nuevoHorario.area_id && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> Selecciona un área primero
                </p>
              )}
            </div>

            <button 
  onClick={() => {
    setModalHorariosProfesional(null);
    cargarTodosHorarios();
  }} 
  className="w-full mt-5 border border-gray-200 rounded-xl py-3 text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium hover:border-gray-300"
>
  Cerrar
</button>
          </div>
        </div>
      )}
    </div>
  );
}