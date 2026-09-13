import api from './api';

// Datos propios del usuario logueado — a diferencia de admin.service.ts,
// estas rutas son accesibles para cualquier usuario autenticado (no solo
// administrador), porque solo permiten leer/editar el propio perfil.

export async function getMiPerfil(id: number) {
  const response = await api.get(`/users/${id}`);
  return response.data.usuario;
}

export async function actualizarMiPerfil(datos: {
  nombre?: string;
  email?: string;
  telefono?: string;
  carnet?: string;
  especialidad?: string;
  fecha_nac?: string | null;
}) {
  const response = await api.put('/users/me/perfil', datos);
  return response.data;
}

export async function cambiarMiPassword(datos: {
  password_actual: string;
  password_nueva: string;
}) {
  const response = await api.put('/users/me/password', datos);
  return response.data;
}
