const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, requireRole } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// ==================== ADMIN ENDPOINTS ====================

/**
 * @route   GET /api/coupon/admin/all
 * @desc    Obtener todos los cupones (Admin)
 * @access  Private (ADMIN)
 */
router.get('/admin/all', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const { search, type, isActive, page = 1, limit = 20 } = req.query;
  
  const where = {};
  
  if (search) {
    where.OR = [
      { code: { contains: search.toLowerCase() } },
      { description: { contains: search } }
    ];
  }
  
  if (type) {
    where.type = type;
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      include: {
        _count: {
          select: { usages: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.coupon.count({ where })
  ]);

  res.json({
    success: true,
    data: coupons,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
}));

/**
 * @route   GET /api/coupon/admin/stats
 * @desc    Obtener estadísticas de cupones
 * @access  Private (ADMIN)
 */
router.get('/admin/stats', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const [totalCoupons, activeCoupons, totalUsages, totalDiscount] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.couponUsage.count(),
    prisma.couponUsage.aggregate({
      _sum: { discountAmount: true }
    })
  ]);

  const topCoupons = await prisma.coupon.findMany({
    orderBy: { timesUsed: 'desc' },
    take: 5,
    select: {
      id: true,
      code: true,
      type: true,
      timesUsed: true,
      totalDiscount: true
    }
  });

  res.json({
    success: true,
    data: {
      totalCoupons,
      activeCoupons,
      inactiveCoupons: totalCoupons - activeCoupons,
      totalUsages,
      totalDiscount: totalDiscount._sum.discountAmount || 0,
      topCoupons
    }
  });
}));

/**
 * @route   GET /api/coupon/admin/:id
 * @desc    Obtener detalles de un cupón específico
 * @access  Private (ADMIN)
 */
router.get('/admin/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      usages: {
        orderBy: { createdAt: 'desc' },
        take: 50
      },
      _count: {
        select: { usages: true }
      }
    }
  });

  if (!coupon) {
    return res.status(404).json({
      success: false,
      error: 'Cupón no encontrado'
    });
  }

  res.json({
    success: true,
    data: coupon
  });
}));

/**
 * @route   POST /api/coupon/admin/create
 * @desc    Crear un nuevo cupón
 * @access  Private (ADMIN)
 */
router.post('/admin/create', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const {
    code,
    description,
    type,
    value,
    minPurchase,
    maxDiscount,
    maxUsage,
    maxUsagePerUser,
    applicableProducts,
    applicableCategories,
    excludedProducts,
    validFrom,
    validUntil,
    isActive,
    isPublic
  } = req.body;

  // Validaciones
  if (!code || !type || value === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Código, tipo y valor son requeridos'
    });
  }

  const validTypes = ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Tipo de cupón inválido'
    });
  }

  if (type === 'PERCENTAGE' && (value < 0 || value > 100)) {
    return res.status(400).json({
      success: false,
      error: 'El porcentaje debe estar entre 0 y 100'
    });
  }

  if (type === 'FIXED_AMOUNT' && value < 0) {
    return res.status(400).json({
      success: false,
      error: 'El monto fijo debe ser mayor a 0'
    });
  }

  // Verificar que el código no exista
  const existingCoupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (existingCoupon) {
    return res.status(400).json({
      success: false,
      error: 'El código de cupón ya existe'
    });
  }

  // Crear cupón
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      description,
      type,
      value: parseFloat(value),
      minPurchase: minPurchase ? parseFloat(minPurchase) : null,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      maxUsage: maxUsage ? parseInt(maxUsage) : null,
      maxUsagePerUser: maxUsagePerUser ? parseInt(maxUsagePerUser) : 1,
      applicableProducts: applicableProducts ? JSON.stringify(applicableProducts) : null,
      applicableCategories: applicableCategories ? JSON.stringify(applicableCategories) : null,
      excludedProducts: excludedProducts ? JSON.stringify(excludedProducts) : null,
      validFrom: new Date(validFrom),
      validUntil: validUntil ? new Date(validUntil) : null,
      isActive: isActive !== undefined ? isActive : true,
      isPublic: isPublic !== undefined ? isPublic : false,
      createdBy: req.user.id
    }
  });

  res.status(201).json({
    success: true,
    data: coupon,
    message: 'Cupón creado exitosamente'
  });
}));

/**
 * @route   PUT /api/coupon/admin/:id
 * @desc    Actualizar un cupón existente
 * @access  Private (ADMIN)
 */
router.put('/admin/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    description,
    value,
    minPurchase,
    maxDiscount,
    maxUsage,
    maxUsagePerUser,
    applicableProducts,
    applicableCategories,
    excludedProducts,
    validFrom,
    validUntil,
    isActive,
    isPublic
  } = req.body;

  const coupon = await prisma.coupon.findUnique({ where: { id } });

  if (!coupon) {
    return res.status(404).json({
      success: false,
      error: 'Cupón no encontrado'
    });
  }

  const updateData = {};
  
  if (description !== undefined) updateData.description = description;
  if (value !== undefined) updateData.value = parseFloat(value);
  if (minPurchase !== undefined) updateData.minPurchase = minPurchase ? parseFloat(minPurchase) : null;
  if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
  if (maxUsage !== undefined) updateData.maxUsage = maxUsage ? parseInt(maxUsage) : null;
  if (maxUsagePerUser !== undefined) updateData.maxUsagePerUser = parseInt(maxUsagePerUser);
  if (applicableProducts !== undefined) updateData.applicableProducts = applicableProducts ? JSON.stringify(applicableProducts) : null;
  if (applicableCategories !== undefined) updateData.applicableCategories = applicableCategories ? JSON.stringify(applicableCategories) : null;
  if (excludedProducts !== undefined) updateData.excludedProducts = excludedProducts ? JSON.stringify(excludedProducts) : null;
  if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
  if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (isPublic !== undefined) updateData.isPublic = isPublic;

  const updatedCoupon = await prisma.coupon.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    data: updatedCoupon,
    message: 'Cupón actualizado exitosamente'
  });
}));

/**
 * @route   DELETE /api/coupon/admin/:id
 * @desc    Eliminar un cupón
 * @access  Private (ADMIN)
 */
router.delete('/admin/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await prisma.coupon.findUnique({ where: { id } });

  if (!coupon) {
    return res.status(404).json({
      success: false,
      error: 'Cupón no encontrado'
    });
  }

  await prisma.coupon.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Cupón eliminado exitosamente'
  });
}));

// ==================== PUBLIC/CUSTOMER ENDPOINTS ====================

/**
 * @route   GET /api/coupon/public
 * @desc    Obtener cupones públicos activos
 * @access  Public
 */
router.get('/public', asyncHandler(async (req, res) => {
  const now = new Date();

  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      isPublic: true,
      validFrom: { lte: now },
      OR: [
        { validUntil: null },
        { validUntil: { gte: now } }
      ]
    },
    select: {
      id: true,
      code: true,
      description: true,
      type: true,
      value: true,
      minPurchase: true,
      validUntil: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: coupons
  });
}));

/**
 * @route   POST /api/coupon/validate
 * @desc    Validar un cupón y calcular el descuento
 * @access  Public (autenticación opcional)
 */
router.post('/validate', asyncHandler(async (req, res) => {
  const { code, subtotal = 0, items = [] } = req.body; // subtotal ahora tiene default de 0
  const userId = req.user?.id || req.userId; // Autenticación opcional

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Código de cupón es requerido'
    });
  }

  // Buscar el cupón
  const couponWhere = { code: code.toUpperCase() };
  const couponInclude = userId ? {
    usages: {
      where: { userId }
    }
  } : {};
  
  const coupon = await prisma.coupon.findUnique({
    where: couponWhere,
    include: couponInclude
  });

  if (!coupon) {
    return res.status(404).json({
      success: false,
      error: 'Cupón no encontrado'
    });
  }

  // Validar si está activo
  if (!coupon.isActive) {
    return res.status(400).json({
      success: false,
      error: 'Este cupón no está activo'
    });
  }

  // Validar fechas
  const now = new Date();
  if (coupon.validFrom > now) {
    return res.status(400).json({
      success: false,
      error: 'Este cupón aún no es válido'
    });
  }

  if (coupon.validUntil && coupon.validUntil < now) {
    return res.status(400).json({
      success: false,
      error: 'Este cupón ha expirado'
    });
  }

  // Validar uso global
  if (coupon.maxUsage && coupon.timesUsed >= coupon.maxUsage) {
    return res.status(400).json({
      success: false,
      error: 'Este cupón ha alcanzado su límite de uso'
    });
  }

  // Validar uso por usuario (solo si está autenticado)
  if (userId && coupon.usages) {
    const userUsageCount = coupon.usages.length;
    if (userUsageCount >= coupon.maxUsagePerUser) {
      return res.status(400).json({
        success: false,
        error: 'Has alcanzado el límite de uso de este cupón'
      });
    }
  }

  // Validar compra mínima
  if (coupon.minPurchase && subtotal < coupon.minPurchase) {
    return res.status(400).json({
      success: false,
      error: `Compra mínima requerida: $${coupon.minPurchase.toFixed(2)}`
    });
  }

  // Validar productos aplicables
  if (coupon.applicableProducts) {
    const applicableIds = JSON.parse(coupon.applicableProducts);
    const hasApplicableProduct = items.some(item => applicableIds.includes(item.productId));
    
    if (!hasApplicableProduct) {
      return res.status(400).json({
        success: false,
        error: 'Este cupón no es aplicable a los productos en tu carrito'
      });
    }
  }

  // Validar productos excluidos
  if (coupon.excludedProducts) {
    const excludedIds = JSON.parse(coupon.excludedProducts);
    const hasExcludedProduct = items.some(item => excludedIds.includes(item.productId));
    
    if (hasExcludedProduct) {
      return res.status(400).json({
        success: false,
        error: 'Algunos productos en tu carrito no son elegibles para este cupón'
      });
    }
  }

  // Calcular descuento
  let discountAmount = 0;
  let freeShipping = false;

  switch (coupon.type) {
    case 'PERCENTAGE':
      discountAmount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
      break;

    case 'FIXED_AMOUNT':
      discountAmount = Math.min(coupon.value, subtotal);
      break;

    case 'FREE_SHIPPING':
      freeShipping = true;
      break;
  }

  res.json({
    success: true,
    valid: true,
    data: {
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      description: coupon.description,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      freeShipping
    },
    message: 'Cupón válido'
  });
}));

/**
 * @route   POST /api/coupon/apply
 * @desc    Aplicar un cupón a un pedido (registrar uso)
 * @access  Private
 */
router.post('/apply', authMiddleware, asyncHandler(async (req, res) => {
  const { couponId, orderId, discountAmount } = req.body;
  const userId = req.user.id;

  if (!couponId || !discountAmount) {
    return res.status(400).json({
      success: false,
      error: 'Datos incompletos'
    });
  }

  // Registrar el uso del cupón
  const usage = await prisma.couponUsage.create({
    data: {
      couponId,
      userId,
      orderId: orderId || null,
      discountAmount: parseFloat(discountAmount)
    }
  });

  // Actualizar estadísticas del cupón
  await prisma.coupon.update({
    where: { id: couponId },
    data: {
      timesUsed: { increment: 1 },
      totalDiscount: { increment: parseFloat(discountAmount) }
    }
  });

  res.json({
    success: true,
    data: usage,
    message: 'Cupón aplicado exitosamente'
  });
}));

/**
 * @route   GET /api/coupon/my-usage
 * @desc    Obtener historial de uso de cupones del usuario
 * @access  Private
 */
router.get('/my-usage', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const usages = await prisma.couponUsage.findMany({
    where: { userId },
    include: {
      coupon: {
        select: {
          code: true,
          description: true,
          type: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: usages
  });
}));

module.exports = router;
