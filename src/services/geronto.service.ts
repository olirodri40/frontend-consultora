import api from './api';

export async function getActividadesGeronto() {
  const response = await api.get('/geronto/actividades');
  return response.data.actividades;
}

export async function getParticipantesGeronto() {
  const response = await api.get('/geronto/participantes');
  return response.data.participantes;
}

export async function crearParticipanteGeronto(datos: any) {
  const response = await api.post('/geronto/participantes', datos);
  return response.data;
}

export async function renovarCicloGeronto(id: number, datos: any) {
  await api.put(`/geronto/participantes/${id}/renovar`, datos);
}

export async function marcarAsistenciaGeronto(datos: any) {
  await api.post('/geronto/asistencia', datos);
}
export async function getAsistenciaCiclo(cycle_id: number) {
  const response = await api.get(`/geronto/asistencia/${cycle_id}`);
  return response.data.asistencia;
}
export async function editarParticipanteGeronto(id: number, datos: any) {
  await api.put(`/geronto/participantes/${id}`, datos);
}

export async function eliminarParticipanteGeronto(id: number) {
  await api.delete(`/geronto/participantes/${id}`);
}