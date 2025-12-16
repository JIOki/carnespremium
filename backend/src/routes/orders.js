const express = require('express');
const { getPrismaClient } = require('../database/connection');
const { asyncHandler, CommonErrors } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/orders
 */
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { status, page = 1, limit = 10 } = req.query;
  const prisma = getPrismaClient();

  const where = { userId, ...(status && { status }) };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { include: { product: { select: { name: true, imageUrl: true } } } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.order.count({ where })
  ]);

  res.json({ success: true, data: { orders, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(totalCount / parseInt(limit)), totalOrders: totalCount } } });
}));

/**
 * GET /api/orders/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const userRole = req.userRole;
  const prisma = getPrismaClient();

  const where = { id, ...(userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && { userId }) };

  const order = await prisma.order.findFirst({
    where,
    include: { items: { include: { product: { select: { name: true, imageUrl: true } } } }}
  });

  if (!order) throw CommonErrors.NotFound('Orden');

  res.json({ success: true, data: order });
}));

/**
 * POST /api/orders
 */
router.post('/', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const prisma = getPrismaClient();
  const { items, shippingAddress, paymentMethod, notes } = req.body;

  if (!items || items.length === 0) {
    throw CommonErrors.ValidationError('La orden debe tener al menos un producto');
  }

  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId },
      include: { variants: true }
    });

    if (!product) throw CommonErrors.NotFound(`Producto ${item.productId}`);

    let price = item.price;
    if (item.variantId && product.variants) {
      const variant = product.variants.find(v => v.id === item.variantId);
      if (variant) price = variant.price;
    }

    subtotal += price * item.quantity;
    orderItems.push({
      productId: item.productId,
      variantId: item.variantId || null,
      quantity: item.quantity,
      price: price,
      total: price * item.quantity
    });
  }

  const deliveryFee = subtotal >= 500 ? 0 : 50;
  const total = subtotal + deliveryFee;

  const addressString = JSON.stringify({
    address: shippingAddress.address,
    city: shippingAddress.city,
    state: shippingAddress.state,
    zipCode: shippingAddress.zipCode,
    notes: shippingAddress.notes
  });

  const orderNumber = `ORD-${Date.now()}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: 'PENDING',
      paymentMethod: paymentMethod?.toUpperCase() || 'CASH',
      paymentStatus: 'PENDING',
      subtotal,
      deliveryFee,
      total,
      billingAddress: addressString,
      shippingAddress: addressString,
      notes: shippingAddress.notes || notes,
      items: { create: orderItems }
    },
    include: { items: { include: { product: { select: { name: true, imageUrl: true } } } } }
  });

  res.status(201).json({ success: true, data: order });
}));

module.exports = router;