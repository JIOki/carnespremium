'use client';

import { useEffect, useState } from 'react';
import gamificationService, { DashboardData } from '@/services/gamificationService';

export default function GamificationDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await gamificationService.getDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error('Error loading gamification dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tu progreso...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error al cargar el dashboard</p>
        </div>
      </div>
    );
  }

  const { loyalty, badges, challenges, referrals, recentRedemptions } = data;
  const currentTier = loyalty.currentTier;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🎮 Gamificación</h1>
        <p className="text-gray-600">Tu centro de recompensas y logros</p>
      </div>

      {/* Tier Banner */}
      <div 
        className="rounded-xl p-6 mb-8 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${currentTier.color}dd, ${currentTier.color})` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-6xl">{currentTier.icon}</div>
            <div>
              <h2 className="text-3xl font-bold">{currentTier.name}</h2>
              <p className="text-white/90">Tier actual</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{loyalty.loyalty.currentPoints.toLocaleString()}</div>
            <p className="text-white/90">Puntos disponibles</p>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {loyalty.nextTier && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-white/90 mb-2">
              <span>Progreso a {loyalty.nextTier.name}</span>
              <span>{loyalty.nextTier.pointsNeeded} puntos restantes</span>
            </div>
            <div className="bg-white/20 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${loyalty.loyalty.tierProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {currentTier.benefits.slice(0, 3).map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="truncate">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-lg p-3">
              <span className="text-3xl">🏆</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{badges.total}</div>
              <div className="text-sm text-gray-600">Badges conseguidos</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-lg p-3">
              <span className="text-3xl">🎯</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{challenges.stats.totalCompleted}</div>
              <div className="text-sm text-gray-600">Challenges completados</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-lg p-3">
              <span className="text-3xl">🎁</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{referrals.total}</div>
              <div className="text-sm text-gray-600">Amigos referidos</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 rounded-lg p-3">
              <span className="text-3xl">🔥</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{loyalty.loyalty.currentStreak}</div>
              <div className="text-sm text-gray-600">Racha actual (meses)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Challenges Activos */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">🎯 Challenges Activos</h3>
            <a href="/gamification/challenges" className="text-red-600 hover:text-red-700 text-sm font-medium">
              Ver todos →
            </a>
          </div>
          <div className="space-y-4">
            {challenges.active.slice(0, 3).map((challenge) => (
              <div key={challenge.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{challenge.icon || '🎯'}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{challenge.name}</h4>
                      <p className="text-sm text-gray-600">{challenge.description}</p>
                    </div>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                    +{challenge.pointsReward} pts
                  </span>
                </div>
                {challenge.progress && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progreso</span>
                      <span>{challenge.progress.current}/{challenge.progress.target}</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-red-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, challenge.progress.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {challenges.active.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay challenges activos</p>
            )}
          </div>
        </div>

        {/* Badges Recientes */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">🏆 Badges Recientes</h3>
            <a href="/gamification/badges" className="text-red-600 hover:text-red-700 text-sm font-medium">
              Ver todos →
            </a>
          </div>
          <div className="space-y-3">
            {badges.recentBadges.slice(0, 5).map((badge) => (
              <div key={badge.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div 
                  className="text-4xl p-3 rounded-lg" 
                  style={{ backgroundColor: `${badge.color}20` }}
                >
                  {badge.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{badge.name}</h4>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      badge.rarity === 'LEGENDARY' ? 'bg-yellow-100 text-yellow-800' :
                      badge.rarity === 'EPIC' ? 'bg-purple-100 text-purple-800' :
                      badge.rarity === 'RARE' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {badge.rarity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{badge.description}</p>
                </div>
              </div>
            ))}
            {badges.total === 0 && (
              <p className="text-center text-gray-500 py-8">Aún no tienes badges</p>
            )}
          </div>

          {/* Badge Progress */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso de colección</span>
              <span>{badges.total} / {badges.totalAvailable}</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full rounded-full"
                style={{ width: `${badges.completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <a href="/gamification/challenges" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl mb-2">🎯</div>
          <h3 className="text-xl font-bold mb-1">Challenges</h3>
          <p className="text-blue-100 text-sm">Completa misiones y gana puntos</p>
        </a>

        <a href="/gamification/referrals" className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl mb-2">🎁</div>
          <h3 className="text-xl font-bold mb-1">Referidos</h3>
          <p className="text-green-100 text-sm">Invita amigos y gana recompensas</p>
        </a>

        <a href="/gamification/rewards" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl mb-2">🏪</div>
          <h3 className="text-xl font-bold mb-1">Recompensas</h3>
          <p className="text-purple-100 text-sm">Canjea tus puntos por premios</p>
        </a>
      </div>
    </div>
  );
}
