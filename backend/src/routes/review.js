const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { triggerNewReview, triggerReviewModerated } = require('./notification');

// ==================== MIDDLEWARE DE ROLES ====================

const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

// ==================== RUTAS PÚBLICAS ====================

/**
 * GET /api/review/product/:productId
 * Obtener todas las reseñas aprobadas de un producto con filtros y ordenamiento
 */
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { 
      rating, // Filtro por calificación (1-5)
      verified, // Filtro por compra verificada (true/false)
      sortBy = 'recent', // recent, helpful, rating_high, rating_low
      page = 1,
      limit = 10
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construir filtros
    const where = {
      productId,
      status: 'APPROVED'
    };

    if (rating) {
      where.rating = parseInt(rating);
    }

    if (verified === 'true') {
      where.isVerifiedPurchase = true;
    }

    // Construir ordenamiento
    let orderBy = {};
    switch (sortBy) {
      case 'helpful':
        orderBy = { helpfulCount: 'desc' };
        break;
      case 'rating_high':
        orderBy = { rating: 'desc' };
        break;
      case 'rating_low':
        orderBy = { rating: 'asc' };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Obtener reseñas
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          images: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.review.count({ where })
    ]);

    // Calcular estadísticas del producto
    const stats = await prisma.review.aggregate({
      where: {
        productId,
        status: 'APPROVED'
      },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    });

    // Distribución de calificaciones
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId,
        status: 'APPROVED'
      },
      _count: {
        rating: true
      }
    });

    const distribution = [1, 2, 3, 4, 5].map(rating => {
      const found = ratingDistribution.find(r => r.rating === rating);
      return {
        rating,
        count: found ? found._count.rating : 0
      };
    });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.id,
        distribution
      }
    });
  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});

/**
 * GET /api/review/product/:productId/summary
 * Obtener resumen de estadísticas de un producto
 */
router.get('/product/:productId/summary', async (req, res) => {
  try {
    const { productId } = req.params;

    const stats = await prisma.review.aggregate({
      where: {
        productId,
        status: 'APPROVED'
      },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    });

    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId,
        status: 'APPROVED'
      },
      _count: {
        rating: true
      }
    });

    const distribution = [1, 2, 3, 4, 5].map(rating => {
      const found = ratingDistribution.find(r => r.rating === rating);
      return {
        rating,
        count: found ? found._count.rating : 0,
        percentage: stats._count.id > 0 
          ? ((found ? found._count.rating : 0) / stats._count.id * 100).toFixed(1)
          : 0
      };
    });

    const verifiedCount = await prisma.review.count({
      where: {
        productId,
        status: 'APPROVED',
        isVerifiedPurchase: true
      }
    });

    res.json({
      averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(2)) : 0,
      totalReviews: stats._count.id,
      verifiedPurchases: verifiedCount,
      distribution
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen de reseñas' });
  }
});

// ==================== RUTAS PROTEGIDAS (USUARIO AUTENTICADO) ====================

/**
 * GET /api/review/my-reviews
 * Obtener todas mis reseñas
 */
router.get('/my-reviews', async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            slug: true
          }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reviews);
  } catch (error) {
    console.error('Error al obtener mis reseñas:', error);
    res.status(500).json({ error: 'Error al obtener mis reseñas' });
  }
});

/**
 * GET /api/review/can-review/:productId
 * Verificar si el usuario puede dejar una reseña para un producto
 */
router.get('/can-review/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Verificar si ya tiene una reseña
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existingReview) {
      return res.json({
        canReview: false,
        reason: 'Ya has dejado una reseña para este producto',
        hasReview: true,
        review: existingReview
      });
    }

    // Verificar si ha comprado el producto
    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: {
          some: {
            productId
          }
        }
      },
      include: {
        items: {
          where: { productId }
        }
      }
    });

    res.json({
      canReview: true,
      hasReview: false,
      isVerifiedPurchase: !!order,
      orderId: order?.id
    });
  } catch (error) {
    console.error('Error al verificar si puede reseñar:', error);
    res.status(500).json({ error: 'Error al verificar permisos de reseña' });
  }
});

/**
 * POST /api/review
 * Crear una nueva reseña
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, rating, title, comment, orderId } = req.body;

    // Validaciones
    if (!productId || !rating) {
      return res.status(400).json({ error: 'Producto y calificación son requeridos' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'La calificación debe estar entre 1 y 5' });
    }

    // Verificar si ya existe una reseña
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Ya has dejado una reseña para este producto' });
    }

    // Verificar si es compra verificada
    let isVerifiedPurchase = false;
    let validOrderId = null;

    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
          status: 'DELIVERED',
          items: {
            some: {
              productId
            }
          }
        }
      });

      if (order) {
        isVerifiedPurchase = true;
        validOrderId = orderId;
      }
    } else {
      // Buscar automáticamente una orden
      const order = await prisma.order.findFirst({
        where: {
          userId,
          status: 'DELIVERED',
          items: {
            some: {
              productId
            }
          }
        }
      });

      if (order) {
        isVerifiedPurchase = true;
        validOrderId = order.id;
      }
    }

    // Crear reseña
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        orderId: validOrderId,
        rating,
        title,
        comment,
        isVerifiedPurchase,
        status: 'PENDING' // Requiere moderación
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        images: true
      }
    });

    // Disparar notificación de nueva reseña para moderación
    try {
      await triggerNewReview(review.id);
    } catch (notifError) {
      console.error('Error enviando notificación de nueva reseña:', notifError);
      // No fallar la creación si falla la notificación
    }

    res.status(201).json(review);
  } catch (error) {
    console.error('Error al crear reseña:', error);
    res.status(500).json({ error: 'Error al crear reseña' });
  }
});

/**
 * PUT /api/review/:id
 * Actualizar mi reseña
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, title, comment } = req.body;

    // Verificar que la reseña existe y pertenece al usuario
    const existingReview = await prisma.review.findUnique({
      where: { id }
    });

    if (!existingReview) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    if (existingReview.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta reseña' });
    }

    // Validaciones
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'La calificación debe estar entre 1 y 5' });
    }

    // Actualizar reseña (vuelve a estado PENDING para re-moderación)
    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(rating && { rating }),
        ...(title !== undefined && { title }),
        ...(comment !== undefined && { comment }),
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    res.json(review);
  } catch (error) {
    console.error('Error al actualizar reseña:', error);
    res.status(500).json({ error: 'Error al actualizar reseña' });
  }
});

/**
 * DELETE /api/review/:id
 * Eliminar mi reseña
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que la reseña existe y pertenece al usuario
    const existingReview = await prisma.review.findUnique({
      where: { id }
    });

    if (!existingReview) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    if (existingReview.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta reseña' });
    }

    // Eliminar reseña (las imágenes se eliminan en cascada)
    await prisma.review.delete({
      where: { id }
    });

    res.json({ message: 'Reseña eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar reseña:', error);
    res.status(500).json({ error: 'Error al eliminar reseña' });
  }
});

/**
 * POST /api/review/:id/vote
 * Votar una reseña como útil o no útil
 */
router.post('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { voteType } = req.body; // HELPFUL o NOT_HELPFUL

    if (!voteType || (voteType !== 'HELPFUL' && voteType !== 'NOT_HELPFUL')) {
      return res.status(400).json({ error: 'Tipo de voto inválido' });
    }

    // Verificar que la reseña existe
    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    // No puede votar su propia reseña
    if (review.userId === userId) {
      return res.status(400).json({ error: 'No puedes votar tu propia reseña' });
    }

    // Verificar si ya votó
    const existingVote = await prisma.reviewVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId: id,
          userId
        }
      }
    });

    if (existingVote) {
      // Si el voto es el mismo, lo eliminamos (toggle)
      if (existingVote.voteType === voteType) {
        await prisma.reviewVote.delete({
          where: {
            reviewId_userId: {
              reviewId: id,
              userId
            }
          }
        });

        // Actualizar contador
        const updateData = voteType === 'HELPFUL' 
          ? { helpfulCount: { decrement: 1 } }
          : { notHelpfulCount: { decrement: 1 } };

        await prisma.review.update({
          where: { id },
          data: updateData
        });

        return res.json({ message: 'Voto eliminado', voted: false });
      } else {
        // Cambiar el voto
        await prisma.reviewVote.update({
          where: {
            reviewId_userId: {
              reviewId: id,
              userId
            }
          },
          data: { voteType }
        });

        // Actualizar contadores (restar del anterior, sumar al nuevo)
        if (voteType === 'HELPFUL') {
          await prisma.review.update({
            where: { id },
            data: {
              helpfulCount: { increment: 1 },
              notHelpfulCount: { decrement: 1 }
            }
          });
        } else {
          await prisma.review.update({
            where: { id },
            data: {
              helpfulCount: { decrement: 1 },
              notHelpfulCount: { increment: 1 }
            }
          });
        }

        return res.json({ message: 'Voto actualizado', voteType });
      }
    }

    // Crear nuevo voto
    await prisma.reviewVote.create({
      data: {
        reviewId: id,
        userId,
        voteType
      }
    });

    // Actualizar contador
    const updateData = voteType === 'HELPFUL' 
      ? { helpfulCount: { increment: 1 } }
      : { notHelpfulCount: { increment: 1 } };

    await prisma.review.update({
      where: { id },
      data: updateData
    });

    res.json({ message: 'Voto registrado', voteType });
  } catch (error) {
    console.error('Error al votar reseña:', error);
    res.status(500).json({ error: 'Error al votar reseña' });
  }
});

/**
 * POST /api/review/:id/images
 * Agregar imágenes a una reseña (simulado - URLs)
 */
router.post('/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { images } = req.body; // Array de { imageUrl, caption, sortOrder }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos una imagen' });
    }

    // Verificar que la reseña existe y pertenece al usuario
    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    if (review.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para agregar imágenes a esta reseña' });
    }

    // Limitar a 5 imágenes por reseña
    const currentImagesCount = await prisma.reviewImage.count({
      where: { reviewId: id }
    });

    if (currentImagesCount + images.length > 5) {
      return res.status(400).json({ error: 'Máximo 5 imágenes por reseña' });
    }

    // Crear imágenes
    const createdImages = await prisma.$transaction(
      images.map((img, index) => 
        prisma.reviewImage.create({
          data: {
            reviewId: id,
            imageUrl: img.imageUrl,
            caption: img.caption,
            sortOrder: img.sortOrder ?? currentImagesCount + index
          }
        })
      )
    );

    res.status(201).json(createdImages);
  } catch (error) {
    console.error('Error al agregar imágenes:', error);
    res.status(500).json({ error: 'Error al agregar imágenes a la reseña' });
  }
});

/**
 * DELETE /api/review/:reviewId/images/:imageId
 * Eliminar una imagen de una reseña
 */
router.delete('/:reviewId/images/:imageId', async (req, res) => {
  try {
    const { reviewId, imageId } = req.params;
    const userId = req.user.id;

    // Verificar que la reseña pertenece al usuario
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    if (review.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar imágenes de esta reseña' });
    }

    // Eliminar imagen
    await prisma.reviewImage.delete({
      where: { id: imageId }
    });

    res.json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({ error: 'Error al eliminar imagen' });
  }
});

// ==================== RUTAS DE ADMINISTRADOR ====================

/**
 * GET /api/review/admin/pending
 * Obtener reseñas pendientes de moderación
 */
router.get('/admin/pending', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              slug: true
            }
          },
          images: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.review.count({ where: { status: 'PENDING' } })
    ]);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener reseñas pendientes:', error);
    res.status(500).json({ error: 'Error al obtener reseñas pendientes' });
  }
});

/**
 * GET /api/review/admin/all
 * Obtener todas las reseñas con filtros
 */
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { 
      status, // PENDING, APPROVED, REJECTED
      productId,
      rating,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (rating) where.rating = parseInt(rating);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              slug: true
            }
          },
          images: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.review.count({ where })
    ]);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});

/**
 * PUT /api/review/admin/:id/approve
 * Aprobar una reseña
 */
router.put('/admin/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const moderatorId = req.user.id;

    const review = await prisma.review.update({
      where: { id },
      data: {
        status: 'APPROVED',
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        rejectionReason: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        },
        images: true
      }
    });

    // Actualizar estadísticas del producto
    await updateProductRatingStats(review.productId);

    // Disparar notificación de reseña aprobada
    try {
      await triggerReviewModerated(review.id, 'APPROVED');
    } catch (notifError) {
      console.error('Error enviando notificación de reseña aprobada:', notifError);
      // No fallar la aprobación si falla la notificación
    }

    res.json(review);
  } catch (error) {
    console.error('Error al aprobar reseña:', error);
    res.status(500).json({ error: 'Error al aprobar reseña' });
  }
});

/**
 * PUT /api/review/admin/:id/reject
 * Rechazar una reseña
 */
router.put('/admin/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user.id;

    if (!reason) {
      return res.status(400).json({ error: 'Se requiere una razón para rechazar la reseña' });
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        status: 'REJECTED',
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        rejectionReason: reason
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        },
        images: true
      }
    });

    // Disparar notificación de reseña rechazada
    try {
      await triggerReviewModerated(review.id, 'REJECTED');
    } catch (notifError) {
      console.error('Error enviando notificación de reseña rechazada:', notifError);
      // No fallar el rechazo si falla la notificación
    }

    res.json(review);
  } catch (error) {
    console.error('Error al rechazar reseña:', error);
    res.status(500).json({ error: 'Error al rechazar reseña' });
  }
});

/**
 * POST /api/review/admin/:id/respond
 * Responder a una reseña como vendedor
 */
router.post('/admin/:id/respond', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response || response.trim().length === 0) {
      return res.status(400).json({ error: 'La respuesta no puede estar vacía' });
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        sellerResponse: response,
        sellerRespondedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        },
        images: true
      }
    });

    res.json(review);
  } catch (error) {
    console.error('Error al responder reseña:', error);
    res.status(500).json({ error: 'Error al responder reseña' });
  }
});

/**
 * GET /api/review/admin/stats
 * Obtener estadísticas generales de reseñas
 */
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [
      totalReviews,
      pendingReviews,
      approvedReviews,
      rejectedReviews,
      verifiedPurchases,
      avgRating
    ] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.review.count({ where: { status: 'APPROVED' } }),
      prisma.review.count({ where: { status: 'REJECTED' } }),
      prisma.review.count({ where: { isVerifiedPurchase: true } }),
      prisma.review.aggregate({
        where: { status: 'APPROVED' },
        _avg: { rating: true }
      })
    ]);

    // Reseñas por calificación
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { status: 'APPROVED' },
      _count: { rating: true }
    });

    const distribution = [1, 2, 3, 4, 5].map(rating => {
      const found = ratingDistribution.find(r => r.rating === rating);
      return {
        rating,
        count: found ? found._count.rating : 0
      };
    });

    // Reseñas recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReviews = await prisma.review.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Productos más reseñados
    const topReviewedProducts = await prisma.review.groupBy({
      by: ['productId'],
      where: { status: 'APPROVED' },
      _count: { productId: true },
      orderBy: {
        _count: {
          productId: 'desc'
        }
      },
      take: 5
    });

    const productsWithNames = await Promise.all(
      topReviewedProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, imageUrl: true }
        });
        return {
          product,
          reviewCount: item._count.productId
        };
      })
    );

    res.json({
      totalReviews,
      pendingReviews,
      approvedReviews,
      rejectedReviews,
      verifiedPurchases,
      averageRating: avgRating._avg.rating ? parseFloat(avgRating._avg.rating.toFixed(2)) : 0,
      distribution,
      recentReviews,
      topReviewedProducts: productsWithNames
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Actualizar estadísticas de rating de un producto
 */
async function updateProductRatingStats(productId) {
  try {
    const stats = await prisma.review.aggregate({
      where: {
        productId,
        status: 'APPROVED'
      },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.id
      }
    });
  } catch (error) {
    console.error('Error al actualizar estadísticas del producto:', error);
  }
}

module.exports = router;
