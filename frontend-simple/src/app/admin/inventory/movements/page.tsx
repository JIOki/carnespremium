'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import inventoryService, {
  InventoryMovement,
  MovementStats,
  getMovementTypeBadge,
  formatCurrency,
  formatDate
} from '@/services/inventoryService';
import { toast } from 'react-hot-toast';

export default function InventoryMovementsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productIdParam = searchParams.get('productId');

  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [stats, setStats] = useState<MovementStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMovements();
    fetchStats();
  }, [page, filterType, startDate, endDate, productIdParam]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 50 };
      
      if (productIdParam) params.productId = productIdParam;
      if (filterType !== 'all') params.type = filterType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await inventoryService.getMovements(params);
      setMovements(response.movements);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast.error('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await inventoryService.getMovementStats(params);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Fecha',
      'Tipo',
      'Producto',
      'Variante',
      'Cantidad',
      'Stock Anterior',
      'Stock Nuevo',
      'Costo Total',
      'Usuario',
      'Razón'
    ];

    const rows = movements.map(m => [
      formatDate(m.createdAt),
      m.type,
      m.product?.name || '-',
      m.variant?.name || '-',
      m.quantity,
      m.previousStock,
      m.newStock,
      m.totalCost || 0,
      m.userName || '-',
      m.reason || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimientos_inventario_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Historial de Movimientos</h1>
            <p className="text-gray-600 mt-1">Registro completo de movimientos de inventario</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Exportar CSV
            </button>
            <button
              onClick={() => router.push('/admin/inventory')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ← Volver a Inventario
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total Movimientos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMovements}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Entradas</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.byType.find(t => t.type === 'IN')?.count || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Salidas</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.byType.find(t => t.type === 'OUT')?.count || 0}
              </p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Movimiento
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="IN">Entradas</option>
                <option value="OUT">Salidas</option>
                <option value="ADJUSTMENT">Ajustes</option>
                <option value="RETURN">Devoluciones</option>
                <option value="WASTE">Mermas</option>
                <option value="TRANSFER">Transferencias</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setFilterType('all');
                  setPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de movimientos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto / Variante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Costo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Razón
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Cargando movimientos...
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron movimientos
                    </td>
                  </tr>
                ) : (
                  movements.map((movement) => {
                    const badge = getMovementTypeBadge(movement.type);
                    return (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(movement.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.bgColor} ${badge.color}`}
                          >
                            {badge.icon} {badge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {movement.product?.imageUrl && (
                              <img
                                src={movement.product.imageUrl}
                                alt={movement.product.name}
                                className="h-8 w-8 rounded object-cover mr-2"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {movement.product?.name || '-'}
                              </div>
                              {movement.variant && (
                                <div className="text-sm text-gray-500">
                                  {movement.variant.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-bold ${
                              movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {movement.quantity > 0 ? '+' : ''}
                            {movement.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">{movement.previousStock}</span>
                            <span>→</span>
                            <span className="font-bold">{movement.newStock}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.totalCost
                            ? formatCurrency(movement.totalCost)
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.userName || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {movement.reason || '-'}
                          {movement.notes && (
                            <div className="text-xs text-gray-500 truncate">
                              {movement.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Distribución por tipo */}
        {stats && stats.byType.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Distribución por Tipo de Movimiento
            </h3>
            <div className="space-y-3">
              {stats.byType.map((item) => {
                const badge = getMovementTypeBadge(item.type);
                const percentage =
                  stats.totalMovements > 0
                    ? ((item.count / stats.totalMovements) * 100).toFixed(1)
                    : 0;

                return (
                  <div key={item.type} className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.bgColor} ${badge.color}`}
                    >
                      {badge.icon} {badge.text}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.count} movimientos</span>
                        <span className="text-gray-900 font-medium">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${badge.bgColor.replace('bg-', 'bg-opacity-50 bg-')}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.totalCost)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
