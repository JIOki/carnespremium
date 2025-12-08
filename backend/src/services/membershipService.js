const { getPrismaClient } = require('../database/connection');

/**
 * ===================================================
 * MEMBERSHIP SERVICE
 * Gestión completa de membresías y planes premium
 * ===================================================
 */

class MembershipService {
  
  // ==================== PLANES DE MEMBRESÍA ====================
  
  /**
   * Obtener todos los planes de membresía
   */
  async getAllPlans({ activeOnly = true, visibleOnly = true } = {}) {
    const prisma = getPrismaClient();
    
    const where = {};
    if (activeOnly) where.isActive = true;
    if (visibleOnly) where.isVisible = true;
    
    const plans = await prisma.membershipPlan.findMany({
      where,
      include: {
        benefits: {
          where: { isActive: true }
        },
        _count: {
          select: { memberships: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });
    
    return plans.map(plan => ({
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : [],
      totalMembers: plan._count.memberships
    }));
  }
  
  /**
   * Obtener plan por ID
   */
  async getPlanById(planId) {
    const prisma = getPrismaClient();
    
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
      include: {
        benefits: {
          where: { isActive: true }
        },
        _count: {
          select: { memberships: true }
        }
      }
    });
    
    if (!plan) {
      throw new Error('Plan de membresía no encontrado');
    }
    
    return {
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : [],
      totalMembers: plan._count.memberships
    };
  }
  
  /**
   * Crear nuevo plan de membresía
   */
  async createPlan(data) {
    const prisma = getPrismaClient();
    
    const plan = await prisma.membershipPlan.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        monthlyPrice: data.monthlyPrice,
        quarterlyPrice: data.quarterlyPrice,
        annualPrice: data.annualPrice,
        discountPercent: data.discountPercent || 0,
        freeShipping: data.freeShipping || false,
        pointsMultiplier: data.pointsMultiplier || 1.0,
        earlyAccess: data.earlyAccess || false,
        exclusiveProducts: data.exclusiveProducts || false,
        maxMonthlyOrders: data.maxMonthlyOrders,
        prioritySupport: data.prioritySupport || false,
        features: data.features ? JSON.stringify(data.features) : null,
        color: data.color,
        icon: data.icon,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isVisible: data.isVisible !== undefined ? data.isVisible : true,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    });
    
    return plan;
  }
  
  /**
   * Actualizar plan de membresía
   */
  async updatePlan(planId, data) {
    const prisma = getPrismaClient();
    
    const updateData = {};
    
    if (data.displayName) updateData.displayName = data.displayName;
    if (data.description) updateData.description = data.description;
    if (data.monthlyPrice !== undefined) updateData.monthlyPrice = data.monthlyPrice;
    if (data.quarterlyPrice !== undefined) updateData.quarterlyPrice = data.quarterlyPrice;
    if (data.annualPrice !== undefined) updateData.annualPrice = data.annualPrice;
    if (data.discountPercent !== undefined) updateData.discountPercent = data.discountPercent;
    if (data.freeShipping !== undefined) updateData.freeShipping = data.freeShipping;
    if (data.pointsMultiplier !== undefined) updateData.pointsMultiplier = data.pointsMultiplier;
    if (data.earlyAccess !== undefined) updateData.earlyAccess = data.earlyAccess;
    if (data.exclusiveProducts !== undefined) updateData.exclusiveProducts = data.exclusiveProducts;
    if (data.maxMonthlyOrders !== undefined) updateData.maxMonthlyOrders = data.maxMonthlyOrders;
    if (data.prioritySupport !== undefined) updateData.prioritySupport = data.prioritySupport;
    if (data.features) updateData.features = JSON.stringify(data.features);
    if (data.color) updateData.color = data.color;
    if (data.icon) updateData.icon = data.icon;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;
    if (data.metadata) updateData.metadata = JSON.stringify(data.metadata);
    
    const plan = await prisma.membershipPlan.update({
      where: { id: planId },
      data: updateData
    });
    
    return plan;
  }
  
  /**
   * Eliminar plan de membresía
   */
  async deletePlan(planId) {
    const prisma = getPrismaClient();
    
    // Verificar que no haya membresías activas
    const activeCount = await prisma.userMembership.count({
      where: {
        planId,
        status: 'ACTIVE'
      }
    });
    
    if (activeCount > 0) {
      throw new Error('No se puede eliminar un plan con membresías activas');
    }
    
    await prisma.membershipPlan.delete({
      where: { id: planId }
    });
    
    return { message: 'Plan eliminado exitosamente' };
  }
  
  // ==================== MEMBRESÍAS DE USUARIOS ====================
  
  /**
   * Obtener membresía del usuario
   */
  async getUserMembership(userId) {
    const prisma = getPrismaClient();
    
    const membership = await prisma.userMembership.findUnique({
      where: { userId },
      include: {
        plan: {
          include: {
            benefits: {
              where: { isActive: true }
            }
          }
        },
        benefitUsages: {
          include: {
            benefit: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!membership) {
      return null;
    }
    
    // Calcular días restantes
    const now = new Date();
    const endDate = new Date(membership.endDate);
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    return {
      ...membership,
      daysRemaining,
      isExpired: daysRemaining <= 0,
      features: membership.plan.features ? JSON.parse(membership.plan.features) : []
    };
  }
  
  /**
   * Crear nueva membresía para usuario
   */
  async createMembership(userId, planId, billingCycle = 'MONTHLY') {
    const prisma = getPrismaClient();
    
    // Verificar que el usuario no tenga ya una membresía activa
    const existing = await prisma.userMembership.findUnique({
      where: { userId }
    });
    
    if (existing && existing.status === 'ACTIVE') {
      throw new Error('El usuario ya tiene una membresía activa');
    }
    
    // Obtener plan
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId }
    });
    
    if (!plan) {
      throw new Error('Plan no encontrado');
    }
    
    // Calcular fechas
    const startDate = new Date();
    let endDate = new Date();
    let price = 0;
    
    switch (billingCycle) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1);
        price = plan.monthlyPrice;
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3);
        price = plan.quarterlyPrice || plan.monthlyPrice * 3;
        break;
      case 'ANNUAL':
        endDate.setFullYear(endDate.getFullYear() + 1);
        price = plan.annualPrice || plan.monthlyPrice * 12;
        break;
      default:
        throw new Error('Ciclo de facturación inválido');
    }
    
    const renewalDate = new Date(endDate);
    const nextPaymentDate = new Date(endDate);
    
    // Crear o actualizar membresía
    let membership;
    
    if (existing) {
      membership = await prisma.userMembership.update({
        where: { userId },
        data: {
          planId,
          status: 'ACTIVE',
          startDate,
          endDate,
          renewalDate,
          nextPaymentDate,
          billingCycle,
          lastPaymentDate: startDate,
          autoRenew: true,
          ordersThisMonth: 0,
          benefitsUsed: 0
        },
        include: {
          plan: {
            include: {
              benefits: true
            }
          }
        }
      });
    } else {
      membership = await prisma.userMembership.create({
        data: {
          userId,
          planId,
          status: 'ACTIVE',
          startDate,
          endDate,
          renewalDate,
          nextPaymentDate,
          billingCycle,
          lastPaymentDate: startDate,
          autoRenew: true
        },
        include: {
          plan: {
            include: {
              benefits: true
            }
          }
        }
      });
    }
    
    return {
      ...membership,
      price
    };
  }
  
  /**
   * Actualizar membresía (cambiar plan)
   */
  async updateMembership(userId, planId) {
    const prisma = getPrismaClient();
    
    const membership = await prisma.userMembership.findUnique({
      where: { userId }
    });
    
    if (!membership) {
      throw new Error('Membresía no encontrada');
    }
    
    const updated = await prisma.userMembership.update({
      where: { userId },
      data: { planId },
      include: {
        plan: {
          include: {
            benefits: true
          }
        }
      }
    });
    
    return updated;
  }
  
  /**
   * Cancelar membresía
   */
  async cancelMembership(userId, reason = null) {
    const prisma = getPrismaClient();
    
    const membership = await prisma.userMembership.update({
      where: { userId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        autoRenew: false,
        metadata: reason ? JSON.stringify({ cancellationReason: reason }) : null
      },
      include: {
        plan: true
      }
    });
    
    return membership;
  }
  
  /**
   * Pausar membresía
   */
  async pauseMembership(userId) {
    const prisma = getPrismaClient();
    
    const membership = await prisma.userMembership.update({
      where: { userId },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
        autoRenew: false
      },
      include: {
        plan: true
      }
    });
    
    return membership;
  }
  
  /**
   * Reanudar membresía
   */
  async resumeMembership(userId) {
    const prisma = getPrismaClient();
    
    const membership = await prisma.userMembership.findUnique({
      where: { userId }
    });
    
    if (!membership || membership.status !== 'PAUSED') {
      throw new Error('Membresía no está pausada');
    }
    
    const updated = await prisma.userMembership.update({
      where: { userId },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        autoRenew: true
      },
      include: {
        plan: true
      }
    });
    
    return updated;
  }
  
  /**
   * Renovar membresía
   */
  async renewMembership(userId) {
    const prisma = getPrismaClient();
    
    const membership = await prisma.userMembership.findUnique({
      where: { userId },
      include: { plan: true }
    });
    
    if (!membership) {
      throw new Error('Membresía no encontrada');
    }
    
    // Calcular nueva fecha de fin
    const newEndDate = new Date(membership.endDate);
    
    switch (membership.billingCycle) {
      case 'MONTHLY':
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        newEndDate.setMonth(newEndDate.getMonth() + 3);
        break;
      case 'ANNUAL':
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        break;
    }
    
    const updated = await prisma.userMembership.update({
      where: { userId },
      data: {
        endDate: newEndDate,
        renewalDate: newEndDate,
        nextPaymentDate: newEndDate,
        lastPaymentDate: new Date(),
        ordersThisMonth: 0
      },
      include: {
        plan: true
      }
    });
    
    return updated;
  }
  
  /**
   * Aplicar descuento de membresía a orden
   */
  async applyMembershipDiscount(userId, orderAmount) {
    const prisma = getPrismaClient();
    
    const membership = await prisma.userMembership.findUnique({
      where: { userId },
      include: { plan: true }
    });
    
    if (!membership || membership.status !== 'ACTIVE') {
      return {
        hasDiscount: false,
        discount: 0,
        finalAmount: orderAmount
      };
    }
    
    // Verificar si ha alcanzado el límite mensual
    if (membership.plan.maxMonthlyOrders && 
        membership.ordersThisMonth >= membership.plan.maxMonthlyOrders) {
      return {
        hasDiscount: false,
        discount: 0,
        finalAmount: orderAmount,
        reason: 'Límite mensual de órdenes alcanzado'
      };
    }
    
    // Calcular descuento
    const discountPercent = membership.plan.discountPercent;
    const discount = (orderAmount * discountPercent) / 100;
    const finalAmount = orderAmount - discount;
    
    // Actualizar contador de órdenes
    await prisma.userMembership.update({
      where: { userId },
      data: {
        ordersThisMonth: { increment: 1 },
        totalSavings: { increment: discount }
      }
    });
    
    return {
      hasDiscount: true,
      discountPercent,
      discount,
      finalAmount,
      freeShipping: membership.plan.freeShipping
    };
  }
  
  // ==================== BENEFICIOS ====================
  
  /**
   * Crear beneficio para plan
   */
  async createBenefit(planId, data) {
    const prisma = getPrismaClient();
    
    const benefit = await prisma.membershipBenefit.create({
      data: {
        planId,
        type: data.type,
        name: data.name,
        description: data.description,
        value: data.value,
        productIds: data.productIds ? JSON.stringify(data.productIds) : null,
        categoryIds: data.categoryIds ? JSON.stringify(data.categoryIds) : null,
        usageLimit: data.usageLimit,
        usagePeriod: data.usagePeriod,
        isActive: data.isActive !== undefined ? data.isActive : true,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    });
    
    return benefit;
  }
  
  /**
   * Registrar uso de beneficio
   */
  async recordBenefitUsage(userId, benefitId, data = {}) {
    const prisma = getPrismaClient();
    
    const membership = await prisma.userMembership.findUnique({
      where: { userId }
    });
    
    if (!membership) {
      throw new Error('Usuario no tiene membresía activa');
    }
    
    const usage = await prisma.membershipBenefitUsage.create({
      data: {
        membershipId: membership.id,
        benefitId,
        orderId: data.orderId,
        productId: data.productId,
        value: data.value,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    });
    
    // Actualizar contador
    await prisma.userMembership.update({
      where: { userId },
      data: {
        benefitsUsed: { increment: 1 }
      }
    });
    
    return usage;
  }
  
  // ==================== ESTADÍSTICAS ====================
  
  /**
   * Obtener estadísticas de membresías
   */
  async getMembershipStats() {
    const prisma = getPrismaClient();
    
    const totalMembers = await prisma.userMembership.count({
      where: { status: 'ACTIVE' }
    });
    
    const membersByPlan = await prisma.userMembership.groupBy({
      by: ['planId', 'status'],
      _count: true
    });
    
    const totalRevenue = await prisma.userMembership.aggregate({
      where: { status: 'ACTIVE' },
      _sum: {
        totalSavings: true
      }
    });
    
    const upcomingRenewals = await prisma.userMembership.count({
      where: {
        status: 'ACTIVE',
        autoRenew: true,
        renewalDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Próximos 7 días
        }
      }
    });
    
    const expiringMemberships = await prisma.userMembership.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        autoRenew: false
      }
    });
    
    return {
      totalMembers,
      membersByPlan,
      totalRevenue: totalRevenue._sum.totalSavings || 0,
      upcomingRenewals,
      expiringMemberships
    };
  }
  
  /**
   * Obtener todas las membresías (admin)
   */
  async getAllMemberships({ status, planId, page = 1, limit = 50 } = {}) {
    const prisma = getPrismaClient();
    
    const where = {};
    if (status) where.status = status;
    if (planId) where.planId = planId;
    
    const skip = (page - 1) * limit;
    
    const [memberships, total] = await Promise.all([
      prisma.userMembership.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          plan: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.userMembership.count({ where })
    ]);
    
    return {
      memberships,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new MembershipService();
