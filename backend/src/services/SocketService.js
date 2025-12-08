class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.connectedDrivers = new Map(); // driverId -> socketId
  }

  /**
   * Inicializa el servicio Socket.IO
   */
  initialize(io) {
    this.io = io;
    console.log('SocketService inicializado');
  }

  /**
   * Maneja nuevas conexiones de socket
   */
  handleConnection(socket) {
    console.log(`Socket conectado: ${socket.id}`);

    // Autenticación del socket
    socket.on('authenticate', (data) => {
      this.authenticateSocket(socket, data);
    });

    // Eventos de ubicación para repartidores
    socket.on('driver_location_update', (data) => {
      this.handleDriverLocationUpdate(socket, data);
    });

    // Eventos de seguimiento de pedidos
    socket.on('track_order', (orderId) => {
      this.handleOrderTracking(socket, orderId);
    });

    // Eventos de chat
    socket.on('chat_message', (data) => {
      this.handleChatMessage(socket, data);
    });

    // Desconexión
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * Autentica un socket con JWT
   */
  authenticateSocket(socket, { token, role, userId }) {
    try {
      // Aquí validarías el JWT token
      // Por simplicidad, asumimos que es válido
      
      socket.userId = userId;
      socket.role = role;

      if (role === 'DRIVER') {
        this.connectedDrivers.set(userId, socket.id);
        socket.join(`driver_${userId}`);
        console.log(`Repartidor ${userId} conectado`);
      } else if (role === 'CUSTOMER') {
        this.connectedUsers.set(userId, socket.id);
        socket.join(`user_${userId}`);
        console.log(`Cliente ${userId} conectado`);
      }

      socket.emit('authenticated', { success: true, userId, role });
    } catch (error) {
      console.error('Error autenticando socket:', error);
      socket.emit('authentication_error', { message: 'Token inválido' });
    }
  }

  /**
   * Maneja actualizaciones de ubicación de repartidores
   */
  handleDriverLocationUpdate(socket, { latitude, longitude, accuracy }) {
    if (socket.role !== 'DRIVER') {
      return socket.emit('error', { message: 'No autorizado' });
    }

    const driverId = socket.userId;
    console.log(`Actualización ubicación repartidor ${driverId}:`, { latitude, longitude });

    // Emitir a clientes que están siguiendo pedidos de este repartidor
    this.io.emit('driver_location_updated', {
      driverId,
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString()
    });

    // También actualizar en base de datos (llamar servicio)
    this.updateDriverLocationInDB(driverId, latitude, longitude);
  }

  /**
   * Maneja seguimiento de pedidos
   */
  handleOrderTracking(socket, orderId) {
    console.log(`Cliente ${socket.userId} siguiendo pedido ${orderId}`);
    
    // Unir al cliente a la sala del pedido
    socket.join(`order_${orderId}`);
    
    // Emitir estado actual del pedido
    this.emitOrderStatus(orderId);
  }

  /**
   * Maneja mensajes de chat
   */
  handleChatMessage(socket, { message, orderId, recipientId }) {
    console.log(`Mensaje de chat de ${socket.userId}:`, message);

    const chatMessage = {
      from: socket.userId,
      message,
      timestamp: new Date().toISOString(),
      orderId: orderId || null
    };

    if (orderId) {
      // Mensaje relacionado con un pedido
      this.io.to(`order_${orderId}`).emit('chat_message', chatMessage);
    } else if (recipientId) {
      // Mensaje directo
      const recipientSocketId = this.connectedUsers.get(recipientId) || 
                               this.connectedDrivers.get(recipientId);
      
      if (recipientSocketId) {
        this.io.to(recipientSocketId).emit('chat_message', chatMessage);
      }
    }

    // Guardar mensaje en base de datos
    this.saveChatMessage(chatMessage);
  }

  /**
   * Maneja desconexiones
   */
  handleDisconnect(socket) {
    console.log(`Socket desconectado: ${socket.id}`);

    if (socket.userId) {
      if (socket.role === 'DRIVER') {
        this.connectedDrivers.delete(socket.userId);
        console.log(`Repartidor ${socket.userId} desconectado`);
      } else if (socket.role === 'CUSTOMER') {
        this.connectedUsers.delete(socket.userId);
        console.log(`Cliente ${socket.userId} desconectado`);
      }
    }
  }

  // ==================== MÉTODOS DE EMISIÓN ====================

  /**
   * Notifica actualización de estado de pedido
   */
  notifyOrderStatusUpdate(orderId, newStatus, additionalData = {}) {
    console.log(`Notificando cambio de estado pedido ${orderId}: ${newStatus}`);
    
    this.io.to(`order_${orderId}`).emit('order_status_updated', {
      orderId,
      status: newStatus,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }

  /**
   * Notifica nueva ruta asignada a repartidor
   */
  notifyDriverNewRoute(driverId, route) {
    const socketId = this.connectedDrivers.get(driverId);
    
    if (socketId) {
      this.io.to(socketId).emit('new_route_assigned', {
        route,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Notifica a cliente sobre repartidor en camino
   */
  notifyCustomerDriverEnRoute(userId, driverInfo, estimatedArrival) {
    const socketId = this.connectedUsers.get(userId);
    
    if (socketId) {
      this.io.to(socketId).emit('driver_en_route', {
        driver: driverInfo,
        estimatedArrival,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Notifica promoción especial a usuarios específicos
   */
  notifyPromotion(userIds, promotion) {
    userIds.forEach(userId => {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        this.io.to(socketId).emit('special_promotion', promotion);
      }
    });
  }

  /**
   * Broadcast a todos los usuarios conectados
   */
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Broadcast solo a repartidores
   */
  broadcastToDrivers(event, data) {
    this.connectedDrivers.forEach((socketId) => {
      this.io.to(socketId).emit(event, data);
    });
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Actualiza ubicación del repartidor en base de datos
   */
  async updateDriverLocationInDB(driverId, latitude, longitude) {
    try {
      // Aquí llamarías al servicio de base de datos
      // Por ejemplo: await DriverService.updateLocation(driverId, latitude, longitude);
      console.log(`Ubicación actualizada en BD para repartidor ${driverId}`);
    } catch (error) {
      console.error('Error actualizando ubicación en BD:', error);
    }
  }

  /**
   * Emite estado actual del pedido
   */
  async emitOrderStatus(orderId) {
    try {
      // Obtener estado actual del pedido de la base de datos
      // const order = await OrderService.getOrderWithStatus(orderId);
      // this.io.to(`order_${orderId}`).emit('order_current_status', order);
      console.log(`Emitiendo estado actual del pedido ${orderId}`);
    } catch (error) {
      console.error('Error obteniendo estado del pedido:', error);
    }
  }

  /**
   * Guarda mensaje de chat en base de datos
   */
  async saveChatMessage(message) {
    try {
      // Guardar en base de datos
      // await ChatService.saveMessage(message);
      console.log('Mensaje de chat guardado en BD');
    } catch (error) {
      console.error('Error guardando mensaje de chat:', error);
    }
  }

  // ==================== MÉTODOS DE UTILIDAD ====================

  /**
   * Obtiene usuarios conectados
   */
  getConnectedUsers() {
    return {
      customers: Array.from(this.connectedUsers.keys()),
      drivers: Array.from(this.connectedDrivers.keys()),
      total: this.connectedUsers.size + this.connectedDrivers.size
    };
  }

  /**
   * Verifica si un usuario está conectado
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId) || this.connectedDrivers.has(userId);
  }

  /**
   * Desconecta un usuario específico
   */
  disconnectUser(userId) {
    const customerSocketId = this.connectedUsers.get(userId);
    const driverSocketId = this.connectedDrivers.get(userId);
    
    if (customerSocketId) {
      this.io.sockets.sockets.get(customerSocketId)?.disconnect();
    }
    
    if (driverSocketId) {
      this.io.sockets.sockets.get(driverSocketId)?.disconnect();
    }
  }
}

// Crear instancia singleton
const socketService = new SocketService();

module.exports = socketService;