'use client';

import { useState, useEffect } from 'react';
import {
  Crown,
  Package,
  Users,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import {
  getMembershipPlans,
  getSubscriptionPlans,
  getAllMemberships,
  getAllSubscriptions,
  getSubscriptionStats,
  MembershipPlan,
  SubscriptionPlan
} from '@/services/subscriptionService';

/**
 * ===================================================
 * PÁGINA DE ADMINISTRACIÓN DE SUSCRIPCIONES
 * ===================================================
 */

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'membership-plans' | 'subscription-plans' | 'members' | 'subscribers'>('overview');
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'overview') {
        const statsData = await getSubscriptionStats();
        setStats(statsData);
      } else if (activeTab === 'membership-plans' || activeTab === 'members') {
        const plans = await getMembershipPlans();
        setMembershipPlans(plans);
      } else if (activeTab === 'subscription-plans' || activeTab === 'subscribers') {
        const plans = await getSubscriptionPlans();
        setSubscriptionPlans(plans);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Suscripciones y Membresías
          </h1>
          <p className="text-gray-600">
            Administra planes, miembros y suscriptores
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="inline-block mr-2" size={20} />
              Vista General
            </button>
            <button
              onClick={() => setActiveTab('membership-plans')}
              className={`px-6 py-4 font-medium whitespace-nowrap ${
                activeTab === 'membership-plans'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Crown className="inline-block mr-2" size={20} />
              Planes de Membresía
            </button>
            <button
              onClick={() => setActiveTab('subscription-plans')}
              className={`px-6 py-4 font-medium whitespace-nowrap ${
                activeTab === 'subscription-plans'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="inline-block mr-2" size={20} />
              Planes de Suscripción
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-4 font-medium whitespace-nowrap ${
                activeTab === 'members'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="inline-block mr-2" size={20} />
              Miembros
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`px-6 py-4 font-medium whitespace-nowrap ${
                activeTab === 'subscribers'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="inline-block mr-2" size={20} />
              Suscriptores
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Miembros Activos</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.memberships.totalMembers}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Crown size={32} className="text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Suscripciones Activas</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.subscriptions.totalActive}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package size={32} className="text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Ingreso Mensual (MRR)</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(stats.subscriptions.monthlyRevenue)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <DollarSign size={32} className="text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Próximas Entregas</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.subscriptions.upcomingDeliveries}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <TrendingUp size={32} className="text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Membresías</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Activas</span>
                    <span className="font-bold text-green-600">
                      {stats.memberships.totalMembers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Renovaciones próximas (7 días)</span>
                    <span className="font-bold text-blue-600">
                      {stats.memberships.upcomingRenewals}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Por expirar (7 días)</span>
                    <span className="font-bold text-orange-600">
                      {stats.memberships.expiringMemberships}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Suscripciones</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Activas</span>
                    <span className="font-bold text-green-600">
                      {stats.subscriptions.totalActive}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pausadas</span>
                    <span className="font-bold text-yellow-600">
                      {stats.subscriptions.totalPaused}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Canceladas</span>
                    <span className="font-bold text-red-600">
                      {stats.subscriptions.totalCancelled}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tasa de cancelación</span>
                    <span className="font-bold text-gray-900">
                      {stats.subscriptions.churnRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'membership-plans' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Planes de Membresía</h2>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
              >
                <Plus size={20} className="mr-2" />
                Nuevo Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {membershipPlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div 
                    className="h-2"
                    style={{ backgroundColor: plan.color || '#ef4444' }}
                  ></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{plan.displayName}</h3>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded">
                          <Edit size={16} className="text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded">
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Mensual</span>
                        <span className="font-bold">{formatCurrency(plan.monthlyPrice)}</span>
                      </div>
                      {plan.quarterlyPrice && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Trimestral</span>
                          <span className="font-bold">{formatCurrency(plan.quarterlyPrice)}</span>
                        </div>
                      )}
                      {plan.annualPrice && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Anual</span>
                          <span className="font-bold">{formatCurrency(plan.annualPrice)}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Miembros activos</span>
                        <span className="font-bold text-red-600">{plan.totalMembers || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-2">
                        <span className="text-gray-600">Descuento</span>
                        <span className="font-bold">{plan.discountPercent}%</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        plan.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {plan.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'subscription-plans' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Planes de Suscripción</h2>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
              >
                <Plus size={20} className="mr-2" />
                Nuevo Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {plan.imageUrl && (
                    <div className="h-40 overflow-hidden bg-gray-200">
                      <img
                        src={plan.imageUrl}
                        alt={plan.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                        <span className="text-sm text-gray-500">{plan.boxType}</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded">
                          <Edit size={16} className="text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded">
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Precio</span>
                        <span className="font-bold">{formatCurrency(plan.price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Valor estimado</span>
                        <span className="font-bold text-green-600">{formatCurrency(plan.estimatedValue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Frecuencia</span>
                        <span className="font-medium">{plan.deliveryFrequency}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Suscriptores</span>
                        <span className="font-bold text-red-600">{plan.totalSubscribers || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-2">
                        <span className="text-gray-600">Productos incluidos</span>
                        <span className="font-bold">{plan.productCount}</span>
                      </div>
                      {plan.availableSlots !== null && (
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span className="text-gray-600">Espacios disponibles</span>
                          <span className="font-bold">{plan.availableSlots}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        plan.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {plan.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Miembros</h2>
            <p className="text-gray-600">Funcionalidad de listado y gestión de miembros activos próximamente...</p>
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Suscriptores</h2>
            <p className="text-gray-600">Funcionalidad de listado y gestión de suscriptores activos próximamente...</p>
          </div>
        )}
      </div>
    </div>
  );
}
