const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');

const { getPrismaClient } = require('../database/connection');
const { asyncHandler, CustomError, CommonErrors } = require('../middleware/errorHandler');
const { generateToken, authMiddleware } = require('../middleware/auth');
const RedisService = require('../services/RedisService');

const router = express.Router();

// Rate limiting específico para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por IP
  message: {
    error: 'Demasiados intentos de inicio de sesión, intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ==================== ESQUEMAS DE VALIDACIÓN ====================

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 100 caracteres',
    'any.required': 'El nombre es requerido'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'El email es requerido'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required().messages({
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'string.pattern.base': 'La contraseña debe contener al menos una minúscula, una mayúscula, un número y un carácter especial',
    'any.required': 'La contraseña es requerida'
  }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
    'string.pattern.base': 'El teléfono debe tener 10 dígitos'
  }),
  role: Joi.string().valid('CUSTOMER', 'DRIVER').default('CUSTOMER')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required()
});

// ==================== RUTAS ====================

/**
 * POST /api/auth/register
 * Registro de nuevos usuarios
 */
router.post('/register', asyncHandler(async (req, res) => {
  // Validar datos
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw CommonErrors.ValidationError(error.details[0].message, error.details);
  }

  const { name, email, password, phone, role } = value;
  const prisma = getPrismaClient();

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    throw CommonErrors.Conflict('El email ya está registrado');
  }

  // Hash de la contraseña
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    // Crear usuario en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          phone,
          role
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      // Inicializar puntos de lealtad para CUSTOMER
      if (role === 'CUSTOMER') {
        await tx.loyaltyPoints.create({
          data: {
            userId: user.id,
            currentPoints: 0,
            totalEarned: 0,
            totalRedeemed: 0,
            lifetimePoints: 0,
            tier: 'BRONZE',
            tierProgress: 0.0,
            nextTierPoints: 500
          }
        });
      }

      return user;
    });

    // Generar token JWT
    const token = generateToken(result.id);

    // Guardar sesión en Redis
    await RedisService.setUserSession(result.id, {
      userId: result.id,
      email: result.email,
      role: result.role,
      loginAt: new Date().toISOString()
    });

    // Configurar cookie HTTPOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: result,
        token // También enviamos el token para compatibilidad
      }
    });

  } catch (error) {
    if (error.code === 'P2002') {
      throw CommonErrors.Conflict('El email ya está registrado');
    }
    throw error;
  }
}));

/**
 * POST /api/auth/login
 * Inicio de sesión
 */
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  // Validar datos
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw CommonErrors.ValidationError(error.details[0].message);
  }

  const { email, password } = value;
  const prisma = getPrismaClient();

  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role: true,
      isActive: true
    }
  });

  if (!user) {
    throw CommonErrors.Unauthorized('Email o contraseña incorrectos');
  }

  if (!user.isActive) {
    throw CommonErrors.Unauthorized('Cuenta desactivada. Contacta soporte');
  }

  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw CommonErrors.Unauthorized('Email o contraseña incorrectos');
  }

  // Generar token
  const token = generateToken(user.id);

  // Guardar sesión en Redis
  await RedisService.setUserSession(user.id, {
    userId: user.id,
    email: user.email,
    role: user.role,
    loginAt: new Date().toISOString()
  });

  // Respuesta (sin password)
  const { password: _, ...userWithoutPassword } = user;
  
  // Configurar cookie HTTPOnly
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
  });

  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data: {
      user: userWithoutPassword,
      token // También enviamos el token para compatibilidad
    }
  });
}));

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout', asyncHandler(async (req, res) => {
  // Obtener token de header o cookie
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.substring(7) 
    : cookieToken;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Eliminar sesión de Redis
      await RedisService.deleteUserSession(decoded.userId);
    } catch (error) {
      // Ignorar errores de token en logout
    }
  }

  // Limpiar cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
}));

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
  // El userId viene del middleware de autenticación
  const userId = req.userId;
  
  if (!userId) {
    throw CommonErrors.Unauthorized('Token de autenticación requerido');
  }

  const prisma = getPrismaClient();
  
  // Obtener perfil del usuario con relaciones
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      // Incluir relaciones relevantes
      addresses: {
        where: { isDefault: true },
        take: 1
      },
      loyalty: {
        select: {
          currentPoints: true,
          tier: true,
          tierProgress: true
        }
      },
      membership: {
        select: {
          id: true,
          status: true,
          plan: {
            select: {
              name: true,
              displayName: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw CommonErrors.NotFound('Usuario no encontrado');
  }

  res.json({
    success: true,
    data: user
  });
}));

/**
 * POST /api/auth/forgot-password
 * Solicitar restablecimiento de contraseña
 */
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { error, value } = forgotPasswordSchema.validate(req.body);
  if (error) {
    throw CommonErrors.ValidationError(error.details[0].message);
  }

  const { email } = value;
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  // Por seguridad, siempre devolver success aunque el email no exista
  if (user) {
    // Generar token de reset (válido por 1 hora)
    const resetToken = generateToken(user.id, '1h');
    
    // Guardar token en Redis con TTL
    await RedisService.set(`reset_token:${user.id}`, resetToken, 3600);

    // Aquí enviarías el email con el token
    // await EmailService.sendPasswordReset(user.email, resetToken);
    
    console.log(`Token de reset para ${user.email}: ${resetToken}`);
  }

  res.json({
    success: true,
    message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
  });
}));

/**
 * POST /api/auth/reset-password
 * Restablecer contraseña
 */
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) {
    throw CommonErrors.ValidationError(error.details[0].message);
  }

  const { token, password } = value;
  const prisma = getPrismaClient();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el token existe en Redis
    const cachedToken = await RedisService.get(`reset_token:${decoded.userId}`);
    if (!cachedToken || cachedToken !== token) {
      throw CommonErrors.BadRequest('Token de reset inválido o expirado');
    }

    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    });

    // Eliminar token de reset
    await RedisService.del(`reset_token:${decoded.userId}`);

    // Eliminar todas las sesiones del usuario
    await RedisService.deleteUserSession(decoded.userId);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw CommonErrors.BadRequest('Token de reset inválido o expirado');
    }
    throw error;
  }
}));

/**
 * GET /api/auth/verify-token
 * Verificar token JWT
 */
router.get('/verify-token', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw CommonErrors.BadRequest('Token requerido');
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const prisma = getPrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      throw CommonErrors.Unauthorized('Token inválido');
    }

    res.json({
      success: true,
      data: {
        user,
        tokenValid: true
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw CommonErrors.Unauthorized('Token inválido o expirado');
    }
    throw error;
  }
}));

/**
 * POST /api/auth/refresh-token
 * Refrescar token JWT
 */
router.post('/refresh-token', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw CommonErrors.BadRequest('Token requerido');
  }

  const token = authHeader.substring(7);
  
  try {
    // Verificar token (incluso si está cerca de expirar)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: false });
    const prisma = getPrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      throw CommonErrors.Unauthorized('Usuario inválido');
    }

    // Generar nuevo token
    const newToken = generateToken(user.id);

    // Actualizar sesión en Redis
    await RedisService.setUserSession(user.id, {
      userId: user.id,
      email: user.email,
      role: user.role,
      refreshedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        user,
        token: newToken
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw CommonErrors.Unauthorized('Token inválido para refrescar');
    }
    throw error;
  }
}));

module.exports = router;