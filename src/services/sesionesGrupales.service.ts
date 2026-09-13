import api from './api';

export async function getSesionesGrupales() {
  const response = await api.get('/sesiones-grupales');
  return response.data.sesiones;
}

export async function crearSesionGrupal(datos: {
  professional_id: number;
  servicio_id: number;
  servicio_individual_id?: number | null;
  area_id: number;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  fecha_inicio?: string;
  capacidad: number;
  costo_grupal?: number | null;
  visible_publico?: boolean;
}) {
  const response = await api.post('/sesiones-grupales', datos);
  return response.data;
}

export async function actualizarSesionGrupal(id: number, datos: any) {
  await api.put(`/sesiones-grupales/${id}`, datos);
}

export async function eliminarSesionGrupal(id: number) {
  await api.delete(`/sesiones-grupales/${id}`);
}

export async function getOcupacionSesionGrupal(id: number, fecha: string) {
  const response = await api.get(`/sesiones-grupales/${id}/ocupacion?fecha=${fecha}`);
  return response.data;
}

export async function inscribirEnSesionGrupal(
  id: number,
  fecha: string,
  datos: {
    paciente_nombre: string;
    paciente_telefono?: string;
    paciente_carnet?: string;
    paciente_edad?: number;
    patient_id?: number;
    individual: boolean;
    notas?: string;
    costo?: number;
    monto_pagado?: number;
  }
) {
  const response = await api.post(`/sesiones-grupales/${id}/inscribir?fecha=${fecha}`, datos);
  return response.data;
}
