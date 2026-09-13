import api from './api';

type LoginResponse = {
  ok: boolean;
  token: string;
  usuario: {
    id: number;
    nombre: string;
    usuario: string;
    rol: 'administrador' | 'profesional' | 'recepcionista' | 'supervisor';
    area_id: number | null;
  };
};

export async function loginService(
  usuario: string,
  password: string
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', {
    usuario,
    password,
  });
  return response.data;
}

export async function olvidePasswordService(email: string) {
  const response = await api.post('/auth/olvide-password', { email });
  return response.data;
}

export async function verificarCodigoService(email: string, codigo: string) {
  const response = await api.post('/auth/verificar-codigo', { email, codigo });
  return response.data;
}

export async function restablecerPasswordService(email: string, codigo: string, password_nueva: string) {
  const response = await api.post('/auth/restablecer-password', { email, codigo, password_nueva });
  return response.data;
}