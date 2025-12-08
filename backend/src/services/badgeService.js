const { getPrismaClient } = require('../database/connection');
const gamificationService = require('./gamificationService');

/**
 * =====================================================
 * BADGE SERVICE
 * =====================================================
 * Maneja todo lo relacionado con badges y logros:
 * - Creación y gestión de badges
 * - Verificación de requisitos
 * - Otorgamiento de badges
 * - Estadísticas de badges
 */

// Definición de todos los badges del sistema
const DEFAULT_BADGES = [
  // Badges de Tier
  {
    code: 'TIER_BRONZE',
    name: 'Miembro Bronce',
    description: 'Has alcanzado el tier Bronce',
    icon: '🥉',
    color: '#CD7F32',
    rarity: 'COMMON',
    requirementType: 'TIER',
    requirementValue: 0,
    pointsReward: 0
  },
  {
    code: 'TIER_SILVER',
    name: 'Miembro Plata',
    description: 'Has alcanzado el tier Plata',
    icon: '🥈',
    color: '#C0C0C0',
    rarity: 'COMMON',
    requirementType: 'TIER',
    requirementValue: 500,
    pointsReward: 100
  },
  {
    code: 'TIER_GOLD',
    name: 'Miembro Oro',
    description: 'Has alcanzado el tier Oro',
    icon: '🥇',
    color: '#FFD700',
    rarity: 'RARE',
    requirementType: 'TIER',
    requirementValue: 2000,
    pointsReward: 250
  },
  {
    code: 'TIER_PLATINUM',
    name: 'Miembro Platino',
    description: 'Has alcanzado el tier Platino',
    icon: '💎',
    color: '#E5E4E2',
    rarity: 'EPIC',
    requirementType: 'TIER',
    requirementValue: 5000,
    pointsReward: 500
  },
  {
    code: 'TIER_DIAMOND',
    name: 'Miembro Diamante',
    description: 'Has alcanzado el tier Diamante - El nivel máximo',
    icon: '👑',
    color: '#B9F2FF',
    rarity: 'LEGENDARY',
    requirementType: 'TIER',
    requirementValue: 10000,
    pointsReward: 1000
  },

  // Badges de Compras
  {
    code: 'FIRST_PURCHASE',
    name: 'Primera Compra',
    description: 'Has realizado tu primera compra',
    icon: '🎉',
    color: '#4CAF50',
    rarity: 'COMMON',
    requirementType: 'PURCHASE_COUNT',
    requirementValue: 1,
    pointsReward: 100
  },
  {
    code: 'PURCHASES_5',
    name: 'Cliente Habitual',
    description: 'Has realizado 5 compras',
    icon: '🛍️',
    color: '#2196F3',
    rarity: 'COMMON',
    requirementType: 'PURCHASE_COUNT',
    requirementValue: 5,
    pointsReward: 150
  },
  {
    code: 'PURCHASES_10',
    name: 'Cliente Fiel',
    description: 'Has realizado 10 compras',
    icon: '🎯',
    color: '#FF9800',
    rarity: 'RARE',
    requirementType: 'PURCHASE_COUNT',
    requirementValue: 10,
    pointsReward: 300
  },
  {
    code: 'PURCHASES_20',
    name: 'Gourmet Master',
    description: 'Has realizado 20 compras',
    icon: '🏆',
    color: '#9C27B0',
    rarity: 'EPIC',
    requirementType: 'PURCHASE_COUNT',
    requirementValue: 20,
    pointsReward: 500
  },
  {
    code: 'PURCHASES_50',
    name: 'Maestro de la Carne',
    description: 'Has realizado 50 compras',
    icon: '🔥',
    color: '#F44336',
    rarity: 'EPIC',
    requirementType: 'PURCHASE_COUNT',
    requirementValue: 50,
    pointsReward: 1000
  },
  {
    code: 'PURCHASES_100',
    name: 'Leyenda Carnívora',
    description: 'Has realizado 100 compras - ¡Increíble!',
    icon: '⚡',
    color: '#FFD700',
    rarity: 'LEGENDARY',
    requirementType: 'PURCHASE_COUNT',
    requirementValue: 100,
    pointsReward: 2500
  },

  // Badges por Total Gastado
  {
    code: 'SPENT_1K',
    name: 'Gran Comprador',
    description: 'Has gastado $1,000 en total',
    icon: '💰',
    color: '#4CAF50',
    rarity: 'RARE',
    requirementType: 'TOTAL_SPENT',
    requirementValue: 1000,
    pointsReward: 250
  },
  {
    code: 'SPENT_5K',
    name: 'Cliente VIP',
    description: 'Has gastado $5,000 en total',
    icon: '💎',
    color: '#9C27B0',
    rarity: 'EPIC',
    requirementType: 'TOTAL_SPENT',
    requirementValue: 5000,
    pointsReward: 1000
  },
  {
    code: 'SPENT_10K',
    name: 'Leyenda Premium',
    description: 'Has gastado $10,000 en total',
    icon: '👑',
    color: '#FFD700',
    rarity: 'LEGENDARY',
    requirementType: 'TOTAL_SPENT',
    requirementValue: 10000,
    pointsReward: 2500,
    hasSpecialReward: true,
    specialRewardDesc: 'Regalo especial + producto gratis'
  },

  // Badges de Reviews
  {
    code: 'FIRST_REVIEW',
    name: 'Primera Opinión',
    description: 'Has escrito tu primera review',
    icon: '📝',
    color: '#2196F3',
    rarity: 'COMMON',
    requirementType: 'REVIEW_COUNT',
    requirementValue: 1,
    pointsReward: 50
  },
  {
    code: 'REVIEWS_5',
    name: 'Crítico Activo',
    description: 'Has escrito 5 reviews',
    icon: '✍️',
    color: '#FF9800',
    rarity: 'RARE',
    requirementType: 'REVIEW_COUNT',
    requirementValue: 5,
    pointsReward: 200
  },
  {
    code: 'REVIEWS_10',
    name: 'Crítico Experto',
    description: 'Has escrito 10 reviews',
    icon: '⭐',
    color: '#9C27B0',
    rarity: 'EPIC',
    requirementType: 'REVIEW_COUNT',
    requirementValue: 10,
    pointsReward: 500
  },

  // Badges de Referidos
  {
    code: 'FIRST_REFERRAL',
    name: 'Embajador Novato',
    description: 'Has referido tu primer amigo',
    icon: '🎁',
    color: '#4CAF50',
    rarity: 'COMMON',
    requirementType: 'REFERRAL_COUNT',
    requirementValue: 1,
    pointsReward: 100
  },
  {
    code: 'REFERRALS_5',
    name: 'Embajador',
    description: 'Has referido 5 amigos',
    icon: '🌟',
    color: '#2196F3',
    rarity: 'RARE',
    requirementType: 'REFERRAL_COUNT',
    requirementValue: 5,
    pointsReward: 500,
    hasSpecialReward: true,
    specialRewardDesc: 'Producto gratis valorado en $50'
  },
  {
    code: 'REFERRALS_10',
    name: 'Embajador Elite',
    description: 'Has referido 10 amigos',
    icon: '🎖️',
    color: '#9C27B0',
    rarity: 'EPIC',
    requirementType: 'REFERRAL_COUNT',
    requirementValue: 10,
    pointsReward: 1500,
    hasSpecialReward: true,
    specialRewardDesc: 'Producto gratis valorado en $100'
  },

  // Badges de Rachas
  {
    code: 'STREAK_3',
    name: 'Racha de Fuego',
    description: 'Has comprado 3 meses consecutivos',
    icon: '🔥',
    color: '#FF5722',
    rarity: 'RARE',
    requirementType: 'STREAK',
    requirementValue: 3,
    pointsReward: 300
  },
  {
    code: 'STREAK_6',
    name: 'Racha Imparable',
    description: 'Has comprado 6 meses consecutivos',
    icon: '🔥🔥',
    color: '#F44336',
    rarity: 'EPIC',
    requirementType: 'STREAK',
    requirementValue: 6,
    pointsReward: 750
  },
  {
    code: 'STREAK_12',
    name: 'Un Año de Lealtad',
    description: 'Has comprado 12 meses consecutivos',
    icon: '🏅',
    color: '#FFD700',
    rarity: 'LEGENDARY',
    requirementType: 'STREAK',
    requirementValue: 12,
    pointsReward: 2000,
    hasSpecialReward: true,
    specialRewardDesc: 'Status VIP vitalicio'
  },

  // Badges Especiales
  {
    code: 'EARLY_ADOPTER',
    name: 'Early Adopter',
    description: 'Fuiste de los primeros en unirse a Carnes Premium',
    icon: '🚀',
    color: '#00BCD4',
    rarity: 'LEGENDARY',
    requirementType: 'SPECIAL',
    pointsReward: 500,
    isSecret: true
  },
  {
    code: 'BIRTHDAY_BUYER',
    name: 'Cumpleañero',
    description: 'Compraste en tu cumpleaños',
    icon: '🎂',
    color: '#E91E63',
    rarity: 'RARE',
    requirementType: 'SPECIAL',
    pointsReward: 250
  },
  {
    code: 'MIDNIGHT_SHOPPER',
    name: 'Comprador Nocturno',
    description: 'Compraste entre las 12 AM y 6 AM',
    icon: '🌙',
    color: '#3F51B5',
    rarity: 'RARE',
    requirementType: 'SPECIAL',
    pointsReward: 100,
    isSecret: true
  },
  {
    code: 'WEEKEND_WARRIOR',
    name: 'Guerrero del Fin de Semana',
    description: 'Has realizado 10 compras en fin de semana',
    icon: '🎮',
    color: '#673AB7',
    rarity: 'EPIC',
    requirementType: 'SPECIAL',
    requirementValue: 10,
    pointsReward: 500
  },
  {
    code: 'PERFECT_REVIEWER',
    name: 'Crítico Perfecto',
    description: 'Has escrito una review 5 estrellas con foto y 200+ caracteres',
    icon: '🌟',
    color: '#FFD700',
    rarity: 'EPIC',
    requirementType: 'SPECIAL',
    pointsReward: 300
  }
];

class BadgeService {
  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Inicializar badges por defecto en la base de datos
   */
  async initializeDefaultBadges() {
    const results = [];
    
    for (const badgeData of DEFAULT_BADGES) {
      try {
        const existingBadge = await this.prisma.badge.findUnique({
          where: { code: badgeData.code }
        });

        if (!existingBadge) {
          const badge = await this.prisma.badge.create({
            data: badgeData
          });
          results.push({ action: 'created', badge });
        } else {
          results.push({ action: 'exists', badge: existingBadge });
        }
      } catch (error) {
        console.error(`Error initializing badge ${badgeData.code}:`, error);
        results.push({ action: 'error', code: badgeData.code, error: error.message });
      }
    }

    return results;
  }

  /**
   * Obtener todos los badges
   */
  async getAllBadges(includeSecret = false) {
    return await this.prisma.badge.findMany({
      where: {
        isActive: true,
        ...(includeSecret ? {} : { isSecret: false })
      },
      orderBy: [
        { sortOrder: 'asc' },
        { rarity: 'asc' }
      ]
    });
  }

  /**
   * Obtener badges de un usuario
   */
  async getUserBadges(userId) {
    return await this.prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true
      },
      orderBy: { earnedAt: 'desc' }
    });
  }

  /**
   * Obtener estadísticas de badges de un usuario
   */
  async getUserBadgeStats(userId) {
    const userBadges = await this.getUserBadges(userId);
    const allBadges = await this.getAllBadges(false);

    const earnedByRarity = {
      COMMON: 0,
      RARE: 0,
      EPIC: 0,
      LEGENDARY: 0
    };

    let totalPointsFromBadges = 0;
    let recentBadges = [];
    let newBadgesCount = 0;

    userBadges.forEach(ub => {
      if (ub.badge.rarity) {
        earnedByRarity[ub.badge.rarity]++;
      }
      totalPointsFromBadges += ub.badge.pointsReward;
      if (ub.isNew) newBadgesCount++;
    });

    // Badges más recientes
    recentBadges = userBadges.slice(0, 5).map(ub => ({
      ...ub.badge,
      earnedAt: ub.earnedAt,
      isNew: ub.isNew
    }));

    // Progreso por categoría
    const categories = {
      tier: { earned: 0, total: 0 },
      purchase: { earned: 0, total: 0 },
      review: { earned: 0, total: 0 },
      referral: { earned: 0, total: 0 },
      streak: { earned: 0, total: 0 },
      special: { earned: 0, total: 0 }
    };

    const earnedCodes = new Set(userBadges.map(ub => ub.badge.code));

    allBadges.forEach(badge => {
      let category = 'special';
      if (badge.code.startsWith('TIER_')) category = 'tier';
      else if (badge.code.includes('PURCHASE') || badge.code.includes('SPENT')) category = 'purchase';
      else if (badge.code.includes('REVIEW')) category = 'review';
      else if (badge.code.includes('REFERRAL')) category = 'referral';
      else if (badge.code.includes('STREAK')) category = 'streak';

      categories[category].total++;
      if (earnedCodes.has(badge.code)) {
        categories[category].earned++;
      }
    });

    return {
      total: userBadges.length,
      totalAvailable: allBadges.length,
      completionPercentage: (userBadges.length / allBadges.length) * 100,
      earnedByRarity,
      totalPointsFromBadges,
      newBadgesCount,
      recentBadges,
      categories
    };
  }

  /**
   * Marcar badges como vistos
   */
  async markBadgesAsViewed(userId) {
    return await this.prisma.userBadge.updateMany({
      where: {
        userId,
        isNew: true
      },
      data: {
        isNew: false,
        viewedAt: new Date()
      }
    });
  }

  /**
   * Verificar y otorgar badges basados en reviews
   */
  async checkReviewBadges(userId) {
    const reviewCount = await this.prisma.review.count({
      where: {
        userId,
        status: 'APPROVED'
      }
    });

    if (reviewCount >= 10) await gamificationService.checkAndAwardBadge(userId, 'REVIEWS_10');
    else if (reviewCount >= 5) await gamificationService.checkAndAwardBadge(userId, 'REVIEWS_5');
    else if (reviewCount >= 1) await gamificationService.checkAndAwardBadge(userId, 'FIRST_REVIEW');

    return { reviewCount };
  }

  /**
   * Verificar badge de review perfecta
   */
  async checkPerfectReviewBadge(userId, reviewId) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { images: true }
    });

    if (!review) return null;

    // Verificar criterios:
    // - 5 estrellas
    // - Con foto
    // - Comentario de 200+ caracteres
    const hasFiveStars = review.rating === 5;
    const hasPhoto = review.images && review.images.length > 0;
    const hasLongComment = review.comment && review.comment.length >= 200;

    if (hasFiveStars && hasPhoto && hasLongComment) {
      return await gamificationService.checkAndAwardBadge(userId, 'PERFECT_REVIEWER');
    }

    return null;
  }

  /**
   * Verificar badges de referidos
   */
  async checkReferralBadges(userId) {
    const referralCount = await this.prisma.referral.count({
      where: {
        referrerId: userId,
        status: 'COMPLETED'
      }
    });

    if (referralCount >= 10) await gamificationService.checkAndAwardBadge(userId, 'REFERRALS_10');
    else if (referralCount >= 5) await gamificationService.checkAndAwardBadge(userId, 'REFERRALS_5');
    else if (referralCount >= 1) await gamificationService.checkAndAwardBadge(userId, 'FIRST_REFERRAL');

    return { referralCount };
  }

  /**
   * Verificar badges de racha
   */
  async checkStreakBadges(userId) {
    const streak = await this.prisma.streak.findUnique({
      where: {
        userId_type: {
          userId,
          type: 'PURCHASE_MONTHLY'
        }
      }
    });

    if (!streak) return null;

    const streakCount = streak.currentStreak;

    if (streakCount >= 12) await gamificationService.checkAndAwardBadge(userId, 'STREAK_12');
    else if (streakCount >= 6) await gamificationService.checkAndAwardBadge(userId, 'STREAK_6');
    else if (streakCount >= 3) await gamificationService.checkAndAwardBadge(userId, 'STREAK_3');

    return { streakCount };
  }

  /**
   * Verificar badge de comprador nocturno
   */
  async checkMidnightShopperBadge(userId, orderDate) {
    const hour = new Date(orderDate).getHours();
    
    if (hour >= 0 && hour < 6) {
      return await gamificationService.checkAndAwardBadge(userId, 'MIDNIGHT_SHOPPER');
    }

    return null;
  }

  /**
   * Verificar badge de cumpleañero
   */
  async checkBirthdayBadge(userId, orderDate) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.birthday) return null;

    const birthday = new Date(user.birthday);
    const orderDay = new Date(orderDate);

    if (birthday.getMonth() === orderDay.getMonth() && 
        birthday.getDate() === orderDay.getDate()) {
      return await gamificationService.checkAndAwardBadge(userId, 'BIRTHDAY_BUYER');
    }

    return null;
  }

  /**
   * Obtener próximos badges por conseguir
   */
  async getNextBadgesToEarn(userId) {
    const userBadges = await this.getUserBadges(userId);
    const earnedCodes = new Set(userBadges.map(ub => ub.badge.code));
    
    // Obtener estadísticas del usuario
    const orderCount = await this.prisma.order.count({
      where: { userId, status: 'DELIVERED' }
    });

    const totalSpent = await this.prisma.order.aggregate({
      where: { userId, status: 'DELIVERED' },
      _sum: { total: true }
    });

    const reviewCount = await this.prisma.review.count({
      where: { userId, status: 'APPROVED' }
    });

    const referralCount = await this.prisma.referral.count({
      where: { referrerId: userId, status: 'COMPLETED' }
    });

    const streak = await this.prisma.streak.findUnique({
      where: {
        userId_type: {
          userId,
          type: 'PURCHASE_MONTHLY'
        }
      }
    });

    const loyalty = await gamificationService.getOrCreateLoyalty(userId);

    const allBadges = await this.getAllBadges(false);
    const nextBadges = [];

    for (const badge of allBadges) {
      if (earnedCodes.has(badge.code)) continue;

      let progress = 0;
      let current = 0;
      let target = badge.requirementValue || 0;
      let canEarn = false;

      switch (badge.requirementType) {
        case 'PURCHASE_COUNT':
          current = orderCount;
          progress = target > 0 ? (current / target) * 100 : 0;
          canEarn = current >= target;
          break;
        case 'TOTAL_SPENT':
          current = totalSpent._sum.total || 0;
          progress = target > 0 ? (current / target) * 100 : 0;
          canEarn = current >= target;
          break;
        case 'REVIEW_COUNT':
          current = reviewCount;
          progress = target > 0 ? (current / target) * 100 : 0;
          canEarn = current >= target;
          break;
        case 'REFERRAL_COUNT':
          current = referralCount;
          progress = target > 0 ? (current / target) * 100 : 0;
          canEarn = current >= target;
          break;
        case 'STREAK':
          current = streak?.currentStreak || 0;
          progress = target > 0 ? (current / target) * 100 : 0;
          canEarn = current >= target;
          break;
        case 'TIER':
          current = loyalty.currentPoints;
          progress = target > 0 ? (current / target) * 100 : 0;
          canEarn = current >= target;
          break;
      }

      if (progress > 0 && progress < 100) {
        nextBadges.push({
          ...badge,
          progress: Math.min(100, progress),
          current,
          target,
          remaining: Math.max(0, target - current)
        });
      }
    }

    // Ordenar por progreso descendente
    nextBadges.sort((a, b) => b.progress - a.progress);

    return nextBadges.slice(0, 10); // Top 10 más cercanos
  }

  /**
   * Obtener leaderboard de coleccionistas de badges
   */
  async getBadgeCollectorsLeaderboard(limit = 10) {
    const topCollectors = await this.prisma.userBadge.groupBy({
      by: ['userId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    });

    const results = [];
    for (const collector of topCollectors) {
      const user = await this.prisma.user.findUnique({
        where: { id: collector.userId },
        select: { id: true, name: true, email: true }
      });

      const badges = await this.getUserBadges(collector.userId);
      
      results.push({
        user,
        badgeCount: collector._count.id,
        badges: badges.map(ub => ({
          code: ub.badge.code,
          name: ub.badge.name,
          icon: ub.badge.icon,
          rarity: ub.badge.rarity
        }))
      });
    }

    return results;
  }
}

module.exports = new BadgeService();
