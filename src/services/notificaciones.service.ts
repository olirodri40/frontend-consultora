import api from './api';

export async function getNotificaciones() {
  const response = await api.get('/notificaciones');
  return response.data;
}

export async function marcarLeida(id: number) {
  const response = await api.put(`/notificaciones/${id}/leer`);
  return response.data;
}

export async function marcarTodasLeidas() {
  const response = await api.put('/notificaciones/leer-todas');
  return response.data;
}