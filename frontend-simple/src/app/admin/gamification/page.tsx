'use client';

import { useEffect, useState } from 'react';
import gamificationService from '@/services/gamificationService';

export default function AdminGamificationPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);
  const [challengeStats, setChallengeStats] = useState<any>(null);
  const [rewardStats, setRewardStats] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [overviewData, pending, cStats, rStats] = await Promise.all([
        gamificationService.getAdminOverview(),
        gamificationService.getPendingRedemptions(),
        gamificationService.getChallengeStats(),
        gamificationService.getRewardStats()
      ]);

      setOverview(overviewData);
      setPendingRedemptions(pending);
      setChallengeStats(cStats);
      setRewardStats(rStats);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeBadges = async () => {
    if (!confirm('¿Inicializar badges por defecto? Esto creará todos los badges del sistema.')) return;
    try {
      await gamificationService.initializeBadges();
      alert('Badges inicializados correctamente');
    } catch (error) {
      alert('Error al inicializar badges');
    }
  };

  const handleGenerateDailyChallenges = async () => {
    try {
      await gamificationService.generateDailyChallenges();
      alert('Challenges diarios generados');
      loadDashboard();
    } catch (error) {
      alert('Error al generar challenges diarios');
    }
  };

  const handleGenerateWeeklyChallenges = async () => {
    try {
      await gamificationService.generateWeeklyChallenges();
      alert('Challenges semanales generados');
      loadDashboard();
    } catch (error) {
      alert('Error al generar challenges semanales');
    }
  };

  const handleApproveRedemption = async (redemptionId: string) => {
    if (!confirm('¿Aprobar esta redemption?')) return;
    try {
      await gamificationService.approveRedemption(redemptionId);
      alert('Redemption aprobada');
      loadDashboard();
    } catch (error) {
      alert('Error al aprobar redemption');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🎮 Admin - Gamificación</h1>
        <p className="text-gray-600">Panel de control del sistema de gamificación</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={handleInitializeBadges}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition"
        >
          🏆 Inicializar Badges
        </button>
        <button
          onClick={handleGenerateDailyChallenges}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition"
        >
          🎯 Generar Challenges Diarios
        </button>
        <button
          onClick={handleGenerateWeeklyChallenges}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition"
        >
          📅 Generar Challenges Semanales
        </button>
        <button
          onClick={() => window.location.href = '/admin/gamification/rewards'}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition"
        >
          🎁 Gestionar Recompensas
        </button>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900">{overview.overview.totalUsers.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">+{overview.overview.activeUsers} activos (30d)</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Puntos Distribuidos</p>
                <p className="text-3xl font-bold text-gray-900">{overview.overview.totalPointsDistributed.toLocaleString()}</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3">
                <span className="text-4xl">⭐</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Badges Otorgados</p>
                <p className="text-3xl font-bold text-gray-900">{overview.overview.totalBadgesAwarded.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 rounded-lg p-3">
                <span className="text-4xl">🏆</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Challenges Completados</p>
                <p className="text-3xl font-bold text-gray-900">{overview.overview.totalChallengesCompleted.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <span className="text-4xl">🎯</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier Distribution */}
      {overview && overview.tierDistribution && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Distribución por Tier</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {overview.tierDistribution.map((tier: any) => (
              <div key={tier.tier} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">
                  {tier.tier === 'DIAMOND' ? '👑' :
                   tier.tier === 'PLATINUM' ? '💎' :
                   tier.tier === 'GOLD' ? '🥇' :
                   tier.tier === 'SILVER' ? '🥈' : '🥉'}
                </div>
                <div className="font-bold text-gray-900">{tier.tier}</div>
                <div className="text-2xl font-bold text-gray-700">{tier.count}</div>
                <div className="text-sm text-gray-600">usuarios</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Redemptions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">⏳ Redemptions Pendientes ({pendingRedemptions.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingRedemptions.map((redemption) => (
              <div key={redemption.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{redemption.reward.name}</h4>
                    <p className="text-sm text-gray-600">{redemption.pointsSpent} puntos</p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                    PENDING
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  Usuario ID: {redemption.userId}
                </div>
                <button
                  onClick={() => handleApproveRedemption(redemption.id)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition"
                >
                  ✓ Aprobar
                </button>
              </div>
            ))}
            {pendingRedemptions.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay redemptions pendientes</p>
            )}
          </div>
        </div>

        {/* Challenge Stats */}
        {challengeStats && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Estadísticas de Challenges</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Total Challenges</span>
                <span className="font-bold text-gray-900">{challengeStats.total}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Challenges Activos</span>
                <span className="font-bold text-gray-900">{challengeStats.active}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Completados (Total)</span>
                <span className="font-bold text-gray-900">{challengeStats.totalCompletions}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Promedio Completados</span>
                <span className="font-bold text-gray-900">{challengeStats.averageCompletions.toFixed(1)}</span>
              </div>
            </div>

            {challengeStats.topChallenges && challengeStats.topChallenges.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Top Challenges</h4>
                <div className="space-y-2">
                  {challengeStats.topChallenges.map((challenge: any, idx: number) => (
                    <div key={challenge.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 truncate flex-1">{challenge.name}</span>
                      <span className="text-sm font-semibold text-gray-900 ml-2">{challenge.totalCompletions}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reward Stats */}
      {rewardStats && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🎁 Estadísticas de Recompensas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{rewardStats.totalRewards}</div>
              <div className="text-sm text-purple-800 mt-1">Total Recompensas</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{rewardStats.activeRewards}</div>
              <div className="text-sm text-green-800 mt-1">Activas</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{rewardStats.totalRedemptions}</div>
              <div className="text-sm text-blue-800 mt-1">Canjes Totales</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{rewardStats.totalPointsSpent.toLocaleString()}</div>
              <div className="text-sm text-yellow-800 mt-1">Puntos Canjeados</div>
            </div>
          </div>

          {rewardStats.topRewards && rewardStats.topRewards.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recompensas Más Canjeadas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rewardStats.topRewards.map((reward: any) => (
                  <div key={reward.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{reward.name}</div>
                      <div className="text-sm text-gray-600">{reward.pointsCost} puntos</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{reward.totalRedeemed}</div>
                      <div className="text-xs text-gray-600">canjes</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
