const express = require('express');
const router = express.Router();
const membershipService = require('../services/membershipService');
const subscriptionService = require('../services/subscriptionService');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

/**
 * ===================================================
 * RUTAS DE MEMBRESÍAS Y SUSCRIPCIONES
 * ===================================================
 */

// ==================== PLANES DE MEMBRESÍA (PÚBLICAS) ====================

/**
 * GET /api/subscriptions/membership-plans
 * Obtener todos los planes de membresía disponibles
 */
router.get('/membership-plans', async (req, res) => {
  try {
    const plans = await membershipService.getAllPlans({
      activeOnly: true,
      visibleOnly: true
    });
    res.json(plans);
  } catch (error) {
    console.error('Error getting membership plans:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/subscriptions/membership-plans/:id
 * Obtener detalles de un plan específico
 */
router.get('/membership-plans/:id', async (req, res) => {
  try {
    const plan = await membershipService.getPlanById(req.params.id);
    res.json(plan);
  } catch (error) {
    console.error('Error getting membership plan:', error);
    res.status(404).json({ error: error.message });
  }
});

// ==================== MEMBRESÍAS DE USUARIOS ====================

/**
 * GET /api/subscriptions/my-membership
 * Obtener membresía del usuario autenticado
 */
router.get('/my-membership', authenticate, async (req, res) => {
  try {
    const membership = await membershipService.getUserMembership(req.user.userId);
    
    if (!membership) {
      return res.json({ hasMembership: false });
    }
    
    res.json({ hasMembership: true, membership });
  } catch (error) {
    console.error('Error getting user membership:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/membership/subscribe
 * Suscribirse a un plan de membresía
 */
router.post('/membership/subscribe', authenticate, async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;
    
    if (!planId || !billingCycle) {
      return res.status(400).json({ 
        error: 'Plan ID y ciclo de facturación requeridos' 
      });
    }
    
    const membership = await membershipService.createMembership(
      req.user.userId,
      planId,
      billingCycle
    );
    
    res.status(201).json(membership);
  } catch (error) {
    console.error('Error creating membership:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/subscriptions/membership/upgrade
 * Actualizar plan de membresía
 */
router.put('/membership/upgrade', authenticate, async (req, res) => {
  try {
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({ error: 'Plan ID requerido' });
    }
    
    const membership = await membershipService.updateMembership(
      req.user.userId,
      planId
    );
    
    res.json(membership);
  } catch (error) {
    console.error('Error upgrading membership:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/membership/cancel
 * Cancelar membresía
 */
router.post('/membership/cancel', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const membership = await membershipService.cancelMembership(
      req.user.userId,
      reason
    );
    
    res.json(membership);
  } catch (error) {
    console.error('Error cancelling membership:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/membership/pause
 * Pausar membresía
 */
router.post('/membership/pause', authenticate, async (req, res) => {
  try {
    const membership = await membershipService.pauseMembership(req.user.userId);
    res.json(membership);
  } catch (error) {
    console.error('Error pausing membership:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/membership/resume
 * Reanudar membresía
 */
router.post('/membership/resume', authenticate, async (req, res) => {
  try {
    const membership = await membershipService.resumeMembership(req.user.userId);
    res.json(membership);
  } catch (error) {
    console.error('Error resuming membership:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/membership/apply-discount
 * Aplicar descuento de membresía (usado en checkout)
 */
router.post('/membership/apply-discount', authenticate, async (req, res) => {
  try {
    const { orderAmount } = req.body;
    
    if (!orderAmount) {
      return res.status(400).json({ error: 'Monto de orden requerido' });
    }
    
    const discount = await membershipService.applyMembershipDiscount(
      req.user.userId,
      orderAmount
    );
    
    res.json(discount);
  } catch (error) {
    console.error('Error applying membership discount:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PLANES DE SUSCRIPCIÓN (PÚBLICAS) ====================

/**
 * GET /api/subscriptions/subscription-plans
 * Obtener todos los planes de suscripción disponibles
 */
router.get('/subscription-plans', async (req, res) => {
  try {
    const plans = await subscriptionService.getAllPlans({
      activeOnly: true,
      visibleOnly: true
    });
    res.json(plans);
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/subscriptions/plans
 * Alias de subscription-plans - Obtener planes de suscripción (compatible con tests)
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await subscriptionService.getAllPlans({
      activeOnly: true,
      visibleOnly: true
    });
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/subscriptions/subscription-plans/:id
 * Obtener detalles de un plan de suscripción
 */
router.get('/subscription-plans/:id', async (req, res) => {
  try {
    const plan = await subscriptionService.getPlanById(req.params.id);
    res.json(plan);
  } catch (error) {
    console.error('Error getting subscription plan:', error);
    res.status(404).json({ error: error.message });
  }
});

// ==================== SUSCRIPCIONES DE USUARIOS ====================

/**
 * GET /api/subscriptions/my-subscriptions
 * Obtener suscripciones del usuario autenticado
 */
router.get('/my-subscriptions', authenticate, async (req, res) => {
  try {
    const subscriptions = await subscriptionService.getUserSubscriptions(req.user.userId);
    res.json(subscriptions);
  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/subscribe
 * Crear nueva suscripción
 */
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const subscription = await subscriptionService.createSubscription(
      req.user.userId,
      req.body
    );
    
    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/subscriptions/:id
 * Actualizar suscripción
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const subscription = await subscriptionService.updateSubscription(
      req.params.id,
      req.body
    );
    
    res.json(subscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/:id/cancel
 * Cancelar suscripción
 */
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const subscription = await subscriptionService.cancelSubscription(
      req.params.id,
      reason
    );
    
    res.json(subscription);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/:id/pause
 * Pausar suscripción
 */
router.post('/:id/pause', authenticate, async (req, res) => {
  try {
    const { pauseUntil } = req.body;
    
    const subscription = await subscriptionService.pauseSubscription(
      req.params.id,
      pauseUntil
    );
    
    res.json(subscription);
  } catch (error) {
    console.error('Error pausing subscription:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/:id/resume
 * Reanudar suscripción
 */
router.post('/:id/resume', authenticate, async (req, res) => {
  try {
    const subscription = await subscriptionService.resumeSubscription(
      req.params.id
    );
    
    res.json(subscription);
  } catch (error) {
    console.error('Error resuming subscription:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==================== ENTREGAS ====================

/**
 * GET /api/subscriptions/:id/deliveries
 * Obtener entregas de una suscripción
 */
router.get('/:id/deliveries', authenticate, async (req, res) => {
  try {
    const { status, limit } = req.query;
    
    const deliveries = await subscriptionService.getSubscriptionDeliveries(
      req.params.id,
      { status, limit: limit ? parseInt(limit) : 20 }
    );
    
    res.json(deliveries);
  } catch (error) {
    console.error('Error getting deliveries:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/deliveries/:id/skip
 * Saltar una entrega
 */
router.post('/deliveries/:id/skip', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const delivery = await subscriptionService.skipDelivery(
      req.params.id,
      req.user.userId,
      reason
    );
    
    res.json(delivery);
  } catch (error) {
    console.error('Error skipping delivery:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==================== ADMIN - GESTIÓN DE PLANES ====================

/**
 * POST /api/subscriptions/admin/membership-plans
 * Crear plan de membresía (admin)
 */
router.post('/admin/membership-plans', requireAdmin, async (req, res) => {
  try {
    const plan = await membershipService.createPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating membership plan:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/subscriptions/admin/membership-plans/:id
 * Actualizar plan de membresía (admin)
 */
router.put('/admin/membership-plans/:id', requireAdmin, async (req, res) => {
  try {
    const plan = await membershipService.updatePlan(req.params.id, req.body);
    res.json(plan);
  } catch (error) {
    console.error('Error updating membership plan:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/subscriptions/admin/membership-plans/:id
 * Eliminar plan de membresía (admin)
 */
router.delete('/admin/membership-plans/:id', requireAdmin, async (req, res) => {
  try {
    const result = await membershipService.deletePlan(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting membership plan:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/admin/subscription-plans
 * Crear plan de suscripción (admin)
 */
router.post('/admin/subscription-plans', requireAdmin, async (req, res) => {
  try {
    const plan = await subscriptionService.createPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/subscriptions/admin/subscription-plans/:id
 * Actualizar plan de suscripción (admin)
 */
router.put('/admin/subscription-plans/:id', requireAdmin, async (req, res) => {
  try {
    const plan = await subscriptionService.updatePlan(req.params.id, req.body);
    res.json(plan);
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/subscriptions/admin/subscription-plans/:id
 * Eliminar plan de suscripción (admin)
 */
router.delete('/admin/subscription-plans/:id', requireAdmin, async (req, res) => {
  try {
    const result = await subscriptionService.deletePlan(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/subscriptions/admin/memberships
 * Obtener todas las membresías (admin)
 */
router.get('/admin/memberships', requireAdmin, async (req, res) => {
  try {
    const { status, planId, page, limit } = req.query;
    
    const result = await membershipService.getAllMemberships({
      status,
      planId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error getting memberships:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/subscriptions/admin/subscriptions
 * Obtener todas las suscripciones (admin)
 */
router.get('/admin/subscriptions', requireAdmin, async (req, res) => {
  try {
    const { status, planId, page, limit } = req.query;
    
    const result = await subscriptionService.getAllSubscriptions({
      status,
      planId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/subscriptions/admin/stats
 * Obtener estadísticas (admin)
 */
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [membershipStats, subscriptionStats] = await Promise.all([
      membershipService.getMembershipStats(),
      subscriptionService.getSubscriptionStats()
    ]);
    
    res.json({
      memberships: membershipStats,
      subscriptions: subscriptionStats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/admin/deliveries/:id/complete
 * Marcar entrega como completada (admin)
 */
router.post('/admin/deliveries/:id/complete', requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID requerido' });
    }
    
    const delivery = await subscriptionService.completeDelivery(
      req.params.id,
      orderId
    );
    
    res.json(delivery);
  } catch (error) {
    console.error('Error completing delivery:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/admin/benefits
 * Crear beneficio para plan de membresía (admin)
 */
router.post('/admin/benefits', requireAdmin, async (req, res) => {
  try {
    const { planId, ...benefitData } = req.body;
    
    if (!planId) {
      return res.status(400).json({ error: 'Plan ID requerido' });
    }
    
    const benefit = await membershipService.createBenefit(planId, benefitData);
    res.status(201).json(benefit);
  } catch (error) {
    console.error('Error creating benefit:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
