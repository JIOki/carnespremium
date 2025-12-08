const express = require('express');
const { requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Requiere rol de administrador o driver
router.use(requireRole('ADMIN', 'SUPER_ADMIN', 'DRIVER'));

/**
 * POST /api/routes/optimize
 * Optimizar rutas de entrega
 */
router.post('/optimize', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Optimización de rutas - En desarrollo',
    data: {
      optimizedRoutes: []
    }
  });
}));

module.exports = router;