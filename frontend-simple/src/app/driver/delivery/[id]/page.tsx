'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import deliveryService, { type Delivery } from '@/services/deliveryService';
import socketService from '@/services/socketService';
import OrderTrackingMap, { type MapMarker } from '@/components/maps/OrderTrackingMap';

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.id as string;

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [locationTracking, setLocationTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    loadDelivery();
    return () => {
      stopLocationTracking();
    };
  }, [deliveryId]);

  const loadDelivery = async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getDeliveryById(deliveryId);
      setDelivery(data);
      
      if (data.currentLocation) {
        setCurrentLocation(data.currentLocation);
      }
    } catch (error) {
      console.error('Error loading delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    setLocationTracking(true);
    
    // Obtener ubicación inicial
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        updateLocationOnServer(location.lat, location.lng, position.coords.accuracy);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('No se pudo obtener tu ubicación');
        setLocationTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    // Monitorear ubicación en tiempo real
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        updateLocationOnServer(location.lat, location.lng, position.coords.accuracy);
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocationTracking(false);
  };

  const updateLocationOnServer = async (lat: number, lng: number, accuracy?: number) => {
    try {
      await deliveryService.updateLocation(deliveryId, lat, lng, accuracy);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!delivery) return;

    const confirmMessage = newStatus === 'DELIVERED' 
      ? '¿Confirmar que el pedido ha sido entregado?'
      : `¿Cambiar estado a ${deliveryService.getDeliveryStatusText(newStatus)}?`;

    if (!confirm(confirmMessage)) return;

    try {
      setUpdating(true);
      await deliveryService.updateDeliveryStatus(deliveryId, newStatus);
      await loadDelivery(); // Recargar datos
      
      if (newStatus === 'DELIVERED') {
        stopLocationTracking();
        alert('¡Entrega completada exitosamente!');
        router.push('/driver');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!delivery) return;

    const notes = prompt('Notas de entrega (opcional):');
    
    try {
      setUpdating(true);
      await deliveryService.completeDelivery(deliveryId, notes || undefined);
      stopLocationTracking();
      alert('¡Entrega completada exitosamente!');
      router.push('/driver');
    } catch (error) {
      console.error('Error completing delivery:', error);
      alert('Error al completar la entrega');
    } finally {
      setUpdating(false);
    }
  };

  const getMapMarkers = (): MapMarker[] => {
    if (!delivery) return [];

    const markers: MapMarker[] = [];

    // Destino
    const addr = delivery.order.shippingAddress;
    if (addr.latitude && addr.longitude) {
      markers.push({
        id: 'destination',
        latitude: addr.latitude,
        longitude: addr.longitude,
        type: 'destination',
        label: `${delivery.order.customer.name} - ${addr.address1}`
      });
    }

    // Ubicación actual del repartidor
    if (currentLocation) {
      markers.push({
        id: 'driver',
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        type: 'driver',
        label: 'Tu ubicación actual'
      });
    } else if (delivery.currentLocation) {
      markers.push({
        id: 'driver',
        latitude: delivery.currentLocation.lat,
        longitude: delivery.currentLocation.lng,
        type: 'driver',
        label: 'Tu ubicación'
      });
    }

    // Origen (tienda)
    markers.push({
      id: 'origin',
      latitude: 40.7128,
      longitude: -74.0060,
      type: 'origin',
      label: 'Carnes Premium'
    });

    return markers;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando entrega...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Entrega no encontrada</p>
          <button
            onClick={() => router.push('/driver')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/driver')}
              className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-1"
            >
              ← Volver
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Pedido #{delivery.order.orderNumber}
            </h1>
            <p className="text-gray-600">
              {new Date(delivery.createdAt).toLocaleString('es-ES')}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${deliveryService.getDeliveryStatusColor(
              delivery.status
            )}`}
          >
            {deliveryService.getDeliveryStatusText(delivery.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapa y controles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mapa */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Mapa de Ruta</h2>
              <div className="h-[500px]">
                <OrderTrackingMap markers={getMapMarkers()} />
              </div>
            </div>

            {/* Controles de ubicación */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Seguimiento de Ubicación
              </h2>
              <div className="space-y-4">
                {!locationTracking ? (
                  <button
                    onClick={startLocationTracking}
                    disabled={delivery.status === 'DELIVERED'}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    🛰️ Iniciar Seguimiento en Tiempo Real
                  </button>
                ) : (
                  <div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                      <p className="text-green-800 font-medium flex items-center gap-2">
                        <span className="animate-pulse">📍</span>
                        Compartiendo ubicación en tiempo real
                      </p>
                      {currentLocation && (
                        <p className="text-sm text-green-700 mt-1">
                          Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={stopLocationTracking}
                      className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      Detener Seguimiento
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones de estado */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Actualizar Estado
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {delivery.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleStatusChange('PICKED_UP')}
                    disabled={updating}
                    className="bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition font-medium disabled:bg-gray-400"
                  >
                    📦 Recoger Pedido
                  </button>
                )}
                {delivery.status === 'PICKED_UP' && (
                  <button
                    onClick={() => handleStatusChange('IN_TRANSIT')}
                    disabled={updating}
                    className="bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition font-medium disabled:bg-gray-400"
                  >
                    🚗 En Camino
                  </button>
                )}
                {(delivery.status === 'IN_TRANSIT' || delivery.status === 'PICKED_UP') && (
                  <button
                    onClick={handleCompleteDelivery}
                    disabled={updating}
                    className="col-span-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-400"
                  >
                    ✅ Marcar como Entregado
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Detalles */}
          <div className="space-y-6">
            {/* Cliente */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Cliente</h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{delivery.order.customer.name}</p>
                <p className="text-gray-600">
                  📞 <a href={`tel:${delivery.order.customer.phone}`} className="hover:text-blue-600">
                    {delivery.order.customer.phone}
                  </a>
                </p>
                <p className="text-gray-600 text-sm">
                  ✉️ {delivery.order.customer.email}
                </p>
              </div>
            </div>

            {/* Dirección */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Dirección de Entrega
              </h2>
              <p className="text-gray-900 mb-1">{delivery.order.shippingAddress.address1}</p>
              {delivery.order.shippingAddress.address2 && (
                <p className="text-gray-900 mb-1">{delivery.order.shippingAddress.address2}</p>
              )}
              <p className="text-gray-600">
                {delivery.order.shippingAddress.city}, {delivery.order.shippingAddress.state}{' '}
                {delivery.order.shippingAddress.postalCode}
              </p>
              {delivery.order.specialInstructions && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-medium text-yellow-800">Instrucciones especiales:</p>
                  <p className="text-sm text-yellow-700">{delivery.order.specialInstructions}</p>
                </div>
              )}
            </div>

            {/* Productos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Productos ({delivery.order.items.length})
              </h2>
              <div className="space-y-3">
                {delivery.order.items.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-200 last:border-0">
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
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-gray-900">
                    ${delivery.order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Info de pago */}
            {delivery.order.paymentMethod && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Información de Pago
                </h2>
                <p className="text-gray-600">
                  Método: <span className="font-medium text-gray-900">{delivery.order.paymentMethod}</span>
                </p>
                <p className="text-gray-600">
                  Estado: <span className="font-medium text-gray-900">{delivery.order.paymentStatus}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
