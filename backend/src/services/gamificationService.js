const { getPrismaClient } = require('../database/connection');

/**
 * =====================================================
 * GAMIFICATION SERVICE
 * =====================================================
 * Maneja toda la lógica de gamificación:
 * - Sistema de puntos y transacciones
 * - Badges y logros
 * - Niveles/Tiers con beneficios
 * - Cálculo de progreso y estadísticas
 */

// Configuración de tiers
const TIERS = {
  BRONZE: {
    name: 'Bronce',
    minPoints: 0,
    maxPoints: 499,
    discount: 0.02,
    pointsMultiplier: 1.0,
    benefits: ['Descuento 2% en todas las compras'],
    color: '#CD7F32',
    icon: '🥉'
  },
  SILVER: {
    name: 'Plata',
    minPoints: 500,
    maxPoints: 1999,
    discount: 0.05,
    pointsMultiplier: 1.1,
    benefits: [
      'Descuento 5% en todas las compras',
      'Envío gratis en compras mayores a $100',
      '+10% puntos extra'
    ],
    color: '#C0C0C0',
    icon: '🥈'
  },
  GOLD: {
    name: 'Oro',
    minPoints: 2000,
    maxPoints: 4999,
    discount: 0.10,
    pointsMultiplier: 1.25,
    benefits: [
      'Descuento 10% en todas las compras',
      'Envío gratis siempre',
      '+25% puntos extra',
      'Acceso anticipado a ofertas'
    ],
    color: '#FFD700',
    icon: '🥇'
  },
  PLATINUM: {
    name: 'Platino',
    minPoints: 5000,
    maxPoints: 9999,
    discount: 0.15,
    pointsMultiplier: 1.5,
    benefits: [
      'Descuento 15% en todas las compras',
      'Envío gratis siempre',
      '+50% puntos extra',
      'Acceso anticipado a productos',
      'Soporte prioritario 24/7'
    ],
    color: '#E5E4E2',
    icon: '💎'
  },
  DIAMOND: {
    name: 'Diamante',
    minPoints: 10000,
    maxPoints: Infinity,
    discount: 0.20,
    pointsMultiplier: 2.0,
    benefits: [
      'Descuento 20% en todas las compras',
      'Envío gratis siempre',
      '+100% puntos extra (puntos dobles)',
      'Acceso a productos exclusivos',
      'Soporte VIP prioritario',
      'Regalos especiales',
      'Eventos exclusivos'
    ],
    color: '#B9F2FF',
    icon: '👑'
  }
};

// Configuración de acciones de puntos
const POINTS_ACTIONS = {
  PURCHASE: {
    basePoints: 1, // 1 punto por dólar
    description: 'Compra realizada'
  },
  REVIEW: {
    basePoints: 50,
    description: 'Review de producto escrita'
  },
  REVIEW_WITH_PHOTO: {
    basePoints: 75,
    description: 'Review con foto'
  },
  REFERRAL_SIGNUP: {
    basePoints: 200,
    description: 'Amigo referido se registró'
  },
  REFERRAL_PURCHASE: {
    basePoints: 500,
    description: 'Amigo referido hizo su primera compra'
  },
  SHARE_SOCIAL: {
    basePoints: 10,
    description: 'Compartido en redes sociales'
  },
  PROFILE_COMPLETE: {
    basePoints: 100,
    description: 'Perfil completado'
  },
  FIRST_PURCHASE: {
    basePoints: 200,
    description: 'Primera compra realizada'
  },
  BIRTHDAY: {
    basePoints: 500,
    description: 'Regalo de cumpleaños'
  }
};

class GamificationService {
  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Obtener o crear loyalty points para un usuario
   */
  async getOrCreateLoyalty(userId) {
    let loyalty = await this.prisma.loyaltyPoints.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' }
        },
        streaks: true
      }
    });

    if (!loyalty) {
      loyalty = await this.prisma.loyaltyPoints.create({
        data: {
          userId,
          tier: 'BRONZE',
          nextTierPoints: TIERS.SILVER.minPoints
        },
        include: {
          transactions: true,
          badges: true,
          streaks: true
        }
      });
    }

    return loyalty;
  }

  /**
   * Agregar puntos a un usuario
   */
  async addPoints({
    userId,
    points,
    action,
    type = 'EARNED',
    orderId = null,
    referenceType = null,
    referenceId = null,
    description = null,
    metadata = null
  }) {
    const loyalty = await this.getOrCreateLoyalty(userId);
    
    // Aplicar multiplicador del tier
    const tierConfig = TIERS[loyalty.tier];
    const multiplier = tierConfig.pointsMultiplier;
    const finalPoints = Math.floor(points * multiplier);
    const bonusPoints = finalPoints - points;
    
    // Calcular nuevos valores
    const newCurrentPoints = loyalty.currentPoints + finalPoints;
    const newTotalEarned = loyalty.totalEarned + finalPoints;
    const newLifetimePoints = loyalty.lifetimePoints + finalPoints;
    
    // Verificar cambio de tier
    const newTier = this.calculateTier(newCurrentPoints);
    const tierChanged = newTier !== loyalty.tier;
    
    // Actualizar loyalty y crear transacción en una sola operación
    const [updatedLoyalty, transaction] = await this.prisma.$transaction([
      this.prisma.loyaltyPoints.update({
        where: { id: loyalty.id },
        data: {
          currentPoints: newCurrentPoints,
          totalEarned: newTotalEarned,
          lifetimePoints: newLifetimePoints,
          tier: newTier,
          tierProgress: this.calculateTierProgress(newCurrentPoints, newTier),
          nextTierPoints: this.getNextTierPoints(newTier),
          lastPointsEarned: new Date(),
          lastTierUpgrade: tierChanged ? new Date() : loyalty.lastTierUpgrade,
          metadata: metadata ? JSON.stringify(metadata) : loyalty.metadata
        }
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          loyaltyId: loyalty.id,
          userId,
          type,
          action,
          points: finalPoints,
          balanceBefore: loyalty.currentPoints,
          balanceAfter: newCurrentPoints,
          orderId,
          referenceType,
          referenceId,
          multiplier,
          bonusPoints,
          description: description || POINTS_ACTIONS[action]?.description || 'Puntos ganados',
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      })
    ]);

    // Si hubo cambio de tier, otorgar badge de tier
    if (tierChanged) {
      await this.checkAndAwardTierBadge(userId, newTier);
    }

    return {
      success: true,
      loyalty: updatedLoyalty,
      transaction,
      pointsAdded: finalPoints,
      bonusPoints,
      multiplier,
      tierChanged,
      newTier: tierChanged ? newTier : null
    };
  }

  /**
   * Canjear puntos por recompensas
   */
  async redeemPoints({
    userId,
    points,
    rewardId = null,
    description = 'Canje de puntos',
    metadata = null
  }) {
    const loyalty = await this.getOrCreateLoyalty(userId);

    if (loyalty.currentPoints < points) {
      throw new Error(`Puntos insuficientes. Tienes ${loyalty.currentPoints}, necesitas ${points}`);
    }

    const newCurrentPoints = loyalty.currentPoints - points;
    const newTotalRedeemed = loyalty.totalRedeemed + points;

    // Actualizar loyalty y crear transacción
    const [updatedLoyalty, transaction] = await this.prisma.$transaction([
      this.prisma.loyaltyPoints.update({
        where: { id: loyalty.id },
        data: {
          currentPoints: newCurrentPoints,
          totalRedeemed: newTotalRedeemed
        }
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          loyaltyId: loyalty.id,
          userId,
          type: 'REDEEMED',
          action: 'REDEMPTION',
          points: -points,
          balanceBefore: loyalty.currentPoints,
          balanceAfter: newCurrentPoints,
          referenceType: rewardId ? 'REWARD' : null,
          referenceId: rewardId,
          description,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      })
    ]);

    return {
      success: true,
      loyalty: updatedLoyalty,
      transaction,
      pointsRedeemed: points
    };
  }

  /**
   * Calcular tier basado en puntos actuales
   */
  calculateTier(currentPoints) {
    if (currentPoints >= TIERS.DIAMOND.minPoints) return 'DIAMOND';
    if (currentPoints >= TIERS.PLATINUM.minPoints) return 'PLATINUM';
    if (currentPoints >= TIERS.GOLD.minPoints) return 'GOLD';
    if (currentPoints >= TIERS.SILVER.minPoints) return 'SILVER';
    return 'BRONZE';
  }

  /**
   * Calcular progreso al siguiente tier (0-100)
   */
  calculateTierProgress(currentPoints, tier) {
    const currentTier = TIERS[tier];
    const nextTierKey = this.getNextTierKey(tier);
    
    if (!nextTierKey) return 100; // Ya está en el tier máximo
    
    const nextTier = TIERS[nextTierKey];
    const pointsInCurrentTier = currentPoints - currentTier.minPoints;
    const pointsNeededForNext = nextTier.minPoints - currentTier.minPoints;
    
    return Math.min(100, (pointsInCurrentTier / pointsNeededForNext) * 100);
  }

  /**
   * Obtener puntos necesarios para el siguiente tier
   */
  getNextTierPoints(tier) {
    const nextTierKey = this.getNextTierKey(tier);
    return nextTierKey ? TIERS[nextTierKey].minPoints : Infinity;
  }

  /**
   * Obtener el siguiente tier
   */
  getNextTierKey(currentTier) {
    const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
    const currentIndex = tierOrder.indexOf(currentTier);
    return currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;
  }

  /**
   * Obtener configuración de tier
   */
  getTierConfig(tier) {
    return TIERS[tier] || TIERS.BRONZE;
  }

  /**
   * Obtener todos los tiers
   */
  getAllTiers() {
    return TIERS;
  }

  /**
   * Obtener estadísticas de loyalty del usuario
   */
  async getUserStats(userId) {
    const loyalty = await this.getOrCreateLoyalty(userId);
    const tierConfig = this.getTierConfig(loyalty.tier);
    const nextTierKey = this.getNextTierKey(loyalty.tier);
    const nextTierConfig = nextTierKey ? TIERS[nextTierKey] : null;

    // Obtener transacciones recientes
    const recentTransactions = await this.prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Obtener puntos por expirar (si implementamos expiración)
    const pointsExpiringSoon = await this.prisma.loyaltyTransaction.count({
      where: {
        userId,
        isExpired: false,
        expiresAt: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
        }
      }
    });

    return {
      loyalty,
      currentTier: {
        ...tierConfig,
        key: loyalty.tier
      },
      nextTier: nextTierConfig ? {
        ...nextTierConfig,
        key: nextTierKey,
        pointsNeeded: nextTierConfig.minPoints - loyalty.currentPoints
      } : null,
      stats: {
        currentPoints: loyalty.currentPoints,
        lifetimePoints: loyalty.lifetimePoints,
        totalEarned: loyalty.totalEarned,
        totalRedeemed: loyalty.totalRedeemed,
        totalBadges: loyalty.totalBadges,
        totalChallengesCompleted: loyalty.totalChallengesCompleted,
        totalReferrals: loyalty.totalReferrals,
        currentStreak: loyalty.currentStreak,
        longestStreak: loyalty.longestStreak,
        tierProgress: loyalty.tierProgress,
        pointsExpiringSoon
      },
      recentTransactions
    };
  }

  /**
   * Verificar y otorgar badge de tier si corresponde
   */
  async checkAndAwardTierBadge(userId, tier) {
    // Buscar badge de tier
    const badgeCode = `TIER_${tier}`;
    const badge = await this.prisma.badge.findUnique({
      where: { code: badgeCode }
    });

    if (!badge) return null;

    // Verificar si ya tiene el badge
    const existingBadge = await this.prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id
        }
      }
    });

    if (existingBadge) return null;

    const loyalty = await this.getOrCreateLoyalty(userId);

    // Otorgar badge
    const userBadge = await this.prisma.userBadge.create({
      data: {
        userId,
        loyaltyId: loyalty.id,
        badgeId: badge.id,
        earnedFromType: 'TIER_UPGRADE'
      }
    });

    // Actualizar contador de badges
    await this.prisma.loyaltyPoints.update({
      where: { id: loyalty.id },
      data: {
        totalBadges: { increment: 1 }
      }
    });

    // Si el badge tiene recompensa de puntos, agregarlos
    if (badge.pointsReward > 0) {
      await this.addPoints({
        userId,
        points: badge.pointsReward,
        action: 'BONUS',
        type: 'EARNED',
        referenceType: 'BADGE',
        referenceId: badge.id,
        description: `Puntos bonus por conseguir badge: ${badge.name}`
      });
    }

    return userBadge;
  }

  /**
   * Procesar evento de compra para gamificación
   */
  async processOrderForGamification(orderId, userId, orderTotal) {
    const results = [];

    // 1. Agregar puntos por la compra (1 punto = $1)
    const pointsFromPurchase = Math.floor(orderTotal);
    const purchaseResult = await this.addPoints({
      userId,
      points: pointsFromPurchase,
      action: 'PURCHASE',
      type: 'EARNED',
      orderId,
      referenceType: 'ORDER',
      referenceId: orderId,
      description: `Compra por $${orderTotal.toFixed(2)}`
    });
    results.push(purchaseResult);

    // 2. Verificar si es la primera compra
    const orderCount = await this.prisma.order.count({
      where: { userId, status: 'DELIVERED' }
    });

    if (orderCount === 1) {
      const firstPurchaseResult = await this.addPoints({
        userId,
        points: POINTS_ACTIONS.FIRST_PURCHASE.basePoints,
        action: 'FIRST_PURCHASE',
        type: 'EARNED',
        orderId,
        description: POINTS_ACTIONS.FIRST_PURCHASE.description
      });
      results.push(firstPurchaseResult);

      // Otorgar badge de primera compra
      await this.checkAndAwardBadge(userId, 'FIRST_PURCHASE');
    }

    // 3. Actualizar streak de compras mensuales
    await this.updatePurchaseStreak(userId);

    // 4. Verificar badges relacionados con compras
    await this.checkPurchaseBasedBadges(userId);

    return results;
  }

  /**
   * Actualizar racha de compras mensuales
   */
  async updatePurchaseStreak(userId) {
    const loyalty = await this.getOrCreateLoyalty(userId);
    
    let streak = await this.prisma.streak.findUnique({
      where: {
        userId_type: {
          userId,
          type: 'PURCHASE_MONTHLY'
        }
      }
    });

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    if (!streak) {
      // Crear nueva racha
      streak = await this.prisma.streak.create({
        data: {
          userId,
          loyaltyId: loyalty.id,
          type: 'PURCHASE_MONTHLY',
          currentStreak: 1,
          longestStreak: 1,
          lastActionDate: now,
          nextRequiredDate: nextMonth
        }
      });
    } else {
      // Verificar si la compra mantiene la racha
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const streakBroken = streak.lastActionDate < lastMonth;

      if (streakBroken) {
        // Racha rota, reiniciar
        streak = await this.prisma.streak.update({
          where: { id: streak.id },
          data: {
            currentStreak: 1,
            lastActionDate: now,
            nextRequiredDate: nextMonth,
            brokeAt: now
          }
        });
      } else {
        // Verificar si es una nueva compra del mes
        const streakMonth = new Date(streak.lastActionDate).getMonth();
        const currentMonthNum = now.getMonth();

        if (streakMonth !== currentMonthNum) {
          // Nueva compra de un nuevo mes, incrementar racha
          const newStreak = streak.currentStreak + 1;
          streak = await this.prisma.streak.update({
            where: { id: streak.id },
            data: {
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, streak.longestStreak),
              lastActionDate: now,
              nextRequiredDate: nextMonth
            }
          });

          // Otorgar puntos bonus por racha
          const bonusMultiplier = this.getStreakBonusMultiplier(newStreak);
          if (bonusMultiplier > 1) {
            await this.prisma.streak.update({
              where: { id: streak.id },
              data: {
                currentMultiplier: bonusMultiplier
              }
            });
          }
        }
      }
    }

    // Actualizar streak en loyalty
    await this.prisma.loyaltyPoints.update({
      where: { id: loyalty.id },
      data: {
        currentStreak: streak.currentStreak,
        longestStreak: Math.max(streak.longestStreak, loyalty.longestStreak)
      }
    });

    return streak;
  }

  /**
   * Obtener multiplicador de bonus por racha
   */
  getStreakBonusMultiplier(streakCount) {
    if (streakCount >= 12) return 1.5; // +50% por 12 meses
    if (streakCount >= 6) return 1.25; // +25% por 6 meses
    if (streakCount >= 3) return 1.1;  // +10% por 3 meses
    return 1.0;
  }

  /**
   * Verificar y otorgar badges basados en compras
   */
  async checkPurchaseBasedBadges(userId) {
    const orderCount = await this.prisma.order.count({
      where: { userId, status: 'DELIVERED' }
    });

    const totalSpent = await this.prisma.order.aggregate({
      where: { userId, status: 'DELIVERED' },
      _sum: { total: true }
    });

    const spent = totalSpent._sum.total || 0;

    // Badges por cantidad de compras
    if (orderCount >= 100) await this.checkAndAwardBadge(userId, 'PURCHASES_100');
    else if (orderCount >= 50) await this.checkAndAwardBadge(userId, 'PURCHASES_50');
    else if (orderCount >= 20) await this.checkAndAwardBadge(userId, 'PURCHASES_20');
    else if (orderCount >= 10) await this.checkAndAwardBadge(userId, 'PURCHASES_10');
    else if (orderCount >= 5) await this.checkAndAwardBadge(userId, 'PURCHASES_5');

    // Badges por total gastado
    if (spent >= 10000) await this.checkAndAwardBadge(userId, 'SPENT_10K');
    else if (spent >= 5000) await this.checkAndAwardBadge(userId, 'SPENT_5K');
    else if (spent >= 1000) await this.checkAndAwardBadge(userId, 'SPENT_1K');
  }

  /**
   * Verificar y otorgar badge genérico
   */
  async checkAndAwardBadge(userId, badgeCode) {
    const badge = await this.prisma.badge.findUnique({
      where: { code: badgeCode }
    });

    if (!badge || !badge.isActive) return null;

    // Verificar si ya tiene el badge
    const existingBadge = await this.prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id
        }
      }
    });

    if (existingBadge) return null;

    const loyalty = await this.getOrCreateLoyalty(userId);

    // Otorgar badge
    const userBadge = await this.prisma.userBadge.create({
      data: {
        userId,
        loyaltyId: loyalty.id,
        badgeId: badge.id
      }
    });

    // Actualizar contador
    await this.prisma.loyaltyPoints.update({
      where: { id: loyalty.id },
      data: {
        totalBadges: { increment: 1 }
      }
    });

    // Actualizar estadística del badge
    await this.prisma.badge.update({
      where: { id: badge.id },
      data: {
        totalAwarded: { increment: 1 }
      }
    });

    // Agregar puntos reward si tiene
    if (badge.pointsReward > 0) {
      await this.addPoints({
        userId,
        points: badge.pointsReward,
        action: 'BONUS',
        type: 'EARNED',
        referenceType: 'BADGE',
        referenceId: badge.id,
        description: `Puntos bonus por conseguir: ${badge.name}`
      });
    }

    return userBadge;
  }
}

module.exports = new GamificationService();
