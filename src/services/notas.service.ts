import api from './api';

export async function getUsuariosParaNotas() {
  const response = await api.get('/users/lista-basica');
  return response.data.usuarios;
}

export async function crearNota(datos: {
  mensaje: string;
  destinatarios_ids?: number[];
  para_todos?: boolean;
}) {
  const response = await api.post('/notas', datos);
  return response.data;
}

export async function getNotasRecibidas() {
  const response = await api.get('/notas/recibidas');
  return response.data.notas;
}

export async function getNotasEnviadas() {
  const response = await api.get('/notas/enviadas');
  return response.data.notas;
}

export async function marcarNotaAtendida(id: number, atendido: boolean = true) {
  const response = await api.put(`/notas/${id}/atender`, { atendido });
  return response.data;
}

export async function eliminarNota(id: number) {
  const response = await api.delete(`/notas/${id}`);
  return response.data;
}
