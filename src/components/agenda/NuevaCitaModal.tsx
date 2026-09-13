// Modal de "Nueva reserva" de Agenda.tsx — extraído tal cual (misma lógica,
// mismos nombres) para reducir el tamaño de Agenda.tsx. Recibe todo el estado
// y las funciones que necesita como props explícitas (sin renombrar nada).
import { formatFecha } from '../../utils/fechas';
import { capitalizarTexto } from '../../utils/texto';
import { MetodoPagoSelector } from './MetodoPagoSelector';

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/20 focus:border-[#A000D1] transition-all';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1.5';

export function NuevaCitaModal({
  modalNuevaCita,
  setModalNuevaCita,
  profSeleccionado,
  guardarNuevaCita,
  modoNuevoPaciente,
  setModoNuevoPaciente,
  pacienteSeleccionado,
  setPacienteSeleccionado,
  buscarPaciente,
  setBuscarPaciente,
  formPaciente,
  setFormPaciente,
  buscarPacientesMientrasEscribe,
  sugerenciasPacientes,
  setSugerenciasPacientes,
  mostrarSugerencias,
  setMostrarSugerencias,
  sugerenciasContacto,
  setSugerenciasContacto,
  mostrarSugerenciasContacto,
  setMostrarSugerenciasContacto,
  pacientesFiltrados,
  acompanantes,
  agregarAcompanante,
  actualizarAcompanante,
  quitarAcompanante,
  sugerenciasAcompanante,
  setSugerenciasAcompanante,
  mostrarSugerenciasAcomp,
  setMostrarSugerenciasAcomp,
  pacientes,
  formCita,
  setFormCita,
  seccionesArea,
  seccionSeleccionadaNueva,
  setSeccionSeleccionadaNueva,
  esAreaConServicios,
  serviciosDelArea,
  horasProfParaDia,
  areaSeleccionadaFiltro,
  isSlotDisponiblePorFecha,
  horaOcupadaPorGeronto,
  slotsNecesariosNueva,
  getSlotsConsecutivosLibres,
  servicioSeleccionadoActual,
  sesionesAdicionales,
  setSesionesAdicionales,
  calcularProximaSesion,
  guardandoCita,
}: any) {
  if (!modalNuevaCita) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <form onSubmit={guardarNuevaCita} className="modal-card" style={{ background: '#fff', borderRadius: '28px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', border: '1px solid #efedf0' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10, borderRadius: '28px 28px 0 0' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>Nueva reserva</h3>
            <p style={{ fontSize: '11px', color: '#374151', marginTop: '2px' }}>{profSeleccionado.nombre} · {formatFecha(modalNuevaCita.fecha)} · {modalNuevaCita.hora}</p>
          </div>
          <button type="button" onClick={() => setModalNuevaCita(null)} style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#f3f4f6', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>✕</button>
        </div>

        <div className="modal-body-desktop modal-grid" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className={labelCls}>Datos del paciente</label>
              <button type="button" onClick={() => { setModoNuevoPaciente(!modoNuevoPaciente); setPacienteSeleccionado(null); setBuscarPaciente(''); }}
                style={{ fontSize: '12px', color: '#A000D1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                {modoNuevoPaciente ? '← Buscar existente' : '+ Nuevo paciente'}
              </button>
            </div>
            {modoNuevoPaciente ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Campo NOMBRE CON AUTOCOMPLETADO */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  required
                  value={formPaciente.nombre}
                  onChange={(e) => {
        const valor = e.target.value;
        // ✅ CAMBIA ESTO: Agrega capitalizarTexto
        const valorCapitalizado = capitalizarTexto(valor); // <-- NUEVA LÍNEA
        setFormPaciente({ ...formPaciente, nombre: valorCapitalizado }); // <-- CAMBIA aquí
        setPacienteSeleccionado(null);
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

    {/* SUGERENCIAS DE AUTOCOMPLETADO */}
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
        {sugerenciasPacientes.map((p: any) => (
          <button
            key={p.id}
            type="button"
                           onClick={() => {
            setFormPaciente((prev: any) => ({
              ...prev,
              nombre: p.nombre || '',
              edad: p.edad || '',
              telefono: p.telefono || '',
              carnet: p.carnet || '',
              // 👇 El contacto de emergencia NO se autorellena aquí: es un dato
              // que se ingresa/edita por reserva, no algo que deba copiarse
              // automáticamente solo porque coincide el nombre del paciente.
            }));

              // Guardar referencia del paciente seleccionado
              setPacienteSeleccionado(p);

              // Limpiar sugerencias
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

        {/* Campo EDAD */}
        <input
          type="number"
          placeholder="Edad"
          value={formPaciente.edad}
          onChange={e => setFormPaciente({ ...formPaciente, edad: e.target.value })}
          className={inputCls}
        />
      </div>

      {/* Campo TELÉFONO con autocompletado */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Teléfono"
          value={formPaciente.telefono}
          onChange={(e) => {
            const valor = e.target.value;
            setFormPaciente({ ...formPaciente, telefono: valor });
            const resultados = buscarPacientesMientrasEscribe(valor, 'telefono');
            setSugerenciasPacientes(resultados);
            setMostrarSugerencias(resultados.length > 0 && valor.length >= 2);
          }}
          onFocus={(e) => {
            if (e.target.value.length >= 2) {
              const resultados = buscarPacientesMientrasEscribe(e.target.value, 'telefono');
              setSugerenciasPacientes(resultados);
              setMostrarSugerencias(resultados.length > 0);
            }
          }}
          onBlur={() => {
            setTimeout(() => setMostrarSugerencias(false), 200);
          }}
          className={inputCls}
        />
      </div>

      {/* Campo CARNET con autocompletado */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Carnet de identidad"
          value={formPaciente.carnet}
          onChange={(e) => {
            const valor = e.target.value;
            setFormPaciente({ ...formPaciente, carnet: valor });
            const resultados = buscarPacientesMientrasEscribe(valor, 'carnet');
            setSugerenciasPacientes(resultados);
            setMostrarSugerencias(resultados.length > 0 && valor.length >= 2);
          }}
          onFocus={(e) => {
            if (e.target.value.length >= 2) {
              const resultados = buscarPacientesMientrasEscribe(e.target.value, 'carnet');
              setSugerenciasPacientes(resultados);
              setMostrarSugerencias(resultados.length > 0);
            }
          }}
          onBlur={() => {
            setTimeout(() => setMostrarSugerencias(false), 200);
          }}
          className={inputCls}
        />
      </div>
    </div>
    ) : pacienteSeleccionado ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '14px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>{pacienteSeleccionado.nombre}</p>
                  <p style={{ fontSize: '11px', color: '#374151' }}>{pacienteSeleccionado.carnet && `CI: ${pacienteSeleccionado.carnet}`} {pacienteSeleccionado.telefono && `· ${pacienteSeleccionado.telefono}`}</p>
                </div>
                <button type="button" onClick={() => { setPacienteSeleccionado(null); setBuscarPaciente(''); }} style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Cambiar</button>
              </div>
            ) : (
              <div>
                <input type="text" placeholder="Buscar por nombre o carnet..." value={buscarPaciente} onChange={e => setBuscarPaciente(e.target.value)} className={inputCls} autoFocus />
                {buscarPaciente && (
                  <div style={{ border: '1px solid #f3f4f6', borderRadius: '14px', marginTop: '6px', maxHeight: '144px', overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                    {pacientesFiltrados.length === 0 ? (
                      <p style={{ padding: '12px', fontSize: '12px', color: '#374151', textAlign: 'center' }}>Sin resultados</p>
                    ) : pacientesFiltrados.map((p: any) => (
                      <button key={p.id} type="button" onClick={() => { setPacienteSeleccionado(p); setBuscarPaciente(''); }}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: '#fff', cursor: 'pointer', borderBottom: '1px solid #f9fafb' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>{p.nombre}</p>
                        <p style={{ fontSize: '11px', color: '#374151' }}>{p.carnet && `CI: ${p.carnet}`} {p.telefono && `· ${p.telefono}`}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {modoNuevoPaciente && (
    <div>
      <label className={labelCls}>Contacto de emergencia</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        <input
          type="text"
          placeholder="Relación (ej: Hija)"
          value={formPaciente.contacto_relacion}
          onChange={e => setFormPaciente({ ...formPaciente, contacto_relacion: e.target.value })}
          className={inputCls}
        />

      {/* NOMBRE DEL CONTACTO CON AUTOCOMPLETADO */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Nombre completo del contacto"
          value={formPaciente.contacto_nombre}
          onChange={(e) => {
        const valor = e.target.value;
        // ✅ CAMBIA ESTO: Agrega capitalizarTexto
        const valorCapitalizado = capitalizarTexto(valor); // <-- NUEVA LÍNEA
        setFormPaciente({ ...formPaciente, contacto_nombre: valorCapitalizado }); // <-- CAMBIA aquí
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

          {/* SUGERENCIAS PARA CONTACTO DE EMERGENCIA */}
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
              {sugerenciasContacto.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                // ✅ CORRECTO - Sobrescribe siempre con los datos del paciente seleccionado
                setFormPaciente((prev: any) => ({
                  ...prev,
                  contacto_nombre: p.nombre || '',          // ← SIEMPRE se actualiza
                  contacto_telefono: p.telefono || '',      // ← SIEMPRE se actualiza
                  contacto_relacion: prev.contacto_relacion || p.contacto_relacion || '', // ← Solo si está vacío
                }));
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

        {/* TELÉFONO DEL CONTACTO CON AUTOCOMPLETADO */}
        <div style={{ position: 'relative' }}>
          <input
            type="tel"
            placeholder="Teléfono del contacto"
            value={formPaciente.contacto_telefono}
            onChange={(e) => {
              const valor = e.target.value;
              setFormPaciente({ ...formPaciente, contacto_telefono: valor });
              const resultados = buscarPacientesMientrasEscribe(valor, 'telefono');
              setSugerenciasContacto(resultados);
              setMostrarSugerenciasContacto(resultados.length > 0 && valor.length >= 2);
            }}
            onFocus={(e) => {
              if (e.target.value.length >= 2) {
                const resultados = buscarPacientesMientrasEscribe(e.target.value, 'telefono');
                setSugerenciasContacto(resultados);
                setMostrarSugerenciasContacto(resultados.length > 0);
              }
            }}
            onBlur={() => {
              setTimeout(() => setMostrarSugerenciasContacto(false), 200);
            }}
            className={inputCls}
          />
                </div>
              </div>
            </div>
          )}

          {/* ── ACOMPAÑANTES (2+ pacientes en la misma cita, ej. terapia de pareja) ── */}
          <div className="span-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className={labelCls}>Acompañantes (opcional)</label>
              <button type="button" onClick={agregarAcompanante}
                style={{ fontSize: '12px', color: '#A000D1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                + Agregar paciente
              </button>
            </div>
            {acompanantes.length === 0 ? (
              <p style={{ fontSize: '10px', color: '#374151' }}>Usa esto para citas con más de un paciente en el mismo horario (ej. terapia de pareja o familiar).</p>
            ) : (
              <div className="acompanantes-grid" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {acompanantes.map((a: any, idx: number) => (
                  <div key={idx} style={{ padding: '12px', background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Paciente {idx + 2}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button type="button"
                          onClick={() => actualizarAcompanante(idx, { modo: a.modo === 'nuevo' ? 'existente' : 'nuevo', existente: null, buscar: '' })}
                          style={{ fontSize: '11px', color: '#A000D1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                          {a.modo === 'nuevo' ? '← Buscar existente' : '+ Nuevo paciente'}
                        </button>
                        <button type="button" onClick={() => quitarAcompanante(idx)}
                          style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                          Quitar
                        </button>
                      </div>
                    </div>

                    {a.modo === 'nuevo' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* NOMBRE DEL ACOMPAÑANTE CON AUTOCOMPLETADO */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Nombre completo *"
                        value={a.nuevo.nombre}
                        onChange={(e) => {
      const valor = e.target.value;
      // ✅ CAMBIA ESTO: Agrega capitalizarTexto
      const valorCapitalizado = capitalizarTexto(valor); // <-- NUEVA LÍNEA
      actualizarAcompanante(idx, {
        nuevo: { ...a.nuevo, nombre: valorCapitalizado }, // <-- CAMBIA aquí
        existente: null
      });
      const resultados = buscarPacientesMientrasEscribe(valorCapitalizado, 'nombre');
      setSugerenciasAcompanante((prev: any) => ({ ...prev, [idx]: resultados }));
      setMostrarSugerenciasAcomp((prev: any) => ({ ...prev, [idx]: resultados.length > 0 && valor.length >= 2 }));
    }}
                        onFocus={(e) => {
                          if (e.target.value.length >= 2) {
                            const resultados = buscarPacientesMientrasEscribe(e.target.value, 'nombre');
                            setSugerenciasAcompanante((prev: any) => ({ ...prev, [idx]: resultados }));
                            setMostrarSugerenciasAcomp((prev: any) => ({ ...prev, [idx]: resultados.length > 0 }));
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setMostrarSugerenciasAcomp((prev: any) => ({ ...prev, [idx]: false }));
                          }, 200);
                        }}
                        className={inputCls}
                      />

                      {/* SUGERENCIAS PARA ACOMPAÑANTE */}
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
                          {sugerenciasAcompanante[idx].map((p: any) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                  // ✅ OBTENER EL ACOMPAÑANTE ACTUAL
                  const acompananteActual = a.nuevo || {};

                actualizarAcompanante(idx, {
                  ...a,
                  modo: 'nuevo',
                  nuevo: {
                    nombre: p.nombre || '',
                    telefono: acompananteActual.telefono || p.telefono || '',
                    carnet: acompananteActual.carnet || p.carnet || '',
                    edad: acompananteActual.edad || p.edad || '',
                  },
                  existente: p,
                });

                  setSugerenciasAcompanante((prev: any) => ({ ...prev, [idx]: [] }));
                  setMostrarSugerenciasAcomp((prev: any) => ({ ...prev, [idx]: false }));
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

                    <input type="number" placeholder="Edad" value={a.nuevo.edad}
                      onChange={e => actualizarAcompanante(idx, { nuevo: { ...a.nuevo, edad: e.target.value } })}
                      className={inputCls} />
                    <input type="text" placeholder="Teléfono" value={a.nuevo.telefono}
                      onChange={e => actualizarAcompanante(idx, { nuevo: { ...a.nuevo, telefono: e.target.value } })}
                      className={inputCls} />
                    <input type="text" placeholder="Carnet" value={a.nuevo.carnet}
                      onChange={e => actualizarAcompanante(idx, { nuevo: { ...a.nuevo, carnet: e.target.value } })}
                      className={inputCls} />
                  </div>
                    ) : a.existente ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px' }}>
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>{a.existente.nombre}</p>
                          <p style={{ fontSize: '10px', color: '#374151' }}>{a.existente.carnet && `CI: ${a.existente.carnet}`} {a.existente.telefono && `· ${a.existente.telefono}`}</p>
                        </div>
                        <button type="button" onClick={() => actualizarAcompanante(idx, { existente: null })}
                          style={{ fontSize: '10px', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Cambiar</button>
                      </div>
                    ) : (
                      <div>
                        <input type="text" placeholder="Buscar por nombre o carnet..." value={a.buscar}
                          onChange={e => actualizarAcompanante(idx, { buscar: e.target.value })}
                          className={inputCls} />
                        {a.buscar && (
                          <div style={{ border: '1px solid #f3f4f6', borderRadius: '10px', marginTop: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                            {pacientes.filter((p: any) =>
                              p.nombre?.toLowerCase().includes(a.buscar.toLowerCase()) ||
                              p.carnet?.toLowerCase().includes(a.buscar.toLowerCase())
                            ).slice(0, 5).map((p: any) => (
                              <button key={p.id} type="button"
                                onClick={() => actualizarAcompanante(idx, { existente: p, buscar: '' })}
                                style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: '#fff', cursor: 'pointer', borderBottom: '1px solid #f9fafb' }}>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>{p.nombre}</p>
                                <p style={{ fontSize: '10px', color: '#374151' }}>{p.carnet && `CI: ${p.carnet}`}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="span-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '10px 12px' }}>
              <p style={{ fontSize: '9px', color: '#374151', marginBottom: '2px' }}>Área</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>{profSeleccionado.area_nombre}</p>
            </div>
            <div style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '10px 12px' }}>
              <p style={{ fontSize: '9px', color: '#374151', marginBottom: '2px' }}>Profesional</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>{profSeleccionado.nombre}</p>
            </div>
          </div>

                    <div>
            <label className={labelCls}>Modalidad</label>
            <select value={formCita.modalidad} onChange={e => setFormCita({ ...formCita, modalidad: e.target.value })} className={inputCls}>
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
              <option value="domicilio">Domicilio</option>
            </select>
          </div>

          {seccionesArea.length > 0 && (
            <div className="span-2">
              <label className={labelCls}>Sección <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {seccionesArea.map((sec: any) => (
                  <label key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 6px', borderRadius: '8px' }}>
                    <input
                      type="radio"
                      name="seccion_nueva_cita"
                      required
                      checked={seccionSeleccionadaNueva === sec.id}
                      onChange={() => {
                        setSeccionSeleccionadaNueva(sec.id);
                        setFormCita({ ...formCita, servicio_id: '', servicio_nombre: '' });
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#1f2937' }}>{sec.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

                      {esAreaConServicios && serviciosDelArea.length > 0 && (seccionesArea.length === 0 || seccionSeleccionadaNueva !== '') && (
<div>
<label className={labelCls}>Servicio <span style={{ color: '#ef4444' }}>*</span></label>
<div style={{ position: 'relative' }}>
  <select
    required
    value={formCita.servicio_id}
    onChange={e => {
      const listaServicios = seccionesArea.length > 0
        ? serviciosDelArea.filter((s: any) => s.seccion_id === seccionSeleccionadaNueva)
        : serviciosDelArea;
      const srv = listaServicios.find((s: any) => String(s.id) === e.target.value);
      const precioFinal = srv?.costo_descuento || srv?.costo;
      setFormCita({ ...formCita, servicio_id: e.target.value, servicio_nombre: srv?.nombre || '', monto_total: precioFinal ? String(precioFinal) : formCita.monto_total });
    }}
    className={inputCls}
    style={{ appearance: 'none', paddingRight: '32px' }}
  >
    <option value="">Selecciona un servicio</option>
    {(seccionesArea.length > 0
      ? serviciosDelArea.filter((s: any) => s.seccion_id === seccionSeleccionadaNueva)
      : serviciosDelArea
    )
      .filter((s: any) => s.activo !== false)
      .map((s: any) => (
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


          <div className="span-2" style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '16px', padding: '14px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '2px' }}>Sesión 1 · {formatFecha(modalNuevaCita.fecha)}</p>
            <p style={{ fontSize: '10px', color: '#374151', marginBottom: '10px' }}>Selecciona un horario disponible:</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
               {horasProfParaDia(profSeleccionado.id, modalNuevaCita.fecha, areaSeleccionadaFiltro ?? profSeleccionado.area_id).map((h: string) => {
const ocupadoSlot = !isSlotDisponiblePorFecha(modalNuevaCita.fecha, h, [], profSeleccionado.id, areaSeleccionadaFiltro ?? profSeleccionado.area_id);  // ← AHORA SÍ
const gerontoOcupado = horaOcupadaPorGeronto(modalNuevaCita.fecha, h);
const seleccionada = modalNuevaCita.hora === h;
                return (
                  <button key={h} type="button" disabled={ocupadoSlot}
                    onClick={() => { if (!ocupadoSlot) setModalNuevaCita({ ...modalNuevaCita, hora: h }); }}
                    style={{
                      padding: '5px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                      border: `1px solid ${ocupadoSlot ? '#e5e7eb' : seleccionada ? '#A000D1' : '#e5e7eb'}`,
                      background: ocupadoSlot ? '#f3f4f6' : seleccionada ? '#A000D1' : '#fff',
                      color: ocupadoSlot ? '#9ca3af' : seleccionada ? '#fff' : '#4b5563',
                      cursor: ocupadoSlot ? 'not-allowed' : 'pointer',
                      textDecoration: ocupadoSlot ? 'line-through' : 'none',
                      transition: 'all 0.1s',
                      position: 'relative',
                    }}>
                    {h}
                    {gerontoOcupado.ocupado && (
                      <span style={{ fontSize: '6px', color: '#7c3aed', display: 'block', fontWeight: 400 }}>Geronto</span>
                    )}
                  </button>
                );
              })}
            </div>
            {modalNuevaCita.hora && slotsNecesariosNueva > 1 && (() => {
              const consecutivos = getSlotsConsecutivosLibres(modalNuevaCita.fecha, modalNuevaCita.hora, profSeleccionado.id);
              if (consecutivos >= slotsNecesariosNueva) return null;
              return (
                <p style={{ fontSize: '10px', color: '#c2410c', background: '#fff7ed', padding: '6px 10px', borderRadius: '8px', border: '1px solid #fed7aa', marginTop: '10px' }}>
                  ⚠ Este servicio dura {servicioSeleccionadoActual?.duracion_min} min ({slotsNecesariosNueva} horarios) pero este día solo hay {consecutivos} horario/s{consecutivos === 1 ? '' : 's'} libre{consecutivos === 1 ? '' : 's'} seguida{consecutivos === 1 ? '' : 's'} desde las {modalNuevaCita.hora}. Te recomendamos elegir otro día u horario donde quepan los {slotsNecesariosNueva} horarios completos.
                </p>
              );
            })()}
          </div>

          <div className="span-2">
            <label className={labelCls}>Estado de la cita</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button type="button" onClick={() => setFormCita({ ...formCita, estado: 'pendiente' })}
                style={{ padding: '10px', borderRadius: '14px', border: `2px solid ${formCita.estado === 'pendiente' ? '#fbbf24' : '#e5e7eb'}`, background: formCita.estado === 'pendiente' ? '#fefce8' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>Reserva</p>
                <p style={{ fontSize: '10px', color: '#374151', marginTop: '2px' }}>Sin pago confirmado</p>
              </button>
              <button type="button" onClick={() => setFormCita({ ...formCita, estado: 'confirmada' })}
                style={{ padding: '10px', borderRadius: '14px', border: `2px solid ${formCita.estado === 'confirmada' ? '#A000D1' : '#e5e7eb'}`, background: formCita.estado === 'confirmada' ? '#f5f3ff' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>Confirmada</p>
                <p style={{ fontSize: '10px', color: '#374151', marginTop: '2px' }}>Con pago registrado</p>
              </button>
            </div>
          </div>

          {formCita.estado === 'confirmada' && (
            <div className="span-2" style={{ padding: '14px', background: 'rgba(245,243,255,0.5)', borderRadius: '16px', border: '1px solid #ede9fe', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Datos de pago y sesiones</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#374151', display: 'block', marginBottom: '4px' }}>Precio total (Bs)</label>
                  <input type="number" placeholder="0" value={formCita.monto_total} onChange={e => setFormCita({ ...formCita, monto_total: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#374151', display: 'block', marginBottom: '4px' }}>Cant. sesiones</label>
                  <input type="number" min="1" value={formCita.total_sesiones}

                    onChange={e => {
                      const n = Number(e.target.value);
                      setFormCita({ ...formCita, total_sesiones: n });
                      const extras = n - 1;
                      if (extras > sesionesAdicionales.length) {
                        const nuevas = [...sesionesAdicionales];
                        for (let i = sesionesAdicionales.length; i < extras; i++) {
                          // Sesión 2 = +1 semana, sesión 3 = +2 semanas, etc. (i empieza en 0 → offset i+1)
                          const semanasOffset = i + 1;
                          const sugerencia = calcularProximaSesion(
modalNuevaCita.fecha, modalNuevaCita.hora, semanasOffset, profSeleccionado.id, nuevas, areaSeleccionadaFiltro ?? profSeleccionado.area_id
);
                          nuevas.push(sugerencia);
                        }
                        setSesionesAdicionales(nuevas);
                      } else setSesionesAdicionales(sesionesAdicionales.slice(0, extras));
                    }} className={inputCls} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#374151', display: 'block', marginBottom: '4px' }}>Monto pagado (Bs)</label>
                <input type="number" placeholder="0" value={formCita.monto_pagado} onChange={e => setFormCita({ ...formCita, monto_pagado: e.target.value })} className={inputCls} />
                {formCita.monto_total && formCita.monto_pagado && (
                  <div style={{ fontSize: '11px', fontWeight: 600, padding: '6px 10px', borderRadius: '10px', marginTop: '6px', border: '1px solid', background: Number(formCita.monto_pagado) >= Number(formCita.monto_total) ? '#f5f3ff' : '#fff7ed', color: Number(formCita.monto_pagado) >= Number(formCita.monto_total) ? '#5b21b6' : '#c2410c', borderColor: Number(formCita.monto_pagado) >= Number(formCita.monto_total) ? '#ddd6fe' : '#fed7aa' }}>
                    {Number(formCita.monto_pagado) >= Number(formCita.monto_total) ? 'Pago completo' : `Pendiente: Bs ${Number(formCita.monto_total) - Number(formCita.monto_pagado)}`}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#374151', display: 'block', marginBottom: '6px' }}>Método de pago</label>
                <MetodoPagoSelector value={formCita.metodo_pago} onChange={(v: string) => setFormCita({ ...formCita, metodo_pago: v })} />
              </div>
              {sesionesAdicionales.length > 0 && (
                <div className="sesiones-adicionales-grid" style={{ borderTop: '1px solid #ddd6fe', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Programar sesiones adicionales</p>
                  {sesionesAdicionales.map((s: any, idx: number) => {
                    const horasDisponibles = s.fecha ? horasProfParaDia(profSeleccionado.id, s.fecha, areaSeleccionadaFiltro ?? profSeleccionado.area_id) : [];
                    return (
                      <div key={idx} style={{ padding: '10px', background: '#fff', borderRadius: '12px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Sesión {idx + 2}</p>
                        <input type="date" required value={s.fecha}
                          onChange={e => { const nuevas = [...sesionesAdicionales]; nuevas[idx] = { fecha: e.target.value, hora: '' }; setSesionesAdicionales(nuevas); }}
                          className={inputCls} />
                        {s.fecha && (
                          horasDisponibles.length === 0 ? (
                            <p style={{ fontSize: '10px', color: '#ef4444', background: '#fef2f2', padding: '6px 10px', borderRadius: '8px', border: '1px solid #fecaca' }}>El profesional no trabaja este día</p>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {horasDisponibles.map((h: string) => {
                              const isOcupado = !isSlotDisponiblePorFecha(s.fecha, h, [], profSeleccionado.id, areaSeleccionadaFiltro ?? profSeleccionado.area_id);
                                return (
                                  <button key={h} type="button" disabled={isOcupado}
                                    onClick={() => { if (!isOcupado) { const nuevas = [...sesionesAdicionales]; nuevas[idx] = { ...nuevas[idx], hora: h }; setSesionesAdicionales(nuevas); } }}
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
                        {s.fecha && s.hora && slotsNecesariosNueva > 1 && (() => {
                          const consecutivos = getSlotsConsecutivosLibres(s.fecha, s.hora, profSeleccionado.id);
                          if (consecutivos >= slotsNecesariosNueva) return null;
                          return (
                            <p style={{ fontSize: '10px', color: '#c2410c', background: '#fff7ed', padding: '6px 10px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                              ⚠ El servicio dura {servicioSeleccionadoActual?.duracion_min} min ({slotsNecesariosNueva} horarios) pero este día solo hay {consecutivos} hora{consecutivos === 1 ? '' : 's'} libre{consecutivos === 1 ? '' : 's'} seguida{consecutivos === 1 ? '' : 's'} desde las {s.hora}. Se registrará solo con esa hora — cambia el horario o la fecha si necesitas cubrir la duración completa.
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
            <label className={labelCls}>Notas (opcional)</label>
            <textarea value={formCita.notas} onChange={e => setFormCita({ ...formCita, notas: e.target.value })} className={inputCls + ' resize-none'} rows={2} placeholder="Observaciones, indicaciones..." />
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '8px', position: 'sticky', bottom: 0, background: '#fff', borderRadius: '0 0 28px 28px' }}>
          <button type="button" onClick={() => setModalNuevaCita(null)} style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '14px', padding: '10px', fontSize: '13px', color: '#4b5563', fontWeight: 600, background: '#fff', cursor: 'pointer' }}>Cancelar</button>
          <button type="submit" disabled={guardandoCita || (!pacienteSeleccionado && !modoNuevoPaciente)}
            style={{ flex: 1, background: '#A000D1', border: 'none', borderRadius: '14px', padding: '10px', fontSize: '13px', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: (guardandoCita || (!pacienteSeleccionado && !modoNuevoPaciente)) ? 0.5 : 1, boxShadow: '0 4px 14px rgba(160,0,209,0.3)' }}>
            {guardandoCita ? 'Guardando...' : 'Guardar cita'}
          </button>
        </div>
      </form>
    </div>
  );
}
