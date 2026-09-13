import api from './api';

export async function getPacientes(buscar?: string) {
  const params = buscar ? `?buscar=${encodeURIComponent(buscar)}` : '';
  const response = await api.get(`/pacientes${params}`);
  return response.data.pacientes;
}

export async function getPacientePorId(id: number) {
  const response = await api.get(`/pacientes/${id}`);
  return response.data;
}

export async function actualizarPaciente(
  id: number,
  datos: { 
    nombre?: string;
    carnet?: string | null;
    telefono?: string | null;
    edad?: number | null;
    contacto_relacion?: string | null;
    contacto_nombre?: string | null;
    contacto_telefono?: string | null;
  }
) {
  await api.put(`/pacientes/${id}`, datos);
}

export async function crearPaciente(datos: any) {
  const response = await api.post('/pacientes', datos);
  return response.data;
}

export async function actualizarPacienteService(id: number, datos: any) {
  const res = await api.put(`/pacientes/${id}`, datos);
  return res.data;
}