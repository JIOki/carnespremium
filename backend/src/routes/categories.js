const express = require('express');
const Joi = require('joi');
const { getPrismaClient } = require('../database/connection');
const { asyncHandler, CommonErrors } = require('../middleware/errorHandler');
const RedisService = require('../services/RedisService');

const router = express.Router();

// ==================== ESQUEMAS DE VALIDACIÓN ====================

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 100 caracteres',
    'any.required': 'El nombre es requerido'
  }),
  slug: Joi.string().min(2).max(100).required().messages({
    'string.min': 'El slug debe tener al menos 2 caracteres',
    'any.required': 'El slug es requerido'
  }),
  description: Joi.string().max(500).optional().allow(''),
  imageUrl: Joi.string().uri().optional().allow(''),
  parentId: Joi.string().optional().allow(null),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0).default(0)
});

/**
 * GET /api/categories
 * Obtener todas las categorías activas
 */
router.get('/', asyncHandler(async (req, res) => {
  const prisma = getPrismaClient();
  
  // Intentar obtener de cache
  const cached = await RedisService.get('categories');
  if (cached) {
    return res.json({
      success: true,
      data: cached,
      fromCache: true
    });
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          products: {
            where: { isActive: true }
          }
        }
      }
    }
  });

  // Procesar categorías con conteo de productos
  const processedCategories = categories.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description,
    image: category.image,
    productCount: category._count.products,
    sortOrder: category.sortOrder
  }));

  // Cachear por 30 minutos
  await RedisService.set('categories', processedCategories, 1800);

  res.json({
    success: true,
    data: processedCategories
  });
}));

/**
 * POST /api/categories
 * Crear una nueva categoría (solo admin)
 */
router.post('/', asyncHandler(async (req, res) => {
  // Validar datos
  const { error, value } = createCategorySchema.validate(req.body);
  if (error) {
    throw CommonErrors.ValidationError(error.details[0].message);
  }

  const { name, slug, description, imageUrl, parentId, isActive, sortOrder } = value;
  const prisma = getPrismaClient();

  // Verificar que el slug no exista
  const existingCategory = await prisma.category.findUnique({
    where: { slug }
  });

  if (existingCategory) {
    throw CommonErrors.Conflict('Ya existe una categoría con ese slug');
  }

  // Verificar que la categoría padre existe (si se proporciona)
  if (parentId) {
    const parentCategory = await prisma.category.findUnique({
      where: { id: parentId }
    });

    if (!parentCategory) {
      throw CommonErrors.NotFound('Categoría padre no encontrada');
    }
  }

  // Crear categoría
  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      imageUrl,
      parentId,
      isActive,
      sortOrder
    }
  });

  // Invalidar cache de categorías
  await RedisService.del('categories');

  res.status(201).json({
    success: true,
    message: 'Categoría creada exitosamente',
    data: category
  });
}));

/**
 * GET /api/categories/:id
 * Obtener una categoría específica con productos
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const prisma = getPrismaClient();

  const category = await prisma.category.findUnique({
    where: { 
      id, 
      isActive: true 
    }
  });

  if (!category) {
    throw CommonErrors.NotFound('Categoría');
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Obtener productos de la categoría
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: {
        categoryId: id,
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
        stock: true,
        isFeatured: true,
        tags: true,
        cut: true,
        grade: true,
        origin: true,
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
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.product.count({
      where: {
        categoryId: id,
        isActive: true
      }
    })
  ]);

  // Procesar productos con ratings
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

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.json({
    success: true,
    data: {
      category,
      products: productsWithRatings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      }
    }
  });
}));

/**
 * GET /api/categories/:id/filters
 * Obtener filtros disponibles para una categoría
 */
router.get('/:id/filters', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prisma = getPrismaClient();

  // Verificar que la categoría existe
  const category = await prisma.category.findUnique({
    where: { id, isActive: true }
  });

  if (!category) {
    throw CommonErrors.NotFound('Categoría');
  }

  // Obtener agregaciones para filtros
  const products = await prisma.product.findMany({
    where: {
      categoryId: id,
      isActive: true
    },
    select: {
      price: true,
      weight: true,
      cut: true,
      grade: true,
      origin: true,
      tags: true
    }
  });

  if (products.length === 0) {
    return res.json({
      success: true,
      data: {
        priceRange: { min: 0, max: 0 },
        weightRange: { min: 0, max: 0 },
        cuts: [],
        grades: [],
        origins: [],
        tags: []
      }
    });
  }

  // Calcular rangos y opciones
  const prices = products.map(p => parseFloat(p.price)).filter(p => p > 0);
  const weights = products.map(p => p.weight ? parseFloat(p.weight) : 0).filter(w => w > 0);
  
  const cuts = [...new Set(products.map(p => p.cut).filter(Boolean))];
  const grades = [...new Set(products.map(p => p.grade).filter(Boolean))];
  const origins = [...new Set(products.map(p => p.origin).filter(Boolean))];
  const allTags = products.flatMap(p => p.tags || []);
  const tags = [...new Set(allTags)];

  res.json({
    success: true,
    data: {
      priceRange: {
        min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
        max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 0
      },
      weightRange: {
        min: weights.length > 0 ? Math.floor(Math.min(...weights)) : 0,
        max: weights.length > 0 ? Math.ceil(Math.max(...weights)) : 0
      },
      cuts: cuts.sort(),
      grades: grades.sort(),
      origins: origins.sort(),
      tags: tags.sort()
    }
  });
}));

module.exports = router;