import api from './api';

export async function getBloqueos(desde?: string, hasta?: string) {
  const params = new URLSearchParams();
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);
  const response = await api.get(`/bloqueos-agenda?${params.toString()}`);
  return response.data.bloqueos;
}

export async function crearBloqueo(datos: {
  professional_id: number;
  area_id: number;
  nombre: string;
  tipo: 'virtual' | 'presencial' | 'semipresencial';
  fechas: string[];
  hora_inicio: string;
  hora_fin: string;
  notas?: string;
}) {
  const response = await api.post('/bloqueos-agenda', datos);
  return response.data;
}

export async function eliminarBloqueo(id: number) {
  await api.delete(`/bloqueos-agenda/${id}`);
}
