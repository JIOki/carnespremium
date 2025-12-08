const express = require('express');
const Joi = require('joi');

const { getPrismaClient } = require('../database/connection');
const { asyncHandler, CommonErrors } = require('../middleware/errorHandler');
const RedisService = require('../services/RedisService');

const router = express.Router();

// ==================== ESQUEMAS DE VALIDACIÓN ====================

const addToCartSchema = Joi.object({
  productId: Joi.string().required(),
  variantId: Joi.string().optional(),
  quantity: Joi.number().integer().min(1).max(100).required()
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(100).required()
});

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Obtener carrito completo del usuario
 */
async function getFullCart(userId) {
  const prisma = getPrismaClient();
  
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          shortDesc: true,
          imageUrl: true,
          isActive: true
        }
      },
      variant: {
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          weight: true,
          isActive: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Filtrar productos activos y calcular totales
  const validCartItems = cartItems.filter(item => 
    item.product.isActive && (!item.variant || item.variant.isActive)
  );

  let subtotal = 0;
  const processedItems = validCartItems.map(item => {
    const currentPrice = item.variant?.price || item.product.price;
    const itemTotal = parseFloat(currentPrice) * item.quantity;
    subtotal += itemTotal;

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: parseFloat(currentPrice),
      total: itemTotal,
      product: item.product,
      variant: item.variant,
      addedAt: item.createdAt
    };
  });

  const itemCount = processedItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: processedItems,
    summary: {
      itemCount,
      subtotal: parseFloat(subtotal.toFixed(2)),
      // Estos se calcularían en checkout real
      estimatedTax: parseFloat((subtotal * 0.16).toFixed(2)), // IVA 16%
      estimatedShipping: subtotal > 500 ? 0 : 50, // Envío gratis > $500
      estimatedTotal: parseFloat((subtotal * 1.16 + (subtotal > 500 ? 0 : 50)).toFixed(2))
    }
  };
}

/**
 * Sincronizar carrito con Redis
 */
async function syncCartWithRedis(userId, cartData) {
  await RedisService.setCart(userId, cartData);
}

// ==================== RUTAS ====================

/**
 * GET /api/cart
 * Obtener carrito del usuario
 */
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Intentar obtener de Redis primero
  let cartData = await RedisService.getCart(userId);
  
  if (!cartData) {
    // Si no está en cache, obtener de base de datos
    cartData = await getFullCart(userId);
    await syncCartWithRedis(userId, cartData);
  } else {
    // Verificar que los datos de Redis estén actualizados
    // En producción, podrías agregar un timestamp para validar freshness
  }

  res.json({
    success: true,
    data: cartData
  });
}));

/**
 * POST /api/cart
 * Agregar producto al carrito (alias de /api/cart/add)
 */
router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = addToCartSchema.validate(req.body);
  if (error) {
    throw CommonErrors.ValidationError(error.details[0].message);
  }

  const { productId, variantId, quantity } = value;
  const userId = req.userId;
  const prisma = getPrismaClient();

  // Verificar que el producto existe y está activo
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    select: {
      id: true,
      name: true,
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          isDefault: true
        }
      }
    }
  });

  if (!product) {
    throw CommonErrors.NotFound('Producto');
  }

  // Si se especifica variantId, buscar esa variante
  // Si no, usar la variante por defecto
  let variant = null;
  if (variantId) {
    variant = product.variants.find(v => v.id === variantId);
    if (!variant) {
      throw CommonErrors.NotFound('Variante del producto');
    }
  } else {
    // Usar la variante por defecto
    variant = product.variants.find(v => v.isDefault) || product.variants[0];
    if (!variant) {
      throw CommonErrors.NotFound('El producto no tiene variantes disponibles');
    }
  }

  // Verificar stock disponible
  const availableStock = variant.stock;
  const minimumOrder = 1; // Por defecto 1

  if (availableStock < quantity) {
    throw CommonErrors.OutOfStock(`Stock insuficiente. Disponible: ${availableStock}`);
  }

  if (quantity < minimumOrder) {
    throw CommonErrors.BadRequest(`Cantidad mínima requerida: ${minimumOrder}`);
  }

  // Verificar si el item ya existe en el carrito
  const existingCartItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId_variantId: {
        userId,
        productId,
        variantId: variantId || null
      }
    }
  });

  const currentPrice = variant.price;
  let updatedCartItem;

  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + quantity;
    
    if (newQuantity > availableStock) {
      throw CommonErrors.OutOfStock(
        `Total excede stock disponible. Máximo: ${availableStock}, actual en carrito: ${existingCartItem.quantity}`
      );
    }

    // Actualizar cantidad existente
    updatedCartItem = await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: {
        quantity: newQuantity,
        price: currentPrice, // Actualizar precio por si cambió
        updatedAt: new Date()
      }
    });
  } else {
    // Crear nuevo item en carrito
    updatedCartItem = await prisma.cartItem.create({
      data: {
        userId,
        productId,
        variantId,
        quantity,
        price: currentPrice
      }
    });
  }

  // Actualizar carrito completo y cache
  const fullCart = await getFullCart(userId);
  await syncCartWithRedis(userId, fullCart);

  res.json({
    success: true,
    message: 'Producto agregado al carrito',
    data: {
      cartItem: updatedCartItem,
      cart: fullCart
    }
  });
}));

/**
 * POST /api/cart/add
 * Agregar producto al carrito
 */
router.post('/add', asyncHandler(async (req, res) => {
  const { error, value } = addToCartSchema.validate(req.body);
  if (error) {
    throw CommonErrors.ValidationError(error.details[0].message);
  }

  const { productId, variantId, quantity } = value;
  const userId = req.userId;
  const prisma = getPrismaClient();

  // Verificar que el producto existe y está activo
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    select: {
      id: true,
      name: true,
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          isDefault: true
        }
      }
    }
  });

  if (!product) {
    throw CommonErrors.NotFound('Producto');
  }

  // Si se especifica variantId, buscar esa variante
  // Si no, usar la variante por defecto
  let variant = null;
  if (variantId) {
    variant = product.variants.find(v => v.id === variantId);
    if (!variant) {
      throw CommonErrors.NotFound('Variante del producto');
    }
  } else {
    // Usar la variante por defecto
    variant = product.variants.find(v => v.isDefault) || product.variants[0];
    if (!variant) {
      throw CommonErrors.NotFound('El producto no tiene variantes disponibles');
    }
  }

  // Verificar stock disponible
  const availableStock = variant.stock;
  const minimumOrder = 1; // Por defecto 1

  if (availableStock < quantity) {
    throw CommonErrors.OutOfStock(`Stock insuficiente. Disponible: ${availableStock}`);
  }

  if (quantity < minimumOrder) {
    throw CommonErrors.BadRequest(`Cantidad mínima requerida: ${minimumOrder}`);
  }

  // Verificar si el item ya existe en el carrito
  const existingCartItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId_variantId: {
        userId,
        productId,
        variantId: variantId || null
      }
    }
  });

  const currentPrice = variant.price;
  let updatedCartItem;

  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + quantity;
    
    if (newQuantity > availableStock) {
      throw CommonErrors.OutOfStock(
        `Total excede stock disponible. Máximo: ${availableStock}, actual en carrito: ${existingCartItem.quantity}`
      );
    }

    // Actualizar cantidad existente
    updatedCartItem = await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: {
        quantity: newQuantity,
        price: currentPrice, // Actualizar precio por si cambió
        updatedAt: new Date()
      }
    });
  } else {
    // Crear nuevo item en carrito
    updatedCartItem = await prisma.cartItem.create({
      data: {
        userId,
        productId,
        variantId,
        quantity,
        price: currentPrice
      }
    });
  }

  // Actualizar carrito completo y cache
  const fullCart = await getFullCart(userId);
  await syncCartWithRedis(userId, fullCart);

  res.json({
    success: true,
    message: 'Producto agregado al carrito',
    data: {
      cartItem: updatedCartItem,
      cart: fullCart
    }
  });
}));

/**
 * PUT /api/cart/items/:itemId
 * Actualizar cantidad de un item del carrito
 */
router.put('/items/:itemId', asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { error, value } = updateCartItemSchema.validate(req.body);
  
  if (error) {
    throw CommonErrors.ValidationError(error.details[0].message);
  }

  const { quantity } = value;
  const userId = req.userId;
  const prisma = getPrismaClient();

  // Verificar que el item pertenece al usuario
  const cartItem = await prisma.cartItem.findFirst({
    where: { 
      id: itemId, 
      userId 
    },
    include: {
      product: {
        select: {
          stock: true,
          minimumOrder: true,
          isActive: true
        }
      },
      variant: {
        select: {
          stock: true,
          isActive: true
        }
      }
    }
  });

  if (!cartItem) {
    throw CommonErrors.NotFound('Item del carrito');
  }

  if (!cartItem.product.isActive || (cartItem.variant && !cartItem.variant.isActive)) {
    throw CommonErrors.BadRequest('Producto no disponible');
  }

  // Verificar stock y cantidad mínima
  const availableStock = cartItem.variant?.stock || cartItem.product.stock;
  const minimumOrder = parseFloat(cartItem.product.minimumOrder) || 1;

  if (quantity > availableStock) {
    throw CommonErrors.OutOfStock(`Stock insuficiente. Disponible: ${availableStock}`);
  }

  if (quantity < minimumOrder) {
    throw CommonErrors.BadRequest(`Cantidad mínima requerida: ${minimumOrder}`);
  }

  // Actualizar cantidad
  await prisma.cartItem.update({
    where: { id: itemId },
    data: {
      quantity,
      updatedAt: new Date()
    }
  });

  // Actualizar carrito completo y cache
  const fullCart = await getFullCart(userId);
  await syncCartWithRedis(userId, fullCart);

  res.json({
    success: true,
    message: 'Cantidad actualizada',
    data: fullCart
  });
}));

/**
 * PUT /api/cart/:itemId
 * Alias de /items/:itemId - Actualizar cantidad de un item del carrito (formato tests)
 */
router.put('/:itemId', asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { error, value } = updateCartItemSchema.validate(req.body);
  
  if (error) {
    throw CommonErrors.ValidationError(error.details[0].message);
  }

  const { quantity } = value;
  const userId = req.userId;
  const prisma = getPrismaClient();

  // Verificar que el item pertenece al usuario
  const cartItem = await prisma.cartItem.findFirst({
    where: { 
      id: itemId, 
      userId 
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          isActive: true
        }
      },
      variant: {
        select: {
          stock: true,
          isActive: true
        }
      }
    }
  });

  if (!cartItem) {
    throw CommonErrors.NotFound('Item del carrito');
  }

  if (!cartItem.product.isActive || (cartItem.variant && !cartItem.variant.isActive)) {
    throw CommonErrors.BadRequest('Producto no disponible');
  }

  // Verificar stock disponible (solo de variante)
  const availableStock = cartItem.variant?.stock || 999;
  const minimumOrder = 1;

  if (quantity > availableStock) {
    throw CommonErrors.OutOfStock(`Stock insuficiente. Disponible: ${availableStock}`);
  }

  if (quantity < minimumOrder) {
    throw CommonErrors.BadRequest(`Cantidad mínima requerida: ${minimumOrder}`);
  }

  // Actualizar cantidad
  await prisma.cartItem.update({
    where: { id: itemId },
    data: {
      quantity,
      updatedAt: new Date()
    }
  });

  // Actualizar carrito completo y cache
  const fullCart = await getFullCart(userId);
  await syncCartWithRedis(userId, fullCart);

  res.json({
    success: true,
    message: 'Cantidad actualizada',
    data: fullCart
  });
}));

/**
 * DELETE /api/cart/items/:itemId
 * Eliminar item del carrito
 */
router.delete('/items/:itemId', asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const userId = req.userId;
  const prisma = getPrismaClient();

  // Verificar que el item pertenece al usuario
  const cartItem = await prisma.cartItem.findFirst({
    where: { 
      id: itemId, 
      userId 
    }
  });

  if (!cartItem) {
    throw CommonErrors.NotFound('Item del carrito');
  }

  // Eliminar item
  await prisma.cartItem.delete({
    where: { id: itemId }
  });

  // Actualizar carrito completo y cache
  const fullCart = await getFullCart(userId);
  await syncCartWithRedis(userId, fullCart);

  res.json({
    success: true,
    message: 'Item eliminado del carrito',
    data: fullCart
  });
}));

/**
 * DELETE /api/cart/clear
 * Vaciar carrito completamente
 */
router.delete('/clear', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const prisma = getPrismaClient();

  // Eliminar todos los items del carrito
  await prisma.cartItem.deleteMany({
    where: { userId }
  });

  // Limpiar cache
  await RedisService.deleteCart(userId);

  res.json({
    success: true,
    message: 'Carrito vaciado',
    data: {
      items: [],
      summary: {
        itemCount: 0,
        subtotal: 0,
        estimatedTax: 0,
        estimatedShipping: 0,
        estimatedTotal: 0
      }
    }
  });
}));

/**
 * POST /api/cart/sync
 * Sincronizar carrito (útil para cuando el usuario se conecta desde otro dispositivo)
 */
router.post('/sync', asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Forzar actualización desde base de datos
  const fullCart = await getFullCart(userId);
  await syncCartWithRedis(userId, fullCart);

  res.json({
    success: true,
    message: 'Carrito sincronizado',
    data: fullCart
  });
}));

/**
 * GET /api/cart/summary
 * Obtener solo el resumen del carrito (para mostrar en header)
 */
router.get('/summary', asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  // Intentar obtener de Redis
  let cartData = await RedisService.getCart(userId);
  
  if (!cartData) {
    cartData = await getFullCart(userId);
    await syncCartWithRedis(userId, cartData);
  }

  res.json({
    success: true,
    data: {
      itemCount: cartData.summary.itemCount,
      subtotal: cartData.summary.subtotal,
      estimatedTotal: cartData.summary.estimatedTotal
    }
  });
}));

module.exports = router;