import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

export interface DriverLocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  timestamp: string;
  deliveryStatus?: string;
  notes?: string;
}

export interface ChatMessage {
  from: string;
  message: string;
  timestamp: string;
  orderId?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  /**
   * Conectar al servidor Socket.IO
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('Socket ya conectado');
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO conectado:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO desconectado');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión Socket.IO:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Máximo de intentos de reconexión alcanzado');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO reconectado después de', attemptNumber, 'intentos');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });
  }

  /**
   * Desconectar del servidor Socket.IO
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Autenticar el socket con token JWT
   */
  authenticate(token: string, role: string, userId: string): void {
    if (!this.socket) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.emit('authenticate', { token, role, userId });

    this.socket.once('authenticated', (data) => {
      console.log('Socket autenticado:', data);
    });

    this.socket.once('authentication_error', (error) => {
      console.error('Error de autenticación:', error);
    });
  }

  /**
   * Seguir un pedido específico
   */
  trackOrder(orderId: string): void {
    if (!this.socket) {
      console.error('Socket no conectado');
      return;
    }

    console.log('Siguiendo pedido:', orderId);
    this.socket.emit('track_order', orderId);
  }

  /**
   * Dejar de seguir un pedido
   */
  untrackOrder(orderId: string): void {
    if (!this.socket) {
      return;
    }

    this.socket.emit('leave', `order_${orderId}`);
  }

  /**
   * Actualizar ubicación del repartidor
   */
  updateDriverLocation(latitude: number, longitude: number, accuracy?: number): void {
    if (!this.socket) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.emit('driver_location_update', {
      latitude,
      longitude,
      accuracy
    });
  }

  /**
   * Enviar mensaje de chat
   */
  sendChatMessage(message: string, orderId?: string, recipientId?: string): void {
    if (!this.socket) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.emit('chat_message', {
      message,
      orderId,
      recipientId
    });
  }

  /**
   * Escuchar actualizaciones de ubicación del repartidor
   */
  onDriverLocationUpdate(callback: (data: DriverLocationUpdate) => void): void {
    if (!this.socket) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.on('driver_location_updated', callback);
  }

  /**
   * Escuchar actualizaciones de estado del pedido
   */
  onOrderStatusUpdate(callback: (data: OrderStatusUpdate) => void): void {
    if (!this.socket) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.on('order_status_updated', callback);
  }

  /**
   * Escuchar mensajes de chat
   */
  onChatMessage(callback: (data: ChatMessage) => void): void {
    if (!this.socket) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.on('chat_message', callback);
  }

  /**
   * Escuchar cuando el repartidor está en camino
   */
  onDriverEnRoute(callback: (data: any) => void): void {
    if (!this.socket) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.on('driver_en_route', callback);
  }

  /**
   * Escuchar estado actual del pedido
   */
  onOrderCurrentStatus(callback: (data: any) => void): void {
    if (!this.socket) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.on('order_current_status', callback);
  }

  /**
   * Remover todos los listeners
   */
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  /**
   * Remover listener específico
   */
  removeListener(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  /**
   * Verificar si está conectado
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Obtener el socket instance (para casos avanzados)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Exportar instancia singleton
export default new SocketService();
