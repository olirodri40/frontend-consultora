import api from './api';

export async function getParticipantesZumba(anio?: number) {
  const params = anio ? { params: { anio } } : {};
  const response = await api.get('/zumba/participantes', params);
  return response.data; // { participantes: [], anios_disponibles: [] }
}

export async function crearParticipanteZumba(datos: any) {
  const response = await api.post('/zumba/participantes', datos);
  return response.data;
}

export async function renovarCicloZumba(id: number, datos: any) {
  await api.put(`/zumba/participantes/${id}/renovar`, datos);
}

export async function marcarAsistenciaZumba(datos: any) {
  await api.post('/zumba/asistencia', datos);
}

export async function getAsistenciaZumba(cycleId: number) {
  const response = await api.get(`/zumba/asistencia/${cycleId}`);
  return response.data.asistencia;
}

export async function eliminarParticipanteZumba(id: number) {
  await api.delete(`/zumba/participantes/${id}`);
}

export async function getHorariosZumbaPublic() {
  const response = await api.get('/services/zumba/horarios');
  return response.data.horarios;
}

export async function editarParticipanteZumba(id: number, datos: any) {
  await api.put(`/zumba/participantes/${id}`, datos);
}

export async function getAsistenciaCicloZumba(cycle_id: number) {
  const response = await api.get(`/zumba/asistencia/${cycle_id}`);
  return response.data.asistencia;
}

export async function getHistorialCiclosZumba(id: number, anio?: number) {
  const params = anio ? { params: { anio } } : {};
  const response = await api.get(`/zumba/participantes/${id}/historial`, params);
  return response.data;
}

export async function getReportesZumba(params: {
  anio?: number;
  numero_ciclo?: number;
  solo_deudas?: boolean;
}) {
  const response = await api.get('/zumba/reportes', { params });
  return response.data;
}

export async function actualizarPagoZumba(
  cicloId: number,
  datos: { monto_pagado: number; metodo_pago?: string }
) {
  const response = await api.patch(`/zumba/ciclos/${cicloId}/pago`, datos);
  return response.data;
}
export async function getParticipanteZumba(id: number, anio?: number) {
  const params = anio ? { params: { anio } } : {};
  const response = await api.get(`/zumba/participantes/${id}`, params);
  return response.data.participante;
}

export async function getProfesionalZumba() {
  const response = await api.get('/zumba/profesional');
  return response.data.profesional;
}