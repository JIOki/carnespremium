const { getPrismaClient } = require('../database/connection');

/**
 * ===================================================
 * SUBSCRIPTION SERVICE
 * Gestión de suscripciones y cajas mensuales
 * ===================================================
 */

class SubscriptionService {
  
  // ==================== PLANES DE SUSCRIPCIÓN ====================
  
  /**
   * Obtener todos los planes de suscripción
   */
  async getAllPlans({ activeOnly = true, visibleOnly = true } = {}) {
    const prisma = getPrismaClient();
    
    const where = {};
    if (activeOnly) where.isActive = true;
    if (visibleOnly) where.isVisible = true;
    
    const plans = await prisma.subscriptionPlan.findMany({
      where,
      include: {
        _count: {
          select: { subscriptions: true }
        }
      },
      orderBy: { price: 'asc' }
    });
    
    return plans.map(plan => ({
      ...plan,
      includedProducts: plan.includedProducts ? JSON.parse(plan.includedProducts) : [],
      customizationOptions: plan.customizationOptions ? JSON.parse(plan.customizationOptions) : null,
      features: plan.features ? JSON.parse(plan.features) : [],
      tags: plan.tags ? JSON.parse(plan.tags) : [],
      totalSubscribers: plan._count.subscriptions,
      availableSlots: plan.stockLimit ? plan.stockLimit - plan.currentSubscribers : null
    }));
  }
  
  /**
   * Obtener plan por ID
   */
  async getPlanById(planId) {
    const prisma = getPrismaClient();
    
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    });
    
    if (!plan) {
      throw new Error('Plan de suscripción no encontrado');
    }
    
    return {
      ...plan,
      includedProducts: plan.includedProducts ? JSON.parse(plan.includedProducts) : [],
      customizationOptions: plan.customizationOptions ? JSON.parse(plan.customizationOptions) : null,
      features: plan.features ? JSON.parse(plan.features) : [],
      tags: plan.tags ? JSON.parse(plan.tags) : [],
      totalSubscribers: plan._count.subscriptions
    };
  }
  
  /**
   * Crear nuevo plan de suscripción
   */
  async createPlan(data) {
    const prisma = getPrismaClient();
    
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        boxType: data.boxType,
        boxSize: data.boxSize,
        estimatedValue: data.estimatedValue,
        price: data.price,
        comparePrice: data.comparePrice,
        includedProducts: data.includedProducts ? JSON.stringify(data.includedProducts) : null,
        productCount: data.productCount || 0,
        totalWeight: data.totalWeight,
        allowCustomization: data.allowCustomization || false,
        customizationOptions: data.customizationOptions ? JSON.stringify(data.customizationOptions) : null,
        deliveryFrequency: data.deliveryFrequency,
        minSubscriptionPeriod: data.minSubscriptionPeriod,
        membershipRequired: data.membershipRequired,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isVisible: data.isVisible !== undefined ? data.isVisible : true,
        stockLimit: data.stockLimit,
        imageUrl: data.imageUrl,
        features: data.features ? JSON.stringify(data.features) : null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    });
    
    return plan;
  }
  
  /**
   * Actualizar plan de suscripción
   */
  async updatePlan(planId, data) {
    const prisma = getPrismaClient();
    
    const updateData = {};
    
    if (data.name) updateData.name = data.name;
    if (data.slug) updateData.slug = data.slug;
    if (data.description) updateData.description = data.description;
    if (data.boxType) updateData.boxType = data.boxType;
    if (data.boxSize) updateData.boxSize = data.boxSize;
    if (data.estimatedValue !== undefined) updateData.estimatedValue = data.estimatedValue;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.comparePrice !== undefined) updateData.comparePrice = data.comparePrice;
    if (data.includedProducts) updateData.includedProducts = JSON.stringify(data.includedProducts);
    if (data.productCount !== undefined) updateData.productCount = data.productCount;
    if (data.totalWeight !== undefined) updateData.totalWeight = data.totalWeight;
    if (data.allowCustomization !== undefined) updateData.allowCustomization = data.allowCustomization;
    if (data.customizationOptions) updateData.customizationOptions = JSON.stringify(data.customizationOptions);
    if (data.deliveryFrequency) updateData.deliveryFrequency = data.deliveryFrequency;
    if (data.minSubscriptionPeriod !== undefined) updateData.minSubscriptionPeriod = data.minSubscriptionPeriod;
    if (data.membershipRequired !== undefined) updateData.membershipRequired = data.membershipRequired;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;
    if (data.stockLimit !== undefined) updateData.stockLimit = data.stockLimit;
    if (data.imageUrl) updateData.imageUrl = data.imageUrl;
    if (data.features) updateData.features = JSON.stringify(data.features);
    if (data.tags) updateData.tags = JSON.stringify(data.tags);
    if (data.metadata) updateData.metadata = JSON.stringify(data.metadata);
    
    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: updateData
    });
    
    return plan;
  }
  
  /**
   * Eliminar plan de suscripción
   */
  async deletePlan(planId) {
    const prisma = getPrismaClient();
    
    // Verificar que no haya suscripciones activas
    const activeCount = await prisma.subscription.count({
      where: {
        planId,
        status: 'ACTIVE'
      }
    });
    
    if (activeCount > 0) {
      throw new Error('No se puede eliminar un plan con suscripciones activas');
    }
    
    await prisma.subscriptionPlan.delete({
      where: { id: planId }
    });
    
    return { message: 'Plan eliminado exitosamente' };
  }
  
  // ==================== SUSCRIPCIONES DE USUARIOS ====================
  
  /**
   * Obtener suscripciones del usuario
   */
  async getUserSubscriptions(userId) {
    const prisma = getPrismaClient();
    
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
        deliveries: {
          orderBy: { scheduledDate: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return subscriptions.map(sub => ({
      ...sub,
      preferences: sub.preferences ? JSON.parse(sub.preferences) : null,
      excludedProducts: sub.excludedProducts ? JSON.parse(sub.excludedProducts) : [],
      shippingAddress: sub.shippingAddress ? JSON.parse(sub.shippingAddress) : null,
      deliveries: sub.deliveries.map(d => ({
        ...d,
        products: d.products ? JSON.parse(d.products) : []
      }))
    }));
  }
  
  /**
   * Crear nueva suscripción
   */
  async createSubscription(userId, data) {
    const prisma = getPrismaClient();
    
    // Verificar plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: data.planId }
    });
    
    if (!plan || !plan.isActive) {
      throw new Error('Plan no disponible');
    }
    
    // Verificar límite de stock
    if (plan.stockLimit && plan.currentSubscribers >= plan.stockLimit) {
      throw new Error('Plan agotado');
    }
    
    // Verificar requisito de membresía
    if (plan.membershipRequired) {
      const membership = await prisma.userMembership.findUnique({
        where: { userId }
      });
      
      if (!membership || membership.status !== 'ACTIVE' || membership.planId !== plan.membershipRequired) {
        throw new Error('Membresía requerida no activa');
      }
    }
    
    // Calcular próxima fecha de entrega
    const startDate = new Date();
    const nextDeliveryDate = this._calculateNextDelivery(startDate, data.frequency || plan.deliveryFrequency);
    
    // Crear suscripción
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: data.planId,
        status: 'ACTIVE',
        startDate,
        nextDeliveryDate,
        frequency: data.frequency || plan.deliveryFrequency,
        deliveryDay: data.deliveryDay,
        addressId: data.addressId,
        shippingAddress: data.shippingAddress ? JSON.stringify(data.shippingAddress) : null,
        preferences: data.preferences ? JSON.stringify(data.preferences) : null,
        excludedProducts: data.excludedProducts ? JSON.stringify(data.excludedProducts) : null,
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        autoRenew: data.autoRenew !== undefined ? data.autoRenew : true
      },
      include: {
        plan: true
      }
    });
    
    // Actualizar contador de suscriptores
    await prisma.subscriptionPlan.update({
      where: { id: data.planId },
      data: {
        currentSubscribers: { increment: 1 }
      }
    });
    
    // Programar primera entrega
    await this.scheduleDelivery(subscription.id, nextDeliveryDate);
    
    return subscription;
  }
  
  /**
   * Actualizar suscripción
   */
  async updateSubscription(subscriptionId, data) {
    const prisma = getPrismaClient();
    
    const updateData = {};
    
    if (data.frequency) {
      updateData.frequency = data.frequency;
      // Recalcular próxima entrega
      const nextDeliveryDate = this._calculateNextDelivery(new Date(), data.frequency);
      updateData.nextDeliveryDate = nextDeliveryDate;
    }
    
    if (data.deliveryDay) updateData.deliveryDay = data.deliveryDay;
    if (data.addressId) updateData.addressId = data.addressId;
    if (data.shippingAddress) updateData.shippingAddress = JSON.stringify(data.shippingAddress);
    if (data.preferences) updateData.preferences = JSON.stringify(data.preferences);
    if (data.excludedProducts) updateData.excludedProducts = JSON.stringify(data.excludedProducts);
    if (data.notes) updateData.notes = data.notes;
    if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
    if (data.autoRenew !== undefined) updateData.autoRenew = data.autoRenew;
    
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        plan: true
      }
    });
    
    return subscription;
  }
  
  /**
   * Cancelar suscripción
   */
  async cancelSubscription(subscriptionId, reason = null) {
    const prisma = getPrismaClient();
    
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });
    
    if (!subscription) {
      throw new Error('Suscripción no encontrada');
    }
    
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        autoRenew: false,
        metadata: reason ? JSON.stringify({ cancellationReason: reason }) : subscription.metadata
      },
      include: {
        plan: true
      }
    });
    
    // Actualizar contador de suscriptores
    await prisma.subscriptionPlan.update({
      where: { id: subscription.planId },
      data: {
        currentSubscribers: { decrement: 1 }
      }
    });
    
    // Cancelar entregas pendientes
    await prisma.subscriptionDelivery.updateMany({
      where: {
        subscriptionId,
        status: 'SCHEDULED'
      },
      data: {
        status: 'SKIPPED',
        skipReason: 'Suscripción cancelada'
      }
    });
    
    return updated;
  }
  
  /**
   * Pausar suscripción
   */
  async pauseSubscription(subscriptionId, pauseUntil = null) {
    const prisma = getPrismaClient();
    
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
        pausedUntil: pauseUntil ? new Date(pauseUntil) : null,
        autoRenew: false
      },
      include: {
        plan: true
      }
    });
    
    // Pausar entregas pendientes hasta la fecha de reactivación
    const pauseDate = pauseUntil ? new Date(pauseUntil) : null;
    
    if (pauseDate) {
      await prisma.subscriptionDelivery.updateMany({
        where: {
          subscriptionId,
          status: 'SCHEDULED',
          scheduledDate: {
            lte: pauseDate
          }
        },
        data: {
          status: 'SKIPPED',
          skipReason: 'Suscripción pausada'
        }
      });
    }
    
    return subscription;
  }
  
  /**
   * Reanudar suscripción
   */
  async resumeSubscription(subscriptionId) {
    const prisma = getPrismaClient();
    
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });
    
    if (!subscription || subscription.status !== 'PAUSED') {
      throw new Error('Suscripción no está pausada');
    }
    
    // Calcular próxima entrega
    const nextDeliveryDate = this._calculateNextDelivery(new Date(), subscription.frequency);
    
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        pausedUntil: null,
        autoRenew: true,
        nextDeliveryDate
      },
      include: {
        plan: true
      }
    });
    
    // Programar próxima entrega
    await this.scheduleDelivery(subscriptionId, nextDeliveryDate);
    
    return updated;
  }
  
  // ==================== ENTREGAS ====================
  
  /**
   * Programar entrega
   */
  async scheduleDelivery(subscriptionId, scheduledDate) {
    const prisma = getPrismaClient();
    
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });
    
    if (!subscription) {
      throw new Error('Suscripción no encontrada');
    }
    
    // Obtener productos incluidos
    const products = subscription.plan.includedProducts 
      ? JSON.parse(subscription.plan.includedProducts) 
      : [];
    
    const delivery = await prisma.subscriptionDelivery.create({
      data: {
        subscriptionId,
        scheduledDate: new Date(scheduledDate),
        status: 'SCHEDULED',
        products: JSON.stringify(products),
        totalValue: subscription.plan.estimatedValue
      }
    });
    
    // Actualizar contador
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        totalDeliveries: { increment: 1 }
      }
    });
    
    return delivery;
  }
  
  /**
   * Saltar entrega
   */
  async skipDelivery(deliveryId, userId, reason = null) {
    const prisma = getPrismaClient();
    
    const delivery = await prisma.subscriptionDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        subscription: true
      }
    });
    
    if (!delivery) {
      throw new Error('Entrega no encontrada');
    }
    
    if (delivery.subscription.userId !== userId) {
      throw new Error('No autorizado');
    }
    
    if (delivery.status !== 'SCHEDULED') {
      throw new Error('Solo se pueden saltar entregas programadas');
    }
    
    const updated = await prisma.subscriptionDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'SKIPPED',
        skippedBy: userId,
        skippedAt: new Date(),
        skipReason: reason
      }
    });
    
    // Actualizar contador
    await prisma.subscription.update({
      where: { id: delivery.subscriptionId },
      data: {
        skippedDeliveries: { increment: 1 }
      }
    });
    
    // Programar siguiente entrega
    const nextDate = this._calculateNextDelivery(delivery.scheduledDate, delivery.subscription.frequency);
    await this.scheduleDelivery(delivery.subscriptionId, nextDate);
    
    // Actualizar nextDeliveryDate en la suscripción
    await prisma.subscription.update({
      where: { id: delivery.subscriptionId },
      data: {
        nextDeliveryDate: nextDate
      }
    });
    
    return updated;
  }
  
  /**
   * Marcar entrega como completada
   */
  async completeDelivery(deliveryId, orderId) {
    const prisma = getPrismaClient();
    
    const delivery = await prisma.subscriptionDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'DELIVERED',
        orderId,
        deliveredDate: new Date()
      },
      include: {
        subscription: true
      }
    });
    
    // Actualizar contador
    await prisma.subscription.update({
      where: { id: delivery.subscriptionId },
      data: {
        completedDeliveries: { increment: 1 },
        totalSpent: { increment: delivery.totalValue }
      }
    });
    
    // Programar siguiente entrega
    const nextDate = this._calculateNextDelivery(new Date(), delivery.subscription.frequency);
    await this.scheduleDelivery(delivery.subscriptionId, nextDate);
    
    // Actualizar nextDeliveryDate
    await prisma.subscription.update({
      where: { id: delivery.subscriptionId },
      data: {
        nextDeliveryDate: nextDate
      }
    });
    
    return delivery;
  }
  
  /**
   * Obtener entregas de suscripción
   */
  async getSubscriptionDeliveries(subscriptionId, { status, limit = 20 } = {}) {
    const prisma = getPrismaClient();
    
    const where = { subscriptionId };
    if (status) where.status = status;
    
    const deliveries = await prisma.subscriptionDelivery.findMany({
      where,
      orderBy: { scheduledDate: 'desc' },
      take: limit
    });
    
    return deliveries.map(d => ({
      ...d,
      products: d.products ? JSON.parse(d.products) : []
    }));
  }
  
  // ==================== ESTADÍSTICAS ====================
  
  /**
   * Obtener estadísticas de suscripciones
   */
  async getSubscriptionStats() {
    const prisma = getPrismaClient();
    
    const totalActive = await prisma.subscription.count({
      where: { status: 'ACTIVE' }
    });
    
    const totalPaused = await prisma.subscription.count({
      where: { status: 'PAUSED' }
    });
    
    const totalCancelled = await prisma.subscription.count({
      where: { status: 'CANCELLED' }
    });
    
    const subscriptionsByPlan = await prisma.subscription.groupBy({
      by: ['planId', 'status'],
      _count: true
    });
    
    const monthlyRevenue = await prisma.subscription.aggregate({
      where: { 
        status: 'ACTIVE',
        autoRenew: true
      },
      _sum: {
        totalSpent: true
      }
    });
    
    const upcomingDeliveries = await prisma.subscriptionDelivery.count({
      where: {
        status: 'SCHEDULED',
        scheduledDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Próximos 7 días
        }
      }
    });
    
    const averageSubscriptionValue = await prisma.subscription.aggregate({
      where: { status: 'ACTIVE' },
      _avg: {
        totalSpent: true
      }
    });
    
    return {
      totalActive,
      totalPaused,
      totalCancelled,
      subscriptionsByPlan,
      monthlyRevenue: monthlyRevenue._sum.totalSpent || 0,
      upcomingDeliveries,
      averageSubscriptionValue: averageSubscriptionValue._avg.totalSpent || 0,
      churnRate: totalCancelled > 0 ? (totalCancelled / (totalActive + totalCancelled)) * 100 : 0
    };
  }
  
  /**
   * Obtener todas las suscripciones (admin)
   */
  async getAllSubscriptions({ status, planId, page = 1, limit = 50 } = {}) {
    const prisma = getPrismaClient();
    
    const where = {};
    if (status) where.status = status;
    if (planId) where.planId = planId;
    
    const skip = (page - 1) * limit;
    
    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          plan: true,
          _count: {
            select: { deliveries: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.subscription.count({ where })
    ]);
    
    return {
      subscriptions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  // ==================== HELPERS ====================
  
  /**
   * Calcular próxima fecha de entrega
   */
  _calculateNextDelivery(fromDate, frequency) {
    const nextDate = new Date(fromDate);
    
    switch (frequency) {
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'BIWEEKLY':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate;
  }
}

module.exports = new SubscriptionService();
