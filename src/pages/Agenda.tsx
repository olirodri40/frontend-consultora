import { useState, useEffect } from 'react';
import { getCitas, actualizarCitaService, crearCita } from '../services/citas.service';
import { getTodosHorariosProfesionales, getProfesionales, getServicios } from '../services/admin.service';
import { getPacientes, crearPaciente } from '../services/pacientes.service';
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

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
  const [buscarPaciente, setBuscarPaciente] = useState('');
const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
const [modoNuevoPaciente, setModoNuevoPaciente] = useState(false);
const [formNuevoPaciente, setFormNuevoPaciente] = useState({ nombre: '', telefono: '', carnet: '', edad: '' });
  const [guardandoCita, setGuardandoCita] = useState(false);

  const [formCita, setFormCita] = useState({
    sesion: '1',
    modalidad: 'presencial',
    estado: 'pendiente',
    monto: '',
    metodo_pago: 'efectivo',
    servicio_id: '',
    notas: '',
  });

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
        getCitas(),
        getTodosHorariosProfesionales(),
        getProfesionales(),
        getServicios(),
        getPacientes(),
      ]);
      setCitas(citasData);
      setHorariosProf(horariosData);
      setProfesionales(profsData);
      setServicios(serviciosData);
      setPacientes(pacientesData);
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

  function horariosProfDia(diaNombre: string) {
    if (!profSeleccionado) return [];
    return horariosProf.filter(h =>
      h.user_id === profSeleccionado.id && h.dia === diaNombre
    );
  }

  function citasProfDia(offset: number) {
    if (!profSeleccionado) return [];
    const fecha = getFechaDia(offset);
    const fechaStr = fecha.toISOString().split('T')[0];
    return citas
      .filter(c => c.fecha.startsWith(fechaStr) && c.profesional_id === profSeleccionado.id)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  function estaEnHorario(hora: string, diaNombre: string): boolean {
    const horarios = horariosProfDia(diaNombre);
    return horarios.some(h => {
      const inicio = h.hora_inicio?.slice(0, 5);
      const fin = h.hora_fin?.slice(0, 5);
      return hora >= inicio && hora < fin;
    });
  }

  function citaEnHora(hora: string, offset: number) {
    return citasProfDia(offset).find(c => c.hora?.slice(0, 5) === hora);
  }

  function horasDelProf(): string[] {
    if (!profSeleccionado) return [];
    const horas = new Set<string>();
    DIAS_SEMANA.forEach(dia => {
      const horarios = horariosProfDia(dia);
      horarios.forEach(h => {
        const inicio = parseInt(h.hora_inicio?.slice(0, 2));
        const fin = parseInt(h.hora_fin?.slice(0, 2));
        for (let i = inicio; i < fin; i++) {
          horas.add(`${String(i).padStart(2, '0')}:00`);
        }
      });
    });
    return Array.from(horas).sort();
  }

  function abrirModalNuevaCita(hora: string, offset: number) {
  const fecha = getFechaDia(offset);
  setModalNuevaCita({ hora, fecha: fecha.toISOString().split('T')[0] });
  setPacienteSeleccionado(null);
  setBuscarPaciente('');
  setModoNuevoPaciente(false);
  setFormNuevoPaciente({ nombre: '', telefono: '', carnet: '', edad: '' });
  setFormCita({
    sesion: '1',
    modalidad: 'presencial',
    estado: 'pendiente',
    monto: '',
    metodo_pago: 'efectivo',
    servicio_id: '',
    notas: '',
  });
}

  async function guardarNuevaCita(e: React.FormEvent) {
  e.preventDefault();
  try {
    setGuardandoCita(true);

    let datosPaciente: any = {};

    if (modoNuevoPaciente) {
      if (!formNuevoPaciente.nombre) {
        alert('El nombre del paciente es obligatorio');
        return;
      }
      datosPaciente = {
        paciente_nombre: formNuevoPaciente.nombre,
        paciente_telefono: formNuevoPaciente.telefono || null,
        paciente_carnet: formNuevoPaciente.carnet || null,
        paciente_edad: formNuevoPaciente.edad || null,
      };
    } else {
      if (!pacienteSeleccionado) {
        alert('Selecciona un paciente');
        return;
      }
      datosPaciente = {
        paciente_nombre: pacienteSeleccionado.nombre,
        paciente_telefono: pacienteSeleccionado.telefono || null,
        paciente_carnet: pacienteSeleccionado.carnet || null,
        paciente_edad: pacienteSeleccionado.edad || null,
      };
    }
const payload = {
  ...datosPaciente,
  professional_id: profSeleccionado.id,
  area_id: profSeleccionado.area_id,
  fecha: modalNuevaCita.fecha,
  hora: modalNuevaCita.hora,
  sesion: formCita.sesion || '1ra',
  modalidad: formCita.modalidad,
  estado: formCita.estado,
};
console.log('PAYLOAD:', JSON.stringify(payload));
    await crearCita({
      ...datosPaciente,
      professional_id: profSeleccionado.id,
area_id: profSeleccionado.area_id || profesionales.find(p => p.id === profSeleccionado.id)?.area_id,      fecha: modalNuevaCita.fecha,
      hora: modalNuevaCita.hora,
      sesion: formCita.sesion || '1ra',
      modalidad: formCita.modalidad,
      estado: formCita.estado,
      monto: formCita.estado === 'confirmada' ? (formCita.monto || null) : null,
      metodo_pago: formCita.estado === 'confirmada' ? formCita.metodo_pago : null,
      estado_pago: formCita.estado === 'confirmada' ? 'pagado' : null,
      servicio_nombre: formCita.servicio_id
        ? serviciosDelArea.find(s => String(s.id) === formCita.servicio_id)?.nombre || null
        : null,
    });

    setModalNuevaCita(null);
    await cargarDatos();
  } catch (err: any) {
    alert(err.response?.data?.mensaje || 'Error al crear cita');
  } finally {
    setGuardandoCita(false);
  }
}

  async function marcarAsistencia(id: number, asistio: boolean) {
    try {
      await actualizarCitaService(id, { asistio });
      await cargarDatos();
      if (citaSeleccionada?.id === id) {
        setCitaSeleccionada({ ...citaSeleccionada, asistio });
      }
    } catch (err) {
      console.error(err);
    }
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

  const profTieneHorarios = profSeleccionado
    ? horariosProf.some(h => h.user_id === profSeleccionado.id)
    : false;

  const todasHoras = horasDelProf();

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre?.toLowerCase().includes(buscarPaciente.toLowerCase()) ||
    p.carnet?.toLowerCase().includes(buscarPaciente.toLowerCase())
  ).slice(0, 6);

  const serviciosDelArea = servicios.filter(s =>
    s.area_id === profSeleccionado?.area_id
  );

  const esAreaConServicios = profSeleccionado &&
    profSeleccionado.area_nombre?.toLowerCase() !== 'zumba' &&
    profSeleccionado.area_nombre?.toLowerCase() !== 'gerontologia';

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📅 Agenda</h1>
          {profSeleccionado ? (
            <p className="text-sm text-gray-500">
              {profSeleccionado.area_emoji} {profSeleccionado.nombre} — {rangoLabel}
            </p>
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
                    <button
                      onClick={() => setAreaExpandida(areaExpandida === area ? '' : area)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
                    >
                      <span className="text-xs font-semibold text-gray-700">{data.emoji} {area}</span>
                      <span className="text-gray-400 text-xs">{areaExpandida === area ? '▲' : '▼'}</span>
                    </button>
                    {areaExpandida === area && (
                      <div className="bg-gray-50 divide-y">
                        {data.profesionales.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => setProfSeleccionado(p)}
                            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-emerald-50 transition-colors ${
                              profSeleccionado?.id === p.id
                                ? 'bg-emerald-100 text-emerald-700 font-semibold border-l-2 border-emerald-500'
                                : 'text-gray-600'
                            }`}
                          >
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
                        {tieneDia && !esHoy && (
                          <p className="text-[9px] text-gray-400">
                            {horariosDia[0].hora_inicio?.slice(0,5)}-{horariosDia[horariosDia.length-1].hora_fin?.slice(0,5)}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {todasHoras.map(hora => (
                    <>
                      <div key={`hora-${hora}`} className="flex items-center justify-end pr-2">
                        <span className="text-[10px] text-gray-400 font-medium">{hora}</span>
                      </div>
                      {DIAS_SEMANA.map((dia, idx) => {
                        const enHorario = estaEnHorario(hora, dia);
                        const cita = citaEnHora(hora, idx);
                        return (
                          <div
                            key={`${dia}-${hora}`}
                            className={`h-12 rounded-lg mb-0.5 border transition-all ${
                              cita
                                ? `cursor-pointer ${
                                    cita.estado === 'confirmada' ? 'bg-emerald-100 border-emerald-400 hover:bg-emerald-200' :
                                    cita.estado === 'pendiente'  ? 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200' :
                                    'bg-red-100 border-red-400 hover:bg-red-200'
                                  }`
                                : enHorario
                                ? 'bg-blue-50 border-blue-200 border-dashed hover:bg-blue-100 cursor-pointer'
                                : 'border-transparent'
                            }`}
                            onClick={() => {
                              if (cita) setCitaSeleccionada(cita);
                              else if (enHorario) abrirModalNuevaCita(hora, idx);
                            }}
                          >
                            {cita && (
                              <div className="p-1 h-full overflow-hidden">
                                <p className="text-[10px] font-bold text-gray-700">{cita.hora?.slice(0,5)}</p>
                                <p className="text-[10px] text-gray-800 truncate font-medium">{cita.paciente_nombre}</p>
                                <p className="text-[9px] text-gray-500 truncate">{cita.area_emoji} {cita.area_nombre}</p>
                              </div>
                            )}
                            {!cita && enHorario && (
                              <div className="h-full flex items-center justify-center">
                                <span className="text-[9px] text-blue-400 font-medium">+ Nueva cita</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>

                <div className="flex gap-4 mt-3 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-200 border-dashed inline-block"></span>Disponible</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400 inline-block"></span>Confirmada</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400 inline-block"></span>Pendiente</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-400 inline-block"></span>Cancelada</span>
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
          <h3 className="text-lg font-bold text-gray-800">Nueva cita</h3>
          <p className="text-xs text-gray-500">
            {profSeleccionado.area_emoji} {profSeleccionado.nombre} — {new Date(modalNuevaCita.fecha + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })} · {modalNuevaCita.hora}
          </p>
        </div>
        <button type="button" onClick={() => setModalNuevaCita(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
      </div>

      <div className="p-4 space-y-4">

       {/* Paciente */}
<div>
  <div className="flex justify-between items-center mb-2">
    <label className="text-xs font-semibold text-gray-600">Paciente</label>
    <button
      type="button"
      onClick={() => { setModoNuevoPaciente(!modoNuevoPaciente); setPacienteSeleccionado(null); setBuscarPaciente(''); }}
      className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
    >
      {modoNuevoPaciente ? '← Buscar existente' : '+ Nuevo paciente'}
    </button>
  </div>

  {modoNuevoPaciente ? (
    <div className="space-y-2 p-3 bg-gray-50 rounded-xl border">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500">Nombre completo *</label>
          <input
            type="text" required
            value={formNuevoPaciente.nombre}
            onChange={e => setFormNuevoPaciente({ ...formNuevoPaciente, nombre: e.target.value })}
            className="w-full border rounded-lg p-2 text-sm mt-0.5"
            placeholder="Nombre y apellido"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500">Telefono</label>
          <input
            type="text"
            value={formNuevoPaciente.telefono}
            onChange={e => setFormNuevoPaciente({ ...formNuevoPaciente, telefono: e.target.value })}
            className="w-full border rounded-lg p-2 text-sm mt-0.5"
            placeholder="Ej: 70000000"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500">Carnet</label>
          <input
            type="text"
            value={formNuevoPaciente.carnet}
            onChange={e => setFormNuevoPaciente({ ...formNuevoPaciente, carnet: e.target.value })}
            className="w-full border rounded-lg p-2 text-sm mt-0.5"
            placeholder="CI"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500">Edad</label>
          <input
            type="number"
            value={formNuevoPaciente.edad}
            onChange={e => setFormNuevoPaciente({ ...formNuevoPaciente, edad: e.target.value })}
            className="w-full border rounded-lg p-2 text-sm mt-0.5"
            placeholder="Años"
          />
        </div>
      </div>
    </div>
  ) : pacienteSeleccionado ? (
    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
      <div>
        <p className="text-sm font-medium text-gray-800">{pacienteSeleccionado.nombre}</p>
        <p className="text-xs text-gray-500">
          {pacienteSeleccionado.carnet && `CI: ${pacienteSeleccionado.carnet}`}
          {pacienteSeleccionado.telefono && ` · ${pacienteSeleccionado.telefono}`}
        </p>
      </div>
      <button type="button" onClick={() => { setPacienteSeleccionado(null); setBuscarPaciente(''); }} className="text-xs text-red-500 hover:text-red-700">Cambiar</button>
    </div>
  ) : (
    <div>
      <input
        type="text"
        placeholder="Buscar por nombre o carnet..."
        value={buscarPaciente}
        onChange={e => setBuscarPaciente(e.target.value)}
        className="w-full border rounded-lg p-2 text-sm"
        autoFocus
      />
      {buscarPaciente && (
        <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto shadow-sm">
          {pacientesFiltrados.length === 0 ? (
            <p className="p-3 text-xs text-gray-400 text-center">Sin resultados</p>
          ) : (
            pacientesFiltrados.map(p => (
              <button key={p.id} type="button"
                onClick={() => { setPacienteSeleccionado(p); setBuscarPaciente(''); }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-0"
              >
                <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                <p className="text-xs text-gray-400">{p.carnet && `CI: ${p.carnet}`} {p.telefono && `· ${p.telefono}`}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )}
</div>

        {/* Servicio */}
        {esAreaConServicios && serviciosDelArea.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Servicio (opcional)</label>
            <select
              value={formCita.servicio_id}
              onChange={e => {
                const srv = serviciosDelArea.find(s => String(s.id) === e.target.value);
                setFormCita({ ...formCita, servicio_id: e.target.value, monto: srv?.costo || formCita.monto });
              }}
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="">Sin servicio especifico</option>
              {serviciosDelArea.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nombre} {s.costo ? `— Bs ${s.costo}` : ''} {s.duracion_min ? `(${s.duracion_min} min)` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sesion y modalidad */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Sesion #</label>
            <input
              type="number" min="1"
              value={formCita.sesion}
              onChange={e => setFormCita({ ...formCita, sesion: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Modalidad</label>
            <select value={formCita.modalidad} onChange={e => setFormCita({ ...formCita, modalidad: e.target.value })} className="w-full border rounded-lg p-2 text-sm">
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
              <option value="domicilio">Domicilio</option>
            </select>
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Estado de la cita</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormCita({ ...formCita, estado: 'pendiente' })}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                formCita.estado === 'pendiente'
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-xs font-bold text-gray-700">Reserva</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Aun no confirma pago</p>
            </button>
            <button
              type="button"
              onClick={() => setFormCita({ ...formCita, estado: 'confirmada' })}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                formCita.estado === 'confirmada'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-xs font-bold text-gray-700">Confirmada</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Pago realizado</p>
            </button>
          </div>
        </div>

        {/* Campos de pago — solo si confirmada */}
        {formCita.estado === 'confirmada' && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Monto (Bs)</label>
              <input
                type="number" placeholder="0"
                value={formCita.monto}
                onChange={e => setFormCita({ ...formCita, monto: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Metodo de pago</label>
              <select value={formCita.metodo_pago} onChange={e => setFormCita({ ...formCita, metodo_pago: e.target.value })} className="w-full border rounded-lg p-2 text-sm bg-white">
                <option value="efectivo">Efectivo</option>
                <option value="qr">QR</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Notas (opcional)</label>
          <textarea
            value={formCita.notas}
            onChange={e => setFormCita({ ...formCita, notas: e.target.value })}
            className="w-full border rounded-lg p-2 text-sm"
            rows={2}
            placeholder="Observaciones..."
          />
        </div>
      </div>

      <div className="p-4 border-t flex gap-2 sticky bottom-0 bg-white">
        <button type="button" onClick={() => setModalNuevaCita(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
       <button type="submit" disabled={guardandoCita || (!pacienteSeleccionado && !modoNuevoPaciente)} className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm hover:bg-emerald-700 disabled:opacity-50">
  {guardandoCita ? 'Guardando...' : 'Crear cita'}
</button>
      </div>
    </form>
  </div>
)}

      {/* Modal detalle cita */}
      {citaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4" onClick={() => setCitaSeleccionada(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{citaSeleccionada.paciente_nombre}</h3>
                <p className="text-xs text-gray-500">
                  {new Date(citaSeleccionada.fecha).toLocaleDateString('es')} - {citaSeleccionada.hora?.slice(0,5)}
                </p>
              </div>
              <button onClick={() => setCitaSeleccionada(null)} className="text-gray-400 hover:text-gray-600 text-2xl">x</button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Area:</span>
                <span className="font-medium">{citaSeleccionada.area_emoji} {citaSeleccionada.area_nombre}</span>
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
                    className={`flex-1 py-2 rounded-lg text-xs font-medium ${citaSeleccionada.asistio === true ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                  >
                    ✓ Asistio
                  </button>
                  <button
                    onClick={() => marcarAsistencia(citaSeleccionada.id, false)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium ${citaSeleccionada.asistio === false ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  >
                    x No asistio
                  </button>
                </div>
              </div>
            )}

            <button onClick={() => setCitaSeleccionada(null)} className="w-full mt-4 px-4 py-2 border rounded-lg text-gray-600 text-sm hover:bg-gray-50">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}