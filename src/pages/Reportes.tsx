import { useState, useEffect } from 'react';
import { getReporteGeneral, getHistorialPagos } from '../services/reportes.service';
import { useAuth } from '../context/AuthContext';

export default function Reportes() {
  const { usuario } = useAuth();
  const [reporte, setReporte] = useState<any>(null);
  const [pagos, setPagos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mes, setMes] = useState('');
  const [tabActiva, setTabActiva] = useState<'resumen' | 'pagos'>('resumen');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos(filtroMes?: string) {
    try {
      setCargando(true);
      const [rep, hist] = await Promise.all([
        getReporteGeneral(filtroMes),
        getHistorialPagos(filtroMes),
      ]);
      setReporte(rep);
      setPagos(hist.pagos);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  function handleFiltrar(e: React.FormEvent) {
    e.preventDefault();
    cargarDatos(mes || undefined);
  }

  if (usuario?.rol !== 'administrador' && usuario?.rol !== 'supervisor') {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-600 font-medium">No tienes acceso a los reportes</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800">📈 Reportes</h1>
        <form onSubmit={handleFiltrar} className="flex gap-2">
          <input
            type="month"
            value={mes}
            onChange={e => setMes(e.target.value)}
            className="border rounded-lg p-2 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm"
          >
            Filtrar
          </button>
          {mes && (
            <button
              type="button"
              onClick={() => { setMes(''); cargarDatos(); }}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              Todo
            </button>
          )}
        </form>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTabActiva('resumen')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tabActiva === 'resumen'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border text-gray-600 hover:bg-gray-50'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setTabActiva('pagos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tabActiva === 'pagos'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border text-gray-600 hover:bg-gray-50'
          }`}
        >
          Historial de pagos ({pagos.length})
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-12 text-gray-500">Cargando reportes...</div>
      ) : tabActiva === 'resumen' && reporte ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">
                Bs {Number(reporte.resumen.ingresos_total).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ingresos totales</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {reporte.resumen.citas_hoy}
              </p>
              <p className="text-xs text-gray-500 mt-1">Citas hoy</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">
                {reporte.resumen.total_pacientes}
              </p>
              <p className="text-xs text-gray-500 mt-1">Pacientes activos</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-3xl font-bold text-pink-600">
                {reporte.resumen.total_zumba}
              </p>
              <p className="text-xs text-gray-500 mt-1">Participantes Zumba</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Ingresos por area</h3>
              {reporte.ingresos_por_area.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos</p>
              ) : (
                <div className="space-y-2">
                  {reporte.ingresos_por_area.map((area: any) => (
                    <div key={area.area} className="flex justify-between items-center">
                      <span className="text-sm">
                        {area.emoji} {area.area}
                      </span>
                      <span className="font-semibold text-green-600 text-sm">
                        Bs {Number(area.total_ingresos).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold text-gray-700 mb-3">💃 Zumba</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Participantes:</span>
                  <span className="font-medium">{reporte.resumen.total_zumba}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ingresos:</span>
                  <span className="font-medium text-green-600">
                    Bs {Number(reporte.resumen.ingresos_zumba).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold text-gray-700 mb-3">👴 Gerontologia</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Participantes:</span>
                  <span className="font-medium">{reporte.resumen.total_geronto}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ingresos:</span>
                  <span className="font-medium text-green-600">
                    Bs {Number(reporte.resumen.ingresos_geronto).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          {pagos.length === 0 ? (
            <p className="text-center py-12 text-gray-500">Sin pagos registrados</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-600">Fecha</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Paciente</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Area</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Detalle</th>
                  <th className="text-right p-3 font-semibold text-gray-600">Monto</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagos.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-600">
                      {p.fecha ? new Date(p.fecha).toLocaleDateString('es') : '-'}
                    </td>
                    <td className="p-3 font-medium text-gray-800">{p.paciente}</td>
                    <td className="p-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {p.emoji} {p.area}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{p.sesion}</td>
                    <td className="p-3 text-right font-semibold text-green-600">
                      Bs {Number(p.monto).toFixed(0)}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.metodo_pago === 'efectivo'
                          ? 'bg-green-100 text-green-700'
                          : p.metodo_pago === 'qr'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {p.metodo_pago}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}