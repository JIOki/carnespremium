'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Calendar,
  Pause,
  Play,
  XCircle,
  SkipForward,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  getMySubscriptions,
  getSubscriptionDeliveries,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  skipDelivery,
  Subscription,
  SubscriptionDelivery
} from '@/services/subscriptionService';

/**
 * ===================================================
 * PÁGINA DE GESTIÓN DE SUSCRIPCIONES DEL USUARIO
 * ===================================================
 */

export default function MySubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [deliveries, setDeliveries] = useState<SubscriptionDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<SubscriptionDelivery | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [skipReason, setSkipReason] = useState('');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    if (selectedSubscription) {
      loadDeliveries(selectedSubscription.id);
    }
  }, [selectedSubscription]);

  const loadSubscriptions = async () => {
    try {
      const data = await getMySubscriptions();
      setSubscriptions(data);
      if (data.length > 0) {
        setSelectedSubscription(data[0]);
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveries = async (subscriptionId: string) => {
    try {
      const data = await getSubscriptionDeliveries(subscriptionId, { limit: 10 });
      setDeliveries(data);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  };

  const handlePauseSubscription = async (subscriptionId: string) => {
    setActionLoading(true);
    try {
      await pauseSubscription(subscriptionId);
      alert('Suscripción pausada exitosamente');
      await loadSubscriptions();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al pausar suscripción');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSubscription = async (subscriptionId: string) => {
    setActionLoading(true);
    try {
      await resumeSubscription(subscriptionId);
      alert('Suscripción reactivada exitosamente');
      await loadSubscriptions();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al reactivar suscripción');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    setActionLoading(true);
    try {
      await cancelSubscription(selectedSubscription.id, cancelReason);
      setShowCancelModal(false);
      alert('Suscripción cancelada exitosamente');
      await loadSubscriptions();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al cancelar suscripción');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipDelivery = async () => {
    if (!selectedDelivery) return;

    setActionLoading(true);
    try {
      await skipDelivery(selectedDelivery.id, skipReason);
      setShowSkipModal(false);
      alert('Entrega saltada exitosamente');
      if (selectedSubscription) {
        await loadDeliveries(selectedSubscription.id);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al saltar entrega');
    } finally {
      setActionLoading(false);
      setSelectedDelivery(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100';
      case 'PAUSED':
        return 'text-yellow-600 bg-yellow-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      case 'EXPIRED':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'text-blue-600 bg-blue-100';
      case 'PREPARING':
        return 'text-purple-600 bg-purple-100';
      case 'SHIPPED':
        return 'text-indigo-600 bg-indigo-100';
      case 'DELIVERED':
        return 'text-green-600 bg-green-100';
      case 'SKIPPED':
        return 'text-gray-600 bg-gray-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activa';
      case 'PAUSED': return 'Pausada';
      case 'CANCELLED': return 'Cancelada';
      case 'EXPIRED': return 'Expirada';
      default: return status;
    }
  };

  const getDeliveryStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'Programada';
      case 'PREPARING': return 'Preparando';
      case 'SHIPPED': return 'En Camino';
      case 'DELIVERED': return 'Entregada';
      case 'SKIPPED': return 'Saltada';
      case 'FAILED': return 'Fallida';
      default: return status;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'WEEKLY': return 'Semanal';
      case 'BIWEEKLY': return 'Quincenal';
      case 'MONTHLY': return 'Mensual';
      default: return frequency;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No tienes suscripciones activas
            </h2>
            <p className="text-gray-600 mb-8">
              Recibe cajas de productos premium directamente en tu puerta cada mes
            </p>
            <button
              onClick={() => router.push('/subscriptions')}
              className="px-8 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Ver Planes de Suscripción
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Suscripciones</h1>
          <p className="text-gray-600">Gestiona tus cajas de suscripción</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Subscriptions List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Tus Suscripciones</h2>
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubscription(sub)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedSubscription?.id === sub.id
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{sub.plan.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                        {getStatusLabel(sub.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {getFrequencyLabel(sub.frequency)}
                    </div>
                    <div className="text-sm font-medium text-red-600 mt-1">
                      ${sub.plan.price}/{getFrequencyLabel(sub.frequency).toLowerCase()}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => router.push('/subscriptions')}
                className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-600 hover:text-red-600 transition-colors"
              >
                + Nueva Suscripción
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedSubscription && (
              <>
                {/* Subscription Details */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedSubscription.plan.name}
                      </h2>
                      <p className="text-gray-600">{selectedSubscription.plan.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedSubscription.status)}`}>
                      {getStatusLabel(selectedSubscription.status)}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Entregas Totales</div>
                      <div className="text-xl font-bold text-gray-900">
                        {selectedSubscription.totalDeliveries}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Completadas</div>
                      <div className="text-xl font-bold text-green-600">
                        {selectedSubscription.completedDeliveries}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Saltadas</div>
                      <div className="text-xl font-bold text-gray-600">
                        {selectedSubscription.skippedDeliveries}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Total Gastado</div>
                      <div className="text-xl font-bold text-red-600">
                        ${selectedSubscription.totalSpent.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Next Delivery */}
                  {selectedSubscription.nextDeliveryDate && selectedSubscription.status === 'ACTIVE' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center text-blue-800">
                        <Calendar size={20} className="mr-2" />
                        <span className="font-medium">Próxima entrega:</span>
                        <span className="ml-2 font-bold">
                          {formatDate(selectedSubscription.nextDeliveryDate)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    {selectedSubscription.status === 'ACTIVE' && (
                      <>
                        <button
                          onClick={() => router.push(`/subscriptions/${selectedSubscription.id}/edit`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          Editar Preferencias
                        </button>
                        <button
                          onClick={() => handlePauseSubscription(selectedSubscription.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center"
                        >
                          <Pause size={18} className="mr-2" />
                          Pausar
                        </button>
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
                        >
                          <XCircle size={18} className="mr-2" />
                          Cancelar
                        </button>
                      </>
                    )}

                    {selectedSubscription.status === 'PAUSED' && (
                      <button
                        onClick={() => handleResumeSubscription(selectedSubscription.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
                      >
                        <Play size={18} className="mr-2" />
                        Reanudar
                      </button>
                    )}
                  </div>
                </div>

                {/* Deliveries History */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Historial de Entregas</h3>
                  
                  {deliveries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay entregas registradas aún
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {deliveries.map((delivery) => (
                        <div
                          key={delivery.id}
                          className="border rounded-lg p-4 hover:border-red-600 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center mb-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDeliveryStatusColor(delivery.status)}`}>
                                  {getDeliveryStatusLabel(delivery.status)}
                                </span>
                                <span className="ml-3 text-sm text-gray-600">
                                  {formatDate(delivery.scheduledDate)}
                                </span>
                              </div>
                              {delivery.trackingNumber && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Tracking: {delivery.trackingNumber}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                ${delivery.totalValue.toFixed(2)}
                              </div>
                              {delivery.status === 'SCHEDULED' && (
                                <button
                                  onClick={() => {
                                    setSelectedDelivery(delivery);
                                    setShowSkipModal(true);
                                  }}
                                  className="mt-1 text-sm text-red-600 hover:text-red-700 flex items-center"
                                >
                                  <SkipForward size={14} className="mr-1" />
                                  Saltar
                                </button>
                              )}
                            </div>
                          </div>

                          {delivery.products && delivery.products.length > 0 && (
                            <div className="text-sm text-gray-600">
                              {delivery.products.length} productos incluidos
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center text-red-600 mb-4">
                <AlertCircle size={24} className="mr-2" />
                <h3 className="text-xl font-bold">Cancelar Suscripción</h3>
              </div>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que deseas cancelar tu suscripción? Las entregas programadas serán canceladas.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de cancelación (opcional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  rows={3}
                  placeholder="Cuéntanos por qué cancelas..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Mantener
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Skip Delivery Modal */}
        {showSkipModal && selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center text-yellow-600 mb-4">
                <SkipForward size={24} className="mr-2" />
                <h3 className="text-xl font-bold">Saltar Entrega</h3>
              </div>
              <p className="text-gray-600 mb-4">
                La entrega del {formatDate(selectedDelivery.scheduledDate)} será saltada y la próxima será reprogramada.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo (opcional)
                </label>
                <textarea
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  rows={2}
                  placeholder="Ej: Estaré de viaje"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSkipModal(false);
                    setSelectedDelivery(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSkipDelivery}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
