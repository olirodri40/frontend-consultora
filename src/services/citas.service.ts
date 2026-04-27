import api from './api';

export async function getCitas(filtros?: {
  fecha?: string;
  profesional_id?: number;
  estado?: string;
}) {
  const params = new URLSearchParams();
  if (filtros?.fecha) params.append('fecha', filtros.fecha);
  if (filtros?.profesional_id) params.append('profesional_id', String(filtros.profesional_id));
  if (filtros?.estado) params.append('estado', filtros.estado);
  const response = await api.get(`/citas?${params.toString()}`);
  return response.data.citas;
}

export async function actualizarCitaService(
  id: number,
  datos: { estado?: string; asistio?: boolean | null }
) {
  await api.put(`/citas/${id}`, datos);
}
export async function crearCita(datos: any) {
  const response = await api.post('/citas', datos);
  return response.data;
}