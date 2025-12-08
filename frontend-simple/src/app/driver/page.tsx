'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import deliveryService, { type Delivery, type DeliveryStats } from '@/services/deliveryService';

export default function DriverDashboard() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filterStatus = filter === 'all' ? undefined : filter;
      const [deliveriesData, statsData] = await Promise.all([
        deliveryService.getMyDeliveries(filterStatus),
        deliveryService.getStats()
      ]);
      setDeliveries(deliveriesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryClick = (deliveryId: string) => {
    router.push(`/driver/delivery/${deliveryId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando entregas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Repartidor</h1>
          <p className="text-gray-600">Gestiona tus entregas y rutas</p>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-1">Total Entregas</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-1">Completadas</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-1">Pendientes</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-1">Hoy</p>
              <p className="text-3xl font-bold text-blue-600">{stats.today}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-1">Calificación</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                {stats.averageRating > 0 && <span className="text-lg">⭐</span>}
              </p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                filter === 'PENDING'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilter('ASSIGNED')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                filter === 'ASSIGNED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Asignadas
            </button>
            <button
              onClick={() => setFilter('IN_TRANSIT')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                filter === 'IN_TRANSIT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En Camino
            </button>
            <button
              onClick={() => setFilter('DELIVERED')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                filter === 'DELIVERED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Entregadas
            </button>
          </div>
        </div>

        {/* Lista de entregas */}
        <div className="space-y-4">
          {deliveries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <p className="text-xl text-gray-600">No hay entregas {filter !== 'all' ? 'con este estado' : ''}</p>
            </div>
          ) : (
            deliveries.map((delivery) => (
              <div
                key={delivery.id}
                onClick={() => handleDeliveryClick(delivery.id)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Pedido #{delivery.order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(delivery.createdAt).toLocaleString('es-ES', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${deliveryService.getDeliveryStatusColor(
                      delivery.status
                    )}`}
                  >
                    {deliveryService.getDeliveryStatusText(delivery.status)}
                  </span>
                </div>

                {/* Cliente */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Cliente</p>
                  <p className="text-gray-900">{delivery.order.customer.name}</p>
                  <p className="text-sm text-gray-600">{delivery.order.customer.phone}</p>
                </div>

                {/* Dirección */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Dirección de entrega</p>
                  <p className="text-gray-900">
                    {delivery.order.shippingAddress.address1}
                    {delivery.order.shippingAddress.address2 &&
                      `, ${delivery.order.shippingAddress.address2}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {delivery.order.shippingAddress.city},{' '}
                    {delivery.order.shippingAddress.state}{' '}
                    {delivery.order.shippingAddress.postalCode}
                  </p>
                </div>

                {/* Productos */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Productos ({delivery.order.items.length})
                  </p>
                  <div className="flex gap-2 overflow-x-auto">
                    {delivery.order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex-shrink-0">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                      </div>
                    ))}
                    {delivery.order.items.length > 3 && (
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-600 text-sm font-medium">
                        +{delivery.order.items.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info adicional */}
                <div className="flex items-center justify-between text-sm">
                  <div>
                    {delivery.estimatedTime && (
                      <p className="text-gray-600">
                        <span className="font-medium">ETA:</span>{' '}
                        {deliveryService.formatEstimatedTime(delivery.estimatedTime)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${delivery.order.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
