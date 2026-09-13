// src/components/ui/SesionGrupalAsistenciaModal.tsx
// Se abre al hacer clic en una celda de sesión grupal en la grilla de Agenda.
// Muestra quién ya está anotado ese día puntual y permite sumar a alguien más
// (marcando si se cobra como "grupal" o excepcionalmente como "individual").
// Cada asistente queda como una cita 100% independiente: su propio costo, su
// propio pago — no son "acompañantes" entre sí, son personas que no se conocen.
import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Loader2, UserPlus, Users, Eye } from 'lucide-react';
import { getOcupacionSesionGrupal, inscribirEnSesionGrupal } from '../../services/sesionesGrupales.service';
import { getPacientes } from '../../services/pacientes.service';

export default function SesionGrupalAsistenciaModal({
  sesionId,
  fecha,
  nombreServicio,
  citasDirectas,
  onClose,
  onCambio,
  onEditarAsistente,
}: {
  sesionId: number | null;
  fecha: string;
  nombreServicio: string;
  citasDirectas?: any[];
  onClose: () => void;
  onCambio?: () => void;
  onEditarAsistente?: (appointmentId: number) => void;
}) {
  // Modo "huérfano": la plantilla de sesión grupal ya se borró, pero quedaron
  // citas independientes anotadas a esa hora. Solo se listan/editan, no se
  // puede inscribir gente nueva ni hay concepto de capacidad.
  const esHuerfano = sesionId == null;
  const [cargando, setCargando] = useState(true);
  const [capacidad, setCapacidad] = useState(0);
  const [asistentes, setAsistentes] = useState<any[]>([]);
  const [costoIndividual, setCostoIndividual] = useState<number | null>(null);
  const [costoGrupal, setCostoGrupal] = useState<number | null>(null);
  const [servicioIndividualNombre, setServicioIndividualNombre] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pacienteIdElegido, setPacienteIdElegido] = useState<number | null>(null);
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [individual, setIndividual] = useState(false);
  const [costo, setCosto] = useState('');
  const [costoTocado, setCostoTocado] = useState(false);
  const [montoPagado, setMontoPagado] = useState('');
  const [montoPagadoTocado, setMontoPagadoTocado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const buscarTimeout = useRef<any>(null);

  const cargar = useCallback(async () => {
    if (esHuerfano) {
      setAsistentes(citasDirectas || []);
      setCapacidad((citasDirectas || []).length);
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const data = await getOcupacionSesionGrupal(sesionId as number, fecha);
      setCapacidad(data.capacidad);
      setAsistentes(data.asistentes || []);
      setCostoIndividual(data.costo_individual ?? null);
      setCostoGrupal(data.costo_grupal ?? null);
      setServicioIndividualNombre(data.servicio_individual_nombre || '');
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [sesionId, fecha, esHuerfano, citasDirectas]);

  useEffect(() => { cargar(); }, [cargar]);

  // Precarga el costo sugerido (grupal o individual) salvo que el usuario ya
  // lo haya tocado a mano.
  useEffect(() => {
    if (costoTocado) return;
    const sugerido = individual ? costoIndividual : (costoGrupal ?? costoIndividual);
    setCosto(sugerido != null ? String(sugerido) : '');
  }, [individual, costoIndividual, costoGrupal, costoTocado]);

  // Por defecto asume que se cobró todo el costo en el momento — si el
  // recepcionista lo cambia a mano, queda un pago parcial/pendiente.
  useEffect(() => {
    if (montoPagadoTocado) return;
    setMontoPagado(costo);
  }, [costo, montoPagadoTocado]);

  function onCambiaNombre(valor: string) {
    setNombre(valor);
    setPacienteIdElegido(null);
    if (buscarTimeout.current) clearTimeout(buscarTimeout.current);
    if (valor.trim().length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }
    buscarTimeout.current = setTimeout(async () => {
      try {
        const resultado = await getPacientes(valor.trim());
        setSugerencias(resultado || []);
        setMostrarSugerencias(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);
  }

  function elegirSugerencia(p: any) {
    setNombre(p.nombre);
    setTelefono(p.telefono || '');
    setPacienteIdElegido(p.id);
    setSugerencias([]);
    setMostrarSugerencias(false);
  }

  function abrirFormulario() {
    setMostrarForm(true);
    setCostoTocado(false);
  }

  function cerrarFormulario() {
    setMostrarForm(false);
    setNombre('');
    setTelefono('');
    setPacienteIdElegido(null);
    setIndividual(false);
    setCosto('');
    setCostoTocado(false);
    setMontoPagado('');
    setMontoPagadoTocado(false);
    setError('');
  }

  async function inscribir() {
    setError('');
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setGuardando(true);
    try {
      await inscribirEnSesionGrupal(sesionId as number, fecha, {
        paciente_nombre: nombre.trim(),
        paciente_telefono: telefono.trim() || undefined,
        patient_id: pacienteIdElegido || undefined,
        individual,
        costo: costo !== '' ? Number(costo) : undefined,
        monto_pagado: montoPagado !== '' ? Number(montoPagado) : undefined,
      });
      cerrarFormulario();
      cargar();
      if (onCambio) onCambio();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje || 'No se pudo registrar la inscripción');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Users size={16} className="text-[#A000D1]" /> {nombreServicio}
          </h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{fecha.split('-').reverse().join('/')}</p>

        {cargando ? (
          <div className="flex justify-center py-8 text-gray-400"><Loader2 size={18} className="animate-spin" /></div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-600">
                {esHuerfano ? `Anotados: ${asistentes.length}` : `Inscritos: ${asistentes.length}/${capacidad}`}
              </span>
              {!esHuerfano && asistentes.length < capacidad && !mostrarForm && (
                <button
                  onClick={abrirFormulario}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#A000D1] hover:underline"
                >
                  <UserPlus size={13} /> Agregar persona
                </button>
              )}
            </div>
            {esHuerfano && (
              <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg p-2 mb-3">
                Este servicio grupal ya fue eliminado. Aquí solo puedes ver/editar/eliminar las citas que quedaron anotadas.
              </p>
            )}

            <div className="space-y-1.5 mb-4">
              {asistentes.length === 0 ? (
                <p className="text-xs text-gray-400">Todavía no hay nadie anotado.</p>
              ) : (
                asistentes.map((a) => {
                  const pendiente = Number(a.monto || 0) - Number(a.monto_pagado || 0);
                  return (
                  <div key={a.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <span className="text-xs font-medium text-gray-700">{a.paciente_nombre}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">
                        Bs {a.monto_pagado ?? a.monto} / {a.monto}
                        {pendiente > 0 && <span className="text-amber-600 ml-1">(debe {pendiente})</span>}
                      </span>
                      {onEditarAsistente && (
                        <button
                          onClick={() => onEditarAsistente(a.id)}
                          title="Editar esta cita"
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-violet-50 text-[#A000D1] hover:bg-violet-100"
                        >
                          <Eye size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })
              )}
            </div>
            <p className="text-[10px] text-gray-400 -mt-3 mb-4">
              Cada persona queda como paciente y pago independientes — no se conocen entre sí.
            </p>

            {!esHuerfano && asistentes.length >= capacidad && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5 mb-3">
                Esta sesión ya está llena para esta fecha.
              </p>
            )}

            {!esHuerfano && mostrarForm && (
              <div className="border border-gray-200 rounded-xl p-3.5 space-y-2.5">
                <div className="relative">
                  <input
                    value={nombre}
                    onChange={(e) => onCambiaNombre(e.target.value)}
                    onFocus={() => sugerencias.length > 0 && setMostrarSugerencias(true)}
                    onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
                    placeholder="Nombre del paciente"
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                  />
                  {mostrarSugerencias && sugerencias.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {sugerencias.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => elegirSugerencia(p)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-violet-50 flex flex-col"
                        >
                          <span className="font-medium text-gray-700">{p.nombre}</span>
                          {p.telefono && <span className="text-gray-400">{p.telefono}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {pacienteIdElegido && (
                    <p className="text-[10px] text-emerald-600 mt-1">Paciente existente seleccionado</p>
                  )}
                </div>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Teléfono (opcional)"
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                />
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={individual} onChange={(e) => setIndividual(e.target.checked)} />
                  Cobrar como sesión individual (no grupal) — ej. vino solo esta vez
                </label>
                {individual && servicioIndividualNombre && (
                  <p className="text-[10px] text-violet-600 bg-violet-50 rounded-lg p-2">
                    Esta cita quedará registrada con el servicio: <b>{servicioIndividualNombre}</b>
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                      Costo total (Bs)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={costo}
                      onChange={(e) => { setCosto(e.target.value); setCostoTocado(true); }}
                      className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                      Costo pagado (Bs)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={montoPagado}
                      onChange={(e) => { setMontoPagado(e.target.value); setMontoPagadoTocado(true); }}
                      className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                    />
                  </div>
                </div>
                {montoPagado !== '' && costo !== '' && Number(montoPagado) < Number(costo) && (
                  <p className="text-[10px] text-amber-600">
                    Queda pendiente Bs {(Number(costo) - Number(montoPagado)).toFixed(2)}
                  </p>
                )}
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={cerrarFormulario}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={inscribir}
                    disabled={guardando}
                    className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] disabled:opacity-50 text-white text-xs font-semibold rounded-lg py-2 flex items-center justify-center gap-1.5"
                  >
                    {guardando ? <Loader2 size={13} className="animate-spin" /> : null}
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
