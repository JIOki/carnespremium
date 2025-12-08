const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Intentar cargar firebase-admin de manera opcional
let admin = null;
try {
  admin = require('firebase-admin');
} catch (error) {
  console.warn('⚠️ firebase-admin no instalado. Las notificaciones push no funcionarán.');
}

// ==================== INICIALIZAR FIREBASE ADMIN ====================

let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;
  
  if (!admin) {
    console.warn('⚠️ firebase-admin no disponible. Las notificaciones push están deshabilitadas.');
    return;
  }
  
  try {
    // Configuración de Firebase Admin SDK
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;
    
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK inicializado correctamente');
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT no configurado. Las notificaciones push no funcionarán.');
    }
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error.message);
  }
}

initializeFirebase();

// ==================== HELPERS ====================

/**
 * Enviar notificación push via FCM
 */
async function sendPushNotification(userId, notification) {
  if (!firebaseInitialized) {
    console.warn('Firebase no inicializado. Omitiendo push notification.');
    return { success: false, error: 'Firebase no configurado' };
  }

  try {
    // Obtener tokens FCM activos del usuario
    const tokens = await prisma.fCMToken.findMany({
      where: {
        userId: userId,
        isActive: true
      },
      select: { token: true }
    });

    if (tokens.length === 0) {
      return { success: false, error: 'No hay tokens FCM registrados' };
    }

    const tokenList = tokens.map(t => t.token);

    // Construir mensaje FCM
    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
        ...(notification.imageUrl && { image: notification.imageUrl })
      },
      data: {
        notificationId: notification.id,
        type: notification.type,
        ...(notification.actionUrl && { actionUrl: notification.actionUrl }),
        ...(notification.actionType && { actionType: notification.actionType }),
        ...(notification.data && { data: notification.data })
      },
      webpush: notification.actionUrl ? {
        fcmOptions: {
          link: notification.actionUrl
        }
      } : undefined
    };

    // Enviar a múltiples tokens
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokenList,
      ...message
    });

    // Desactivar tokens que fallaron
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && tokenList[idx]) {
          failedTokens.push(tokenList[idx]);
        }
      });

      if (failedTokens.length > 0) {
        await prisma.fCMToken.updateMany({
          where: { token: { in: failedTokens } },
          data: { isActive: false }
        });
      }
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };

  } catch (error) {
    console.error('Error enviando push notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar preferencias de usuario para envío
 */
async function shouldSendNotification(userId, notificationType) {
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId }
  });

  if (!preferences) {
    return true; // Si no hay preferencias, enviar por defecto
  }

  // Verificar si el tipo está habilitado
  const typeMapping = {
    'ORDER': preferences.enableOrder,
    'DELIVERY': preferences.enableDelivery,
    'PROMO': preferences.enablePromo,
    'REVIEW': preferences.enableReview,
    'SYSTEM': preferences.enableSystem,
    'WISHLIST': preferences.enableWishlist
  };

  if (!typeMapping[notificationType]) {
    return false;
  }

  // Verificar horario de no molestar
  if (preferences.enableQuietHours && preferences.quietHoursStart && preferences.quietHoursEnd) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = preferences.quietHoursStart;
    const end = preferences.quietHoursEnd;

    // Verificar si estamos en horario de no molestar
    if (start <= end) {
      if (currentTime >= start && currentTime <= end) {
        return false;
      }
    } else {
      // Caso especial: horario que cruza medianoche (ej: 22:00 a 08:00)
      if (currentTime >= start || currentTime <= end) {
        return false;
      }
    }
  }

  return preferences.enablePush || preferences.enableEmail || preferences.enableSMS;
}

/**
 * Crear notificación y opcionalmente enviar push
 */
async function createAndSendNotification(data) {
  const {
    userId,
    type,
    title,
    message,
    data: notificationData,
    actionUrl,
    actionType,
    priority = 'NORMAL',
    imageUrl,
    sendPush = true
  } = data;

  // Verificar preferencias
  const shouldSend = await shouldSendNotification(userId, type);
  if (!shouldSend) {
    return { success: false, message: 'Usuario tiene deshabilitadas las notificaciones de este tipo' };
  }

  // Crear notificación
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: notificationData ? JSON.stringify(notificationData) : null,
      actionUrl,
      actionType,
      priority,
      imageUrl,
      sentVia: sendPush ? 'BOTH' : 'IN_APP'
    }
  });

  // Enviar push si está habilitado
  let pushResult = null;
  if (sendPush) {
    pushResult = await sendPushNotification(userId, notification);
    
    if (pushResult.success) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          isPushed: true,
          pushedAt: new Date()
        }
      });
    }
  }

  return {
    success: true,
    notification,
    pushResult
  };
}

// ==================== RUTAS PÚBLICAS (USUARIO) ====================

/**
 * GET /api/notification
 * Obtener notificaciones del usuario actual
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      isRead,
      priority 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId };
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (priority) where.priority = priority;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener notificaciones'
    });
  }
});

/**
 * GET /api/notification/unread-count
 * Obtener contador de notificaciones no leídas
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Error obteniendo contador:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener contador'
    });
  }
});

/**
 * PUT /api/notification/:id/read
 * Marcar notificación como leída
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que la notificación pertenece al usuario
    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notificación no encontrada'
      });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('Error marcando como leída:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar notificación como leída'
    });
  }
});

/**
 * PUT /api/notification/read-all
 * Marcar todas las notificaciones como leídas
 */
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      count: result.count
    });

  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar todas como leídas'
    });
  }
});

/**
 * DELETE /api/notification/:id
 * Eliminar notificación
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que la notificación pertenece al usuario
    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notificación no encontrada'
      });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Notificación eliminada'
    });

  } catch (error) {
    console.error('Error eliminando notificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar notificación'
    });
  }
});

/**
 * DELETE /api/notification/clear-all
 * Eliminar todas las notificaciones leídas
 */
router.delete('/clear-all', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true
      }
    });

    res.json({
      success: true,
      count: result.count,
      message: 'Notificaciones eliminadas'
    });

  } catch (error) {
    console.error('Error eliminando notificaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar notificaciones'
    });
  }
});

// ==================== RUTAS DE PREFERENCIAS ====================

/**
 * GET /api/notification/preferences
 * Obtener preferencias de notificación del usuario
 */
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    // Si no existen preferencias, crear valores por defecto
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { userId }
      });
    }

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('Error obteniendo preferencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener preferencias'
    });
  }
});

/**
 * PUT /api/notification/preferences
 * Actualizar preferencias de notificación
 */
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      enableOrder,
      enableDelivery,
      enablePromo,
      enableReview,
      enableSystem,
      enableWishlist,
      enablePush,
      enableEmail,
      enableSMS,
      quietHoursStart,
      quietHoursEnd,
      enableQuietHours,
      digestMode
    } = req.body;

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        enableOrder,
        enableDelivery,
        enablePromo,
        enableReview,
        enableSystem,
        enableWishlist,
        enablePush,
        enableEmail,
        enableSMS,
        quietHoursStart,
        quietHoursEnd,
        enableQuietHours,
        digestMode
      },
      update: {
        enableOrder,
        enableDelivery,
        enablePromo,
        enableReview,
        enableSystem,
        enableWishlist,
        enablePush,
        enableEmail,
        enableSMS,
        quietHoursStart,
        quietHoursEnd,
        enableQuietHours,
        digestMode
      }
    });

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('Error actualizando preferencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar preferencias'
    });
  }
});

// ==================== RUTAS FCM TOKENS ====================

/**
 * POST /api/notification/fcm-token
 * Registrar token FCM para notificaciones push
 */
router.post('/fcm-token', async (req, res) => {
  try {
    const userId = req.user.id;
    const { token, deviceInfo, platform = 'WEB' } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token es requerido'
      });
    }

    // Buscar si el token ya existe
    const existing = await prisma.fCMToken.findUnique({
      where: { token }
    });

    let fcmToken;

    if (existing) {
      // Actualizar token existente
      fcmToken = await prisma.fCMToken.update({
        where: { token },
        data: {
          userId, // Reasignar al nuevo usuario si cambió
          deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
          platform,
          isActive: true,
          lastUsedAt: new Date()
        }
      });
    } else {
      // Crear nuevo token
      fcmToken = await prisma.fCMToken.create({
        data: {
          userId,
          token,
          deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
          platform,
          isActive: true
        }
      });
    }

    res.json({
      success: true,
      data: fcmToken
    });

  } catch (error) {
    console.error('Error registrando token FCM:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar token'
    });
  }
});

/**
 * DELETE /api/notification/fcm-token/:token
 * Eliminar token FCM (al cerrar sesión o denegar permisos)
 */
router.delete('/fcm-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    // Verificar que el token pertenece al usuario
    const fcmToken = await prisma.fCMToken.findFirst({
      where: { token, userId }
    });

    if (!fcmToken) {
      return res.status(404).json({
        success: false,
        error: 'Token no encontrado'
      });
    }

    await prisma.fCMToken.delete({
      where: { token }
    });

    res.json({
      success: true,
      message: 'Token eliminado'
    });

  } catch (error) {
    console.error('Error eliminando token FCM:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar token'
    });
  }
});

/**
 * GET /api/notification/fcm-tokens
 * Obtener tokens FCM del usuario actual
 */
router.get('/fcm-tokens', async (req, res) => {
  try {
    const userId = req.user.id;

    const tokens = await prisma.fCMToken.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' }
    });

    res.json({
      success: true,
      data: tokens
    });

  } catch (error) {
    console.error('Error obteniendo tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tokens'
    });
  }
});

// ==================== RUTAS ADMIN ====================

/**
 * POST /api/notification/admin/send
 * Enviar notificación a un usuario específico (solo admin)
 */
router.post('/admin/send', async (req, res) => {
  try {
    // Verificar que el usuario es admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción'
      });
    }

    const {
      userId,
      type,
      title,
      message,
      data,
      actionUrl,
      actionType,
      priority,
      imageUrl,
      sendPush = true
    } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId, type, title y message son requeridos'
      });
    }

    const result = await createAndSendNotification({
      userId,
      type,
      title,
      message,
      data,
      actionUrl,
      actionType,
      priority,
      imageUrl,
      sendPush
    });

    res.json(result);

  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar notificación'
    });
  }
});

/**
 * POST /api/notification/admin/broadcast
 * Envío masivo de notificaciones (solo admin)
 */
router.post('/admin/broadcast', async (req, res) => {
  try {
    // Verificar que el usuario es admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción'
      });
    }

    const {
      targetAudience = 'ALL', // ALL, CUSTOMERS, DRIVERS, SEGMENT
      userIds, // Array de IDs si targetAudience es SEGMENT
      type,
      title,
      message,
      data,
      actionUrl,
      actionType,
      priority,
      imageUrl,
      sendPush = true
    } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'type, title y message son requeridos'
      });
    }

    // Determinar usuarios destino
    let targetUsers = [];

    if (targetAudience === 'ALL') {
      targetUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      });
    } else if (targetAudience === 'CUSTOMERS') {
      targetUsers = await prisma.user.findMany({
        where: { role: 'CUSTOMER', isActive: true },
        select: { id: true }
      });
    } else if (targetAudience === 'DRIVERS') {
      targetUsers = await prisma.user.findMany({
        where: { role: 'DRIVER', isActive: true },
        select: { id: true }
      });
    } else if (targetAudience === 'SEGMENT' && userIds && userIds.length > 0) {
      targetUsers = await prisma.user.findMany({
        where: { id: { in: userIds }, isActive: true },
        select: { id: true }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'targetAudience inválido o userIds no proporcionados'
      });
    }

    // Enviar notificaciones a todos los usuarios
    const results = {
      total: targetUsers.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const user of targetUsers) {
      try {
        await createAndSendNotification({
          userId: user.id,
          type,
          title,
          message,
          data,
          actionUrl,
          actionType,
          priority,
          imageUrl,
          sendPush
        });
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: user.id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error en broadcast:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar notificaciones masivas'
    });
  }
});

/**
 * GET /api/notification/admin/stats
 * Estadísticas de notificaciones (solo admin)
 */
router.get('/admin/stats', async (req, res) => {
  try {
    // Verificar que el usuario es admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción'
      });
    }

    const [
      totalNotifications,
      totalRead,
      totalUnread,
      totalPushed,
      byType,
      byPriority,
      recentActivity
    ] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { isRead: true } }),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.notification.count({ where: { isPushed: true } }),
      
      // Por tipo
      prisma.notification.groupBy({
        by: ['type'],
        _count: { id: true }
      }),
      
      // Por prioridad
      prisma.notification.groupBy({
        by: ['priority'],
        _count: { id: true }
      }),
      
      // Actividad reciente (últimas 24 horas)
      prisma.notification.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalNotifications,
        read: totalRead,
        unread: totalUnread,
        pushed: totalPushed,
        readRate: totalNotifications > 0 ? (totalRead / totalNotifications * 100).toFixed(2) : 0,
        pushRate: totalNotifications > 0 ? (totalPushed / totalNotifications * 100).toFixed(2) : 0,
        byType: byType.map(item => ({
          type: item.type,
          count: item._count.id
        })),
        byPriority: byPriority.map(item => ({
          priority: item.priority,
          count: item._count.id
        })),
        last24Hours: recentActivity
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

/**
 * GET /api/notification/admin/all
 * Obtener todas las notificaciones con filtros (solo admin)
 */
router.get('/admin/all', async (req, res) => {
  try {
    // Verificar que el usuario es admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción'
      });
    }

    const {
      page = 1,
      limit = 20,
      type,
      priority,
      isRead,
      isPushed,
      userId
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (isPushed !== undefined) where.isPushed = isPushed === 'true';
    if (userId) where.userId = userId;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener notificaciones'
    });
  }
});

// ==================== RUTAS PARA TRIGGERS AUTOMÁTICOS ====================

/**
 * POST /api/notification/trigger/order-created
 * Disparar notificación cuando se crea un pedido
 */
async function triggerOrderCreated(orderId) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true
      }
    });

    if (!order) return;

    await createAndSendNotification({
      userId: order.userId,
      type: 'ORDER',
      title: '¡Pedido Recibido!',
      message: `Tu pedido #${order.orderNumber} ha sido recibido y está siendo procesado.`,
      data: { orderId: order.id, orderNumber: order.orderNumber },
      actionUrl: `/orders/${order.id}`,
      actionType: 'VIEW_ORDER',
      priority: 'HIGH',
      sendPush: true
    });

  } catch (error) {
    console.error('Error en trigger order-created:', error);
  }
}

/**
 * POST /api/notification/trigger/order-status-changed
 * Disparar notificación cuando cambia el estado del pedido
 */
async function triggerOrderStatusChanged(orderId, newStatus) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true
      }
    });

    if (!order) return;

    const statusMessages = {
      'CONFIRMED': {
        title: 'Pedido Confirmado',
        message: `Tu pedido #${order.orderNumber} ha sido confirmado.`,
        priority: 'NORMAL'
      },
      'PROCESSING': {
        title: 'Preparando tu Pedido',
        message: `Estamos preparando tu pedido #${order.orderNumber}.`,
        priority: 'NORMAL'
      },
      'READY': {
        title: 'Pedido Listo',
        message: `Tu pedido #${order.orderNumber} está listo para ser enviado.`,
        priority: 'HIGH'
      },
      'OUT_FOR_DELIVERY': {
        title: 'En Camino',
        message: `Tu pedido #${order.orderNumber} está en camino. ¡Pronto llegará!`,
        priority: 'HIGH'
      },
      'DELIVERED': {
        title: 'Pedido Entregado',
        message: `Tu pedido #${order.orderNumber} ha sido entregado. ¡Gracias por tu compra!`,
        priority: 'HIGH'
      },
      'CANCELLED': {
        title: 'Pedido Cancelado',
        message: `Tu pedido #${order.orderNumber} ha sido cancelado.`,
        priority: 'URGENT'
      }
    };

    const config = statusMessages[newStatus];
    if (!config) return;

    await createAndSendNotification({
      userId: order.userId,
      type: 'ORDER',
      title: config.title,
      message: config.message,
      data: { orderId: order.id, orderNumber: order.orderNumber, status: newStatus },
      actionUrl: `/orders/${order.id}`,
      actionType: 'VIEW_ORDER',
      priority: config.priority,
      sendPush: true
    });

  } catch (error) {
    console.error('Error en trigger order-status-changed:', error);
  }
}

/**
 * Disparar notificación para producto en wishlist con descuento
 */
async function triggerWishlistPriceAlert(userId, productId, newPrice, oldPrice) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: { isDefault: true },
          take: 1
        }
      }
    });

    if (!product) return;

    const discount = ((oldPrice - newPrice) / oldPrice * 100).toFixed(0);

    await createAndSendNotification({
      userId,
      type: 'WISHLIST',
      title: '¡Precio Rebajado! 🎉',
      message: `${product.name} ahora tiene ${discount}% de descuento. ¡No te lo pierdas!`,
      data: { productId, oldPrice, newPrice, discount },
      actionUrl: `/products/${product.slug}`,
      actionType: 'VIEW_PRODUCT',
      priority: 'HIGH',
      imageUrl: product.imageUrl,
      sendPush: true
    });

  } catch (error) {
    console.error('Error en trigger wishlist-price-alert:', error);
  }
}

/**
 * Disparar notificación para nueva reseña en producto
 */
async function triggerNewReview(reviewId) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: true,
        user: true
      }
    });

    if (!review) return;

    // Notificar al admin sobre nueva reseña pendiente de moderación
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        isActive: true
      }
    });

    for (const admin of admins) {
      await createAndSendNotification({
        userId: admin.id,
        type: 'REVIEW',
        title: 'Nueva Reseña para Moderar',
        message: `${review.user.name} dejó una reseña de ${review.rating}⭐ para ${review.product.name}`,
        data: { reviewId, productId: review.productId },
        actionUrl: `/admin/reviews`,
        actionType: 'MODERATE_REVIEW',
        priority: 'NORMAL',
        sendPush: false // No molestar a admins con push
      });
    }

  } catch (error) {
    console.error('Error en trigger new-review:', error);
  }
}

/**
 * Disparar notificación de reseña moderada
 */
async function triggerReviewModerated(reviewId, status) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: true
      }
    });

    if (!review) return;

    const messages = {
      'APPROVED': {
        title: '¡Reseña Aprobada!',
        message: `Tu reseña de ${review.product.name} ha sido aprobada y ahora es visible.`
      },
      'REJECTED': {
        title: 'Reseña No Aprobada',
        message: `Tu reseña de ${review.product.name} no cumple con nuestras políticas.`
      }
    };

    const config = messages[status];
    if (!config) return;

    await createAndSendNotification({
      userId: review.userId,
      type: 'REVIEW',
      title: config.title,
      message: config.message,
      data: { reviewId, productId: review.productId, status },
      actionUrl: `/my-reviews`,
      actionType: 'VIEW_REVIEW',
      priority: 'NORMAL',
      sendPush: true
    });

  } catch (error) {
    console.error('Error en trigger review-moderated:', error);
  }
}

// Exportar funciones de trigger para uso en otros módulos
module.exports = router;
module.exports.createAndSendNotification = createAndSendNotification;
module.exports.triggerOrderCreated = triggerOrderCreated;
module.exports.triggerOrderStatusChanged = triggerOrderStatusChanged;
module.exports.triggerWishlistPriceAlert = triggerWishlistPriceAlert;
module.exports.triggerNewReview = triggerNewReview;
module.exports.triggerReviewModerated = triggerReviewModerated;
