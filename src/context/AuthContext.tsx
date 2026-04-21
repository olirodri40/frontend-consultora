import { createContext, useContext, useState, ReactNode } from 'react';

// Tipo del usuario logueado
type UsuarioSesion = {
  id: number;
  nombre: string;
  usuario: string;
  rol: 'administrador' | 'profesional' | 'recepcionista' | 'supervisor';
  profesionalId?: number;
};

// Tipo del contexto — que cosas expone
type AuthContextType = {
  usuario: UsuarioSesion | null;  // null = no hay sesion activa
  login: (usuario: UsuarioSesion) => void;
  logout: () => void;
  estaLogueado: boolean;
};

// Crear el contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Provider — el componente que envuelve toda la app
// y hace disponible el contexto a todos los hijos
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);

  function login(u: UsuarioSesion) {
    setUsuario(u);
  }

  function logout() {
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{
      usuario,
      login,
      logout,
      estaLogueado: usuario !== null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto facilmente
// En vez de escribir useContext(AuthContext) en cada componente,
// solo escribes useAuth()
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}