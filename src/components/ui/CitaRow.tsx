type Cita = {
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
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  nombreCompleto?: string;
  carnet?: string;
  monto?: number;
  metodoPago?: 'efectivo' | 'qr' | 'transferencia';
  estadoPago?: string;
  fechaPago?: string;
  asistio?: boolean;
  servicioNombre?: string;
};

type CitaRowProps = {
  cita: Cita;
  onClick: (cita: Cita) => void;
};

export default function CitaRow({ cita, onClick }: CitaRowProps) {
  const asistoBadge = cita.asistio === true
    ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">✅ Asistió</span>
    : cita.asistio === false
    ? <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">❌ No asistió</span>
    : null;

  return (
    <div
      className="p-3 flex items-center justify-between gap-2 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onClick(cita)}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-700 w-14 shrink-0">
          {cita.hora}
        </span>
        <div>
          <div className="text-sm font-medium text-gray-800">
            {cita.nombreCompleto || cita.nombre}
          </div>
          <div className="flex gap-1 flex-wrap mt-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {cita.area === 'psicologia' ? '🧠 Psicología' : '🦵 Fisioterapia'}
            </span>
            {cita.servicioNombre && (
              <span className="text-[10px] text-gray-400">{cita.servicioNombre}</span>
            )}
            {asistoBadge}
          </div>
        </div>
      </div>
    </div>
  );
}