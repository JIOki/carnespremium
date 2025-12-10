'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Trash2,
  Bell,
  BellOff,
  Share2,
  Filter,
  X,
  ShoppingCart,
  DollarSign,
  Tag,
  Play,
  Users,
  BarChart3,
  TrendingUp,

} from 'lucide-react';
import wishlistService, { WishlistItem, WishlistPriority, WishlistStats } from '@/services/wishlistService';
import Image from 'next/image';

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [stats, setStats] = useState<WishlistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    priority: WishlistPriority | '';
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }>({
    priority: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWishlist();
  }, [filters]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistService.getWishlist({
        ...filters,
        priority: filters.priority || undefined
      });

      if (response.success) {
        setItems(response.data.items);
        setStats(response.data.stats);
      }
    } catch (error: any) {
      console.error('Error loading wishlist:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto de tu lista de deseos?')) {
      return;
    }

    try {
      const response = await wishlistService.removeFromWishlist(itemId);
      if (response.success) {
        await loadWishlist();
      }
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Error al eliminar el producto');
    }
  };

  const handleToggleAlert = async (item: WishlistItem, type: 'price' | 'availability') => {
    try {
      const updateData = {
        ...item,
        notifyPriceChange: type === 'price' ? !item.notifyPriceChange : item.notifyPriceChange,
        notifyAvailability: type === 'availability' ? !item.notifyAvailability : item.notifyAvailability
      };

      const response = await wishlistService.updateWishlistItem(item.id, updateData);
      if (response.success) {
        await loadWishlist();
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      alert('Error al actualizar la configuración');
    }
  };

  const handleClearAll = async () => {
    if (!confirm(`¿Estás seguro de eliminar TODOS los ${items.length} productos de tu lista de deseos?`)) {
      return;
    }

    try {
      const response = await wishlistService.clearWishlist();
      if (response.success) {
        await loadWishlist();
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      alert('Error al limpiar la lista');
    }
  };

  const handleShare = () => {
    router.push('/wishlist/share');
  };

  const getPriceChangeColor = (priceChange: number | null) => {
    if (!priceChange) return 'text-gray-500';
    if (priceChange < 0) return 'text-green-600 dark:text-green-400';
    if (priceChange > 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500';
  };

  const getPriceChangeIcon = (priceChange: number | null) => {
    if (!priceChange) return null;
    if (priceChange < 0) return '↓';
    if (priceChange > 0) return '↑';
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
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
              <Heart className="w-8 h-8 text-red-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Mi Lista de Deseos
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filtros
              </button>

              {items.length > 0 && (
                <>
                  <button
                    onClick={handleShare}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Compartir
                  </button>

                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Limpiar todo
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalItems}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Productos guardados
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.withPriceAlerts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Con alerta de precio
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-green-600">
                  {stats.withAvailabilityAlerts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Con alerta de stock
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.highPriority}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Alta prioridad
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtros
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prioridad
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value as WishlistPriority | '' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">Todas</option>
                  <option value="LOW">Baja</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordenar por
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="createdAt">Fecha agregado</option>
                  <option value="priority">Prioridad</option>
                  <option value="updatedAt">Última actualización</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orden
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {items.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Tu lista de deseos está vacía
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Comienza a agregar productos que te gusten
            </p>
            <button
              onClick={() => router.push('/busqueda')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Explorar productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                  {item.product?.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tag className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  {/* Priority Badge */}
                  {item.priority === 'HIGH' && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      Alta prioridad
                    </div>
                  )}

                  {/* Sale Badge */}
                  {item.isOnSale && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      En oferta
                    </div>
                  )}

                  {/* Stock Status */}
                  {!item.inStock && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold">
                        Agotado
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {item.product?.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${item.currentPrice?.toFixed(2)}
                    </span>
                    {item.priceChange && (
                      <span className={`text-sm font-semibold ${getPriceChangeColor(item.priceChange)}`}>
                        {getPriceChangeIcon(item.priceChange)} {Math.abs(item.priceChange).toFixed(1)}%
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {item.notes}
                    </p>
                  )}

                  {/* Alert Toggles */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => handleToggleAlert(item, 'price')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${item.notifyPriceChange
                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      title="Notificar cambios de precio"
                    >
                      {item.notifyPriceChange ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                      <span className="text-xs">Precio</span>
                    </button>

                    <button
                      onClick={() => handleToggleAlert(item, 'availability')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${item.notifyAvailability
                        ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-600 dark:text-green-400'
                        : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      title="Notificar disponibilidad"
                    >
                      {item.notifyAvailability ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                      <span className="text-xs">Stock</span>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/products/${item.product?.slug}`)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      disabled={!item.inStock}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Ver producto
                    </button>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
