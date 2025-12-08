'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Crown, 
  Sparkles, 
  Check, 
  Star,
  Package,
  Truck,
  Gift,
  TrendingUp,
  Clock,
  Calendar
} from 'lucide-react';
import { 
  getMembershipPlans, 
  getSubscriptionPlans,
  MembershipPlan,
  SubscriptionPlan
} from '@/services/subscriptionService';

/**
 * ===================================================
 * PÁGINA DE PLANES - Membresías y Suscripciones
 * ===================================================
 */

export default function SubscriptionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'membership' | 'subscription'>('membership');
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const [memberships, subscriptions] = await Promise.all([
        getMembershipPlans(),
        getSubscriptionPlans()
      ]);
      setMembershipPlans(memberships);
      setSubscriptionPlans(subscriptions);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMembershipPlan = (plan: MembershipPlan) => {
    // Redirigir a página de checkout o inscripción
    router.push(`/account/membership/subscribe?planId=${plan.id}&cycle=${billingCycle}`);
  };

  const handleSelectSubscriptionPlan = (plan: SubscriptionPlan) => {
    // Redirigir a página de configuración de suscripción
    router.push(`/subscriptions/subscribe?planId=${plan.id}`);
  };

  const getMembershipPrice = (plan: MembershipPlan) => {
    switch (billingCycle) {
      case 'MONTHLY':
        return plan.monthlyPrice;
      case 'QUARTERLY':
        return plan.quarterlyPrice || plan.monthlyPrice * 3;
      case 'ANNUAL':
        return plan.annualPrice || plan.monthlyPrice * 12;
      default:
        return plan.monthlyPrice;
    }
  };

  const getMembershipMonthlyPrice = (plan: MembershipPlan) => {
    const price = getMembershipPrice(plan);
    switch (billingCycle) {
      case 'MONTHLY':
        return price;
      case 'QUARTERLY':
        return price / 3;
      case 'ANNUAL':
        return price / 12;
      default:
        return price;
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando planes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planes y Suscripciones Premium
          </h1>
          <p className="text-xl text-gray-600">
            Disfruta de beneficios exclusivos y productos de calidad superior
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow p-1 flex">
            <button
              onClick={() => setActiveTab('membership')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'membership'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Crown className="inline-block mr-2" size={20} />
              Membresías Premium
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'subscription'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="inline-block mr-2" size={20} />
              Cajas de Suscripción
            </button>
          </div>
        </div>

        {/* Membership Plans */}
        {activeTab === 'membership' && (
          <div>
            {/* Billing Cycle Selector */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-lg shadow p-1 flex">
                <button
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`px-4 py-2 rounded font-medium ${
                    billingCycle === 'MONTHLY'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setBillingCycle('QUARTERLY')}
                  className={`px-4 py-2 rounded font-medium ${
                    billingCycle === 'QUARTERLY'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Trimestral
                  <span className="ml-1 text-xs text-green-600">-10%</span>
                </button>
                <button
                  onClick={() => setBillingCycle('ANNUAL')}
                  className={`px-4 py-2 rounded font-medium ${
                    billingCycle === 'ANNUAL'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Anual
                  <span className="ml-1 text-xs text-green-600">-20%</span>
                </button>
              </div>
            </div>

            {/* Membership Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {membershipPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
                  style={{ borderTop: `4px solid ${plan.color || '#ef4444'}` }}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="text-center mb-4">
                      <div className="inline-block p-3 bg-red-100 rounded-full mb-2">
                        <Crown size={32} className="text-red-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {plan.displayName}
                      </h3>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-gray-900">
                        ${getMembershipMonthlyPrice(plan).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">por mes</div>
                      {billingCycle !== 'MONTHLY' && (
                        <div className="text-sm text-gray-500 mt-1">
                          Facturado ${getMembershipPrice(plan).toFixed(2)} {
                            billingCycle === 'QUARTERLY' ? 'trimestralmente' : 'anualmente'
                          }
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm">
                        <Check size={16} className="text-green-600 mr-2 flex-shrink-0" />
                        <span>{plan.discountPercent}% descuento en compras</span>
                      </div>
                      {plan.freeShipping && (
                        <div className="flex items-center text-sm">
                          <Check size={16} className="text-green-600 mr-2 flex-shrink-0" />
                          <span>Envío gratis ilimitado</span>
                        </div>
                      )}
                      {plan.earlyAccess && (
                        <div className="flex items-center text-sm">
                          <Check size={16} className="text-green-600 mr-2 flex-shrink-0" />
                          <span>Acceso anticipado</span>
                        </div>
                      )}
                      {plan.exclusiveProducts && (
                        <div className="flex items-center text-sm">
                          <Check size={16} className="text-green-600 mr-2 flex-shrink-0" />
                          <span>Productos exclusivos</span>
                        </div>
                      )}
                      {plan.pointsMultiplier > 1 && (
                        <div className="flex items-center text-sm">
                          <Check size={16} className="text-green-600 mr-2 flex-shrink-0" />
                          <span>{plan.pointsMultiplier}x puntos de lealtad</span>
                        </div>
                      )}
                      {plan.prioritySupport && (
                        <div className="flex items-center text-sm">
                          <Check size={16} className="text-green-600 mr-2 flex-shrink-0" />
                          <span>Soporte prioritario</span>
                        </div>
                      )}
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => handleSelectMembershipPlan(plan)}
                      className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Suscribirse Ahora
                    </button>

                    {/* Members Count */}
                    {plan.totalMembers && plan.totalMembers > 0 && (
                      <div className="text-center mt-4 text-sm text-gray-500">
                        <Star className="inline-block mr-1" size={14} />
                        {plan.totalMembers} miembros activos
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        {activeTab === 'subscription' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
              >
                {/* Image */}
                {plan.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={plan.imageUrl}
                      alt={plan.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                        {plan.boxType}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-gray-600 text-sm">{plan.description}</p>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={16} className="mr-2" />
                      <span>Entrega {getFrequencyLabel(plan.deliveryFrequency)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Package size={16} className="mr-2" />
                      <span>{plan.productCount} productos incluidos</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <TrendingUp size={16} className="mr-2" />
                      <span>Valor estimado: ${plan.estimatedValue}</span>
                    </div>
                  </div>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <Check size={16} className="text-green-600 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <div className="border-t pt-4 mb-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-3xl font-bold text-gray-900">
                          ${plan.price}
                        </span>
                        <span className="text-gray-500 ml-2">
                          / {getFrequencyLabel(plan.deliveryFrequency).toLowerCase()}
                        </span>
                      </div>
                      {plan.comparePrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${plan.comparePrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => handleSelectSubscriptionPlan(plan)}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    disabled={plan.availableSlots !== null && plan.availableSlots <= 0}
                  >
                    {plan.availableSlots !== null && plan.availableSlots <= 0
                      ? 'Agotado'
                      : 'Suscribirse'}
                  </button>

                  {/* Availability */}
                  {plan.availableSlots !== null && plan.availableSlots > 0 && plan.availableSlots <= 10 && (
                    <div className="text-center mt-3 text-sm text-orange-600">
                      ⚠️ Solo quedan {plan.availableSlots} espacios
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'membership' && membershipPlans.length === 0) ||
          (activeTab === 'subscription' && subscriptionPlans.length === 0)) && (
          <div className="text-center py-12">
            <Sparkles size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Planes Próximamente
            </h3>
            <p className="text-gray-600">
              Estamos preparando increíbles planes para ti.
            </p>
          </div>
        )}

        {/* Benefits Section */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            ¿Por qué suscribirse?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
                <Gift size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ahorro Garantizado</h3>
              <p className="text-gray-600">
                Descuentos exclusivos y productos a precios especiales para miembros
              </p>
            </div>
            <div className="text-center">
              <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
                <Truck size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Envío Gratis</h3>
              <p className="text-gray-600">
                Entrega sin costo en todas tus compras como miembro premium
              </p>
            </div>
            <div className="text-center">
              <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
                <Clock size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Conveniencia</h3>
              <p className="text-gray-600">
                Recibe productos de calidad sin preocuparte por hacer pedidos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
