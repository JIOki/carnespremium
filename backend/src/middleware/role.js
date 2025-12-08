/**
 * Role-based Authorization Middleware
 * Verifica que el usuario tenga el rol requerido para acceder a ciertos endpoints
 */

/**
 * Middleware para requerir un rol específico
 * @param {string} requiredRole - El rol requerido (ADMIN, CUSTOMER, etc.)
 * @returns {Function} Middleware function
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }

    // Verificar que el usuario tenga el rol requerido
    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado. Se requiere rol: ${requiredRole}`
      });
    }

    next();
  };
};

/**
 * Middleware para requerir uno de varios roles
 * @param {Array<string>} allowedRoles - Array de roles permitidos
 * @returns {Function} Middleware function
 */
const requireAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware para verificar si es administrador
 * @returns {Function} Middleware function
 */
const requireAdmin = () => requireRole('ADMIN');

module.exports = {
  requireRole,
  requireAnyRole,
  requireAdmin
};
