const express = require('express');
const Joi = require('joi');
const { getPrismaClient } = require('../database/connection');
const { asyncHandler, CommonErrors } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ==================== ESQUEMAS DE VALIDACIÓN ====================

const subscribeMembershipSchema = Joi.object({
  planId: Joi.string().required(),
  billingCycle: Joi.string().valid('MONTHLY', 'QUARTERLY', 'ANNUAL').required(),
  paymentMethodId: Joi.string().optional()
});

// ==================== RUTAS PÚBLICAS ====================

/**
 * GET /api/memberships/plans
 * Obtener todos los planes de membresía disponibles
 */
router.get('/plans', asyncHandler(async (req, res) => {
  const prisma = getPrismaClient();

  const plans = await prisma.membershipPlan.findMany({
    where: { isActive: true, isVisible: true },
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      monthlyPrice: true,
      quarterlyPrice: true,
      annualPrice: true,
      discountPercent: true,
      freeShipping: true,
      pointsMultiplier: true,
      earlyAccess: true,
      exclusiveProducts: true,
      maxMonthlyOrders: true,
      prioritySupport: true,
      features: true,
      color: true,
      icon: true,
      sortOrder: true,
      metadata: true
    },
    orderBy: [
      { sortOrder: 'asc' },
      { monthlyPrice: 'asc' }
    ]
  });

  // Parsear JSON strings a objetos
  const processedPlans = plans.map(plan => ({
    ...plan,
    features: plan.features ? JSON.parse(plan.features) : [],
    metadata: plan.metadata ? JSON.parse(plan.metadata) : {}
  }));

  res.json({
    success: true,
    data: processedPlans
  });
}));

/**
 * GET /api/memberships/plans/:planId
 * Obtener detalles de un plan específico
 */
router.get('/plans/:planId', asyncHandler(async (req, res) => {
  const { planId } = req.params;
  const prisma = getPrismaClient();

  const plan = await prisma.membershipPlan.findUnique({
    where: { 
      id: planId,
      isActive: true 
    },
    include: {
      benefits: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          value: true,
          maxUsage: true
        }
      }
    }
  });

  if (!plan) {
    throw CommonErrors.NotFound('Plan de membresía');
  }

  // Parsear JSON strings
  const processedPlan = {
    ...plan,
    features: plan.features ? JSON.parse(plan.features) : [],
    benefits: plan.benefits ? JSON.parse(plan.benefits) : [],
    metadata: plan.metadata ? JSON.parse(plan.metadata) : {}
  };

  res.json({
    success: true,
    data: processedPlan
  });
}));

// ==================== RUTAS PROTEGIDAS ====================

/**
 * GET /api/memberships/my-membership
 * Obtener membresía activa del usuario autenticado
 */
router.get('/my-membership', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const prisma = getPrismaClient();

  const membership = await prisma.userMembership.findFirst({
    where: {
      userId,
      status: 'ACTIVE'
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          monthlyPrice: true,
          quarterlyPrice: true,
          annualPrice: true,
          discountPercent: true,
          freeShipping: true,
          pointsMultiplier: true,
          earlyAccess: true,
          exclusiveProducts: true,
          features: true,
          color: true,
          icon: true
        }
      }
    },
    orderBy: {
      startDate: 'desc'
    }
  });

  if (!membership) {
    return res.json({
      success: true,
      data: null,
      message: 'No tienes una membresía activa'
    });
  }

  // Parsear JSON strings
  const processedMembership = {
    ...membership,
    plan: {
      ...membership.plan,
      features: membership.plan.features ? JSON.parse(membership.plan.features) : [],
      benefits: membership.plan.benefits ? JSON.parse(membership.plan.benefits) : []
    }
  };

  res.json({
    success: true,
    data: processedMembership
  });
}));

/**
 * POST /api/memberships/subscribe
 * Suscribirse a un plan de membresía
 */
router.post('/subscribe', authMiddleware, asyncHandler(async (req, res) => {
  const { error, value } = subscribeMembershipSchema.validate(req.body);
  if (error) {
    throw CommonErrors.ValidationError(error.details[0].message);
  }

  const { planId, billingCycle, paymentMethodId } = value;
  const userId = req.userId;
  const prisma = getPrismaClient();

  // Verificar que el plan existe y está activo
  const plan = await prisma.membershipPlan.findUnique({
    where: { 
      id: planId,
      isActive: true 
    }
  });

  if (!plan) {
    throw CommonErrors.NotFound('Plan de membresía');
  }

  // Verificar si el usuario ya tiene una membresía activa
  const existingMembership = await prisma.userMembership.findFirst({
    where: {
      userId,
      status: 'ACTIVE'
    }
  });

  if (existingMembership) {
    throw CommonErrors.Conflict('Ya tienes una membresía activa. Cancélala antes de suscribirte a otra.');
  }

  // Calcular fechas según el ciclo de facturación
  const startDate = new Date();
  let endDate = new Date();
  
  switch (billingCycle) {
    case 'MONTHLY':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'QUARTERLY':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case 'ANNUAL':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
  }

  // Crear la suscripción (en un caso real, aquí procesar el pago)
  const membership = await prisma.userMembership.create({
    data: {
      userId,
      planId,
      status: 'ACTIVE',
      startDate,
      endDate,
      billingCycle,
      paymentMethod: paymentMethodId || 'card',
      autoRenew: true
    },
    include: {
      plan: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Membresía activada exitosamente',
    data: membership
  });
}));

/**
 * POST /api/memberships/cancel
 * Cancelar membresía activa
 */
router.post('/cancel', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const prisma = getPrismaClient();

  const membership = await prisma.userMembership.findFirst({
    where: {
      userId,
      status: 'ACTIVE'
    }
  });

  if (!membership) {
    throw CommonErrors.NotFound('Membresía activa');
  }

  // Actualizar estado a cancelado
  const updatedMembership = await prisma.userMembership.update({
    where: { id: membership.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      autoRenew: false
    }
  });

  res.json({
    success: true,
    message: 'Membresía cancelada exitosamente',
    data: updatedMembership
  });
}));

/**
 * GET /api/memberships/benefits
 * Obtener beneficios disponibles para el usuario según su membresía
 */
router.get('/benefits', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const prisma = getPrismaClient();

  // Obtener membresía activa
  const membership = await prisma.userMembership.findFirst({
    where: {
      userId,
      status: 'ACTIVE'
    },
    include: {
      plan: {
        include: {
          benefits: {
            where: { isActive: true }
          }
        }
      }
    }
  });

  if (!membership) {
    return res.json({
      success: true,
      data: [],
      message: 'No tienes una membresía activa'
    });
  }

  // Obtener uso de beneficios
  const benefitUsage = await prisma.membershipBenefitUsage.findMany({
    where: {
      userMembershipId: membership.id
    }
  });

  // Mapear beneficios con su uso
  const benefits = membership.plan.benefits.map(benefit => {
    const usage = benefitUsage.find(u => u.benefitId === benefit.id);
    return {
      ...benefit,
      usageCount: usage?.usageCount || 0,
      maxUsage: benefit.maxUsage,
      remaining: benefit.maxUsage ? benefit.maxUsage - (usage?.usageCount || 0) : null
    };
  });

  res.json({
    success: true,
    data: benefits
  });
}));

module.exports = router;
