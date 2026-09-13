import api from './api';

export async function getReporteGeneral(mes?: string, anio?: string) {
  const params = new URLSearchParams();
  if (mes) params.append('mes', mes);
  else if (anio) params.append('anio', anio);
  const qs = params.toString();
  const response = await api.get(`/reportes${qs ? `?${qs}` : ''}`);
  return response.data;
}

export async function getHistorialPagos(mes?: string) {
  const params = mes ? `?mes=${mes}` : '';
  const response = await api.get(`/reportes/pagos${params}`);
  return response.data;
}
export async function getDashboardData() {
  const response = await api.get('/reportes/dashboard');
  return response.data;
}
export async function getProgresoAreas(periodo: string) {
  const response = await api.get(`/reportes/progreso-areas?periodo=${periodo}`);
  return response.data;
}
export async function getProgresoAreasData(periodo?: string) {
  const params = periodo ? `?periodo=${periodo}` : '';
  const response = await api.get(`/reportes/progreso-areas${params}`);
  return response.data;
}
export async function getProgresoTemporalData(periodo?: string) {
  const params = periodo ? `?periodo=${periodo}` : '';
  const response = await api.get(`/reportes/progreso-temporal${params}`);
  return response.data;
}