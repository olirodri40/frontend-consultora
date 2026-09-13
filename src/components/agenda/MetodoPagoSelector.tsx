// Selector de método de pago (Efectivo/QR/Transferencia) usado en los
// formularios de nueva cita y edición de cita. Es autocontenido: no depende
// de nada de Agenda.tsx, solo del valor actual y un callback de cambio.
export function MetodoPagoSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const metodos = [
    { key: 'efectivo', label: 'Efectivo' },
    { key: 'qr', label: 'QR' },
    { key: 'transferencia', label: 'Transferencia' },
  ];
  return (
    <div className="flex gap-2">
      {metodos.map(m => (
        <button
          key={m.key}
          type="button"
          onClick={() => onChange(m.key)}
          className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
            value === m.key
              ? 'bg-[#A000D1] text-white border-[#A000D1] shadow-lg shadow-purple-200'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#A000D1]/30'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
