const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Servicio de Tracking de Eventos de Usuario
 * Rastrea el comportamiento del usuario para alimentar el sistema de recomendaciones
 */
class TrackingService {
  /**
   * Registra un evento de usuario
   */
  async trackEvent(eventData) {
    try {
      const {
        userId,
        sessionId,
        eventType,
        productId,
        categoryId,
        searchQuery,
        pageUrl,
        referrer,
        duration,
        quantity,
        price,
        position,
        fromRecommendation = false,
        recommendationType,
        deviceType,
        browser,
        os,
        ipAddress,
        country,
        city,
        metadata
      } = eventData;

      // Validar tipo de evento
      const validEventTypes = [
        'VIEW_PRODUCT',
        'ADD_TO_CART',
        'REMOVE_FROM_CART',
        'ADD_TO_WISHLIST',
        'REMOVE_FROM_WISHLIST',
        'SEARCH',
        'PURCHASE',
        'CLICK',
        'SCROLL',
        'VIEW_CATEGORY',
        'CHECKOUT_START',
        'CHECKOUT_COMPLETE'
      ];

      if (!validEventTypes.includes(eventType)) {
        throw new Error(`Tipo de evento inválido: ${eventType}`);
      }

      // Crear evento
      const event = await prisma.userEvent.create({
        data: {
          userId: userId || null,
          sessionId: sessionId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          eventType,
          productId,
          categoryId,
          searchQuery,
          pageUrl,
          referrer,
          duration,
          quantity,
          price,
          position,
          fromRecommendation,
          recommendationType,
          deviceType,
          browser,
          os,
          ipAddress,
          country,
          city,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });

      // Si es un evento importante, marcar segmento para recalcular
      if (userId && ['PURCHASE', 'ADD_TO_CART', 'ADD_TO_WISHLIST'].includes(eventType)) {
        await this.markSegmentForRecalculation(userId);
      }

      return event;
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }

  /**
   * Rastrea múltiples eventos en batch
   */
  async trackEventsBatch(events) {
    try {
      const results = await Promise.allSettled(
        events.map(event => this.trackEvent(event))
      );

      return {
        success: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        results
      };
    } catch (error) {
      console.error('Error tracking events batch:', error);
      throw error;
    }
  }

  /**
   * Obtiene eventos de un usuario
   */
  async getUserEvents(userId, options = {}) {
    try {
      const {
        eventType,
        productId,
        startDate,
        endDate,
        limit = 100,
        offset = 0
      } = options;

      const where = { userId };

      if (eventType) {
        where.eventType = eventType;
      }

      if (productId) {
        where.productId = productId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [events, total] = await Promise.all([
        prisma.userEvent.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.userEvent.count({ where })
      ]);

      return {
        events,
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('Error getting user events:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos vistos recientemente por un usuario
   */
  async getRecentlyViewedProducts(userId, limit = 10) {
    try {
      const events = await prisma.userEvent.findMany({
        where: {
          userId,
          eventType: 'VIEW_PRODUCT',
          productId: { not: null }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        distinct: ['productId']
      });

      // Obtener detalles de productos
      const productIds = events.map(e => e.productId).filter(Boolean);
      
      if (productIds.length === 0) {
        return [];
      }

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

      // Ordenar según el orden de visualización
      const orderedProducts = productIds
        .map(id => products.find(p => p.id === id))
        .filter(Boolean);

      return orderedProducts;
    } catch (error) {
      console.error('Error getting recently viewed products:', error);
      throw error;
    }
  }

  /**
   * Obtiene búsquedas recientes de un usuario
   */
  async getRecentSearches(userId, limit = 10) {
    try {
      const events = await prisma.userEvent.findMany({
        where: {
          userId,
          eventType: 'SEARCH',
          searchQuery: { not: null }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        distinct: ['searchQuery']
      });

      return events.map(e => ({
        query: e.searchQuery,
        timestamp: e.createdAt
      }));
    } catch (error) {
      console.error('Error getting recent searches:', error);
      throw error;
    }
  }

  /**
   * Analiza el comportamiento de navegación de un usuario
   */
  async analyzeUserBehavior(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const events = await prisma.userEvent.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Analizar patrones
      const analysis = {
        totalEvents: events.length,
        eventsByType: {},
        productsViewed: new Set(),
        categoriesViewed: new Set(),
        searches: [],
        cartActions: {
          added: 0,
          removed: 0
        },
        wishlistActions: {
          added: 0,
          removed: 0
        },
        purchases: 0,
        averageSessionDuration: 0,
        devicePreference: {},
        timeOfDayPreference: {},
        dayOfWeekPreference: {}
      };

      events.forEach(event => {
        // Contar por tipo
        analysis.eventsByType[event.eventType] = 
          (analysis.eventsByType[event.eventType] || 0) + 1;

        // Productos vistos
        if (event.productId) {
          analysis.productsViewed.add(event.productId);
        }

        // Categorías vistas
        if (event.categoryId) {
          analysis.categoriesViewed.add(event.categoryId);
        }

        // Búsquedas
        if (event.eventType === 'SEARCH' && event.searchQuery) {
          analysis.searches.push(event.searchQuery);
        }

        // Carrito
        if (event.eventType === 'ADD_TO_CART') analysis.cartActions.added++;
        if (event.eventType === 'REMOVE_FROM_CART') analysis.cartActions.removed++;

        // Wishlist
        if (event.eventType === 'ADD_TO_WISHLIST') analysis.wishlistActions.added++;
        if (event.eventType === 'REMOVE_FROM_WISHLIST') analysis.wishlistActions.removed++;

        // Compras
        if (event.eventType === 'PURCHASE') analysis.purchases++;

        // Dispositivo
        if (event.deviceType) {
          analysis.devicePreference[event.deviceType] = 
            (analysis.devicePreference[event.deviceType] || 0) + 1;
        }

        // Hora del día
        const hour = new Date(event.createdAt).getHours();
        let timeOfDay = 'NIGHT';
        if (hour >= 6 && hour < 12) timeOfDay = 'MORNING';
        else if (hour >= 12 && hour < 18) timeOfDay = 'AFTERNOON';
        else if (hour >= 18 && hour < 22) timeOfDay = 'EVENING';
        
        analysis.timeOfDayPreference[timeOfDay] = 
          (analysis.timeOfDayPreference[timeOfDay] || 0) + 1;

        // Día de la semana
        const dayOfWeek = new Date(event.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
        analysis.dayOfWeekPreference[dayOfWeek] = 
          (analysis.dayOfWeekPreference[dayOfWeek] || 0) + 1;
      });

      // Convertir Sets a arrays
      analysis.productsViewed = Array.from(analysis.productsViewed);
      analysis.categoriesViewed = Array.from(analysis.categoriesViewed);

      // Encontrar preferencias principales
      analysis.primaryDevice = Object.keys(analysis.devicePreference)
        .reduce((a, b) => analysis.devicePreference[a] > analysis.devicePreference[b] ? a : b, null);
      
      analysis.primaryTimeOfDay = Object.keys(analysis.timeOfDayPreference)
        .reduce((a, b) => analysis.timeOfDayPreference[a] > analysis.timeOfDayPreference[b] ? a : b, null);
      
      analysis.primaryDayOfWeek = Object.keys(analysis.dayOfWeekPreference)
        .reduce((a, b) => analysis.dayOfWeekPreference[a] > analysis.dayOfWeekPreference[b] ? a : b, null);

      return analysis;
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos abandonados en el carrito
   */
  async getAbandonedCartProducts(userId) {
    try {
      // Buscar productos agregados al carrito pero no comprados
      const addedEvents = await prisma.userEvent.findMany({
        where: {
          userId,
          eventType: 'ADD_TO_CART',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const productIds = [...new Set(addedEvents.map(e => e.productId).filter(Boolean))];

      if (productIds.length === 0) {
        return [];
      }

      // Verificar cuáles no fueron comprados
      const purchasedEvents = await prisma.userEvent.findMany({
        where: {
          userId,
          eventType: 'PURCHASE',
          productId: { in: productIds }
        }
      });

      const purchasedProductIds = new Set(purchasedEvents.map(e => e.productId));
      const abandonedProductIds = productIds.filter(id => !purchasedProductIds.has(id));

      if (abandonedProductIds.length === 0) {
        return [];
      }

      // Obtener detalles de productos abandonados
      const products = await prisma.product.findMany({
        where: {
          id: { in: abandonedProductIds },
          isActive: true
        },
        include: {
          category: true,
          variants: {
            where: { isDefault: true }
          }
        }
      });

      return products;
    } catch (error) {
      console.error('Error getting abandoned cart products:', error);
      throw error;
    }
  }

  /**
   * Marca un segmento de usuario para recalcular
   */
  async markSegmentForRecalculation(userId) {
    try {
      await prisma.userSegment.upsert({
        where: { userId },
        update: { needsRecalculation: true },
        create: {
          userId,
          segments: JSON.stringify(['NEW_USER']),
          primarySegment: 'NEW_USER',
          needsRecalculation: true
        }
      });
    } catch (error) {
      console.error('Error marking segment for recalculation:', error);
      // No lanzar error, es una operación secundaria
    }
  }

  /**
   * Limpia eventos antiguos (para optimización)
   */
  async cleanOldEvents(daysToKeep = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.userEvent.deleteMany({
        where: {
          createdAt: { lt: cutoffDate }
        }
      });

      return {
        deleted: result.count,
        cutoffDate
      };
    } catch (error) {
      console.error('Error cleaning old events:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de eventos
   */
  async getEventStats(startDate, endDate) {
    try {
      const where = {};
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const events = await prisma.userEvent.findMany({
        where,
        select: {
          eventType: true,
          userId: true,
          productId: true,
          fromRecommendation: true
        }
      });

      const stats = {
        totalEvents: events.length,
        uniqueUsers: new Set(events.filter(e => e.userId).map(e => e.userId)).size,
        uniqueProducts: new Set(events.filter(e => e.productId).map(e => e.productId)).size,
        eventsByType: {},
        fromRecommendations: events.filter(e => e.fromRecommendation).length,
        recommendationImpact: 0
      };

      events.forEach(event => {
        stats.eventsByType[event.eventType] = 
          (stats.eventsByType[event.eventType] || 0) + 1;
      });

      if (stats.totalEvents > 0) {
        stats.recommendationImpact = 
          (stats.fromRecommendations / stats.totalEvents * 100).toFixed(2);
      }

      return stats;
    } catch (error) {
      console.error('Error getting event stats:', error);
      throw error;
    }
  }
}

module.exports = new TrackingService();
