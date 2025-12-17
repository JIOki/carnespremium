const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const Joi = require('joi');

const router = express.Router();
const prisma = new PrismaClient();

// Todas las rutas requieren rol de administrador
router.use(requireAdmin);

// ==================== DASHBOARD ====================

/**
 * GET /api/admin/dashboard
 * Obtener métricas del dashboard administrativo
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [
    totalOrders,
    totalUsers,
    totalProducts,
    activeProducts,
    ordersToday,
    ordersThisMonth,
    ordersThisYear,
    revenueData,
    recentOrders,
    lowStockProducts,
    topProducts
  ] = await Promise.all([
    // Total de órdenes
    prisma.order.count(),
    
    // Total de usuarios
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    
    // Total de productos
    prisma.product.count(),
    
    // Productos activos
    prisma.product.count({ where: { isActive: true } }),
    
    // Órdenes de hoy
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    
    // Órdenes este mes
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    
    // Órdenes este año
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1)
        }
      }
    }),
    
    // Revenue total y por período
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { total: true }
    }),
    
    // Últimas 5 órdenes
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true }
            }
          }
        }
      }
    }),
    
    // Productos con bajo stock
    prisma.productVariant.findMany({
      where: {
        stock: {
          lte: prisma.productVariant.fields.reorderPoint
        }
      },
      take: 10,
      include: {
        product: {
          select: { id: true, name: true, imageUrl: true }
        }
      },
      orderBy: { stock: 'asc' }
    }),
    
    // Productos más vendidos
    prisma.product.findMany({
      take: 10,
      orderBy: { totalSales: 'desc' },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        totalSales: true,
        averageRating: true
      }
    })
  ]);
  
  const totalRevenue = revenueData._sum.total || 0;
  
  // Calcular revenue de hoy
  const todayRevenue = await prisma.order.aggregate({
    where: {
      paymentStatus: 'PAID',
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    _sum: { total: true }
  });
  
  // Calcular revenue del mes
  const monthRevenue = await prisma.order.aggregate({
    where: {
      paymentStatus: 'PAID',
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    },
    _sum: { total: true }
  });
  
  res.json({
    success: true,
    data: {
      overview: {
        totalOrders,
        totalUsers,
        totalProducts,
        activeProducts,
        totalRevenue,
        ordersToday,
        ordersThisMonth,
        ordersThisYear,
        revenueToday: todayRevenue._sum.total || 0,
        revenueThisMonth: monthRevenue._sum.total || 0
      },
      recentOrders,
      lowStockProducts,
      topProducts
    }
  });
}));

/**
 * GET /api/admin/analytics
 * Obtener datos analíticos para gráficas
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let startDate;
  const now = new Date();
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  // Obtener órdenes del período
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate }
    },
    select: {
      createdAt: true,
      total: true,
      status: true,
      paymentStatus: true
    }
  });
  
  // Agrupar por día
  const dailyStats = {};
  orders.forEach(order => {
    const date = order.createdAt.toISOString().split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = {
        date,
        orders: 0,
        revenue: 0,
        paid: 0,
        pending: 0
      };
    }
    dailyStats[date].orders++;
    dailyStats[date].revenue += order.total;
    if (order.paymentStatus === 'PAID') {
      dailyStats[date].paid++;
    } else {
      dailyStats[date].pending++;
    }
  });
  
  const chartData = Object.values(dailyStats).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  res.json({
    success: true,
    data: {
      period,
      chartData,
      summary: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
        averageOrderValue: orders.length > 0 
          ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length 
          : 0
      }
    }
  });
}));

// ==================== PRODUCTOS ====================

/**
 * GET /api/admin/products
 * Listar todos los productos con paginación y filtros
 */
router.get('/products', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    category = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  // Construir filtros
  const where = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { description: { contains: search } }
    ];
  }
  
  if (category) {
    where.categoryId = category;
  }
  
  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'inactive') {
    where.isActive = false;
  }
  
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: {
          select: { id: true, name: true }
        },
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            isActive: true
          }
        },
        _count: {
          select: {
            reviews: true,
            wishlist: true
          }
        }
      }
    }),
    prisma.product.count({ where })
  ]);
  
  res.json({
    success: true,
    data: {
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    }
  });
}));

/**
 * GET /api/admin/products/:id
 * Obtener detalles de un producto
 */
router.get('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: true,
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      _count: {
        select: {
          reviews: true,
          wishlist: true,
          orderItems: true
        }
      }
    }
  });
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Producto no encontrado'
    });
  }
  
  res.json({
    success: true,
    data: product
  });
}));

/**
 * POST /api/admin/products
 * Crear un nuevo producto
 */
router.post('/products', asyncHandler(async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    slug: Joi.string().required(),
    description: Joi.string().allow('', null),
    shortDesc: Joi.string().allow('', null),
    sku: Joi.string().required(),
    categoryId: Joi.string().required(),
    imageUrl: Joi.string().uri().allow('', null),
    gallery: Joi.array().items(Joi.string().uri()).allow(null),
    isActive: Joi.boolean().default(true),
    isFeatured: Joi.boolean().default(false),
    weight: Joi.number().positive().allow(null),
    unit: Joi.string().default('kg'),
    origin: Joi.string().allow('', null),
    brand: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string()).allow(null),
    nutritionInfo: Joi.object().allow(null),
    storageInstructions: Joi.string().allow('', null),
    minStock: Joi.number().integer().default(0),
    maxStock: Joi.number().integer().default(1000),
    reorderPoint: Joi.number().integer().default(10),
    metadata: Joi.object().allow(null),
    seoTitle: Joi.string().allow('', null),
    seoDescription: Joi.string().allow('', null),
    variants: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      sku: Joi.string().required(),
      price: Joi.number().positive().required(),
      compareAtPrice: Joi.number().positive().allow(null),
      stock: Joi.number().integer().default(0),
      weight: Joi.number().positive().allow(null),
      imageUrl: Joi.string().uri().allow('', null),
      isActive: Joi.boolean().default(true)
    })).min(1).required()
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  // Extraer variantes
  const { variants, gallery, tags, nutritionInfo, metadata, ...productData } = value;
  
  // Convertir arrays/objetos a JSON strings para SQLite
  const processedData = {
    ...productData,
    gallery: gallery ? JSON.stringify(gallery) : null,
    tags: tags ? JSON.stringify(tags) : null,
    nutritionInfo: nutritionInfo ? JSON.stringify(nutritionInfo) : null,
    metadata: metadata ? JSON.stringify(metadata) : null
  };
  
  // Crear producto con variantes
  const product = await prisma.product.create({
    data: {
      ...processedData,
      variants: {
        create: variants
      }
    },
    include: {
      category: true,
      variants: true
    }
  });
  
  res.status(201).json({
    success: true,
    message: 'Producto creado exitosamente',
    data: product
  });
}));

/**
 * PUT /api/admin/products/:id
 * Actualizar un producto existente
 */
router.put('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const schema = Joi.object({
    name: Joi.string(),
    slug: Joi.string(),
    description: Joi.string().allow('', null),
    shortDesc: Joi.string().allow('', null),
    sku: Joi.string(),
    categoryId: Joi.string(),
    imageUrl: Joi.string().uri().allow('', null),
    gallery: Joi.array().items(Joi.string().uri()).allow(null),
    isActive: Joi.boolean(),
    isFeatured: Joi.boolean(),
    weight: Joi.number().positive().allow(null),
    unit: Joi.string(),
    origin: Joi.string().allow('', null),
    brand: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string()).allow(null),
    nutritionInfo: Joi.object().allow(null),
    storageInstructions: Joi.string().allow('', null),
    minStock: Joi.number().integer(),
    maxStock: Joi.number().integer(),
    reorderPoint: Joi.number().integer(),
    metadata: Joi.object().allow(null),
    seoTitle: Joi.string().allow('', null),
    seoDescription: Joi.string().allow('', null)
  }).min(1);
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  // Verificar que el producto existe
  const existingProduct = await prisma.product.findUnique({
    where: { id }
  });
  
  if (!existingProduct) {
    return res.status(404).json({
      success: false,
      error: 'Producto no encontrado'
    });
  }
  
  // Convertir arrays/objetos a JSON strings
  const { gallery, tags, nutritionInfo, metadata, ...updateData } = value;
  
  const processedData = {
    ...updateData,
    ...(gallery !== undefined && { gallery: gallery ? JSON.stringify(gallery) : null }),
    ...(tags !== undefined && { tags: tags ? JSON.stringify(tags) : null }),
    ...(nutritionInfo !== undefined && { nutritionInfo: nutritionInfo ? JSON.stringify(nutritionInfo) : null }),
    ...(metadata !== undefined && { metadata: metadata ? JSON.stringify(metadata) : null })
  };
  
  const product = await prisma.product.update({
    where: { id },
    data: processedData,
    include: {
      category: true,
      variants: true
    }
  });
  
  res.json({
    success: true,
    message: 'Producto actualizado exitosamente',
    data: product
  });
}));

/**
 * DELETE /api/admin/products/:id
 * Eliminar un producto (soft delete - marcar como inactivo)
 */
router.delete('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permanent = false } = req.query;
  
  const product = await prisma.product.findUnique({
    where: { id }
  });
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Producto no encontrado'
    });
  }
  
  if (permanent === 'true') {
    // Eliminación permanente (solo si no tiene órdenes asociadas)
    const hasOrders = await prisma.orderItem.count({
      where: { productId: id }
    });
    
    if (hasOrders > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el producto porque tiene órdenes asociadas. Use eliminación suave.'
      });
    }
    
    await prisma.product.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Producto eliminado permanentemente'
    });
  } else {
    // Soft delete - marcar como inactivo
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });
    
    res.json({
      success: true,
      message: 'Producto desactivado exitosamente'
    });
  }
}));

// ==================== VARIANTES DE PRODUCTOS ====================

/**
 * POST /api/admin/products/:id/variants
 * Agregar variante a un producto
 */
router.post('/products/:id/variants', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const schema = Joi.object({
    name: Joi.string().required(),
    sku: Joi.string().required(),
    price: Joi.number().positive().required(),
    comparePrice: Joi.number().positive().allow(null),
    stock: Joi.number().integer().default(0),
    weight: Joi.number().positive().allow(null),
    imageUrl: Joi.string().uri().allow('', null),
    isActive: Joi.boolean().default(true)
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  const variant = await prisma.productVariant.create({
    data: {
      ...value,
      productId: id
    }
  });
  
  res.status(201).json({
    success: true,
    message: 'Variante creada exitosamente',
    data: variant
  });
}));

/**
 * PUT /api/admin/products/:id/variants/:variantId
 * Actualizar variante de producto
 */
router.put('/products/:id/variants/:variantId', asyncHandler(async (req, res) => {
  const { variantId } = req.params;
  
  const schema = Joi.object({
    name: Joi.string(),
    sku: Joi.string(),
    price: Joi.number().positive(),
    comparePrice: Joi.number().positive().allow(null),
    stock: Joi.number().integer(),
    weight: Joi.number().positive().allow(null),
    imageUrl: Joi.string().uri().allow('', null),
    isActive: Joi.boolean()
  }).min(1);
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: value
  });
  
  res.json({
    success: true,
    message: 'Variante actualizada exitosamente',
    data: variant
  });
}));

/**
 * DELETE /api/admin/products/:id/variants/:variantId
 * Eliminar variante de producto
 */
router.delete('/products/:id/variants/:variantId', asyncHandler(async (req, res) => {
  const { variantId } = req.params;
  
  await prisma.productVariant.delete({
    where: { id: variantId }
  });
  
  res.json({
    success: true,
    message: 'Variante eliminada exitosamente'
  });
}));

// ==================== ÓRDENES ====================

/**
 * GET /api/admin/orders
 * Listar todas las órdenes con paginación y filtros
 */
router.get('/orders', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status = '',
    paymentStatus = '',
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    startDate = '',
    endDate = ''
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  // Construir filtros
  const where = {};
  
  if (status) {
    where.status = status;
  }
  
  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }
  
  if (search) {
    where.OR = [
      { id: { contains: search } },
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } }
    ];
  }
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }
  
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            },
            variant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        delivery: {
          select: {
            id: true,
            status: true,
            driver: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }
      }
    }),
    prisma.order.count({ where })
  ]);
  
  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    }
  });
}));

/**
 * GET /api/admin/orders/:id
 * Obtener detalles completos de una orden
 */
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              sku: true
            }
          },
          variant: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          }
        }
      },
      tracking: {
        orderBy: { createdAt: 'desc' }
      },
      delivery: {
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      }
    }
  });
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Orden no encontrada'
    });
  }
  
  res.json({
    success: true,
    data: order
  });
}));

/**
 * PUT /api/admin/orders/:id/status
 * Actualizar estado de una orden
 */
router.put('/orders/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const schema = Joi.object({
    status: Joi.string()
      .valid('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')
      .required(),
    message: Joi.string().allow('', null),
    notifyUser: Joi.boolean().default(true)
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  const { status, message, notifyUser } = value;
  
  // Actualizar orden y crear registro de tracking
  const [order] = await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { status }
    }),
    prisma.orderTracking.create({
      data: {
        orderId: id,
        status,
        message: message || `Estado actualizado a ${status}`,
        metadata: JSON.stringify({ updatedBy: req.user.id })
      }
    })
  ]);
  
  // TODO: Enviar notificación al usuario si notifyUser es true
  
  res.json({
    success: true,
    message: 'Estado de orden actualizado exitosamente',
    data: order
  });
}));

/**
 * PUT /api/admin/orders/:id/payment
 * Actualizar estado de pago de una orden
 */
router.put('/orders/:id/payment', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const schema = Joi.object({
    paymentStatus: Joi.string()
      .valid('PENDING', 'PAID', 'FAILED', 'REFUNDED')
      .required(),
    paymentMethod: Joi.string().allow('', null),
    transactionId: Joi.string().allow('', null)
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  const updateData = { ...value };
  if (value.paymentStatus === 'PAID' && !value.paidAt) {
    updateData.paidAt = new Date();
  }
  
  const order = await prisma.order.update({
    where: { id },
    data: updateData
  });
  
  res.json({
    success: true,
    message: 'Estado de pago actualizado exitosamente',
    data: order
  });
}));

/**
 * DELETE /api/admin/orders/:id
 * Cancelar una orden
 */
router.delete('/orders/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = 'Cancelada por administrador' } = req.body;
  
  const order = await prisma.order.findUnique({
    where: { id }
  });
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Orden no encontrada'
    });
  }
  
  if (order.status === 'DELIVERED') {
    return res.status(400).json({
      success: false,
      error: 'No se puede cancelar una orden ya entregada'
    });
  }
  
  // Actualizar orden y crear registro de tracking
  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' }
    }),
    prisma.orderTracking.create({
      data: {
        orderId: id,
        status: 'CANCELLED',
        message: reason,
        metadata: JSON.stringify({ cancelledBy: req.user.id })
      }
    })
  ]);
  
  res.json({
    success: true,
    message: 'Orden cancelada exitosamente'
  });
}));

// ==================== USUARIOS ====================

/**
 * GET /api/admin/users
 * Listar todos los usuarios con paginación y filtros
 */
router.get('/users', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    role = '',
    search = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  // Construir filtros
  const where = {};
  
  if (role) {
    where.role = role;
  }
  
  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'inactive') {
    where.isActive = false;
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } }
    ];
  }
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            addresses: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);
  
  res.json({
    success: true,
    data: {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    }
  });
}));

/**
 * GET /api/admin/users/:id
 * Obtener detalles de un usuario
 */
router.get('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      addresses: true,
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true
        }
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true
            }
          }
        }
      },
      loyalty: true,
      _count: {
        select: {
          orders: true,
          reviews: true,
          addresses: true,
          wishlist: true
        }
      }
    }
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Usuario no encontrado'
    });
  }
  
  // Calcular estadísticas adicionales
  const orderStats = await prisma.order.aggregate({
    where: {
      userId: id,
      paymentStatus: 'PAID'
    },
    _sum: { total: true },
    _avg: { total: true }
  });
  
  res.json({
    success: true,
    data: {
      ...user,
      stats: {
        totalSpent: orderStats._sum.total || 0,
        averageOrderValue: orderStats._avg.total || 0
      }
    }
  });
}));

/**
 * POST /api/admin/users
 * Crear un nuevo usuario
 */
router.post('/users', asyncHandler(async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    phone: Joi.string().allow('', null),
    role: Joi.string().valid('CUSTOMER', 'DRIVER', 'ADMIN', 'SUPER_ADMIN').default('CUSTOMER'),
    isActive: Joi.boolean().default(true)
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  // Verificar si el email ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email: value.email }
  });
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'El email ya está registrado'
    });
  }
  
  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(value.password, 10);
  
  const user = await prisma.user.create({
    data: {
      ...value,
      password: hashedPassword
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });
  
  res.status(201).json({
    success: true,
    message: 'Usuario creado exitosamente',
    data: user
  });
}));

/**
 * PUT /api/admin/users/:id
 * Actualizar un usuario
 */
router.put('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const schema = Joi.object({
    email: Joi.string().email(),
    name: Joi.string(),
    phone: Joi.string().allow('', null),
    role: Joi.string().valid('CUSTOMER', 'DRIVER', 'ADMIN', 'SUPER_ADMIN'),
    isActive: Joi.boolean(),
    password: Joi.string().min(6)
  }).min(1);
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  const updateData = { ...value };
  
  // Hash de la contraseña si se proporciona
  if (value.password) {
    updateData.password = await bcrypt.hash(value.password, 10);
  }
  
  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });
  
  res.json({
    success: true,
    message: 'Usuario actualizado exitosamente',
    data: user
  });
}));

/**
 * DELETE /api/admin/users/:id
 * Desactivar/eliminar un usuario
 */
router.delete('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permanent = false } = req.query;
  
  if (id === req.user.id) {
    return res.status(400).json({
      success: false,
      error: 'No puedes eliminar tu propia cuenta'
    });
  }
  
  const user = await prisma.user.findUnique({
    where: { id }
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Usuario no encontrado'
    });
  }
  
  if (permanent === 'true') {
    // Verificar si tiene órdenes
    const hasOrders = await prisma.order.count({
      where: { userId: id }
    });
    
    if (hasOrders > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el usuario porque tiene órdenes asociadas. Use desactivación.'
      });
    }
    
    await prisma.user.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Usuario eliminado permanentemente'
    });
  } else {
    // Soft delete - desactivar
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });
    
    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });
  }
}));

// ==================== CATEGORÍAS ====================

/**
 * GET /api/admin/categories
 * Listar todas las categorías
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { sortOrder: 'asc' }
  });
  
  res.json({
    success: true,
    data: categories
  });
}));

/**
 * POST /api/admin/categories
 * Crear una nueva categoría
 */
router.post('/categories', asyncHandler(async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    slug: Joi.string().required(),
    description: Joi.string().allow('', null),
    imageUrl: Joi.string().uri().allow('', null),
    parentId: Joi.string().allow(null),
    isActive: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().default(0)
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  const category = await prisma.category.create({
    data: value
  });
  
  res.status(201).json({
    success: true,
    message: 'Categoría creada exitosamente',
    data: category
  });
}));

/**
 * PUT /api/admin/categories/:id
 * Actualizar una categoría
 */
router.put('/categories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const schema = Joi.object({
    name: Joi.string(),
    slug: Joi.string(),
    description: Joi.string().allow('', null),
    imageUrl: Joi.string().uri().allow('', null),
    parentId: Joi.string().allow(null),
    isActive: Joi.boolean(),
    sortOrder: Joi.number().integer()
  }).min(1);
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  const category = await prisma.category.update({
    where: { id },
    data: value
  });
  
  res.json({
    success: true,
    message: 'Categoría actualizada exitosamente',
    data: category
  });
}));

/**
 * DELETE /api/admin/categories/:id
 * Eliminar una categoría
 */
router.delete('/categories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Verificar si tiene productos
  const hasProducts = await prisma.product.count({
    where: { categoryId: id }
  });
  
  if (hasProducts > 0) {
    return res.status(400).json({
      success: false,
      error: 'No se puede eliminar la categoría porque tiene productos asociados'
    });
  }
  
  await prisma.category.delete({
    where: { id }
  });
  
  res.json({
    success: true,
    message: 'Categoría eliminada exitosamente'
  });
}));

module.exports = router;
