const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Servicio de Recomendaciones con IA
 * Implementa algoritmos de recomendación para personalizar la experiencia del usuario
 */
class RecommendationService {
  /**
   * Obtiene recomendaciones personalizadas para un usuario
   */
  async getPersonalizedRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        excludeProductIds = [],
        includeTypes = ['PERSONALIZED', 'SIMILAR', 'TRENDING']
      } = options;

      // Obtener historial del usuario
      const [purchasedProducts, viewedProducts, wishlistProducts] = await Promise.all([
        this.getUserPurchasedProducts(userId),
        this.getUserViewedProducts(userId),
        this.getUserWishlistProducts(userId)
      ]);

      const excludeIds = [
        ...excludeProductIds,
        ...purchasedProducts.map(p => p.id),
        ...wishlistProducts.map(p => p.id)
      ];

      let recommendations = [];

      // 1. Recomendaciones basadas en productos vistos (40%)
      if (viewedProducts.length > 0) {
        const similarRecs = await this.getSimilarProductsMultiple(
          viewedProducts.slice(0, 3).map(p => p.id),
          Math.ceil(limit * 0.4),
          excludeIds
        );
        recommendations.push(...similarRecs.map(r => ({
          ...r,
          reason: 'Basado en productos que has visto',
          type: 'SIMILAR'
        })));
      }

      // 2. Frecuentemente comprados juntos (30%)
      if (purchasedProducts.length > 0) {
        const frequentRecs = await this.getFrequentlyBoughtTogether(
          purchasedProducts[0].id,
          Math.ceil(limit * 0.3),
          excludeIds
        );
        recommendations.push(...frequentRecs.map(r => ({
          ...r,
          reason: 'Frecuentemente comprados juntos',
          type: 'FREQUENTLY_BOUGHT'
        })));
      }

      // 3. Productos trending (20%)
      const trendingRecs = await this.getTrendingProducts(
        Math.ceil(limit * 0.2),
        excludeIds
      );
      recommendations.push(...trendingRecs.map(r => ({
        ...r,
        reason: 'Popular entre otros usuarios',
        type: 'TRENDING'
      })));

      // 4. Basado en categorías favoritas (10%)
      const categoryRecs = await this.getRecommendationsByUserPreferences(
        userId,
        Math.ceil(limit * 0.1),
        excludeIds
      );
      recommendations.push(...categoryRecs.map(r => ({
        ...r,
        reason: 'Basado en tus preferencias',
        type: 'PERSONALIZED'
      })));

      // Filtrar por tipos incluidos
      recommendations = recommendations.filter(r => includeTypes.includes(r.type));

      // Remover duplicados y limitar
      const uniqueRecommendations = this.removeDuplicates(recommendations);
      const finalRecommendations = uniqueRecommendations.slice(0, limit);

      // Registrar feedback implícito (impresión)
      await this.recordImpressions(userId, finalRecommendations);

      return finalRecommendations;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos similares a uno dado
   */
  async getSimilarProducts(productId, limit = 10, excludeIds = []) {
    try {
      // Buscar recomendaciones precalculadas
      const precomputed = await prisma.productRecommendation.findMany({
        where: {
          productId,
          type: 'SIMILAR',
          isActive: true,
          recommendedProductId: { notIn: excludeIds }
        },
        orderBy: { score: 'desc' },
        take: limit
      });

      if (precomputed.length >= limit) {
        return this.hydrateRecommendations(precomputed);
      }

      // Si no hay suficientes precalculadas, calcular en tiempo real
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true }
      });

      if (!product) {
        throw new Error('Producto no encontrado');
      }

      // Buscar productos similares por categoría y tags
      const similarProducts = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { notIn: [productId, ...excludeIds] },
          isActive: true
        },
        include: {
          category: true,
          variants: {
            where: { isDefault: true }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { averageRating: 'desc' },
          { totalSales: 'desc' }
        ],
        take: limit
      });

      return similarProducts;
    } catch (error) {
      console.error('Error getting similar products:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos similares para múltiples productos
   */
  async getSimilarProductsMultiple(productIds, limit, excludeIds = []) {
    try {
      const allRecommendations = await Promise.all(
        productIds.map(id => this.getSimilarProducts(id, limit, excludeIds))
      );

      // Aplanar y mezclar
      const flattened = allRecommendations.flat();
      const unique = this.removeDuplicates(flattened);

      return unique.slice(0, limit);
    } catch (error) {
      console.error('Error getting similar products for multiple:', error);
      return [];
    }
  }

  /**
   * Obtiene productos frecuentemente comprados juntos
   */
  async getFrequentlyBoughtTogether(productId, limit = 10, excludeIds = []) {
    try {
      // Obtener órdenes que contienen este producto
      const ordersWithProduct = await prisma.orderItem.findMany({
        where: { productId },
        select: { orderId: true },
        distinct: ['orderId']
      });

      const orderIds = ordersWithProduct.map(o => o.orderId);

      if (orderIds.length === 0) {
        return [];
      }

      // Obtener otros productos en esas órdenes
      const otherProducts = await prisma.orderItem.findMany({
        where: {
          orderId: { in: orderIds },
          productId: { notIn: [productId, ...excludeIds] }
        },
        select: {
          productId: true,
          product: {
            include: {
              category: true,
              variants: {
                where: { isDefault: true }
              }
            }
          }
        }
      });

      // Contar frecuencia
      const productCount = {};
      otherProducts.forEach(item => {
        if (item.product && item.product.isActive) {
          productCount[item.productId] = (productCount[item.productId] || 0) + 1;
        }
      });

      // Ordenar por frecuencia
      const sorted = Object.entries(productCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      // Obtener productos completos
      const productIds = sorted.map(([id]) => id);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true
        },
        include: {
          category: true,
          variants: {
            where: { isDefault: true }
          }
        }
      });

      // Ordenar según frecuencia
      const orderedProducts = productIds
        .map(id => products.find(p => p.id === id))
        .filter(Boolean);

      return orderedProducts;
    } catch (error) {
      console.error('Error getting frequently bought together:', error);
      return [];
    }
  }

  /**
   * Obtiene productos complementarios
   */
  async getComplementaryProducts(productId, limit = 10, excludeIds = []) {
    try {
      // Buscar recomendaciones precalculadas de tipo COMPLEMENTARY
      const precomputed = await prisma.productRecommendation.findMany({
        where: {
          productId,
          type: 'COMPLEMENTARY',
          isActive: true,
          recommendedProductId: { notIn: excludeIds }
        },
        orderBy: { score: 'desc' },
        take: limit
      });

      if (precomputed.length > 0) {
        return this.hydrateRecommendations(precomputed);
      }

      // Fallback: frecuentemente comprados juntos
      return this.getFrequentlyBoughtTogether(productId, limit, excludeIds);
    } catch (error) {
      console.error('Error getting complementary products:', error);
      return [];
    }
  }

  /**
   * Obtiene productos trending
   */
  async getTrendingProducts(limit = 10, excludeIds = []) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Obtener productos más vendidos en los últimos 30 días
      const trendingProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { notIn: excludeIds },
          orderItems: {
            some: {
              order: {
                createdAt: { gte: thirtyDaysAgo },
                status: { in: ['DELIVERED', 'OUT_FOR_DELIVERY', 'READY'] }
              }
            }
          }
        },
        include: {
          category: true,
          variants: {
            where: { isDefault: true }
          },
          orderItems: {
            where: {
              order: {
                createdAt: { gte: thirtyDaysAgo }
              }
            }
          }
        },
        orderBy: [
          { totalSales: 'desc' },
          { averageRating: 'desc' }
        ],
        take: limit
      });

      return trendingProducts;
    } catch (error) {
      console.error('Error getting trending products:', error);
      return [];
    }
  }

  /**
   * Obtiene nuevos productos
   */
  async getNewProducts(limit = 10, excludeIds = []) {
    try {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { notIn: excludeIds }
        },
        include: {
          category: true,
          variants: {
            where: { isDefault: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return products;
    } catch (error) {
      console.error('Error getting new products:', error);
      return [];
    }
  }

  /**
   * Obtiene recomendaciones basadas en preferencias del usuario
   */
  async getRecommendationsByUserPreferences(userId, limit = 10, excludeIds = []) {
    try {
      // Obtener segmento del usuario
      const segment = await prisma.userSegment.findUnique({
        where: { userId }
      });

      if (!segment || !segment.preferredCategories) {
        return this.getTrendingProducts(limit, excludeIds);
      }

      const preferredCategories = JSON.parse(segment.preferredCategories);

      if (preferredCategories.length === 0) {
        return this.getTrendingProducts(limit, excludeIds);
      }

      // Buscar productos en categorías preferidas
      const products = await prisma.product.findMany({
        where: {
          categoryId: { in: preferredCategories },
          id: { notIn: excludeIds },
          isActive: true
        },
        include: {
          category: true,
          variants: {
            where: { isDefault: true }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { averageRating: 'desc' },
          { totalSales: 'desc' }
        ],
        take: limit
      });

      return products;
    } catch (error) {
      console.error('Error getting recommendations by user preferences:', error);
      return [];
    }
  }

  /**
   * Registra feedback del usuario sobre recomendaciones
   */
  async recordFeedback(userId, productId, recommendedProductId, action, metadata = {}) {
    try {
      const feedback = await prisma.recommendationFeedback.create({
        data: {
          userId,
          productId,
          recommendedProductId,
          action, // CLICKED, PURCHASED, DISMISSED, IGNORED
          purchased: action === 'PURCHASED',
          purchaseAmount: metadata.purchaseAmount || null,
          recommendationType: metadata.recommendationType || null,
          position: metadata.position || null,
          timeToAction: metadata.timeToAction || null,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });

      // Actualizar métricas de recomendación
      await this.updateRecommendationMetrics(productId, recommendedProductId, action);

      return feedback;
    } catch (error) {
      console.error('Error recording feedback:', error);
      throw error;
    }
  }

  /**
   * Actualiza métricas de recomendación
   */
  async updateRecommendationMetrics(productId, recommendedProductId, action) {
    try {
      const updates = {};

      if (action === 'CLICKED') {
        updates.clicks = { increment: 1 };
      } else if (action === 'PURCHASED') {
        updates.clicks = { increment: 1 };
        updates.conversions = { increment: 1 };
      }

      updates.impressions = { increment: 1 };

      await prisma.productRecommendation.updateMany({
        where: {
          productId,
          recommendedProductId
        },
        data: updates
      });

      // Recalcular CTR y conversion rate
      await this.recalculateMetrics(productId, recommendedProductId);
    } catch (error) {
      console.error('Error updating recommendation metrics:', error);
      // No lanzar error, es una operación secundaria
    }
  }

  /**
   * Recalcula métricas de una recomendación
   */
  async recalculateMetrics(productId, recommendedProductId) {
    try {
      const recommendations = await prisma.productRecommendation.findMany({
        where: {
          productId,
          recommendedProductId
        }
      });

      for (const rec of recommendations) {
        const ctr = rec.impressions > 0 ? (rec.clicks / rec.impressions) : 0;
        const conversionRate = rec.clicks > 0 ? (rec.conversions / rec.clicks) : 0;

        await prisma.productRecommendation.update({
          where: { id: rec.id },
          data: {
            ctr,
            conversionRate
          }
        });
      }
    } catch (error) {
      console.error('Error recalculating metrics:', error);
    }
  }

  /**
   * Registra impresiones de recomendaciones
   */
  async recordImpressions(userId, recommendations) {
    try {
      const updates = recommendations.map(rec => {
        if (rec.productId && rec.id) {
          return prisma.productRecommendation.updateMany({
            where: {
              productId: rec.productId,
              recommendedProductId: rec.id
            },
            data: {
              impressions: { increment: 1 }
            }
          });
        }
        return null;
      }).filter(Boolean);

      if (updates.length > 0) {
        await Promise.all(updates);
      }
    } catch (error) {
      console.error('Error recording impressions:', error);
      // No lanzar error, es una operación secundaria
    }
  }

  /**
   * Hidrata recomendaciones con datos de productos
   */
  async hydrateRecommendations(recommendations) {
    try {
      const productIds = recommendations.map(r => r.recommendedProductId);

      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true
        },
        include: {
          category: true,
          variants: {
            where: { isDefault: true }
          }
        }
      });

      return recommendations
        .map(rec => {
          const product = products.find(p => p.id === rec.recommendedProductId);
          return product ? { ...product, score: rec.score } : null;
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Error hydrating recommendations:', error);
      return [];
    }
  }

  /**
   * Remueve duplicados de un array de productos
   */
  removeDuplicates(products) {
    const seen = new Set();
    return products.filter(product => {
      const id = product.id;
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  /**
   * Helper: Obtiene productos comprados por el usuario
   */
  async getUserPurchasedProducts(userId) {
    try {
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            userId,
            status: 'DELIVERED'
          }
        },
        select: {
          productId: true
        },
        distinct: ['productId']
      });

      return orderItems.map(item => ({ id: item.productId }));
    } catch (error) {
      console.error('Error getting user purchased products:', error);
      return [];
    }
  }

  /**
   * Helper: Obtiene productos vistos por el usuario
   */
  async getUserViewedProducts(userId) {
    try {
      const events = await prisma.userEvent.findMany({
        where: {
          userId,
          eventType: 'VIEW_PRODUCT',
          productId: { not: null }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        distinct: ['productId']
      });

      return events.map(e => ({ id: e.productId }));
    } catch (error) {
      console.error('Error getting user viewed products:', error);
      return [];
    }
  }

  /**
   * Helper: Obtiene productos en wishlist del usuario
   */
  async getUserWishlistProducts(userId) {
    try {
      const wishlistItems = await prisma.wishlistItem.findMany({
        where: { userId },
        select: { productId: true }
      });

      return wishlistItems.map(item => ({ id: item.productId }));
    } catch (error) {
      console.error('Error getting user wishlist products:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de recomendaciones
   */
  async getRecommendationStats() {
    try {
      const [recommendations, feedback] = await Promise.all([
        prisma.productRecommendation.findMany({
          where: { isActive: true }
        }),
        prisma.recommendationFeedback.findMany()
      ]);

      const stats = {
        totalRecommendations: recommendations.length,
        totalImpressions: recommendations.reduce((sum, r) => sum + r.impressions, 0),
        totalClicks: recommendations.reduce((sum, r) => sum + r.clicks, 0),
        totalConversions: recommendations.reduce((sum, r) => sum + r.conversions, 0),
        averageCTR: 0,
        averageConversionRate: 0,
        byType: {},
        topPerformers: []
      };

      // Calcular por tipo
      recommendations.forEach(rec => {
        if (!stats.byType[rec.type]) {
          stats.byType[rec.type] = {
            count: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0
          };
        }
        stats.byType[rec.type].count++;
        stats.byType[rec.type].impressions += rec.impressions;
        stats.byType[rec.type].clicks += rec.clicks;
        stats.byType[rec.type].conversions += rec.conversions;
      });

      // Calcular promedios
      if (stats.totalImpressions > 0) {
        stats.averageCTR = ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2);
      }

      if (stats.totalClicks > 0) {
        stats.averageConversionRate = ((stats.totalConversions / stats.totalClicks) * 100).toFixed(2);
      }

      // Top performers
      stats.topPerformers = recommendations
        .filter(r => r.impressions >= 10)
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 10)
        .map(r => ({
          productId: r.productId,
          recommendedProductId: r.recommendedProductId,
          type: r.type,
          score: r.score,
          ctr: (r.ctr * 100).toFixed(2),
          conversionRate: (r.conversionRate * 100).toFixed(2),
          impressions: r.impressions,
          conversions: r.conversions
        }));

      return stats;
    } catch (error) {
      console.error('Error getting recommendation stats:', error);
      throw error;
    }
  }
}

module.exports = new RecommendationService();
