/**
 * Async Handler Middleware
 * Wrapper para funciones async de Express que maneja automáticamente los errores
 */

/**
 * Envuelve funciones async para capturar errores automáticamente
 * @param {Function} fn - Función async a envolver
 * @returns {Function} Middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
