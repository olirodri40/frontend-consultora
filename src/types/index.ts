// USUARIOS Y AUTENTICACION
export type Rol =
  | 'administrador'
  | 'profesional'
  | 'recepcionista'
  | 'supervisor';

export type Usuario = {
  id: number;
  nombre: string;
  usuario: string;
  rol: Rol;
  profesionalId?: number;
  activo: boolean;
};

// AREAS Y PROFESIONALES
export type Area = {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
  descripcion?: string;
};

export type TipoHorario = 'diario' | 'semanal' | 'mensual';

export type Profesional = {
  id: number;
  nombre: string;
  area: string;
  email: string;
  telefono: string;
  especialidad?: string;
  tipoHorario: TipoHorario;
  fechaNac?: string;
  sueldo?: number;
  contrato?: string;
};

// CITAS
export type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada';
export type EstadoPago = 'pagado completo' | 'pago parcial' | 'adeuda';
export type MetodoPago = 'efectivo' | 'qr' | 'transferencia';

export type Cita = {
  id: number;
  nombre: string;
  edad?: number;
  telefono: string;
  fecha: string;
  hora: string;
  area: string;
  profesionalId: number;
  modalidad: 'presencial' | 'virtual';
  sesion: string;
  estado: EstadoCita;
  nombreCompleto?: string;
  carnet?: string;
  monto?: number;
  metodoPago?: MetodoPago;
  estadoPago?: EstadoPago;
  fechaPago?: string;
  asistio?: boolean;
  servicioNombre?: string;
};

// ZUMBA
export type CicloZumba = {
  numeroCiclo: number;
  fechaInicio: string;
  clasesPagadas: number;
  monto: number;
  metodoPago: MetodoPago;
  estado: 'activo' | 'completado';
};

export type ParticipanteZumba = {
  id: number;
  nombre: string;
  carnet?: string;
  fechaNac?: string;
  telefono?: string;
  ciclos: CicloZumba[];
};

// GERONTOLOGIA
export type ActividadGeronto = {
  id: number;
  nombre: string;
  emoji: string;
  dia: string;
  inicio: string;
  fin: string;
  color: string;
  precio: number;
};

export type CicloGeronto = {
  numeroCiclo: number;
  fechaInicio: string;
  actividadesIds: number[];
  monto: number;
  metodoPago: MetodoPago;
  estado: 'activo' | 'completado';
};

export type ParticipanteGeronto = {
  id: number;
  nombre: string;
  carnet?: string;
  fechaNac?: string;
  telefono?: string;
  ciclos: CicloGeronto[];
};