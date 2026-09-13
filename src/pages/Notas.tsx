import { useState, useEffect } from 'react';
import { StickyNote, X, Send, Check, RotateCcw, Trash2, Users as IconUsers, Loader2 } from 'lucide-react';
import {
  getUsuariosParaNotas,
  crearNota,
  getNotasRecibidas,
  getNotasEnviadas,
  marcarNotaAtendida,
  eliminarNota,
} from '../services/notas.service';

function tiempoRelativo(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  const ahora = new Date();
  const diffMin = Math.round((ahora.getTime() - fecha.getTime()) / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHoras = Math.round(diffMin / 60);
  if (diffHoras < 24) return `hace ${diffHoras} h`;
  const diffDias = Math.round(diffHoras / 24);
  if (diffDias === 1) return 'ayer';
  if (diffDias < 7) return `hace ${diffDias} días`;
  return fecha.toLocaleDateString('es');
}

const COLOR_ROL: Record<string, string> = {
  administrador: 'bg-violet-100 text-violet-700 border-violet-200',
  supervisor: 'bg-blue-100 text-blue-700 border-blue-200',
  profesional: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  recepcionista: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function Notas() {
  const [pestana, setPestana] = useState<'recibidas' | 'enviadas'>('recibidas');
  const [recibidas, setRecibidas] = useState<any[]>([]);
  const [enviadas, setEnviadas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);

  const [mensaje, setMensaje] = useState('');
  const [paraTodos, setParaTodos] = useState(false);
  const [destinatariosIds, setDestinatariosIds] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function cargarTodo() {
    try {
      setCargando(true);
      const [rec, env, usrs] = await Promise.all([
        getNotasRecibidas(),
        getNotasEnviadas(),
        getUsuariosParaNotas(),
      ]);
      setRecibidas(rec || []);
      setEnviadas(env || []);
      setUsuarios(usrs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarTodo(); }, []);

  const pendientesCount = recibidas.filter(n => !n.atendido).length;

  function abrirModalNueva() {
    setMensaje('');
    setParaTodos(false);
    setDestinatariosIds([]);
    setError('');
    setModalNueva(true);
  }

  function toggleDestinatario(id: number) {
    setDestinatariosIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function enviarNota() {
    setError('');
    if (!mensaje.trim()) { setError('Escribe el mensaje de la nota'); return; }
    if (!paraTodos && destinatariosIds.length === 0) { setError('Selecciona al menos un destinatario o marca "Todos"'); return; }
    setGuardando(true);
    try {
      await crearNota({
        mensaje: mensaje.trim(),
        para_todos: paraTodos,
        destinatarios_ids: paraTodos ? undefined : destinatariosIds,
      });
      setModalNueva(false);
      await cargarTodo();
      setPestana('enviadas');
    } catch (err: any) {
      setError(err?.response?.data?.mensaje || 'No se pudo enviar la nota');
    } finally {
      setGuardando(false);
    }
  }

  async function toggleAtendida(nota: any) {
    try {
      await marcarNotaAtendida(nota.id, !nota.atendido);
      await cargarTodo();
    } catch (err) {
      console.error(err);
    }
  }

  async function borrarNota(id: number) {
    if (!confirm('¿Eliminar esta nota?')) return;
    try {
      await eliminarNota(id);
      await cargarTodo();
    } catch (err: any) {
      alert(err?.response?.data?.mensaje || 'No se pudo eliminar la nota');
    }
  }

  const usuariosPorRol = usuarios.reduce((acc: Record<string, any[]>, u: any) => {
    const rol = u.rol || 'otro';
    if (!acc[rol]) acc[rol] = [];
    acc[rol].push(u);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <StickyNote className="text-[#A000D1]" size={22} />
            Notas
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Recordatorios y avisos entre el equipo</p>
        </div>
        <button
          onClick={abrirModalNueva}
          className="flex items-center gap-2 bg-[#A000D1] hover:bg-[#8800b3] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-all shadow-lg shadow-purple-200"
        >
          <Send size={15} /> Nueva nota
        </button>
      </div>

      <div className="flex gap-2 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setPestana('recibidas')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
            pestana === 'recibidas' ? 'bg-white text-[#A000D1] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Recibidas
          {pendientesCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendientesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setPestana('enviadas')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            pestana === 'enviadas' ? 'bg-white text-[#A000D1] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Enviadas
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={22} /></div>
      ) : pestana === 'recibidas' ? (
        recibidas.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border border-[#efedf0]">
            No tienes notas recibidas.
          </div>
        ) : (
          <div className="space-y-3">
            {recibidas.map((n: any) => (
              <div
                key={n.id}
                className={`bg-white rounded-2xl border p-4 flex items-start gap-3 transition-all ${
                  n.atendido ? 'border-[#efedf0]' : 'border-amber-300 bg-amber-50/40'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-800">{n.autor_nombre}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${COLOR_ROL[n.autor_rol] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {n.autor_rol}
                    </span>
                    {n.para_todos && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-1">
                        <IconUsers size={10} /> Para todos
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">· {tiempoRelativo(n.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.mensaje}</p>
                </div>
                <button
                  onClick={() => toggleAtendida(n)}
                  title={n.atendido ? 'Marcar como pendiente' : 'Marcar como atendida'}
                  className={`flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2 transition-all shrink-0 ${
                    n.atendido
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                >
                  {n.atendido ? <RotateCcw size={13} /> : <Check size={13} />}
                  {n.atendido ? 'Atendida' : 'Marcar atendida'}
                </button>
              </div>
            ))}
          </div>
        )
      ) : enviadas.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border border-[#efedf0]">
          Todavía no enviaste ninguna nota.
        </div>
      ) : (
        <div className="space-y-3">
          {enviadas.map((n: any) => {
            const total = n.destinatarios?.length || 0;
            const atendidas = n.destinatarios?.filter((d: any) => d.atendido).length || 0;
            return (
              <div key={n.id} className="bg-white rounded-2xl border border-[#efedf0] p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {n.para_todos && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-1">
                          <IconUsers size={10} /> Para todos
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">{tiempoRelativo(n.created_at)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        atendidas === total ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {atendidas}/{total} atendida{total !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.mensaje}</p>
                  </div>
                  <button
                    onClick={() => borrarNota(n.id)}
                    title="Eliminar nota"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(n.destinatarios || []).map((d: any) => (
                    <span
                      key={d.user_id}
                      title={d.atendido ? 'Atendida' : d.leido ? 'Leída, sin atender' : 'Sin leer'}
                      className={`text-[10px] px-2 py-1 rounded-full border font-medium flex items-center gap-1 ${
                        d.atendido
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : d.leido
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      {d.atendido && <Check size={10} />}
                      {d.nombre}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalNueva && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={() => setModalNueva(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Send size={16} className="text-[#A000D1]" /> Nueva nota
              </h3>
              <button onClick={() => setModalNueva(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
                <X size={14} />
              </button>
            </div>

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Mensaje</label>
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder="Ej. Faltan toallas, alcohol y guantes en el consultorio 2..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all resize-none mb-4"
            />

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Dirigido a</label>
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-gray-200 mb-2 hover:bg-gray-50">
              <input type="checkbox" checked={paraTodos} onChange={e => setParaTodos(e.target.checked)} className="rounded text-[#A000D1] focus:ring-[#A000D1]" />
              <IconUsers size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Todos los usuarios</span>
            </label>

            {!paraTodos && (
              <div className="border border-gray-200 rounded-xl p-2 max-h-[220px] overflow-y-auto space-y-2">
                {Object.entries(usuariosPorRol).map(([rol, lista]) => (
                  <div key={rol}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-1.5 py-1">{rol}</p>
                    {(lista as any[]).map(u => (
                      <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg">
                        <input
                          type="checkbox"
                          checked={destinatariosIds.includes(u.id)}
                          onChange={() => toggleDestinatario(u.id)}
                          className="rounded text-[#A000D1] focus:ring-[#A000D1]"
                        />
                        <span className="text-sm text-gray-700">{u.nombre}</span>
                      </label>
                    ))}
                  </div>
                ))}
                {usuarios.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">No hay otros usuarios registrados</p>
                )}
              </div>
            )}

            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setModalNueva(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl py-2.5"
              >
                Cancelar
              </button>
              <button
                onClick={enviarNota}
                disabled={guardando}
                className="flex-1 bg-[#A000D1] hover:bg-[#8800b3] disabled:opacity-50 text-white text-sm font-semibold rounded-xl py-2.5 flex items-center justify-center gap-1.5"
              >
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
