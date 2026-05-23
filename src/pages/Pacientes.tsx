import { useState, useEffect } from 'react';
import { getPacientes, getPacientePorId } from '../services/pacientes.service';
import { actualizarCitaService, eliminarCitaService, crearMultiplesCitas } from '../services/citas.service';
import { getServicios, getTodosHorariosProfesionales, getProfesionales } from '../services/admin.service';

const ORDINAL = ['1ra','2da','3ra','4ta','5ta','6ta','7ma','8va','9na','10ma'];
const DIAS_JS: Record<number, string> = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sabado' };

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [horariosProf, setHorariosProf] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [areaFiltro, setAreaFiltro] = useState<string>('todas'); // 🆕 Filtro por área
  const [expandido, setExpandido] = useState<number | null>(null);
  const [citasPorPaciente, setCitasPorPaciente] = useState<Record<number, any[]>>({});
  const [reagendandoCita, setReagendandoCita] = useState<any>(null);
  const [formReagendar, setFormReagendar] = useState({ fecha: '', hora: '' });
  const [modalEditarCita, setModalEditarCita] = useState<any>(null);
  const [formEditarCita, setFormEditarCita] = useState<any>({});
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [modalNuevoCiclo, setModalNuevoCiclo] = useState<any>(null);
  const [formNuevoCiclo, setFormNuevoCiclo] = useState<any>({});
  const [sesionesNuevoCiclo, setSesionesNuevoCiclo] = useState<{fecha: string, hora: string}[]>([]);
  const [guardandoCiclo, setGuardandoCiclo] = useState(false);

  const [ciclosExpandidos, setCiclosExpandidos] = useState<Record<string, boolean>>({});

  useEffect(() => { cargarTodo(); }, []);

  // 🆕 Obtener áreas únicas de los pacientes
 // 🆕 Obtener áreas únicas de TODOS los pacientes (basado en sus citas)
const areasUnicas = [...new Set(
  pacientes.flatMap(p => {
    const citas = citasPorPaciente[p.id] || [];
    return citas.map(c => c.area_nombre).filter(Boolean);
  })
)].sort();

  async function cargarTodo() {
    try {
      setCargando(true);
      const [data, srvs, horarios, profs] = await Promise.all([
        getPacientes(), getServicios(), getTodosHorariosProfesionales(), getProfesionales()
      ]);
      setPacientes(data);
      aplicarFiltros(data, busqueda, areaFiltro);
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
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  }

  // 🆕 Función para aplicar filtros
 function aplicarFiltros(data: any[], termino: string, area: string) {
  let filtrados = [...data];
  
  // Filtrar por término de búsqueda
  if (termino) {
    const t = termino.toLowerCase();
    filtrados = filtrados.filter(p => 
      p.nombre?.toLowerCase().includes(t) ||
      p.carnet?.toLowerCase().includes(t) ||
      p.telefono?.toLowerCase().includes(t)
    );
  }
  
  // Filtrar por área (busca en las citas del paciente)
  if (area !== 'todas') {
    filtrados = filtrados.filter(p => {
      const citas = citasPorPaciente[p.id] || [];
      return citas.some(c => c.area_nombre === area);
    });
  }
  
  setPacientesFiltrados(filtrados);
}

  async function cargarPacientes(termino?: string) {
    try {
      const data = await getPacientes(termino);
      setPacientes(data);
      aplicarFiltros(data, termino || busqueda, areaFiltro);
      const citasMap: Record<number, any[]> = {};
      await Promise.all(data.map(async (p: any) => {
        try {
          const detalle = await getPacientePorId(p.id);
          citasMap[p.id] = detalle.citas;
        } catch (err) { console.error(err); }
      }));
      setCitasPorPaciente(citasMap);
    } catch (err) { console.error(err); }
  }

  // 🆕 Cambiar filtro de área
  function cambiarArea(area: string) {
    setAreaFiltro(area);
    aplicarFiltros(pacientes, busqueda, area);
  }

  async function recargarCitasPaciente(pacienteId: number) {
    const data = await getPacientePorId(pacienteId);
    setCitasPorPaciente(prev => ({ ...prev, [pacienteId]: data.citas }));
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

  async function guardarReagendar(pacienteId: number) {
    if (!formReagendar.fecha || !formReagendar.hora) { alert('Selecciona fecha y hora'); return; }
    try {
      await actualizarCitaService(reagendandoCita.id, { fecha: formReagendar.fecha, hora: formReagendar.hora });
      setReagendandoCita(null);
      setFormReagendar({ fecha: '', hora: '' });
      await recargarCitasPaciente(pacienteId);
    } catch (err) { console.error(err); }
  }

  async function guardarEdicionCitaCompleta(pacienteId: number) {
    try {
      setGuardandoEdicion(true);
      const citasDelPaciente = citasPorPaciente[pacienteId] || [];
      const cicloActual = modalEditarCita.citas?.[0]?.ciclo || 1;
      const citasCiclo = citasDelPaciente.filter(c => c.ciclo === cicloActual);
      await Promise.all(citasCiclo.map(c =>
        actualizarCitaService(c.id, {
          estado: formEditarCita.estado,
          monto_total: formEditarCita.monto_total || null,
          monto_pagado: formEditarCita.monto_pagado || null,
          metodo_pago: formEditarCita.metodo_pago || null,
          total_sesiones: formEditarCita.total_sesiones,
          modalidad: formEditarCita.modalidad,
          servicio_nombre: formEditarCita.servicio_nombre || null,
          notas: formEditarCita.notas || null,
          paciente_nombre: formEditarCita.nombre || null,
          paciente_telefono: formEditarCita.telefono || null,
          paciente_carnet: formEditarCita.carnet || null,
          paciente_edad: formEditarCita.edad || null,
        })
      ));
      setModalEditarCita(null);
      await recargarCitasPaciente(pacienteId);
      await cargarPacientes(busqueda || undefined);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al actualizar');
    } finally { setGuardandoEdicion(false); }
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
      area_emoji: cs[0].area_emoji,
      profesional_nombre: cs[0].profesional_nombre,
      citas: cs.sort((a, b) => a.fecha?.localeCompare(b.fecha)),
    })).sort((a, b) => a.area_id - b.area_id || a.ciclo - b.ciclo);
  }

  // 🆕 Usar pacientesFiltrados para el total
  const totalIngresos = pacientesFiltrados.reduce((sum, p) => sum + Number(p.total_pagado || 0), 0);

  function asistenciaLabel(asistio: boolean | null) {
    if (asistio === true) return <span className="text-emerald-600 font-medium">✅ Asistio</span>;
    if (asistio === false) return <span className="text-red-500 font-medium">❌ No asistio</span>;
    return <span className="text-gray-400 font-medium">⏳ Pendiente</span>;
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

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border mb-4">
        <div className="p-5 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">👥 Pacientes</h1>
            <p className="text-xs text-gray-500 mt-0.5">Psicología · Fisioterapia · Medicina · y más</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-gray-500">
              Total: <span className="font-bold text-gray-700">{pacientesFiltrados.length}</span> pacientes
              {areaFiltro !== 'todas' && <span className="text-xs text-gray-400"> ({areaFiltro})</span>}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm font-semibold text-green-700">
              💰 Ingresos: Bs {totalIngresos.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="px-5 pb-4">
          <form onSubmit={handleBuscar} className="flex gap-2 mb-3">
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="🔍 Buscar por nombre, carnet o telefono..."
              className="w-full md:w-96 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Buscar</button>
            {busqueda && (
              <button type="button" onClick={() => { setBusqueda(''); cargarPacientes(); }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">Limpiar</button>
            )}
          </form>

          {/* 🆕 BOTONES DE FILTRO POR ÁREA */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => cambiarArea('todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                areaFiltro === 'todas' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              🌐 Todas
            </button>
            {areasUnicas.map(area => (
              <button
                key={area}
                onClick={() => cambiarArea(area)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  areaFiltro === area 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="text-center py-12 text-gray-500">Cargando pacientes...</div>
      ) : pacientesFiltrados.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {areaFiltro !== 'todas' 
            ? `No hay pacientes en ${areaFiltro}` 
            : 'No se encontraron pacientes'}
        </div>
      ) : (
        <div className="space-y-3">
          {pacientesFiltrados.map(p => {
            const citas = citasPorPaciente[p.id] || [];
            const abierto = expandido === p.id;
            const gruposCiclos = agruparCitasPorCiclo(citas);
            const totalSesionesCompletadas = citas.filter(c => c.asistio === true).length;
            const totalSesiones = citas.length;
            const totalPagadoReal = gruposCiclos.reduce((sum, g) => {
              const primeraCita = g.citas.find(c => c.sesion?.toString() === '1') || g.citas[0];
              return sum + Number(primeraCita?.monto_pagado || 0);
            }, 0);
            const inicial = p.nombre?.charAt(0).toUpperCase() || '?';
            const primerasCita = citas[0];

            return (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Cabecera */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer hover:bg-gray-50/50"
                  onClick={() => toggleExpand(p)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg shrink-0">
                      {inicial}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {p.nombre} {p.edad && <span className="text-xs text-gray-400 font-normal">{p.edad} años</span>}
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-0.5">
                        {p.carnet && <span>🪪 {p.carnet}</span>}
                        {p.telefono && <span>📞 {p.telefono}</span>}
                        {primerasCita && (
                          <>
                            <span>👩‍⚕️ {primerasCita.profesional_nombre}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700">
                              {primerasCita.area_emoji} {primerasCita.area_nombre}
                            </span>
                          </>
                        )}
                        {gruposCiclos.length > 1 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700">
                            {gruposCiclos.length} ciclos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">{totalSesionesCompletadas}/{totalSesiones} sesiones</div>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1 flex">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${totalSesiones > 0 ? Math.round((totalSesionesCompletadas/totalSesiones)*100) : 0}%` }} />
                        <div className="h-full bg-red-400 transition-all" style={{ width: `${totalSesiones > 0 ? Math.round((citas.filter(c => c.asistio === false).length/totalSesiones)*100) : 0}%` }} />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600 text-sm">Bs {Number(p.total_pagado).toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400">total pagado</div>
                    </div>

                    <button onClick={async e => {
                      e.stopPropagation();
                      setModalNuevoCiclo(p);
                      setFormNuevoCiclo({
                        modalidad: 'presencial', estado: 'confirmada',
                        monto_total: '', monto_pagado: '', metodo_pago: 'efectivo',
                        servicio_nombre: '', notas: '', profesional_id: null, area_id: null,
                      });
                      setSesionesNuevoCiclo([{ fecha: '', hora: '' }]);
                    }} className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium hover:bg-purple-100">
                      ➕ Nuevo ciclo
                    </button>

                    <button onClick={async e => {
                      e.stopPropagation();
                      let citasActuales = citasPorPaciente[p.id];
                      if (!citasActuales || citasActuales.length === 0) {
                        await recargarCitasPaciente(p.id);
                        citasActuales = citasPorPaciente[p.id] || [];
                      }
                      const primeraC = citasActuales[0];
                      setModalEditarCita({ ...p, citas: citasActuales });
                      setFormEditarCita({
                        nombre: p.nombre || '', telefono: p.telefono || '',
                        carnet: p.carnet || '', edad: p.edad || '',
                        estado: primeraC?.estado || 'confirmada',
                        modalidad: primeraC?.modalidad || 'presencial',
                        monto_total: primeraC?.monto_total || '',
                        monto_pagado: primeraC?.monto_pagado || '',
                        metodo_pago: primeraC?.metodo_pago || 'efectivo',
                        notas: primeraC?.notas || '',
                        total_sesiones: primeraC?.total_sesiones || 1,
                        servicio_nombre: primeraC?.servicio_nombre || '',
                      });
                    }} className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium hover:bg-emerald-100">
                      ✏️ Editar
                    </button>

                    <button onClick={e => { e.stopPropagation(); eliminarPacienteCompleto(p); }}
                      className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100">
                      🗑 Eliminar
                    </button>

                    <span className="text-gray-400 text-xs">{abierto ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Detalle expandible — ciclos agrupados (SIN CAMBIOS) */}
                {abierto && (
                  <div className="border-t border-gray-100">
                    {gruposCiclos.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Sin citas registradas</p>
                    ) : (
                      gruposCiclos.map(grupo => {
                        const sesionesCompletadas = grupo.citas.filter(c => c.asistio === true).length;
                        const sesionesNoAsistio = grupo.citas.filter(c => c.asistio === false).length;
                        const totalSes = grupo.citas.length;
                        const progresoCiclo = totalSes > 0 ? Math.round((sesionesCompletadas / totalSes) * 100) : 0;
                        const progresoNoAsistio = totalSes > 0 ? Math.round((sesionesNoAsistio / totalSes) * 100) : 0;
                        const primeraCita = grupo.citas.find(c => c.sesion?.toString() === '1') || grupo.citas[0];
                        const montoCiclo = Number(primeraCita?.monto_pagado || 0);
                        const cicloKey = `${p.id}-${grupo.key}`;
                        const esUltimoCiclo = grupo.ciclo === Math.max(...gruposCiclos.map(g => g.ciclo));
                        const cicloAbierto = cicloKey in ciclosExpandidos ? ciclosExpandidos[cicloKey] : esUltimoCiclo;

                        async function eliminarCiclo(pacienteId: number, cicloNum: number, areaId: number) {
                          if (!confirm(`¿Eliminar el Ciclo ${cicloNum} y todas sus sesiones?`)) return;
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
                          <div key={grupo.key} className="border-b border-gray-100 last:border-0">
                            <div className="px-4 py-2 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                              onClick={() => setCiclosExpandidos(prev => ({ ...prev, [cicloKey]: !cicloAbierto }))}>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-700">
                                  {grupo.area_emoji} {grupo.area_nombre} — Ciclo {grupo.ciclo}
                                </span>
                                <span className="text-[10px] text-gray-500">· {grupo.profesional_nombre}</span>
                                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  Bs {montoCiclo.toFixed(2)}
                                </span>
                                <button onClick={e => { e.stopPropagation(); eliminarCiclo(p.id, grupo.ciclo, grupo.area_id); }}
                                  className="px-1.5 py-0.5 bg-red-50 text-red-500 border border-red-200 rounded text-[9px] hover:bg-red-100">
                                  🗑 Ciclo
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500">{sesionesCompletadas}/{totalSes} sesiones</span>
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progresoCiclo}%` }} />
                                  <div className="h-full bg-red-400 transition-all" style={{ width: `${progresoNoAsistio}%` }} />
                                </div>
                                <span className="text-gray-400 text-xs">{cicloAbierto ? '▲' : '▼'}</span>
                              </div>
                            </div>

                            {cicloAbierto && (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-gray-50/50">
                                    <tr className="text-[10px] text-gray-500 uppercase">
                                      <th className="px-3 py-2 text-left">Sesion</th>
                                      <th className="px-3 py-2 text-left">Fecha</th>
                                      <th className="px-3 py-2 text-left">Hora</th>
                                      <th className="px-3 py-2 text-left">Asistencia</th>
                                      <th className="px-3 py-2 text-left">Estado</th>
                                      <th className="px-3 py-2 text-left">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {grupo.citas.map((c, idx) => (
                                      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50 text-xs">
                                        <td className="px-3 py-2 font-medium text-gray-700">{ORDINAL[idx] || `${idx+1}ra`}</td>
                                        <td className="px-3 py-2 text-gray-600">
                                          {c.fecha ? new Date(c.fecha.toString().slice(0,10) + 'T00:00:00').toLocaleDateString('es', { day:'numeric', month:'short', year:'numeric' }) : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">{c.hora?.slice(0,5)}</td>
                                        <td className="px-3 py-2">{asistenciaLabel(c.asistio)}</td>
                                        <td className="px-3 py-2">
                                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                            c.estado === 'confirmada' ? 'bg-emerald-100 text-emerald-700' :
                                            c.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                          }`}>{c.estado}</span>
                                        </td>
                                        <td className="px-3 py-2">
                                          <div className="flex gap-1 flex-wrap">
                                            <button onClick={() => marcarAsistencia(p.id, c.id, true)}
                                              className={`px-1.5 py-0.5 rounded text-[9px] border ${c.asistio === true ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}>✅</button>
                                            <button onClick={() => marcarAsistencia(p.id, c.id, false)}
                                              className={`px-1.5 py-0.5 rounded text-[9px] border ${c.asistio === false ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>❌</button>
                                            <button onClick={() => { setReagendandoCita(c); setFormReagendar({ fecha: '', hora: '' }); }}
                                              className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100">📅</button>
                                            {c.estado === 'pendiente' && (
                                              <button onClick={() => eliminarCitaPendiente(p.id, c.id)}
                                                className="px-1.5 py-0.5 rounded text-[9px] bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">🗑</button>
                                            )}
                                          </div>
                                          {reagendandoCita?.id === c.id && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100 space-y-1">
                                              <p className="text-[10px] font-semibold text-blue-700">Reagendar</p>
                                              <input type="date" value={formReagendar.fecha}
                                                onChange={e => setFormReagendar({ fecha: e.target.value, hora: '' })}
                                                className="w-full border rounded p-1 text-[10px]" />
                                              {formReagendar.fecha && (() => {
                                                const horasDisp = horasProfParaDia(c.profesional_id, formReagendar.fecha);
                                                return horasDisp.length === 0 ? (
                                                  <p className="text-[10px] text-red-400 bg-red-50 p-1 rounded">El profesional no trabaja este dia</p>
                                                ) : (
                                                  <div className="flex flex-wrap gap-1 mt-1">
                                                    {horasDisp.map(h => (
                                                      <button key={h} type="button"
                                                        onClick={() => setFormReagendar({ ...formReagendar, hora: h })}
                                                        className={`px-2 py-0.5 rounded text-[9px] border font-medium ${formReagendar.hora === h ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                                                        {h}
                                                      </button>
                                                    ))}
                                                  </div>
                                                );
                                              })()}
                                              {formReagendar.fecha && formReagendar.hora && (
                                                <button onClick={() => guardarReagendar(p.id)}
                                                  className="w-full py-1 bg-blue-600 text-white rounded text-[10px] hover:bg-blue-700 mt-1">
                                                  Confirmar → {formReagendar.hora}
                                                </button>
                                              )}
                                              <button onClick={() => setReagendandoCita(null)}
                                                className="w-full py-1 border rounded text-[10px] text-gray-500 hover:bg-gray-50">Cancelar</button>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {gruposCiclos.length > 1 && (
                      <div className="px-4 py-3 bg-emerald-50 border-t flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700">Total acumulado todos los ciclos</span>
                        <span className="text-sm font-bold text-emerald-700">Bs {Number(p.total_pagado).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal editar completo */}
      {modalEditarCita && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4"
          onClick={() => setModalEditarCita(null)}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-800">✏️ Editar — {modalEditarCita.nombre}</h3>
                <p className="text-xs text-gray-500">
                  {modalEditarCita.citas?.[0]?.area_emoji} {modalEditarCita.citas?.[0]?.area_nombre} · {modalEditarCita.citas?.[0]?.profesional_nombre}
                </p>
              </div>
              <button onClick={() => setModalEditarCita(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Datos del paciente</p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Nombre completo" value={formEditarCita.nombre}
                      onChange={e => setFormEditarCita({ ...formEditarCita, nombre: e.target.value })}
                      className="border rounded-lg p-2 text-sm" />
                    <input type="number" placeholder="Edad" value={formEditarCita.edad}
                      onChange={e => setFormEditarCita({ ...formEditarCita, edad: e.target.value })}
                      className="border rounded-lg p-2 text-sm" />
                  </div>
                  <input type="text" placeholder="Telefono" value={formEditarCita.telefono}
                    onChange={e => setFormEditarCita({ ...formEditarCita, telefono: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm" />
                  <input type="text" placeholder="Carnet de identidad" value={formEditarCita.carnet}
                    onChange={e => setFormEditarCita({ ...formEditarCita, carnet: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm" />
                </div>
              </div>

              {servicios.filter(s => s.area_id === modalEditarCita.citas?.[0]?.area_id).length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Servicio</label>
                  <select value={formEditarCita.servicio_nombre || ''}
                    onChange={e => setFormEditarCita({ ...formEditarCita, servicio_nombre: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm">
                    <option value="">Sin servicio especifico</option>
                    {servicios.filter(s => s.area_id === modalEditarCita.citas?.[0]?.area_id).map(s => (
                      <option key={s.id} value={s.nombre}>{s.nombre} {s.costo ? `— Bs ${s.costo}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Modalidad</label>
                <select value={formEditarCita.modalidad}
                  onChange={e => setFormEditarCita({ ...formEditarCita, modalidad: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm">
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                  <option value="domicilio">Domicilio</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Estado</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormEditarCita({ ...formEditarCita, estado: 'pendiente' })}
                    className={`p-2.5 rounded-xl border-2 text-left ${formEditarCita.estado === 'pendiente' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
                    <p className="text-xs font-bold text-gray-700">🕐 Reserva</p>
                  </button>
                  <button type="button" onClick={() => setFormEditarCita({ ...formEditarCita, estado: 'confirmada' })}
                    className={`p-2.5 rounded-xl border-2 text-left ${formEditarCita.estado === 'confirmada' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                    <p className="text-xs font-bold text-gray-700">✓ Confirmada</p>
                  </button>
                </div>
              </div>

              {formEditarCita.estado === 'confirmada' && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
                  <p className="text-xs font-semibold text-emerald-700">💰 Datos de pago</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500">Precio total (Bs)</label>
                      <input type="number" value={formEditarCita.monto_total}
                        onChange={e => setFormEditarCita({ ...formEditarCita, monto_total: e.target.value })}
                        className="w-full border rounded-lg p-2 text-sm bg-white mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">Cantidad sesiones</label>
                      <input type="number" min="1" value={formEditarCita.total_sesiones}
                        onChange={e => setFormEditarCita({ ...formEditarCita, total_sesiones: Number(e.target.value) })}
                        className="w-full border rounded-lg p-2 text-sm bg-white mt-0.5" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Monto pagado (Bs)</label>
                    <input type="number" value={formEditarCita.monto_pagado}
                      onChange={e => setFormEditarCita({ ...formEditarCita, monto_pagado: e.target.value })}
                      className="w-full border rounded-lg p-2 text-sm bg-white mt-0.5" />
                    {formEditarCita.monto_total && formEditarCita.monto_pagado && (
                      <div className={`text-xs font-medium px-2 py-1 rounded-lg mt-1 ${Number(formEditarCita.monto_pagado) >= Number(formEditarCita.monto_total) ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {Number(formEditarCita.monto_pagado) >= Number(formEditarCita.monto_total) ? '✓ Pago completo' : `Pendiente: Bs ${Number(formEditarCita.monto_total) - Number(formEditarCita.monto_pagado)}`}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Metodo de pago</label>
                    <MetodoPagoSelector value={formEditarCita.metodo_pago} onChange={v => setFormEditarCita({ ...formEditarCita, metodo_pago: v })} />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Notas</label>
                <textarea value={formEditarCita.notas}
                  onChange={e => setFormEditarCita({ ...formEditarCita, notas: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm" rows={2} placeholder="Observaciones..." />
              </div>
            </div>

            <div className="p-4 border-t flex gap-2 sticky bottom-0 bg-white">
              <button onClick={() => setModalEditarCita(null)}
                className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => guardarEdicionCitaCompleta(modalEditarCita.id)}
                disabled={guardandoEdicion}
                className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm hover:bg-emerald-700 disabled:opacity-50">
                {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}