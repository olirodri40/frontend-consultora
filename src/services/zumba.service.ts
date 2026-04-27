import api from './api';

export async function getParticipantesZumba() {
  const response = await api.get('/zumba/participantes');
  return response.data.participantes;
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