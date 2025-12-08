const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Servicio de Segmentación de Usuarios
 * Clasifica usuarios en segmentos para personalización y marketing
 */
class SegmentationService {
  /**
   * Calcula y actualiza el segmento de un usuario
   */
  async calculateUserSegment(userId) {
    try {
      // Obtener datos del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          orders: {
            include: {
              items: true
            }
          },
          loyalty: true,
          membership: {
            include: {
              plan: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Calcular métricas
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const orders = user.orders.filter(o => o.status === 'DELIVERED');
      const recentOrders = orders.filter(o => o.createdAt >= thirtyDaysAgo);
      
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Días desde primera y última compra
      const sortedOrders = orders.sort((a, b) => b.createdAt - a.createdAt);
      const lastOrder = sortedOrders[0];
      const firstOrder = sortedOrders[sortedOrders.length - 1];

      const daysSinceLastPurchase = lastOrder 
        ? Math.floor((now - lastOrder.createdAt) / (1000 * 60 * 60 * 24))
        : null;

      const daysSinceFirstPurchase = firstOrder
        ? Math.floor((now - firstOrder.createdAt) / (1000 * 60 * 60 * 24))
        : 0;

      // Calcular frecuencia de compra (compras por mes)
      const monthsSinceFirst = daysSinceFirstPurchase > 0 ? daysSinceFirstPurchase / 30 : 1;
      const purchaseFrequency = totalOrders / monthsSinceFirst;

      // Obtener categorías preferidas
      const categoryPurchases = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          // Aquí necesitaríamos join con Product, lo haremos después
        });
      });

      // Calcular engagement score (0-100)
      let engagementScore = 0;
      
      // Factores de engagement
      if (recentOrders.length > 0) engagementScore += 30;
      if (purchaseFrequency > 1) engagementScore += 20;
      if (user.loyalty && user.loyalty.currentPoints > 0) engagementScore += 15;
      if (user.membership) engagementScore += 25;
      if (totalOrders > 5) engagementScore += 10;

      engagementScore = Math.min(engagementScore, 100);

      // Calcular riesgo de churn (0-100)
      let churnRisk = 0;

      if (daysSinceLastPurchase > 90) churnRisk += 40;
      else if (daysSinceLastPurchase > 60) churnRisk += 25;
      else if (daysSinceLastPurchase > 30) churnRisk += 10;

      if (purchaseFrequency < 0.5) churnRisk += 20;
      if (totalOrders < 2) churnRisk += 15;
      if (!user.membership) churnRisk += 10;
      if (recentOrders.length === 0) churnRisk += 15;

      churnRisk = Math.min(churnRisk, 100);

      // Determinar segmentos
      const segments = [];
      let primarySegment = 'NEW_USER';

      // Clasificación principal
      if (totalOrders === 0) {
        segments.push('NEW_USER');
        primarySegment = 'NEW_USER';
      } else if (totalOrders === 1) {
        segments.push('FIRST_TIME_BUYER');
        primarySegment = 'FIRST_TIME_BUYER';
      } else {
        // Usuario recurrente
        if (purchaseFrequency >= 2) {
          segments.push('FREQUENT_BUYER');
          primarySegment = 'FREQUENT_BUYER';
        }

        if (totalSpent >= 1000 || averageOrderValue >= 200) {
          segments.push('HIGH_VALUE');
          if (!segments.includes('FREQUENT_BUYER')) {
            primarySegment = 'HIGH_VALUE';
          }
        }

        if (user.membership && user.membership.status === 'ACTIVE') {
          segments.push('PREMIUM');
          primarySegment = 'PREMIUM';
        }

        if (churnRisk > 60) {
          segments.push('AT_RISK');
          primarySegment = 'AT_RISK';
        }

        if (daysSinceLastPurchase > 90) {
          segments.push('INACTIVE');
          if (primarySegment !== 'AT_RISK') {
            primarySegment = 'INACTIVE';
          }
        }

        if (averageOrderValue < 50) {
          segments.push('BARGAIN_HUNTER');
        }

        if (totalOrders >= 10 && purchaseFrequency >= 1) {
          segments.push('LOYAL');
        }
      }

      // Predicción de próxima compra
      let predictedNextPurchase = null;
      if (purchaseFrequency > 0 && daysSinceLastPurchase !== null) {
        const avgDaysBetweenPurchases = 30 / purchaseFrequency;
        const nextPurchaseDate = new Date(lastOrder.createdAt);
        nextPurchaseDate.setDate(nextPurchaseDate.getDate() + Math.ceil(avgDaysBetweenPurchases));
        predictedNextPurchase = nextPurchaseDate;
      }

      // Acciones recomendadas
      const recommendedActions = [];
      
      if (churnRisk > 50) {
        recommendedActions.push({
          action: 'SEND_WINBACK_EMAIL',
          priority: 'HIGH',
          message: 'Enviar email de reactivación con cupón'
        });
      }

      if (totalOrders === 1) {
        recommendedActions.push({
          action: 'SEND_SECOND_PURCHASE_INCENTIVE',
          priority: 'MEDIUM',
          message: 'Ofrecer descuento para segunda compra'
        });
      }

      if (totalSpent >= 500 && !user.membership) {
        recommendedActions.push({
          action: 'OFFER_MEMBERSHIP',
          priority: 'HIGH',
          message: 'Recomendar membresía premium'
        });
      }

      if (segments.includes('FREQUENT_BUYER') && averageOrderValue > 100) {
        recommendedActions.push({
          action: 'VIP_TREATMENT',
          priority: 'MEDIUM',
          message: 'Ofrecer beneficios VIP y acceso anticipado'
        });
      }

      // Guardar o actualizar segmento
      const segment = await prisma.userSegment.upsert({
        where: { userId },
        update: {
          segments: JSON.stringify(segments),
          primarySegment,
          engagementScore,
          purchaseFrequency,
          averageOrderValue,
          lifetimeValue: totalSpent,
          churnRisk,
          daysSinceLastPurchase,
          daysSinceFirstPurchase,
          totalOrders,
          totalSpent,
          predictedNextPurchase,
          recommendedActions: JSON.stringify(recommendedActions),
          lastCalculated: new Date(),
          needsRecalculation: false
        },
        create: {
          userId,
          segments: JSON.stringify(segments),
          primarySegment,
          engagementScore,
          purchaseFrequency,
          averageOrderValue,
          lifetimeValue: totalSpent,
          churnRisk,
          daysSinceLastPurchase,
          daysSinceFirstPurchase,
          totalOrders,
          totalSpent,
          predictedNextPurchase,
          recommendedActions: JSON.stringify(recommendedActions),
          needsRecalculation: false
        }
      });

      return {
        ...segment,
        segments: JSON.parse(segment.segments),
        recommendedActions: segment.recommendedActions 
          ? JSON.parse(segment.recommendedActions)
          : []
      };
    } catch (error) {
      console.error('Error calculating user segment:', error);
      throw error;
    }
  }

  /**
   * Obtiene el segmento de un usuario
   */
  async getUserSegment(userId) {
    try {
      let segment = await prisma.userSegment.findUnique({
        where: { userId }
      });

      // Si no existe o necesita recalcular, calcularlo
      if (!segment || segment.needsRecalculation) {
        segment = await this.calculateUserSegment(userId);
      }

      return {
        ...segment,
        segments: JSON.parse(segment.segments),
        preferredCategories: segment.preferredCategories 
          ? JSON.parse(segment.preferredCategories)
          : [],
        preferredBrands: segment.preferredBrands
          ? JSON.parse(segment.preferredBrands)
          : [],
        recommendedActions: segment.recommendedActions
          ? JSON.parse(segment.recommendedActions)
          : []
      };
    } catch (error) {
      console.error('Error getting user segment:', error);
      throw error;
    }
  }

  /**
   * Obtiene usuarios por segmento
   */
  async getUsersBySegment(segmentName, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;

      const [segments, total] = await Promise.all([
        prisma.userSegment.findMany({
          where: {
            OR: [
              { primarySegment: segmentName },
              { segments: { contains: segmentName } }
            ]
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
              }
            }
          },
          orderBy: { engagementScore: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.userSegment.count({
          where: {
            OR: [
              { primarySegment: segmentName },
              { segments: { contains: segmentName } }
            ]
          }
        })
      ]);

      return {
        users: segments.map(s => ({
          ...s.user,
          segment: {
            primarySegment: s.primarySegment,
            segments: JSON.parse(s.segments),
            engagementScore: s.engagementScore,
            churnRisk: s.churnRisk,
            lifetimeValue: s.lifetimeValue
          }
        })),
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('Error getting users by segment:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de segmentos
   */
  async getSegmentStats() {
    try {
      const segments = await prisma.userSegment.findMany();

      const stats = {
        totalUsers: segments.length,
        byPrimarySegment: {},
        averageEngagement: 0,
        averageChurnRisk: 0,
        averageLifetimeValue: 0,
        atRiskUsers: 0,
        highValueUsers: 0
      };

      let totalEngagement = 0;
      let totalChurnRisk = 0;
      let totalLTV = 0;

      segments.forEach(segment => {
        // Contar por segmento primario
        stats.byPrimarySegment[segment.primarySegment] = 
          (stats.byPrimarySegment[segment.primarySegment] || 0) + 1;

        // Acumular para promedios
        totalEngagement += segment.engagementScore;
        totalChurnRisk += segment.churnRisk;
        totalLTV += segment.lifetimeValue;

        // Contar usuarios en riesgo y alto valor
        if (segment.churnRisk > 60) stats.atRiskUsers++;
        if (segment.lifetimeValue > 500) stats.highValueUsers++;
      });

      if (segments.length > 0) {
        stats.averageEngagement = (totalEngagement / segments.length).toFixed(2);
        stats.averageChurnRisk = (totalChurnRisk / segments.length).toFixed(2);
        stats.averageLifetimeValue = (totalLTV / segments.length).toFixed(2);
      }

      // Calcular distribución porcentual
      stats.distributionPercent = {};
      Object.keys(stats.byPrimarySegment).forEach(segment => {
        stats.distributionPercent[segment] = 
          ((stats.byPrimarySegment[segment] / stats.totalUsers) * 100).toFixed(2);
      });

      return stats;
    } catch (error) {
      console.error('Error getting segment stats:', error);
      throw error;
    }
  }

  /**
   * Recalcula segmentos para usuarios que lo necesitan
   */
  async recalculateStaleSegments(limit = 100) {
    try {
      const staleSegments = await prisma.userSegment.findMany({
        where: {
          OR: [
            { needsRecalculation: true },
            {
              lastCalculated: {
                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 días
              }
            }
          ]
        },
        take: limit,
        select: { userId: true }
      });

      const results = await Promise.allSettled(
        staleSegments.map(s => this.calculateUserSegment(s.userId))
      );

      return {
        processed: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        total: staleSegments.length
      };
    } catch (error) {
      console.error('Error recalculating stale segments:', error);
      throw error;
    }
  }

  /**
   * Obtiene usuarios en riesgo de churn
   */
  async getAtRiskUsers(minRisk = 60, limit = 50) {
    try {
      const atRiskSegments = await prisma.userSegment.findMany({
        where: {
          churnRisk: { gte: minRisk }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true
            }
          }
        },
        orderBy: { churnRisk: 'desc' },
        take: limit
      });

      return atRiskSegments.map(segment => ({
        user: segment.user,
        churnRisk: segment.churnRisk,
        daysSinceLastPurchase: segment.daysSinceLastPurchase,
        lifetimeValue: segment.lifetimeValue,
        recommendedActions: segment.recommendedActions
          ? JSON.parse(segment.recommendedActions)
          : []
      }));
    } catch (error) {
      console.error('Error getting at-risk users:', error);
      throw error;
    }
  }

  /**
   * Obtiene usuarios de alto valor
   */
  async getHighValueUsers(minValue = 500, limit = 50) {
    try {
      const highValueSegments = await prisma.userSegment.findMany({
        where: {
          lifetimeValue: { gte: minValue }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true
            }
          }
        },
        orderBy: { lifetimeValue: 'desc' },
        take: limit
      });

      return highValueSegments.map(segment => ({
        user: segment.user,
        lifetimeValue: segment.lifetimeValue,
        averageOrderValue: segment.averageOrderValue,
        totalOrders: segment.totalOrders,
        engagementScore: segment.engagementScore,
        primarySegment: segment.primarySegment
      }));
    } catch (error) {
      console.error('Error getting high-value users:', error);
      throw error;
    }
  }
}

module.exports = new SegmentationService();
