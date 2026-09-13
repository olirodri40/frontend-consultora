import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { olvidePasswordService, verificarCodigoService, restablecerPasswordService, loginService } from '../../services/auth.service';

type Paso = 'correo' | 'codigo' | 'nueva-password';

const inputCls = 'w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl p-3 text-sm outline-none transition-colors';

export default function RecuperarPasswordModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [paso, setPaso] = useState<Paso>('correo');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordRepetir, setPasswordRepetir] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Ingresa tu correo');
      return;
    }
    setCargando(true);
    try {
      await olvidePasswordService(email);
      setPaso('codigo');
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'No se pudo enviar el código');
    } finally {
      setCargando(false);
    }
  }

  async function verificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!codigo) {
      setError('Ingresa el código que te enviamos');
      return;
    }
    setCargando(true);
    try {
      await verificarCodigoService(email, codigo);
      setPaso('nueva-password');
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Código inválido o vencido');
    } finally {
      setCargando(false);
    }
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (passwordNueva.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (passwordNueva !== passwordRepetir) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setCargando(true);
    try {
      await restablecerPasswordService(email, codigo, passwordNueva);
      // Contraseña cambiada correctamente — iniciamos sesión automáticamente
      // con las credenciales nuevas, sin pedirle al usuario que las teclee de nuevo.
      const respuesta = await loginService(email, passwordNueva);
      login(respuesta.usuario, respuesta.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'No se pudo cambiar la contraseña');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        {paso === 'correo' && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Recuperar contraseña</h2>
            <p className="text-sm text-gray-500 mb-5">Ingresa tu correo y te enviaremos un código para restablecerla.</p>
            <form onSubmit={enviarCodigo} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Correo</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu-correo@ejemplo.com" className={inputCls} autoFocus />
              </div>
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              <button type="submit" disabled={cargando}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                {cargando ? 'Enviando...' : 'Enviar código'}
              </button>
              <button type="button" onClick={onClose}
                className="w-full text-gray-500 text-sm font-medium py-1">
                Cancelar
              </button>
            </form>
          </>
        )}

        {paso === 'codigo' && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Ingresa el código</h2>
            <p className="text-sm text-gray-500 mb-5">Enviamos un código de 6 dígitos a <span className="font-medium text-gray-700">{email}</span>.</p>
            <form onSubmit={verificarCodigo} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Código</label>
                <input type="text" inputMode="numeric" maxLength={6} value={codigo}
                  onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456" className={inputCls + ' text-center tracking-[8px] text-lg font-bold'} autoFocus />
              </div>
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              <button type="submit" disabled={cargando}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                {cargando ? 'Verificando...' : 'Verificar código'}
              </button>
              <button type="button" onClick={() => { setPaso('correo'); setError(''); }}
                className="w-full text-gray-500 text-sm font-medium py-1">
                ← Cambiar correo
              </button>
            </form>
          </>
        )}

        {paso === 'nueva-password' && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Nueva contraseña</h2>
            <p className="text-sm text-gray-500 mb-5">Debe tener al menos 8 caracteres.</p>
            <form onSubmit={cambiarPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Nueva contraseña</label>
                <input type="password" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)}
                  placeholder="••••••••" className={inputCls} autoFocus />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Repetir nueva contraseña</label>
                <input type="password" value={passwordRepetir} onChange={e => setPasswordRepetir(e.target.value)}
                  placeholder="••••••••" className={inputCls} />
              </div>
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              <button type="submit" disabled={cargando}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                {cargando ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
