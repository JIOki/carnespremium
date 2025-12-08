'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Crown,
  Calendar,
  TrendingUp,
  Gift,
  Pause,
  Play,
  XCircle,
  ArrowUpCircle,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  getMyMembership,
  getMembershipPlans,
  cancelMembership,
  pauseMembership,
  resumeMembership,
  UserMembership,
  MembershipPlan
} from '@/services/subscriptionService';

/**
 * ===================================================
 * PÁGINA DE GESTIÓN DE MEMBRESÍA DEL USUARIO
 * ===================================================
 */

export default function MyMembershipPage() {
  const router = useRouter();
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadMembershipData();
  }, []);

  const loadMembershipData = async () => {
    try {
      const [membershipData, plansData] = await Promise.all([
        getMyMembership(),
        getMembershipPlans()
      ]);

      if (membershipData.hasMembership) {
        setMembership(membershipData.membership!);
      }
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseMembership = async () => {
    if (!membership) return;

    setActionLoading(true);
    try {
      await pauseMembership();
      alert('Membresía pausada exitosamente');
      await loadMembershipData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al pausar membresía');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeMembership = async () => {
    if (!membership) return;

    setActionLoading(true);
    try {
      await resumeMembership();
      alert('Membresía reactivada exitosamente');
      await loadMembershipData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al reactivar membresía');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelMembership = async () => {
    if (!membership) return;

    setActionLoading(true);
    try {
      await cancelMembership(cancelReason);
      setShowCancelModal(false);
      alert('Membresía cancelada exitosamente');
      await loadMembershipData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al cancelar membresía');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgradePlan = (planId: string) => {
    router.push(`/account/membership/subscribe?planId=${planId}&upgrade=true`);
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activa';
      case 'PAUSED': return 'Pausada';
      case 'CANCELLED': return 'Cancelada';
      case 'EXPIRED': return 'Expirada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Crown size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No tienes una membresía activa
            </h2>
            <p className="text-gray-600 mb-8">
              Obtén beneficios exclusivos, descuentos y envío gratis con nuestras membresías premium
            </p>
            <button
              onClick={() => router.push('/subscriptions')}
              className="px-8 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Ver Planes de Membresía
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Membresía</h1>
          <p className="text-gray-600">Gestiona tu membresía premium</p>
        </div>

        {/* Main Membership Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div 
            className="h-2"
            style={{ backgroundColor: membership.plan.color || '#ef4444' }}
          ></div>
          
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="p-4 bg-red-100 rounded-full mr-4">
                  <Crown size={32} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {membership.plan.displayName}
                  </h2>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(membership.status)}`}>
                    {getStatusLabel(membership.status)}
                  </span>
                </div>
              </div>
              {membership.status === 'ACTIVE' && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Próxima renovación</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatDate(membership.nextPaymentDate!)}
                  </div>
                  {membership.daysRemaining && (
                    <div className="text-sm text-gray-600 mt-1">
                      {membership.daysRemaining} días restantes
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Descuento</div>
                <div className="text-2xl font-bold text-red-600">
                  {membership.plan.discountPercent}%
                </div>
                <div className="text-xs text-gray-500 mt-1">En todas tus compras</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Ahorro Total</div>
                <div className="text-2xl font-bold text-green-600">
                  ${membership.totalSavings.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Acumulado</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Órdenes este mes</div>
                <div className="text-2xl font-bold text-blue-600">
                  {membership.ordersThisMonth}
                  {membership.plan.maxMonthlyOrders && (
                    <span className="text-sm text-gray-500">
                      / {membership.plan.maxMonthlyOrders}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">Beneficio usado</div>
              </div>
            </div>

            {/* Features List */}
            <div className="border-t pt-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Beneficios Activos:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center text-sm">
                  <Check size={16} className="text-green-600 mr-2" />
                  <span>{membership.plan.discountPercent}% descuento en todas las compras</span>
                </div>
                {membership.plan.freeShipping && (
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-600 mr-2" />
                    <span>Envío gratis ilimitado</span>
                  </div>
                )}
                {membership.plan.earlyAccess && (
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-600 mr-2" />
                    <span>Acceso anticipado a nuevos productos</span>
                  </div>
                )}
                {membership.plan.exclusiveProducts && (
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-600 mr-2" />
                    <span>Acceso a productos exclusivos</span>
                  </div>
                )}
                {membership.plan.pointsMultiplier > 1 && (
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-600 mr-2" />
                    <span>{membership.plan.pointsMultiplier}x puntos de lealtad</span>
                  </div>
                )}
                {membership.plan.prioritySupport && (
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-600 mr-2" />
                    <span>Soporte prioritario 24/7</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              {membership.status === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <ArrowUpCircle size={20} className="mr-2" />
                    Cambiar Plan
                  </button>
                  <button
                    onClick={handlePauseMembership}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center"
                  >
                    <Pause size={20} className="mr-2" />
                    Pausar Membresía
                  </button>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
                  >
                    <XCircle size={20} className="mr-2" />
                    Cancelar Membresía
                  </button>
                </>
              )}
              
              {membership.status === 'PAUSED' && (
                <button
                  onClick={handleResumeMembership}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
                >
                  <Play size={20} className="mr-2" />
                  Reanudar Membresía
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Información de Facturación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Ciclo de Facturación</div>
              <div className="font-medium text-gray-900">{membership.billingCycle}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Fecha de Inicio</div>
              <div className="font-medium text-gray-900">{formatDate(membership.startDate)}</div>
            </div>
            {membership.lastPaymentDate && (
              <div>
                <div className="text-sm text-gray-500">Último Pago</div>
                <div className="font-medium text-gray-900">{formatDate(membership.lastPaymentDate)}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-500">Renovación Automática</div>
              <div className="font-medium text-gray-900">
                {membership.autoRenew ? 'Activada' : 'Desactivada'}
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center text-red-600 mb-4">
                <AlertCircle size={24} className="mr-2" />
                <h3 className="text-xl font-bold">Cancelar Membresía</h3>
              </div>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que deseas cancelar tu membresía? Perderás todos los beneficios activos.
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
                  Mantener Membresía
                </button>
                <button
                  onClick={handleCancelMembership}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Cambiar Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans
                  .filter(p => p.id !== membership.planId)
                  .map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4 hover:border-red-600 transition-colors">
                      <h4 className="font-bold text-lg mb-2">{plan.displayName}</h4>
                      <div className="text-2xl font-bold text-red-600 mb-2">
                        ${plan.monthlyPrice}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">{plan.discountPercent}% descuento</div>
                      <button
                        onClick={() => handleUpgradePlan(plan.id)}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                      >
                        Seleccionar
                      </button>
                    </div>
                  ))}
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="mt-6 w-full px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
