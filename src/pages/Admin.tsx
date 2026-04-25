import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getProfesionales,
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  getAuditLog,
  getAreas,
  crearArea,
  actualizarArea,
  eliminarArea,
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
} from '../services/admin.service';

type Tab = 'personal' | 'usuarios' | 'areas' | 'servicios' | 'auditoria';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

export default function Admin() {
  const { usuario } = useAuth();
  const [tabActiva, setTabActiva] = useState<Tab>('personal');
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [horariosZumba, setHorariosZumba] = useState<any[]>([]);
  const [actividadesGeronto, setActividadesGeronto] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalUsuario, setModalUsuario] = useState<any>(null);
  const [modalArea, setModalArea] = useState<any>(null);
  const [modalServicio, setModalServicio] = useState<any>(null);
  const [modalHorarioZumba, setModalHorarioZumba] = useState<any>(null);
  const [modalActividad, setModalActividad] = useState<any>(null);
  const [esNuevo, setEsNuevo] = useState(true);
  const [esNuevoArea, setEsNuevoArea] = useState(true);
  const [esNuevoServicio, setEsNuevoServicio] = useState(true);
  const [esNuevoHorario, setEsNuevoHorario] = useState(true);
  const [esNuevaActividad, setEsNuevaActividad] = useState(true);
  const [subTabServicios, setSubTabServicios] = useState<'servicios' | 'zumba' | 'geronto'>('servicios');
const [modalHorariosProfesional, setModalHorariosProfesional] = useState<any>(null);
const [horariosProfesional, setHorariosProfesional] = useState<any[]>([]);
const [cargandoHorarios, setCargandoHorarios] = useState(false);
const [nuevoHorario, setNuevoHorario] = useState({ dia: 'Lunes', hora_inicio: '08:00', hora_fin: '17:00' });
  const [form, setForm] = useState({
    nombre: '', usuario: '', password: '', email: '',
    telefono: '', role_id: 3, area_id: '', especialidad: '',
    sueldo: '', contrato: 'indefinido', fecha_nac: '',
    fecha_ingreso: '', activo: true,
  });

  const [formArea, setFormArea] = useState({
    nombre: '', emoji: '🏥', color: 'emerald', descripcion: '', activo: true,
  });

  const [formServicio, setFormServicio] = useState({
    area_id: '', nombre: '', descripcion: '', costo: '', duracion_min: '', activo: true,
  });

  const [formHorario, setFormHorario] = useState({
    dia: 'Lunes', hora_inicio: '08:00', hora_fin: '09:00', activo: true,
  });

  const [formActividad, setFormActividad] = useState({
    nombre: '', emoji: '🧓', dia: 'Lunes', hora_inicio: '15:00',
    hora_fin: '16:00', color: 'emerald', precio: 75, activo: true,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

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

  function abrirModalNuevo() {
    setEsNuevo(true);
    setForm({ nombre: '', usuario: '', password: '', email: '', telefono: '', role_id: 3, area_id: '', especialidad: '', sueldo: '', contrato: 'indefinido', fecha_nac: '', fecha_ingreso: '', activo: true });
    setModalUsuario({});
  }

  function abrirModalEditar(u: any) {
    setEsNuevo(false);
    setForm({ nombre: u.nombre || '', usuario: u.usuario || '', password: '', email: u.email || '', telefono: u.telefono || '', role_id: u.role_id || 3, area_id: u.area_id || '', especialidad: u.especialidad || '', sueldo: u.sueldo || '', contrato: u.contrato || 'indefinido', fecha_nac: u.fecha_nac ? u.fecha_nac.split('T')[0] : '', fecha_ingreso: u.fecha_ingreso ? u.fecha_ingreso.split('T')[0] : '', activo: u.activo });
    setModalUsuario(u);
  }

  function abrirModalNuevoArea() {
    setEsNuevoArea(true);
    setFormArea({ nombre: '', emoji: '🏥', color: 'emerald', descripcion: '', activo: true });
    setModalArea({});
  }

  function abrirModalEditarArea(a: any) {
    setEsNuevoArea(false);
    setFormArea({ nombre: a.nombre || '', emoji: a.emoji || '🏥', color: a.color || 'emerald', descripcion: a.descripcion || '', activo: a.activo });
    setModalArea(a);
  }

  function abrirModalNuevoServicio() {
    setEsNuevoServicio(true);
    setFormServicio({ area_id: '', nombre: '', descripcion: '', costo: '', duracion_min: '', activo: true });
    setModalServicio({});
  }

  function abrirModalEditarServicio(s: any) {
    setEsNuevoServicio(false);
    setFormServicio({ area_id: s.area_id || '', nombre: s.nombre || '', descripcion: s.descripcion || '', costo: s.costo || '', duracion_min: s.duracion_min || '', activo: s.activo });
    setModalServicio(s);
  }

  function abrirModalNuevoHorario() {
    setEsNuevoHorario(true);
    setFormHorario({ dia: 'Lunes', hora_inicio: '08:00', hora_fin: '09:00', activo: true });
    setModalHorarioZumba({});
  }

  function abrirModalEditarHorario(h: any) {
    setEsNuevoHorario(false);
    setFormHorario({ dia: h.dia, hora_inicio: h.hora_inicio.slice(0,5), hora_fin: h.hora_fin.slice(0,5), activo: h.activo });
    setModalHorarioZumba(h);
  }

  function abrirModalNuevaActividad() {
    setEsNuevaActividad(true);
    setFormActividad({ nombre: '', emoji: '🧓', dia: 'Lunes', hora_inicio: '15:00', hora_fin: '16:00', color: 'emerald', precio: 75, activo: true });
    setModalActividad({});
  }

  function abrirModalEditarActividad(a: any) {
    setEsNuevaActividad(false);
    setFormActividad({ nombre: a.nombre || '', emoji: a.emoji || '🧓', dia: a.dia || 'Lunes', hora_inicio: a.hora_inicio?.slice(0,5) || '15:00', hora_fin: a.hora_fin?.slice(0,5) || '16:00', color: a.color || 'emerald', precio: a.precio || 75, activo: a.activo });
    setModalActividad(a);
  }

  async function guardarUsuario(e: React.FormEvent) {
    e.preventDefault();
    try {
      const datos: any = { ...form };
      if (!datos.password) delete datos.password;
      if (!datos.area_id) datos.area_id = null;
      if (!datos.sueldo) datos.sueldo = null;
      if (!datos.fecha_nac) datos.fecha_nac = null;
      if (!datos.fecha_ingreso) datos.fecha_ingreso = null;
      esNuevo ? await crearUsuario(datos) : await actualizarUsuario(modalUsuario.id, datos);
      setModalUsuario(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al guardar');
    }
  }

  async function guardarArea(e: React.FormEvent) {
    e.preventDefault();
    try {
      esNuevoArea ? await crearArea(formArea) : await actualizarArea(modalArea.id, formArea);
      setModalArea(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al guardar area');
    }
  }

  async function guardarServicio(e: React.FormEvent) {
    e.preventDefault();
    try {
      const datos = { ...formServicio, costo: formServicio.costo || null, duracion_min: formServicio.duracion_min || null };
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

  async function handleEliminarArea(id: number) {
    if (!confirm('Seguro que deseas eliminar esta area?')) return;
    try {
      await eliminarArea(id);
      await cargarDatos();
    } catch (err: any) { alert(err.response?.data?.mensaje || 'Error al eliminar'); }
  }

  async function handleEliminarServicio(id: number) {
    if (!confirm('Seguro que deseas eliminar este servicio?')) return;
    try {
      await eliminarServicio(id);
      await cargarDatos();
    } catch (err: any) { alert(err.response?.data?.mensaje || 'Error al eliminar'); }
  }

  async function handleEliminarHorario(id: number) {
    if (!confirm('Seguro que deseas eliminar este horario?')) return;
    try {
      await eliminarHorarioZumba(id);
      await cargarDatos();
    } catch (err: any) { alert(err.response?.data?.mensaje || 'Error al eliminar'); }
  }

  async function handleEliminarActividad(id: number) {
    if (!confirm('Seguro que deseas eliminar esta actividad?')) return;
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
    if (!confirm('Seguro que deseas eliminar este usuario?')) return;
    try {
      await eliminarUsuario(id);
      await cargarDatos();
    } catch (err: any) { alert(err.response?.data?.mensaje || 'Error al eliminar'); }
  }

  if (usuario?.rol !== 'administrador' && usuario?.rol !== 'supervisor') {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-600 font-medium">No tienes acceso a esta seccion</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'personal',  label: 'Personal',  emoji: '👨‍⚕️' },
    { id: 'usuarios',  label: 'Usuarios',  emoji: '👤'   },
    { id: 'areas',     label: 'Areas',     emoji: '🏥'   },
    { id: 'servicios', label: 'Servicios', emoji: '🔧'   },
    { id: 'auditoria', label: 'Auditoria', emoji: '📋'   },
  ];

  const colores = ['emerald', 'blue', 'purple', 'pink', 'red', 'orange', 'yellow', 'green'];

  const serviciosPorArea = areas.map(a => ({
    ...a,
    servicios: servicios.filter(s => s.area_id === a.id),
  }));
async function abrirModalHorariosProfesional(p: any) {
  setModalHorariosProfesional(p);
  setCargandoHorarios(true);
  try {
    const data = await getHorarios(p.id);
    setHorariosProfesional(data);
  } catch (err) {
    console.error(err);
  } finally {
    setCargandoHorarios(false);
  }
}

async function agregarHorarioProfesional() {
  if (!modalHorariosProfesional) return;
  try {
    const horariosNormalizados = horariosProfesional.map(h => ({
      dia: h.dia,
      hora_inicio: h.hora_inicio.slice(0, 5),
      hora_fin: h.hora_fin.slice(0, 5),
    }));
    const nuevos = [...horariosNormalizados, {
      dia: nuevoHorario.dia,
      hora_inicio: nuevoHorario.hora_inicio,
      hora_fin: nuevoHorario.hora_fin,
    }];
    await guardarHorarios(modalHorariosProfesional.id, nuevos);
    const data = await getHorarios(modalHorariosProfesional.id);
    setHorariosProfesional(data);
    setNuevoHorario({ dia: 'Lunes', hora_inicio: '08:00', hora_fin: '17:00' });
  } catch (err) {
    console.error(err);
    alert('Error al agregar horario');
  }
}

async function eliminarHorarioProfesional(index: number) {
  if (!modalHorariosProfesional) return;
  try {
    const nuevos = horariosProfesional
      .filter((_, i) => i !== index)
      .map(h => ({
        dia: h.dia,
        hora_inicio: h.hora_inicio.slice(0, 5),
        hora_fin: h.hora_fin.slice(0, 5),
      }));
    await guardarHorarios(modalHorariosProfesional.id, nuevos);
    const data = await getHorarios(modalHorariosProfesional.id);
    setHorariosProfesional(data);
  } catch (err) {
    console.error(err);
    alert('Error al eliminar horario');
  }
}
  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800">Administracion</h1>
        {tabActiva === 'usuarios' && (
          <button onClick={abrirModalNuevo} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700">+ Nuevo usuario</button>
        )}
        {tabActiva === 'areas' && (
          <button onClick={abrirModalNuevoArea} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700">+ Nueva area</button>
        )}
        {tabActiva === 'servicios' && subTabServicios === 'servicios' && (
          <button onClick={abrirModalNuevoServicio} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700">+ Nuevo servicio</button>
        )}
        {tabActiva === 'servicios' && subTabServicios === 'zumba' && (
          <button onClick={abrirModalNuevoHorario} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-700">+ Nuevo horario</button>
        )}
        {tabActiva === 'servicios' && subTabServicios === 'geronto' && (
          <button onClick={abrirModalNuevaActividad} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700">+ Nueva actividad</button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTabActiva(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tabActiva === t.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : (
        <>
          {tabActiva === 'personal' && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">Personal de la consultora</h2>
                <span className="text-sm text-gray-500">{profesionales.length} profesionales</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-600">Nombre</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Area</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Especialidad</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Telefono</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Cumpleanos</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Edad</th>
                      <th className="text-right p-3 font-semibold text-gray-600">Sueldo</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Contrato</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Ingreso</th>
                      <th className="text-center p-3 font-semibold text-gray-600">Horarios</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {profesionales.map(p => {
                      const hoy = new Date();
                      const cumple = p.cumple_dia_mes;
                      const esCumple = cumple === `${String(hoy.getDate()).padStart(2,'0')}/${String(hoy.getMonth()+1).padStart(2,'0')}`;
                      return (
                        <tr key={p.id} className={`hover:bg-gray-50 ${esCumple ? 'bg-yellow-50' : ''}`}>
                          <td className="p-3 font-medium text-gray-800">{esCumple && <span className="mr-1">🎂</span>}{p.nombre}</td>
                          <td className="p-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p.area_emoji} {p.area_nombre || 'Sin area'}</span></td>
                          <td className="p-3 text-gray-600">{p.especialidad || '-'}</td>
                          <td className="p-3 text-gray-600">{p.telefono || '-'}</td>
                          <td className="p-3 text-gray-600">{cumple || '-'}</td>
                          <td className="p-3 text-center text-gray-600">{p.edad || '-'}</td>
                          <td className="p-3 text-right text-green-600 font-medium">{p.sueldo ? `Bs ${Number(p.sueldo).toFixed(0)}` : '-'}</td>
                          <td className="p-3 text-gray-600 capitalize">{p.contrato || '-'}</td>
                          <td className="p-3 text-gray-600">{p.fecha_ingreso ? new Date(p.fecha_ingreso).toLocaleDateString('es') : '-'}</td>
                        <td className="p-3 text-center">
  <button
    onClick={() => abrirModalHorariosProfesional(p)}
    className="text-xs text-emerald-600 hover:text-emerald-800 font-medium border border-emerald-300 px-2 py-1 rounded-lg"
  >
    Ver horarios
  </button>
</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tabActiva === 'usuarios' && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-600">Nombre</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Usuario</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Rol</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Area</th>
                      <th className="text-center p-3 font-semibold text-gray-600">Estado</th>
                      <th className="text-center p-3 font-semibold text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {usuarios.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-800">{u.nombre}</td>
                        <td className="p-3 text-gray-600 font-mono text-xs">{u.usuario}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.rol === 'administrador' ? 'bg-red-100 text-red-700' : u.rol === 'supervisor' ? 'bg-purple-100 text-purple-700' : u.rol === 'profesional' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {u.rol}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600">{u.area_emoji} {u.area_nombre || '-'}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => toggleActivo(u)} className={`text-xs px-2 py-0.5 rounded-full ${u.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => abrirModalEditar(u)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                            {usuario?.rol === 'administrador' && u.id !== usuario.id && (
                              <button onClick={() => handleEliminar(u.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tabActiva === 'areas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areas.map(a => (
                <div key={a.id} className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{a.emoji}</span>
                      <div>
                        <h3 className="font-bold text-gray-800">{a.nombre}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {a.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => abrirModalEditarArea(a)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                      <button onClick={() => handleEliminarArea(a.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                    </div>
                  </div>
                  {a.descripcion && <p className="text-xs text-gray-500 mt-2">{a.descripcion}</p>}
                </div>
              ))}
            </div>
          )}

          {tabActiva === 'servicios' && (
            <div>
              <div className="flex gap-2 mb-4">
                {[
                  { id: 'servicios', label: 'Psicologia y Fisioterapia' },
                  { id: 'zumba',     label: 'Horarios Zumba' },
                  { id: 'geronto',   label: 'Actividades Gerontologia' },
                ].map(st => (
                  <button key={st.id} onClick={() => setSubTabServicios(st.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      subTabServicios === st.id ? 'bg-emerald-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
                    }`}>
                    {st.label}
                  </button>
                ))}
              </div>

              {subTabServicios === 'servicios' && (
                <div className="space-y-4">
                  {serviciosPorArea.filter(a => 
  a.nombre.toLowerCase() !== 'zumba' && 
  a.nombre.toLowerCase() !== 'gerontologia' &&
  a.activo === true
).map(area => (
                    <div key={area.id} className="bg-white rounded-xl border overflow-hidden">
                      <div className="p-3 border-b bg-gray-50 flex items-center gap-2">
                        <span className="text-xl">{area.emoji}</span>
                        <h3 className="font-semibold text-gray-800">{area.nombre}</h3>
                        <span className="text-xs text-gray-400">{area.servicios.length} servicios</span>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left p-3 font-semibold text-gray-600">Nombre</th>
                            <th className="text-left p-3 font-semibold text-gray-600">Descripcion</th>
                            <th className="text-right p-3 font-semibold text-gray-600">Costo (Bs)</th>
                            <th className="text-center p-3 font-semibold text-gray-600">Duracion</th>
                            <th className="text-center p-3 font-semibold text-gray-600">Estado</th>
                            <th className="text-center p-3 font-semibold text-gray-600">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {area.servicios.map((s: any) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-800">{s.nombre}</td>
                              <td className="p-3 text-gray-500 text-xs">{s.descripcion || '-'}</td>
                              <td className="p-3 text-right text-green-600 font-medium">{s.costo ? `Bs ${s.costo}` : '-'}</td>
                              <td className="p-3 text-center text-gray-600">{s.duracion_min ? `${s.duracion_min} min` : '-'}</td>
                              <td className="p-3 text-center">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                  {s.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button onClick={() => abrirModalEditarServicio(s)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                                  <button onClick={() => handleEliminarServicio(s.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {subTabServicios === 'zumba' && (
                <div className="bg-white rounded-xl border overflow-hidden">
                  <div className="p-3 border-b bg-gray-50 flex items-center gap-2">
                    <span className="text-xl">💃</span>
                    <h3 className="font-semibold text-gray-800">Horarios de Zumba</h3>
                    <span className="text-xs text-gray-400">{horariosZumba.length} horarios</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-600">Dia</th>
                        <th className="text-left p-3 font-semibold text-gray-600">Hora inicio</th>
                        <th className="text-left p-3 font-semibold text-gray-600">Hora fin</th>
                        <th className="text-center p-3 font-semibold text-gray-600">Estado</th>
                        <th className="text-center p-3 font-semibold text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {horariosZumba.map(h => (
                        <tr key={h.id} className="hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-800">{h.dia}</td>
                          <td className="p-3 text-gray-600">{h.hora_inicio?.slice(0,5)}</td>
                          <td className="p-3 text-gray-600">{h.hora_fin?.slice(0,5)}</td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${h.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {h.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => abrirModalEditarHorario(h)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                              <button onClick={() => handleEliminarHorario(h.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {subTabServicios === 'geronto' && (
                <div className="bg-white rounded-xl border overflow-hidden">
                  <div className="p-3 border-b bg-gray-50 flex items-center gap-2">
                    <span className="text-xl">👴</span>
                    <h3 className="font-semibold text-gray-800">Actividades de Gerontologia</h3>
                    <span className="text-xs text-gray-400">{actividadesGeronto.length} actividades</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-600">Nombre</th>
                        <th className="text-left p-3 font-semibold text-gray-600">Dia</th>
                        <th className="text-left p-3 font-semibold text-gray-600">Horario</th>
                        <th className="text-right p-3 font-semibold text-gray-600">Precio (Bs)</th>
                        <th className="text-center p-3 font-semibold text-gray-600">Estado</th>
                        <th className="text-center p-3 font-semibold text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {actividadesGeronto.map(a => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-800">{a.emoji} {a.nombre}</td>
                          <td className="p-3 text-gray-600">{a.dia}</td>
                          <td className="p-3 text-gray-600">{a.hora_inicio?.slice(0,5)} - {a.hora_fin?.slice(0,5)}</td>
                          <td className="p-3 text-right text-green-600 font-medium">Bs {a.precio}</td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {a.activo ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => abrirModalEditarActividad(a)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                              <button onClick={() => handleEliminarActividad(a.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tabActiva === 'auditoria' && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-800">Registro de actividad</h2>
                <p className="text-xs text-gray-500 mt-0.5">Quien hizo que y cuando</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-600">Fecha</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Usuario</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Accion</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Tabla</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-500 text-xs">{new Date(log.created_at).toLocaleString('es')}</td>
                        <td className="p-3 font-medium text-gray-800">{log.usuario_nombre || log.user_nombre}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.accion === 'crear' ? 'bg-emerald-100 text-emerald-700' : log.accion === 'editar' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                            {log.accion}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 font-mono text-xs">{log.tabla}</td>
                        <td className="p-3 text-gray-500 text-xs max-w-xs truncate">
                          {log.datos_despues ? JSON.stringify(log.datos_despues).slice(0, 80) + '...' : 'Eliminado'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {modalUsuario !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <form onSubmit={guardarUsuario} className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{esNuevo ? 'Nuevo usuario' : 'Editar usuario'}</h3>
              <button type="button" onClick={() => setModalUsuario(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500">Nombre completo</label><input type="text" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500">Usuario (login)</label><input type="text" required={esNuevo} value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" disabled={!esNuevo} /></div>
                <div><label className="text-xs text-gray-500">{esNuevo ? 'Password' : 'Nueva password (opcional)'}</label><input type="password" required={esNuevo} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500">Rol</label>
                  <select value={form.role_id} onChange={e => setForm({ ...form, role_id: Number(e.target.value) })} className="w-full border rounded-lg p-2 text-sm mt-1">
                    <option value={1}>Administrador</option><option value={2}>Supervisor</option><option value={3}>Profesional</option><option value={4}>Recepcionista</option>
                  </select>
                </div>
                <div><label className="text-xs text-gray-500">Area</label>
                  <select value={form.area_id} onChange={e => setForm({ ...form, area_id: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1">
                    <option value="">Sin area</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
                <div><label className="text-xs text-gray-500">Telefono</label><input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              </div>
              <div><label className="text-xs text-gray-500">Especialidad</label><input type="text" value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500">Sueldo Bs</label><input type="number" value={form.sueldo} onChange={e => setForm({ ...form, sueldo: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
                <div><label className="text-xs text-gray-500">Contrato</label>
                  <select value={form.contrato} onChange={e => setForm({ ...form, contrato: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1">
                    <option value="indefinido">Indefinido</option><option value="temporal">Temporal</option><option value="practicante">Practicante</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500">Fecha nacimiento</label><input type="date" value={form.fecha_nac} onChange={e => setForm({ ...form, fecha_nac: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
                <div><label className="text-xs text-gray-500">Fecha ingreso</label><input type="date" value={form.fecha_ingreso} onChange={e => setForm({ ...form, fecha_ingreso: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              </div>
              {!esNuevo && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="activo" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} className="rounded" />
                  <label htmlFor="activo" className="text-sm text-gray-600">Usuario activo</label>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setModalUsuario(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
              <button type="submit" className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm hover:bg-emerald-700">{esNuevo ? 'Crear usuario' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}

      {modalArea !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <form onSubmit={guardarArea} className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{esNuevoArea ? 'Nueva area' : 'Editar area'}</h3>
              <button type="button" onClick={() => setModalArea(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500">Nombre del area</label><input type="text" required value={formArea.nombre} onChange={e => setFormArea({ ...formArea, nombre: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500">Emoji</label><input type="text" value={formArea.emoji} onChange={e => setFormArea({ ...formArea, emoji: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
                <div><label className="text-xs text-gray-500">Color</label>
                  <select value={formArea.color} onChange={e => setFormArea({ ...formArea, color: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1">
                    {colores.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs text-gray-500">Descripcion</label><textarea value={formArea.descripcion} onChange={e => setFormArea({ ...formArea, descripcion: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" rows={2} /></div>
              {!esNuevoArea && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="activo-area" checked={formArea.activo} onChange={e => setFormArea({ ...formArea, activo: e.target.checked })} className="rounded" />
                  <label htmlFor="activo-area" className="text-sm text-gray-600">Area activa</label>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setModalArea(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
              <button type="submit" className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm hover:bg-emerald-700">{esNuevoArea ? 'Crear area' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}

      {modalServicio !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <form onSubmit={guardarServicio} className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{esNuevoServicio ? 'Nuevo servicio' : 'Editar servicio'}</h3>
              <button type="button" onClick={() => setModalServicio(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500">Area</label>
                <select required value={formServicio.area_id} onChange={e => setFormServicio({ ...formServicio, area_id: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1">
                  <option value="">Selecciona un area</option>
                  {areas.filter(a => a.nombre.toLowerCase() !== 'zumba' && a.nombre.toLowerCase() !== 'gerontologia').map(a => <option key={a.id} value={a.id}>{a.emoji} {a.nombre}</option>)}

                </select>
              </div>
              <div><label className="text-xs text-gray-500">Nombre del servicio</label><input type="text" required value={formServicio.nombre} onChange={e => setFormServicio({ ...formServicio, nombre: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-gray-500">Descripcion (opcional)</label><input type="text" value={formServicio.descripcion} onChange={e => setFormServicio({ ...formServicio, descripcion: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500">Costo (Bs)</label><input type="number" value={formServicio.costo} onChange={e => setFormServicio({ ...formServicio, costo: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
                <div><label className="text-xs text-gray-500">Duracion (min)</label><input type="number" value={formServicio.duracion_min} onChange={e => setFormServicio({ ...formServicio, duracion_min: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              </div>
              {!esNuevoServicio && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="activo-serv" checked={formServicio.activo} onChange={e => setFormServicio({ ...formServicio, activo: e.target.checked })} className="rounded" />
                  <label htmlFor="activo-serv" className="text-sm text-gray-600">Servicio activo</label>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setModalServicio(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
              <button type="submit" className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm hover:bg-emerald-700">{esNuevoServicio ? 'Crear servicio' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}

      {modalHorarioZumba !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <form onSubmit={guardarHorarioZumba} className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{esNuevoHorario ? 'Nuevo horario Zumba' : 'Editar horario'}</h3>
              <button type="button" onClick={() => setModalHorarioZumba(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500">Dia</label>
                <select value={formHorario.dia} onChange={e => setFormHorario({ ...formHorario, dia: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1">
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500">Hora inicio</label><input type="time" value={formHorario.hora_inicio} onChange={e => setFormHorario({ ...formHorario, hora_inicio: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
                <div><label className="text-xs text-gray-500">Hora fin</label><input type="time" value={formHorario.hora_fin} onChange={e => setFormHorario({ ...formHorario, hora_fin: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              </div>
              {!esNuevoHorario && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formHorario.activo} onChange={e => setFormHorario({ ...formHorario, activo: e.target.checked })} className="rounded" />
                  <label className="text-sm text-gray-600">Horario activo</label>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setModalHorarioZumba(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
              <button type="submit" className="flex-1 bg-pink-600 text-white rounded-lg py-2 text-sm hover:bg-pink-700">{esNuevoHorario ? 'Crear horario' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}

      {modalActividad !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <form onSubmit={guardarActividad} className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{esNuevaActividad ? 'Nueva actividad' : 'Editar actividad'}</h3>
              <button type="button" onClick={() => setModalActividad(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500">Nombre</label><input type="text" required value={formActividad.nombre} onChange={e => setFormActividad({ ...formActividad, nombre: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500">Emoji</label><input type="text" value={formActividad.emoji} onChange={e => setFormActividad({ ...formActividad, emoji: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
                <div><label className="text-xs text-gray-500">Dia</label>
                  <select value={formActividad.dia} onChange={e => setFormActividad({ ...formActividad, dia: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1">
                    {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500">Hora inicio</label><input type="time" value={formActividad.hora_inicio} onChange={e => setFormActividad({ ...formActividad, hora_inicio: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
                <div><label className="text-xs text-gray-500">Hora fin</label><input type="time" value={formActividad.hora_fin} onChange={e => setFormActividad({ ...formActividad, hora_fin: e.target.value })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              </div>
              <div><label className="text-xs text-gray-500">Precio (Bs)</label><input type="number" value={formActividad.precio} onChange={e => setFormActividad({ ...formActividad, precio: Number(e.target.value) })} className="w-full border rounded-lg p-2 text-sm mt-1" /></div>
              {!esNuevaActividad && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formActividad.activo} onChange={e => setFormActividad({ ...formActividad, activo: e.target.checked })} className="rounded" />
                  <label className="text-sm text-gray-600">Actividad activa</label>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setModalActividad(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
              <button type="submit" className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm hover:bg-emerald-700">{esNuevaActividad ? 'Crear actividad' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}
      {modalHorariosProfesional !== null && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
    <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold">{modalHorariosProfesional.nombre}</h3>
          <p className="text-xs text-gray-500">{modalHorariosProfesional.area_emoji} {modalHorariosProfesional.area_nombre} - Horarios de atencion</p>
        </div>
        <button onClick={() => setModalHorariosProfesional(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
      </div>

      {cargandoHorarios ? (
        <p className="text-center text-gray-500 py-4">Cargando horarios...</p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {horariosProfesional.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">Sin horarios registrados</p>
            ) : (
              horariosProfesional.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm text-gray-800 w-24">{h.dia}</span>
                    <span className="text-sm text-gray-600">{h.hora_inicio?.slice(0,5)} - {h.hora_fin?.slice(0,5)}</span>
                  </div>
                  <button
                    onClick={() => eliminarHorarioProfesional(idx)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-gray-600 mb-3">Agregar horario</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <label className="text-xs text-gray-500">Dia</label>
                <select
                  value={nuevoHorario.dia}
                  onChange={e => setNuevoHorario({ ...nuevoHorario, dia: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm mt-1"
                >
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Hora inicio</label>
                <input
                  type="time"
                  value={nuevoHorario.hora_inicio}
                  onChange={e => setNuevoHorario({ ...nuevoHorario, hora_inicio: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Hora fin</label>
                <input
                  type="time"
                  value={nuevoHorario.hora_fin}
                  onChange={e => setNuevoHorario({ ...nuevoHorario, hora_fin: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm mt-1"
                />
              </div>
            </div>
            <button
              onClick={agregarHorarioProfesional}
              className="w-full bg-emerald-600 text-white rounded-lg py-2 text-sm hover:bg-emerald-700"
            >
              + Agregar horario
            </button>
          </div>
        </>
      )}

      <button
        onClick={() => setModalHorariosProfesional(null)}
        className="w-full mt-4 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        Cerrar
      </button>
    </div>
  </div>
)}
    </div>
  );
}