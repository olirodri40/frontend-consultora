import { useState, useEffect } from 'react';
import { getCitas, actualizarCitaService, crearCita, crearMultiplesCitas, eliminarCitaService } from '../services/citas.service';
import { getTodosHorariosProfesionales, getProfesionales, getServicios } from '../services/admin.service';
import { getPacientes } from '../services/pacientes.service';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const DIAS_JS: Record<number, string> = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sabado' };

export default function Agenda() {
  const [citas, setCitas] = useState<any[]>([]);
  const [horariosProf, setHorariosProf] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [profSeleccionado, setProfSeleccionado] = useState<any>(null);
  const [areaExpandida, setAreaExpandida] = useState<string>('');
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);
  const [modalNuevaCita, setModalNuevaCita] = useState<any>(null);
  const [editandoCita, setEditandoCita] = useState(false);
  const [guardandoCita, setGuardandoCita] = useState(false);
  const [buscarPaciente, setBuscarPaciente] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [modoNuevoPaciente, setModoNuevoPaciente] = useState(false);
  const [sesionesAdicionales, setSesionesAdicionales] = useState<{fecha: string, hora: string}[]>([]);

  const [formPaciente, setFormPaciente] = useState({ nombre: '', telefono: '', carnet: '', edad: '' });
  const [formCita, setFormCita] = useState({
    total_sesiones: 1,
    modalidad: 'presencial',
    estado: 'pendiente',
    monto_total: '',
    monto_pagado: '',
    metodo_pago: 'efectivo',
    servicio_id: '',
    servicio_nombre: '',
    notas: '',
  });

  const [formEditar, setFormEditar] = useState<any>({});
  const [sesionesAdicionalesEditar, setSesionesAdicionalesEditar] = useState<{fecha: string, hora: string}[]>([]); 
  const [reagendando, setReagendando] = useState(false);
  const [formReagendar, setFormReagendar] = useState({ fecha: '', hora: '' });
  const [inicioSemana, setInicioSemana] = useState(() => {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diff));
    lunes.setHours(0, 0, 0, 0);
    return lunes;
  });

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      const [citasData, horariosData, profsData, serviciosData, pacientesData] = await Promise.all([
        getCitas(), getTodosHorariosProfesionales(), getProfesionales(), getServicios(), getPacientes(),
      ]);
      setCitas(citasData);
      setHorariosProf(horariosData);
      setProfesionales(profsData);
      setServicios(serviciosData);
      setPacientes(pacientesData);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
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

  function horariosProfDia(diaNombre: string) {
    if (!profSeleccionado) return [];
    return horariosProf.filter(h => h.user_id === profSeleccionado.id && h.dia === diaNombre);
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

  function horasProfCalendario(): string[] {
    if (!profSeleccionado) return [];
    const horas = new Set<string>();
    DIAS_SEMANA.forEach(dia => {
      horariosProfDia(dia).forEach(h => {
        const inicio = parseInt(h.hora_inicio?.slice(0, 2));
        const fin = parseInt(h.hora_fin?.slice(0, 2));
        for (let i = inicio; i < fin; i++) horas.add(`${String(i).padStart(2,'0')}:00`);
      });
    });
    return Array.from(horas).sort();
  }

  function citasProfDia(offset: number) {
    if (!profSeleccionado) return [];
    const fecha = getFechaDia(offset);
    const fechaStr = fecha.toISOString().split('T')[0];
    return citas.filter(c => c.fecha.startsWith(fechaStr) && c.profesional_id === profSeleccionado.id).sort((a, b) => a.hora.localeCompare(b.hora));
  }

  function estaEnHorario(hora: string, diaNombre: string): boolean {
    return horariosProfDia(diaNombre).some(h => hora >= h.hora_inicio?.slice(0,5) && hora < h.hora_fin?.slice(0,5));
  }

  function citaEnHora(hora: string, offset: number) {
    return citasProfDia(offset).find(c => c.hora?.slice(0,5) === hora);
  }

  function abrirModalNuevaCita(hora: string, offset: number) {
    const fecha = getFechaDia(offset);
    const fechaStr = fecha.toISOString().split('T')[0];
    const ocupada = citas.some(c =>
      c.fecha.startsWith(fechaStr) &&
      c.profesional_id === profSeleccionado.id &&
      c.hora?.slice(0,5) === hora &&
      c.estado !== 'cancelada'
    );
    if (ocupada) return;

    setModalNuevaCita({ hora, fecha: fechaStr });
    setPacienteSeleccionado(null);
    setBuscarPaciente('');
    setModoNuevoPaciente(true);
    setFormPaciente({ nombre: '', telefono: '', carnet: '', edad: '' });
    setFormCita({ total_sesiones: 1, modalidad: 'presencial', estado: 'pendiente', monto_total: '', monto_pagado: '', metodo_pago: 'efectivo', servicio_id: '', servicio_nombre: '', notas: '' });
    setSesionesAdicionales([]);
  }

  async function guardarNuevaCita(e: React.FormEvent) {
    e.preventDefault();

    const ocupadaSesion1 = citas.some(c =>
      c.fecha.startsWith(modalNuevaCita.fecha) &&
      c.profesional_id === profSeleccionado.id &&
      c.hora?.slice(0,5) === modalNuevaCita.hora &&
      c.estado !== 'cancelada'
    );
    if (ocupadaSesion1) {
      alert(`La hora ${modalNuevaCita.hora} ya esta ocupada. Selecciona otro horario disponible.`);
      return;
    }

    for (const s of sesionesAdicionales) {
      if (!s.fecha || !s.hora) {
        alert('Completa la fecha y hora de todas las sesiones adicionales');
        return;
      }
      const ocupada = citas.some(c =>
        c.fecha.startsWith(s.fecha) &&
        c.profesional_id === profSeleccionado.id &&
        c.hora?.slice(0,5) === s.hora &&
        c.estado !== 'cancelada'
      );
      if (ocupada) {
        alert(`La hora ${s.hora} del ${s.fecha} ya esta ocupada. Selecciona otro horario.`);
        return;
      }
    }

    try {
      setGuardandoCita(true);
      let datosPaciente: any = {};

      if (modoNuevoPaciente) {
        if (!formPaciente.nombre) { alert('El nombre es obligatorio'); return; }
        datosPaciente = { paciente_nombre: formPaciente.nombre, paciente_telefono: formPaciente.telefono || null, paciente_carnet: formPaciente.carnet || null, paciente_edad: formPaciente.edad || null };
      } else {
        if (!pacienteSeleccionado) { alert('Selecciona un paciente'); return; }
        datosPaciente = { paciente_nombre: pacienteSeleccionado.nombre, paciente_telefono: pacienteSeleccionado.telefono || null, paciente_carnet: pacienteSeleccionado.carnet || null, paciente_edad: pacienteSeleccionado.edad || null };
      }

      const datosComunes = {
        ...datosPaciente,
        professional_id: profSeleccionado.id,
        area_id: profSeleccionado.area_id,
        total_sesiones: formCita.total_sesiones,
        modalidad: formCita.modalidad,
        estado: formCita.estado,
        monto_total: formCita.estado === 'confirmada' ? (formCita.monto_total || null) : null,
        monto_pagado: formCita.estado === 'confirmada' ? (formCita.monto_pagado || null) : null,
        metodo_pago: formCita.estado === 'confirmada' ? formCita.metodo_pago : null,
        servicio_nombre: formCita.servicio_nombre || null,
        notas: formCita.notas || null,
      };

      const todasSesiones = [
        { ...datosComunes, fecha: modalNuevaCita.fecha, hora: modalNuevaCita.hora, sesion: 1 },
        ...sesionesAdicionales.map((s, idx) => ({
          ...datosComunes,
           fecha: s.fecha,
  hora: s.hora,
  sesion: idx + 2,
  monto_total: formCita.estado === 'confirmada' ? (formCita.monto_total || null) : null,
  monto_pagado: formCita.estado === 'confirmada' ? (formCita.monto_pagado || null) : null,
})),
      ];

      await crearMultiplesCitas(todasSesiones);
      setModalNuevaCita(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al crear cita');
    } finally {
      setGuardandoCita(false);
    }
  }

async function guardarEdicionCita(e: React.FormEvent) {
  e.preventDefault();
  try {
    setGuardandoCita(true);

    // Verificar sesiones adicionales
    for (const s of sesionesAdicionalesEditar) {
      if (!s.fecha || !s.hora) {
        alert('Completa la fecha y hora de todas las sesiones adicionales');
        return;
      }
      const ocupada = citas.some(c =>
        c.fecha.startsWith(s.fecha) &&
        c.profesional_id === citaSeleccionada.profesional_id &&
        c.hora?.slice(0,5) === s.hora &&
        c.estado !== 'cancelada'
      );
      if (ocupada) {
        alert(`La hora ${s.hora} del ${s.fecha} ya esta ocupada.`);
        return;
      }
    }

    // Actualizar cita actual
      await actualizarCitaService(citaSeleccionada.id, {
      estado: formEditar.estado,
      monto_total: formEditar.monto_total || null,
      monto_pagado: formEditar.monto_pagado || null,
      metodo_pago: formEditar.metodo_pago || null,
      notas: formEditar.notas || null,
      total_sesiones: formEditar.total_sesiones,
      modalidad: formEditar.modalidad,
      servicio_nombre: formEditar.servicio_nombre || null,
      });

    // Crear sesiones adicionales si existen
    if (sesionesAdicionalesEditar.length > 0) {
      const datosPaciente = {
        paciente_nombre: citaSeleccionada.paciente_nombre,
        paciente_telefono: citaSeleccionada.paciente_telefono || null,
        paciente_carnet: citaSeleccionada.paciente_carnet || null,
        paciente_edad: citaSeleccionada.paciente_edad || null,
      };
      const sesionesNuevas = sesionesAdicionalesEditar.map((s, idx) => ({
        ...datosPaciente,
        professional_id: citaSeleccionada.profesional_id,
        area_id: citaSeleccionada.area_id,
        fecha: s.fecha,
        hora: s.hora,
        sesion: parseInt(citaSeleccionada.sesion || '1') + idx + 1,
        total_sesiones: formEditar.total_sesiones,
        modalidad: formEditar.modalidad,
        estado: formEditar.estado,
        monto_total: formEditar.monto_total || null,
        monto_pagado: 0,
        metodo_pago: formEditar.metodo_pago || null,
        notas: formEditar.notas || null,
      }));
      await crearMultiplesCitas(sesionesNuevas);
    }

    setEditandoCita(false);
    setCitaSeleccionada(null);
    setSesionesAdicionalesEditar([]);
    await cargarDatos();
  } catch (err: any) {
    alert(err.response?.data?.mensaje || 'Error al actualizar');
  } finally { setGuardandoCita(false); }
}

  async function marcarAsistencia(id: number, asistio: boolean) {
    try {
      await actualizarCitaService(id, { asistio });
      await cargarDatos();
      if (citaSeleccionada?.id === id) setCitaSeleccionada({ ...citaSeleccionada, asistio });
    } catch (err) { console.error(err); }
  }

  const finSemana = new Date(inicioSemana);
  finSemana.setDate(finSemana.getDate() + 5);
  const rangoLabel = `${inicioSemana.toLocaleDateString('es', { day: 'numeric', month: 'short' })} - ${finSemana.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const areasProfesionales = profesionales.reduce((acc: any, p: any) => {
    const area = p.area_nombre || 'Sin area';
    if (!acc[area]) acc[area] = { emoji: p.area_emoji, profesionales: [] };
    acc[area].profesionales.push(p);
    return acc;
  }, {});

  const profTieneHorarios = profSeleccionado ? horariosProf.some(h => h.user_id === profSeleccionado.id) : false;
  const todasHoras = horasProfCalendario();
  const pacientesFiltrados = pacientes.filter(p => p.nombre?.toLowerCase().includes(buscarPaciente.toLowerCase()) || p.carnet?.toLowerCase().includes(buscarPaciente.toLowerCase())).slice(0, 6);
  const serviciosDelArea = servicios.filter(s => s.area_id === profSeleccionado?.area_id);
  const esAreaConServicios = profSeleccionado && !['zumba','gerontologia'].includes(profSeleccionado.area_nombre?.toLowerCase());
  const montoPendiente = citaSeleccionada ? (Number(citaSeleccionada.monto_total) || 0) - (Number(citaSeleccionada.monto_pagado) || 0) : 0;

  function formatFecha(fecha: string) {
    if (!fecha) return '';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function MetodoPagoSelector({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    return (
      <div className="flex gap-2">
        {['efectivo', 'qr', 'transferencia'].map(m => (
          <button key={m} type="button" onClick={() => onChange(m)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${value === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-300'}`}>
            {m === 'efectivo' ? '💵' : m === 'qr' ? '📱' : '🏦'} {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>
    );
  }
async function eliminarCita(id: number) {
  if (!confirm('¿Seguro que deseas eliminar esta cita?')) return;
  try {
    await eliminarCitaService(id);
    setCitaSeleccionada(null);
    await cargarDatos();
  } catch (err: any) {
    alert(err.response?.data?.mensaje || 'Error al eliminar');
  }
}
async function guardarReagendar() {
  if (!formReagendar.fecha || !formReagendar.hora) {
    alert('Selecciona fecha y hora');
    return;
  }
  const ocupada = citas.some(c =>
    c.fecha.startsWith(formReagendar.fecha) &&
    c.profesional_id === citaSeleccionada.profesional_id &&
    c.hora?.slice(0,5) === formReagendar.hora &&
    c.estado !== 'cancelada' &&
    c.id !== citaSeleccionada.id
  );
  if (ocupada) {
    alert(`La hora ${formReagendar.hora} ya esta ocupada.`);
    return;
  }
  try {
    await actualizarCitaService(citaSeleccionada.id, {
      fecha: formReagendar.fecha,
      hora: formReagendar.hora,
    });
    setReagendando(false);
    setCitaSeleccionada(null);
    await cargarDatos();
  } catch (err: any) {
    alert(err.response?.data?.mensaje || 'Error al reagendar');
  }
}

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📅 Agenda</h1>
          {profSeleccionado ? (
            <p className="text-sm text-gray-500">{profSeleccionado.area_emoji} {profSeleccionado.nombre} — {rangoLabel}</p>
          ) : (
            <p className="text-sm text-gray-500">Selecciona un profesional</p>
          )}
        </div>
        {profSeleccionado && profTieneHorarios && (
          <div className="flex gap-2">
            <button onClick={() => cambiarSemana(-7)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">← Anterior</button>
            <button onClick={irAHoy} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Hoy</button>
            <button onClick={() => cambiarSemana(7)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Siguiente →</button>
          </div>
        )}
      </div>

      {cargando ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : (
        <div className="flex gap-4">
          <div className="w-52 shrink-0">
            <div className="bg-white rounded-xl border overflow-hidden sticky top-4">
              <div className="p-3 border-b bg-gray-50">
                <p className="text-xs font-semibold text-gray-600">Profesionales</p>
              </div>
              <div className="divide-y max-h-[70vh] overflow-y-auto">
                {Object.entries(areasProfesionales).map(([area, data]: any) => (
                  <div key={area}>
                    <button onClick={() => setAreaExpandida(areaExpandida === area ? '' : area)} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left">
                      <span className="text-xs font-semibold text-gray-700">{data.emoji} {area}</span>
                      <span className="text-gray-400 text-xs">{areaExpandida === area ? '▲' : '▼'}</span>
                    </button>
                    {areaExpandida === area && (
                      <div className="bg-gray-50 divide-y">
                        {data.profesionales.map((p: any) => (
                          <button key={p.id} onClick={() => setProfSeleccionado(p)}
                            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-emerald-50 transition-colors ${profSeleccionado?.id === p.id ? 'bg-emerald-100 text-emerald-700 font-semibold border-l-2 border-emerald-500' : 'text-gray-600'}`}>
                            {p.nombre}
                            {p.especialidad && <span className="block text-[10px] text-gray-400">{p.especialidad}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {!profSeleccionado ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                <p className="text-4xl mb-3">👈</p>
                <p className="text-sm font-medium">Selecciona un profesional para ver su agenda</p>
              </div>
            ) : !profTieneHorarios ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm font-medium text-gray-600">{profSeleccionado.nombre} no tiene horarios asignados</p>
                <p className="text-xs text-gray-400 mt-1">Ve a Admin → Personal → Ver horarios para asignarlos</p>
              </div>
            ) : (
              <div>
                <div className="grid gap-1 min-w-[600px]" style={{ gridTemplateColumns: `56px repeat(6, 1fr)` }}>
                  <div />
                  {DIAS_SEMANA.map((dia, idx) => {
                    const fecha = getFechaDia(idx);
                    const esHoy = fecha.toDateString() === new Date().toDateString();
                    const horariosDia = horariosProfDia(dia);
                    const tieneDia = horariosDia.length > 0;
                    return (
                      <div key={dia} className={`text-center p-2 rounded-lg mb-1 ${esHoy ? 'bg-emerald-600 text-white' : tieneDia ? 'bg-gray-50' : 'bg-gray-50 opacity-40'}`}>
                        <p className="text-[10px] font-semibold">{dia}</p>
                        <p className={`text-sm font-bold ${esHoy ? 'text-white' : 'text-gray-800'}`}>{fecha.getDate()}</p>
                        {tieneDia && !esHoy && <p className="text-[9px] text-gray-400">{horariosDia[0].hora_inicio?.slice(0,5)}-{horariosDia[horariosDia.length-1].hora_fin?.slice(0,5)}</p>}
                      </div>
                    );
                  })}
                  {todasHoras.map(hora => (
                    <>
                      <div key={`h-${hora}`} className="flex items-center justify-end pr-2">
                        <span className="text-[10px] text-gray-400 font-medium">{hora}</span>
                      </div>
                      {DIAS_SEMANA.map((dia, idx) => {
                        const enHorario = estaEnHorario(hora, dia);
                        const cita = citaEnHora(hora, idx);
                        return (
                          <div key={`${dia}-${hora}`}
                            className={`h-12 rounded-lg mb-0.5 border transition-all ${cita ? `cursor-pointer ${cita.estado === 'confirmada' ? 'bg-emerald-100 border-emerald-400 hover:bg-emerald-200' : cita.estado === 'pendiente' ? 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200' : 'bg-red-100 border-red-400 hover:bg-red-200'}` : enHorario ? 'bg-blue-50 border-blue-200 border-dashed hover:bg-blue-100 cursor-pointer' : 'border-transparent'}`}
                            onClick={() => { if (cita) { setCitaSeleccionada(cita); setEditandoCita(false); } else if (enHorario) abrirModalNuevaCita(hora, idx); }}>
                            {cita && (
  <div className="p-1 h-full overflow-hidden">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-bold text-gray-700">{cita.hora?.slice(0,5)}</p>
      <div className="flex items-center gap-0.5">
        {cita.total_sesiones > 1 && (
          <span className="text-[8px] font-bold px-1 rounded bg-blue-100 text-blue-700">
            {cita.sesion}/{cita.total_sesiones}
          </span>
        )}
        {cita.estado === 'confirmada' && (
          <span className={`text-[8px] font-bold px-1 rounded ${
            cita.asistio === true  ? 'bg-emerald-600 text-white' :
            cita.asistio === false ? 'bg-red-500 text-white' :
            'bg-gray-200 text-gray-500'
          }`}>
            {cita.asistio === true ? '✓' : cita.asistio === false ? '✗' : '?'}
          </span>
        )}
      </div>
    </div>
    <p className="text-[10px] text-gray-800 truncate font-medium">{cita.paciente_nombre}</p>
    <p className="text-[9px] text-gray-500 truncate">{cita.area_emoji} {cita.area_nombre}</p>
  </div>
)}
                            {!cita && enHorario && <div className="h-full flex items-center justify-center"><span className="text-[9px] text-blue-400 font-medium">+ Nueva cita</span></div>}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 text-[10px] text-gray-500 flex-wrap">
  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-200 border-dashed inline-block"></span>Disponible</span>
  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400 inline-block"></span>Confirmada</span>
  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400 inline-block"></span>Pendiente</span>
  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-400 inline-block"></span>Cancelada</span>
  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>✓ Asistio</span>
  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block"></span>✗ No asistio</span>
  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 inline-block"></span>? Sin marcar</span>
</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal nueva cita */}
      {modalNuevaCita && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <form onSubmit={guardarNuevaCita} className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-800">📞 Nueva reserva</h3>
                <p className="text-xs text-gray-500">{profSeleccionado.area_emoji} {profSeleccionado.nombre} · {formatFecha(modalNuevaCita.fecha)} · {modalNuevaCita.hora}</p>
              </div>
              <button type="button" onClick={() => setModalNuevaCita(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-gray-600">Datos del paciente</label>
                  <button type="button" onClick={() => { setModoNuevoPaciente(!modoNuevoPaciente); setPacienteSeleccionado(null); setBuscarPaciente(''); }}
                    className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                    {modoNuevoPaciente ? '← Buscar existente' : '+ Nuevo paciente'}
                  </button>
                </div>

                {modoNuevoPaciente ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Nombre completo *" required value={formPaciente.nombre}
                        onChange={e => setFormPaciente({ ...formPaciente, nombre: e.target.value })}
                        className="border rounded-lg p-2 text-sm" />
                      <input type="number" placeholder="Edad" value={formPaciente.edad}
                        onChange={e => setFormPaciente({ ...formPaciente, edad: e.target.value })}
                        className="border rounded-lg p-2 text-sm" />
                    </div>
                    <input type="text" placeholder="Telefono celular" value={formPaciente.telefono}
                      onChange={e => setFormPaciente({ ...formPaciente, telefono: e.target.value })}
                      className="w-full border rounded-lg p-2 text-sm" />
                    <input type="text" placeholder="Carnet de identidad" value={formPaciente.carnet}
                      onChange={e => setFormPaciente({ ...formPaciente, carnet: e.target.value })}
                      className="w-full border rounded-lg p-2 text-sm" />
                  </div>
                ) : pacienteSeleccionado ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{pacienteSeleccionado.nombre}</p>
                      <p className="text-xs text-gray-500">{pacienteSeleccionado.carnet && `CI: ${pacienteSeleccionado.carnet}`} {pacienteSeleccionado.telefono && `· ${pacienteSeleccionado.telefono}`}</p>
                    </div>
                    <button type="button" onClick={() => { setPacienteSeleccionado(null); setBuscarPaciente(''); }} className="text-xs text-red-500">Cambiar</button>
                  </div>
                ) : (
                  <div>
                    <input type="text" placeholder="Buscar por nombre o carnet..." value={buscarPaciente}
                      onChange={e => setBuscarPaciente(e.target.value)} className="w-full border rounded-lg p-2 text-sm" autoFocus />
                    {buscarPaciente && (
                      <div className="border rounded-lg mt-1 max-h-36 overflow-y-auto shadow-sm">
                        {pacientesFiltrados.length === 0 ? <p className="p-3 text-xs text-gray-400 text-center">Sin resultados</p> :
                          pacientesFiltrados.map(p => (
                            <button key={p.id} type="button" onClick={() => { setPacienteSeleccionado(p); setBuscarPaciente(''); }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-0">
                              <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                              <p className="text-xs text-gray-400">{p.carnet && `CI: ${p.carnet}`} {p.telefono && `· ${p.telefono}`}</p>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 border rounded-lg p-2">
                  <p className="text-[10px] text-gray-400">Area</p>
                  <p className="text-sm font-medium text-gray-800">{profSeleccionado.area_emoji} {profSeleccionado.area_nombre}</p>
                </div>
                <div className="bg-gray-50 border rounded-lg p-2">
                  <p className="text-[10px] text-gray-400">Profesional</p>
                  <p className="text-sm font-medium text-gray-800">{profSeleccionado.nombre}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Modalidad</label>
                <select value={formCita.modalidad} onChange={e => setFormCita({ ...formCita, modalidad: e.target.value })} className="w-full border rounded-lg p-2 text-sm">
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                  <option value="domicilio">Domicilio</option>
                </select>
              </div>

              {esAreaConServicios && serviciosDelArea.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Servicio (opcional)</label>
                  <select value={formCita.servicio_id}
                    onChange={e => {
                      const srv = serviciosDelArea.find(s => String(s.id) === e.target.value);
                      setFormCita({ ...formCita, servicio_id: e.target.value, servicio_nombre: srv?.nombre || '', monto_total: srv?.costo ? String(srv.costo) : formCita.monto_total });
                    }}
                    className="w-full border rounded-lg p-2 text-sm">
                    <option value="">Sin servicio especifico</option>
                    {serviciosDelArea.map(s => <option key={s.id} value={s.id}>{s.nombre} {s.costo ? `— Bs ${s.costo}` : ''}</option>)}
                  </select>
                </div>
              )}

              <div className="bg-gray-50 border rounded-lg p-3">
                <p className="text-[10px] text-gray-400 mb-1">Sesion 1 — {formatFecha(modalNuevaCita.fecha)}</p>
                <p className="text-[10px] text-gray-400 mb-2">Selecciona un horario disponible:</p>
                <div className="flex gap-2 flex-wrap">
                  {horasProfParaDia(profSeleccionado.id, modalNuevaCita.fecha).map(h => {
                    const ocupada = citas.some(c =>
                      c.fecha.startsWith(modalNuevaCita.fecha) &&
                      c.profesional_id === profSeleccionado.id &&
                      c.hora?.slice(0,5) === h &&
                      c.estado !== 'cancelada'
                    );
                    const seleccionada = modalNuevaCita.hora === h;
                    return (
                      <button key={h} type="button"
                        disabled={ocupada}
                        onClick={() => {
                          if (ocupada) return;
                          setModalNuevaCita({ ...modalNuevaCita, hora: h });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          ocupada
                            ? 'bg-red-100 text-red-500 border-red-200 cursor-not-allowed line-through'
                            : seleccionada
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                        }`}>
                        {h} {ocupada ? '· Ocupado' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Estado de la cita</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormCita({ ...formCita, estado: 'pendiente' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${formCita.estado === 'pendiente' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="text-xs font-bold text-gray-700">🕐 Reserva</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Solo reserva, sin pago</p>
                  </button>
                  <button type="button" onClick={() => setFormCita({ ...formCita, estado: 'confirmada' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${formCita.estado === 'confirmada' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="text-xs font-bold text-gray-700">✓ Confirmada</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Va a pagar</p>
                  </button>
                </div>
              </div>

              {formCita.estado === 'confirmada' && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
                  <p className="text-xs font-semibold text-emerald-700">💰 Datos de pago y sesiones</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500">Precio total (Bs)</label>
                      <input type="number" placeholder="0" value={formCita.monto_total}
                        onChange={e => setFormCita({ ...formCita, monto_total: e.target.value })}
                        className="w-full border rounded-lg p-2 text-sm bg-white mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">Cantidad de sesiones</label>
                      <input type="number" min="1" value={formCita.total_sesiones}
                        onChange={e => {
                          const n = Number(e.target.value);
                          setFormCita({ ...formCita, total_sesiones: n });
                          const extras = n - 1;
                          if (extras > sesionesAdicionales.length) {
                            const nuevas = [...sesionesAdicionales];
                            for (let i = sesionesAdicionales.length; i < extras; i++) nuevas.push({ fecha: '', hora: '' });
                            setSesionesAdicionales(nuevas);
                          } else {
                            setSesionesAdicionales(sesionesAdicionales.slice(0, extras));
                          }
                        }}
                        className="w-full border rounded-lg p-2 text-sm bg-white mt-0.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500">Monto pagado (Bs)</label>
                    <input type="number" placeholder="0" value={formCita.monto_pagado}
                      onChange={e => setFormCita({ ...formCita, monto_pagado: e.target.value })}
                      className="w-full border rounded-lg p-2 text-sm bg-white mt-0.5" />
                    {formCita.monto_total && formCita.monto_pagado && (
                      <div className={`text-xs font-medium px-2 py-1 rounded-lg mt-1 ${Number(formCita.monto_pagado) >= Number(formCita.monto_total) ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {Number(formCita.monto_pagado) >= Number(formCita.monto_total) ? '✓ Pago completo' : `Pendiente: Bs ${Number(formCita.monto_total) - Number(formCita.monto_pagado)}`}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Metodo de pago</label>
                    <MetodoPagoSelector value={formCita.metodo_pago} onChange={v => setFormCita({ ...formCita, metodo_pago: v })} />
                  </div>

                  {sesionesAdicionales.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-[10px] text-gray-500 font-semibold">📅 Programacion de sesiones adicionales</p>
                      {sesionesAdicionales.map((s, idx) => {
                        const horasDisponibles = s.fecha ? horasProfParaDia(profSeleccionado.id, s.fecha) : [];
                        return (
                          <div key={idx} className="p-2 bg-white rounded-lg border space-y-2">
                            <p className="text-[10px] font-bold text-blue-600">Sesion {idx + 2}</p>
                            <div>
                              <label className="text-[10px] text-gray-400">Fecha</label>
                              <input type="date" required value={s.fecha}
                                onChange={e => {
                                  const nuevas = [...sesionesAdicionales];
                                  nuevas[idx] = { fecha: e.target.value, hora: '' };
                                  setSesionesAdicionales(nuevas);
                                }}
                                className="w-full border rounded-lg p-1.5 text-xs mt-0.5" />
                            </div>
                            {s.fecha && (
                              <div>
                                <label className="text-[10px] text-gray-400 mb-1 block">Horario disponible</label>
                                {horasDisponibles.length === 0 ? (
                                  <p className="text-[10px] text-red-400 bg-red-50 p-2 rounded-lg">El profesional no trabaja este dia</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {horasDisponibles.map(h => {
                                      const ocupada = citas.some(c =>
                                        c.fecha.startsWith(s.fecha) &&
                                        c.profesional_id === profSeleccionado.id &&
                                        c.hora?.slice(0,5) === h &&
                                        c.estado !== 'cancelada'
                                      );
                                      return (
                                        <button key={h} type="button"
                                          disabled={ocupada}
                                          onClick={() => {
                                            if (ocupada) return;
                                            const nuevas = [...sesionesAdicionales];
                                            nuevas[idx] = { ...nuevas[idx], hora: h };
                                            setSesionesAdicionales(nuevas);
                                          }}
                                          className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                                            ocupada
                                              ? 'bg-red-100 text-red-400 border-red-200 cursor-not-allowed line-through'
                                              : s.hora === h
                                              ? 'bg-emerald-600 text-white border-emerald-600'
                                              : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                                          }`}>
                                          {h} {ocupada ? '· Ocupado' : ''}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Notas (opcional)</label>
                <textarea value={formCita.notas} onChange={e => setFormCita({ ...formCita, notas: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm" rows={2} placeholder="Observaciones, indicaciones..." />
              </div>
            </div>

            <div className="p-4 border-t flex gap-2 sticky bottom-0 bg-white">
              <button type="button" onClick={() => setModalNuevaCita(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={guardandoCita || (!pacienteSeleccionado && !modoNuevoPaciente)}
                className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm hover:bg-emerald-700 disabled:opacity-50">
                {guardandoCita ? 'Guardando...' : 'Guardar cita'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal detalle/editar cita */}
      {citaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4" onClick={() => { setCitaSeleccionada(null); setEditandoCita(false); }}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{citaSeleccionada.paciente_nombre}</h3>
                <p className="text-xs text-gray-500">{formatFecha(citaSeleccionada.fecha)} · {citaSeleccionada.hora?.slice(0,5)}</p>
              </div>
              <div className="flex items-center gap-2">
                {!editandoCita && (
                  <button onClick={() => {
                    setEditandoCita(true);
                    setSesionesAdicionalesEditar([]);
                    setFormEditar({
                      nombre: citaSeleccionada.paciente_nombre || '',
                      telefono: citaSeleccionada.paciente_telefono || '',
                      carnet: citaSeleccionada.paciente_carnet || '',
                      edad: citaSeleccionada.paciente_edad || '',
                      estado: citaSeleccionada.estado,
                      modalidad: citaSeleccionada.modalidad || 'presencial',
                      monto_total: citaSeleccionada.monto_total || '',
                      monto_pagado: citaSeleccionada.monto_pagado || '',
                      metodo_pago: citaSeleccionada.metodo_pago || 'efectivo',
                      notas: citaSeleccionada.notas || '',
                      total_sesiones: citaSeleccionada.total_sesiones || 1,
                      servicio_nombre: citaSeleccionada.servicio_nombre || '',
                    });
                  }} className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-2 py-1 rounded-lg">Editar</button>
                )}
                <button onClick={() => { setCitaSeleccionada(null); setEditandoCita(false); }} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
              </div>
            </div>

            <div className="p-4">
              {!editandoCita ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] text-gray-400">Area</p>
                      <p className="font-medium text-gray-800">{citaSeleccionada.area_emoji} {citaSeleccionada.area_nombre}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] text-gray-400">Profesional</p>
                      <p className="font-medium text-gray-800">{citaSeleccionada.profesional_nombre}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] text-gray-400">Modalidad</p>
                      <p className="font-medium text-gray-800 capitalize">{citaSeleccionada.modalidad}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] text-gray-400">Sesion</p>
                      <p className="font-medium text-gray-800">{citaSeleccionada.sesion} / {citaSeleccionada.total_sesiones || 1}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] text-gray-400">Estado</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${citaSeleccionada.estado === 'confirmada' ? 'bg-emerald-100 text-emerald-700' : citaSeleccionada.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {citaSeleccionada.estado}
                      </span>
                    </div>
                    {citaSeleccionada.paciente_telefono && (
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-[10px] text-gray-400">Telefono</p>
                        <p className="font-medium text-gray-800">{citaSeleccionada.paciente_telefono}</p>
                      </div>
                    )}
                  </div>

                  {citaSeleccionada.estado === 'confirmada' && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-2">💰 Pago</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><p className="text-[10px] text-gray-400">Total</p><p className="text-sm font-bold text-gray-800">Bs {citaSeleccionada.monto_total || 0}</p></div>
                        <div><p className="text-[10px] text-gray-400">Pagado</p><p className="text-sm font-bold text-emerald-600">Bs {citaSeleccionada.monto_pagado || 0}</p></div>
                        <div><p className="text-[10px] text-gray-400">Pendiente</p><p className={`text-sm font-bold ${montoPendiente > 0 ? 'text-red-500' : 'text-emerald-600'}`}>Bs {montoPendiente > 0 ? montoPendiente : 0}</p></div>
                      </div>
                      {citaSeleccionada.metodo_pago && <p className="text-[10px] text-gray-400 mt-2">Metodo: <span className="font-medium text-gray-600 capitalize">{citaSeleccionada.metodo_pago}</span></p>}
                    </div>
                  )}

                  {citaSeleccionada.estado === 'pendiente' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                      <p className="text-xs text-yellow-700 font-medium">🕐 Reserva pendiente de confirmacion</p>
                      <p className="text-[10px] text-yellow-600 mt-0.5">Presiona "Editar" para confirmar el pago</p>
                    </div>
                  )}

                  {citaSeleccionada.notas && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 mb-1">Notas</p>
                      <p className="text-xs text-gray-700">{citaSeleccionada.notas}</p>
                    </div>
                  )}

                  {citaSeleccionada.estado === 'confirmada' && (
  <div className="pt-2 border-t space-y-2">
    <p className="text-xs text-gray-500 mb-2">Marcar asistencia:</p>
    <div className="flex gap-2">
      <button onClick={() => marcarAsistencia(citaSeleccionada.id, true)}
        className={`flex-1 py-2 rounded-lg text-xs font-medium ${citaSeleccionada.asistio === true ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
        ✓ Asistio
      </button>
      <button onClick={() => marcarAsistencia(citaSeleccionada.id, false)}
        className={`flex-1 py-2 rounded-lg text-xs font-medium ${citaSeleccionada.asistio === false ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
        x No asistio
      </button>
      <button
        onClick={() => { setReagendando(!reagendando); setFormReagendar({ fecha: '', hora: '' }); }}
        className={`flex-1 py-2 rounded-lg text-xs font-medium ${reagendando ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
        📅 Reagendar
      </button>
    </div>

    {reagendando && (
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-3">
        <p className="text-xs font-semibold text-blue-700">Selecciona nueva fecha y hora</p>
        <div>
          <label className="text-[10px] text-gray-500">Fecha</label>
          <input type="date" value={formReagendar.fecha}
            onChange={e => setFormReagendar({ fecha: e.target.value, hora: '' })}
            className="w-full border rounded-lg p-2 text-sm mt-0.5" />
        </div>
        {formReagendar.fecha && (
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Horario disponible</label>
            {horasProfParaDia(citaSeleccionada.profesional_id, formReagendar.fecha).length === 0 ? (
              <p className="text-[10px] text-red-400 bg-red-50 p-2 rounded-lg">El profesional no trabaja este dia</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {horasProfParaDia(citaSeleccionada.profesional_id, formReagendar.fecha).map(h => {
                  const ocupada = citas.some(c =>
                    c.fecha.startsWith(formReagendar.fecha) &&
                    c.profesional_id === citaSeleccionada.profesional_id &&
                    c.hora?.slice(0,5) === h &&
                    c.estado !== 'cancelada' &&
                    c.id !== citaSeleccionada.id
                  );
                  return (
                    <button key={h} type="button"
                      disabled={ocupada}
                      onClick={() => { if (!ocupada) setFormReagendar({ ...formReagendar, hora: h }); }}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                        ocupada ? 'bg-red-100 text-red-400 border-red-200 cursor-not-allowed line-through'
                        : formReagendar.hora === h ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}>
                      {h} {ocupada ? '· Ocupado' : ''}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {formReagendar.fecha && formReagendar.hora && (
          <button onClick={guardarReagendar}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
            Confirmar reagenda → {formReagendar.hora} del {formatFecha(formReagendar.fecha)}
          </button>
        )}
      </div>
    )}
  </div>
)}
                </div>
              ) : (
                <form onSubmit={guardarEdicionCita} className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Datos del paciente</p>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Nombre completo" value={formEditar.nombre}
                          onChange={e => setFormEditar({ ...formEditar, nombre: e.target.value })}
                          className="border rounded-lg p-2 text-sm" />
                        <input type="number" placeholder="Edad" value={formEditar.edad}
                          onChange={e => setFormEditar({ ...formEditar, edad: e.target.value })}
                          className="border rounded-lg p-2 text-sm" />
                      </div>
                      <input type="text" placeholder="Telefono" value={formEditar.telefono}
                        onChange={e => setFormEditar({ ...formEditar, telefono: e.target.value })}
                        className="w-full border rounded-lg p-2 text-sm" />
                      <input type="text" placeholder="Carnet de identidad" value={formEditar.carnet}
                        onChange={e => setFormEditar({ ...formEditar, carnet: e.target.value })}
                        className="w-full border rounded-lg p-2 text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
  <div className="bg-gray-50 border rounded-lg p-2">
    <p className="text-[10px] text-gray-400">Area</p>
    <p className="text-sm font-medium text-gray-800">{citaSeleccionada.area_emoji} {citaSeleccionada.area_nombre}</p>
  </div>
  <div className="bg-gray-50 border rounded-lg p-2">
    <p className="text-[10px] text-gray-400">Profesional</p>
    <p className="text-sm font-medium text-gray-800">{citaSeleccionada.profesional_nombre}</p>
  </div>
</div>

{/* Servicio editable */}
{servicios.filter(s => s.area_id === citaSeleccionada.area_id && !['zumba','gerontologia'].includes(citaSeleccionada.area_nombre?.toLowerCase())).length > 0 && (
  <div>
    <label className="text-xs font-semibold text-gray-600 mb-1 block">Servicio</label>
    <select
      value={formEditar.servicio_nombre || ''}
      onChange={e => setFormEditar({ ...formEditar, servicio_nombre: e.target.value })}
      className="w-full border rounded-lg p-2 text-sm"
    >
      <option value="">Sin servicio especifico</option>
      {servicios.filter(s => s.area_id === citaSeleccionada.area_id).map(s => (
        <option key={s.id} value={s.nombre}>
          {s.nombre} {s.costo ? `— Bs ${s.costo}` : ''}
        </option>
      ))}
    </select>
  </div>
)}

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Modalidad</label>
                    <select value={formEditar.modalidad} onChange={e => setFormEditar({ ...formEditar, modalidad: e.target.value })} className="w-full border rounded-lg p-2 text-sm">
                      <option value="presencial">Presencial</option>
                      <option value="virtual">Virtual</option>
                      <option value="domicilio">Domicilio</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">Estado</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setFormEditar({ ...formEditar, estado: 'pendiente' })}
                        className={`p-2.5 rounded-xl border-2 text-left ${formEditar.estado === 'pendiente' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
                        <p className="text-xs font-bold text-gray-700">🕐 Reserva</p>
                      </button>
                      <button type="button" onClick={() => setFormEditar({ ...formEditar, estado: 'confirmada' })}
                        className={`p-2.5 rounded-xl border-2 text-left ${formEditar.estado === 'confirmada' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                        <p className="text-xs font-bold text-gray-700">✓ Confirmada</p>
                      </button>
                    </div>
                  </div>

                  {formEditar.estado === 'confirmada' && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
                      <p className="text-xs font-semibold text-emerald-700">💰 Datos de pago</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-500">Precio total (Bs)</label>
                          <input type="number" value={formEditar.monto_total}
                            onChange={e => setFormEditar({ ...formEditar, monto_total: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm bg-white mt-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500">Cantidad sesiones</label>
                          <input type="number" min="1" value={formEditar.total_sesiones}
                            onChange={e => setFormEditar({ ...formEditar, total_sesiones: Number(e.target.value) })}
                            className="w-full border rounded-lg p-2 text-sm bg-white mt-0.5" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Monto pagado (Bs)</label>
                        <input type="number" value={formEditar.monto_pagado}
                          onChange={e => setFormEditar({ ...formEditar, monto_pagado: e.target.value })}
                          className="w-full border rounded-lg p-2 text-sm bg-white mt-0.5" />
                        {formEditar.monto_total && formEditar.monto_pagado && (
                          <div className={`text-xs font-medium px-2 py-1 rounded-lg mt-1 ${Number(formEditar.monto_pagado) >= Number(formEditar.monto_total) ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {Number(formEditar.monto_pagado) >= Number(formEditar.monto_total) ? '✓ Pago completo' : `Pendiente: Bs ${Number(formEditar.monto_total) - Number(formEditar.monto_pagado)}`}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-1 block">Metodo de pago</label>
                        <MetodoPagoSelector value={formEditar.metodo_pago} onChange={v => setFormEditar({ ...formEditar, metodo_pago: v })} />
                      {/* Sesiones adicionales */}
{formEditar.total_sesiones > (citaSeleccionada.total_sesiones || 1) && (
  <div className="space-y-2 border-t pt-3">
    <p className="text-[10px] text-gray-500 font-semibold">📅 Programar sesiones nuevas</p>
    {Array.from({ length: formEditar.total_sesiones - (citaSeleccionada.total_sesiones || 1) }, (_, idx) => {
      const s = sesionesAdicionalesEditar[idx] || { fecha: '', hora: '' };
      const horasDisponibles = s.fecha ? horasProfParaDia(citaSeleccionada.profesional_id, s.fecha) : [];
      return (
        <div key={idx} className="p-2 bg-white rounded-lg border space-y-2">
          <p className="text-[10px] font-bold text-blue-600">
            Sesion {(citaSeleccionada.total_sesiones || 1) + idx + 1}
          </p>
          <div>
            <label className="text-[10px] text-gray-400">Fecha</label>
            <input type="date" required value={s.fecha}
              onChange={e => {
                const nuevas = [...sesionesAdicionalesEditar];
                while (nuevas.length <= idx) nuevas.push({ fecha: '', hora: '' });
                nuevas[idx] = { fecha: e.target.value, hora: '' };
                setSesionesAdicionalesEditar(nuevas);
              }}
              className="w-full border rounded-lg p-1.5 text-xs mt-0.5" />
          </div>
          {s.fecha && (
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block">Horario disponible</label>
              {horasDisponibles.length === 0 ? (
                <p className="text-[10px] text-red-400 bg-red-50 p-2 rounded-lg">El profesional no trabaja este dia</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {horasDisponibles.map(h => {
                    const ocupada = citas.some(c =>
                      c.fecha.startsWith(s.fecha) &&
                      c.profesional_id === citaSeleccionada.profesional_id &&
                      c.hora?.slice(0,5) === h &&
                      c.estado !== 'cancelada'
                    );
                    return (
                      <button key={h} type="button"
                        disabled={ocupada}
                        onClick={() => {
                          if (ocupada) return;
                          const nuevas = [...sesionesAdicionalesEditar];
                          while (nuevas.length <= idx) nuevas.push({ fecha: '', hora: '' });
                          nuevas[idx] = { ...nuevas[idx], hora: h };
                          setSesionesAdicionalesEditar(nuevas);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                          ocupada ? 'bg-red-100 text-red-400 border-red-200 cursor-not-allowed line-through'
                          : s.hora === h ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                        }`}>
                        {h} {ocupada ? '· Ocupado' : ''}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
)}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-gray-500">Notas</label>
                    <textarea value={formEditar.notas} onChange={e => setFormEditar({ ...formEditar, notas: e.target.value })}
                      className="w-full border rounded-lg p-2 text-sm mt-0.5" rows={2} placeholder="Observaciones..." />
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditandoCita(false)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
                    <button type="submit" disabled={guardandoCita} className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm hover:bg-emerald-700 disabled:opacity-50">
                      {guardandoCita ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {!editandoCita && (
  <div className="p-4 border-t space-y-2">
    <button
      onClick={() => eliminarCita(citaSeleccionada.id)}
      className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium border border-red-200"
    >
      🗑 Eliminar cita
    </button>
    <button
      onClick={() => { setCitaSeleccionada(null); setEditandoCita(false); }}
      className="w-full border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
    >
      Cerrar
    </button>
  </div>
)}
          </div>
        </div>
      )}
    </div>
  );
}