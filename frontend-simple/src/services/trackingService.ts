import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export interface TrackingLocation {
  lat: number;
  lng: number;
}

export interface TrackingDriver {
  id: string;
  name: string;
  phone: string;
}

export interface TrackingDelivery {
  id: string;
  status: string;
  driver: TrackingDriver;
  estimatedTime: string | null;
  currentLocation: TrackingLocation | null;
  distance: number | null;
  notes?: string;
}

export interface TrackingEvent {
  id: string;
  orderId: string;
  status: string;
  message: string;
  metadata: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productName: string;
  variantName?: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

export interface TrackingOrder {
  id: string;
  orderNumber: string;
  status: string;
  progress: number;
  createdAt: string;
  total: number;
  shippingAddress: any;
  estimatedDeliveryTime: string | null;
  items: OrderItem[];
}

export interface TrackingData {
  order: TrackingOrder;
  tracking: TrackingEvent[];
  delivery: TrackingDelivery | null;
  customer?: {
    name: string;
    phone: string;
  };
}

export interface MyOrder {
  id: string;
  orderNumber: string;
  status: string;
  progress: number;
  createdAt: string;
  total: number;
  itemCount: number;
  latestTracking: TrackingEvent | null;
  delivery: {
    id: string;
    status: string;
    estimatedTime: string | null;
    currentLat: number | null;
    currentLng: number | null;
  } | null;
  items: OrderItem[];
}

class TrackingService {
  /**
   * Obtener información de tracking por ID de pedido
   */
  async getOrderTracking(orderId: string): Promise<TrackingData> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/tracking/order/${orderId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data.data;
  }

  /**
   * Obtener tracking por número de pedido (sin autenticación)
   */
  async getTrackingByOrderNumber(orderNumber: string): Promise<TrackingData> {
    const response = await axios.get(`${API_URL}/tracking/order-by-number/${orderNumber}`);
    return response.data.data;
  }

  /**
   * Obtener mis pedidos con tracking (requiere autenticación)
   */
  async getMyOrders(): Promise<MyOrder[]> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await axios.get(`${API_URL}/tracking/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }

  /**
   * Agregar evento de tracking (solo admin)
   */
  async addTrackingEvent(data: {
    orderId: string;
    status: string;
    message?: string;
    metadata?: any;
  }): Promise<TrackingEvent> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await axios.post(`${API_URL}/tracking/add-event`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }

  /**
   * Actualizar ubicación del repartidor
   */
  async updateDriverLocation(data: {
    deliveryId: string;
    latitude: number;
    longitude: number;
  }): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No autenticado');
    }

    await axios.put(`${API_URL}/tracking/update-location`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /**
   * Calcular el progreso visual del pedido
   */
  getStatusProgress(status: string): number {
    const progressMap: { [key: string]: number } = {
      'PENDING': 10,
      'CONFIRMED': 25,
      'PREPARING': 40,
      'READY': 60,
      'IN_TRANSIT': 80,
      'DELIVERED': 100,
      'CANCELLED': 0
    };
    return progressMap[status] || 0;
  }

  /**
   * Obtener el color del estado
   */
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'PENDING': 'text-yellow-600',
      'CONFIRMED': 'text-blue-600',
      'PREPARING': 'text-orange-600',
      'READY': 'text-purple-600',
      'IN_TRANSIT': 'text-indigo-600',
      'DELIVERED': 'text-green-600',
      'CANCELLED': 'text-red-600'
    };
    return colorMap[status] || 'text-gray-600';
  }

  /**
   * Obtener el texto en español del estado
   */
  getStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'CONFIRMED': 'Confirmado',
      'PREPARING': 'Preparando',
      'READY': 'Listo',
      'IN_TRANSIT': 'En Camino',
      'DELIVERED': 'Entregado',
      'CANCELLED': 'Cancelado'
    };
    return textMap[status] || status;
  }

  /**
   * Obtener el icono del estado
   */
  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'PENDING': '⏳',
      'CONFIRMED': '✓',
      'PREPARING': '👨‍🍳',
      'READY': '📦',
      'IN_TRANSIT': '🚗',
      'DELIVERED': '✅',
      'CANCELLED': '❌'
    };
    return iconMap[status] || '📋';
  }
}

export default new TrackingService();
