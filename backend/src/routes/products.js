const express = require('express');
const Joi = require('joi');

const { getPrismaClient } = require('../database/connection');
const { asyncHandler, CommonErrors } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');
const RedisService = require('../services/RedisService');

const router = express.Router();

// ==================== ESQUEMAS DE VALIDACIÓN ====================

const searchSchema = Joi.object({
  q: Joi.string().min(1).max(100).optional(),
  category: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  tags: Joi.string().optional(), // comma separated
  featured: Joi.boolean().optional(),
  sortBy: Joi.string().valid('price_asc', 'price_desc', 'name_asc', 'name_desc', 'created_desc', 'rating_desc').default('created_desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const productFiltersSchema = Joi.object({
  category: Joi.string().optional(),
  cut: Joi.string().optional(),
  grade: Joi.string().optional(),
  origin: Joi.string().optional(),
  minWeight: Joi.number().min(0).optional(),
  maxWeight: Joi.number().min(0).optional(),
  inStock: Joi.boolean().default(true)
});

// ==================== RUTAS PÚBLICAS ====================

/**
 * GET /api/products
 * Obtener lista de productos con filtros y búsqueda
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  // Validar parámetros de query
  const { error, value } = searchSchema.validate(req.query);
  if (error) {
    throw CommonErrors.ValidationError(error.details[0].message);
  }

  const { q, category, minPrice, maxPrice, tags, featured, sortBy, page, limit } = value;
  const prisma = getPrismaClient();

  // Construir filtros
  const where = {
    isActive: true,
    ...(category && { categoryId: category }),
    ...(minPrice !== undefined && { price: { gte: minPrice } }),
    ...(maxPrice !== undefined && { price: { ...where.price, lte: maxPrice } }),
    ...(featured !== undefined && { isFeatured: featured }),
    ...(tags && { tags: { hasSome: tags.split(',').map(tag => tag.trim()) } }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: [q] } }
      ]
    })
  };

  // Construir orden
  const orderBy = {};
  switch (sortBy) {
    case 'price_asc':
      orderBy.price = 'asc';
      break;
    case 'price_desc':
      orderBy.price = 'desc';
      break;
    case 'name_asc':
      orderBy.name = 'asc';
      break;
    case 'name_desc':
      orderBy.name = 'desc';
      break;
    case 'created_desc':
      orderBy.createdAt = 'desc';
      break;
    case 'rating_desc':
      // Esto requeriría un campo calculado de rating promedio
      orderBy.createdAt = 'desc'; // Fallback
      break;
    default:
      orderBy.createdAt = 'desc';
  }

  // Calcular offset
  const skip = (page - 1) * limit;

  // Intentar obtener de cache para búsquedas comunes
  const cacheKey = `products:${JSON.stringify({ where, orderBy, skip, limit })}`;
  let cachedResult = null;
  
  if (!q) { // Solo cachear cuando no hay búsqueda textual
    cachedResult = await RedisService.get(cacheKey);
  }

  if (cachedResult) {
    return res.json({
      success: true,
      data: cachedResult,
      fromCache: true
    });
  }

  // Obtener productos y total count
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        shortDescription: true,
        price: true,
        comparePrice: true,
        weight: true,
        unit: true,
        stock: true,
        isFeatured: true,
        tags: true,
        cut: true,
        grade: true,
        origin: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        images: {
          where: { isPrimary: true },
          select: {
            url: true,
            altText: true
          },
          take: 1
        },
        reviews: {
          select: {
            rating: true
          }
        }
      }
    }),
    prisma.product.count({ where })
  ]);

  // Calcular ratings promedio
  const productsWithRatings = products.map(product => {
    const ratings = product.reviews.map(r => r.rating);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;
    
    const { reviews, ...productWithoutReviews } = product;
    return {
      ...productWithoutReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount: ratings.length,
      primaryImage: product.images[0] || null
    };
  });

  // Metadata de paginación
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const result = {
    products: productsWithRatings,
    pagination: {
      currentPage: page,
      totalPages,
      totalProducts: totalCount,
      hasNextPage,
      hasPrevPage,
      limit
    },
    filters: {
      category,
      minPrice,
      maxPrice,
      tags,
      featured,
      sortBy
    }
  };

  // Cachear resultado si no hay búsqueda textual
  if (!q) {
    await RedisService.set(cacheKey, result, 300); // 5 minutos
  }

  // Incrementar término de búsqueda si existe
  if (q) {
    await RedisService.incrementSearchTerm(q);
  }

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/products/featured
 * Obtener productos destacados
 */
router.get('/featured', asyncHandler(async (req, res) => {
  const prisma = getPrismaClient();
  
  // Intentar obtener de cache
  const cached = await RedisService.get('featured_products');
  if (cached) {
    return res.json({
      success: true,
      data: cached,
      fromCache: true
    });
  }

  const featuredProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 8,
    select: {
      id: true,
      name: true,
      shortDescription: true,
      price: true,
      comparePrice: true,
      weight: true,
      unit: true,
      tags: true,
      cut: true,
      grade: true,
      category: {
        select: {
          id: true,
          name: true
        }
      },
      images: {
        where: { isPrimary: true },
        select: {
          url: true,
          altText: true
        },
        take: 1
      },
      reviews: {
        select: {
          rating: true
        }
      }
    }
  });

  // Procesar ratings
  const processedProducts = featuredProducts.map(product => {
    const ratings = product.reviews.map(r => r.rating);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;
    
    const { reviews, ...productWithoutReviews } = product;
    return {
      ...productWithoutReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount: ratings.length,
      primaryImage: product.images[0] || null
    };
  });

  // Cachear por 10 minutos
  await RedisService.set('featured_products', processedProducts, 600);

  res.json({
    success: true,
    data: processedProducts
  });
}));

/**
 * GET /api/products/top-selling
 * Obtener productos más vendidos
 */
router.get('/top-selling', asyncHandler(async (req, res) => {
  const prisma = getPrismaClient();
  
  // Intentar obtener de cache
  const cached = await RedisService.getTopProducts();
  if (cached) {
    return res.json({
      success: true,
      data: cached,
      fromCache: true
    });
  }

  // Query para obtener productos más vendidos (basado en cantidad de items vendidos)
  const topSellingProducts = await prisma.product.findMany({
    where: {
      isActive: true
    },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      price: true,
      comparePrice: true,
      weight: true,
      unit: true,
      tags: true,
      category: {
        select: {
          id: true,
          name: true
        }
      },
      images: {
        where: { isPrimary: true },
        select: {
          url: true,
          altText: true
        },
        take: 1
      },
      orderItems: {
        select: {
          quantity: true
        }
      }
    }
  });

  // Calcular total vendido por producto
  const productsWithSales = topSellingProducts
    .map(product => {
      const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const { orderItems, ...productWithoutOrders } = product;
      
      return {
        ...productWithoutOrders,
        totalSold,
        primaryImage: product.images[0] || null
      };
    })
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 12);

  // Cachear por 30 minutos
  await RedisService.cacheTopProducts(productsWithSales, 1800);

  res.json({
    success: true,
    data: productsWithSales
  });
}));

/**
 * GET /api/products/search/suggestions
 * Obtener sugerencias de búsqueda
 */
router.get('/search/suggestions', asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({
      success: true,
      data: {
        products: [],
        popularSearches: await RedisService.getPopularSearches(5)
      }
    });
  }

  const prisma = getPrismaClient();

  // Buscar productos que coincidan
  const suggestions = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: [q] } }
      ]
    },
    select: {
      id: true,
      name: true,
      price: true,
      images: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1
      }
    },
    take: 5
  });

  res.json({
    success: true,
    data: {
      products: suggestions.map(product => ({
        ...product,
        primaryImage: product.images[0] || null
      })),
      popularSearches: await RedisService.getPopularSearches(5)
    }
  });
}));

/**
 * GET /api/products/:id
 * Obtener detalles de un producto específico
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prisma = getPrismaClient();

  // Intentar obtener de cache
  const cacheKey = `product:${id}`;
  const cached = await RedisService.get(cacheKey);
  
  if (cached) {
    // Si hay usuario autenticado, verificar wishlist
    if (req.userId) {
      const isInWishlist = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId: req.userId,
            productId: id
          }
        }
      });
      cached.isInWishlist = !!isInWishlist;
    }
    
    return res.json({
      success: true,
      data: cached,
      fromCache: true
    });
  }

  const product = await prisma.product.findUnique({
    where: { 
      id,
      isActive: true 
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          description: true
        }
      },
      images: {
        orderBy: {
          sortOrder: 'asc'
        }
      },
      variants: {
        where: { isActive: true },
        orderBy: {
          sortOrder: 'asc'
        }
      },
      reviews: {
        where: { isVisible: true },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }
    }
  });

  if (!product) {
    throw CommonErrors.NotFound('Producto');
  }

  // Calcular estadísticas de reviews
  const ratings = product.reviews.map(r => r.rating);
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
    : 0;

  // Distribución de ratings
  const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
    star,
    count: ratings.filter(rating => rating === star).length,
    percentage: ratings.length > 0 
      ? Math.round((ratings.filter(rating => rating === star).length / ratings.length) * 100)
      : 0
  }));

  // Verificar si está en wishlist del usuario
  let isInWishlist = false;
  if (req.userId) {
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.userId,
          productId: id
        }
      }
    });
    isInWishlist = !!wishlistItem;
  }

  const productDetails = {
    ...product,
    averageRating: parseFloat(averageRating.toFixed(1)),
    reviewCount: ratings.length,
    ratingDistribution,
    isInWishlist
  };

  // Cachear por 15 minutos
  await RedisService.set(cacheKey, productDetails, 900);

  res.json({
    success: true,
    data: productDetails
  });
}));

/**
 * GET /api/products/:id/recommendations
 * Obtener productos recomendados para un producto específico
 */
router.get('/:id/recommendations', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type = 'SIMILAR_PRODUCTS', limit = 4 } = req.query;
  const prisma = getPrismaClient();

  // Verificar que el producto existe
  const product = await prisma.product.findUnique({
    where: { id, isActive: true },
    select: { id: true, categoryId: true, tags: true }
  });

  if (!product) {
    throw CommonErrors.NotFound('Producto');
  }

  let recommendations = [];

  switch (type) {
    case 'SIMILAR_PRODUCTS':
      // Productos de la misma categoría con tags similares
      recommendations = await prisma.product.findMany({
        where: {
          id: { not: id },
          isActive: true,
          OR: [
            { categoryId: product.categoryId },
            { tags: { hasSome: product.tags } }
          ]
        },
        select: {
          id: true,
          name: true,
          shortDescription: true,
          price: true,
          comparePrice: true,
          images: {
            where: { isPrimary: true },
            select: { url: true, altText: true },
            take: 1
          }
        },
        take: parseInt(limit)
      });
      break;

    case 'FREQUENTLY_BOUGHT_TOGETHER':
      // Productos frecuentemente comprados juntos
      // (Esta lógica sería más compleja con análisis de órdenes)
      recommendations = await prisma.product.findMany({
        where: {
          id: { not: id },
          isActive: true,
          categoryId: product.categoryId
        },
        select: {
          id: true,
          name: true,
          shortDescription: true,
          price: true,
          comparePrice: true,
          images: {
            where: { isPrimary: true },
            select: { url: true, altText: true },
            take: 1
          }
        },
        take: parseInt(limit)
      });
      break;

    default:
      recommendations = [];
  }

  // Procesar imágenes
  const processedRecommendations = recommendations.map(rec => ({
    ...rec,
    primaryImage: rec.images[0] || null,
    images: undefined
  }));

  res.json({
    success: true,
    data: {
      recommendations: processedRecommendations,
      type
    }
  });
}));

/**
 * GET /api/products/:id/reviews
 * Obtener reviews de un producto con paginación
 */
router.get('/:id/reviews', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, rating } = req.query;
  const prisma = getPrismaClient();

  // Construir filtros
  const where = {
    productId: id,
    isVisible: true,
    ...(rating && { rating: parseInt(rating) })
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.review.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReviews: totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
}));

module.exports = router;