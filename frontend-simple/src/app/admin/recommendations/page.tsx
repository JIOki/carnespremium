'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as recommendationService from '../../../services/recommendationService';

export default function AdminRecommendationsPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Estadísticas
  const [eventStats, setEventStats] = useState<any>(null);
  const [recommendationStats, setRecommendationStats] = useState<any>(null);
  const [segmentStats, setSegmentStats] = useState<any>(null);
  const [atRiskUsers, setAtRiskUsers] = useState([]);
  const [highValueUsers, setHighValueUsers] = useState([]);
  
  const [selectedSegment, setSelectedSegment] = useState('');
  const [segmentUsers, setSegmentUsers] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchAllStats();
  }, [router]);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      
      const [eventsRes, recsRes, segmentsRes, atRiskRes, highValueRes] = await Promise.all([
        recommendationService.getEventStats(),
        recommendationService.getRecommendationStats(),
        recommendationService.getSegmentStats(),
        recommendationService.getAtRiskUsers(60, 20),
        recommendationService.getHighValueUsers(500, 20)
      ]);

      if (eventsRes.success) setEventStats(eventsRes.stats);
      if (recsRes.success) setRecommendationStats(recsRes.stats);
      if (segmentsRes.success) setSegmentStats(segmentsRes.stats);
      if (atRiskRes.success) setAtRiskUsers(atRiskRes.users);
      if (highValueRes.success) setHighValueUsers(highValueRes.users);

    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const fetchSegmentUsers = async (segmentName: string) => {
    try {
      const res = await recommendationService.getUsersBySegment(segmentName, {
        limit: 50,
        offset: 0
      });
      
      if (res.success) {
        setSegmentUsers(res);
      }
    } catch (error) {
      console.error('Error fetching segment users:', error);
    }
  };

  const handleRecalculateSegments = async () => {
    if (!confirm('¿Recalcular todos los segmentos desactualizados?')) return;
    
    try {
      const res = await recommendationService.recalculateSegments(100);
      if (res.success) {
        alert(`Segmentos recalculados: ${res.processed} exitosos, ${res.failed} fallidos`);
        fetchAllStats();
      }
    } catch (error) {
      alert('Error al recalcular segmentos');
    }
  };

  const handleCleanOldEvents = async () => {
    if (!confirm('¿Eliminar eventos de más de 365 días?')) return;
    
    try {
      const res = await recommendationService.cleanOldEvents(365);
      if (res.success) {
        alert(`Eventos eliminados: ${res.deleted}`);
        fetchAllStats();
      }
    } catch (error) {
      alert('Error al limpiar eventos');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sistema de Recomendaciones</h1>
              <p className="text-gray-600 mt-1">Análisis y métricas de personalización</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleRecalculateSegments}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Recalcular Segmentos
              </button>
              <button
                onClick={handleCleanOldEvents}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Limpiar Eventos
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Resumen', icon: '📊' },
              { id: 'events', label: 'Eventos', icon: '📈' },
              { id: 'recommendations', label: 'Recomendaciones', icon: '🎯' },
              { id: 'segments', label: 'Segmentos', icon: '👥' },
              { id: 'users', label: 'Usuarios', icon: '⭐' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">Total Eventos</span>
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {eventStats?.totalEvents?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {eventStats?.uniqueUsers} usuarios únicos
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">Recomendaciones Activas</span>
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {recommendationStats?.totalRecommendations?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  CTR: {recommendationStats?.averageCTR}%
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">Usuarios Segmentados</span>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {segmentStats?.totalUsers?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {segmentStats?.atRiskUsers} en riesgo
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">Tasa de Conversión</span>
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {recommendationStats?.averageConversionRate}%
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {recommendationStats?.totalConversions} conversiones
                </p>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Eventos por Tipo */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Eventos por Tipo</h3>
                <div className="space-y-3">
                  {eventStats?.eventsByType &&
                    Object.entries(eventStats.eventsByType).map(([type, count]: any) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{type.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min((count / eventStats.totalEvents) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-16 text-right">
                            {count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Distribución de Segmentos */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución de Segmentos</h3>
                <div className="space-y-3">
                  {segmentStats?.byPrimarySegment &&
                    Object.entries(segmentStats.byPrimarySegment).map(([segment, count]: any) => (
                      <div key={segment} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{segment.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min((count / segmentStats.totalUsers) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-16 text-right">
                            {count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && eventStats && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Estadísticas de Eventos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Total Eventos</p>
                  <p className="text-2xl font-bold text-gray-900">{eventStats.totalEvents.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Usuarios Únicos</p>
                  <p className="text-2xl font-bold text-gray-900">{eventStats.uniqueUsers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Productos Únicos</p>
                  <p className="text-2xl font-bold text-gray-900">{eventStats.uniqueProducts.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Desde Recomendaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{eventStats.recommendationImpact}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Detalle por Tipo de Evento</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {eventStats.eventsByType &&
                      Object.entries(eventStats.eventsByType)
                        .sort((a: any, b: any) => b[1] - a[1])
                        .map(([type, count]: any) => (
                          <tr key={type}>
                            <td className="px-6 py-4 text-sm text-gray-900">{type.replace(/_/g, ' ')}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">{count.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                              {((count / eventStats.totalEvents) * 100).toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && recommendationStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">Total Impresiones</p>
                <p className="text-3xl font-bold text-gray-900">{recommendationStats.totalImpressions.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">Total Clicks</p>
                <p className="text-3xl font-bold text-gray-900">{recommendationStats.totalClicks.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">Total Conversiones</p>
                <p className="text-3xl font-bold text-gray-900">{recommendationStats.totalConversions.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Por Tipo de Recomendación</h3>
              <div className="space-y-4">
                {recommendationStats.byType &&
                  Object.entries(recommendationStats.byType).map(([type, data]: any) => (
                    <div key={type} className="border-b border-gray-200 pb-4">
                      <h4 className="font-medium text-gray-900 mb-2">{type}</h4>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Recomendaciones</p>
                          <p className="font-medium">{data.count.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Impresiones</p>
                          <p className="font-medium">{data.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Clicks</p>
                          <p className="font-medium">{data.clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Conversiones</p>
                          <p className="font-medium">{data.conversions.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {recommendationStats.topPerformers?.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Recomendaciones por Conversión</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impresiones</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">CTR</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conversiones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recommendationStats.topPerformers.map((rec: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-sm text-gray-900">{rec.type}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">{rec.impressions}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">{rec.ctr}%</td>
                          <td className="px-6 py-4 text-sm text-green-600 text-right font-medium">{rec.conversionRate}%</td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">{rec.conversions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Segments Tab */}
        {activeTab === 'segments' && segmentStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">Engagement Promedio</p>
                <p className="text-3xl font-bold text-gray-900">{segmentStats.averageEngagement}/100</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">Riesgo Churn Promedio</p>
                <p className="text-3xl font-bold text-gray-900">{segmentStats.averageChurnRisk}/100</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">LTV Promedio</p>
                <p className="text-3xl font-bold text-gray-900">${segmentStats.averageLifetimeValue}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">Usuarios Alto Valor</p>
                <p className="text-3xl font-bold text-gray-900">{segmentStats.highValueUsers}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución de Segmentos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {segmentStats.byPrimarySegment &&
                  Object.entries(segmentStats.byPrimarySegment).map(([segment, count]: any) => (
                    <button
                      key={segment}
                      onClick={() => {
                        setSelectedSegment(segment);
                        fetchSegmentUsers(segment);
                      }}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left"
                    >
                      <p className="text-sm text-gray-500 mb-1">{segment.replace(/_/g, ' ')}</p>
                      <p className="text-2xl font-bold text-gray-900">{count.toLocaleString()}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {segmentStats.distributionPercent[segment]}% del total
                      </p>
                    </button>
                  ))}
              </div>
            </div>

            {selectedSegment && segmentUsers && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Usuarios en Segmento: {selectedSegment.replace(/_/g, ' ')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Engagement</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Riesgo Churn</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">LTV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {segmentUsers.users.slice(0, 20).map((user: any) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-gray-500">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            {user.segment.engagementScore}/100
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            {user.segment.churnRisk}/100
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            ${user.segment.lifetimeValue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Usuarios en Riesgo */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Usuarios en Riesgo de Churn</h3>
              {atRiskUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Riesgo Churn</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Días Sin Comprar</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">LTV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {atRiskUsers.map((user: any) => (
                        <tr key={user.user.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              <p className="font-medium">{user.user.name}</p>
                              <p className="text-gray-500">{user.user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600 text-right font-medium">
                            {user.churnRisk.toFixed(0)}/100
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            {user.daysSinceLastPurchase} días
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            ${user.lifetimeValue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No hay usuarios en riesgo</p>
              )}
            </div>

            {/* Usuarios de Alto Valor */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⭐ Usuarios de Alto Valor</h3>
              {highValueUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">LTV</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">AOV</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Órdenes</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Engagement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {highValueUsers.map((user: any) => (
                        <tr key={user.user.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              <p className="font-medium">{user.user.name}</p>
                              <p className="text-gray-500">{user.user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-green-600 text-right font-bold">
                            ${user.lifetimeValue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            ${user.averageOrderValue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            {user.totalOrders}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            {user.engagementScore}/100
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No hay usuarios de alto valor</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
