'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import trackingService, { type TrackingData } from '@/services/trackingService';
import socketService from '@/services/socketService';
import OrderTrackingMap, { type MapMarker } from '@/components/maps/OrderTrackingMap';

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderNumberInput, setOrderNumberInput] = useState(orderNumber || '');
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Cargar datos de tracking
  const loadTracking = async (orderNum: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await trackingService.getTrackingByOrderNumber(orderNum);
      setTrackingData(data);

      // Inicializar ubicación del repartidor si existe
      if (data.delivery?.currentLocation) {
        setDriverLocation(data.delivery.currentLocation);
      }

      // Conectar WebSocket para actualizaciones en tiempo real
      socketService.connect();
      socketService.trackOrder(data.order.id);

      // Escuchar actualizaciones de ubicación
      socketService.onDriverLocationUpdate((update) => {
        setDriverLocation({
          lat: update.latitude,
          lng: update.longitude
        });
      });

      // Escuchar actualizaciones de estado
      socketService.onOrderStatusUpdate((update) => {
        if (update.orderId === data.order.id) {
          loadTracking(orderNum); // Recargar datos
        }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar tracking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber) {
      loadTracking(orderNumber);
    } else {
      setLoading(false);
    }

    return () => {
      socketService.removeAllListeners();
    };
  }, [orderNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumberInput.trim()) {
      window.history.pushState({}, '', `/track?order=${orderNumberInput}`);
      loadTracking(orderNumberInput);
    }
  };

  // Preparar marcadores para el mapa
  const getMapMarkers = (): MapMarker[] => {
    const markers: MapMarker[] = [];

    // Marcador de destino (dirección del cliente)
    if (trackingData?.order.shippingAddress) {
      const addr = typeof trackingData.order.shippingAddress === 'string' 
        ? JSON.parse(trackingData.order.shippingAddress)
        : trackingData.order.shippingAddress;

      if (addr.latitude && addr.longitude) {
        markers.push({
          id: 'destination',
          latitude: addr.latitude,
          longitude: addr.longitude,
          type: 'destination',
          label: addr.address1 || 'Dirección de entrega'
        });
      }
    }

    // Marcador del repartidor (ubicación en tiempo real)
    if (driverLocation) {
      markers.push({
        id: 'driver',
        latitude: driverLocation.lat,
        longitude: driverLocation.lng,
        type: 'driver',
        label: `Repartidor: ${trackingData?.delivery?.driver.name || 'En camino'}`
      });
    }

    // Marcador de origen (tienda - coordenadas por defecto o configurables)
    markers.push({
      id: 'origin',
      latitude: 40.7128,
      longitude: -74.0060,
      type: 'origin',
      label: 'Carnes Premium - Tienda'
    });

    return markers;
  };

  if (loading && orderNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información del pedido...</p>
        </div>
      </div>
    );
  }

  if (!orderNumber && !trackingData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Rastrear Pedido
            </h1>
            <p className="text-gray-600 mb-6 text-center">
              Ingresa tu número de pedido para ver el estado y ubicación en tiempo real
            </p>
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Número de pedido (ej: ORD-12345)"
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Rastrear Pedido
              </button>
            </form>
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setTrackingData(null);
                  window.history.pushState({}, '', '/track');
                }}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingData) return null;

  const order = trackingData.order;
  const delivery = trackingData.delivery;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Pedido #{order.orderNumber}
              </h1>
              <p className="text-gray-600">
                {new Date(order.createdAt).toLocaleString('es-ES', {
                  dateStyle: 'long',
                  timeStyle: 'short'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${order.total.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${trackingService.getStatusColor(order.status)}`}>
                {trackingService.getStatusText(order.status)}
              </span>
              <span className="text-sm text-gray-600">{order.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${order.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Información del repartidor */}
          {delivery && delivery.driver && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl">
                    🚗
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{delivery.driver.name}</p>
                    <p className="text-sm text-gray-600">{delivery.driver.phone}</p>
                    <p className="text-xs text-blue-600 font-medium">
                      {trackingService.getStatusText(delivery.status)}
                    </p>
                  </div>
                </div>
                {delivery.estimatedTime && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Llegada estimada</p>
                    <p className="font-bold text-gray-900">
                      {new Date(delivery.estimatedTime).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapa */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Ubicación en Tiempo Real
              </h2>
              <div className="h-[500px]">
                <OrderTrackingMap markers={getMapMarkers()} />
              </div>
            </div>
          </div>

          {/* Detalles y tracking */}
          <div className="space-y-6">
            {/* Historial de tracking */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Historial
              </h2>
              <div className="space-y-4">
                {trackingData.tracking.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {trackingService.getStatusIcon(event.status)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {trackingService.getStatusText(event.status)}
                      </p>
                      {event.message && (
                        <p className="text-sm text-gray-600">{event.message}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.createdAt).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Productos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Productos ({order.items.length})
              </h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-sm text-gray-600">{item.variantName}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        Cantidad: {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
