const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// ============================================
// ENDPOINTS DE INVENTARIO (ADMIN)
// ============================================

/**
 * GET /api/inventory
 * Obtener resumen de inventario con filtros
 */
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const {
      search,
      categoryId,
      lowStock,
      outOfStock,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {
      isActive: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { brand: { contains: search } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Obtener productos
    let products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { name: true }
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            price: true,
            cost: true
          }
        }
      },
      skip,
      take,
      orderBy: { [sortBy]: sortOrder }
    });

    // Calcular stock total por producto
    products = products.map(product => {
      const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      const lowStockVariants = product.variants.filter(v => v.stock <= product.reorderPoint);
      const outOfStockVariants = product.variants.filter(v => v.stock === 0);

      return {
        ...product,
        totalStock,
        stockStatus: totalStock === 0 ? 'OUT_OF_STOCK' : 
                     totalStock <= product.reorderPoint ? 'LOW_STOCK' : 
                     'IN_STOCK',
        lowStockVariants: lowStockVariants.length,
        outOfStockVariants: outOfStockVariants.length
      };
    });

    // Aplicar filtros de stock
    if (lowStock === 'true') {
      products = products.filter(p => p.stockStatus === 'LOW_STOCK');
    }
    if (outOfStock === 'true') {
      products = products.filter(p => p.stockStatus === 'OUT_OF_STOCK');
    }

    const total = await prisma.product.count({ where });

    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

/**
 * GET /api/inventory/stats
 * Obtener estadísticas de inventario
 */
router.get('/stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    // Obtener todos los productos con variantes
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        variants: {
          where: { isActive: true }
        }
      }
    });

    // Calcular estadísticas
    let totalProducts = products.length;
    let totalVariants = 0;
    let totalStock = 0;
    let totalValue = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;

    products.forEach(product => {
      product.variants.forEach(variant => {
        totalVariants++;
        totalStock += variant.stock;
        totalValue += (variant.cost || 0) * variant.stock;

        if (variant.stock === 0) {
          outOfStockItems++;
        } else if (variant.stock <= product.reorderPoint) {
          lowStockItems++;
        }
      });
    });

    // Obtener alertas activas
    const activeAlerts = await prisma.stockAlert.count({
      where: { status: 'ACTIVE' }
    });

    // Movimientos del mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const movementsThisMonth = await prisma.inventoryMovement.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    });

    // Productos más vendidos (último mes)
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      where: {
        createdAt: { gte: startOfMonth }
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, imageUrl: true, sku: true }
        });
        return {
          ...product,
          totalSold: item._sum.quantity
        };
      })
    );

    res.json({
      overview: {
        totalProducts,
        totalVariants,
        totalStock,
        totalValue: totalValue.toFixed(2),
        lowStockItems,
        outOfStockItems,
        activeAlerts,
        movementsThisMonth
      },
      topProducts: topProductsWithDetails,
      alerts: {
        critical: outOfStockItems,
        warning: lowStockItems,
        total: activeAlerts
      }
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

/**
 * POST /api/inventory/adjust
 * Ajustar stock de un producto/variante
 */
router.post('/adjust', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { variantId, quantity, reason, notes } = req.body;

    if (!variantId || quantity === undefined) {
      return res.status(400).json({ error: 'Variante y cantidad son requeridos' });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true }
    });

    if (!variant) {
      return res.status(404).json({ error: 'Variante no encontrada' });
    }

    const previousStock = variant.stock;
    const newStock = previousStock + parseInt(quantity);

    if (newStock < 0) {
      return res.status(400).json({ error: 'El stock no puede ser negativo' });
    }

    // Actualizar stock
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock }
    });

    // Registrar movimiento
    const movement = await prisma.inventoryMovement.create({
      data: {
        variantId,
        productId: variant.productId,
        type: 'ADJUSTMENT',
        quantity: parseInt(quantity),
        previousStock,
        newStock,
        referenceType: 'ADJUSTMENT',
        userId: req.user.userId,
        userName: req.user.name || req.user.email,
        reason: reason || 'Ajuste manual de inventario',
        notes,
        unitCost: variant.cost,
        totalCost: (variant.cost || 0) * Math.abs(parseInt(quantity))
      }
    });

    // Verificar si se debe crear/resolver alertas
    await checkStockAlerts(variant.productId, variantId);

    res.json({
      message: 'Stock ajustado exitosamente',
      movement,
      previousStock,
      newStock
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Error al ajustar stock' });
  }
});

/**
 * POST /api/inventory/bulk-adjust
 * Ajustar stock de múltiples productos
 */
router.post('/bulk-adjust', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { adjustments, reason, notes } = req.body;

    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de ajustes' });
    }

    const results = [];
    const errors = [];

    for (const adjustment of adjustments) {
      try {
        const { variantId, quantity } = adjustment;

        const variant = await prisma.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true }
        });

        if (!variant) {
          errors.push({ variantId, error: 'Variante no encontrada' });
          continue;
        }

        const previousStock = variant.stock;
        const newStock = previousStock + parseInt(quantity);

        if (newStock < 0) {
          errors.push({ variantId, error: 'Stock negativo no permitido' });
          continue;
        }

        await prisma.productVariant.update({
          where: { id: variantId },
          data: { stock: newStock }
        });

        const movement = await prisma.inventoryMovement.create({
          data: {
            variantId,
            productId: variant.productId,
            type: 'ADJUSTMENT',
            quantity: parseInt(quantity),
            previousStock,
            newStock,
            referenceType: 'BULK_ADJUSTMENT',
            userId: req.user.userId,
            userName: req.user.name || req.user.email,
            reason: reason || 'Ajuste masivo de inventario',
            notes,
            unitCost: variant.cost,
            totalCost: (variant.cost || 0) * Math.abs(parseInt(quantity))
          }
        });

        await checkStockAlerts(variant.productId, variantId);

        results.push({
          variantId,
          success: true,
          previousStock,
          newStock,
          movementId: movement.id
        });
      } catch (err) {
        errors.push({ variantId: adjustment.variantId, error: err.message });
      }
    }

    res.json({
      message: 'Ajustes procesados',
      success: results.length,
      errors: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Error bulk adjusting stock:', error);
    res.status(500).json({ error: 'Error al ajustar stocks' });
  }
});

// ============================================
// MOVIMIENTOS DE INVENTARIO
// ============================================

/**
 * GET /api/inventory/movements
 * Obtener historial de movimientos
 */
router.get('/movements', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const {
      productId,
      variantId,
      type,
      supplierId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;
    if (type) where.type = type;
    if (supplierId) where.supplierId = supplierId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: {
          supplier: {
            select: { id: true, name: true, code: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.inventoryMovement.count({ where })
    ]);

    // Enriquecer con información de producto/variante
    const enrichedMovements = await Promise.all(
      movements.map(async (movement) => {
        let productInfo = null;
        let variantInfo = null;

        if (movement.variantId) {
          const variant = await prisma.productVariant.findUnique({
            where: { id: movement.variantId },
            include: {
              product: {
                select: { id: true, name: true, sku: true, imageUrl: true }
              }
            }
          });
          if (variant) {
            productInfo = variant.product;
            variantInfo = {
              id: variant.id,
              name: variant.name,
              sku: variant.sku
            };
          }
        } else if (movement.productId) {
          productInfo = await prisma.product.findUnique({
            where: { id: movement.productId },
            select: { id: true, name: true, sku: true, imageUrl: true }
          });
        }

        return {
          ...movement,
          product: productInfo,
          variant: variantInfo
        };
      })
    );

    res.json({
      movements: enrichedMovements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

/**
 * GET /api/inventory/movements/product/:productId
 * Obtener movimientos de un producto específico
 */
router.get('/movements/product/:productId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 50 } = req.query;

    const movements = await prisma.inventoryMovement.findMany({
      where: {
        OR: [
          { productId },
          {
            variantId: {
              in: (await prisma.productVariant.findMany({
                where: { productId },
                select: { id: true }
              })).map(v => v.id)
            }
          }
        ]
      },
      include: {
        supplier: {
          select: { name: true, code: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    // Enriquecer con información de variante
    const enrichedMovements = await Promise.all(
      movements.map(async (movement) => {
        let variantInfo = null;
        if (movement.variantId) {
          variantInfo = await prisma.productVariant.findUnique({
            where: { id: movement.variantId },
            select: { id: true, name: true, sku: true }
          });
        }
        return { ...movement, variant: variantInfo };
      })
    );

    res.json({ movements: enrichedMovements });
  } catch (error) {
    console.error('Error fetching product movements:', error);
    res.status(500).json({ error: 'Error al obtener movimientos del producto' });
  }
});

/**
 * GET /api/inventory/movements/stats
 * Estadísticas de movimientos
 */
router.get('/movements/stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Contar por tipo
    const byType = await prisma.inventoryMovement.groupBy({
      by: ['type'],
      _count: { id: true },
      _sum: { totalCost: true },
      where
    });

    // Total de movimientos
    const totalMovements = await prisma.inventoryMovement.count({ where });

    // Valor total movido
    const totalValue = await prisma.inventoryMovement.aggregate({
      _sum: { totalCost: true },
      where
    });

    res.json({
      totalMovements,
      totalValue: totalValue._sum.totalCost || 0,
      byType: byType.map(item => ({
        type: item.type,
        count: item._count.id,
        totalCost: item._sum.totalCost || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching movement stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ============================================
// ALERTAS DE STOCK
// ============================================

/**
 * GET /api/inventory/alerts
 * Obtener alertas de stock
 */
router.get('/alerts', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const {
      status = 'ACTIVE',
      alertType,
      severity,
      page = 1,
      limit = 50
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (alertType) where.alertType = alertType;
    if (severity) where.severity = severity;

    const [alerts, total] = await Promise.all([
      prisma.stockAlert.findMany({
        where,
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take
      }),
      prisma.stockAlert.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
});

/**
 * POST /api/inventory/alerts/:alertId/acknowledge
 * Reconocer una alerta
 */
router.post('/alerts/:alertId/acknowledge', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await prisma.stockAlert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: req.user.userId,
        acknowledgedAt: new Date()
      }
    });

    res.json({ message: 'Alerta reconocida', alert });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Error al reconocer alerta' });
  }
});

/**
 * POST /api/inventory/alerts/:alertId/resolve
 * Resolver una alerta
 */
router.post('/alerts/:alertId/resolve', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution } = req.body;

    const alert = await prisma.stockAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolution
      }
    });

    res.json({ message: 'Alerta resuelta', alert });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Error al resolver alerta' });
  }
});

/**
 * POST /api/inventory/alerts/check
 * Verificar y crear alertas de stock bajo
 */
router.post('/alerts/check', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const alertsCreated = [];

    // Obtener todos los productos con variantes
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        variants: {
          where: { isActive: true }
        }
      }
    });

    for (const product of products) {
      for (const variant of product.variants) {
        const result = await checkStockAlerts(product.id, variant.id);
        if (result) {
          alertsCreated.push(result);
        }
      }
    }

    res.json({
      message: 'Verificación de alertas completada',
      alertsCreated: alertsCreated.length,
      alerts: alertsCreated
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    res.status(500).json({ error: 'Error al verificar alertas' });
  }
});

// ============================================
// PROVEEDORES
// ============================================

/**
 * GET /api/inventory/suppliers
 * Obtener lista de proveedores
 */
router.get('/suppliers', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const {
      search,
      isActive,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { email: { contains: search } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: {
              inventoryMovements: true,
              productSuppliers: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take
      }),
      prisma.supplier.count({ where })
    ]);

    res.json({
      suppliers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

/**
 * GET /api/inventory/suppliers/:id
 * Obtener un proveedor específico
 */
router.get('/suppliers/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        productSuppliers: {
          include: {
            // Nota: productSuppliers no tiene relación directa con Product en el modelo actual
            // Necesitaremos ajustar esto si se requiere
          }
        },
        _count: {
          select: {
            inventoryMovements: true,
            productSuppliers: true
          }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Obtener últimos movimientos
    const recentMovements = await prisma.inventoryMovement.findMany({
      where: { supplierId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        // Incluir información básica si es necesario
      }
    });

    res.json({
      supplier,
      recentMovements
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Error al obtener proveedor' });
  }
});

/**
 * POST /api/inventory/suppliers
 * Crear un nuevo proveedor
 */
router.post('/suppliers', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      code,
      email,
      phone,
      contactPerson,
      address,
      city,
      state,
      country,
      postalCode,
      taxId,
      paymentTerms,
      notes
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Nombre y código son requeridos' });
    }

    // Verificar si el código ya existe
    const existing = await prisma.supplier.findUnique({
      where: { code }
    });

    if (existing) {
      return res.status(400).json({ error: 'El código de proveedor ya existe' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        code,
        email,
        phone,
        contactPerson,
        address,
        city,
        state,
        country,
        postalCode,
        taxId,
        paymentTerms,
        notes
      }
    });

    res.status(201).json({ message: 'Proveedor creado exitosamente', supplier });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

/**
 * PUT /api/inventory/suppliers/:id
 * Actualizar un proveedor
 */
router.put('/suppliers/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      email,
      phone,
      contactPerson,
      address,
      city,
      state,
      country,
      postalCode,
      taxId,
      paymentTerms,
      notes,
      isActive
    } = req.body;

    // Si se cambia el código, verificar que no exista
    if (code) {
      const existing = await prisma.supplier.findFirst({
        where: {
          code,
          NOT: { id }
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'El código de proveedor ya existe' });
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        code,
        email,
        phone,
        contactPerson,
        address,
        city,
        state,
        country,
        postalCode,
        taxId,
        paymentTerms,
        notes,
        isActive
      }
    });

    res.json({ message: 'Proveedor actualizado exitosamente', supplier });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

/**
 * DELETE /api/inventory/suppliers/:id
 * Eliminar (desactivar) un proveedor
 */
router.delete('/suppliers/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Proveedor desactivado exitosamente', supplier });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Verificar y crear alertas de stock para un producto/variante
 */
async function checkStockAlerts(productId, variantId) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true }
    });

    if (!variant) return null;

    const product = variant.product;
    const currentStock = variant.stock;
    const minStock = product.minStock || 0;
    const reorderPoint = product.reorderPoint || 10;

    // Determinar tipo y severidad de alerta
    let alertType = null;
    let severity = null;

    if (currentStock === 0) {
      alertType = 'OUT_OF_STOCK';
      severity = 'CRITICAL';
    } else if (currentStock <= minStock) {
      alertType = 'LOW_STOCK';
      severity = 'CRITICAL';
    } else if (currentStock <= reorderPoint) {
      alertType = 'LOW_STOCK';
      severity = 'WARNING';
    }

    // Si no hay alerta, resolver alertas existentes
    if (!alertType) {
      await prisma.stockAlert.updateMany({
        where: {
          variantId,
          status: 'ACTIVE'
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolution: 'Stock restaurado automáticamente'
        }
      });
      return null;
    }

    // Verificar si ya existe una alerta activa para este variante
    const existingAlert = await prisma.stockAlert.findFirst({
      where: {
        variantId,
        status: 'ACTIVE',
        alertType
      }
    });

    if (existingAlert) {
      // Actualizar alerta existente
      return await prisma.stockAlert.update({
        where: { id: existingAlert.id },
        data: {
          currentStock,
          minStock,
          reorderPoint,
          severity
        }
      });
    }

    // Crear nueva alerta
    return await prisma.stockAlert.create({
      data: {
        productId,
        variantId,
        productName: product.name,
        variantName: variant.name,
        sku: variant.sku,
        currentStock,
        minStock,
        reorderPoint,
        alertType,
        severity,
        status: 'ACTIVE'
      }
    });
  } catch (error) {
    console.error('Error checking stock alerts:', error);
    return null;
  }
}

module.exports = router;
