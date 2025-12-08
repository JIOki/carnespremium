const express = require('express');
const { getPrismaClient } = require('../database/connection');
const { asyncHandler, CommonErrors } = require('../middleware/errorHandler');
const gamificationService = require('../services/gamificationService');
const badgeService = require('../services/badgeService');
const challengeService = require('../services/challengeService');
const referralService = require('../services/referralService');
const rewardService = require('../services/rewardService');

const router = express.Router();

// ==================== LOYALTY POINTS ====================

/**
 * GET /api/gamification/loyalty
 * Obtener puntos y estadísticas de lealtad del usuario
 */
router.get('/loyalty', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const stats = await gamificationService.getUserStats(userId);

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * GET /api/gamification/loyalty/transactions
 * Obtener historial de transacciones de puntos
 */
router.get('/loyalty/transactions', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { limit = 50, offset = 0, type } = req.query;

  const prisma = getPrismaClient();
  const where = { userId, ...(type && { type }) };

  const [transactions, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    prisma.loyaltyTransaction.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    }
  });
}));

/**
 * GET /api/gamification/tiers
 * Obtener información de todos los tiers
 */
router.get('/tiers', asyncHandler(async (req, res) => {
  const tiers = gamificationService.getAllTiers();

  res.json({
    success: true,
    data: {
      tiers: Object.entries(tiers).map(([key, config]) => ({
        key,
        ...config
      }))
    }
  });
}));

/**
 * GET /api/gamification/loyalty/tiers
 * Alias de tiers - Obtener información de tiers (compatible con tests)
 */
router.get('/loyalty/tiers', asyncHandler(async (req, res) => {
  const tiers = gamificationService.getAllTiers();

  res.json({
    success: true,
    data: {
      tiers: Object.entries(tiers).map(([key, config]) => ({
        key,
        ...config
      }))
    }
  });
}));

// ==================== BADGES ====================

/**
 * GET /api/gamification/badges
 * Obtener todos los badges disponibles
 */
router.get('/badges', asyncHandler(async (req, res) => {
  const badges = await badgeService.getAllBadges(false);

  res.json({
    success: true,
    data: { badges }
  });
}));

/**
 * GET /api/gamification/badges/my
 * Obtener badges del usuario
 */
router.get('/badges/my', asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  const [userBadges, stats] = await Promise.all([
    badgeService.getUserBadges(userId),
    badgeService.getUserBadgeStats(userId)
  ]);

  res.json({
    success: true,
    data: {
      badges: userBadges,
      stats
    }
  });
}));

/**
 * GET /api/gamification/my-badges
 * Alias de badges/my - Obtener badges del usuario (formato compatible con tests)
 */
router.get('/my-badges', asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  const [userBadges, stats] = await Promise.all([
    badgeService.getUserBadges(userId),
    badgeService.getUserBadgeStats(userId)
  ]);

  res.json({
    success: true,
    data: {
      badges: userBadges,
      stats
    }
  });
}));

/**
 * GET /api/gamification/badges/earned
 * Alias de my-badges - Obtener badges ganados por el usuario (formato tests)
 */
router.get('/badges/earned', asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  const [userBadges, stats] = await Promise.all([
    badgeService.getUserBadges(userId),
    badgeService.getUserBadgeStats(userId)
  ]);

  res.json({
    success: true,
    data: {
      badges: userBadges,
      stats
    }
  });
}));

/**
 * GET /api/gamification/badges/next
 * Obtener próximos badges por conseguir
 */
router.get('/badges/next', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const nextBadges = await badgeService.getNextBadgesToEarn(userId);

  res.json({
    success: true,
    data: { badges: nextBadges }
  });
}));

/**
 * POST /api/gamification/badges/mark-viewed
 * Marcar badges nuevos como vistos
 */
router.post('/badges/mark-viewed', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const result = await badgeService.markBadgesAsViewed(userId);

  res.json({
    success: true,
    data: { updated: result.count }
  });
}));

/**
 * GET /api/gamification/badges/leaderboard
 * Leaderboard de coleccionistas de badges
 */
router.get('/badges/leaderboard', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const leaderboard = await badgeService.getBadgeCollectorsLeaderboard(parseInt(limit));

  res.json({
    success: true,
    data: { leaderboard }
  });
}));

// ==================== CHALLENGES ====================

/**
 * GET /api/gamification/challenges
 * Obtener challenges activos con progreso del usuario
 */
router.get('/challenges', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const challenges = await challengeService.getUserChallenges(userId);

  res.json({
    success: true,
    data: challenges
  });
}));

/**
 * GET /api/gamification/my-challenges
 * Alias de challenges - Obtener challenges del usuario (formato compatible con tests)
 */
router.get('/my-challenges', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const challenges = await challengeService.getUserChallenges(userId);

  res.json({
    success: true,
    data: challenges
  });
}));

/**
 * GET /api/gamification/challenges/mine
 * Alias de my-challenges - Obtener challenges del usuario (formato tests)
 */
router.get('/challenges/mine', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const challenges = await challengeService.getUserChallenges(userId);

  res.json({
    success: true,
    data: challenges
  });
}));

/**
 * GET /api/gamification/challenges/active
 * Obtener solo challenges activos (sin progreso)
 */
router.get('/challenges/active', asyncHandler(async (req, res) => {
  const { type } = req.query;
  const challenges = await challengeService.getActiveChallenges(type || null);

  res.json({
    success: true,
    data: { challenges }
  });
}));

/**
 * POST /api/gamification/challenges/:challengeId/claim
 * Reclamar recompensa de challenge completado
 */
router.post('/challenges/:challengeId/claim', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { challengeId } = req.params;

  const result = await challengeService.claimChallengeReward(userId, challengeId);

  res.json({
    success: true,
    data: result
  });
}));

// ==================== REFERRALS ====================

/**
 * GET /api/gamification/referrals/my-code
 * Obtener código de referido del usuario
 */
router.get('/referrals/my-code', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const referralInfo = await referralService.getOrCreateReferralCode(userId);

  res.json({
    success: true,
    data: referralInfo
  });
}));

/**
 * GET /api/gamification/referrals/code
 * Alias de my-code - Obtener código de referido (compatible con tests)
 */
router.get('/referrals/code', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const referralInfo = await referralService.getOrCreateReferralCode(userId);

  res.json({
    success: true,
    data: referralInfo
  });
}));

/**
 * GET /api/gamification/referrals/stats
 * Obtener estadísticas de referidos del usuario
 */
router.get('/referrals/stats', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const stats = await referralService.getUserReferralStats(userId);

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * GET /api/gamification/referrals
 * Alias de stats - Obtener estadísticas de referidos (compatible con tests)
 */
router.get('/referrals', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const stats = await referralService.getUserReferralStats(userId);

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * POST /api/gamification/referrals/track-click
 * Trackear clic en link de referido (público)
 */
router.post('/referrals/track-click', asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw CommonErrors.ValidationError('Código de referido requerido');
  }

  await referralService.trackReferralClick(code);

  res.json({
    success: true,
    message: 'Click trackeado'
  });
}));

/**
 * GET /api/gamification/referrals/qr
 * Generar QR code para referidos
 */
router.get('/referrals/qr', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const qrInfo = await referralService.generateReferralQR(userId);

  res.json({
    success: true,
    data: qrInfo
  });
}));

// ==================== REWARDS ====================

/**
 * GET /api/gamification/rewards
 * Obtener catálogo de recompensas disponibles
 */
router.get('/rewards', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const rewards = await rewardService.getAvailableRewards(userId);

  res.json({
    success: true,
    data: { rewards }
  });
}));

/**
 * GET /api/gamification/rewards/my-redemptions
 * Obtener redemptions del usuario
 */
router.get('/rewards/my-redemptions', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const redemptions = await rewardService.getUserRedemptions(userId);

  res.json({
    success: true,
    data: { redemptions }
  });
}));

/**
 * GET /api/gamification/rewards/redemptions
 * Alias de my-redemptions - Obtener redemptions del usuario (formato tests)
 */
router.get('/rewards/redemptions', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const redemptions = await rewardService.getUserRedemptions(userId);

  res.json({
    success: true,
    data: { redemptions }
  });
}));

/**
 * GET /api/gamification/rewards/:rewardId
 * Obtener detalle de una recompensa
 */
router.get('/rewards/:rewardId', asyncHandler(async (req, res) => {
  const { rewardId } = req.params;
  const reward = await rewardService.getRewardById(rewardId);

  if (!reward) {
    throw CommonErrors.NotFound('Recompensa no encontrada');
  }

  res.json({
    success: true,
    data: { reward }
  });
}));

/**
 * POST /api/gamification/rewards/:rewardId/redeem
 * Canjear recompensa
 */
router.post('/rewards/:rewardId/redeem', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { rewardId } = req.params;

  const result = await rewardService.redeemReward(userId, rewardId);

  res.json({
    success: true,
    data: result
  });
}));

// ==================== LEADERBOARDS ====================

/**
 * GET /api/gamification/leaderboards
 * Obtener leaderboard general (sin filtro por tipo) - compatible con tests
 */
router.get('/leaderboards', asyncHandler(async (req, res) => {
  const { period = 'MONTHLY', limit = 10 } = req.query;
  const prisma = getPrismaClient();

  // Calcular fechas del periodo
  const now = new Date();
  let periodStart, periodEnd;

  switch (period) {
    case 'WEEKLY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      periodEnd = now;
      break;
    case 'MONTHLY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'YEARLY':
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      periodStart = new Date(0);
      periodEnd = now;
  }

  // Obtener leaderboard general (TOP_BUYERS por defecto)
  const entries = await prisma.leaderboardEntry.findMany({
    where: {
      leaderboardType: 'TOP_BUYERS',
      period: period.toUpperCase(),
      periodStart: { lte: periodEnd },
      periodEnd: { gte: periodStart }
    },
    orderBy: { rank: 'asc' },
    take: parseInt(limit)
  });

  res.json({
    success: true,
    data: {
      leaderboard: entries,
      period,
      type: 'TOP_BUYERS'
    }
  });
}));

/**
 * GET /api/gamification/leaderboard
 * Alias de leaderboards - Obtener leaderboard general (formato tests)
 */
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const { period = 'MONTHLY', limit = 10 } = req.query;
  const prisma = getPrismaClient();

  // Calcular fechas del periodo
  const now = new Date();
  let periodStart, periodEnd;

  switch (period) {
    case 'WEEKLY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      periodEnd = now;
      break;
    case 'MONTHLY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'YEARLY':
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      periodStart = new Date(0);
      periodEnd = now;
  }

  // Obtener leaderboard general (TOP_BUYERS por defecto)
  const entries = await prisma.leaderboardEntry.findMany({
    where: {
      leaderboardType: 'TOP_BUYERS',
      period: period.toUpperCase(),
      periodStart: { lte: periodEnd },
      periodEnd: { gte: periodStart }
    },
    orderBy: { rank: 'asc' },
    take: parseInt(limit)
  });

  res.json({
    success: true,
    data: {
      leaderboard: entries,
      period,
      type: 'TOP_BUYERS'
    }
  });
}));

/**
 * GET /api/gamification/leaderboard/:type
 * Obtener leaderboard por tipo
 */
router.get('/leaderboard/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { period = 'MONTHLY', limit = 10 } = req.query;

  const prisma = getPrismaClient();

  // Calcular fechas del periodo
  const now = new Date();
  let periodStart, periodEnd;

  switch (period) {
    case 'WEEKLY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      periodEnd = now;
      break;
    case 'MONTHLY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'YEARLY':
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      periodStart = new Date(0);
      periodEnd = now;
  }

  const entries = await prisma.leaderboardEntry.findMany({
    where: {
      leaderboardType: type.toUpperCase(),
      period: period.toUpperCase(),
      periodStart: { lte: periodEnd },
      periodEnd: { gte: periodStart }
    },
    orderBy: { rank: 'asc' },
    take: parseInt(limit)
  });

  res.json({
    success: true,
    data: {
      leaderboard: entries,
      period,
      type
    }
  });
}));

/**
 * GET /api/gamification/leaderboard/top-referrers
 * Top referrers leaderboard
 */
router.get('/leaderboard/top-referrers', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const leaderboard = await referralService.getTopReferrers(parseInt(limit));

  res.json({
    success: true,
    data: { leaderboard }
  });
}));

/**
 * GET /api/gamification/stats
 * Obtener estadísticas generales de gamificación del usuario
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.userId;

  const [
    loyaltyStats,
    badgeStats,
    challenges,
    referralStats
  ] = await Promise.all([
    gamificationService.getUserStats(userId),
    badgeService.getUserBadgeStats(userId),
    challengeService.getUserChallenges(userId),
    referralService.getUserReferralStats(userId)
  ]);

  res.json({
    success: true,
    data: {
      loyalty: {
        currentPoints: loyaltyStats.currentPoints,
        totalEarned: loyaltyStats.totalEarned,
        totalRedeemed: loyaltyStats.totalRedeemed,
        tier: loyaltyStats.tier,
        tierProgress: loyaltyStats.tierProgress
      },
      badges: {
        total: badgeStats.totalBadges || 0,
        new: badgeStats.newBadges || 0,
        progress: badgeStats.progress || 0
      },
      challenges: {
        active: challenges.active?.length || 0,
        completed: challenges.stats?.completed || 0,
        inProgress: challenges.stats?.inProgress || 0
      },
      referrals: {
        total: referralStats.stats?.totalReferrals || 0,
        successful: referralStats.stats?.successfulReferrals || 0,
        pointsEarned: referralStats.stats?.pointsEarned || 0
      }
    }
  });
}));

// ==================== USER DASHBOARD ====================

/**
 * GET /api/gamification/dashboard
 * Dashboard completo de gamificación del usuario
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const userId = req.userId;

  const [
    loyaltyStats,
    badgeStats,
    challenges,
    referralStats,
    recentRedemptions
  ] = await Promise.all([
    gamificationService.getUserStats(userId),
    badgeService.getUserBadgeStats(userId),
    challengeService.getUserChallenges(userId),
    referralService.getUserReferralStats(userId),
    rewardService.getUserRedemptions(userId)
  ]);

  res.json({
    success: true,
    data: {
      loyalty: loyaltyStats,
      badges: badgeStats,
      challenges: {
        active: challenges.active.slice(0, 5),
        stats: challenges.stats
      },
      referrals: referralStats.stats,
      recentRedemptions: recentRedemptions.slice(0, 5)
    }
  });
}));

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/gamification/admin/overview
 * Overview general del sistema de gamificación (admin)
 */
router.get('/admin/overview', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware
  const prisma = getPrismaClient();

  const [
    totalUsers,
    activeUsers,
    totalPointsDistributed,
    totalBadgesAwarded,
    totalChallengesCompleted,
    totalReferrals,
    totalRedemptions
  ] = await Promise.all([
    prisma.loyaltyPoints.count(),
    prisma.loyaltyPoints.count({
      where: {
        lastPointsEarned: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
        }
      }
    }),
    prisma.loyaltyPoints.aggregate({
      _sum: { lifetimePoints: true }
    }),
    prisma.userBadge.count(),
    prisma.userChallenge.count({
      where: { isCompleted: true }
    }),
    prisma.referral.count({
      where: { status: { in: ['REGISTERED', 'FIRST_PURCHASE', 'COMPLETED'] } }
    }),
    prisma.rewardRedemption.count()
  ]);

  const tierDistribution = await prisma.loyaltyPoints.groupBy({
    by: ['tier'],
    _count: { id: true }
  });

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        activeUsers,
        totalPointsDistributed: totalPointsDistributed._sum.lifetimePoints || 0,
        totalBadgesAwarded,
        totalChallengesCompleted,
        totalReferrals,
        totalRedemptions
      },
      tierDistribution: tierDistribution.map(t => ({
        tier: t.tier,
        count: t._count.id
      }))
    }
  });
}));

/**
 * POST /api/gamification/admin/badges/initialize
 * Inicializar badges por defecto (admin)
 */
router.post('/admin/badges/initialize', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware
  const results = await badgeService.initializeDefaultBadges();

  res.json({
    success: true,
    data: {
      message: 'Badges inicializados',
      results
    }
  });
}));

/**
 * POST /api/gamification/admin/challenges/generate-daily
 * Generar challenges diarios (admin)
 */
router.post('/admin/challenges/generate-daily', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware
  const challenges = await challengeService.generateDailyChallenges();

  res.json({
    success: true,
    data: {
      message: 'Challenges diarios generados',
      challenges
    }
  });
}));

/**
 * POST /api/gamification/admin/challenges/generate-weekly
 * Generar challenges semanales (admin)
 */
router.post('/admin/challenges/generate-weekly', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware
  const challenges = await challengeService.generateWeeklyChallenges();

  res.json({
    success: true,
    data: {
      message: 'Challenges semanales generados',
      challenges
    }
  });
}));

/**
 * GET /api/gamification/admin/challenges/stats
 * Estadísticas de challenges (admin)
 */
router.get('/admin/challenges/stats', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware
  const stats = await challengeService.getChallengeStats();

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * POST /api/gamification/admin/challenges
 * Crear nuevo challenge (admin)
 */
router.post('/admin/challenges', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware + validation
  const challenge = await challengeService.createChallenge(req.body);

  res.json({
    success: true,
    data: { challenge }
  });
}));

/**
 * POST /api/gamification/admin/rewards
 * Crear nueva recompensa (admin)
 */
router.post('/admin/rewards', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware + validation
  const reward = await rewardService.createReward(req.body);

  res.json({
    success: true,
    data: { reward }
  });
}));

/**
 * PUT /api/gamification/admin/rewards/:rewardId
 * Actualizar recompensa (admin)
 */
router.put('/admin/rewards/:rewardId', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware + validation
  const { rewardId } = req.params;
  const reward = await rewardService.updateReward(rewardId, req.body);

  res.json({
    success: true,
    data: { reward }
  });
}));

/**
 * GET /api/gamification/admin/rewards/stats
 * Estadísticas de recompensas (admin)
 */
router.get('/admin/rewards/stats', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware
  const stats = await rewardService.getRewardStats();

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * GET /api/gamification/admin/redemptions/pending
 * Redemptions pendientes de aprobación (admin)
 */
router.get('/admin/redemptions/pending', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware
  const redemptions = await rewardService.getPendingRedemptions();

  res.json({
    success: true,
    data: { redemptions }
  });
}));

/**
 * POST /api/gamification/admin/redemptions/:redemptionId/approve
 * Aprobar redemption (admin)
 */
router.post('/admin/redemptions/:redemptionId/approve', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware
  const { redemptionId } = req.params;
  const adminId = req.userId;

  const redemption = await rewardService.approveRedemption(redemptionId, adminId);

  res.json({
    success: true,
    data: { redemption }
  });
}));

/**
 * POST /api/gamification/admin/redemptions/:redemptionId/deliver
 * Marcar redemption como entregado (admin)
 */
router.post('/admin/redemptions/:redemptionId/deliver', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware
  const { redemptionId } = req.params;
  const { trackingInfo } = req.body;

  const redemption = await rewardService.markAsDelivered(redemptionId, trackingInfo);

  res.json({
    success: true,
    data: { redemption }
  });
}));

/**
 * POST /api/gamification/admin/redemptions/:redemptionId/cancel
 * Cancelar redemption (admin)
 */
router.post('/admin/redemptions/:redemptionId/cancel', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware
  const { redemptionId } = req.params;
  const { reason, refund = true } = req.body;

  const redemption = await rewardService.cancelRedemption(redemptionId, reason, refund);

  res.json({
    success: true,
    data: { redemption }
  });
}));

/**
 * POST /api/gamification/admin/points/adjust
 * Ajustar puntos manualmente (admin)
 */
router.post('/admin/points/adjust', asyncHandler(async (req, res) => {
  // TODO: Add admin middleware + validation
  const { userId, points, reason } = req.body;

  const result = await gamificationService.addPoints({
    userId,
    points,
    action: 'ADJUSTMENT',
    type: points > 0 ? 'EARNED' : 'REDEEMED',
    description: `Ajuste manual: ${reason}`
  });

  res.json({
    success: true,
    data: result
  });
}));

module.exports = router;
