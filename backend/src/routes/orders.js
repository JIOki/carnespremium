const express = require('express');
const { getPrismaClient } = require('../database/connection');
const { asyncHandler, CommonErrors } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/orders
 * Obtener órdenes del usuario autenticado
 */
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { status, page = 1, limit = 10 } = req.query;
  const prisma = getPrismaClient();

  const where = {
    userId,
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
                imageUrl: true
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

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalOrders: totalCount
      }
    }
  });
}));

/**
 * GET /api/orders/:id
 * Obtener detalles de una orden específica
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const userRole = req.userRole;
  const prisma = getPrismaClient();

  const where = {
    id,
    ...(userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && { userId })
  };

  const order = await prisma.order.findUnique({
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
    }
  });

  if (!order) {
    throw CommonErrors.NotFound('Orden');
  }

  res.json({
    success: true,
    data: order
  });
}));

module.exports = router;