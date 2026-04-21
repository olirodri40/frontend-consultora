// Definimos exactamente qué props acepta este componente
type StatCardProps = {
  emoji: string;
  label: string;
  valor: number;
  color: 'yellow' | 'emerald' | 'blue' | 'purple';
};

// Mapa de colores — según el color que reciba, aplica las clases correctas
const colores = {
  yellow:  { bg: 'bg-yellow-100',  text: 'text-yellow-500'  },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-600'    },
  purple:  { bg: 'bg-purple-100',  text: 'text-purple-600'  },
};

export default function StatCard({ emoji, label, valor, color }: StatCardProps) {
  const pal = colores[color];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center gap-3">
        {/* Ícono con fondo de color */}
        <div className={`w-10 h-10 ${pal.bg} rounded-lg flex items-center justify-center text-xl`}>
          {emoji}
        </div>
        {/* Datos */}
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className={`text-2xl font-bold ${pal.text}`}>{valor}</p>
        </div>
      </div>
    </div>
  );
}