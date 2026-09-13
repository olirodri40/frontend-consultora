import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginService } from '../services/auth.service';
import RecuperarPasswordModal from '../components/ui/RecuperarPasswordModal';
import logoMedyfisio from '../assets/logo-medyfisio.png';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [campoError, setCampoError] = useState<'usuario' | 'password' | null>(null);
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [modalRecuperarAbierto, setModalRecuperarAbierto] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCampoError(null);

    if (!usuario || !password) {
      setError('Completa usuario y contrasena');
      return;
    }

    setCargando(true);

    try {
      // Llamada real al backend
      const respuesta = await loginService(usuario, password);

      // Guardar sesion en el contexto y localStorage
      login(respuesta.usuario, respuesta.token);

      // Redirigir al dashboard
      navigate('/');

    } catch (err: any) {
      // El backend distingue si el error es de usuario o de contraseña
      // (campo: 'usuario' | 'password') para marcar el campo correspondiente.
      const mensaje = err.response?.data?.mensaje || 'Error al conectar con el servidor';
      const campo = err.response?.data?.campo || null;
      setError(mensaje);
      setCampoError(campo);
      // El usuario nunca se borra (para no hacer retipear algo que puede
      // estar bien); la contraseña siempre se borra ante cualquier error.
      setPassword('');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">

        <div className="text-center mb-6">
          <img src={logoMedyfisio} alt="MedyFisio" className="w-20 h-20 mx-auto mb-3 rounded-full shadow-md object-cover" />
          <h1 className="text-2xl font-bold text-gray-800">SisMedy</h1>
          <p className="text-sm text-gray-500 mt-1">Ingresa tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={e => { setUsuario(e.target.value); setCampoError(null); }}
              placeholder="Tu usuario"
              className={`w-full border-2 rounded-xl p-3 text-sm outline-none transition-colors ${
                campoError === 'usuario' ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
              }`}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              Contrasena
            </label>
            <div className="relative">
              <input
                type={verPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setCampoError(null); }}
                placeholder="Tu contrasena"
                className={`w-full border-2 rounded-xl p-3 text-sm outline-none transition-colors pr-10 ${
                  campoError === 'password' ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
                }`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setVerPassword(!verPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {cargando ? 'Verificando...' : 'Ingresar al sistema'}
          </button>

          <button
            type="button"
            onClick={() => setModalRecuperarAbierto(true)}
            className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sistema de gestion interno
        </p>
      </div>

      {modalRecuperarAbierto && (
        <RecuperarPasswordModal onClose={() => setModalRecuperarAbierto(false)} />
      )}
    </div>
  );
}