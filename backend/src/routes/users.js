const express = require('express');
const { getPrismaClient } = require('../database/connection');
const { asyncHandler, CommonErrors } = require('../middleware/errorHandler');
const { requireOwnership } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/users/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      loyalty: {
        select: {
          currentPoints: true,
          totalEarned: true,
          totalRedeemed: true,
          tier: true,
          tierProgress: true,
          nextTierPoints: true
        }
      }
    }
  });

  if (!user) {
    throw CommonErrors.NotFound('Usuario');
  }

  res.json({
    success: true,
    data: user
  });
}));

/**
 * GET /api/users/:id/addresses
 * Obtener direcciones del usuario
 */
router.get('/:id/addresses', requireOwnership(), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prisma = getPrismaClient();

  const addresses = await prisma.address.findMany({
    where: { userId: id },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  res.json({
    success: true,
    data: addresses
  });
}));

/**
 * GET /api/users/:id/orders
 * Obtener órdenes del usuario
 */
router.get('/:id/orders', requireOwnership(), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, page = 1, limit = 10 } = req.query;
  const prisma = getPrismaClient();

  const where = {
    userId: id,
    ...(status && { status })
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: {
                  where: { isPrimary: true },
                  select: { url: true },
                  take: 1
                }
              }
            }
          }
        },
        address: true,
        delivery: {
          include: {
            driver: {
              include: {
                user: {
                  select: { name: true, phone: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.order.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders: totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
}));

module.exports = router;