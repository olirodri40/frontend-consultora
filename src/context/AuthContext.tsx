import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UsuarioSesion = {
  id: number;
  nombre: string;
  usuario: string;
  rol: 'administrador' | 'profesional' | 'recepcionista' | 'supervisor';
  area_id?: number | null;
  areas?: string[];
};

type AuthContextType = {
  usuario: UsuarioSesion | null;
  login: (usuario: UsuarioSesion, token: string) => void;
  logout: () => void;
  estaLogueado: boolean;
  actualizarNombreSesion: (nombre: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);

  // Al cargar la app, verificar si hay sesion guardada en localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');

    if (token && usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
    }
  }, []);

  function login(u: UsuarioSesion, token: string) {
    // Guardar en localStorage para que persista al recargar
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(u));
    setUsuario(u);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  // Actualiza solo el nombre mostrado en la sesión (sidebar, header) después
  // de que el usuario edite su propio perfil — sin necesidad de re-loguearse.
  function actualizarNombreSesion(nombre: string) {
    setUsuario(prev => {
      if (!prev) return prev;
      const actualizado = { ...prev, nombre };
      localStorage.setItem('usuario', JSON.stringify(actualizado));
      return actualizado;
    });
  }

  return (
    <AuthContext.Provider value={{
      usuario,
      login,
      logout,
      estaLogueado: usuario !== null,
      actualizarNombreSesion,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}