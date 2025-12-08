const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireRole, authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const socketService = require('../services/SocketService');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/delivery/my-deliveries
 * Obtener entregas asignadas al repartidor autenticado
 */
router.get('/my-deliveries', authMiddleware, requireRole('DRIVER'), asyncHandler(async (req, res) => {
  const driverId = req.user.id;
  const { status } = req.query;

  const where = {
    driverId
  };

  if (status) {
    where.status = status;
  }

  const deliveries = await prisma.delivery.findMany({
    where,
    include: {
      order: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
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
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Parsear direcciones de envío
  const deliveriesFormatted = deliveries.map(delivery => {
    let shippingAddress = {};
    try {
      shippingAddress = typeof delivery.order.shippingAddress === 'string' 
        ? JSON.parse(delivery.order.shippingAddress)
        : delivery.order.shippingAddress;
    } catch (e) {
      shippingAddress = delivery.order.shippingAddress;
    }

    return {
      id: delivery.id,
      status: delivery.status,
      estimatedTime: delivery.estimatedTime,
      actualTime: delivery.actualTime,
      distance: delivery.distance,
      currentLocation: delivery.currentLat && delivery.currentLng ? {
        lat: delivery.currentLat,
        lng: delivery.currentLng
      } : null,
      notes: delivery.notes,
      rating: delivery.rating,
      feedback: delivery.feedback,
      createdAt: delivery.createdAt,
      order: {
        id: delivery.order.id,
        orderNumber: delivery.order.orderNumber,
        status: delivery.order.status,
        total: delivery.order.total,
        shippingAddress,
        customer: delivery.order.user,
        items: delivery.order.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          variantName: item.variant?.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.product.imageUrl
        }))
      }
    };
  });

  res.json({
    success: true,
    data: deliveriesFormatted
  });
}));

/**
 * GET /api/delivery/:id
 * Obtener detalles de una entrega específica
 */
router.get('/:id', authMiddleware, requireRole('DRIVER'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const driverId = req.user.id;

  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      driverId
    },
    include: {
      order: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  description: true
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
          }
        }
      }
    }
  });

  if (!delivery) {
    return res.status(404).json({
      success: false,
      message: 'Entrega no encontrada'
    });
  }

  let shippingAddress = {};
  try {
    shippingAddress = typeof delivery.order.shippingAddress === 'string' 
      ? JSON.parse(delivery.order.shippingAddress)
      : delivery.order.shippingAddress;
  } catch (e) {
    shippingAddress = delivery.order.shippingAddress;
  }

  res.json({
    success: true,
    data: {
      id: delivery.id,
      status: delivery.status,
      estimatedTime: delivery.estimatedTime,
      actualTime: delivery.actualTime,
      distance: delivery.distance,
      route: delivery.route ? JSON.parse(delivery.route) : null,
      currentLocation: delivery.currentLat && delivery.currentLng ? {
        lat: delivery.currentLat,
        lng: delivery.currentLng
      } : null,
      notes: delivery.notes,
      rating: delivery.rating,
      feedback: delivery.feedback,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
      order: {
        id: delivery.order.id,
        orderNumber: delivery.order.orderNumber,
        status: delivery.order.status,
        total: delivery.order.total,
        subtotal: delivery.order.subtotal,
        tax: delivery.order.tax,
        shippingCost: delivery.order.shippingCost,
        paymentMethod: delivery.order.paymentMethod,
        paymentStatus: delivery.order.paymentStatus,
        shippingAddress,
        specialInstructions: delivery.order.specialInstructions,
        customer: delivery.order.user,
        items: delivery.order.items,
        tracking: delivery.order.tracking
      }
    }
  });
}));

/**
 * PUT /api/delivery/:id/status
 * Actualizar estado de la entrega
 */
router.put('/:id/status', authMiddleware, requireRole('DRIVER'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const driverId = req.user.id;

  const validStatuses = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Estado inválido'
    });
  }

  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      driverId
    },
    include: {
      order: true
    }
  });

  if (!delivery) {
    return res.status(404).json({
      success: false,
      message: 'Entrega no encontrada'
    });
  }

  // Actualizar delivery
  const updateData = {
    status,
    updatedAt: new Date()
  };

  if (notes) {
    updateData.notes = notes;
  }

  if (status === 'DELIVERED') {
    updateData.actualTime = new Date();
  }

  const updatedDelivery = await prisma.delivery.update({
    where: { id },
    data: updateData
  });

  // Actualizar estado del pedido según el estado de delivery
  let newOrderStatus = delivery.order.status;
  
  if (status === 'PICKED_UP' && delivery.order.status === 'READY') {
    newOrderStatus = 'IN_TRANSIT';
  } else if (status === 'IN_TRANSIT' && delivery.order.status === 'READY') {
    newOrderStatus = 'IN_TRANSIT';
  } else if (status === 'DELIVERED') {
    newOrderStatus = 'DELIVERED';
  }

  if (newOrderStatus !== delivery.order.status) {
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: { status: newOrderStatus }
    });

    // Crear evento de tracking
    await prisma.orderTracking.create({
      data: {
        orderId: delivery.orderId,
        status: newOrderStatus,
        message: `Pedido ${newOrderStatus === 'DELIVERED' ? 'entregado' : 'en camino'}`,
        metadata: JSON.stringify({ deliveryStatus: status })
      }
    });
  }

  // Notificar al cliente vía WebSocket
  socketService.notifyOrderStatusUpdate(delivery.orderId, newOrderStatus, {
    deliveryStatus: status,
    notes
  });

  res.json({
    success: true,
    data: {
      delivery: updatedDelivery,
      orderStatus: newOrderStatus
    }
  });
}));

/**
 * PUT /api/delivery/:id/location
 * Actualizar ubicación actual del repartidor
 */
router.put('/:id/location', authMiddleware, requireRole('DRIVER'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude, accuracy } = req.body;
  const driverId = req.user.id;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitud y longitud son requeridas'
    });
  }

  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      driverId
    }
  });

  if (!delivery) {
    return res.status(404).json({
      success: false,
      message: 'Entrega no encontrada'
    });
  }

  const updatedDelivery = await prisma.delivery.update({
    where: { id },
    data: {
      currentLat: latitude,
      currentLng: longitude,
      updatedAt: new Date()
    }
  });

  // Notificar vía WebSocket
  socketService.io.to(`order_${delivery.orderId}`).emit('driver_location_updated', {
    deliveryId: id,
    latitude,
    longitude,
    accuracy,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    data: {
      deliveryId: updatedDelivery.id,
      location: {
        lat: updatedDelivery.currentLat,
        lng: updatedDelivery.currentLng
      }
    }
  });
}));

/**
 * POST /api/delivery/:id/complete
 * Marcar entrega como completada con calificación opcional
 */
router.post('/:id/complete', authMiddleware, requireRole('DRIVER'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes, photoUrl } = req.body;
  const driverId = req.user.id;

  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      driverId
    },
    include: {
      order: true
    }
  });

  if (!delivery) {
    return res.status(404).json({
      success: false,
      message: 'Entrega no encontrada'
    });
  }

  if (delivery.status === 'DELIVERED') {
    return res.status(400).json({
      success: false,
      message: 'La entrega ya fue completada'
    });
  }

  // Actualizar delivery
  const updatedDelivery = await prisma.delivery.update({
    where: { id },
    data: {
      status: 'DELIVERED',
      actualTime: new Date(),
      notes: notes || delivery.notes
    }
  });

  // Actualizar pedido
  await prisma.order.update({
    where: { id: delivery.orderId },
    data: {
      status: 'DELIVERED'
    }
  });

  // Crear evento de tracking
  await prisma.orderTracking.create({
    data: {
      orderId: delivery.orderId,
      status: 'DELIVERED',
      message: 'Pedido entregado exitosamente',
      metadata: JSON.stringify({
        deliveredBy: req.user.name,
        deliveredAt: new Date(),
        notes,
        photoUrl
      })
    }
  });

  // Notificar al cliente
  socketService.notifyOrderStatusUpdate(delivery.orderId, 'DELIVERED', {
    deliveryId: id,
    deliveredAt: new Date(),
    notes
  });

  res.json({
    success: true,
    data: updatedDelivery,
    message: 'Entrega completada exitosamente'
  });
}));

/**
 * GET /api/delivery/stats
 * Obtener estadísticas del repartidor
 */
router.get('/stats/overview', authMiddleware, requireRole('DRIVER'), asyncHandler(async (req, res) => {
  const driverId = req.user.id;

  const [
    totalDeliveries,
    completedDeliveries,
    pendingDeliveries,
    avgRating
  ] = await Promise.all([
    prisma.delivery.count({
      where: { driverId }
    }),
    prisma.delivery.count({
      where: { driverId, status: 'DELIVERED' }
    }),
    prisma.delivery.count({
      where: {
        driverId,
        status: {
          in: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
        }
      }
    }),
    prisma.delivery.aggregate({
      where: {
        driverId,
        rating: { not: null }
      },
      _avg: {
        rating: true
      }
    })
  ]);

  // Entregas de hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayDeliveries = await prisma.delivery.count({
    where: {
      driverId,
      createdAt: {
        gte: today
      }
    }
  });

  res.json({
    success: true,
    data: {
      total: totalDeliveries,
      completed: completedDeliveries,
      pending: pendingDeliveries,
      today: todayDeliveries,
      averageRating: avgRating._avg.rating || 0
    }
  });
}));

module.exports = router;
