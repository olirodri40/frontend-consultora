import { useState, useEffect } from 'react';
import { getDashboardData } from '../services/reportes.service';
import { actualizarCitaService } from '../services/citas.service';
import {
  Calendar, CheckCircle, XCircle,
  Clock, Users, DollarSign, Activity, Dumbbell, HeartHandshake,
  Bell, User, FileText, Award, MapPin, Music, Heart, MessageCircle,
} from 'lucide-react';


import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────
// Dashboard principal
// ─────────────────────────────────────────────
export default function Dashboard() {
   const { usuario } = useAuth();
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState<'hoy' | 'manana'>('hoy');

  const fechaLabel = new Date().toLocaleDateString('es', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      const res = await getDashboardData();
      console.log('📊 Datos del dashboard:', res);
      setData(res);
    } catch (err) { console.error('❌ Error al cargar datos:', err);  }
    finally { setCargando(false); }
  }

  async function marcarAsistencia(id: number, asistio: boolean) {
    try {
      const nuevoValor = asistio;
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

       const generarMensajeWhatsApp = (cita: any, cuando: 'hoy' | 'mañana' = 'hoy', nombrePaciente?: string) => {
    const numeroSesion = cita.sesion && cita.total_sesiones 
      ? (cita.sesion === cita.total_sesiones ? 'última' : `${cita.sesion}da`)
      : '';
    const nombre = nombrePaciente || cita.paciente_nombre;
    const mensaje = `Hola ${nombre}, te recordamos tu cita de ${cita.area_nombre}${numeroSesion ? ` (${numeroSesion} sesión)` : ''} ${cuando} a las ${cita.hora?.slice(0, 5)} con ${cita.profesional_nombre}. ¡Te esperamos!`;
    
    return encodeURIComponent(mensaje);
  };

  // ── Todos los pacientes de una cita: el titular de la fila + sus compañeros de grupo ──
  function participantesDeCita(cita: any): any[] {
    const propio = {
      patient_id: cita.patient_id,
      nombre: cita.paciente_nombre,
      telefono: cita.paciente_telefono,
      contacto_nombre: cita.paciente_contacto_nombre,
      contacto_telefono: cita.paciente_contacto_telefono,
      contacto_relacion: cita.paciente_contacto_relacion,
    };
    const companeros = Array.isArray(cita.companeros) ? cita.companeros : [];
    return [propio, ...companeros];
  }

  // ── Nombre a mostrar: "Juan" si es individual, "Juan + María" si es grupal ──
  function nombreCitaDisplay(cita: any): string {
    return participantesDeCita(cita).map(p => p.nombre).filter(Boolean).join(' + ');
  }

  // ── Deduplica una lista de citas para mostrar UNA sola tarjeta por grupo (mismo grupo_id) ──
  function agruparCitasPorGrupo(citasArr: any[]): any[] {
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

  // ── Todas las filas (una por paciente) que pertenecen al mismo grupo, para marcar asistencia por persona ──
  function filasDelGrupo(cita: any, todasCitas: any[]): any[] {
    if (!cita.grupo_id) return [cita];
    return todasCitas.filter(c => c.grupo_id === cita.grupo_id);
  }

  // ── Mensaje dirigido al contacto de emergencia: menciona a TODOS los pacientes de la cita ──
  const generarMensajeContacto = (cita: any, cuando: 'hoy' | 'mañana' = 'hoy') => {
    const participantes = participantesDeCita(cita);
    const nombres = participantes.map(p => p.nombre).filter(Boolean).join(' y ');
    const verbo = participantes.length > 1 ? 'tienen' : 'tiene';
    const mensaje = `Hola, le recordamos que ${nombres} ${verbo} una cita de ${cita.area_nombre} ${cuando} a las ${cita.hora?.slice(0, 5)} con ${cita.profesional_nombre}. ¡Le esperamos!`;
    return encodeURIComponent(mensaje);
  };

  // ── Chips de WhatsApp: uno por cada paciente con teléfono propio, y uno más por cada
  // contacto de emergencia distinto (puede haber más de uno si cada paciente tiene el suyo) ──
  function renderContactosCita(cita: any, cuando: 'hoy' | 'mañana') {
    if (usuario?.rol === 'profesional') return null;
    const participantes = participantesDeCita(cita);
    const conTelefono = participantes.filter(p => p.telefono);
    const contactosUnicos = new Map<string, any>();
    participantes.forEach(p => {
      if (p.contacto_telefono && !contactosUnicos.has(p.contacto_telefono)) {
        contactosUnicos.set(p.contacto_telefono, p);
      }
    });

    if (conTelefono.length === 0 && contactosUnicos.size === 0) {
      return (
        <span className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-1 rounded-lg border border-gray-200 whitespace-nowrap">
          Sin teléfono
        </span>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-1 justify-end">
        {conTelefono.map((p, idx) => (
  <button
    key={`p-${p.patient_id || idx}`}
    onClick={() => abrirWhatsApp(p.telefono, generarMensajeWhatsApp(cita, cuando, p.nombre))}
    className="relative p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all shadow-sm hover:shadow-md"
    title={`WhatsApp a ${p.nombre}`}
  >
    <MessageCircle size={14} />
    {participantes.length > 1 && (
  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gray-800 text-white text-[7px] font-bold flex items-center justify-center border border-white leading-none">
    {p.nombre?.charAt(0).toUpperCase()}
  </span>
)}
  </button>
))}
        {Array.from(contactosUnicos.values()).map((p, idx) => (
          <button
            key={`c-${idx}`}
            onClick={() => abrirWhatsApp(p.contacto_telefono, generarMensajeContacto(cita, cuando))}
            className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
            title={`Contacto de emergencia${p.contacto_nombre ? `: ${p.contacto_nombre}` : ''}${p.contacto_relacion ? ` (${p.contacto_relacion})` : ''}`}
          >
            <Users size={14} />
          </button>
        ))}
      </div>
    );
  }

// Función para limpiar y formatear número de teléfono boliviano
const formatearTelefonoBolivia = (telefono: string): string => {
  // Eliminar espacios, guiones, paréntesis y cualquier caracter no numérico
  let numeroLimpio = telefono.replace(/\D/g, '');
  
  // Si el número empieza con 00, eliminarlo
  if (numeroLimpio.startsWith('00')) {
    numeroLimpio = numeroLimpio.slice(2);
  }
  
  // Si ya tiene el código de país 591, usarlo directamente
  if (numeroLimpio.startsWith('591')) {
    // Verificar que tenga 11 dígitos (591 + 8 dígitos)
    return numeroLimpio;
  }
  
  // Si empieza con 0, eliminarlo (ej: 071234567 -> 71234567)
  if (numeroLimpio.startsWith('0')) {
    numeroLimpio = numeroLimpio.slice(1);
  }
  
  // Agregar código de país +591
  return `591${numeroLimpio}`;
};

// Función para detectar si es dispositivo móvil
const esDispositivoMovil = () => {
  return /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
};

const abrirWhatsApp = (telefono: string, mensaje: string) => {
  const telefonoCompleto = formatearTelefonoBolivia(telefono);
  const esMovil = esDispositivoMovil();
  
  if (esMovil) {
    // Opción 1: WhatsApp normal
    const whatsappNormal = `whatsapp://send?phone=${telefonoCompleto}&text=${mensaje}`;
    
    // Opción 2: WhatsApp Business
    const whatsappBusiness = `whatsapp://send?phone=${telefonoCompleto}&text=${mensaje}&app=business`;
    
    // Mostrar diálogo de selección (si quieres control total)
    // Nota: El sistema Android/iOS mostrará opciones automáticamente
    window.location.href = whatsappNormal;
    
    // Fallback por si no tiene WhatsApp
    setTimeout(() => {
      const webUrl = `https://wa.me/${telefonoCompleto}?text=${mensaje}`;
      window.open(webUrl, '_blank');
    }, 2000);
    
  } else {
    // En PC: WhatsApp Web
    const url = `https://web.whatsapp.com/send?phone=${telefonoCompleto}&text=${mensaje}`;
    window.open(url, '_blank');
  }
};

  // ── Habilita marcar asistencia solo 30 min después de la hora de la cita ──
  function asistenciaHabilitada(hora: string | undefined): boolean {
    if (!hora) return false;
    const [h, m] = hora.slice(0, 5).split(':').map(Number);
    const limite = new Date();
    limite.setHours(h, m + 30, 0, 0);
    return new Date() >= limite;
  }

  function horaHabilitacion(hora: string | undefined): string {
    if (!hora) return '';
    const [h, m] = hora.slice(0, 5).split(':').map(Number);
    const limite = new Date();
    limite.setHours(h, m + 30, 0, 0);
    return limite.toTimeString().slice(0, 5);
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

  const { citasHoy, citasManana, bloqueosHoy = [], bloqueosManana = [], ingresosHoy, ingresosMes, ciclosCompletos, profHoy, pacientesActivos, sesionesActivas } = data;

  const confirmadas  = citasHoy.filter((c: any) => c.estado === 'confirmada');
  const reservas     = citasHoy.filter((c: any) => c.estado === 'pendiente');
  const asistieron   = citasHoy.filter((c: any) => c.asistio === true).length;
  const noAsistieron = citasHoy.filter((c: any) => c.asistio === false).length;
  const sinMarcar    = confirmadas.filter((c: any) => c.asistio === null).length;

  const DIAS_JS: Record<number, string> = {
    0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miercoles',
    4: 'Jueves', 5: 'Viernes', 6: 'Sabado',
  };
  const diaNombre = DIAS_JS[new Date().getDay()];

  return (
    <div className="space-y-5 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
       
       
      </div>

      {/* ──────── TARJETAS DE MÉTRICAS ──────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Citas Hoy */}
        <div className="bg-white rounded-2xl border border-[#efedf0] p-4 text-center hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Calendar size={16} className="text-purple-500" />
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Citas hoy</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">{citasHoy.length}</p>
        </div>

        {/* Citas Mañana */}
        <div className="bg-white rounded-2xl border border-[#efedf0] p-4 text-center hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Calendar size={16} className="text-emerald-500" />
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Citas mañana</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{citasManana.length}</p>
        </div>

        {/* Pacientes Activos */}
        <div className="bg-white rounded-2xl border border-[#efedf0] p-4 text-center hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users size={16} className="text-blue-500" />
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Pacientes activos</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{pacientesActivos || 0}</p>
        </div>

        {/* Sesiones Activas */}
        <div className="bg-white rounded-2xl border border-[#efedf0] p-4 text-center hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Activity size={16} className="text-orange-500" />
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Sesiones activas</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{sesionesActivas || 0}</p>
        </div>
      </div>

      {/* Ciclos que terminan hoy */}
      {ciclosCompletos.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="px-4 sm:px-5 py-4 flex flex-wrap items-center gap-2">
            <Bell size={18} className="text-amber-700 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-800">Pacientes que completan su ciclo hoy</p>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">{ciclosCompletos.length}</span>
          </div>
          <div>
            {ciclosCompletos.map((c: any, idx: number) => (
              <div key={idx} className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-t border-amber-100">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-amber-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.paciente_nombre}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{c.area_nombre}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="text-xs text-gray-500">Ciclo {c.ciclo}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="text-xs text-gray-500">{c.total_sesiones} sesiones</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="text-xs text-gray-500 truncate">{c.profesional_nombre}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-100 px-3 py-1.5 rounded-full flex-shrink-0">
                  <Award size={12} className="text-amber-700" />
                  <span className="text-[11px] font-medium text-amber-700 whitespace-nowrap">Última sesión</span>
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
          <div className="p-4 sm:p-5 flex flex-wrap items-center gap-1 border-b border-gray-100">
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

          {(tabActiva === 'hoy' ? bloqueosHoy : bloqueosManana).length > 0 && (
            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-amber-50/60 space-y-1.5">
              {(tabActiva === 'hoy' ? bloqueosHoy : bloqueosManana).map((b: any) => (
                <div key={b.id} className="flex items-center gap-2 text-xs text-amber-800">
                  <span className="font-bold">{b.hora_inicio?.slice(0, 5)}–{b.hora_fin?.slice(0, 5)}</span>
                  <span>{b.profesional_nombre} no disponible — {b.nombre} ({b.tipo})</span>
                </div>
              ))}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
                        {tabActiva === 'hoy' ? (
              citasHoy.length === 0 ? (
                <p className="text-center py-12 text-gray-400 text-sm">Sin citas para hoy</p>
              ) : agruparCitasPorGrupo(citasHoy).map((c: any) => {
                const participantes = participantesDeCita(c);
                const esGrupal = participantes.length > 1;
                const filas = filasDelGrupo(c, citasHoy);
                return (
                <div key={c.id} className="p-3 hover:bg-gray-50/50 border-b border-gray-50 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-1.5 h-10 rounded-full shrink-0 ${c.estado === 'confirmada' ? 'bg-purple-500' : 'bg-yellow-400'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-xs font-bold text-gray-700">{c.hora?.slice(0, 5)}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${c.estado === 'confirmada' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {c.estado === 'confirmada' ? 'Confirmada' : 'Reserva'}
                          </span>
                          {c.sesion && c.total_sesiones > 1 && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                              S{c.sesion}/{c.total_sesiones}
                            </span>
                          )}
                          {esGrupal && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Users size={9} /> Grupo · {participantes.length}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 truncate">{nombreCitaDisplay(c)}</p>
                        <p className="text-[10px] text-gray-500 truncate">{c.area_emoji} {c.area_nombre} · {c.profesional_nombre}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 shrink-0">
                      {renderContactosCita(c, 'hoy')}
                    </div>
                  </div>

                  {c.estado === 'confirmada' && (() => {
                    const habilitada = asistenciaHabilitada(c.hora);
                    const tituloDeshabilitado = `Disponible desde las ${horaHabilitacion(c.hora)}`;
                    return (
                      <div className="mt-2 pl-4 flex flex-col gap-1.5">
                        {filas.map(fila => (
                          <div key={fila.id} className="flex items-center justify-between gap-2">
                            {esGrupal && <span className="text-[10px] text-gray-500 truncate">{fila.paciente_nombre}</span>}
                            <div className="flex items-center gap-1 ml-auto">
                              <button
                                onClick={() => habilitada && marcarAsistencia(fila.id, true)}
                                disabled={!habilitada}
                                title={!habilitada ? tituloDeshabilitado : ''}
                                className={`p-1 rounded-lg border transition-all ${!habilitada ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-300 border-gray-200' : fila.asistio === true ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}
                              >
                                <CheckCircle size={12} />
                              </button>
                              <button
                                onClick={() => habilitada && marcarAsistencia(fila.id, false)}
                                disabled={!habilitada}
                                title={!habilitada ? tituloDeshabilitado : ''}
                                className={`p-1 rounded-lg border transition-all ${!habilitada ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-300 border-gray-200' : fila.asistio === false ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                              >
                                <XCircle size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              );})
            ) : (
                                            citasManana.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Sin citas para mañana</p>
              ) : agruparCitasPorGrupo(citasManana).map((c: any) => {
                const participantes = participantesDeCita(c);
                const esGrupal = participantes.length > 1;
                return (
                <div key={c.id} className="p-3 hover:bg-gray-50/50 border-b border-gray-50 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-1.5 h-10 rounded-full shrink-0 ${c.estado === 'confirmada' ? 'bg-emerald-500' : 'bg-yellow-400'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-gray-700">{c.hora?.slice(0, 5)}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${c.estado === 'confirmada' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {c.estado === 'confirmada' ? 'Confirmada' : 'Reserva'}
                          </span>
                          {esGrupal && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Users size={9} /> Grupo · {participantes.length}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 truncate">{nombreCitaDisplay(c)}</p>
                        <p className="text-[10px] text-gray-500 truncate">{c.area_emoji} {c.area_nombre} · {c.profesional_nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {renderContactosCita(c, 'mañana')}
                    </div>
                  </div>
                </div>
              );})
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">
          {/* Profesionales hoy */}
          <div className="bg-white rounded-3xl border border-[#efedf0] overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-4 sm:p-5 flex items-center gap-2 border-b border-gray-100">
              <Users size={18} className="text-gray-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-gray-700">Profesionales hoy</p>
            </div>
            <div>
              {profHoy.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Sin actividad hoy</p>
              ) : profHoy.map((pr: any, idx: number) => (
                <div key={idx} className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{pr.profesional_nombre}</p>
                    <p className="text-xs text-gray-400 truncate">{pr.area_nombre}</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full flex-shrink-0">{pr.total_citas} citas</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reservas pendientes */}
          {reservas.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-4 sm:p-5 flex items-center gap-2 border-b border-yellow-100">
                <Clock size={16} className="text-yellow-700 flex-shrink-0" />
                <p className="text-sm font-semibold text-yellow-800">Reservas sin confirmar ({reservas.length})</p>
              </div>
              <div>
                {reservas.map((c: any) => (
                  <div key={c.id} className="px-4 sm:px-5 py-3 border-b border-yellow-100 last:border-0">
                    <p className="text-sm font-medium text-gray-800">{c.paciente_nombre}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{c.hora?.slice(0, 5)}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                      <Activity size={10} className="text-yellow-600 flex-shrink-0" />
                      <span className="text-xs text-gray-500">{c.area_nombre}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumen asistencia */}
          <div className="bg-white rounded-3xl border border-[#efedf0] p-4 sm:p-5 hover:shadow-xl transition-all duration-300">
            <p className="text-sm font-semibold text-gray-700 mb-4">Resumen asistencia</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Asistieron</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">{asistieron}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <XCircle size={16} className="text-red-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">No asistieron</span>
                </div>
                <span className="text-sm font-bold text-red-500">{noAsistieron}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400 flex-shrink-0" />
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
          <div className="p-4 sm:p-5 border-b border-[#f7f3f7] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Dumbbell size={20} className="text-purple-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-purple-800">Zumba</p>
            </div>
          
          </div>

    

          <div className="divide-y divide-gray-100">
  {(data.zumba.horarios || []).length === 0 ? (
    <p className="text-center py-4 text-gray-400 text-xs">Sin horarios configurados</p>
  ) : (
    Object.entries(
      (data.zumba.horarios || []).reduce((acc: any, h: any) => {
        (acc[h.dia] = acc[h.dia] || []).push(h);
        return acc;
      }, {})
    ).map(([dia, horas]: any) => (
      <div key={dia} className={`px-4 sm:px-5 py-2.5 ${dia === diaNombre ? 'bg-pink-50' : ' '}`}>
        <div className="flex items-center gap-1.5 mb-1 ">
          {dia === diaNombre && <MapPin size={10} className="text-pink-600 flex-shrink-0 " />}
          <p className={`text-[10px] font-semibold ${dia === diaNombre ? 'text-pink-700' : 'text-gray-500'}`}>
            {dia}{dia === diaNombre && ' (hoy)'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 ">
          {horas.map((h: any, idx: number) => (
            <span key={idx} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
              <Music size={10} />
              {h.hora_inicio?.slice(0, 5)} - {h.hora_fin?.slice(0, 5)}
            </span>
          ))}
        </div>
      </div>
    ))
  )}
</div>
        </div>

        {/* Gerontología */}
        <div className="bg-white rounded-3xl border border-[#efedf0] overflow-hidden h-full flex flex-col hover:shadow-xl transition-all duration-300">
          <div className="p-4 sm:p-5 border-b border-[#efedf0] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HeartHandshake size={20} className="text-orange-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-orange-800">Gerontología</p>
            </div>
            
          </div>


         <div className="divide-y divide-gray-100">
  {(data.geronto.actividades || []).length === 0 ? (
    <p className="text-center py-4 text-gray-400 text-xs">Sin actividades configuradas</p>
  ) : (
    Object.entries(
      (data.geronto.actividades || []).reduce((acc: any, a: any) => {
        (acc[a.dia] = acc[a.dia] || []).push(a);
        return acc;
      }, {})
    ).map(([dia, acts]: any) => (
      <div key={dia} className={`px-4 sm:px-5 py-2.5 ${dia === diaNombre ? 'bg-emerald-50' : ''}`}>
        <div className="flex items-center gap-1.5 mb-1">
          {dia === diaNombre && <MapPin size={10} className="text-emerald-600 flex-shrink-0" />}
          <p className={`text-[10px] font-semibold ${dia === diaNombre ? 'text-emerald-700' : 'text-gray-500'}`}>
            {dia}{dia === diaNombre && ' (hoy)'}
          </p>
        </div>
        <div className="space-y-1">
          {acts.map((act: any, idx: number) => (
            <div key={idx} className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
              <Heart size={10} className="text-emerald-500 flex-shrink-0" />
              <span className="font-medium truncate">{act.nombre}</span>
              <span className="text-gray-400 whitespace-nowrap">{act.hora_inicio?.slice(0, 5)} - {act.hora_fin?.slice(0, 5)}</span>
              <span className="ml-auto text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">Bs {act.precio}</span>
            </div>
          ))}
        </div>
      </div>
    ))
  )}
</div>
        </div>
      </div>
    </div>
  );
}