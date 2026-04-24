import api from './api';

export async function getReporteGeneral(mes?: string) {
  const params = mes ? `?mes=${mes}` : '';
  const response = await api.get(`/reportes${params}`);
  return response.data;
}

export async function getHistorialPagos(mes?: string) {
  const params = mes ? `?mes=${mes}` : '';
  const response = await api.get(`/reportes/pagos${params}`);
  return response.data;
}