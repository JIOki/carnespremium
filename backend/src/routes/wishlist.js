const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware para verificar roles de admin
const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }
  next();
};

// ==================== ENDPOINTS USUARIO ====================

/**
 * GET /api/wishlist
 * Obtener wishlist del usuario actual
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      priority,
      minPrice,
      maxPrice,
      category
    } = req.query;

    // Construir filtros
    const where = { userId };
    
    // Obtener items de wishlist con productos completos
    let wishlistItems = await prisma.wishlistItem.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
            variants: {
              where: { isActive: true },
              orderBy: { isDefault: 'desc' }
            }
          }
        }
      },
      orderBy: { [sortBy]: sortOrder }
    });

    // Aplicar filtros adicionales
    if (priority) {
      wishlistItems = wishlistItems.filter(item => item.priority === priority);
    }

    if (minPrice || maxPrice) {
      wishlistItems = wishlistItems.filter(item => {
        const defaultVariant = item.product.variants.find(v => v.isDefault) || item.product.variants[0];
        const price = defaultVariant?.price || 0;
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    if (category) {
      wishlistItems = wishlistItems.filter(item => 
        item.product.categoryId === category || 
        item.product.category.slug === category
      );
    }

    // Calcular estadísticas
    const stats = {
      totalItems: wishlistItems.length,
      withPriceAlerts: wishlistItems.filter(i => i.notifyPriceChange).length,
      withAvailabilityAlerts: wishlistItems.filter(i => i.notifyAvailability).length,
      highPriority: wishlistItems.filter(i => i.priority === 'HIGH').length
    };

    // Enriquecer datos con información de precios
    const enrichedItems = wishlistItems.map(item => {
      const defaultVariant = item.product.variants.find(v => v.isDefault) || item.product.variants[0];
      const currentPrice = defaultVariant?.price || 0;
      const priceChange = item.priceWhenAdded ? 
        ((currentPrice - item.priceWhenAdded) / item.priceWhenAdded * 100).toFixed(2) : 
        null;

      return {
        ...item,
        currentPrice,
        priceChange: priceChange ? parseFloat(priceChange) : null,
        isOnSale: defaultVariant?.comparePrice && defaultVariant.comparePrice > currentPrice,
        inStock: (defaultVariant?.stock || 0) > 0
      };
    });

    res.json({
      success: true,
      data: {
        items: enrichedItems,
        stats
      }
    });

  } catch (error) {
    console.error('Error obteniendo wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la wishlist',
      error: error.message
    });
  }
});

/**
 * POST /api/wishlist
 * Agregar producto a wishlist
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      productId, 
      notifyPriceChange = false, 
      notifyAvailability = false,
      targetPrice,
      notes,
      priority = 'NORMAL'
    } = req.body;

    // Validar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { isDefault: 'desc' }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Obtener precio actual
    const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
    const currentPrice = defaultVariant?.price || 0;

    // Verificar si ya está en wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    let wishlistItem;

    if (existingItem) {
      // Actualizar item existente
      wishlistItem = await prisma.wishlistItem.update({
        where: { id: existingItem.id },
        data: {
          notifyPriceChange,
          notifyAvailability,
          targetPrice,
          notes,
          priority,
          updatedAt: new Date()
        },
        include: {
          product: {
            include: {
              category: true,
              variants: {
                where: { isActive: true }
              }
            }
          }
        }
      });
    } else {
      // Crear nuevo item
      wishlistItem = await prisma.wishlistItem.create({
        data: {
          userId,
          productId,
          priceWhenAdded: currentPrice,
          notifyPriceChange,
          notifyAvailability,
          targetPrice,
          notes,
          priority
        },
        include: {
          product: {
            include: {
              category: true,
              variants: {
                where: { isActive: true }
              }
            }
          }
        }
      });

      // Crear notificación para el usuario
      await prisma.notification.create({
        data: {
          userId,
          type: 'WISHLIST',
          title: 'Producto agregado a favoritos',
          message: `${product.name} se agregó a tu lista de deseos`,
          data: JSON.stringify({
            productId,
            action: 'ADDED_TO_WISHLIST'
          })
        }
      });
    }

    res.status(201).json({
      success: true,
      message: existingItem ? 'Producto actualizado en wishlist' : 'Producto agregado a wishlist',
      data: wishlistItem
    });

  } catch (error) {
    console.error('Error agregando a wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto a wishlist',
      error: error.message
    });
  }
});

/**
 * PUT /api/wishlist/:id
 * Actualizar configuración de un item en wishlist
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      notifyPriceChange, 
      notifyAvailability, 
      targetPrice,
      notes,
      priority 
    } = req.body;

    // Verificar que el item existe y pertenece al usuario
    const existingItem = await prisma.wishlistItem.findFirst({
      where: { id, userId }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item de wishlist no encontrado'
      });
    }

    // Actualizar
    const updated = await prisma.wishlistItem.update({
      where: { id },
      data: {
        notifyPriceChange,
        notifyAvailability,
        targetPrice,
        notes,
        priority,
        updatedAt: new Date()
      },
      include: {
        product: {
          include: {
            category: true,
            variants: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Configuración actualizada',
      data: updated
    });

  } catch (error) {
    console.error('Error actualizando wishlist item:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar item',
      error: error.message
    });
  }
});

/**
 * DELETE /api/wishlist/:id
 * Eliminar producto de wishlist (acepta wishlistItem ID o productId)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Intentar buscar primero por wishlistItem ID
    let item = await prisma.wishlistItem.findFirst({
      where: { id, userId }
    });

    // Si no se encuentra, intentar buscar por productId
    if (!item) {
      item = await prisma.wishlistItem.findFirst({
        where: { 
          productId: id,
          userId 
        }
      });
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item de wishlist no encontrado'
      });
    }

    // Eliminar
    await prisma.wishlistItem.delete({
      where: { id: item.id }
    });

    res.json({
      success: true,
      message: 'Producto eliminado de wishlist'
    });

  } catch (error) {
    console.error('Error eliminando de wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
});

/**
 * DELETE /api/wishlist
 * Limpiar toda la wishlist del usuario
 */
router.delete('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await prisma.wishlistItem.deleteMany({
      where: { userId }
    });

    res.json({
      success: true,
      message: `Se eliminaron ${result.count} productos de tu wishlist`
    });

  } catch (error) {
    console.error('Error limpiando wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar wishlist',
      error: error.message
    });
  }
});

/**
 * GET /api/wishlist/check/:productId
 * Verificar si un producto está en wishlist
 */
router.get('/check/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const item = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    res.json({
      success: true,
      data: {
        inWishlist: !!item,
        item: item || null
      }
    });

  } catch (error) {
    console.error('Error verificando wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar wishlist',
      error: error.message
    });
  }
});

/**
 * POST /api/wishlist/toggle/:productId
 * Toggle producto en wishlist (agregar o eliminar)
 */
router.post('/toggle/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Verificar si existe
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    if (existing) {
      // Eliminar
      await prisma.wishlistItem.delete({
        where: { id: existing.id }
      });

      return res.json({
        success: true,
        message: 'Producto eliminado de wishlist',
        data: { inWishlist: false }
      });
    } else {
      // Agregar
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          variants: {
            where: { isActive: true },
            orderBy: { isDefault: 'desc' }
          }
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
      const currentPrice = defaultVariant?.price || 0;

      const item = await prisma.wishlistItem.create({
        data: {
          userId,
          productId,
          priceWhenAdded: currentPrice
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Producto agregado a wishlist',
        data: { inWishlist: true, item }
      });
    }

  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar wishlist',
      error: error.message
    });
  }
});

// ==================== ALERTAS DE PRECIO ====================

/**
 * GET /api/wishlist/price-alerts
 * Obtener alertas de precio del usuario
 */
router.get('/price-alerts', async (req, res) => {
  try {
    const userId = req.user.id;
    const { notified } = req.query;

    const where = { userId };
    if (notified !== undefined) {
      where.notified = notified === 'true';
    }

    const alerts = await prisma.wishlistPriceAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas',
      error: error.message
    });
  }
});

/**
 * PUT /api/wishlist/price-alerts/:id/mark-read
 * Marcar alerta como notificada
 */
router.put('/price-alerts/:id/mark-read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const alert = await prisma.wishlistPriceAlert.findFirst({
      where: { id, userId }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    const updated = await prisma.wishlistPriceAlert.update({
      where: { id },
      data: {
        notified: true,
        notifiedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('Error marcando alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar alerta',
      error: error.message
    });
  }
});

// ==================== COMPARTIR WISHLIST ====================

/**
 * POST /api/wishlist/share
 * Crear enlace para compartir wishlist
 */
router.post('/share', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      title, 
      description, 
      isPublic = false, 
      allowCopy = true,
      expiresIn // en días
    } = req.body;

    // Generar token único
    const shareToken = require('crypto').randomBytes(16).toString('hex');

    // Calcular fecha de expiración
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
    }

    const sharedWishlist = await prisma.sharedWishlist.create({
      data: {
        ownerId: userId,
        shareToken,
        title,
        description,
        isPublic,
        allowCopy,
        expiresAt
      }
    });

    // Generar URL completa
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wishlist/shared/${shareToken}`;

    res.status(201).json({
      success: true,
      message: 'Wishlist compartida exitosamente',
      data: {
        ...sharedWishlist,
        shareUrl
      }
    });

  } catch (error) {
    console.error('Error compartiendo wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al compartir wishlist',
      error: error.message
    });
  }
});

/**
 * GET /api/wishlist/share/:token
 * Obtener wishlist compartida por token
 */
router.get('/share/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const sharedWishlist = await prisma.sharedWishlist.findUnique({
      where: { shareToken: token }
    });

    if (!sharedWishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist compartida no encontrada'
      });
    }

    // Verificar si expiró
    if (sharedWishlist.expiresAt && new Date() > sharedWishlist.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'Este enlace ha expirado'
      });
    }

    // Incrementar contador de vistas
    await prisma.sharedWishlist.update({
      where: { id: sharedWishlist.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date()
      }
    });

    // Obtener items de wishlist del owner
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: sharedWishlist.ownerId },
      include: {
        product: {
          include: {
            category: true,
            variants: {
              where: { isActive: true },
              orderBy: { isDefault: 'desc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Obtener info del owner (sin datos sensibles)
    const owner = await prisma.user.findUnique({
      where: { id: sharedWishlist.ownerId },
      select: {
        id: true,
        name: true
      }
    });

    res.json({
      success: true,
      data: {
        sharedWishlist: {
          ...sharedWishlist,
          owner
        },
        items: wishlistItems
      }
    });

  } catch (error) {
    console.error('Error obteniendo wishlist compartida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener wishlist',
      error: error.message
    });
  }
});

/**
 * GET /api/wishlist/my-shares
 * Obtener enlaces compartidos del usuario
 */
router.get('/my-shares', async (req, res) => {
  try {
    const userId = req.user.id;

    const shares = await prisma.sharedWishlist.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // Enriquecer con URLs
    const enrichedShares = shares.map(share => ({
      ...share,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wishlist/shared/${share.shareToken}`,
      isExpired: share.expiresAt && new Date() > share.expiresAt
    }));

    res.json({
      success: true,
      data: enrichedShares
    });

  } catch (error) {
    console.error('Error obteniendo shares:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener enlaces compartidos',
      error: error.message
    });
  }
});

/**
 * DELETE /api/wishlist/share/:id
 * Eliminar enlace compartido
 */
router.delete('/share/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const share = await prisma.sharedWishlist.findFirst({
      where: { id, ownerId: userId }
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Enlace compartido no encontrado'
      });
    }

    await prisma.sharedWishlist.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Enlace compartido eliminado'
    });

  } catch (error) {
    console.error('Error eliminando share:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar enlace',
      error: error.message
    });
  }
});

// ==================== ENDPOINTS ADMIN ====================

/**
 * GET /api/wishlist/admin/stats
 * Obtener estadísticas generales de wishlist
 */
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Estadísticas generales
    const totalItems = await prisma.wishlistItem.count();
    const totalUsers = await prisma.wishlistItem.groupBy({
      by: ['userId']
    }).then(groups => groups.length);

    const recentItems = await prisma.wishlistItem.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    const withPriceAlerts = await prisma.wishlistItem.count({
      where: { notifyPriceChange: true }
    });

    const withAvailabilityAlerts = await prisma.wishlistItem.count({
      where: { notifyAvailability: true }
    });

    // Productos más deseados
    const mostWishlisted = await prisma.wishlistItem.groupBy({
      by: ['productId'],
      _count: {
        productId: true
      },
      orderBy: {
        _count: {
          productId: 'desc'
        }
      },
      take: 20
    });

    // Obtener detalles de productos más deseados
    const productIds = mostWishlisted.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: { isDefault: 'desc' }
        }
      }
    });

    const mostWishlistedWithDetails = mostWishlisted.map(item => {
      const product = products.find(p => p.id === item.productId);
      const defaultVariant = product?.variants.find(v => v.isDefault) || product?.variants[0];
      
      return {
        productId: item.productId,
        count: item._count.productId,
        product: product ? {
          id: product.id,
          name: product.name,
          slug: product.slug,
          imageUrl: product.imageUrl,
          category: product.category.name,
          price: defaultVariant?.price || 0,
          inStock: (defaultVariant?.stock || 0) > 0
        } : null
      };
    });

    // Categorías más deseadas
    const categoryStats = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        COUNT(w.id) as wishlist_count
      FROM wishlist_items w
      JOIN products p ON w.productId = p.id
      JOIN categories c ON p.categoryId = c.id
      GROUP BY c.id, c.name
      ORDER BY wishlist_count DESC
      LIMIT 10
    `;

    // Tendencias por día (últimos 30 días)
    const dailyTrends = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM wishlist_items
      WHERE createdAt >= datetime('now', '-30 days')
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    res.json({
      success: true,
      data: {
        overview: {
          totalItems,
          totalUsers,
          recentItems,
          withPriceAlerts,
          withAvailabilityAlerts,
          avgItemsPerUser: totalUsers > 0 ? (totalItems / totalUsers).toFixed(2) : 0
        },
        mostWishlisted: mostWishlistedWithDetails,
        categoryStats,
        dailyTrends
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

/**
 * GET /api/wishlist/admin/products/:productId/stats
 * Obtener estadísticas de wishlist para un producto específico
 */
router.get('/admin/products/:productId/stats', requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        variants: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const wishlistCount = await prisma.wishlistItem.count({
      where: { productId }
    });

    const withPriceAlerts = await prisma.wishlistItem.count({
      where: {
        productId,
        notifyPriceChange: true
      }
    });

    const withAvailabilityAlerts = await prisma.wishlistItem.count({
      where: {
        productId,
        notifyAvailability: true
      }
    });

    // Tendencia de agregados por día (últimos 30 días)
    const addTrend = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM wishlist_items
      WHERE productId = ${productId}
        AND createdAt >= datetime('now', '-30 days')
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    res.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          category: product.category.name
        },
        stats: {
          wishlistCount,
          withPriceAlerts,
          withAvailabilityAlerts,
          alertPercentage: wishlistCount > 0 ? 
            ((withPriceAlerts / wishlistCount) * 100).toFixed(2) : 0
        },
        addTrend
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

/**
 * POST /api/wishlist/admin/notify-price-changes
 * Proceso para detectar y notificar cambios de precio
 * (Este endpoint debería ser llamado por un cron job)
 */
router.post('/admin/notify-price-changes', requireAdmin, async (req, res) => {
  try {
    // Obtener todos los items con notificación de precio activada
    const itemsWithAlerts = await prisma.wishlistItem.findMany({
      where: {
        notifyPriceChange: true,
        priceWhenAdded: { not: null }
      },
      include: {
        product: {
          include: {
            variants: {
              where: { isActive: true },
              orderBy: { isDefault: 'desc' }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    const notifications = [];
    const alerts = [];

    for (const item of itemsWithAlerts) {
      const defaultVariant = item.product.variants.find(v => v.isDefault) || item.product.variants[0];
      const currentPrice = defaultVariant?.price || 0;
      const previousPrice = item.priceWhenAdded;

      // Verificar si hay cambio significativo (más de 1%)
      const changePercent = ((currentPrice - previousPrice) / previousPrice * 100);
      
      if (Math.abs(changePercent) >= 1) {
        // Si hay precio objetivo, verificar si se alcanzó
        const shouldNotify = !item.targetPrice || currentPrice <= item.targetPrice;

        if (shouldNotify) {
          // Crear notificación
          const notification = await prisma.notification.create({
            data: {
              userId: item.userId,
              type: 'WISHLIST',
              title: changePercent < 0 ? '¡Bajó de precio!' : 'Cambio de precio',
              message: `${item.product.name} ${changePercent < 0 ? 'bajó' : 'subió'} ${Math.abs(changePercent).toFixed(1)}% - Ahora: $${currentPrice.toFixed(2)}`,
              data: JSON.stringify({
                productId: item.productId,
                previousPrice,
                currentPrice,
                changePercent: changePercent.toFixed(2)
              }),
              priority: Math.abs(changePercent) >= 20 ? 'HIGH' : 'NORMAL'
            }
          });

          // Registrar alerta de precio
          const alert = await prisma.wishlistPriceAlert.create({
            data: {
              userId: item.userId,
              productId: item.productId,
              previousPrice,
              newPrice: currentPrice,
              changePercent
            }
          });

          // Actualizar precio en wishlist
          await prisma.wishlistItem.update({
            where: { id: item.id },
            data: { priceWhenAdded: currentPrice }
          });

          notifications.push(notification);
          alerts.push(alert);
        }
      }
    }

    res.json({
      success: true,
      message: `Se procesaron ${itemsWithAlerts.length} items. Se crearon ${notifications.length} notificaciones.`,
      data: {
        processed: itemsWithAlerts.length,
        notificationsSent: notifications.length,
        alertsCreated: alerts.length
      }
    });

  } catch (error) {
    console.error('Error notificando cambios de precio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar cambios de precio',
      error: error.message
    });
  }
});

module.exports = router;
