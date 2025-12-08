const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const socketService = require('../services/SocketService');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/tracking/order/:orderId
 * Obtener información de tracking de un pedido (público con orderNumber)
 */
router.get('/order/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Buscar el pedido con toda la información de tracking
  const order = await prisma.order.findUnique({
    where: { id: orderId },
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
      tracking: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      delivery: {
        include: {
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
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Pedido no encontrado'
    });
  }

  // Calcular progreso del pedido
  const statusProgress = {
    'PENDING': 10,
    'CONFIRMED': 25,
    'PREPARING': 40,
    'READY': 60,
    'IN_TRANSIT': 80,
    'DELIVERED': 100,
    'CANCELLED': 0
  };

  const progress = statusProgress[order.status] || 0;

  res.json({
    success: true,
    data: {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        progress,
        createdAt: order.createdAt,
        total: order.total,
        shippingAddress: order.shippingAddress,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        items: order.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          variantName: item.variant?.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.product.imageUrl
        }))
      },
      tracking: order.tracking,
      delivery: order.delivery ? {
        id: order.delivery.id,
        status: order.delivery.status,
        driver: order.delivery.driver,
        estimatedTime: order.delivery.estimatedTime,
        currentLocation: order.delivery.currentLat && order.delivery.currentLng ? {
          lat: order.delivery.currentLat,
          lng: order.delivery.currentLng
        } : null,
        distance: order.delivery.distance,
        notes: order.delivery.notes
      } : null,
      customer: {
        name: order.user.name,
        phone: order.user.phone
      }
    }
  });
}));

/**
 * GET /api/tracking/order-by-number/:orderNumber
 * Obtener tracking por número de pedido (para clientes sin autenticación)
 */
router.get('/order-by-number/:orderNumber', asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;

  const order = await prisma.order.findFirst({
    where: { orderNumber },
    include: {
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
      tracking: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      delivery: {
        include: {
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
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Pedido no encontrado'
    });
  }

  const statusProgress = {
    'PENDING': 10,
    'CONFIRMED': 25,
    'PREPARING': 40,
    'READY': 60,
    'IN_TRANSIT': 80,
    'DELIVERED': 100,
    'CANCELLED': 0
  };

  const progress = statusProgress[order.status] || 0;

  res.json({
    success: true,
    data: {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        progress,
        createdAt: order.createdAt,
        total: order.total,
        shippingAddress: order.shippingAddress,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        items: order.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          variantName: item.variant?.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.product.imageUrl
        }))
      },
      tracking: order.tracking,
      delivery: order.delivery ? {
        id: order.delivery.id,
        status: order.delivery.status,
        driver: order.delivery.driver,
        estimatedTime: order.delivery.estimatedTime,
        currentLocation: order.delivery.currentLat && order.delivery.currentLng ? {
          lat: order.delivery.currentLat,
          lng: order.delivery.currentLng
        } : null,
        distance: order.delivery.distance
      } : null
    }
  });
}));

/**
 * GET /api/tracking/my-orders
 * Obtener pedidos del usuario autenticado con tracking
 */
router.get('/my-orders', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
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
      tracking: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      },
      delivery: {
        select: {
          id: true,
          status: true,
          estimatedTime: true,
          currentLat: true,
          currentLng: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });

  const statusProgress = {
    'PENDING': 10,
    'CONFIRMED': 25,
    'PREPARING': 40,
    'READY': 60,
    'IN_TRANSIT': 80,
    'DELIVERED': 100,
    'CANCELLED': 0
  };

  const ordersWithProgress = orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    progress: statusProgress[order.status] || 0,
    createdAt: order.createdAt,
    total: order.total,
    itemCount: order.items.length,
    latestTracking: order.tracking[0] || null,
    delivery: order.delivery,
    items: order.items
  }));

  res.json({
    success: true,
    data: ordersWithProgress
  });
}));

/**
 * POST /api/tracking/add-event
 * Agregar evento de tracking (solo admin)
 */
router.post('/add-event', authMiddleware, asyncHandler(async (req, res) => {
  const { orderId, status, message, metadata } = req.body;

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'No autorizado'
    });
  }

  const tracking = await prisma.orderTracking.create({
    data: {
      orderId,
      status,
      message: message || '',
      metadata: metadata ? JSON.stringify(metadata) : null
    }
  });

  // Notificar al cliente vía WebSocket
  socketService.notifyOrderStatusUpdate(orderId, status, {
    message,
    metadata
  });

  res.json({
    success: true,
    data: tracking
  });
}));

/**
 * PUT /api/tracking/update-location
 * Actualizar ubicación del repartidor (solo drivers)
 */
router.put('/update-location', authMiddleware, asyncHandler(async (req, res) => {
  const { deliveryId, latitude, longitude } = req.body;

  if (req.user.role !== 'DRIVER') {
    return res.status(403).json({
      success: false,
      message: 'Solo repartidores pueden actualizar ubicación'
    });
  }

  const delivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      currentLat: latitude,
      currentLng: longitude,
      updatedAt: new Date()
    },
    include: {
      order: true
    }
  });

  // Notificar vía WebSocket
  socketService.io.to(`order_${delivery.orderId}`).emit('driver_location_updated', {
    deliveryId,
    latitude,
    longitude,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    data: {
      deliveryId: delivery.id,
      location: {
        lat: delivery.currentLat,
        lng: delivery.currentLng
      }
    }
  });
}));

module.exports = router;
