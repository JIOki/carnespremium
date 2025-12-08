const express = require('express');
const { getPrismaClient } = require('../database/connection');
const { asyncHandler, CommonErrors } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/analytics/dashboard
 * Obtener estadísticas generales del dashboard
 * Solo para admins
 */
router.get('/dashboard', authMiddleware, asyncHandler(async (req, res) => {
  const prisma = getPrismaClient();

  // Obtener estadísticas en paralelo
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    recentOrders,
    topProducts
  ] = await Promise.all([
    // Total de usuarios
    prisma.user.count({
      where: { isActive: true }
    }),
    
    // Total de productos activos
    prisma.product.count({
      where: { isActive: true }
    }),
    
    // Total de órdenes
    prisma.order.count(),
    
    // Revenue total
    prisma.order.aggregate({
      where: {
        status: { in: ['DELIVERED', 'CONFIRMED'] },
        paymentStatus: 'CAPTURED'
      },
      _sum: {
        total: true
      }
    }),
    
    // Órdenes recientes (últimas 10)
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }),
    
    // Productos más vendidos (top 5)
    prisma.product.findMany({
      take: 5,
      where: { isActive: true },
      orderBy: { totalSales: 'desc' },
      select: {
        id: true,
        name: true,
        totalSales: true,
        imageUrl: true
      }
    })
  ]);

  // Obtener órdenes por estado
  const ordersByStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  });

  // Calcular estadísticas de este mes
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [monthlyOrders, monthlyRevenue] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    }),
    
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfMonth },
        status: { in: ['DELIVERED', 'CONFIRMED'] },
        paymentStatus: 'CAPTURED'
      },
      _sum: {
        total: true
      }
    })
  ]);

  // Estadísticas de inventario (basado en variantes)
  const [lowStockVariants, outOfStockVariants] = await Promise.all([
    prisma.productVariant.count({
      where: {
        isActive: true,
        stock: { lte: 10, gt: 0 }
      }
    }),
    
    prisma.productVariant.count({
      where: {
        isActive: true,
        stock: 0
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        monthlyOrders,
        monthlyRevenue: monthlyRevenue._sum.total || 0
      },
      inventory: {
        lowStock: lowStockVariants,
        outOfStock: outOfStockVariants
      },
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
      recentOrders,
      topProducts
    }
  });
}));

/**
 * GET /api/analytics/sales
 * Obtener estadísticas de ventas
 */
router.get('/sales', authMiddleware, asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query; // week, month, year
  const prisma = getPrismaClient();

  let startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  // Ventas por día
  const sales = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate },
      status: { in: ['DELIVERED', 'CONFIRMED'] },
      paymentStatus: 'CAPTURED'
    },
    select: {
      total: true,
      createdAt: true
    }
  });

  // Agrupar por día
  const salesByDay = sales.reduce((acc, order) => {
    const date = order.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, total: 0, count: 0 };
    }
    acc[date].total += parseFloat(order.total);
    acc[date].count += 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      period,
      sales: Object.values(salesByDay).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      )
    }
  });
}));

/**
 * GET /api/analytics/products
 * Obtener estadísticas de productos
 */
router.get('/products', authMiddleware, asyncHandler(async (req, res) => {
  const prisma = getPrismaClient();

  const [
    topSelling,
    topRated,
    mostReviewed,
    categoryStats
  ] = await Promise.all([
    // Productos más vendidos
    prisma.product.findMany({
      take: 10,
      where: { isActive: true },
      orderBy: { totalSales: 'desc' },
      select: {
        id: true,
        name: true,
        totalSales: true,
        imageUrl: true,
        category: {
          select: { name: true }
        }
      }
    }),
    
    // Productos mejor calificados
    prisma.product.findMany({
      take: 10,
      where: { 
        isActive: true,
        totalReviews: { gt: 0 }
      },
      orderBy: { averageRating: 'desc' },
      select: {
        id: true,
        name: true,
        averageRating: true,
        totalReviews: true,
        imageUrl: true
      }
    }),
    
    // Productos más reseñados
    prisma.product.findMany({
      take: 10,
      where: { isActive: true },
      orderBy: { totalReviews: 'desc' },
      select: {
        id: true,
        name: true,
        totalReviews: true,
        averageRating: true,
        imageUrl: true
      }
    }),
    
    // Estadísticas por categoría
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        }
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      topSelling,
      topRated,
      mostReviewed,
      categoryStats: categoryStats.map(cat => ({
        id: cat.id,
        name: cat.name,
        productCount: cat._count.products
      }))
    }
  });
}));

/**
 * GET /api/analytics/users
 * Obtener estadísticas de usuarios
 */
router.get('/users', authMiddleware, asyncHandler(async (req, res) => {
  const prisma = getPrismaClient();

  const now = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    usersByRole
  ] = await Promise.all([
    // Total de usuarios
    prisma.user.count(),
    
    // Usuarios activos
    prisma.user.count({
      where: { isActive: true }
    }),
    
    // Nuevos usuarios este mes
    prisma.user.count({
      where: {
        createdAt: { gte: lastMonth }
      }
    }),
    
    // Usuarios por rol
    prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.id;
        return acc;
      }, {})
    }
  });
}));

/**
 * GET /api/analytics/loyalty
 * Obtener estadísticas del sistema de lealtad
 */
router.get('/loyalty', authMiddleware, asyncHandler(async (req, res) => {
  const prisma = getPrismaClient();

  const [
    totalPoints,
    usersByTier,
    activeChallenges,
    rewardRedemptions
  ] = await Promise.all([
    // Total de puntos en circulación
    prisma.loyaltyPoints.aggregate({
      _sum: {
        currentPoints: true,
        totalEarned: true,
        totalRedeemed: true
      }
    }),
    
    // Usuarios por tier
    prisma.loyaltyPoints.groupBy({
      by: ['tier'],
      _count: {
        id: true
      }
    }),
    
    // Challenges activos
    prisma.challenge.count({
      where: { isActive: true }
    }),
    
    // Redempciones de recompensas
    prisma.rewardRedemption.count()
  ]);

  res.json({
    success: true,
    data: {
      totalPoints: {
        current: totalPoints._sum.currentPoints || 0,
        earned: totalPoints._sum.totalEarned || 0,
        redeemed: totalPoints._sum.totalRedeemed || 0
      },
      usersByTier: usersByTier.reduce((acc, item) => {
        acc[item.tier] = item._count.id;
        return acc;
      }, {}),
      activeChallenges,
      rewardRedemptions
    }
  });
}));

module.exports = router;
