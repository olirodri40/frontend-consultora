import api from './api';

export async function getProfesionales() {
  const response = await api.get('/users/profesionales');
  return response.data.profesionales;
}

export async function getUsuarios() {
  const response = await api.get('/users');
  return response.data.usuarios;
}

export async function crearUsuario(datos: any) {
  const response = await api.post('/users', datos);
  return response.data;
}

export async function actualizarUsuario(id: number, datos: any) {
  await api.put(`/users/${id}`, datos);
}

export async function eliminarUsuario(id: number) {
  await api.delete(`/users/${id}`);
}

export async function getHorarios(id: number) {
  const response = await api.get(`/users/${id}/horarios`);
  return response.data.horarios;
}

export async function guardarHorarios(id: number, horarios: any[]) {
  await api.post(`/users/${id}/horarios`, { horarios });
}

export async function getAuditLog() {
  const response = await api.get('/users/audit/log');
  return response.data.logs;
}

export async function getAreas() {
  const response = await api.get('/areas');
  return response.data.areas;
}

export async function crearArea(datos: any) {
  const response = await api.post('/areas', datos);
  return response.data;
}

export async function actualizarArea(id: number, datos: any) {
  await api.put(`/areas/${id}`, datos);
}

export async function eliminarArea(id: number) {
  await api.delete(`/areas/${id}`);
}

export async function getServicios(area_id?: number) {
  const params = area_id ? `?area_id=${area_id}` : '';
  const response = await api.get(`/services${params}`);
  return response.data.servicios;
}

export async function crearServicio(datos: any) {
  const response = await api.post('/services', datos);
  return response.data;
}

export async function actualizarServicio(id: number, datos: any) {
  await api.put(`/services/${id}`, datos);
}

export async function eliminarServicio(id: number) {
  await api.delete(`/services/${id}`);
}

export async function getHorariosZumba() {
  const response = await api.get('/services/zumba/horarios');
  return response.data.horarios;
}

export async function crearHorarioZumba(datos: any) {
  const response = await api.post('/services/zumba/horarios', datos);
  return response.data;
}

export async function actualizarHorarioZumba(id: number, datos: any) {
  await api.put(`/services/zumba/horarios/${id}`, datos);
}

export async function eliminarHorarioZumba(id: number) {
  await api.delete(`/services/zumba/horarios/${id}`);
}

export async function getActividadesGeronto() {
  const response = await api.get('/services/geronto/actividades');
  return response.data.actividades;
}

export async function crearActividadGeronto(datos: any) {
  const response = await api.post('/services/geronto/actividades', datos);
  return response.data;
}

export async function actualizarActividadGeronto(id: number, datos: any) {
  await api.put(`/services/geronto/actividades/${id}`, datos);
}

export async function eliminarActividadGeronto(id: number) {
  await api.delete(`/services/geronto/actividades/${id}`);
}
export async function getTodosHorariosProfesionales() {
  const response = await api.get('/users/horarios/todos');
  return response.data.horarios;
}