const express = require('express');
const { getPrismaClient } = require('../database/connection');

const router = express.Router();

/**
 * Obtener todos los productos (simplificado para SQLite)
 */
router.get('/', async (req, res) => {
  try {
    const prisma = getPrismaClient();
    
    // Obtener parámetros de consulta
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Obtener productos con sus variantes
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          shortDesc: true,
          sku: true,
          imageUrl: true,
          isFeatured: true,
          weight: true,
          unit: true,
          origin: true,
          brand: true,
          averageRating: true,
          totalReviews: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              comparePrice: true,
              stock: true,
              weight: true,
              isDefault: true
            },
            orderBy: { isDefault: 'desc' }
          }
        }
      }),
      prisma.product.count({
        where: { isActive: true }
      })
    ]);

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
          hasNext,
          hasPrev
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Buscar productos (debe estar antes de /:id)
 */
router.get('/search', async (req, res) => {
  try {
    const prisma = getPrismaClient();
    
    // Obtener parámetros de consulta
    const { q = '', category, minPrice, maxPrice } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Construir filtros de búsqueda
    const where = {
      isActive: true,
      OR: [
        { name: { contains: q } },
        { shortDesc: { contains: q } },
        { description: { contains: q } },
        { brand: { contains: q } },
        { tags: { contains: q } }
      ]
    };

    // Agregar filtros adicionales
    if (category) {
      where.categoryId = category;
    }

    // Obtener productos que coincidan
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          shortDesc: true,
          sku: true,
          imageUrl: true,
          isFeatured: true,
          weight: true,
          unit: true,
          origin: true,
          brand: true,
          averageRating: true,
          totalReviews: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              comparePrice: true,
              stock: true,
              weight: true,
              isDefault: true
            },
            orderBy: { isDefault: 'desc' }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    // Filtrar por precio si se especifica (verificar en variantes)
    let filteredProducts = products;
    if (minPrice || maxPrice) {
      filteredProducts = products.filter(product => {
        const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
        if (!defaultVariant) return false;
        
        const price = parseFloat(defaultVariant.price);
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: {
        products: filteredProducts,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
          hasNext,
          hasPrev
        },
        query: {
          searchTerm: q,
          category,
          minPrice,
          maxPrice
        }
      }
    });

  } catch (error) {
    console.error('Error buscando productos:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SEARCH_ERROR'
    });
  }
});

/**
 * Obtener producto por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const prisma = getPrismaClient();
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: { isDefault: 'desc' }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Obtener categorías
 */
router.get('/categories/list', async (req, res) => {
  try {
    const prisma = getPrismaClient();
    
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /:productId/reviews
 * Obtener reviews de un producto específico
 */
router.get('/:productId/reviews', async (req, res) => {
  try {
    const prisma = getPrismaClient();
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
        code: 'NOT_FOUND'
      });
    }

    // Obtener reviews del producto
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId,
          status: 'APPROVED'
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          isVerifiedPurchase: true,
          helpfulCount: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true
            }
          },
          images: {
            select: {
              id: true,
              imageUrl: true
            }
          }
        }
      }),
      prisma.review.count({
        where: {
          productId,
          status: 'APPROVED'
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo reviews:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;