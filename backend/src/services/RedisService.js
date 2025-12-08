const Redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Conecta al servidor Redis
   */
  async connect() {
    try {
      this.client = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Conectado a Redis');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('Redis listo para usar');
      });

      await this.client.connect();
      
    } catch (error) {
      console.error('Error conectando a Redis:', error);
      // No lanzar error para que la app funcione sin Redis
      this.isConnected = false;
    }
  }

  /**
   * Desconecta de Redis
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  /**
   * Guarda un valor en cache
   */
  async set(key, value, expireInSeconds = 3600) {
    if (!this.isConnected) return null;
    
    try {
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, expireInSeconds, serializedValue);
      return true;
    } catch (error) {
      console.error('Error guardando en Redis:', error);
      return false;
    }
  }

  /**
   * Obtiene un valor del cache
   */
  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error obteniendo de Redis:', error);
      return null;
    }
  }

  /**
   * Elimina una clave del cache
   */
  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Error eliminando de Redis:', error);
      return false;
    }
  }

  /**
   * Cache para productos más vendidos
   */
  async cacheTopProducts(products, duration = 1800) { // 30 minutos
    return await this.set('top_products', products, duration);
  }

  async getTopProducts() {
    return await this.get('top_products');
  }

  /**
   * Cache para rutas optimizadas
   */
  async cacheOptimizedRoute(date, driverId, route, duration = 7200) { // 2 horas
    const key = `optimized_route:${date}:${driverId}`;
    return await this.set(key, route, duration);
  }

  async getOptimizedRoute(date, driverId) {
    const key = `optimized_route:${date}:${driverId}`;
    return await this.get(key);
  }

  /**
   * Cache para información de ubicación
   */
  async cacheLocationInfo(latitude, longitude, info, duration = 86400) { // 24 horas
    const key = `location:${latitude}:${longitude}`;
    return await this.set(key, info, duration);
  }

  async getLocationInfo(latitude, longitude) {
    const key = `location:${latitude}:${longitude}`;
    return await this.get(key);
  }

  /**
   * Guarda sesión de usuario
   */
  async setUserSession(userId, sessionData, duration = 86400) { // 24 horas
    const key = `session:${userId}`;
    return await this.set(key, sessionData, duration);
  }

  async getUserSession(userId) {
    const key = `session:${userId}`;
    return await this.get(key);
  }

  async deleteUserSession(userId) {
    const key = `session:${userId}`;
    return await this.del(key);
  }

  /**
   * Manejo de carrito en tiempo real
   */
  async setCart(userId, cartData, duration = 604800) { // 7 días
    const key = `cart:${userId}`;
    return await this.set(key, cartData, duration);
  }

  async getCart(userId) {
    const key = `cart:${userId}`;
    return await this.get(key);
  }

  async deleteCart(userId) {
    const key = `cart:${userId}`;
    return await this.del(key);
  }

  /**
   * Rate limiting por usuario
   */
  async checkRateLimit(userId, action, maxAttempts = 5, windowSeconds = 300) {
    if (!this.isConnected) return true; // Permitir si Redis no está disponible
    
    const key = `rate_limit:${userId}:${action}`;
    
    try {
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, windowSeconds);
      }
      
      return current <= maxAttempts;
    } catch (error) {
      console.error('Error en rate limiting:', error);
      return true; // Permitir en caso de error
    }
  }

  /**
   * Cache para recomendaciones de productos
   */
  async cacheRecommendations(userId, recommendations, duration = 3600) { // 1 hora
    const key = `recommendations:${userId}`;
    return await this.set(key, recommendations, duration);
  }

  async getRecommendations(userId) {
    const key = `recommendations:${userId}`;
    return await this.get(key);
  }

  /**
   * Cache para búsquedas populares
   */
  async incrementSearchTerm(term) {
    if (!this.isConnected) return false;
    
    try {
      const key = 'popular_searches';
      await this.client.zIncrBy(key, 1, term.toLowerCase());
      return true;
    } catch (error) {
      console.error('Error incrementando término de búsqueda:', error);
      return false;
    }
  }

  async getPopularSearches(limit = 10) {
    if (!this.isConnected) return [];
    
    try {
      const key = 'popular_searches';
      return await this.client.zRevRange(key, 0, limit - 1, { BY: 'SCORE', REV: true });
    } catch (error) {
      console.error('Error obteniendo búsquedas populares:', error);
      return [];
    }
  }

  /**
   * Verifica el estado de la conexión
   */
  isHealthy() {
    return this.isConnected && this.client && this.client.isOpen;
  }
}

// Crear instancia singleton
const redisService = new RedisService();

module.exports = redisService;