const { getPrismaClient } = require('../database/connection');
const gamificationService = require('./gamificationService');

/**
 * =====================================================
 * REWARD SERVICE
 * =====================================================
 * Maneja el catálogo de recompensas y canjes:
 * - Creación y gestión de recompensas
 * - Canje de puntos por recompensas
 * - Tracking de redemptions
 * - Generación de códigos de cupón
 */

class RewardService {
  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Obtener catálogo de recompensas disponibles
   */
  async getAvailableRewards(userId = null) {
    const now = new Date();
    
    let rewards = await this.prisma.reward.findMany({
      where: {
        isActive: true,
        isVisible: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } }
        ]
      },
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { pointsCost: 'asc' }
      ]
    });

    // Si hay usuario, verificar tier requirements y redemptions
    if (userId) {
      const loyalty = await gamificationService.getOrCreateLoyalty(userId);
      const userRedemptions = await this.prisma.rewardRedemption.findMany({
        where: { userId }
      });

      rewards = rewards.filter(reward => {
        // Verificar tier requirement
        if (reward.requiresTier) {
          const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
          const userTierIndex = tierOrder.indexOf(loyalty.tier);
          const requiredTierIndex = tierOrder.indexOf(reward.requiresTier);
          if (userTierIndex < requiredTierIndex) {
            return false;
          }
        }

        // Verificar límite por usuario
        if (reward.maxPerUser) {
          const userRedemptionCount = userRedemptions.filter(
            r => r.rewardId === reward.id && r.status !== 'CANCELLED'
          ).length;
          if (userRedemptionCount >= reward.maxPerUser) {
            return false;
          }
        }

        return true;
      });

      // Agregar información de si puede canjear
      rewards = rewards.map(reward => ({
        ...reward,
        canAfford: loyalty.currentPoints >= reward.pointsCost,
        userPoints: loyalty.currentPoints
      }));
    }

    return rewards;
  }

  /**
   * Obtener detalle de una recompensa
   */
  async getRewardById(rewardId) {
    return await this.prisma.reward.findUnique({
      where: { id: rewardId },
      include: {
        redemptions: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Canjear recompensa
   */
  async redeemReward(userId, rewardId) {
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId }
    });

    if (!reward || !reward.isActive) {
      throw new Error('Recompensa no disponible');
    }

    // Verificar vigencia
    const now = new Date();
    if (reward.validFrom > now || (reward.validUntil && reward.validUntil < now)) {
      throw new Error('Recompensa fuera de vigencia');
    }

    const loyalty = await gamificationService.getOrCreateLoyalty(userId);

    // Verificar puntos suficientes
    if (loyalty.currentPoints < reward.pointsCost) {
      throw new Error(`Puntos insuficientes. Necesitas ${reward.pointsCost}, tienes ${loyalty.currentPoints}`);
    }

    // Verificar tier requirement
    if (reward.requiresTier) {
      const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
      const userTierIndex = tierOrder.indexOf(loyalty.tier);
      const requiredTierIndex = tierOrder.indexOf(reward.requiresTier);
      if (userTierIndex < requiredTierIndex) {
        throw new Error(`Requiere tier ${reward.requiresTier} o superior`);
      }
    }

    // Verificar stock
    if (reward.stockLimit !== null) {
      if (reward.currentStock <= 0) {
        throw new Error('Recompensa agotada');
      }
    }

    // Verificar límite por usuario
    if (reward.maxPerUser) {
      const userRedemptionCount = await this.prisma.rewardRedemption.count({
        where: {
          userId,
          rewardId,
          status: { not: 'CANCELLED' }
        }
      });

      if (userRedemptionCount >= reward.maxPerUser) {
        throw new Error(`Has alcanzado el límite de canjes para esta recompensa (${reward.maxPerUser})`);
      }
    }

    // Generar código si es necesario
    let generatedCode = null;
    if (reward.type === 'DISCOUNT' || reward.type === 'FREE_SHIPPING') {
      generatedCode = this.generateRedemptionCode(userId, rewardId);
    }

    // Procesar canje en transacción
    const result = await this.prisma.$transaction(async (prisma) => {
      // Deducir puntos
      await gamificationService.redeemPoints({
        userId,
        points: reward.pointsCost,
        rewardId,
        description: `Canje: ${reward.name}`,
        metadata: { rewardType: reward.type }
      });

      // Crear redemption
      const redemption = await prisma.rewardRedemption.create({
        data: {
          userId,
          rewardId,
          pointsSpent: reward.pointsCost,
          status: reward.type === 'PHYSICAL_REWARD' ? 'PENDING' : 'APPROVED',
          deliveryMethod: this.getDeliveryMethod(reward.type),
          generatedCode
        }
      });

      // Actualizar stock si aplica
      if (reward.stockLimit !== null) {
        await prisma.reward.update({
          where: { id: rewardId },
          data: {
            currentStock: { decrement: 1 }
          }
        });
      }

      // Actualizar estadísticas de reward
      await prisma.reward.update({
        where: { id: rewardId },
        data: {
          totalRedeemed: { increment: 1 },
          totalValue: { increment: reward.discountValue || 0 }
        }
      });

      // Si es descuento, crear cupón automáticamente
      if (reward.type === 'DISCOUNT' && generatedCode) {
        await this.createCouponFromReward(prisma, reward, generatedCode, userId);
      }

      return redemption;
    });

    return {
      success: true,
      redemption: result,
      code: generatedCode,
      message: this.getRedemptionMessage(reward.type, generatedCode)
    };
  }

  /**
   * Generar código de redemption único
   */
  generateRedemptionCode(userId, rewardId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REWARD-${random}-${timestamp.toString(36).toUpperCase()}`;
  }

  /**
   * Obtener método de entrega según tipo de recompensa
   */
  getDeliveryMethod(rewardType) {
    switch (rewardType) {
      case 'DISCOUNT':
      case 'FREE_SHIPPING':
        return 'COUPON';
      case 'PHYSICAL_REWARD':
        return 'PHYSICAL';
      case 'EXCLUSIVE_ACCESS':
        return 'IN_APP';
      default:
        return 'EMAIL';
    }
  }

  /**
   * Obtener mensaje de confirmación según tipo
   */
  getRedemptionMessage(rewardType, code) {
    switch (rewardType) {
      case 'DISCOUNT':
        return `¡Recompensa canjeada! Usa el código ${code} en tu próxima compra.`;
      case 'FREE_SHIPPING':
        return `¡Envío gratis activado! Usa el código ${code} en el checkout.`;
      case 'PHYSICAL_REWARD':
        return `Recompensa física solicitada. Un administrador revisará tu solicitud pronto.`;
      case 'EXCLUSIVE_ACCESS':
        return `¡Acceso exclusivo desbloqueado! Ya puedes ver los productos especiales.`;
      default:
        return `¡Recompensa canjeada exitosamente!`;
    }
  }

  /**
   * Crear cupón desde recompensa
   */
  async createCouponFromReward(prisma, reward, code, userId) {
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + 30); // Válido por 30 días

    const couponData = {
      code,
      description: `Recompensa: ${reward.name}`,
      type: reward.discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
      value: reward.discountValue,
      minPurchase: 0,
      maxUsage: 1,
      maxUsagePerUser: 1,
      validFrom: now,
      validUntil,
      isActive: true,
      isPublic: false,
      metadata: JSON.stringify({
        source: 'REWARD',
        rewardId: reward.id,
        userId
      })
    };

    return await prisma.coupon.create({ data: couponData });
  }

  /**
   * Obtener redemptions de un usuario
   */
  async getUserRedemptions(userId) {
    return await this.prisma.rewardRedemption.findMany({
      where: { userId },
      include: { reward: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Obtener redemptions pendientes (admin)
   */
  async getPendingRedemptions() {
    return await this.prisma.rewardRedemption.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        reward: true
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Aprobar redemption (admin)
   */
  async approveRedemption(redemptionId, adminId) {
    return await this.prisma.rewardRedemption.update({
      where: { id: redemptionId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });
  }

  /**
   * Marcar como entregado (admin)
   */
  async markAsDelivered(redemptionId, trackingInfo = null) {
    return await this.prisma.rewardRedemption.update({
      where: { id: redemptionId },
      data: {
        deliveryStatus: 'DELIVERED',
        deliveredAt: new Date(),
        trackingInfo: trackingInfo ? JSON.stringify(trackingInfo) : null
      }
    });
  }

  /**
   * Cancelar redemption
   */
  async cancelRedemption(redemptionId, reason, refund = true) {
    const redemption = await this.prisma.rewardRedemption.findUnique({
      where: { id: redemptionId },
      include: { reward: true }
    });

    if (!redemption) {
      throw new Error('Redemption no encontrada');
    }

    // Actualizar redemption
    const updated = await this.prisma.rewardRedemption.update({
      where: { id: redemptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
        refunded: refund
      }
    });

    // Reembolsar puntos si aplica
    if (refund) {
      await gamificationService.addPoints({
        userId: redemption.userId,
        points: redemption.pointsSpent,
        action: 'ADJUSTMENT',
        type: 'EARNED',
        referenceType: 'REFUND',
        referenceId: redemptionId,
        description: `Reembolso: ${redemption.reward.name} cancelado`
      });

      // Restaurar stock si aplica
      if (redemption.reward.stockLimit !== null) {
        await this.prisma.reward.update({
          where: { id: redemption.rewardId },
          data: {
            currentStock: { increment: 1 }
          }
        });
      }
    }

    return updated;
  }

  /**
   * Crear recompensa (admin)
   */
  async createReward(data) {
    return await this.prisma.reward.create({
      data: {
        name: data.name,
        description: data.description,
        shortDesc: data.shortDesc,
        type: data.type,
        pointsCost: data.pointsCost,
        discountType: data.discountType || null,
        discountValue: data.discountValue || null,
        productId: data.productId || null,
        stockLimit: data.stockLimit || null,
        currentStock: data.stockLimit || null,
        maxPerUser: data.maxPerUser || 1,
        requiresTier: data.requiresTier || null,
        imageUrl: data.imageUrl || null,
        icon: data.icon || null,
        color: data.color || null,
        featured: data.featured || false,
        validFrom: new Date(data.validFrom),
        validUntil: data.validUntil ? new Date(data.validUntil) : null
      }
    });
  }

  /**
   * Actualizar recompensa (admin)
   */
  async updateReward(rewardId, data) {
    return await this.prisma.reward.update({
      where: { id: rewardId },
      data
    });
  }

  /**
   * Obtener estadísticas de recompensas (admin)
   */
  async getRewardStats() {
    const totalRewards = await this.prisma.reward.count();
    const activeRewards = await this.prisma.reward.count({
      where: { isActive: true }
    });

    const redemptionStats = await this.prisma.rewardRedemption.aggregate({
      _count: { id: true },
      _sum: { pointsSpent: true }
    });

    const topRewards = await this.prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { totalRedeemed: 'desc' },
      take: 5
    });

    const recentRedemptions = await this.prisma.rewardRedemption.findMany({
      include: { reward: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return {
      totalRewards,
      activeRewards,
      totalRedemptions: redemptionStats._count.id || 0,
      totalPointsSpent: redemptionStats._sum.pointsSpent || 0,
      topRewards,
      recentRedemptions
    };
  }
}

module.exports = new RewardService();
