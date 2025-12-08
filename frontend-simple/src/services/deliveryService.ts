import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export interface DeliveryCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface DeliveryOrderItem {
  id: string;
  productName: string;
  variantName?: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal?: number;
  tax?: number;
  shippingCost?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  shippingAddress: any;
  specialInstructions?: string;
  customer: DeliveryCustomer;
  items: DeliveryOrderItem[];
  tracking?: any[];
}

export interface Delivery {
  id: string;
  status: string;
  estimatedTime: string | null;
  actualTime: string | null;
  distance: number | null;
  currentLocation: {
    lat: number;
    lng: number;
  } | null;
  route?: any;
  notes: string | null;
  rating: number | null;
  feedback: string | null;
  createdAt: string;
  updatedAt?: string;
  order: DeliveryOrder;
}

export interface DeliveryStats {
  total: number;
  completed: number;
  pending: number;
  today: number;
  averageRating: number;
}

class DeliveryService {
  /**
   * Obtener entregas asignadas al repartidor
   */
  async getMyDeliveries(status?: string): Promise<Delivery[]> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const params = status ? { status } : {};
    const response = await axios.get(`${API_URL}/delivery/my-deliveries`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data.data;
  }

  /**
   * Obtener detalles de una entrega específica
   */
  async getDeliveryById(id: string): Promise<Delivery> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await axios.get(`${API_URL}/delivery/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }

  /**
   * Actualizar estado de la entrega
   */
  async updateDeliveryStatus(id: string, status: string, notes?: string): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await axios.put(
      `${API_URL}/delivery/${id}/status`,
      { status, notes },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.data;
  }

  /**
   * Actualizar ubicación del repartidor
   */
  async updateLocation(id: string, latitude: number, longitude: number, accuracy?: number): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await axios.put(
      `${API_URL}/delivery/${id}/location`,
      { latitude, longitude, accuracy },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.data;
  }

  /**
   * Completar entrega
   */
  async completeDelivery(id: string, notes?: string, photoUrl?: string): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await axios.post(
      `${API_URL}/delivery/${id}/complete`,
      { notes, photoUrl },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.data;
  }

  /**
   * Obtener estadísticas del repartidor
   */
  async getStats(): Promise<DeliveryStats> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No autenticado');
    }

    const response = await axios.get(`${API_URL}/delivery/stats/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }

  /**
   * Obtener el color del estado de delivery
   */
  getDeliveryStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'PENDING': 'bg-gray-100 text-gray-800',
      'ASSIGNED': 'bg-blue-100 text-blue-800',
      'PICKED_UP': 'bg-yellow-100 text-yellow-800',
      'IN_TRANSIT': 'bg-indigo-100 text-indigo-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtener texto del estado de delivery en español
   */
  getDeliveryStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'ASSIGNED': 'Asignada',
      'PICKED_UP': 'Recogida',
      'IN_TRANSIT': 'En Camino',
      'DELIVERED': 'Entregada',
      'FAILED': 'Fallida'
    };
    return textMap[status] || status;
  }

  /**
   * Calcular distancia entre dos puntos (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Formatear tiempo estimado
   */
  formatEstimatedTime(estimatedTime: string | null): string {
    if (!estimatedTime) return 'No disponible';
    
    const date = new Date(estimatedTime);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 0) return 'Estimado pasado';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}

export default new DeliveryService();
