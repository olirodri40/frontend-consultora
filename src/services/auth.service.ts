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