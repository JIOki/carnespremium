const jwt = require('jsonwebtoken');
const { getPrismaClient } = require('../database/connection');

/**
 * Middleware de autenticación JWT
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extraer token del header Authorization o cookie HTTPOnly
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    
    let token = null;
    
    // Prioridad: Header > Cookie
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }
    
    if (!token) {
      return res.status(401).json({
        error: 'Token de acceso requerido',
        code: 'MISSING_TOKEN'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario existe y está activo
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Usuario desactivado',
        code: 'USER_DEACTIVATED'
      });
    }

    // Agregar información del usuario al request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        code: 'EXPIRED_TOKEN'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware para verificar roles específicos
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario es admin
 */
const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN');

/**
 * Middleware para verificar que el usuario es repartidor
 */
const requireDriver = requireRole('DRIVER');

/**
 * Middleware para verificar que el usuario puede acceder a recursos específicos
 */
const requireOwnership = (resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.userId;

      // Los administradores pueden acceder a todo
      if (req.userRole === 'ADMIN' || req.userRole === 'SUPER_ADMIN') {
        return next();
      }

      // Para usuarios normales, verificar ownership
      if (resourceId !== userId) {
        return res.status(403).json({
          error: 'No tienes permisos para acceder a este recurso',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando ownership:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Middleware opcional de autenticación (para rutas que funcionan con o sin auth)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }
    
    if (!token) {
      return next(); // Continuar sin autenticación
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const prisma = getPrismaClient();
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });

      if (user && user.isActive) {
        req.user = user;
        req.userId = user.id;
        req.userRole = user.role;
      }
    } catch (error) {
      // Ignorar errores de token en auth opcional
    }

    next();
  } catch (error) {
    console.error('Error en autenticación opcional:', error);
    next(); // Continuar sin autenticación en caso de error
  }
};

/**
 * Utility function para generar tokens JWT
 */
const generateToken = (userId, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Utility function para verificar tokens
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  authMiddleware,
  authenticate: authMiddleware, // Alias para compatibilidad
  requireRole,
  requireAdmin,
  requireDriver,
  requireOwnership,
  optionalAuth,
  generateToken,
  verifyToken
};