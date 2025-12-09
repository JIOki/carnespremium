'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import trackingService, { type MyOrder } from '@/services/trackingService';

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await trackingService.getMyOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = (orderNumber: string) => {
    router.push(`/track?order=${orderNumber}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadOrders}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Pedidos</h1>
          <p className="text-gray-600">Rastrea y gestiona tus pedidos</p>
        </div>

        {/* Lista de pedidos */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No tienes pedidos aún
            </h2>
            <p className="text-gray-600 mb-6">
              ¡Comienza a comprar nuestros productos premium!
            </p>
            <button
              onClick={() => router.push('/busqueda')}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Ver Productos
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                {/* Header del pedido */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold">
                        Pedido #{order.orderNumber}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-100">Total</p>
                      <p className="text-2xl font-bold">${order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {trackingService.getStatusText(order.status)}
                      </span>
                      <span className="text-sm">{order.progress}%</span>
                    </div>
                    <div className="w-full bg-blue-900 bg-opacity-30 rounded-full h-2">
                      <div
                        className="bg-white h-2 rounded-full transition-all duration-500"
                        style={{ width: `${order.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Cuerpo del pedido */}
                <div className="p-6">
                  {/* Productos */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Productos ({order.itemCount})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {order.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="flex flex-col">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-full h-24 object-cover rounded mb-2"
                            />
                          )}
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="flex items-center justify-center h-24 bg-gray-100 rounded">
                          <p className="text-gray-600 font-medium">
                            +{order.items.length - 4} más
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Último evento de tracking */}
                  {order.latestTracking && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {trackingService.getStatusIcon(order.latestTracking.status)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {trackingService.getStatusText(order.latestTracking.status)}
                          </p>
                          {order.latestTracking.message && (
                            <p className="text-sm text-gray-600">
                              {order.latestTracking.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.latestTracking.createdAt).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info de entrega */}
                  {order.delivery && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🚗</span>
                        <span className="font-medium text-blue-900">
                          Estado de Entrega:{' '}
                          {order.delivery.status === 'IN_TRANSIT' && 'En Camino'}
                          {order.delivery.status === 'DELIVERED' && 'Entregado'}
                          {order.delivery.status === 'ASSIGNED' && 'Asignado'}
                          {order.delivery.status === 'PENDING' && 'Pendiente'}
                        </span>
                      </div>
                      {order.delivery.estimatedTime && (
                        <p className="text-sm text-blue-700">
                          Llegada estimada:{' '}
                          {new Date(order.delivery.estimatedTime).toLocaleString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleTrackOrder(order.orderNumber)}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      📍 Rastrear en Tiempo Real
                    </button>
                    <button
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition font-medium"
                    >
                      Ver Detalles
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
