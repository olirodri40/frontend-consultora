// src/services/api.ts
import axios from 'axios';

// ✅ Usa variable de entorno
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor — antes de cada peticion, agrega el token automaticamente
// si existe en localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Si vamos a subir un archivo (FormData), quitamos el Content-Type fijo
  // de 'application/json' para que el navegador ponga el correcto
  // (multipart/form-data con el boundary), o el envío se rompe.
  if (config.data instanceof FormData) {
    if (typeof (config.headers as any)?.delete === 'function') {
      (config.headers as any).delete('Content-Type');
    } else if (config.headers) {
      delete (config.headers as any)['Content-Type'];
    }
  }

  return config;
});

// Interceptor de respuesta — si el servidor devuelve 401 en una ruta que
// requiere sesion, significa que el token expiro/es invalido y forzamos
// logout. Las rutas de /auth/* (login, recuperar contrasena) tambien pueden
// responder 401 por credenciales incorrectas — eso NO es una sesion vencida,
// asi que ahi se deja que el propio formulario maneje el error sin recargar
// la pagina.
const RUTAS_SIN_REDIRECCION_401 = ['/auth/login', '/auth/olvide-password', '/auth/verificar-codigo', '/auth/restablecer-password'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esRutaDeAuth = RUTAS_SIN_REDIRECCION_401.some(ruta => error.config?.url?.includes(ruta));
    if (error.response?.status === 401 && !esRutaDeAuth) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;