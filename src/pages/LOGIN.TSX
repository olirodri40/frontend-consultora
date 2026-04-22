import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginService } from '../services/auth.service';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

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
      // El backend devuelve el mensaje de error
      const mensaje = err.response?.data?.mensaje || 'Error al conectar con el servidor';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏥</div>
          <h1 className="text-2xl font-bold text-gray-800">Consultora Salud</h1>
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
              onChange={e => setUsuario(e.target.value)}
              placeholder="Tu usuario"
              className="w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl p-3 text-sm outline-none transition-colors"
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
                onChange={e => setPassword(e.target.value)}
                placeholder="Tu contrasena"
                className="w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl p-3 text-sm outline-none transition-colors pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setVerPassword(!verPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {verPassword ? '🙈' : '👁️'}
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
        </form>

        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 mb-2">Credenciales de prueba:</p>
          <div className="space-y-1 text-xs text-gray-500">
            <p>👑 admin / admin123</p>
            <p>👩‍⚕️ laura.perez / laura123</p>
            <p>🦵 carlos.ruiz / carlos123</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Sistema de gestion interno
        </p>
      </div>
    </div>
  );
}