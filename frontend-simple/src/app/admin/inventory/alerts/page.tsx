'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import inventoryService, {
  StockAlert,
  getAlertSeverityBadge,
  formatRelativeDate
} from '@/services/inventoryService';
import { toast } from 'react-hot-toast';

export default function InventoryAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<StockAlert | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  // Filtros
  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ACTIVE');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAlerts();
  }, [page, filterStatus, filterSeverity]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20, status: filterStatus };
      
      if (filterSeverity !== 'all') {
        params.severity = filterSeverity;
      }

      const response = await inventoryService.getAlerts(params);
      setAlerts(response.alerts);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await inventoryService.acknowledgeAlert(alertId);
      toast.success('Alerta reconocida');
      fetchAlerts();
    } catch (error) {
      toast.error('Error al reconocer alerta');
    }
  };

  const openResolveModal = (alert: StockAlert) => {
    setSelectedAlert(alert);
    setResolution('');
    setShowResolveModal(true);
  };

  const handleResolve = async () => {
    if (!selectedAlert || !resolution.trim()) {
      toast.error('Ingrese una resolución');
      return;
    }

    try {
      setResolving(true);
      await inventoryService.resolveAlert(selectedAlert.id, resolution);
      toast.success('Alerta resuelta');
      setShowResolveModal(false);
      fetchAlerts();
    } catch (error) {
      toast.error('Error al resolver alerta');
    } finally {
      setResolving(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '🔴';
      case 'WARNING':
        return '🟡';
      default:
        return '🔵';
    }
  };

  const getAlertTypeText = (type: string) => {
    switch (type) {
      case 'OUT_OF_STOCK':
        return 'Sin Stock';
      case 'LOW_STOCK':
        return 'Stock Bajo';
      case 'OVERSTOCK':
        return 'Sobrestock';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alertas de Stock</h1>
            <p className="text-gray-600 mt-1">Monitoreo y gestión de alertas de inventario</p>
          </div>
          <button
            onClick={() => router.push('/admin/inventory')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Volver a Inventario
          </button>
        </div>

        {/* Resumen de alertas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Críticas</p>
                <p className="text-3xl font-bold text-red-900">
                  {alerts.filter((a) => a.severity === 'CRITICAL').length}
                </p>
              </div>
              <div className="text-4xl">🔴</div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Advertencias</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {alerts.filter((a) => a.severity === 'WARNING').length}
                </p>
              </div>
              <div className="text-4xl">🟡</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Informativas</p>
                <p className="text-3xl font-bold text-blue-900">
                  {alerts.filter((a) => a.severity === 'INFO').length}
                </p>
              </div>
              <div className="text-4xl">🔵</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as any);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Activas</option>
                <option value="ACKNOWLEDGED">Reconocidas</option>
                <option value="RESOLVED">Resueltas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severidad
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => {
                  setFilterSeverity(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas</option>
                <option value="CRITICAL">Críticas</option>
                <option value="WARNING">Advertencias</option>
                <option value="INFO">Informativas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de alertas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Cargando alertas...</div>
          ) : alerts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron alertas con los filtros seleccionados
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {alerts.map((alert) => {
                const severityBadge = getAlertSeverityBadge(alert.severity);
                return (
                  <div
                    key={alert.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {alert.productName}
                            {alert.variantName && (
                              <span className="text-gray-600 font-normal ml-2">
                                - {alert.variantName}
                              </span>
                            )}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${severityBadge.bgColor} ${severityBadge.color}`}
                          >
                            {severityBadge.text}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">SKU</p>
                            <p className="text-sm font-medium text-gray-900">{alert.sku}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Stock Actual</p>
                            <p className="text-sm font-bold text-red-600">
                              {alert.currentStock} uds
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Stock Mínimo</p>
                            <p className="text-sm font-medium text-gray-900">
                              {alert.minStock} uds
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Punto de Reorden</p>
                            <p className="text-sm font-medium text-gray-900">
                              {alert.reorderPoint} uds
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Tipo: {getAlertTypeText(alert.alertType)}</span>
                          <span>•</span>
                          <span>Creada: {formatRelativeDate(alert.createdAt)}</span>
                          {alert.acknowledgedAt && (
                            <>
                              <span>•</span>
                              <span>Reconocida: {formatRelativeDate(alert.acknowledgedAt)}</span>
                            </>
                          )}
                        </div>

                        {alert.resolution && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm font-medium text-green-900">Resolución:</p>
                            <p className="text-sm text-green-700">{alert.resolution}</p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        {alert.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleAcknowledge(alert.id)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Reconocer
                            </button>
                            <button
                              onClick={() => openResolveModal(alert)}
                              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Resolver
                            </button>
                          </>
                        )}
                        {alert.status === 'ACKNOWLEDGED' && (
                          <button
                            onClick={() => openResolveModal(alert)}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Resolver
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
      </div>

      {/* Modal de Resolución */}
      {showResolveModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Resolver Alerta</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Producto:</p>
              <p className="font-medium">{selectedAlert.productName}</p>
              {selectedAlert.variantName && (
                <>
                  <p className="text-sm text-gray-600 mt-1">Variante:</p>
                  <p className="font-medium">{selectedAlert.variantName}</p>
                </>
              )}
              <p className="text-sm text-gray-600 mt-1">Stock Actual:</p>
              <p className="text-lg font-bold text-red-600">{selectedAlert.currentStock} uds</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de la Resolución *
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Se realizó orden de compra #12345, stock reabastecido, problema resuelto..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={resolving}
              >
                Cancelar
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving || !resolution.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {resolving ? 'Resolviendo...' : 'Confirmar Resolución'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
