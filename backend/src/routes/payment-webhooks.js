const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const prisma = new PrismaClient();

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Inicializar MercadoPago (API v2.x)
const mercadopagoClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-dummy'
});
const paymentClient = new Payment(mercadopagoClient);

// ==================== STRIPE WEBHOOK ====================

/**
 * POST /api/webhooks/stripe
 * Webhook de Stripe para eventos de pago
 * NOTA: Esta ruta NO debe usar el middleware de autenticación
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verificar firma del webhook (en producción es obligatorio)
    if (stripeWebhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
    } else {
      // En desarrollo, parsear directamente
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Stripe webhook received: ${event.type}`);

  // Manejar el evento
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.processing':
        await handlePaymentIntentProcessing(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Manejar pago exitoso de Stripe
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('💳 Payment succeeded:', paymentIntent.id);

  try {
    // Buscar el pago en la BD
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: paymentIntent.id }
    });

    if (!payment) {
      console.log('Payment not found in database:', paymentIntent.id);
      return;
    }

    // Actualizar estado del pago
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CAPTURED',
        capturedAt: new Date(),
        cardBrand: paymentIntent.charges?.data[0]?.payment_method_details?.card?.brand?.toUpperCase(),
        cardLast4: paymentIntent.charges?.data[0]?.payment_method_details?.card?.last4,
        providerResponse: JSON.stringify(paymentIntent)
      }
    });

    // Actualizar orden
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'CAPTURED',
        paymentMethod: 'CREDIT_CARD'
      }
    });

    // Crear transacción
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        type: 'CAPTURE',
        amount: payment.amount,
        currency: payment.currency,
        status: 'COMPLETED',
        providerTransactionId: paymentIntent.id,
        providerResponse: JSON.stringify(paymentIntent)
      }
    });

    // TODO: Enviar notificación al usuario
    // TODO: Enviar email de confirmación
    // TODO: Actualizar inventario

    console.log('✅ Payment processed successfully');

  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Manejar pago fallido de Stripe
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);

  try {
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: paymentIntent.id }
    });

    if (!payment) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        errorCode: paymentIntent.last_payment_error?.code,
        errorMessage: paymentIntent.last_payment_error?.message,
        providerResponse: JSON.stringify(paymentIntent)
      }
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: 'FAILED'
      }
    });

    // Crear transacción de fallo
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        type: 'AUTHORIZATION',
        amount: payment.amount,
        currency: payment.currency,
        status: 'FAILED',
        providerTransactionId: paymentIntent.id,
        errorCode: paymentIntent.last_payment_error?.code,
        errorMessage: paymentIntent.last_payment_error?.message,
        providerResponse: JSON.stringify(paymentIntent)
      }
    });

    // TODO: Enviar notificación al usuario del fallo

  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

/**
 * Manejar pago en procesamiento de Stripe
 */
async function handlePaymentIntentProcessing(paymentIntent) {
  console.log('⏳ Payment processing:', paymentIntent.id);

  try {
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: paymentIntent.id }
    });

    if (!payment) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PROCESSING',
        providerResponse: JSON.stringify(paymentIntent)
      }
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: 'AUTHORIZED'
      }
    });

    // TODO: Notificar al usuario que el pago está siendo procesado

  } catch (error) {
    console.error('Error handling payment processing:', error);
    throw error;
  }
}

/**
 * Manejar pago cancelado de Stripe
 */
async function handlePaymentIntentCanceled(paymentIntent) {
  console.log('🚫 Payment canceled:', paymentIntent.id);

  try {
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: paymentIntent.id }
    });

    if (!payment) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CANCELLED',
        providerResponse: JSON.stringify(paymentIntent)
      }
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'CANCELLED'
      }
    });

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
    throw error;
  }
}

/**
 * Manejar reembolso de Stripe
 */
async function handleChargeRefunded(charge) {
  console.log('💰 Charge refunded:', charge.id);

  try {
    // Buscar el pago por el payment intent
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: charge.payment_intent }
    });

    if (!payment) {
      console.log('Payment not found for refunded charge:', charge.id);
      return;
    }

    // Verificar si ya existe un reembolso
    let refund = await prisma.refund.findFirst({
      where: {
        paymentId: payment.id,
        providerRefundId: charge.refunds.data[0]?.id
      }
    });

    if (!refund) {
      // Crear registro de reembolso automático
      refund = await prisma.refund.create({
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          userId: payment.userId,
          type: charge.amount_refunded === charge.amount ? 'FULL' : 'PARTIAL',
          reason: 'OTHER',
          reasonDetails: 'Reembolso procesado automáticamente por Stripe',
          amount: charge.amount_refunded / 100, // Convertir de centavos
          currency: payment.currency,
          status: 'COMPLETED',
          requestedBy: 'SYSTEM',
          approvedBy: 'SYSTEM',
          approvedAt: new Date(),
          processedAt: new Date(),
          completedAt: new Date(),
          providerRefundId: charge.refunds.data[0]?.id,
          providerResponse: JSON.stringify(charge)
        }
      });
    }

    // Actualizar estado del pago
    const isFullRefund = charge.amount_refunded === charge.amount;
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        providerResponse: JSON.stringify(charge)
      }
    });

    // Actualizar orden si es reembolso completo
    if (isFullRefund) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'REFUNDED',
          paymentStatus: 'REFUNDED'
        }
      });
    }

    // Crear transacción de reembolso
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        type: 'REFUND',
        amount: charge.amount_refunded / 100,
        currency: payment.currency,
        status: 'COMPLETED',
        providerTransactionId: charge.refunds.data[0]?.id,
        providerResponse: JSON.stringify(charge)
      }
    });

    // TODO: Notificar al usuario del reembolso

  } catch (error) {
    console.error('Error handling charge refund:', error);
    throw error;
  }
}

/**
 * Manejar disputa creada
 */
async function handleDisputeCreated(dispute) {
  console.log('⚠️ Dispute created:', dispute.id);

  try {
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: dispute.payment_intent }
    });

    if (!payment) return;

    // TODO: Crear registro de disputa
    // TODO: Notificar al admin
    // TODO: Actualizar estado del pago si es necesario

    console.log('Dispute recorded for payment:', payment.id);

  } catch (error) {
    console.error('Error handling dispute:', error);
    throw error;
  }
}

// ==================== MERCADOPAGO WEBHOOK ====================

/**
 * POST /api/webhooks/mercadopago
 * Webhook de MercadoPago para eventos de pago
 * NOTA: Esta ruta NO debe usar el middleware de autenticación
 */
router.post('/mercadopago', express.json(), async (req, res) => {
  console.log('📬 MercadoPago webhook received:', req.body);

  try {
    const { type, data, action } = req.body;

    // MercadoPago envía diferentes tipos de notificaciones
    if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data?.id;

      if (!paymentId) {
        return res.status(400).json({ error: 'Payment ID not provided' });
      }

      // Obtener información del pago desde MercadoPago
      const mpPayment = await mercadopago.payment.get(paymentId);

      await handleMercadoPagoPayment(mpPayment.body);

      res.status(200).json({ success: true });

    } else {
      console.log('Unhandled MercadoPago notification type:', type, action);
      res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('Error processing MercadoPago webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Manejar pago de MercadoPago
 */
async function handleMercadoPagoPayment(mpPayment) {
  console.log('💳 Processing MercadoPago payment:', mpPayment.id, 'Status:', mpPayment.status);

  try {
    // Buscar el pago en la BD por external_reference (orderId)
    const orderId = mpPayment.external_reference;
    
    if (!orderId) {
      console.log('No external reference found in MercadoPago payment');
      return;
    }

    const payment = await prisma.payment.findFirst({
      where: { 
        orderId: orderId,
        provider: 'MERCADOPAGO'
      }
    });

    if (!payment) {
      console.log('Payment not found for order:', orderId);
      return;
    }

    // Mapear estado de MercadoPago a nuestro sistema
    let status = 'PENDING';
    let orderStatus = 'PENDING';
    let paymentStatus = 'PENDING';
    let capturedAt = null;
    let failedAt = null;

    switch (mpPayment.status) {
      case 'approved':
        status = 'CAPTURED';
        orderStatus = 'CONFIRMED';
        paymentStatus = 'CAPTURED';
        capturedAt = new Date(mpPayment.date_approved);
        break;

      case 'in_process':
        status = 'PROCESSING';
        paymentStatus = 'AUTHORIZED';
        break;

      case 'pending':
        status = 'PENDING';
        paymentStatus = 'PENDING';
        break;

      case 'rejected':
        status = 'FAILED';
        paymentStatus = 'FAILED';
        failedAt = new Date();
        break;

      case 'cancelled':
        status = 'CANCELLED';
        paymentStatus = 'CANCELLED';
        break;

      case 'refunded':
        status = 'REFUNDED';
        paymentStatus = 'REFUNDED';
        await handleMercadoPagoRefund(payment, mpPayment);
        break;

      case 'charged_back':
        status = 'REFUNDED';
        paymentStatus = 'REFUNDED';
        break;
    }

    // Actualizar pago
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        providerPaymentId: mpPayment.id.toString(),
        paymentMethod: mpPayment.payment_type_id?.toUpperCase() || 'MERCADOPAGO',
        cardBrand: mpPayment.payment_method_id?.toUpperCase(),
        cardLast4: mpPayment.card?.last_four_digits,
        capturedAt,
        failedAt,
        errorCode: mpPayment.status_detail,
        errorMessage: mpPayment.status === 'rejected' ? 'Pago rechazado por MercadoPago' : null,
        providerResponse: JSON.stringify(mpPayment)
      }
    });

    // Actualizar orden
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: orderStatus,
        paymentStatus: paymentStatus,
        paymentMethod: mpPayment.payment_method_id?.toUpperCase()
      }
    });

    // Crear transacción
    let transactionType = 'AUTHORIZATION';
    let transactionStatus = 'PENDING';

    if (status === 'CAPTURED') {
      transactionType = 'CAPTURE';
      transactionStatus = 'COMPLETED';
    } else if (status === 'FAILED') {
      transactionStatus = 'FAILED';
    } else if (status === 'PROCESSING') {
      transactionStatus = 'PENDING';
    }

    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        type: transactionType,
        amount: payment.amount,
        currency: payment.currency,
        status: transactionStatus,
        providerTransactionId: mpPayment.id.toString(),
        errorCode: mpPayment.status_detail,
        errorMessage: mpPayment.status === 'rejected' ? 'Pago rechazado' : null,
        providerResponse: JSON.stringify(mpPayment)
      }
    });

    // TODO: Enviar notificaciones según el estado
    if (status === 'CAPTURED') {
      // TODO: Notificar éxito al usuario
      // TODO: Enviar email de confirmación
      // TODO: Actualizar inventario
      console.log('✅ MercadoPago payment captured successfully');
    } else if (status === 'FAILED') {
      // TODO: Notificar fallo al usuario
      console.log('❌ MercadoPago payment failed');
    }

  } catch (error) {
    console.error('Error handling MercadoPago payment:', error);
    throw error;
  }
}

/**
 * Manejar reembolso de MercadoPago
 */
async function handleMercadoPagoRefund(payment, mpPayment) {
  console.log('💰 Processing MercadoPago refund for payment:', payment.id);

  try {
    // Verificar si ya existe un reembolso
    const existingRefund = await prisma.refund.findFirst({
      where: {
        paymentId: payment.id,
        status: 'COMPLETED'
      }
    });

    if (existingRefund) {
      console.log('Refund already exists for payment:', payment.id);
      return;
    }

    // Crear registro de reembolso
    await prisma.refund.create({
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        type: 'FULL', // MercadoPago generalmente hace reembolsos completos
        reason: 'OTHER',
        reasonDetails: 'Reembolso procesado automáticamente por MercadoPago',
        amount: payment.amount,
        currency: payment.currency,
        status: 'COMPLETED',
        requestedBy: 'SYSTEM',
        approvedBy: 'SYSTEM',
        approvedAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        providerRefundId: mpPayment.id.toString(),
        providerResponse: JSON.stringify(mpPayment)
      }
    });

    // Crear transacción de reembolso
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        type: 'REFUND',
        amount: payment.amount,
        currency: payment.currency,
        status: 'COMPLETED',
        providerTransactionId: mpPayment.id.toString(),
        providerResponse: JSON.stringify(mpPayment)
      }
    });

    console.log('✅ MercadoPago refund recorded successfully');

    // TODO: Notificar al usuario del reembolso

  } catch (error) {
    console.error('Error handling MercadoPago refund:', error);
    throw error;
  }
}

// ==================== HEALTH CHECK ====================

/**
 * GET /api/webhooks/health
 * Health check para verificar que el servicio de webhooks está funcionando
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    webhooks: {
      stripe: stripeWebhookSecret ? 'configured' : 'not_configured',
      mercadopago: process.env.MERCADOPAGO_ACCESS_TOKEN ? 'configured' : 'not_configured'
    }
  });
});

module.exports = router;
