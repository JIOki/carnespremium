const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');
const trackingService = require('../services/trackingService');
const segmentationService = require('../services/segmentationService');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

// ==================== TRACKING DE EVENTOS ====================

/**
 * @route   POST /api/recommendations/track
 * @desc    Registra un evento de usuario
 * @access  Public (permite anónimos con sessionId)
 */
router.post('/track', async (req, res) => {
  try {
    const event = await trackingService.trackEvent(req.body);
    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar evento',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/recommendations/track/batch
 * @desc    Registra múltiples eventos en batch
 * @access  Public
 */
router.post('/track/batch', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de eventos'
      });
    }

    const result = await trackingService.trackEventsBatch(events);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error tracking events batch:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar eventos',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/user/events
 * @desc    Obtiene eventos del usuario autenticado
 * @access  Private
 */
router.get('/user/events', authMiddleware, async (req, res) => {
  try {
    const { eventType, productId, startDate, endDate, limit, offset } = req.query;
    
    const result = await trackingService.getUserEvents(req.user.id, {
      eventType,
      productId,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting user events:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/user/recently-viewed
 * @desc    Obtiene productos vistos recientemente
 * @access  Private
 */
router.get('/user/recently-viewed', authMiddleware, async (req, res) => {
  try {
    const { limit } = req.query;
    const products = await trackingService.getRecentlyViewedProducts(
      req.user.id,
      limit ? parseInt(limit) : undefined
    );

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error getting recently viewed products:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos vistos',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/user/recent-searches
 * @desc    Obtiene búsquedas recientes del usuario
 * @access  Private
 */
router.get('/user/recent-searches', authMiddleware, async (req, res) => {
  try {
    const { limit } = req.query;
    const searches = await trackingService.getRecentSearches(
      req.user.id,
      limit ? parseInt(limit) : undefined
    );

    res.json({
      success: true,
      searches
    });
  } catch (error) {
    console.error('Error getting recent searches:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener búsquedas recientes',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/user/behavior
 * @desc    Analiza el comportamiento del usuario
 * @access  Private
 */
router.get('/user/behavior', authMiddleware, async (req, res) => {
  try {
    const { days } = req.query;
    const analysis = await trackingService.analyzeUserBehavior(
      req.user.id,
      days ? parseInt(days) : undefined
    );

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing user behavior:', error);
    res.status(500).json({
      success: false,
      message: 'Error al analizar comportamiento',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/user/abandoned-cart
 * @desc    Obtiene productos abandonados en el carrito
 * @access  Private
 */
router.get('/user/abandoned-cart', authMiddleware, async (req, res) => {
  try {
    const products = await trackingService.getAbandonedCartProducts(req.user.id);

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error getting abandoned cart products:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos abandonados',
      error: error.message
    });
  }
});

// ==================== RECOMENDACIONES ====================

/**
 * @route   GET /api/recommendations/personalized
 * @desc    Obtiene recomendaciones personalizadas para el usuario
 * @access  Private
 */
router.get('/personalized', authMiddleware, async (req, res) => {
  try {
    const { limit, excludeProductIds, includeTypes } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : undefined,
      excludeProductIds: excludeProductIds ? JSON.parse(excludeProductIds) : undefined,
      includeTypes: includeTypes ? JSON.parse(includeTypes) : undefined
    };

    const recommendations = await recommendationService.getPersonalizedRecommendations(
      req.user.id,
      options
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recomendaciones',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/similar/:productId
 * @desc    Obtiene productos similares
 * @access  Public
 */
router.get('/similar/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit, excludeIds } = req.query;

    const products = await recommendationService.getSimilarProducts(
      productId,
      limit ? parseInt(limit) : undefined,
      excludeIds ? JSON.parse(excludeIds) : undefined
    );

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error getting similar products:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos similares',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/frequently-bought/:productId
 * @desc    Obtiene productos frecuentemente comprados juntos
 * @access  Public
 */
router.get('/frequently-bought/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit, excludeIds } = req.query;

    const products = await recommendationService.getFrequentlyBoughtTogether(
      productId,
      limit ? parseInt(limit) : undefined,
      excludeIds ? JSON.parse(excludeIds) : undefined
    );

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error getting frequently bought together:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos relacionados',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/complementary/:productId
 * @desc    Obtiene productos complementarios
 * @access  Public
 */
router.get('/complementary/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit, excludeIds } = req.query;

    const products = await recommendationService.getComplementaryProducts(
      productId,
      limit ? parseInt(limit) : undefined,
      excludeIds ? JSON.parse(excludeIds) : undefined
    );

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error getting complementary products:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos complementarios',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/trending
 * @desc    Obtiene productos trending
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit, excludeIds } = req.query;

    const products = await recommendationService.getTrendingProducts(
      limit ? parseInt(limit) : undefined,
      excludeIds ? JSON.parse(excludeIds) : undefined
    );

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error getting trending products:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos populares',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/new
 * @desc    Obtiene productos nuevos
 * @access  Public
 */
router.get('/new', async (req, res) => {
  try {
    const { limit, excludeIds } = req.query;

    const products = await recommendationService.getNewProducts(
      limit ? parseInt(limit) : undefined,
      excludeIds ? JSON.parse(excludeIds) : undefined
    );

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error getting new products:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos nuevos',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/recommendations/feedback
 * @desc    Registra feedback sobre una recomendación
 * @access  Private
 */
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { productId, recommendedProductId, action, metadata } = req.body;

    const feedback = await recommendationService.recordFeedback(
      req.user.id,
      productId,
      recommendedProductId,
      action,
      metadata
    );

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar feedback',
      error: error.message
    });
  }
});

// ==================== SEGMENTACIÓN ====================

/**
 * @route   GET /api/recommendations/user/segment
 * @desc    Obtiene el segmento del usuario autenticado
 * @access  Private
 */
router.get('/user/segment', authMiddleware, async (req, res) => {
  try {
    const segment = await segmentationService.getUserSegment(req.user.id);

    res.json({
      success: true,
      segment
    });
  } catch (error) {
    console.error('Error getting user segment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener segmento',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/recommendations/user/segment/recalculate
 * @desc    Recalcula el segmento del usuario
 * @access  Private
 */
router.post('/user/segment/recalculate', authMiddleware, async (req, res) => {
  try {
    const segment = await segmentationService.calculateUserSegment(req.user.id);

    res.json({
      success: true,
      segment
    });
  } catch (error) {
    console.error('Error recalculating user segment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al recalcular segmento',
      error: error.message
    });
  }
});

// ==================== ADMIN - ESTADÍSTICAS Y GESTIÓN ====================

/**
 * @route   GET /api/recommendations/admin/stats/events
 * @desc    Obtiene estadísticas de eventos (Admin)
 * @access  Admin
 */
router.get('/admin/stats/events', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await trackingService.getEventStats(startDate, endDate);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting event stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/admin/stats/recommendations
 * @desc    Obtiene estadísticas de recomendaciones (Admin)
 * @access  Admin
 */
router.get('/admin/stats/recommendations', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const stats = await recommendationService.getRecommendationStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting recommendation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/admin/stats/segments
 * @desc    Obtiene estadísticas de segmentos (Admin)
 * @access  Admin
 */
router.get('/admin/stats/segments', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const stats = await segmentationService.getSegmentStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting segment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/admin/segments/:segmentName
 * @desc    Obtiene usuarios de un segmento específico (Admin)
 * @access  Admin
 */
router.get('/admin/segments/:segmentName', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { segmentName } = req.params;
    const { limit, offset } = req.query;

    const result = await segmentationService.getUsersBySegment(segmentName, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting users by segment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/admin/at-risk-users
 * @desc    Obtiene usuarios en riesgo de churn (Admin)
 * @access  Admin
 */
router.get('/admin/at-risk-users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { minRisk, limit } = req.query;

    const users = await segmentationService.getAtRiskUsers(
      minRisk ? parseFloat(minRisk) : undefined,
      limit ? parseInt(limit) : undefined
    );

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error getting at-risk users:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios en riesgo',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/admin/high-value-users
 * @desc    Obtiene usuarios de alto valor (Admin)
 * @access  Admin
 */
router.get('/admin/high-value-users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { minValue, limit } = req.query;

    const users = await segmentationService.getHighValueUsers(
      minValue ? parseFloat(minValue) : undefined,
      limit ? parseInt(limit) : undefined
    );

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error getting high-value users:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios de alto valor',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/recommendations/admin/recalculate-segments
 * @desc    Recalcula segmentos desactualizados (Admin)
 * @access  Admin
 */
router.post('/admin/recalculate-segments', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { limit } = req.body;

    const result = await segmentationService.recalculateStaleSegments(
      limit ? parseInt(limit) : undefined
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error recalculating segments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al recalcular segmentos',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/recommendations/admin/events/cleanup
 * @desc    Limpia eventos antiguos (Admin)
 * @access  Admin
 */
router.delete('/admin/events/cleanup', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { daysToKeep } = req.body;

    const result = await trackingService.cleanOldEvents(
      daysToKeep ? parseInt(daysToKeep) : undefined
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error cleaning old events:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar eventos',
      error: error.message
    });
  }
});

module.exports = router;
