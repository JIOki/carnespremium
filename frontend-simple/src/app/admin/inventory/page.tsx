'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import inventoryService, {
  InventoryProduct,
  InventoryStats,
  getStockStatusBadge,
  formatCurrency
} from '@/services/inventoryService';
import { toast } from 'react-hot-toast';

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjustingStock, setAdjustingStock] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal de ajuste de stock
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, [page, filterStatus, search]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      
      if (search) params.search = search;
      if (filterStatus === 'low') params.lowStock = true;
      if (filterStatus === 'out') params.outOfStock = true;

      const response = await inventoryService.getInventory(params);
      setProducts(response.products);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await inventoryService.getInventoryStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const openAdjustModal = (product: InventoryProduct, variant: any) => {
    setSelectedVariant({ ...variant, productName: product.name });
    setAdjustQuantity(0);
    setAdjustReason('');
    setAdjustNotes('');
    setShowAdjustModal(true);
  };

  const handleAdjustStock = async () => {
    if (!selectedVariant || adjustQuantity === 0) {
      toast.error('Ingrese una cantidad válida');
      return;
    }

    try {
      setAdjustingStock(true);
      await inventoryService.adjustStock({
        variantId: selectedVariant.id,
        quantity: adjustQuantity,
        reason: adjustReason,
        notes: adjustNotes
      });

      toast.success('Stock ajustado exitosamente');
      setShowAdjustModal(false);
      fetchInventory();
      fetchStats();
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      toast.error(error.response?.data?.error || 'Error al ajustar stock');
    } finally {
      setAdjustingStock(false);
    }
  };

  const handleCheckAlerts = async () => {
    try {
      const response = await inventoryService.checkAlerts();
      toast.success(`${response.alertsCreated} alertas creadas/actualizadas`);
      fetchStats();
    } catch (error) {
      toast.error('Error al verificar alertas');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Inventario</h1>
            <p className="text-gray-600 mt-1">Gestión de stock y control de inventario</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCheckAlerts}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Verificar Alertas
            </button>
            <button
              onClick={() => router.push('/admin/inventory/movements')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ver Movimientos
            </button>
            <button
              onClick={() => router.push('/admin/inventory/alerts')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Ver Alertas
            </button>
            <button
              onClick={() => router.push('/admin/suppliers')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Proveedores
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.totalProducts}</p>
                  <p className="text-xs text-gray-500">{stats.overview.totalVariants} variantes</p>
                </div>
                <div className="text-4xl">📦</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.totalStock}</p>
                  <p className="text-xs text-gray-500">Unidades</p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${parseFloat(stats.overview.totalValue).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Costo de inventario</p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Alertas Activas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overview.activeAlerts}</p>
                  <p className="text-xs text-gray-500">
                    {stats.alerts.critical} críticas, {stats.alerts.warning} advertencias
                  </p>
                </div>
                <div className="text-4xl">⚠️</div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre, SKU..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Stock
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="low">Stock Bajo</option>
                <option value="out">Sin Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de inventario */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Variantes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Punto de Reorden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Cargando inventario...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">{product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {product.variants.map((variant) => {
                            const badge = getStockStatusBadge(
                              variant.stock === 0
                                ? 'OUT_OF_STOCK'
                                : variant.stock <= product.reorderPoint
                                ? 'LOW_STOCK'
                                : 'IN_STOCK'
                            );
                            return (
                              <div
                                key={variant.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-700">{variant.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{variant.stock} uds</span>
                                  <button
                                    onClick={() => openAdjustModal(product, variant)}
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    Ajustar
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-gray-900">
                          {product.totalStock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const badge = getStockStatusBadge(product.stockStatus);
                          return (
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.bgColor} ${badge.color}`}
                            >
                              {badge.text}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.reorderPoint} uds
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() =>
                            router.push(`/admin/inventory/movements?productId=${product.id}`)
                          }
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Ver Movimientos
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
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

      {/* Modal de Ajuste de Stock */}
      {showAdjustModal && selectedVariant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ajustar Stock</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Producto:</p>
              <p className="font-medium">{selectedVariant.productName}</p>
              <p className="text-sm text-gray-600 mt-1">Variante:</p>
              <p className="font-medium">{selectedVariant.name}</p>
              <p className="text-sm text-gray-600 mt-1">Stock Actual:</p>
              <p className="text-lg font-bold text-blue-600">{selectedVariant.stock} unidades</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad a Ajustar (+ para agregar, - para quitar)
              </label>
              <input
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: +50 o -20"
              />
              {adjustQuantity !== 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Nuevo stock: {selectedVariant.stock + adjustQuantity} unidades
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón del Ajuste
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar razón...</option>
                <option value="Compra de inventario">Compra de inventario</option>
                <option value="Ajuste por conteo físico">Ajuste por conteo físico</option>
                <option value="Devolución de cliente">Devolución de cliente</option>
                <option value="Merma o pérdida">Merma o pérdida</option>
                <option value="Producto dañado">Producto dañado</option>
                <option value="Corrección de error">Corrección de error</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Detalles adicionales..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={adjustingStock}
              >
                Cancelar
              </button>
              <button
                onClick={handleAdjustStock}
                disabled={adjustingStock || adjustQuantity === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {adjustingStock ? 'Ajustando...' : 'Confirmar Ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
