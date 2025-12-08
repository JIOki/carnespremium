const { getPrismaClient } = require('../database/connection');
const gamificationService = require('./gamificationService');

/**
 * =====================================================
 * CHALLENGE SERVICE
 * =====================================================
 * Maneja challenges/misiones:
 * - Creación y gestión de challenges
 * - Tracking de progreso
 * - Recompensas por completar
 * - Challenges diarios/semanales/mensuales
 */

class ChallengeService {
  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Obtener challenges activos
   */
  async getActiveChallenges(type = null) {
    const now = new Date();
    
    return await this.prisma.challenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ],
        ...(type && { type })
      },
      orderBy: [
        { difficulty: 'asc' },
        { pointsReward: 'desc' }
      ]
    });
  }

  /**
   * Obtener challenges de un usuario con su progreso
   */
  async getUserChallenges(userId) {
    const activeChallenges = await this.getActiveChallenges();
    const loyalty = await gamificationService.getOrCreateLoyalty(userId);

    const userChallenges = await this.prisma.userChallenge.findMany({
      where: {
        userId,
        challenge: {
          isActive: true
        }
      },
      include: {
        challenge: true
      },
      orderBy: { lastProgressAt: 'desc' }
    });

    // Map challenges con progreso
    const challengesWithProgress = [];

    for (const challenge of activeChallenges) {
      const userChallenge = userChallenges.find(
        uc => uc.challengeId === challenge.id && !uc.isCompleted
      );

      if (userChallenge) {
        challengesWithProgress.push({
          ...challenge,
          progress: {
            current: userChallenge.currentProgress,
            target: userChallenge.targetProgress,
            percentage: (userChallenge.currentProgress / userChallenge.targetProgress) * 100,
            isCompleted: userChallenge.isCompleted,
            completedAt: userChallenge.completedAt,
            rewardClaimed: userChallenge.rewardClaimed
          }
        });
      } else {
        // Challenge disponible pero no iniciado
        challengesWithProgress.push({
          ...challenge,
          progress: {
            current: 0,
            target: challenge.targetValue,
            percentage: 0,
            isCompleted: false,
            completedAt: null,
            rewardClaimed: false
          }
        });
      }
    }

    // Obtener challenges completados recientemente
    const completedChallenges = await this.prisma.userChallenge.findMany({
      where: {
        userId,
        isCompleted: true
      },
      include: {
        challenge: true
      },
      orderBy: { completedAt: 'desc' },
      take: 10
    });

    return {
      active: challengesWithProgress,
      completed: completedChallenges,
      stats: {
        totalCompleted: completedChallenges.length,
        totalPoints: loyalty.totalChallengesCompleted,
        activeCount: challengesWithProgress.filter(c => c.progress.current > 0 && !c.progress.isCompleted).length
      }
    };
  }

  /**
   * Actualizar progreso en un challenge
   */
  async updateChallengeProgress(userId, challengeCode, increment = 1) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { code: challengeCode }
    });

    if (!challenge || !challenge.isActive) {
      return null;
    }

    const loyalty = await gamificationService.getOrCreateLoyalty(userId);

    // Buscar o crear progreso del usuario
    let userChallenge = await this.prisma.userChallenge.findFirst({
      where: {
        userId,
        challengeId: challenge.id,
        isCompleted: false
      }
    });

    if (!userChallenge) {
      userChallenge = await this.prisma.userChallenge.create({
        data: {
          userId,
          loyaltyId: loyalty.id,
          challengeId: challenge.id,
          targetProgress: challenge.targetValue,
          currentProgress: 0
        }
      });
    }

    // Actualizar progreso
    const newProgress = userChallenge.currentProgress + increment;
    const isNowCompleted = newProgress >= challenge.targetValue;

    userChallenge = await this.prisma.userChallenge.update({
      where: { id: userChallenge.id },
      data: {
        currentProgress: newProgress,
        isCompleted: isNowCompleted,
        completedAt: isNowCompleted ? new Date() : undefined,
        lastProgressAt: new Date()
      }
    });

    // Si se completó, otorgar recompensas
    if (isNowCompleted && !userChallenge.rewardClaimed) {
      await this.claimChallengeReward(userId, userChallenge.id);
    }

    // Actualizar contador en challenge
    if (isNowCompleted) {
      await this.prisma.challenge.update({
        where: { id: challenge.id },
        data: {
          totalCompletions: { increment: 1 }
        }
      });
    }

    return {
      userChallenge,
      isCompleted: isNowCompleted,
      progress: {
        current: newProgress,
        target: challenge.targetValue,
        percentage: (newProgress / challenge.targetValue) * 100
      }
    };
  }

  /**
   * Reclamar recompensa de un challenge completado
   */
  async claimChallengeReward(userId, userChallengeId) {
    const userChallenge = await this.prisma.userChallenge.findUnique({
      where: { id: userChallengeId },
      include: { challenge: true }
    });

    if (!userChallenge || !userChallenge.isCompleted || userChallenge.rewardClaimed) {
      throw new Error('Challenge no disponible para reclamar');
    }

    const challenge = userChallenge.challenge;

    // Otorgar puntos
    if (challenge.pointsReward > 0) {
      await gamificationService.addPoints({
        userId,
        points: challenge.pointsReward,
        action: 'CHALLENGE',
        type: 'EARNED',
        referenceType: 'CHALLENGE',
        referenceId: challenge.id,
        description: `Challenge completado: ${challenge.name}`
      });
    }

    // Actualizar userChallenge
    const updated = await this.prisma.userChallenge.update({
      where: { id: userChallengeId },
      data: {
        rewardClaimed: true,
        claimedAt: new Date(),
        pointsEarned: challenge.pointsReward
      }
    });

    // Actualizar contador de challenges completados
    const loyalty = await gamificationService.getOrCreateLoyalty(userId);
    await this.prisma.loyaltyPoints.update({
      where: { id: loyalty.id },
      data: {
        totalChallengesCompleted: { increment: 1 }
      }
    });

    return {
      success: true,
      pointsEarned: challenge.pointsReward,
      userChallenge: updated
    };
  }

  /**
   * Procesar acción que puede progresar challenges
   */
  async processAction(userId, actionType, data = {}) {
    const activeChallenges = await this.getActiveChallenges();
    const results = [];

    for (const challenge of activeChallenges) {
      let shouldUpdate = false;
      let increment = 1;

      switch (challenge.targetType) {
        case 'BUY_PRODUCTS':
          if (actionType === 'PURCHASE' && data.orderTotal) {
            shouldUpdate = true;
            increment = data.productCount || 1;
          }
          break;

        case 'WRITE_REVIEWS':
          if (actionType === 'REVIEW') {
            shouldUpdate = true;
          }
          break;

        case 'REFER_FRIENDS':
          if (actionType === 'REFERRAL') {
            shouldUpdate = true;
          }
          break;

        case 'SPEND_AMOUNT':
          if (actionType === 'PURCHASE' && data.orderTotal) {
            shouldUpdate = true;
            increment = Math.floor(data.orderTotal);
          }
          break;

        case 'VISIT_PAGES':
          if (actionType === 'PAGE_VIEW') {
            shouldUpdate = true;
          }
          break;
      }

      if (shouldUpdate) {
        const result = await this.updateChallengeProgress(userId, challenge.code, increment);
        if (result) {
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Crear challenge (admin)
   */
  async createChallenge(data) {
    return await this.prisma.challenge.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        targetType: data.targetType,
        targetValue: data.targetValue,
        targetDetails: data.targetDetails ? JSON.stringify(data.targetDetails) : null,
        pointsReward: data.pointsReward,
        badgeReward: data.badgeReward || null,
        couponReward: data.couponReward || null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isRepeatable: data.isRepeatable || false,
        maxCompletions: data.maxCompletions || 1,
        icon: data.icon || null,
        color: data.color || null,
        difficulty: data.difficulty || 'MEDIUM'
      }
    });
  }

  /**
   * Generar challenges automáticos diarios
   */
  async generateDailyChallenges() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dailyChallenges = [
      {
        code: `DAILY_BUY_${today.toISOString().split('T')[0]}`,
        name: 'Compra del Día',
        description: 'Realiza una compra hoy',
        type: 'DAILY',
        category: 'PURCHASE',
        targetType: 'BUY_PRODUCTS',
        targetValue: 1,
        pointsReward: 50,
        startDate: today,
        endDate: tomorrow,
        difficulty: 'EASY'
      },
      {
        code: `DAILY_REVIEW_${today.toISOString().split('T')[0]}`,
        name: 'Comparte tu Opinión',
        description: 'Escribe una review hoy',
        type: 'DAILY',
        category: 'REVIEW',
        targetType: 'WRITE_REVIEWS',
        targetValue: 1,
        pointsReward: 75,
        startDate: today,
        endDate: tomorrow,
        difficulty: 'EASY'
      },
      {
        code: `DAILY_EXPLORE_${today.toISOString().split('T')[0]}`,
        name: 'Explorador del Día',
        description: 'Visita 5 páginas de productos',
        type: 'DAILY',
        category: 'EXPLORATION',
        targetType: 'VISIT_PAGES',
        targetValue: 5,
        pointsReward: 25,
        startDate: today,
        endDate: tomorrow,
        difficulty: 'EASY'
      }
    ];

    const created = [];

    for (const challengeData of dailyChallenges) {
      try {
        // Verificar si ya existe
        const existing = await this.prisma.challenge.findUnique({
          where: { code: challengeData.code }
        });

        if (!existing) {
          const challenge = await this.createChallenge(challengeData);
          created.push(challenge);
        }
      } catch (error) {
        console.error(`Error creating daily challenge ${challengeData.code}:`, error);
      }
    }

    return created;
  }

  /**
   * Generar challenges semanales
   */
  async generateWeeklyChallenges() {
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekNumber = this.getWeekNumber(today);
    const year = today.getFullYear();

    const weeklyChallenges = [
      {
        code: `WEEKLY_BUY_3_${year}_W${weekNumber}`,
        name: 'Comprador Activo',
        description: 'Realiza 3 compras esta semana',
        type: 'WEEKLY',
        category: 'PURCHASE',
        targetType: 'BUY_PRODUCTS',
        targetValue: 3,
        pointsReward: 150,
        startDate: today,
        endDate: weekEnd,
        difficulty: 'MEDIUM'
      },
      {
        code: `WEEKLY_SPEND_500_${year}_W${weekNumber}`,
        name: 'Gran Comprador Semanal',
        description: 'Gasta $500 esta semana',
        type: 'WEEKLY',
        category: 'PURCHASE',
        targetType: 'SPEND_AMOUNT',
        targetValue: 500,
        pointsReward: 250,
        startDate: today,
        endDate: weekEnd,
        difficulty: 'HARD'
      },
      {
        code: `WEEKLY_REVIEW_2_${year}_W${weekNumber}`,
        name: 'Crítico de la Semana',
        description: 'Escribe 2 reviews esta semana',
        type: 'WEEKLY',
        category: 'REVIEW',
        targetType: 'WRITE_REVIEWS',
        targetValue: 2,
        pointsReward: 100,
        startDate: today,
        endDate: weekEnd,
        difficulty: 'MEDIUM'
      }
    ];

    const created = [];

    for (const challengeData of weeklyChallenges) {
      try {
        const existing = await this.prisma.challenge.findUnique({
          where: { code: challengeData.code }
        });

        if (!existing) {
          const challenge = await this.createChallenge(challengeData);
          created.push(challenge);
        }
      } catch (error) {
        console.error(`Error creating weekly challenge ${challengeData.code}:`, error);
      }
    }

    return created;
  }

  /**
   * Obtener número de semana del año
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Obtener estadísticas de challenges (admin)
   */
  async getChallengeStats() {
    const total = await this.prisma.challenge.count();
    const active = await this.prisma.challenge.count({
      where: { isActive: true }
    });

    const completionStats = await this.prisma.challenge.aggregate({
      _sum: {
        totalCompletions: true,
        totalParticipants: true
      },
      _avg: {
        totalCompletions: true
      }
    });

    const topChallenges = await this.prisma.challenge.findMany({
      where: { isActive: true },
      orderBy: { totalCompletions: 'desc' },
      take: 5
    });

    const recentCompletions = await this.prisma.userChallenge.findMany({
      where: { isCompleted: true },
      include: {
        challenge: true
      },
      orderBy: { completedAt: 'desc' },
      take: 10
    });

    return {
      total,
      active,
      totalCompletions: completionStats._sum.totalCompletions || 0,
      totalParticipants: completionStats._sum.totalParticipants || 0,
      averageCompletions: completionStats._avg.totalCompletions || 0,
      topChallenges,
      recentCompletions
    };
  }
}

module.exports = new ChallengeService();
