import api from './api';

// ========== ACTIVIDADES ==========
export async function getActividadesGeronto() {
  const response = await api.get('/geronto/actividades');
  return response.data.actividades;
}

// ========== PARTICIPANTES ==========
export async function getParticipantesGeronto(anio?: number) {
  const url = anio ? `/geronto/participantes?anio=${anio}` : '/geronto/participantes';
  const response = await api.get(url);
  return response.data;
}

export async function crearParticipanteGeronto(datos: any) {
  const response = await api.post('/geronto/participantes', datos);
  return response.data;
}

export async function editarParticipanteGeronto(id: number, datos: any) {
  await api.put(`/geronto/participantes/${id}`, datos);
}

export async function eliminarParticipanteGeronto(id: number) {
  await api.delete(`/geronto/participantes/${id}`);
}

// ========== CICLOS ==========
export async function renovarCicloGeronto(id: number, datos: any) {
  await api.put(`/geronto/participantes/${id}/renovar`, datos);
}

export async function getHistorialCiclosGeronto(participanteId: number, anio?: number) {
  const url = anio 
    ? `/geronto/participantes/${participanteId}/ciclos?anio=${anio}`
    : `/geronto/participantes/${participanteId}/ciclos`;
  const response = await api.get(url);
  return response.data;
}

export async function actualizarPagoGeronto(cicloId: number, datos: { monto_pagado: number; metodo_pago: string }) {
  const response = await api.put(`/geronto/ciclos/${cicloId}/pago`, datos);
  return response.data;
}

// ========== ASISTENCIA ==========
export async function marcarAsistenciaGeronto(datos: any) {
  await api.post('/geronto/asistencia', datos);
}

export async function getAsistenciaCiclo(cycle_id: number) {
  const response = await api.get(`/geronto/asistencia/${cycle_id}`);
  return response.data.asistencia;
}

// ========== REPORTES ==========
export async function getReportesGeronto(params: { anio?: number; numero_ciclo?: number; solo_deudas?: boolean }) {
  const queryParams = new URLSearchParams();
  if (params.anio) queryParams.append('anio', params.anio.toString());
  if (params.numero_ciclo) queryParams.append('numero_ciclo', params.numero_ciclo.toString());
  if (params.solo_deudas) queryParams.append('solo_deudas', 'true');
  
  const url = `/geronto/reportes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await api.get(url);
  return response.data;
}

export async function eliminarAsistenciaGeronto(datos: { 
  participant_id: number; 
  cycle_id: number; 
  activity_id: number; 
  fecha: string;
}) {
  await api.delete('/geronto/asistencia', { data: datos });
}

export async function getActividadesConProfesionales() {
  const response = await api.get('/geronto/actividades-con-profesionales');
  return response.data.actividades;
}