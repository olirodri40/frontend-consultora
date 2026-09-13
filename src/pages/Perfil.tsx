import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMiPerfil, actualizarMiPerfil, cambiarMiPassword } from '../services/perfil.service';
import { getServicios } from '../services/admin.service';

const rolesLabel: Record<string, string> = {
  administrador: 'Administrador',
  profesional: 'Profesional',
  recepcionista: 'Recepcionista',
  supervisor: 'Supervisor',
};

const inputCls = 'w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A000D1]/30 focus:border-[#A000D1] transition-all';
const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block';

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2.5">
      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium truncate">{value || '—'}</p>
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}>
      <div className="modal-card" style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', border: '1px solid #efedf0' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#f3f4f6', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>✕</button>
        </div>
        <div style={{ padding: '18px 20px' }}>{children}</div>
      </div>
    </div>
  );
}

export default function Perfil() {
  const { usuario, actualizarNombreSesion } = useAuth();
  const [perfil, setPerfil] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modalEditar, setModalEditar] = useState(false);
  const [modalPassword, setModalPassword] = useState(false);

  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', carnet: '', especialidad: '', fecha_nac: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [passwordForm, setPasswordForm] = useState({ actual: '', nueva: '', repetir: '' });
  const [errorPassword, setErrorPassword] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    cargarPerfil();
  }, [usuario]);

  async function cargarPerfil() {
    try {
      const [p, servs] = await Promise.all([getMiPerfil(usuario!.id), getServicios()]);
      setPerfil(p);
      setServicios(servs);
      setForm({
        nombre: p.nombre || '',
        email: p.email || '',
        telefono: p.telefono || '',
        carnet: p.carnet || '',
        especialidad: p.especialidad || '',
        fecha_nac: p.fecha_nac ? p.fecha_nac.split('T')[0] : '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  const nombresServicios = (perfil?.servicios_ids || [])
    .map((id: number) => servicios.find(s => s.id === id)?.nombre)
    .filter(Boolean);

  function abrirModalEditar() {
    setError('');
    setForm({
      nombre: perfil.nombre || '',
      email: perfil.email || '',
      telefono: perfil.telefono || '',
      carnet: perfil.carnet || '',
      especialidad: perfil.especialidad || '',
      fecha_nac: perfil.fecha_nac ? perfil.fecha_nac.split('T')[0] : '',
    });
    setModalEditar(true);
  }

  async function guardarCambios(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await actualizarMiPerfil({
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        carnet: form.carnet,
        especialidad: form.especialidad,
        fecha_nac: form.fecha_nac || null,
      });
      const actualizado = await getMiPerfil(usuario!.id);
      setPerfil(actualizado);
      actualizarNombreSesion(actualizado.nombre);
      setModalEditar(false);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al actualizar los datos');
    } finally {
      setGuardando(false);
    }
  }

  function abrirModalPassword() {
    setErrorPassword('');
    setPasswordForm({ actual: '', nueva: '', repetir: '' });
    setModalPassword(true);
  }

  async function guardarPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorPassword('');
    if (passwordForm.nueva.length < 6) {
      setErrorPassword('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (passwordForm.nueva !== passwordForm.repetir) {
      setErrorPassword('Las contraseñas nuevas no coinciden');
      return;
    }
    setGuardandoPassword(true);
    try {
      await cambiarMiPassword({ password_actual: passwordForm.actual, password_nueva: passwordForm.nueva });
      setModalPassword(false);
    } catch (err: any) {
      setErrorPassword(err.response?.data?.mensaje || 'Error al cambiar la contraseña');
    } finally {
      setGuardandoPassword(false);
    }
  }

  if (cargando) {
    return <p className="text-sm text-gray-500 text-center py-16">Cargando...</p>;
  }

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      <div className="shrink-0 mb-3">
        <h1 className="text-lg font-bold text-gray-800">Mi perfil</h1>
        <p className="text-xs text-gray-400">Consulta y actualiza tus datos personales</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#A000D1] flex items-center justify-center text-white text-lg font-bold shrink-0">
            {perfil?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-gray-800 truncate">{perfil?.nombre}</p>
            <p className="text-xs text-gray-400">{rolesLabel[perfil?.rol] || perfil?.rol}</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <Tile label="Usuario" value={perfil?.usuario} />
              <Tile label="Carnet C.I." value={perfil?.carnet} />
              <Tile label="Teléfono" value={perfil?.telefono} />
              <Tile label="Correo" value={perfil?.email} />
              <Tile label="Especialidad" value={perfil?.especialidad} />
              <Tile label="Fecha de nacimiento" value={perfil?.fecha_nac ? perfil.fecha_nac.split('T')[0] : ''} />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button type="button" onClick={abrirModalEditar}
                className="flex-1 bg-[#A000D1] text-white rounded-xl py-2 text-sm font-semibold hover:opacity-90 transition-all">
                Editar mis datos
              </button>
              <button type="button" onClick={abrirModalPassword}
                className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2 text-sm font-semibold hover:bg-gray-50 transition-all">
                Cambiar contraseña
              </button>
            </div>
          </div>

          <div className="space-y-3 flex flex-col min-h-0">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Áreas asignadas</p>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {(perfil?.areas || []).length === 0 ? (
                  <span className="text-sm text-gray-400">Sin áreas asignadas</span>
                ) : perfil.areas.map((a: any) => (
                  <span key={a.id} className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">{a.nombre}</span>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Servicios habilitados</p>
              <div className="flex flex-wrap gap-1.5 overflow-y-auto pr-1">
                {nombresServicios.length === 0 ? (
                  <span className="text-sm text-gray-400">Sin servicios habilitados</span>
                ) : nombresServicios.map((n: string, i: number) => (
                  <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{n}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalEditar && (
        <ModalShell title="Editar mis datos" onClose={() => setModalEditar(false)}>
          <form onSubmit={guardarCambios} className="space-y-3">
            <div>
              <label className={labelCls}>Nombre completo</label>
              <input type="text" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={labelCls}>Carnet C.I.</label>
                <input type="text" value={form.carnet} onChange={e => setForm({ ...form, carnet: e.target.value })} className={inputCls} placeholder="Ej. 1234567" />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className={inputCls} placeholder="+591 7xxxxxxx" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Correo</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="ejemplo@correo.com" />
            </div>
            <div>
              <label className={labelCls}>Especialidad</label>
              <input type="text" value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })} className={inputCls} placeholder="Ej. Psicología clínica" />
            </div>
            <div>
              <label className={labelCls}>Fecha de nacimiento</label>
              <input type="date" value={form.fecha_nac} onChange={e => setForm({ ...form, fecha_nac: e.target.value })} className={inputCls} />
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setModalEditar(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={guardando}
                className="flex-1 bg-[#A000D1] text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {modalPassword && (
        <ModalShell title="Cambiar contraseña" onClose={() => setModalPassword(false)}>
          <form onSubmit={guardarPassword} className="space-y-3">
            <div>
              <label className={labelCls}>Contraseña actual</label>
              <input type="password" required value={passwordForm.actual}
                onChange={e => setPasswordForm({ ...passwordForm, actual: e.target.value })}
                className={inputCls} placeholder="••••••••" />
            </div>
            <div>
              <label className={labelCls}>Nueva contraseña</label>
              <input type="password" required value={passwordForm.nueva}
                onChange={e => setPasswordForm({ ...passwordForm, nueva: e.target.value })}
                className={inputCls} placeholder="••••••••" />
            </div>
            <div>
              <label className={labelCls}>Repetir nueva contraseña</label>
              <input type="password" required value={passwordForm.repetir}
                onChange={e => setPasswordForm({ ...passwordForm, repetir: e.target.value })}
                className={inputCls} placeholder="••••••••" />
            </div>
            {errorPassword && <p className="text-sm text-red-500 font-medium">{errorPassword}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setModalPassword(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={guardandoPassword}
                className="flex-1 bg-[#A000D1] text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {guardandoPassword ? 'Guardando...' : 'Actualizar'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
