const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const prisma = new PrismaClient();

// ==================== CONFIGURACIÓN ====================

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

// Inicializar MercadoPago (API v2.x)
const mercadopagoClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-dummy'
});

// ==================== HELPERS ====================

/**
 * Generar número único de pago
 */
function generatePaymentNumber() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `PAY-${timestamp}-${random}`.toUpperCase();
}

/**
 * Crear registro de pago en la base de datos
 */
async function createPaymentRecord(data) {
  return await prisma.payment.create({
    data: {
      orderId: data.orderId,
      userId: data.userId,
      provider: data.provider,
      providerPaymentId: data.providerPaymentId,
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      currency: data.currency || 'USD',
      status: data.status || 'PENDING',
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      providerResponse: data.providerResponse ? JSON.stringify(data.providerResponse) : null,
    }
  });
}

/**
 * Actualizar estado del pago
 */
async function updatePaymentStatus(paymentId, status, updates = {}) {
  return await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      ...updates,
      updatedAt: new Date()
    }
  });
}

/**
 * Crear transacción de pago
 */
async function createPaymentTransaction(data) {
  return await prisma.paymentTransaction.create({
    data: {
      paymentId: data.paymentId,
      type: data.type,
      amount: data.amount,
      currency: data.currency || 'USD',
      status: data.status || 'PENDING',
      providerTransactionId: data.providerTransactionId,
      providerResponse: data.providerResponse ? JSON.stringify(data.providerResponse) : null,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    }
  });
}

// ==================== STRIPE ROUTES ====================

/**
 * POST /api/payments/stripe/create-payment-intent
 * Crear Payment Intent de Stripe
 */
router.post('/stripe/create-payment-intent', async (req, res) => {
  try {
    const { orderId, amount, currency = 'usd', paymentMethodId } = req.body;
    const userId = req.user.id;

    // Validar orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para pagar esta orden' });
    }

    // Crear Payment Intent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: paymentMethodId ? true : false, // Confirmar si ya tiene método
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: userId
      }
    });

    // Crear registro de pago
    const payment = await createPaymentRecord({
      orderId: order.id,
      userId: userId,
      provider: 'STRIPE',
      providerPaymentId: paymentIntent.id,
      paymentMethod: 'CREDIT_CARD',
      amount: amount,
      currency: currency.toUpperCase(),
      status: paymentIntent.status === 'succeeded' ? 'CAPTURED' : 'PENDING',
      providerResponse: paymentIntent,
      metadata: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      }
    });

    // Crear transacción inicial
    await createPaymentTransaction({
      paymentId: payment.id,
      type: 'AUTHORIZATION',
      amount: amount,
      currency: currency.toUpperCase(),
      status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
      providerTransactionId: paymentIntent.id,
      providerResponse: paymentIntent
    });

    // Si el pago ya fue exitoso, actualizar orden
    if (paymentIntent.status === 'succeeded') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'CAPTURED',
          status: 'CONFIRMED'
        }
      });
    }

    res.json({
      success: true,
      payment: {
        id: payment.id,
        clientSecret: paymentIntent.client_secret,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency
      }
    });

  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    res.status(500).json({ 
      error: 'Error al crear el pago',
      details: error.message 
    });
  }
});

/**
 * POST /api/payments/stripe/confirm-payment
 * Confirmar pago de Stripe
 */
router.post('/stripe/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    // Obtener el Payment Intent de Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Buscar el pago en nuestra BD
    const payment = await prisma.payment.findFirst({
      where: {
        providerPaymentId: paymentIntentId,
        userId: userId
      },
      include: { order: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Actualizar estado del pago
    let status = 'PENDING';
    let orderStatus = 'PENDING';
    let paymentStatus = 'PENDING';

    if (paymentIntent.status === 'succeeded') {
      status = 'CAPTURED';
      orderStatus = 'CONFIRMED';
      paymentStatus = 'CAPTURED';
    } else if (paymentIntent.status === 'processing') {
      status = 'PROCESSING';
      paymentStatus = 'AUTHORIZED';
    } else if (paymentIntent.status === 'requires_payment_method') {
      status = 'FAILED';
      paymentStatus = 'FAILED';
    }

    await updatePaymentStatus(payment.id, status, {
      capturedAt: paymentIntent.status === 'succeeded' ? new Date() : null,
      failedAt: paymentIntent.status === 'requires_payment_method' ? new Date() : null,
      providerResponse: JSON.stringify(paymentIntent)
    });

    // Actualizar orden
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: orderStatus,
        paymentStatus: paymentStatus
      }
    });

    // Crear transacción de captura
    await createPaymentTransaction({
      paymentId: payment.id,
      type: 'CAPTURE',
      amount: payment.amount,
      currency: payment.currency,
      status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'FAILED',
      providerTransactionId: paymentIntentId,
      providerResponse: paymentIntent
    });

    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: status,
        orderStatus: orderStatus
      }
    });

  } catch (error) {
    console.error('Error confirming Stripe payment:', error);
    res.status(500).json({ 
      error: 'Error al confirmar el pago',
      details: error.message 
    });
  }
});

// ==================== MERCADOPAGO ROUTES ====================

/**
 * POST /api/payments/mercadopago/create-preference
 * Crear preferencia de pago de MercadoPago
 */
router.post('/mercadopago/create-preference', async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Validar orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: { 
          include: { 
            product: true,
            variant: true 
          } 
        } 
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para pagar esta orden' });
    }

    // Preparar items para MercadoPago
    const items = order.items.map(item => ({
      title: item.product.name + (item.variant ? ` - ${item.variant.name}` : ''),
      description: item.product.shortDesc || item.product.description,
      picture_url: item.product.imageUrl,
      category_id: 'food',
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: order.currency === 'USD' ? 'USD' : 'ARS'
    }));

    // URLs de retorno
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/checkout/success?orderId=${order.id}`;
    const failureUrl = `${baseUrl}/checkout/failure?orderId=${order.id}`;
    const pendingUrl = `${baseUrl}/checkout/pending?orderId=${order.id}`;

    // Crear preferencia
    const preference = {
      items: items,
      payer: {
        email: req.user.email,
        name: req.user.name
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      auto_return: 'approved',
      external_reference: order.id,
      statement_descriptor: 'CARNES PREMIUM',
      notification_url: `${process.env.BACKEND_URL || 'http://localhost:3002'}/api/payments/mercadopago/webhook`,
      metadata: {
        order_id: order.id,
        order_number: order.orderNumber,
        user_id: userId
      }
    };

    const response = await mercadopago.preferences.create(preference);

    // Crear registro de pago
    const payment = await createPaymentRecord({
      orderId: order.id,
      userId: userId,
      provider: 'MERCADOPAGO',
      providerPaymentId: response.body.id,
      paymentMethod: 'MERCADOPAGO',
      amount: order.total,
      currency: order.currency,
      status: 'PENDING',
      successUrl: successUrl,
      failureUrl: failureUrl,
      pendingUrl: pendingUrl,
      providerResponse: response.body,
      metadata: {
        preferenceId: response.body.id,
        initPoint: response.body.init_point,
        sandboxInitPoint: response.body.sandbox_init_point
      }
    });

    res.json({
      success: true,
      payment: {
        id: payment.id,
        preferenceId: response.body.id,
        initPoint: response.body.init_point,
        sandboxInitPoint: response.body.sandbox_init_point
      }
    });

  } catch (error) {
    console.error('Error creating MercadoPago preference:', error);
    res.status(500).json({ 
      error: 'Error al crear la preferencia de pago',
      details: error.message 
    });
  }
});

/**
 * GET /api/payments/mercadopago/payment-status/:paymentId
 * Consultar estado de pago en MercadoPago
 */
router.get('/mercadopago/payment-status/:mpPaymentId', async (req, res) => {
  try {
    const { mpPaymentId } = req.params;
    const userId = req.user.id;

    // Obtener el pago de MercadoPago
    const mpPayment = await mercadopago.payment.get(mpPaymentId);

    // Buscar el pago en nuestra BD
    const payment = await prisma.payment.findFirst({
      where: {
        userId: userId,
        provider: 'MERCADOPAGO'
      },
      include: { order: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Mapear estado de MercadoPago a nuestro sistema
    let status = 'PENDING';
    let orderStatus = 'PENDING';
    let paymentStatus = 'PENDING';

    switch (mpPayment.body.status) {
      case 'approved':
        status = 'CAPTURED';
        orderStatus = 'CONFIRMED';
        paymentStatus = 'CAPTURED';
        break;
      case 'in_process':
        status = 'PROCESSING';
        paymentStatus = 'AUTHORIZED';
        break;
      case 'rejected':
      case 'cancelled':
        status = 'FAILED';
        paymentStatus = 'FAILED';
        break;
      case 'refunded':
        status = 'REFUNDED';
        paymentStatus = 'REFUNDED';
        break;
    }

    // Actualizar pago
    await updatePaymentStatus(payment.id, status, {
      providerPaymentId: mpPayment.body.id.toString(),
      paymentMethod: mpPayment.body.payment_type_id?.toUpperCase() || 'MERCADOPAGO',
      cardBrand: mpPayment.body.payment_method_id?.toUpperCase(),
      cardLast4: mpPayment.body.card?.last_four_digits,
      capturedAt: mpPayment.body.status === 'approved' ? new Date(mpPayment.body.date_approved) : null,
      failedAt: ['rejected', 'cancelled'].includes(mpPayment.body.status) ? new Date() : null,
      providerResponse: JSON.stringify(mpPayment.body)
    });

    // Actualizar orden
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: orderStatus,
        paymentStatus: paymentStatus,
        paymentMethod: mpPayment.body.payment_method_id?.toUpperCase()
      }
    });

    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: status,
        orderStatus: orderStatus,
        mercadoPagoStatus: mpPayment.body.status,
        statusDetail: mpPayment.body.status_detail
      }
    });

  } catch (error) {
    console.error('Error getting MercadoPago payment status:', error);
    res.status(500).json({ 
      error: 'Error al consultar el estado del pago',
      details: error.message 
    });
  }
});

// ==================== PAYMENT HISTORY ====================

/**
 * GET /api/payments/history
 * Obtener historial de pagos del usuario
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status, provider } = req.query;

    const where = { userId };
    if (status) where.status = status;
    if (provider) where.provider = provider;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.payment.count({ where });

    res.json({
      success: true,
      payments: payments.map(p => ({
        ...p,
        metadata: p.metadata ? JSON.parse(p.metadata) : null,
        providerResponse: null // No enviar respuesta completa al cliente
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ 
      error: 'Error al obtener historial de pagos',
      details: error.message 
    });
  }
});

/**
 * GET /api/payments/:paymentId
 * Obtener detalles de un pago específico
 */
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: userId
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
                variant: true
              }
            }
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' }
        },
        refunds: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    res.json({
      success: true,
      payment: {
        ...payment,
        metadata: payment.metadata ? JSON.parse(payment.metadata) : null,
        providerResponse: null, // No enviar respuesta completa
        transactions: payment.transactions.map(t => ({
          ...t,
          metadata: t.metadata ? JSON.parse(t.metadata) : null,
          providerResponse: null
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ 
      error: 'Error al obtener detalles del pago',
      details: error.message 
    });
  }
});

// ==================== REFUND ROUTES ====================

/**
 * POST /api/payments/:paymentId/refund
 * Solicitar reembolso (usuario)
 */
router.post('/:paymentId/refund', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason, reasonDetails, amount } = req.body;
    const userId = req.user.id;

    // Validar pago
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: userId
      },
      include: { order: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    if (payment.status !== 'CAPTURED' && payment.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'El pago no puede ser reembolsado en su estado actual' });
    }

    // Validar que no haya reembolsos pendientes o completados
    const existingRefund = await prisma.refund.findFirst({
      where: {
        paymentId: payment.id,
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] }
      }
    });

    if (existingRefund) {
      return res.status(400).json({ error: 'Ya existe una solicitud de reembolso para este pago' });
    }

    // Determinar tipo de reembolso
    const refundAmount = amount || payment.amount;
    const type = refundAmount === payment.amount ? 'FULL' : 'PARTIAL';

    // Crear solicitud de reembolso
    const refund = await prisma.refund.create({
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: userId,
        type: type,
        reason: reason || 'CUSTOMER_REQUEST',
        reasonDetails: reasonDetails,
        amount: refundAmount,
        currency: payment.currency,
        status: 'PENDING',
        requestedBy: userId
      }
    });

    // TODO: Enviar notificación al admin para aprobar el reembolso

    res.json({
      success: true,
      refund: {
        id: refund.id,
        status: refund.status,
        amount: refund.amount,
        type: refund.type,
        message: 'Solicitud de reembolso creada. Pendiente de aprobación del administrador.'
      }
    });

  } catch (error) {
    console.error('Error creating refund request:', error);
    res.status(500).json({ 
      error: 'Error al crear solicitud de reembolso',
      details: error.message 
    });
  }
});

/**
 * GET /api/payments/refunds/my-requests
 * Obtener mis solicitudes de reembolso
 */
router.get('/refunds/my-requests', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const refunds = await prisma.refund.findMany({
      where: { userId },
      include: {
        payment: {
          include: {
            order: {
              select: {
                orderNumber: true,
                total: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.refund.count({ where: { userId } });

    res.json({
      success: true,
      refunds,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching refund requests:', error);
    res.status(500).json({ 
      error: 'Error al obtener solicitudes de reembolso',
      details: error.message 
    });
  }
});

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/payments/admin/all
 * Obtener todos los pagos (admin)
 */
router.get('/admin/all', async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos de administrador' });
    }

    const { page = 1, limit = 50, status, provider, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (provider) where.provider = provider;

    if (search) {
      where.OR = [
        { providerPaymentId: { contains: search } },
        { order: { orderNumber: { contains: search } } }
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.payment.count({ where });

    // Estadísticas
    const stats = await prisma.payment.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: true
    });

    res.json({
      success: true,
      payments,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching admin payments:', error);
    res.status(500).json({ 
      error: 'Error al obtener pagos',
      details: error.message 
    });
  }
});

/**
 * GET /api/payments/admin/refunds
 * Obtener solicitudes de reembolso (admin)
 */
router.get('/admin/refunds', async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos de administrador' });
    }

    const { page = 1, limit = 50, status } = req.query;

    const where = {};
    if (status) where.status = status;

    const refunds = await prisma.refund.findMany({
      where,
      include: {
        payment: {
          include: {
            order: {
              select: {
                orderNumber: true,
                total: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.refund.count({ where });

    res.json({
      success: true,
      refunds,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching admin refunds:', error);
    res.status(500).json({ 
      error: 'Error al obtener reembolsos',
      details: error.message 
    });
  }
});

/**
 * POST /api/payments/admin/refunds/:refundId/approve
 * Aprobar y procesar reembolso (admin)
 */
router.post('/admin/refunds/:refundId/approve', async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos de administrador' });
    }

    const { refundId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    // Obtener reembolso
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: { payment: true }
    });

    if (!refund) {
      return res.status(404).json({ error: 'Reembolso no encontrado' });
    }

    if (refund.status !== 'PENDING') {
      return res.status(400).json({ error: 'El reembolso ya fue procesado' });
    }

    // Procesar reembolso según el proveedor
    let providerRefund = null;
    let refundStatus = 'PROCESSING';

    try {
      if (refund.payment.provider === 'STRIPE') {
        // Reembolso en Stripe
        providerRefund = await stripe.refunds.create({
          payment_intent: refund.payment.providerPaymentId,
          amount: Math.round(refund.amount * 100), // Centavos
          reason: 'requested_by_customer',
          metadata: {
            refundId: refund.id,
            orderId: refund.orderId
          }
        });

        refundStatus = providerRefund.status === 'succeeded' ? 'COMPLETED' : 'PROCESSING';

      } else if (refund.payment.provider === 'MERCADOPAGO') {
        // Reembolso en MercadoPago
        providerRefund = await mercadopago.refund.create({
          payment_id: parseInt(refund.payment.providerPaymentId),
          amount: refund.amount
        });

        refundStatus = providerRefund.body.status === 'approved' ? 'COMPLETED' : 'PROCESSING';
      }

    } catch (providerError) {
      console.error('Error processing refund with provider:', providerError);
      refundStatus = 'FAILED';
    }

    // Actualizar reembolso
    const updatedRefund = await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: refundStatus,
        approvedBy: adminId,
        approvedAt: new Date(),
        processedAt: refundStatus === 'COMPLETED' ? new Date() : null,
        completedAt: refundStatus === 'COMPLETED' ? new Date() : null,
        failedAt: refundStatus === 'FAILED' ? new Date() : null,
        providerRefundId: providerRefund?.id || providerRefund?.body?.id?.toString(),
        providerResponse: providerRefund ? JSON.stringify(providerRefund) : null,
        notes: notes,
        errorMessage: refundStatus === 'FAILED' ? 'Error al procesar con el proveedor de pagos' : null
      }
    });

    // Si el reembolso fue completado, actualizar pago y orden
    if (refundStatus === 'COMPLETED') {
      // Actualizar estado del pago
      await updatePaymentStatus(refund.payment.id, 
        refund.type === 'FULL' ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
      );

      // Actualizar orden
      await prisma.order.update({
        where: { id: refund.orderId },
        data: {
          status: 'REFUNDED',
          paymentStatus: 'REFUNDED'
        }
      });

      // Crear transacción de reembolso
      await createPaymentTransaction({
        paymentId: refund.payment.id,
        type: 'REFUND',
        amount: refund.amount,
        currency: refund.currency,
        status: 'COMPLETED',
        providerTransactionId: providerRefund?.id || providerRefund?.body?.id?.toString(),
        providerResponse: providerRefund
      });
    }

    res.json({
      success: true,
      refund: updatedRefund,
      message: refundStatus === 'COMPLETED' 
        ? 'Reembolso procesado exitosamente' 
        : refundStatus === 'PROCESSING'
        ? 'Reembolso en proceso'
        : 'Error al procesar el reembolso'
    });

  } catch (error) {
    console.error('Error approving refund:', error);
    res.status(500).json({ 
      error: 'Error al aprobar reembolso',
      details: error.message 
    });
  }
});

/**
 * POST /api/payments/admin/refunds/:refundId/reject
 * Rechazar reembolso (admin)
 */
router.post('/admin/refunds/:refundId/reject', async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos de administrador' });
    }

    const { refundId } = req.params;
    const { rejectionReason } = req.body;

    const refund = await prisma.refund.findUnique({
      where: { id: refundId }
    });

    if (!refund) {
      return res.status(404).json({ error: 'Reembolso no encontrado' });
    }

    if (refund.status !== 'PENDING') {
      return res.status(400).json({ error: 'El reembolso ya fue procesado' });
    }

    // Rechazar reembolso
    const updatedRefund = await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'CANCELLED',
        rejectedAt: new Date(),
        rejectionReason: rejectionReason || 'Rechazado por el administrador'
      }
    });

    res.json({
      success: true,
      refund: updatedRefund,
      message: 'Reembolso rechazado'
    });

  } catch (error) {
    console.error('Error rejecting refund:', error);
    res.status(500).json({ 
      error: 'Error al rechazar reembolso',
      details: error.message 
    });
  }
});

/**
 * GET /api/payments/admin/stats
 * Estadísticas de pagos (admin)
 */
router.get('/admin/stats', async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos de administrador' });
    }

    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter }
      : {};

    // Total de pagos
    const totalPayments = await prisma.payment.count({ where });

    // Total recaudado
    const totalRevenue = await prisma.payment.aggregate({
      where: { ...where, status: { in: ['CAPTURED', 'COMPLETED'] } },
      _sum: { amount: true }
    });

    // Pagos por proveedor
    const byProvider = await prisma.payment.groupBy({
      where,
      by: ['provider'],
      _sum: { amount: true },
      _count: true
    });

    // Pagos por estado
    const byStatus = await prisma.payment.groupBy({
      where,
      by: ['status'],
      _sum: { amount: true },
      _count: true
    });

    // Reembolsos totales
    const totalRefunds = await prisma.refund.aggregate({
      where: { 
        ...where,
        status: 'COMPLETED' 
      },
      _sum: { amount: true },
      _count: true
    });

    // Métodos de pago más usados
    const byPaymentMethod = await prisma.payment.groupBy({
      where,
      by: ['paymentMethod'],
      _count: true,
      orderBy: { _count: { paymentMethod: 'desc' } },
      take: 5
    });

    res.json({
      success: true,
      stats: {
        totalPayments,
        totalRevenue: totalRevenue._sum.amount || 0,
        byProvider,
        byStatus,
        totalRefunds: {
          count: totalRefunds._count || 0,
          amount: totalRefunds._sum.amount || 0
        },
        topPaymentMethods: byPaymentMethod
      }
    });

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      details: error.message 
    });
  }
});

module.exports = router;
