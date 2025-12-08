/**
 * Middleware de manejo de errores centralizado
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.userId || 'No autenticado'
  });

  // Error de validación de Prisma
  if (err.code === 'P2002') {
    const message = 'Recurso duplicado';
    error = { 
      message, 
      statusCode: 400,
      code: 'DUPLICATE_RESOURCE'
    };
  }

  // Error de registro no encontrado de Prisma
  if (err.code === 'P2025') {
    const message = 'Registro no encontrado';
    error = { 
      message, 
      statusCode: 404,
      code: 'RECORD_NOT_FOUND'
    };
  }

  // Error de conexión a base de datos de Prisma
  if (err.code === 'P1001') {
    const message = 'No se puede conectar a la base de datos';
    error = { 
      message, 
      statusCode: 500,
      code: 'DATABASE_CONNECTION_ERROR'
    };
  }

  // Errores de validación de Joi
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    error = { 
      message, 
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: err.details
    };
  }

  // Error de cast de MongoDB/ID inválido
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = { 
      message, 
      statusCode: 404,
      code: 'INVALID_ID'
    };
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = { 
      message, 
      statusCode: 401,
      code: 'INVALID_TOKEN'
    };
  }

  // Error de JWT expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = { 
      message, 
      statusCode: 401,
      code: 'EXPIRED_TOKEN'
    };
  }

  // Error de archivo muy grande
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'Archivo demasiado grande';
    error = { 
      message, 
      statusCode: 400,
      code: 'FILE_TOO_LARGE'
    };
  }

  // Error de tipo de archivo no permitido
  if (err.code === 'LIMIT_FILE_TYPE') {
    const message = 'Tipo de archivo no permitido';
    error = { 
      message, 
      statusCode: 400,
      code: 'INVALID_FILE_TYPE'
    };
  }

  // Errores personalizados
  if (err.isCustomError) {
    error = {
      message: err.message,
      statusCode: err.statusCode || 400,
      code: err.code || 'CUSTOM_ERROR'
    };
  }

  // Error por defecto
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Error interno del servidor';
  const code = error.code || 'INTERNAL_ERROR';

  // Respuesta de error
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: error.details
    }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

/**
 * Función para crear errores personalizados
 */
class CustomError extends Error {
  constructor(message, statusCode = 400, code = 'CUSTOM_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isCustomError = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores comunes predefinidos
 */
const CommonErrors = {
  NotFound: (resource = 'Recurso') => new CustomError(
    `${resource} no encontrado`, 
    404, 
    'NOT_FOUND'
  ),
  
  Unauthorized: (message = 'No autorizado') => new CustomError(
    message, 
    401, 
    'UNAUTHORIZED'
  ),
  
  Forbidden: (message = 'Acceso prohibido') => new CustomError(
    message, 
    403, 
    'FORBIDDEN'
  ),
  
  BadRequest: (message = 'Solicitud inválida') => new CustomError(
    message, 
    400, 
    'BAD_REQUEST'
  ),
  
  Conflict: (message = 'Conflicto en la solicitud') => new CustomError(
    message, 
    409, 
    'CONFLICT'
  ),
  
  ValidationError: (message = 'Error de validación', details = null) => {
    const error = new CustomError(message, 400, 'VALIDATION_ERROR');
    if (details) error.details = details;
    return error;
  },
  
  DatabaseError: (message = 'Error de base de datos') => new CustomError(
    message, 
    500, 
    'DATABASE_ERROR'
  ),
  
  ExternalServiceError: (service = 'servicio externo') => new CustomError(
    `Error en ${service}`, 
    502, 
    'EXTERNAL_SERVICE_ERROR'
  ),
  
  RateLimitError: (message = 'Demasiadas solicitudes') => new CustomError(
    message, 
    429, 
    'RATE_LIMIT_EXCEEDED'
  ),
  
  PaymentError: (message = 'Error en el pago') => new CustomError(
    message, 
    402, 
    'PAYMENT_ERROR'
  ),
  
  OutOfStock: (product = 'Producto') => new CustomError(
    `${product} sin stock disponible`, 
    409, 
    'OUT_OF_STOCK'
  ),
  
  InvalidLocation: () => new CustomError(
    'Ubicación no válida o fuera del área de cobertura', 
    400, 
    'INVALID_LOCATION'
  ),
  
  OrderNotFound: () => new CustomError(
    'Pedido no encontrado', 
    404, 
    'ORDER_NOT_FOUND'
  ),
  
  OrderAlreadyDelivered: () => new CustomError(
    'El pedido ya ha sido entregado', 
    409, 
    'ORDER_ALREADY_DELIVERED'
  ),
  
  RouteOptimizationFailed: () => new CustomError(
    'Error al optimizar la ruta', 
    500, 
    'ROUTE_OPTIMIZATION_FAILED'
  )
};

/**
 * Wrapper para async functions que maneja errores automáticamente
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Middleware para manejar rutas no encontradas
 */
const notFoundHandler = (req, res, next) => {
  const error = new CustomError(
    `Ruta no encontrada - ${req.originalUrl}`, 
    404, 
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

module.exports = {
  errorHandler,
  CustomError,
  CommonErrors,
  asyncHandler,
  notFoundHandler
};