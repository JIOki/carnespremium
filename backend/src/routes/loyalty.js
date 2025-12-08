const express = require('express');
const { getPrismaClient } = require('../database/connection');
const { asyncHandler, CommonErrors } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/loyalty/points
 * Obtener puntos de lealtad del usuario
 */
router.get('/points', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const prisma = getPrismaClient();

  const loyalty = await prisma.loyaltyPoints.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!loyalty) {
    // Crear registro de lealtad si no existe
    const newLoyalty = await prisma.loyaltyPoints.create({
      data: { userId }
    });
    
    return res.json({
      success: true,
      data: {
        ...newLoyalty,
        transactions: []
      }
    });
  }

  res.json({
    success: true,
    data: loyalty
  });
}));

module.exports = router;