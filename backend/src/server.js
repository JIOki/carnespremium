require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Importar middlewares personalizados
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products-simple');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const deliveryRoutes = require('./routes/delivery');
const trackingRoutes = require('./routes/tracking');
const couponRoutes = require('./routes/coupon');
const reviewRoutes = require('./routes/review');
const notificationRoutes = require('./routes/notification');
const wishlistRoutes = require('./routes/wishlist');
const loyaltyRoutes = require('./routes/loyalty');
const gamificationRoutes = require('./routes/gamification');
const adminRoutes = require('./routes/admin');
const routeOptimizationRoutes = require('./routes/routeOptimization');
const paymentRoutes = require('./routes/payments');
const paymentWebhookRoutes = require('./routes/payment-webhooks');
const inventoryRoutes = require('./routes/inventory');
const reportsRoutes = require('./routes/reports');
const subscriptionRoutes = require('./routes/subscriptions');
const recommendationRoutes = require('./routes/recommendations');
const membershipRoutes = require('./routes/memberships');
const analyticsRoutes = require('./routes/analytics');

// Importar servicios
const { initializeDatabase } = require('./database/connection');
const RedisService = require('./services/RedisService');
const SocketService = require('./services/SocketService');
const chatRoutes = require('./routes/chat');


const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://tu-dominio.com'] 
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST']
  }
});

// ==================== CONFIGURACIÓN MIDDLEWARE ====================

// Seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compresión GZIP
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-dominio.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate Limiting (aumentado para desarrollo y testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 5000, // 5000 en dev/test, 100 en producción
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta más tarde.'
  }
});
app.use('/api', limiter);

// Slow Down para APIs críticas (reducido en desarrollo para testing)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: process.env.NODE_ENV === 'production' ? 50 : 1000, // 1000 en dev/test, 50 en producción
  delayMs: 500 // agregar 500ms de delay por cada request después del límite
});
app.use('/api/auth', speedLimiter);
app.use('/api/orders', speedLimiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ==================== WEBHOOKS (antes del parseo de JSON) ====================
// Los webhooks de Stripe requieren el body raw para verificar la firma
app.use('/api/webhooks', paymentWebhookRoutes);

// Parseo de body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// ==================== RUTAS API ====================

// Rutas públicas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/chat', chatRoutes);

// Rutas de tracking (parcialmente públicas para seguimiento)
app.use('/api/tracking', trackingRoutes);

// Rutas protegidas (requieren autenticación)
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/cart', authMiddleware, cartRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/coupon', couponRoutes); // Tiene auth interno según endpoint
app.use('/api/coupons', couponRoutes); // Alias plural
app.use('/api/review', authMiddleware, reviewRoutes);
app.use('/api/reviews', authMiddleware, reviewRoutes); // Alias plural
app.use('/api/notification', authMiddleware, notificationRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes); // Alias plural
app.use('/api/wishlist', authMiddleware, wishlistRoutes);
app.use('/api/loyalty', authMiddleware, loyaltyRoutes);

// Rutas administrativas
app.use('/api/admin', authMiddleware, adminRoutes);

// Rutas de entrega (para repartidores)
app.use('/api/delivery', authMiddleware, deliveryRoutes);

// Rutas de optimización de rutas (interno)
app.use('/api/routes', authMiddleware, routeOptimizationRoutes);

// Rutas de inventario (admin)
app.use('/api/inventory', authMiddleware, inventoryRoutes);

// Rutas de reportes y analytics (admin)
app.use('/api/reports', reportsRoutes);

// Rutas de suscripciones y membresías
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/memberships', membershipRoutes);

// Rutas de recomendaciones y personalización
app.use('/api/recommendations', recommendationRoutes);

// Rutas de analytics
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Rutas de gamificación y fidelización
app.use('/api/gamification', authMiddleware, gamificationRoutes);

// ==================== MANEJO DE ERRORES ====================

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// ==================== CONFIGURACIÓN SOCKET.IO ====================

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Configurar el servicio de Socket para este socket
  SocketService.handleConnection(socket);
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// ==================== INICIALIZACIÓN SERVIDOR ====================

async function startServer() {
  try {
    // Inicializar base de datos
    await initializeDatabase();
    console.log('✅ Base de datos conectada');

    // Inicializar Redis si está configurado
    if (process.env.REDIS_URL) {
      await RedisService.connect();
      console.log('✅ Redis conectado');
    } else {
      console.log('⚠️ Redis no configurado - funcionando sin cache');
    }

    // Configurar Socket service
    SocketService.initialize(io);
    console.log('✅ Socket.IO configurado');

    // Iniciar servidor
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Error al inicializar servidor:', error);
    process.exit(1);
  }
}

// Manejo graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  await RedisService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recibido, cerrando servidor...');
  await RedisService.disconnect();
  process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = { app, server, io };