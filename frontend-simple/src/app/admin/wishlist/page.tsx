'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  HeartIcon,
  BellIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import wishlistService, { WishlistAdminStats } from '@/services/wishlistService';
import Image from 'next/image';

export default function AdminWishlistStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<WishlistAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [processingAlerts, setProcessingAlerts] = useState(false);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await wishlistService.getAdminStats(period);
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAlerts = async () => {
    if (!confirm('¿Ejecutar proceso de notificación de cambios de precio? Esto enviará notificaciones a todos los usuarios con alertas activadas.')) {
      return;
    }

    setProcessingAlerts(true);
    try {
      const response = await wishlistService.notifyPriceChanges();
      
      if (response.success) {
        alert(`Proceso completado:\n- Items procesados: ${response.data.processed}\n- Notificaciones enviadas: ${response.data.notificationsSent}\n- Alertas creadas: ${response.data.alertsCreated}`);
        await loadStats();
      }
    } catch (error) {
      console.error('Error processing alerts:', error);
      alert('Error al procesar alertas de precio');
    } finally {
      setProcessingAlerts(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No se pudieron cargar las estadísticas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <HeartIcon className="w-8 h-8 text-red-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Estadísticas de Wishlist
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 90 días</option>
                <option value="365">Último año</option>
              </select>

              <button
                onClick={handleProcessAlerts}
                disabled={processingAlerts}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <PlayIcon className="w-5 h-5" />
                {processingAlerts ? 'Procesando...' : 'Procesar alertas de precio'}
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <HeartIcon className="w-8 h-8 text-red-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.overview.totalItems.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Productos en wishlists
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Usuarios</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.overview.totalUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Con wishlist activa
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <BellIcon className="w-8 h-8 text-yellow-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Alertas</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.overview.withPriceAlerts.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Alertas de precio activas
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <ChartBarIcon className="w-8 h-8 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Promedio</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.overview.avgItemsPerUser}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Items por usuario
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Actividad Reciente
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-2xl font-bold text-blue-600">
                {stats.overview.recentItems}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Productos agregados en últimos {period} días
              </div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-green-600">
                {stats.overview.withAvailabilityAlerts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Alertas de disponibilidad
              </div>
            </div>
          </div>
        </div>

        {/* Most Wishlisted Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-6 h-6 text-red-500" />
            Productos Más Deseados (Top 20)
          </h2>

          {stats.mostWishlisted.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No hay datos disponibles
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      #
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Producto
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Categoría
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Precio
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Stock
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      En Wishlists
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.mostWishlisted.map((item, index) => (
                    <tr
                      key={item.productId}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                            index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }
                        `}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {item.product ? (
                          <div className="flex items-center gap-3">
                            {item.product.imageUrl && (
                              <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {item.product.name}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                SKU: {item.product.slug}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Producto no disponible</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {item.product?.category || '-'}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-gray-900 dark:text-white">
                        ${item.product?.price?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {item.product?.inStock ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-semibold">
                            En stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-xs font-semibold">
                            Agotado
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <HeartIcon className="w-5 h-5 text-red-500" />
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {item.count}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Categorías Más Deseadas
            </h2>
            {stats.categoryStats.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No hay datos disponibles
              </p>
            ) : (
              <div className="space-y-3">
                {stats.categoryStats.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HeartIcon className="w-4 h-4 text-red-500" />
                      <span className="font-bold text-gray-900 dark:text-white">
                        {category.wishlist_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Trends Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Tendencia Diaria (Últimos 30 días)
            </h2>
            {stats.dailyTrends.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No hay datos disponibles
              </p>
            ) : (
              <div className="space-y-2">
                {stats.dailyTrends.map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-24">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                    <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-end pr-2"
                        style={{
                          width: `${(day.count / Math.max(...stats.dailyTrends.map(d => d.count))) * 100}%`,
                          minWidth: day.count > 0 ? '20px' : '0'
                        }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {day.count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
